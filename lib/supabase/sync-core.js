const MAX_SYNC_BYTES = 250_000;
const MAX_COLLECTION_ITEMS = 500;
const MAX_ATTEMPTS = 30;

const objectCollections = new Set([
  "reviewRecords",
  "mistakes",
  "notes",
  "questionStats",
  "practiceSessions",
  "lessonStates",
  "bookNotes",
  "contentFlags",
]);
const valueCollections = new Set(["studyStats", "profilePreferences", "diagnosticResult", "currentLessonState", "continueState"]);
const arrayCollections = new Set(["savedSentences", "studyLaterIds", "examAttempts", "customEntries"]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(error) {
  return { ok: false, error };
}

export function mergeSyncSnapshots(current, incoming) {
  const currentData = isRecord(current?.data) ? current.data : {};
  const incomingData = isRecord(incoming?.data) ? incoming.data : {};
  const data = { ...currentData };
  for (const [key, value] of Object.entries(incomingData)) {
    if (objectCollections.has(key) && isRecord(value)) data[key] = { ...(isRecord(data[key]) ? data[key] : {}), ...value };
    else if (arrayCollections.has(key) && Array.isArray(value)) {
      const existing = Array.isArray(data[key]) ? data[key] : [];
      data[key] = [...new Set([...existing, ...value].map((entry) => JSON.stringify(entry)))].map((entry) => JSON.parse(entry));
    } else if (valueCollections.has(key) && isRecord(value)) data[key] = value;
  }
  return { version: 1, data };
}

export function parseSyncPayload(body) {
  if (!isRecord(body) || body.version !== 1 || !isRecord(body.data)) return fail("Sync payload must contain version 1 data.");

  const data = {};
  for (const [key, value] of Object.entries(body.data)) {
    if (objectCollections.has(key)) {
      if (!isRecord(value)) return fail(`${key} must be an object.`);
      if (Object.keys(value).length > MAX_COLLECTION_ITEMS) return fail(`too many ${key} records.`);
      data[key] = value;
    } else if (valueCollections.has(key)) {
      if (!isRecord(value)) return fail(`${key} must be an object.`);
      data[key] = value;
    } else if (arrayCollections.has(key)) {
      if (!Array.isArray(value)) return fail(`${key} must be an array.`);
      if (value.length > (key === "examAttempts" ? MAX_ATTEMPTS : MAX_COLLECTION_ITEMS)) return fail(`too many ${key} records.`);
      data[key] = value;
    }
  }

  const payload = { version: 1, data };
  if (new TextEncoder().encode(JSON.stringify(payload)).length > MAX_SYNC_BYTES) return fail("Sync payload is too large.");
  return { ok: true, value: payload };
}

export { MAX_COLLECTION_ITEMS, MAX_SYNC_BYTES };
