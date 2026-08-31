function normalized(value) {
  return typeof value === "string" ? value.normalize("NFKC").trim().toLocaleLowerCase() : "";
}

function itemText(item = {}) {
  return [item.id, item.slug, item.title, item.pattern, item.subcategory, ...(Array.isArray(item.tags) ? item.tags : [])].map(normalized).filter(Boolean).join(" ");
}

function validAggregate(record) {
  return record && typeof record === "object" && !Array.isArray(record) && normalized(record.pattern) && normalized(record.category) && Number.isInteger(record.count) && record.count >= 0;
}

export function getIjasDifficultySignal(item = {}, aggregates = []) {
  const candidates = Array.isArray(aggregates) ? aggregates.filter(validAggregate) : [];
  const haystack = itemText(item);
  const matches = candidates.filter((record) => haystack.includes(normalized(record.pattern)));
  if (!matches.length) return { count: 0, category: null, sourceReferences: [], matches: [] };
  const strongest = [...matches].sort((left, right) => right.count - left.count || normalized(left.category).localeCompare(normalized(right.category)))[0];
  return {
    count: matches.reduce((sum, record) => sum + record.count, 0),
    category: strongest.category,
    sourceReferences: [...new Set(matches.map((record) => record.sourceReference).filter((value) => typeof value === "string" && value.trim()))],
    matches,
  };
}

export function ijasBoostForQuestion(question = {}, items = new Map(), aggregates = []) {
  const item = items instanceof Map ? items.get(question.itemId) : items?.[question.itemId];
  const signal = getIjasDifficultySignal(item, aggregates);
  return signal.count ? Math.min(12, Math.log1p(signal.count) * 3) : 0;
}

export function getIjasWarning(item, mistake, aggregates = []) {
  const count = Number(mistake?.count ?? 0);
  const signal = getIjasDifficultySignal(item, aggregates);
  if (!count || !signal.count) return null;
  return {
    label: "COMMON LEARNER TRAP",
    category: signal.category,
    message: `You have made this mistake ${count} time${count === 1 ? "" : "s"}. An approved I-JAS aggregate flags this pattern as a learner-difficulty signal; use the linked explanation as the teaching authority.`,
    sourceReferences: signal.sourceReferences,
  };
}
