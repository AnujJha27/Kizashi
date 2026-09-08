export const EXTERNAL_SOURCE_PROGRESS_STORAGE_KEY = "michi.external-source-progress";
export const EXTERNAL_SOURCE_STATES = Object.freeze(["unopened", "opened", "started", "completed"]);

const stateRank = { unopened: 0, opened: 1, started: 2, completed: 3 };

function normalizeState(value) {
  if (value === true) return "opened";
  return EXTERNAL_SOURCE_STATES.includes(value) ? value : null;
}

export function readExternalSourceProgress() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(EXTERNAL_SOURCE_PROGRESS_STORAGE_KEY) ?? "{}");
    if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).flatMap(([sourceId, state]) => {
      const normalized = normalizeState(state);
      return normalized ? [[sourceId, normalized]] : [];
    }));
  } catch {
    return {};
  }
}

export function markExternalSourceState(sourceId, state) {
  if (typeof window === "undefined" || !sourceId) return false;
  if (!EXTERNAL_SOURCE_STATES.includes(state)) return false;
  try {
    const progress = readExternalSourceProgress();
    const current = normalizeState(progress[sourceId]) ?? "unopened";
    progress[sourceId] = stateRank[state] >= stateRank[current] ? state : current;
    window.localStorage.setItem(EXTERNAL_SOURCE_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event("michi-source-progress-updated"));
    return true;
  } catch {
    return false;
  }
}

export function markExternalSourceOpened(sourceId) {
  return markExternalSourceState(sourceId, "opened");
}

export function markExternalSourceStarted(sourceId) {
  return markExternalSourceState(sourceId, "started");
}

export function markExternalSourceCompleted(sourceId) {
  return markExternalSourceState(sourceId, "completed");
}
