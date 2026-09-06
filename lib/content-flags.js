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
