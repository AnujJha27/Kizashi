const punctuation = /[\s、。！？・：「」『』（）()［］【】,.!?\-]/gu;

function textOf(item, field) {
  return typeof item?.[field] === "string" ? item[field] : "";
}

export function qualityTemplate(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[0-9０-９]+/gu, "#")
    .replace(punctuation, "")
    .toLocaleLowerCase();
}

function bigrams(value) {
  const result = new Set();
  for (let index = 0; index < value.length - 1; index += 1) result.add(value.slice(index, index + 2));
  return result;
}

function similarity(left, right) {
  const a = bigrams(left);
  const b = bigrams(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  a.forEach((value) => { if (b.has(value)) intersection += 1; });
  return intersection / (a.size + b.size - intersection);
}

function clusters(items, field) {
  const signatures = items.map((item) => qualityTemplate(textOf(item, field)));
  const parent = items.map((_, index) => index);
  const find = (index) => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const join = (left, right) => {
    const a = find(left);
    const b = find(right);
    if (a !== b) parent[b] = a;
  };

  // ponytail: O(n²) is enough for the small authored assessment banks; index by shingles if this grows past a few thousand items.
  for (let left = 0; left < signatures.length; left += 1) {
    for (let right = left + 1; right < signatures.length; right += 1) {
      const a = signatures[left];
      const b = signatures[right];
      const lengthRatio = Math.min(a.length, b.length) / Math.max(a.length, b.length || 1);
      if (a === b || (lengthRatio >= 0.8 && similarity(a, b) >= 0.86)) join(left, right);
    }
  }
  const grouped = new Map();
  items.forEach((item, index) => {
    const root = find(index);
    grouped.set(root, [...(grouped.get(root) ?? []), item.id]);
  });
  return [...grouped.values()].filter((group) => group.length > 1);
}

function byLevel(items, callback) {
  return Object.fromEntries(["N5", "N4"].map((level) => [level, callback(items.filter((item) => item.jlptLevel === level))]));
}

function questionFamilies(items) {
  const result = {};
  items.flatMap((item) => item.questions ?? []).forEach((question) => {
    const family = question.questionType || "untyped";
    result[family] = (result[family] ?? 0) + 1;
  });
  return result;
}

function report(items, field) {
  const exactTemplates = new Set(items.map((item) => qualityTemplate(textOf(item, field))));
  const nearDuplicateClusters = clusters(items, field);
  return {
    total: items.length,
    uniqueTemplates: exactTemplates.size,
    nearDuplicateClusters,
    nearDuplicateCount: nearDuplicateClusters.reduce((total, group) => total + group.length, 0),
    questionFamilies: questionFamilies(items),
    sourceTypes: Object.fromEntries([...new Set(items.map((item) => item.sourceType).filter(Boolean))].map((sourceType) => [sourceType, items.filter((item) => item.sourceType === sourceType).length])),
    byLevel: byLevel(items, (levelItems) => {
      const levelClusters = clusters(levelItems, field);
      return { total: levelItems.length, uniqueTemplates: new Set(levelItems.map((item) => qualityTemplate(textOf(item, field)))).size, nearDuplicateClusters: levelClusters, questionFamilies: questionFamilies(levelItems) };
    }),
  };
}

/** @param {{ readings?: any[], listening?: any[] }} content */
export function buildContentQualityReport(content = {}) {
  const readings = Array.isArray(content.readings) ? content.readings : [];
  const listening = Array.isArray(content.listening) ? content.listening : [];
  return {
    reading: report(readings, "passage"),
    listening: report(listening, "transcript"),
  };
}
