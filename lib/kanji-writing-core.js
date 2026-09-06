const KANJIVG_BASE_URL = "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji";
const writingStateOrder = ["not-introduced", "watched", "traced", "written-with-support", "written-from-memory"];

function singleCharacter(value) {
  const characters = [...String(value ?? "")];
  return characters.length === 1 ? characters[0] : null;
}

export function getKanjiVgCodePoint(character) {
  const value = singleCharacter(character);
  if (!value) return null;
  return value.codePointAt(0).toString(16).padStart(5, "0");
}

export function getKanjiVgUrl(character) {
  const codePoint = getKanjiVgCodePoint(character);
  return codePoint ? `${KANJIVG_BASE_URL}/${codePoint}.svg` : null;
}

export function getJishoKanjiUrl(character) {
  const value = singleCharacter(character);
  return value ? `https://jisho.org/search/${encodeURIComponent(value)}%20%23kanji` : null;
}

export function getTanoshiiKanjiUrl(character) {
  const value = singleCharacter(character);
  return value ? `https://www.tanoshiijapanese.com/dictionary/kanji_details.cfm?character=${encodeURIComponent(value)}` : null;
}

export function normalizeStrokeData(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const character = singleCharacter(value.character);
  const strokes = Array.isArray(value.strokes) ? value.strokes : [];
  if (!character || !strokes.length) return null;
  const normalized = strokes.map((stroke, index) => ({ order: stroke?.order, path: stroke?.path })).filter((stroke) => Number.isInteger(stroke.order) && typeof stroke.path === "string" && stroke.path.trim());
  if (normalized.length !== strokes.length || normalized.some((stroke, index) => stroke.order !== index + 1) || new Set(normalized.map((stroke) => stroke.order)).size !== normalized.length) return null;
  return { character, strokes: normalized };
}

export function evaluateStrokeOrder(expected, actual) {
  return expected === actual ? { ok: true, message: "Good" } : { ok: false, message: `This should be stroke ${expected}` };
}

export function advanceWritingState(current, next) {
  return writingStateOrder[Math.max(writingStateOrder.indexOf(current), writingStateOrder.indexOf(next))] ?? "not-introduced";
}
