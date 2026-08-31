export const EXTERNAL_SOURCE_PROGRESS_STORAGE_KEY = "michi.external-source-progress";

export function readExternalSourceProgress() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(EXTERNAL_SOURCE_PROGRESS_STORAGE_KEY) ?? "{}");
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function markExternalSourceOpened(sourceId) {
  if (typeof window === "undefined" || !sourceId) return false;
  const progress = readExternalSourceProgress();
  progress[sourceId] = true;
  window.localStorage.setItem(EXTERNAL_SOURCE_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event("michi-source-progress-updated"));
  return true;
}
