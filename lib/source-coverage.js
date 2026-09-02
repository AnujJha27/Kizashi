function itemIds(items, categories) {
  return new Set(items.filter((item) => categories.includes(item.category)).map((item) => item.id));
}

function mappingCoverage(items, mappings) {
  const total = items.filter((item) => item.category === "grammar").length;
  const ids = new Set(items.filter((item) => item.category === "grammar").map((item) => item.id));
  const covered = Object.keys(mappings ?? {}).filter((id) => ids.has(id)).length;
  return { covered, total };
}

export function getExternalSourceCoverage({ items = [], taeKimMappings = {}, wikibooksMappings = {}, irodoriGrammarMappings = {}, irodoriResources = [], tadokuEntries = [], aozoraEnabled = false } = {}) {
  const vocabularyIds = itemIds(items, ["vocabulary"]);
  const practicalIds = itemIds(items, ["vocabulary", "kanji", "grammar"]);
  const irodoriIds = new Set(items.filter((item) => practicalIds.has(item.id) && item.sourceIds?.includes("irodori")).map((item) => item.id));
  for (const resource of irodoriResources) {
    for (const id of resource.targetItemIds ?? []) if (practicalIds.has(id)) irodoriIds.add(id);
  }

  return {
    grammar: { taeKim: mappingCoverage(items, taeKimMappings), wikibooks: mappingCoverage(items, wikibooksMappings), irodori: mappingCoverage(items, irodoriGrammarMappings) },
    vocabulary: { commons: { covered: null, total: vocabularyIds.size, status: "on-demand" } },
    irodori: { covered: irodoriIds.size, total: practicalIds.size },
    reading: { tadoku: tadokuEntries.length, aozora: Boolean(aozoraEnabled) },
  };
}
