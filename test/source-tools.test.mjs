import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function runToTemp(script, input, outputName, extra = []) {
  const directory = await mkdtemp(path.join(tmpdir(), "kizashi-source-test-"));
  const output = path.join(directory, outputName);
  try {
    await execFileAsync("python3", [script, "--input", input, "--output", output, ...extra]);
    return JSON.parse(await readFile(output, "utf8"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("Sudachi staging keeps morphology records review-only with provenance", async () => {
  const packageData = await runToTemp("scripts/ingest_sudachi.py", "test/fixtures/sudachi.tsv", "sudachi.json");
  assert.equal(packageData.status, "staged");
  assert.equal(packageData.stats.morphology, 2);
  assert.equal(packageData.records.morphology[0].reviewStatus, "pending");
  assert.deepEqual(packageData.records.morphology[0].sourceRecord, { surface: "学生", lemma: "学生", reading: "がくせい", partOfSpeech: "noun" });
  assert.equal(packageData.sourceManifest[0].id, "sudachi-dictionary");
});

test("book content extraction preserves chapter/page facts as pending records", async () => {
  const packageData = await runToTemp("scripts/extract_book_content.py", "test/fixtures/book-content.txt", "book-content.json", ["--book-id", "fixture-book"]);
  assert.equal(packageData.status, "staged");
  assert.deepEqual(packageData.stats, { vocabulary: 1, kanji: 1, grammar: 1, reading: 0, listening: 0 });
  const records = Object.values(packageData.records).flat();
  assert.ok(records.every((record) => record.reviewStatus === "pending"));
  assert.deepEqual(records.map((record) => record.sourceRecord), [
    { bookId: "fixture-book", chapter: "1", page: 12, extractedFactType: "vocabulary", rawText: "学生\tがくせい\tstudent" },
    { bookId: "fixture-book", chapter: "1", page: 12, extractedFactType: "kanji", rawText: "学\tstudy" },
    { bookId: "fixture-book", chapter: "1", page: 13, extractedFactType: "grammar", rawText: "です\tpolite copula" },
  ]);
});
