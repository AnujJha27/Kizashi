import { getErinLessonSources } from "./external-resources-runtime.js";

export { getErinLessonSources };

function itemMap(items) {
  return items instanceof Map ? items : new Map((Array.isArray(items) ? items : []).map((item) => [item.id, item]));
}

function coverage(ids, category, items, knownIds) {
  const relevant = ids.map((id) => items.get(id)).filter((item) => item?.category === category);
  return relevant.length ? relevant.filter((item) => knownIds.has(item.id)).length / relevant.length : 0;
}

function sourceFor(item) {
  const source = item.audio?.provenance?.source;
  if (typeof source === "string" && source.trim()) return source;
  return item.sourceType === "recorded" ? "recorded" : item.sourceType === "imported" ? "external" : "kizashi-original";
}

export function getListeningClipMetadata(item, items = new Map(), knownIds = new Set()) {
  const map = itemMap(items);
  const ids = Array.isArray(item?.prerequisiteIds) ? item.prerequisiteIds : [];
  return {
    source: sourceFor(item),
    level: item.jlptLevel ?? "N5",
    naturalness: item.sourceType === "recorded" || item.sourceType === "imported" ? "natural" : "controlled",
    context: item.situation,
    vocabularyCoverage: coverage(ids, "vocabulary", map, knownIds),
    grammarCoverage: coverage(ids, "grammar", map, knownIds),
    transcriptAvailable: Boolean(item.transcript?.trim()),
    translationAvailable: Boolean(item.translation?.trim()),
    ...(Number.isFinite(item.durationSeconds) ? { durationSeconds: item.durationSeconds } : {}),
    skills: [...new Set((item.questions ?? []).map((question) => question.questionType).filter((value) => typeof value === "string" && value.trim()))],
  };
}

function orderFor(items, mode, knownIds, { mistakes = {}, sourceProgress = {}, targetSkill = "", coverageBand = [0.8, 0.95] } = {}) {
  return [...items].sort((left, right) => {
    const leftCoverage = left.prerequisiteIds?.filter((id) => knownIds.has(id)).length ?? 0;
    const rightCoverage = right.prerequisiteIds?.filter((id) => knownIds.has(id)).length ?? 0;
    const leftTotal = Math.max(left.prerequisiteIds?.length ?? 0, 1);
    const rightTotal = Math.max(right.prerequisiteIds?.length ?? 0, 1);
    const leftCoverageRatio = leftCoverage / leftTotal;
    const rightCoverageRatio = rightCoverage / rightTotal;
    const leftNatural = left.sourceType === "recorded" || left.sourceType === "imported";
    const rightNatural = right.sourceType === "recorded" || right.sourceType === "imported";
    const weakness = (item) => (item.prerequisiteIds ?? []).reduce((total, id) => total + Number(mistakes[id]?.count ?? 0), 0) + (targetSkill && item.questions?.some((question) => question.questionType === targetSkill) ? 2 : 0);
    const leftWeakness = weakness(left);
    const rightWeakness = weakness(right);
    const leftOpened = sourceProgress[left.id] ? 1 : 0;
    const rightOpened = sourceProgress[right.id] ? 1 : 0;
    const inBand = (value) => value >= Number(coverageBand[0] ?? 0.8) && value <= Number(coverageBand[1] ?? 0.95);
    const leftBand = Number(inBand(leftCoverageRatio));
    const rightBand = Number(inBand(rightCoverageRatio));
    const bandDistance = (value) => inBand(value) ? 0 : Math.min(Math.abs(value - Number(coverageBand[0] ?? 0.8)), Math.abs(value - Number(coverageBand[1] ?? 0.95)));
    const score = mode === "guided"
      ? rightWeakness - leftWeakness || rightBand - leftBand || bandDistance(leftCoverageRatio) - bandDistance(rightCoverageRatio) || Number(leftNatural) - Number(rightNatural) || (left.difficulty ?? 3) - (right.difficulty ?? 3) || leftOpened - rightOpened
      : mode === "immersion"
        ? Number(rightNatural) - Number(leftNatural) || rightWeakness - leftWeakness || rightBand - leftBand || bandDistance(leftCoverageRatio) - bandDistance(rightCoverageRatio) || (right.difficulty ?? 3) - (left.difficulty ?? 3) || leftOpened - rightOpened
        : (left.difficulty ?? 3) - (right.difficulty ?? 3);
    return score || String(left.id).localeCompare(String(right.id));
  });
}

export function selectImmersionClips(items = [], mode = "guided", knownIds = new Set(), limit = 3, options = {}) {
  const seen = new Set();
  return orderFor(items.filter((item) => item?.category === "listening" || item?.transcript), mode, knownIds, options).filter((item) => { if (seen.has(item.id)) return false; seen.add(item.id); return true; }).slice(0, Math.max(0, limit));
}

export function getImmersionReason(item, knownIds = new Set(), mistakes = {}) {
  const ids = item?.prerequisiteIds ?? [];
  const coverage = ids.length ? Math.round((ids.filter((id) => knownIds.has(id)).length / ids.length) * 100) : null;
  const weak = ids.some((id) => Number(mistakes[id]?.count ?? 0) > 0);
  return `${coverage === null ? "New context" : `${coverage}% familiar`}${weak ? " · weak concept boost" : ""}`;
}

export function getEarWarmup(items = [], knownIds = new Set()) {
  const ordered = orderFor(items.filter((item) => item?.category === "listening" || item?.transcript), "guided", knownIds);
  if (ordered.length <= 3) return ordered;
  const first = ordered[0];
  const harder = ordered.find((item) => item.difficulty > first.difficulty) ?? ordered[1];
  const last = [...ordered].sort((left, right) => (right.difficulty ?? 3) - (left.difficulty ?? 3) || String(right.id).localeCompare(String(left.id)))[0];
  return [...new Set([first, harder, last])].slice(0, 3);
}
