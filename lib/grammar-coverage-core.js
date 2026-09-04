const TARGET_LEVELS = ["N5", "N4"];

export function normalizeGrammarPattern(value) {
  return String(value ?? "").normalize("NFKC").trim().replace(/[\s【】「」『』()（）\[\]{}]/gu, "").toLocaleLowerCase();
}

function sourceLevel(value) {
  if (value === "Starter" || value === "Elementary 1") return "N5";
  if (value === "Elementary 2" || value === "Pre-Intermediate") return "N4";
  return TARGET_LEVELS.includes(value) ? value : null;
}

function recordsFor(source) {
  return (source.records ?? []).filter((record) => normalizeGrammarPattern(record.pattern));
}

function referencesFor(source) {
  return (source.references ?? []).filter((reference) => reference.canonicalId);
}

function summaryFor(level) {
  return { rawPatterns: 0, canonicalConcepts: 0, complete: 0, partial: 0, missing: 0, unresolved: 0, levelDisagreements: 0 };
}

/** @param {{canonical?: any[], sources?: any[]}} input */
export function buildGrammarCoverageReport({ canonical = [], sources = [] } = {}) {
  const canonicalItems = canonical.filter((item) => item.id && normalizeGrammarPattern(item.pattern));
  const canonicalByPattern = new Map(canonicalItems.map((item) => [normalizeGrammarPattern(item.pattern), item]));
  const sourceRecords = sources.flatMap((source) => recordsFor(source).map((record) => ({ ...record, sourceId: source.id })));
  const references = sources.flatMap((source) => referencesFor(source).map((reference) => ({ ...reference, sourceId: source.id })));
  const evidenceByCanonical = new Map(canonicalItems.map((item) => [item.id, []]));
  const matchedRecordIds = new Set();
  const aliases = new Set();

  sourceRecords.forEach((record) => {
    const item = canonicalByPattern.get(normalizeGrammarPattern(record.pattern));
    if (!item) return;
    matchedRecordIds.add(`${record.sourceId}:${record.id}`);
    evidenceByCanonical.get(item.id).push({ sourceId: record.sourceId, recordId: record.id, pattern: record.pattern, level: sourceLevel(record.level ?? record.sourceLevel) });
    if (record.pattern !== item.pattern) aliases.add(`${record.sourceId}:${record.id}`);
  });
  references.forEach((reference) => {
    if (!evidenceByCanonical.has(reference.canonicalId)) return;
    evidenceByCanonical.get(reference.canonicalId).push({ sourceId: reference.sourceId, recordId: reference.recordId, pattern: reference.pattern, level: sourceLevel(reference.level ?? reference.sourceLevel) });
    if (reference.recordId) matchedRecordIds.add(`${reference.sourceId}:${reference.recordId}`);
  });

  const canonicalReport = canonicalItems.map((item) => {
    const evidence = evidenceByCanonical.get(item.id);
    const externalSources = [...new Set(evidence.map((entry) => entry.sourceId))];
    const disagreements = [...new Set(evidence.map((entry) => entry.level).filter((level) => level && level !== item.jlptLevel))].sort();
    return {
      id: item.id,
      pattern: item.pattern,
      level: item.jlptLevel,
      sourceIds: externalSources,
      evidenceCount: evidence.length,
      evidencePatterns: evidence.filter((entry) => entry.pattern).map(({ sourceId, recordId, pattern, level }) => ({ sourceId, recordId, pattern, level })),
      status: externalSources.length >= 2 ? "complete" : externalSources.length ? "partial" : "missing",
      levelDisagreements: disagreements,
    };
  });
  const unresolved = sourceRecords.filter((record) => !matchedRecordIds.has(`${record.sourceId}:${record.id}`)).map((record) => ({ sourceId: record.sourceId, recordId: record.id, pattern: record.pattern, level: sourceLevel(record.level ?? record.sourceLevel) ?? record.level ?? record.sourceLevel ?? null }));
  const allPatternLevels = new Map();
  canonicalItems.forEach((item) => allPatternLevels.set(`${item.jlptLevel}:${normalizeGrammarPattern(item.pattern)}`, true));
  sourceRecords.forEach((record) => { const level = sourceLevel(record.level ?? record.sourceLevel); if (level) allPatternLevels.set(`${level}:${normalizeGrammarPattern(record.pattern)}`, true); });
  const summary = Object.fromEntries(TARGET_LEVELS.map((level) => {
    const items = canonicalReport.filter((item) => item.level === level);
    const disagreements = items.filter((item) => item.levelDisagreements.length).length;
    return [level, { ...summaryFor(level), rawPatterns: [...allPatternLevels.keys()].filter((key) => key.startsWith(`${level}:`)).length, canonicalConcepts: items.length, complete: items.filter((item) => item.status === "complete").length, partial: items.filter((item) => item.status === "partial").length, missing: items.filter((item) => item.status === "missing").length, unresolved: unresolved.filter((item) => item.level === level).length, levelDisagreements: disagreements }];
  }));
  const patternGroups = new Map();
  sourceRecords.forEach((record) => { const normalized = normalizeGrammarPattern(record.pattern); patternGroups.set(normalized, (patternGroups.get(normalized) ?? 0) + 1); });
  return {
    generatedAt: "2026-09-04",
    summary,
    canonical: canonicalReport,
    unresolved,
    aliasesMapped: aliases.size,
    duplicateFamiliesCollapsed: [...patternGroups.values()].filter((count) => count > 1).length,
  };
}
