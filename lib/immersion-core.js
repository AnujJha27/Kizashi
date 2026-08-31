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

const erinLessonSources = [
  { id: "erin-01", name: "Erin's Challenge", title: "First-meeting greetings · classroom", description: "Open the Japan Foundation lesson page; its scripts and media stay on the original site.", url: "https://www.erin.jpf.go.jp/en/lesson/01/basic/" },
  { id: "erin-02", name: "Erin's Challenge", title: "Making requests · school", description: "Open the Japan Foundation lesson page; its scripts and media stay on the original site.", url: "https://www.erin.jpf.go.jp/en/lesson/02/basic/" },
  { id: "erin-03", name: "Erin's Challenge", title: "Indicating things · home", description: "Open the Japan Foundation lesson page; its scripts and media stay on the original site.", url: "https://www.erin.jpf.go.jp/en/lesson/03/basic/" },
  { id: "erin-04", name: "Erin's Challenge", title: "Asking locations · convenience store", description: "Open the Japan Foundation lesson page; its scripts and media stay on the original site.", url: "https://www.erin.jpf.go.jp/en/lesson/04/basic/" },
  { id: "erin-06", name: "Erin's Challenge", title: "Asking prices · bus", description: "Open the Japan Foundation lesson page; its scripts and media stay on the original site.", url: "https://www.erin.jpf.go.jp/en/lesson/06/basic/" },
  { id: "erin-08", name: "Erin's Challenge", title: "Ordering · fast food", description: "Open the Japan Foundation lesson page; its scripts and media stay on the original site.", url: "https://www.erin.jpf.go.jp/en/lesson/08/basic/" },
];

export function getErinLessonSources() {
  return erinLessonSources.map((source) => ({ ...source }));
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

function orderFor(items, mode, knownIds) {
  return [...items].sort((left, right) => {
    const leftCoverage = left.prerequisiteIds?.filter((id) => knownIds.has(id)).length ?? 0;
    const rightCoverage = right.prerequisiteIds?.filter((id) => knownIds.has(id)).length ?? 0;
    const leftNatural = left.sourceType === "recorded" || left.sourceType === "imported";
    const rightNatural = right.sourceType === "recorded" || right.sourceType === "imported";
    const score = mode === "guided"
      ? (left.difficulty ?? 3) - (right.difficulty ?? 3) || rightCoverage - leftCoverage
      : mode === "immersion"
        ? Number(rightNatural) - Number(leftNatural) || (right.difficulty ?? 3) - (left.difficulty ?? 3)
        : (left.difficulty ?? 3) - (right.difficulty ?? 3);
    return score || String(left.id).localeCompare(String(right.id));
  });
}

export function selectImmersionClips(items = [], mode = "guided", knownIds = new Set(), limit = 3) {
  return orderFor(items.filter((item) => item?.category === "listening" || item?.transcript), mode, knownIds).slice(0, Math.max(0, limit));
}

export function getEarWarmup(items = [], knownIds = new Set()) {
  const ordered = orderFor(items.filter((item) => item?.category === "listening" || item?.transcript), "guided", knownIds);
  if (ordered.length <= 3) return ordered;
  const first = ordered[0];
  const harder = ordered.find((item) => item.difficulty > first.difficulty) ?? ordered[1];
  const last = [...ordered].sort((left, right) => (right.difficulty ?? 3) - (left.difficulty ?? 3) || String(right.id).localeCompare(String(left.id)))[0];
  return [...new Set([first, harder, last])].slice(0, 3);
}
