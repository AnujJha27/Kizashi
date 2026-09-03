const SAFE_BOOK_PATH = /^books\/[a-z0-9][a-z0-9_-]*\.pdf$/;
export const BOOK_STORAGE_PART_BYTES = 45 * 1024 * 1024;

export function getBookStoragePath(book) {
  const path = book.storagePath ?? `books/${book.id}.pdf`;
  return SAFE_BOOK_PATH.test(path) && !path.includes("..") ? path : null;
}

export function getBookStoragePartPath(book, partIndex) {
  const path = getBookStoragePath(book);
  if (!path || !Number.isInteger(partIndex) || partIndex < 0) return null;
  return path.replace(/\.pdf$/u, `/part-${String(partIndex).padStart(3, "0")}.pdf`);
}

export function getBookStoragePartPaths(book) {
  if (!Number.isInteger(book.storagePartCount) || book.storagePartCount < 1) {
    const path = getBookStoragePath(book);
    return path ? [path] : [];
  }
  const paths = Array.from({ length: book.storagePartCount }, (_, index) => getBookStoragePartPath(book, index));
  return paths.every(Boolean) ? paths : [];
}

export function getBookStoragePathSets(book) {
  const primary = getBookStoragePartPaths(book);
  const single = getBookStoragePath(book);
  const legacyPath = single?.startsWith("books/") ? single.slice("books/".length) : null;
  const legacyBook = legacyPath ? { ...book, storagePath: `books/${legacyPath}` } : null;
  const legacyParts = legacyBook ? getBookStoragePartPaths(legacyBook).map((path) => path?.slice("books/".length) ?? null).filter(Boolean) : [];
  const legacySingle = legacyPath ? [legacyPath] : [];
  return [primary, single ? [single] : [], legacyParts, legacySingle].filter((paths, index, all) => paths.length && all.findIndex((candidate) => candidate.join("\0") === paths.join("\0")) === index);
}
