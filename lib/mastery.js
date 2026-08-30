const KANA_START = 0x30a1;
const HIRAGANA_START = 0x3041;

function katakanaToHiragana(value) {
  return [...value]
    .map((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint >= KANA_START && codePoint <= 0x30f6
        ? String.fromCodePoint(codePoint - KANA_START + HIRAGANA_START)
        : character;
    })
    .join("");
}

export function toHiragana(value) {
  return katakanaToHiragana(String(value).normalize("NFKC"));
}

export function normalizeAnswer(value) {
  return toHiragana(value).replace(/\s+/gu, "").toLocaleLowerCase();
}

export function reviewRatingForConfidence(correct, confidence) {
  if (!correct) return "again";
  if (confidence === "guess") return "hard";
  if (confidence === "confident") return "easy";
  return "good";
}

export function applyReview(progress, result) {
  const score = result === "correct" ? Math.min(progress.score + 1, 5) : Math.max(progress.score - 1, 0);
  const state = score >= 4 ? "mastered" : score >= 2 ? "stable" : score > 0 ? "learning" : "unseen";
  const intervalDays = result === "correct" ? [0, 1, 3, 7, 14, 30][score] : 1;
  return { state, score, intervalDays };
}

export function buildReviewQueue(items, now = new Date(), limit = 10) {
  const timestamp = now.getTime();
  return [...items]
    .sort((left, right) => {
      const leftDue = Date.parse(left.dueAt) <= timestamp;
      const rightDue = Date.parse(right.dueAt) <= timestamp;
      if (leftDue !== rightDue) return leftDue ? -1 : 1;
      if (left.score !== right.score) return left.score - right.score;
      return Date.parse(left.dueAt) - Date.parse(right.dueAt);
    })
    .slice(0, Math.max(0, limit));
}

export function recordMistake(mistakes, mistake) {
  const key = `${mistake.itemId}:${mistake.category}:${normalizeAnswer(mistake.answer)}`;
  const existing = mistakes.find((entry) => entry.key === key);
  if (!existing) {
    return [{ ...mistake, key, count: 1, recurring: false }, ...mistakes];
  }

  return mistakes.map((entry) =>
    entry.key === key ? { ...entry, count: entry.count + 1, recurring: true } : entry,
  );
}

export function resumeSession(session) {
  return {
    ...session,
    itemIds: [...session.itemIds],
    position: Math.max(0, Math.min(session.position, Math.max(0, session.itemIds.length - 1))),
  };
}
