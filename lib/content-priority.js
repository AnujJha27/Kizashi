import { getConversationPriority, getSpokenFrequencySignal, spokenSignalLabel } from "./spoken-intelligence.js";

const bandWeight = { core: 30, extended: 20, bridge: 10 };

function listLength(value) {
  return Array.isArray(value) ? value.filter(Boolean).length : 0;
}

function missingFields(item) {
  const fields = item.category === "vocabulary"
    ? ["reading", "meanings", "partOfSpeech", "exampleSentences", "collocations", "classification"]
    : item.category === "kanji"
      ? ["meanings", "usefulWords", "classification"]
      : item.category === "grammar"
        ? ["meaning", "formation", "intuition", "usageConditions", "examples", "commonMistakes", "classification"]
        : item.category === "reading"
          ? ["passage", "translation", "vocabularyIds", "grammarIds", "questions"]
          : ["situation", "transcript", "questions", "sourceType"];
  return fields.filter((field) => {
    const value = item[field];
    return Array.isArray(value) ? listLength(value) === 0 : typeof value !== "string" || !value.trim();
  });
}

function itemBand(item) {
  return item.classification?.band ?? (item.jlptLevel === "N5" ? item.difficulty <= 2 ? "core" : "extended" : "bridge");
}

export function getItemPriority(item, records = {}, mistakes = {}) {
  const record = records[item.id];
  const mistake = mistakes[item.id];
  const missing = missingFields(item);
  const attempts = Number(record?.attempts ?? 0);
  const accuracy = attempts ? Number(record.correct ?? 0) / attempts : 1;
  const weakness = Number(mistake?.count ?? 0) * 25 + (attempts >= 2 && accuracy < 0.75 ? 35 : 0);
  const writtenFrequency = Number.isFinite(Number(item.frequency)) && Number(item.frequency) > 0 ? Math.log10(Number(item.frequency) + 1) * 3 : 0;
  const spokenFrequency = getConversationPriority(item);
  const frequency = Math.min(20, writtenFrequency + spokenFrequency + Math.max(0, Math.min(5, Number(item.commonness ?? 0))));
  const confidence = item.classification?.confidence === "high" ? 8 : item.classification?.confidence === "medium" ? 4 : 0;
  const prerequisiteValue = Math.max(0, Number(item.dependentCount ?? item.prerequisiteValue ?? 0)) * 5;
  const score = bandWeight[itemBand(item)] + missing.length * 15 + weakness + frequency + confidence + prerequisiteValue + (item.reviewStatus === "pending" || item.tags?.includes("source-review") ? 20 : 0);
  const spoken = getSpokenFrequencySignal(item);
  const reason = weakness ? `Learner weakness · ${mistake?.count ?? 0} misses / ${Math.round(accuracy * 100)}% accuracy` : missing.length ? `Needs enrichment · ${missing.join(", ")}` : spoken.value !== null ? `${itemBand(item)} · ${spokenSignalLabel(item)}` : frequency ? `${itemBand(item)} · frequent beginner item` : `${itemBand(item)} curriculum candidate`;
  return { score, reason, spokenSignal: spoken };
}

export function rankContentCandidates(items, records = {}, mistakes = {}, limit = 50) {
  const dependents = new Map();
  items.forEach((item) => (item.prerequisiteIds ?? []).forEach((id) => dependents.set(id, (dependents.get(id) ?? 0) + 1)));
  return items
    .filter((item) => item.reviewStatus !== "rejected" && !item.tags?.includes("rejected"))
    .map((item) => ({ ...item, dependentCount: dependents.get(item.id) ?? 0, ...getItemPriority({ ...item, dependentCount: dependents.get(item.id) ?? 0 }, records, mistakes) }))
    .sort((left, right) => right.score - left.score || String(left.id).localeCompare(String(right.id)))
    .slice(0, Math.max(0, limit));
}
