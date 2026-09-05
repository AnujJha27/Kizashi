const categories = ["vocabulary", "kanji", "grammar", "readings", "listening"];

export function repairModuleProvenance(value, fallback) {
  const sourceManifest = [...new Map([...(fallback.sourceManifest ?? []), ...(value.sourceManifest ?? [])].map((source) => [source.id, source])).values()];
  const knownSources = new Set(sourceManifest.map((source) => source.id));
  const fallbackItems = new Map(categories.flatMap((category) => fallback[category] ?? []).map((item) => [item.id, item]));
  let repaired = 0;
  const repair = (items) => items.map((item) => {
    const sourceIds = Array.isArray(item.sourceIds) ? item.sourceIds : [];
    const validSourceIds = sourceIds.filter((sourceId) => knownSources.has(sourceId));
    if (validSourceIds.length === sourceIds.length) return item;
    const fallbackIds = (fallbackItems.get(item.id)?.sourceIds ?? []).filter((sourceId) => knownSources.has(sourceId));
    if (!fallbackIds.length) return item;
    repaired += 1;
    return { ...item, sourceIds: [...new Set([...validSourceIds, ...fallbackIds])] };
  });
  return {
    module: { ...value, sourceManifest, ...Object.fromEntries(categories.map((category) => [category, repair(value[category] ?? [])])) },
    repaired,
  };
}
