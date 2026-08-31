import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

test("source merge preserves conflicting JLPT votes instead of hiding them", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "kizashi-merge-test-"));
  try {
    const base = path.join(directory, "base.json");
    const staged = path.join(directory, "openjlpt.json");
    const extra = path.join(directory, "prep-source.json");
    const output = path.join(directory, "merged.json");
    const item = { id: "vocab-eki", slug: "eki", title: "駅", jlptLevel: "N5", category: "vocabulary", subcategory: "places", difficulty: 1, prerequisiteIds: [], tags: ["places"], sourceIds: [], writtenForm: "駅", reading: "えき", meanings: ["station"], partOfSpeech: "noun", exampleSentences: [{ japanese: "駅です。", translation: "It is a station." }], collocations: ["駅に行く"], relatedWords: [], antonyms: [] };
    const classification = (level, sourceId) => ({ itemType: "vocabulary", itemId: "vocab-eki", level, band: level === "N5" ? "core" : "bridge", confidence: "low", evidenceSources: [sourceId], inclusionReason: "Source classification for review.", reviewedAt: "2026-08-31" });
    await writeFile(base, JSON.stringify({ course: { id: "course", chapters: [] }, vocabulary: [item], kanji: [], grammar: [], readings: [], listening: [], sourceManifest: [] }));
    await writeFile(staged, JSON.stringify({ sources: [{ id: "openjlpt", name: "OpenJLPT", type: "curriculum" }], records: { vocabulary: [{ ...item, sourceIds: ["openjlpt"], classification: classification("N5", "openjlpt") }], kanji: [], grammar: [] } }));
    await writeFile(extra, JSON.stringify({ sources: [{ id: "prep-source", name: "Prep source", type: "curriculum" }], records: { vocabulary: [{ ...item, sourceIds: ["prep-source"], classification: classification("N4", "prep-source") }], kanji: [], grammar: [] } }));
    await execFileAsync("python3", ["scripts/merge_openjlpt_staging.py", "--base", base, "--staged", staged, "--extra", extra, "--output", output]);
    const merged = JSON.parse(await readFile(output, "utf8"));
    const result = merged.vocabulary.find((entry) => entry.id === "vocab-eki").classification;
    assert.equal(result.level, "N5");
    assert.equal(result.conflict, true);
    assert.equal(result.confidence, "low");
    assert.deepEqual(result.sourceLevels, { openjlpt: "N5", "prep-source": "N4" });
    assert.deepEqual(result.conflictingLevels, ["N4"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CEJC ingestion emits aggregate frequency records without corpus rows", async () => {
  const packageData = await runToTemp("scripts/ingest_cejc_frequency.py", "test/fixtures/cejc-frequency.tsv", "cejc.json", ["--version", "2024.03"]);
  assert.equal(packageData.status, "staged");
  assert.equal(packageData.stats.rows, 3);
  assert.equal(packageData.stats.records, 2);
  assert.deepEqual(packageData.records.vocabulary[0], {
    writtenForm: "駅",
    spokenFrequency: 5,
    spokenFrequencyMetadata: {
      corpus: "CEJC",
      version: "2024.03",
      unit: "UniDic:orthBase",
      pmw: 3.75,
      rowCount: 2,
      aggregation: "sum of CEJC frequency and pmw across source strata",
    },
    sourceIds: ["cejc-frequency"],
    fieldSourceIds: { spokenFrequency: ["cejc-frequency"], spokenFrequencyMetadata: ["cejc-frequency"] },
    reviewStatus: "pending",
  });
  assert.equal("sourceRecord" in packageData.records.vocabulary[0], false);
  assert.equal(packageData.sourceManifest[0].id, "cejc-frequency");
});

test("CEJC aggregate values apply only to exact canonical written forms", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "kizashi-cejc-apply-test-"));
  try {
    const base = path.join(directory, "base.json");
    const frequency = path.join(directory, "cejc.json");
    const output = path.join(directory, "output.json");
    await writeFile(base, JSON.stringify({ sourceManifest: [], vocabulary: [
      { id: "vocab-eki", writtenForm: "駅", reading: "えき", sourceIds: [] },
      { id: "vocab-eki-other", writtenForm: "駅", reading: "えきや", sourceIds: [] },
    ] }));
    await writeFile(frequency, JSON.stringify({
      sourceManifest: [{ id: "cejc-frequency", name: "CEJC frequency", type: "frequency" }],
      records: { vocabulary: [{ writtenForm: "駅", spokenFrequency: 5, spokenFrequencyMetadata: { corpus: "CEJC" }, sourceIds: ["cejc-frequency"], fieldSourceIds: { spokenFrequency: ["cejc-frequency"] } }] },
    }));
    await execFileAsync("python3", ["scripts/apply_spoken_frequency.py", "--package", base, "--frequency", frequency, "--output", output]);
    const merged = JSON.parse(await readFile(output, "utf8"));
    assert.deepEqual(merged.vocabulary.map((item) => item.spokenFrequency), [5, 5]);
    assert.deepEqual(merged.vocabulary[0].fieldSourceIds, { spokenFrequency: ["cejc-frequency"], spokenFrequencyMetadata: ["cejc-frequency"] });
    assert.deepEqual(merged.sourceManifest, [{ id: "cejc-frequency", name: "CEJC frequency", type: "frequency" }]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("I-JAS aggregate validation rejects learner records and raw content", async () => {
  await execFileAsync("python3", ["scripts/validate_ijas_aggregate.py", "--input", "test/fixtures/ijas-aggregate.json"]);
  const directory = await mkdtemp(path.join(tmpdir(), "kizashi-ijas-test-"));
  try {
    const input = path.join(directory, "raw.json");
    await writeFile(input, JSON.stringify({ records: [{ pattern: "に", category: "location-vs-action", count: 1, learnerId: "private" }] }));
    await assert.rejects(execFileAsync("python3", ["scripts/validate_ijas_aggregate.py", "--input", input]));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("reviewed I-JAS aggregates attach without importing learner records", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "kizashi-ijas-apply-test-"));
  try {
    const packagePath = path.join(directory, "package.json");
    const output = path.join(directory, "output.json");
    await writeFile(packagePath, JSON.stringify({ vocabulary: [], learnerErrorAggregates: [] }));
    await execFileAsync("python3", ["scripts/apply_ijas_aggregate.py", "--package", packagePath, "--input", "test/fixtures/ijas-aggregate.json", "--output", output]);
    const merged = JSON.parse(await readFile(output, "utf8"));
    assert.deepEqual(merged.learnerErrorAggregates, [{ pattern: "に", category: "location-vs-action", count: 12, sourceReference: "I-JAS aggregate review 2026-08-31" }]);
    assert.match(merged.learnerErrorAggregatePolicy, /no learner IDs/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
