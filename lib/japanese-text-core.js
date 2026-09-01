function isKanji(value) {
  return /[\u3400-\u9fff]/u.test(value);
}

function normalizedEntries(entries) {
  const grouped = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    const text = Array.isArray(entry) ? entry[0] : entry?.text;
    const reading = Array.isArray(entry) ? entry[1] : entry?.reading;
    const itemId = Array.isArray(entry) ? entry[2] : entry?.itemId;
    if (typeof text !== "string" || !text || typeof reading !== "string" || !reading) continue;
    const current = grouped.get(text) ?? [];
    if (!current.some((value) => value.reading === reading && value.itemId === itemId)) current.push({ text, reading, itemId });
    grouped.set(text, current);
  }
  return [...grouped.values()].sort((left, right) => right[0].text.length - left[0].text.length);
}

function mergeSegments(segments) {
  return segments.reduce((result, segment) => {
    const previous = result.at(-1);
    if (previous && previous.status === segment.status && previous.reading === segment.reading && previous.itemId === segment.itemId) previous.text += segment.text;
    else result.push({ ...segment });
    return result;
  }, []);
}

export function segmentJapaneseText(text, entries = []) {
  const value = String(text ?? "");
  const candidates = normalizedEntries(entries);
  const segments = [];
  let position = 0;
  while (position < value.length) {
    const match = candidates.find((group) => value.startsWith(group[0].text, position));
    if (match) {
      const readings = [...new Set(match.map((entry) => entry.reading))];
      if (readings.length === 1) segments.push({ text: match[0].text, status: "resolved", reading: readings[0], itemId: match[0].itemId });
      else segments.push({ text: match[0].text, status: "unresolved", reading: undefined, itemId: undefined });
      position += match[0].text.length;
      continue;
    }
    const character = [...value.slice(position)][0];
    segments.push({ text: character, status: isKanji(character) ? "unresolved" : "not-applicable", reading: undefined, itemId: undefined });
    position += character.length;
  }
  return mergeSegments(segments);
}
