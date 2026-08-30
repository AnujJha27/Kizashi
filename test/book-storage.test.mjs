import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { getBookStoragePartPath, getBookStoragePartPaths, getBookStoragePath } from "../lib/supabase/book-storage-core.js";

const execFileAsync = promisify(execFile);

test("book storage paths stay inside the private books prefix", () => {
  assert.equal(getBookStoragePath({ id: "genki-i", storagePath: "books/genki-i.pdf" }), "books/genki-i.pdf");
  assert.equal(getBookStoragePath({ id: "goukaku-dekiru" }), "books/goukaku-dekiru.pdf");
  assert.equal(getBookStoragePath({ id: "../secrets", storagePath: "../secrets.pdf" }), null);
  assert.equal(getBookStoragePartPath({ id: "genki-i" }, 2), "books/genki-i/part-002.pdf");
  assert.equal(getBookStoragePartPath({ id: "genki-i" }, -1), null);
});

test("lists ordered private parts for browser-side assembly", () => {
  assert.deepEqual(
    getBookStoragePartPaths({ id: "genki-i", storagePartCount: 3 }),
    ["books/genki-i/part-000.pdf", "books/genki-i/part-001.pdf", "books/genki-i/part-002.pdf"],
  );
  assert.deepEqual(getBookStoragePartPaths({ id: "single-book" }), ["books/single-book.pdf"]);
});

test("book splitter emits ordered chunks and a manifest", async () => {
  const root = await mkdtemp(path.join("/tmp", "kizashi-book-"));
  try {
    const input = path.join(root, "source.pdf");
    const output = path.join(root, "parts");
    const original = Buffer.from("0123456789abcdefghij");
    await writeFile(input, original);
    await execFileAsync("python3", ["scripts/split_books_for_storage.py", "--input", input, "--book-id", "test-book", "--output-dir", output, "--part-size-mb", "0.00001"]);
    const manifest = JSON.parse(await readFile(path.join(output, "books-manifest.json"), "utf8"));
    assert.equal(manifest.books[0].partCount, 2);
    const first = await readFile(path.join(output, "books/test-book/part-000.pdf"));
    const second = await readFile(path.join(output, "books/test-book/part-001.pdf"));
    assert.deepEqual(Buffer.concat([first, second]), original);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
