export const CONTENT_FLAGS_STORAGE_KEY = "michi.content-flags";

export const CONTENT_FLAG_REASONS = ["meaning wrong", "reading wrong", "unnatural", "bad level", "duplicate", "bad question", "ambiguous", "source mismatch", "other"];

export function readContentFlags() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(CONTENT_FLAGS_STORAGE_KEY) ?? "{}");
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function toggleContentFlag(itemId) {
  if (typeof window === "undefined" || !itemId) return false;
  const flags = readContentFlags();
  const flagged = !flags[itemId];
  if (flagged) flags[itemId] = { itemId, status: "flagged", flaggedAt: Date.now(), flagReason: "other", origin: "library" };
  else delete flags[itemId];
  window.localStorage.setItem(CONTENT_FLAGS_STORAGE_KEY, JSON.stringify(flags));
  window.dispatchEvent(new Event("michi-content-flagged-updated"));
  return flagged;
}

export function readContentReview(itemId) {
  const record = readContentFlags()[itemId];
  if (!record || typeof record !== "object") return null;
  return { ...record, status: record.status === "reviewed" ? "reviewed" : "flagged" };
}

export function setContentReview(itemId, status, origin, flagReason) {
  if (typeof window === "undefined" || !itemId || !["reviewed", "flagged"].includes(status)) return null;
  const flags = readContentFlags();
  const now = Date.now();
  flags[itemId] = status === "reviewed"
    ? { itemId, status, reviewedAt: now, origin }
    : { itemId, status, flaggedAt: now, flagReason: CONTENT_FLAG_REASONS.includes(flagReason) ? flagReason : "other", origin };
  window.localStorage.setItem(CONTENT_FLAGS_STORAGE_KEY, JSON.stringify(flags));
  window.dispatchEvent(new Event("michi-content-flagged-updated"));
  return flags[itemId];
}

export function setContentCorrection(itemId, category, value, origin) {
  if (typeof window === "undefined" || !itemId || !["vocabulary", "kanji", "grammar"].includes(category)) return null;
  const correction = String(value ?? "").trim().slice(0, 500);
  if (!correction) return null;
  const flags = readContentFlags();
  const previous = flags[itemId] && typeof flags[itemId] === "object" && !Array.isArray(flags[itemId]) ? flags[itemId] : {};
  const edits = previous.edits && typeof previous.edits === "object" && !Array.isArray(previous.edits) ? previous.edits : {};
  const nextEdits = category === "grammar" ? { ...edits, intuition: correction } : { ...edits, meanings: [correction] };
  flags[itemId] = { ...previous, itemId, status: "reviewed", reviewedAt: Date.now(), origin, edits: nextEdits };
  window.localStorage.setItem(CONTENT_FLAGS_STORAGE_KEY, JSON.stringify(flags));
  window.dispatchEvent(new Event("michi-content-flagged-updated"));
  return flags[itemId];
}

export function applyContentCorrections(module) {
  if (typeof window === "undefined") return module;
  const flags = readContentFlags();
  const correct = (items) => items.map((item) => {
    const edits = flags[item.id]?.edits;
    if (!edits || typeof edits !== "object" || Array.isArray(edits)) return item;
    const next = { ...item };
    if (item.category === "grammar" && typeof edits.intuition === "string") next.intuition = edits.intuition;
    if ((item.category === "vocabulary" || item.category === "kanji") && Array.isArray(edits.meanings) && edits.meanings.every((meaning) => typeof meaning === "string" && meaning.trim())) next.meanings = edits.meanings;
    return next;
  });
  return { ...module, vocabulary: correct(module.vocabulary), kanji: correct(module.kanji), grammar: correct(module.grammar) };
}
