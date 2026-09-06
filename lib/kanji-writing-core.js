const KANJIVG_BASE_URL = "https://raw.githubusercontent.com/KanjiVG/kanjivg/r20260714/kanji";
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

export function getStrokeStartPoint(path) {
  const match = /^\s*M\s*(-?\d*\.?\d+)[,\s]+(-?\d*\.?\d+)/i.exec(String(path ?? ""));
  return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
}

export function getStrokeQuizOptions(strokes, targetIndex, limit = 4) {
  if (!Array.isArray(strokes) || !Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= strokes.length) return [];
  const size = Math.min(Math.max(Number.isInteger(limit) ? limit : 4, 1), strokes.length);
  const start = Math.min(Math.floor(targetIndex / size) * size, strokes.length - size);
  return strokes.slice(start, start + size).map((stroke, index) => ({ order: stroke.order, path: stroke.path, correct: start + index === targetIndex }));
}

export function getComponentQuizOptions(groups, targetPosition = "left", limit = 4) {
  if (!Array.isArray(groups)) return [];
  const valid = groups.filter((group) => group && typeof group.element === "string" && group.element.trim() && typeof group.position === "string" && group.position.trim());
  const target = valid.find((group) => group.position === targetPosition);
  if (!target || valid.length < 2) return [];
  return [target, ...valid.filter((group) => group !== target)].slice(0, Math.max(Number.isInteger(limit) ? limit : 4, 1)).map((group) => ({ element: group.element, position: group.position, correct: group === target }));
}

export function getWordWritingCharacters(word, availableCharacters) {
  const characters = [...String(word ?? "")];
  const available = new Set(Array.isArray(availableCharacters) ? availableCharacters : []);
  return characters.length > 1 && characters.every((character) => available.has(character)) ? characters : [];
}

export function prioritizeKanjiWritingItems(items, signals = {}) {
  if (!Array.isArray(items)) return [];
  const lessonIds = new Set(Array.isArray(signals.lessonItemIds) ? signals.lessonItemIds : []);
  const reviewRecords = signals.reviewRecords && typeof signals.reviewRecords === "object" ? signals.reviewRecords : {};
  const mistakes = signals.mistakes && typeof signals.mistakes === "object" ? signals.mistakes : {};
  const writingProgress = signals.writingProgress && typeof signals.writingProgress === "object" ? signals.writingProgress : {};
  const now = typeof signals.now === "number" ? signals.now : Date.now();
  return items.map((item, index) => {
    const review = reviewRecords[item?.id] ?? {};
    const mistake = mistakes[item?.id] ?? {};
    const writing = writingProgress[item?.id];
    const notWritten = !writing || writing.state === "not-introduced";
    const due = Boolean(reviewRecords[item?.id] && typeof review.dueAt === "number" && review.dueAt <= now);
    const recentlyLearned = typeof review.lastReviewedAt === "number" && review.lastReviewedAt > now - 14 * 24 * 60 * 60 * 1000;
    const weak = ["unseen", "introduced", "learning"].includes(review.masteryState);
    const score = (item?.id === signals.initialItemId ? 100000 : 0) + (Number(mistake.count) || 0) * 50 + (due ? 35 : 0) + (lessonIds.has(item?.id) ? 25 : 0) + (notWritten ? 20 : 0) + (weak ? 10 : 0) + (recentlyLearned ? 8 : 0);
    return { item, index, score };
  }).sort((left, right) => right.score - left.score || left.index - right.index).map(({ item }) => item);
}

export function matchesKanjiNotebookFilter(item, filter, signals = {}) {
  if (!item || item.category !== "kanji") return false;
  const review = signals.reviewRecords?.[item.id] ?? {};
  const mistake = signals.mistakes?.[item.id] ?? {};
  const writing = signals.writingProgress?.[item.id];
  const state = writing?.state;
  const now = typeof signals.now === "number" ? signals.now : Date.now();
  const due = typeof review.dueAt === "number" && review.dueAt <= now;
  const weak = ["unseen", "introduced", "learning"].includes(review.masteryState) || (Number(mistake.count) || 0) > 0;
  const recentlyLearned = typeof review.lastReviewedAt === "number" && review.lastReviewedAt > now - 14 * 24 * 60 * 60 * 1000;
  if (filter === "current") return new Set(Array.isArray(signals.lessonItemIds) ? signals.lessonItemIds : []).has(item.id);
  if (filter === "writing-due") return due || state === "traced" || state === "written-with-support";
  if (filter === "weak") return weak;
  if (filter === "recently-learned") return recentlyLearned;
  if (filter === "not-written") return state !== "written-from-memory";
  return true;
}

export function normalizeStrokeData(value, expectedCharacter) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const character = singleCharacter(value.character);
  const expected = expectedCharacter === undefined ? null : singleCharacter(expectedCharacter);
  const strokes = Array.isArray(value.strokes) ? value.strokes : [];
  if (!character || (expectedCharacter !== undefined && (!expected || character !== expected)) || !strokes.length) return null;
  const normalized = strokes.map((stroke, index) => ({ order: stroke?.order, path: stroke?.path })).filter((stroke) => Number.isInteger(stroke.order) && typeof stroke.path === "string" && stroke.path.trim());
  if (normalized.length !== strokes.length || normalized.some((stroke, index) => stroke.order !== index + 1) || new Set(normalized.map((stroke) => stroke.order)).size !== normalized.length) return null;
  const componentGroups = Array.isArray(value.componentGroups)
    ? value.componentGroups.filter((group) => group && typeof group === "object" && typeof group.element === "string" && Array.isArray(group.strokeOrders) && group.strokeOrders.every((order) => Number.isInteger(order)))
    : [];
  return { character, strokes: normalized, ...(componentGroups.length ? { componentGroups } : {}) };
}

export function evaluateStrokeOrder(expected, actual) {
  return expected === actual ? { ok: true, message: "Good" } : { ok: false, message: `This should be stroke ${expected}` };
}

export function advanceWritingState(current, next) {
  return writingStateOrder[Math.max(writingStateOrder.indexOf(current), writingStateOrder.indexOf(next))] ?? "not-introduced";
}
