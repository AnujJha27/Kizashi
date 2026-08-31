export const CONTENT_FLAGS_STORAGE_KEY = "michi.content-flags";

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
  if (flagged) flags[itemId] = { itemId, flaggedAt: Date.now() };
  else delete flags[itemId];
  window.localStorage.setItem(CONTENT_FLAGS_STORAGE_KEY, JSON.stringify(flags));
  window.dispatchEvent(new Event("michi-content-flagged-updated"));
  return flagged;
}
