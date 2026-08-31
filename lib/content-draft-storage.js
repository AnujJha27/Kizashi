export const CONTENT_DRAFT_STORAGE_KEY = "michi.content-draft";
export const LARGE_DRAFT_THRESHOLD = 4_000_000;

const DATABASE_NAME = "kizashi-content-drafts";
const STORE_NAME = "drafts";
const CURRENT_KEY = "current";

export function draftStorageMode(raw) {
  return typeof raw === "string" && raw.length > LARGE_DRAFT_THRESHOLD ? "indexedDB" : "localStorage";
}

function canUseIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open content draft storage."));
  });
}

async function readIndexedDraft() {
  if (!canUseIndexedDb()) return null;
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(CURRENT_KEY);
    request.onsuccess = () => {
      database.close();
      resolve(typeof request.result === "string" ? request.result : null);
    };
    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error("Could not read content draft storage."));
    };
  });
}

async function writeIndexedDraft(raw) {
  if (!canUseIndexedDb()) throw new Error("IndexedDB is unavailable on this device.");
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(raw, CURRENT_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not save content draft storage."));
    };
  });
}

async function clearIndexedDraft() {
  if (!canUseIndexedDb()) return;
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(CURRENT_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not clear content draft storage."));
    };
  });
}

export async function readContentDraft() {
  if (typeof window === "undefined") return null;
  try {
    const indexedDraft = await readIndexedDraft();
    if (indexedDraft) return indexedDraft;
  } catch {
    // Fall through to the small localStorage path.
  }
  try {
    return window.localStorage.getItem(CONTENT_DRAFT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function writeContentDraft(raw) {
  if (typeof window === "undefined") throw new Error("Content drafts require a browser.");
  if (draftStorageMode(raw) === "indexedDB") {
    await writeIndexedDraft(raw);
    try {
      window.localStorage.removeItem(CONTENT_DRAFT_STORAGE_KEY);
    } catch {
      // The IndexedDB copy is authoritative for large drafts.
    }
    return "indexedDB";
  }
  window.localStorage.setItem(CONTENT_DRAFT_STORAGE_KEY, raw);
  await clearIndexedDraft();
  return "localStorage";
}

export async function removeContentDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CONTENT_DRAFT_STORAGE_KEY);
  await clearIndexedDraft();
}
