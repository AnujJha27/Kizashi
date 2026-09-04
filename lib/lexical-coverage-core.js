const KATAKANA_TO_HIRAGANA = Object.freeze(Object.fromEntries(Array.from({ length: 86 }, (_, index) => [String.fromCodePoint(0x30a1 + index), String.fromCodePoint(0x3041 + index)])));

function text(value) {
  return typeof value === "string" ? value.normalize("NFKC").trim() : "";
}

function hiragana(value) {
  return [...text(value)].map((character) => KATAKANA_TO_HIRAGANA[character] ?? character).join("");
}

function surface(value) {
  return hiragana(value).replace(/[\s　]/gu, "");
}

function validLevel(value) {
  return value === "N5" || value === "N4" ? value : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function vocabularyKey(writtenForm, reading = "") {
  const written = surface(writtenForm);
  return written || surface(reading);
}

export function kanjiKey(character) {
  const value = text(character);
  return [...value].length === 1 ? value : "";
}

function status(released, staged) {
  if (released) return "covered";
  if (staged) return "partial";
  return "missing";
}

function levelOf(record) {
  return validLevel(record.level) ?? validLevel(record.jlptLevel) ?? validLevel(record.classification?.level);
}

function sourceIdsOf(record) {
  return unique([record.sourceId, ...(Array.isArray(record.sourceIds) ? record.sourceIds : [])]).filter((sourceId) => sourceId !== "michi-curated-n5-seed");
}

function buildRecords({ kind, sourceRecords, released, staged }) {
  const groups = new Map();
  const keyOf = kind === "vocabulary" ? (record) => vocabularyKey(record.writtenForm ?? record.word, record.reading) : (record) => kanjiKey(record.character);
  const add = (record, origin) => {
    const key = keyOf(record);
    if (!key) return;
    const level = levelOf(record);
    const entry = groups.get(key) ?? { key, kind, levels: new Set(), sourceClaims: [], releasedLevels: new Set(), stagedLevels: new Set(), surfaceForms: new Set(), readings: new Set(), usefulWordCount: 0 };
    if (level) entry.levels.add(level);
    sourceIdsOf(record).forEach((sourceId) => entry.sourceClaims.push({ sourceId, level, origin }));
    if (origin === "released" && level) entry.releasedLevels.add(level);
    if (origin === "staged" && level) entry.stagedLevels.add(level);
    if (kind === "vocabulary") {
      const written = text(record.writtenForm ?? record.word);
      const reading = text(record.reading);
      if (written) entry.surfaceForms.add(written);
      if (reading) entry.readings.add(reading);
    } else {
      entry.surfaceForms.add(text(record.character));
      entry.usefulWordCount = Math.max(entry.usefulWordCount, Array.isArray(record.usefulWords) ? record.usefulWords.length : 0);
    }
    groups.set(key, entry);
  };
  sourceRecords.forEach(({ record, origin }) => add(record, origin));
  released.forEach((record) => add(record, "released"));
  staged.forEach((record) => add(record, "staged"));

  return [...groups.values()].flatMap((entry) => {
    const levels = [...entry.levels].sort();
    return levels.map((level) => {
      const claims = entry.sourceClaims.filter((claim) => !claim.level || claim.level === level);
      const externalSourceIds = unique(claims.map((claim) => claim.sourceId).filter((sourceId) => !["kizashi-released", "kizashi-staged"].includes(sourceId)));
      const releasedForLevel = entry.releasedLevels.has(level);
      const stagedForLevel = entry.stagedLevels.has(level);
      return {
        id: `${kind}-${level.toLowerCase()}-${entry.key.replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-|-$/gu, "")}`,
        key: entry.key,
        level,
        coverageStatus: status(releasedForLevel, stagedForLevel),
        teachingStatus: releasedForLevel ? "released" : stagedForLevel ? "staged" : "source-only",
        sourceCount: externalSourceIds.length,
        sourceIds: externalSourceIds,
        sourceClaims: claims,
        surfaceForms: [...entry.surfaceForms],
        readings: [...entry.readings],
        ambiguous: entry.surfaceForms.size > 1 || entry.readings.size > 1,
        levelDisagreement: entry.levels.size > 1,
        usefulWordCount: entry.usefulWordCount,
      };
    });
  });
}

function summary(records) {
  return Object.fromEntries(["N5", "N4"].map((level) => {
    const rows = records.filter((record) => record.level === level);
    return [level, {
      total: rows.length,
      covered: rows.filter((record) => record.coverageStatus === "covered").length,
      partial: rows.filter((record) => record.coverageStatus === "partial").length,
      missing: rows.filter((record) => record.coverageStatus === "missing").length,
      multiSource: rows.filter((record) => record.sourceCount >= 2).length,
      ambiguous: rows.filter((record) => record.ambiguous).length,
      levelDisagreements: rows.filter((record) => record.levelDisagreement).length,
      usefulWords2Plus: rows.filter((record) => record.usefulWordCount >= 2).length,
      usefulWords3Plus: rows.filter((record) => record.usefulWordCount >= 3).length,
    }];
  }));
}

/** @param {{ vocabulary?: any[], kanji?: any[], releasedVocabulary?: any[], releasedKanji?: any[], stagedVocabulary?: any[], stagedKanji?: any[], sourceVocabulary?: Array<{ record: any, origin?: string }>, sourceKanji?: Array<{ record: any, origin?: string }> }} input */
export function buildLexicalCoverageReport(input = {}) {
  const vocabulary = buildRecords({ kind: "vocabulary", sourceRecords: input.sourceVocabulary ?? [], released: input.releasedVocabulary ?? input.vocabulary ?? [], staged: input.stagedVocabulary ?? [] });
  const kanji = buildRecords({ kind: "kanji", sourceRecords: input.sourceKanji ?? [], released: input.releasedKanji ?? input.kanji ?? [], staged: input.stagedKanji ?? [] });
  return {
    generatedAt: "2026-09-04",
    vocabulary: { summary: summary(vocabulary), records: vocabulary },
    kanji: { summary: summary(kanji), records: kanji },
  };
}
