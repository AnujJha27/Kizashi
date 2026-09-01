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

test("Marugoto staging preserves readings split by pitch-accent marks", async () => {
  const packageData = await runToTemp("scripts/ingest_marugoto_vocab.py", "test/fixtures/marugoto-vocabulary.txt", "marugoto.json");
  const readings = new Map(packageData.records.vocabulary.map((record) => [record.writtenForm, record.reading]));
  assert.deepEqual(Object.fromEntries(readings), {
    "いくら": "いくら",
    "どこ": "どこ",
    "バス": "バス",
    "ありがとう": "ありがとう",
    "すみません": "すみません",
  });
});

test("rejected vocabulary retry repairs rows and merges canonical duplicates", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "kizashi-retry-test-"));
  try {
    const input = path.join(directory, "package.json");
    const output = path.join(directory, "retried.json");
    await writeFile(input, JSON.stringify({
      vocabulary: [
        { id: "vocab-ikura", writtenForm: "いくら", reading: "いくら", meanings: ["how much"], sourceIds: [] },
        {
          id: "openjlpt-vocabulary-cd2f86eedfd9",
          writtenForm: "いくら",
          reading: "イクラ",
          meanings: ["salted salmon roe"],
          reviewStatus: "rejected",
          sourceIds: ["openjlpt-vocab-n5"],
          classification: { itemType: "vocabulary", itemId: "openjlpt-vocabulary-cd2f86eedfd9", level: "N5" },
          sourceRecord: { word: "いくら", reading: "", meanings: ["how much?"], level: "N5" },
        },
        {
          id: "marugoto-starter-vocab-7ddb68d985db",
          writtenForm: "いくら",
          reading: "い",
          meanings: ["ikura how much 13"],
          reviewStatus: "rejected",
          sourceIds: ["marugoto-starter-vocab"],
          sourceRecord: { line: "  いくら                       い￢くら               ikura         how much                                            13", lineNumber: 1 },
        },
        {
          id: "marugoto-elementary1-vocab-32738872e84f",
          writtenForm: "ありがとう",
          reading: "あり",
          meanings: ["Thank you. 3"],
          reviewStatus: "rejected",
          sourceIds: ["marugoto-elementary1-vocab"],
          sourceRecord: { line: "  ありがとう                             あり￢がとう      Thank you.                                              3", lineNumber: 2 },
        },
      ],
    }));
    await execFileAsync("python3", ["scripts/retry_rejected_vocab.py", "--package", input, "--output", output]);
    const retried = JSON.parse(await readFile(output, "utf8"));
    const byId = new Map(retried.vocabulary.map((item) => [item.id, item]));
    assert.equal(byId.has("openjlpt-vocabulary-cd2f86eedfd9"), false);
    assert.equal(byId.has("marugoto-starter-vocab-7ddb68d985db"), false);
    assert.equal(byId.get("vocab-ikura").sourceIds.includes("openjlpt-vocab-n5"), true);
    assert.equal(byId.get("vocab-ikura").sourceIds.includes("marugoto-starter-vocab"), true);
    assert.equal(byId.get("marugoto-elementary1-vocab-32738872e84f").reading, "ありがとう");
    assert.equal(byId.get("marugoto-elementary1-vocab-32738872e84f").reviewStatus, "pending");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
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

test("CSJ aggregate publication requires the explicit private authorization flag", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "kizashi-csj-apply-test-"));
  try {
    const base = path.join(directory, "base.json");
    const frequency = path.join(directory, "csj.json");
    const output = path.join(directory, "output.json");
    await writeFile(base, JSON.stringify({ sourceManifest: [], vocabulary: [{ id: "vocab-eki", writtenForm: "駅", sourceIds: [] }] }));
    await writeFile(frequency, JSON.stringify({
      sourceManifest: [{ id: "csj-frequency", name: "CSJ frequency", type: "frequency" }],
      records: { vocabulary: [{ writtenForm: "駅", spokenFrequency: 9, spokenFrequencyMetadata: { corpus: "CSJ" }, sourceIds: ["csj-frequency"], fieldSourceIds: { spokenFrequency: ["csj-frequency"] } }] },
    }));
    await assert.rejects(execFileAsync("python3", ["scripts/apply_spoken_frequency.py", "--package", base, "--frequency", frequency, "--output", output]), /private/);
    await execFileAsync("python3", ["scripts/apply_spoken_frequency.py", "--package", base, "--frequency", frequency, "--output", output, "--publish-private"]);
    const merged = JSON.parse(await readFile(output, "utf8"));
    assert.deepEqual(merged.spokenFrequencyImport, { sourceId: "csj-frequency", matchedVocabulary: 1, candidateRecords: 1, status: "private-published", audience: "private-allowlisted" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CSJ ingestion emits reviewed-only spoken frequency aggregates", async () => {
  const packageData = await runToTemp("scripts/ingest_csj_frequency.py", "test/fixtures/csj-frequency.tsv", "csj.json", ["--version", "2018.03.1"]);
  assert.equal(packageData.status, "staged");
  assert.equal(packageData.stats.rows, 3);
  assert.equal(packageData.stats.records, 2);
  assert.deepEqual(packageData.records.vocabulary[0], {
    writtenForm: "駅",
    spokenFrequency: 9,
    spokenFrequencyMetadata: {
      corpus: "CSJ",
      version: "2018.03.1",
      unit: "CSJ short-unit lemma",
      register: "CSJ overall",
      pmw: 4.5,
      rowCount: 2,
      aggregation: "sum of published CSJ frequency rows sharing the lemma",
    },
    sourceIds: ["csj-frequency"],
    fieldSourceIds: { spokenFrequency: ["csj-frequency"], spokenFrequencyMetadata: ["csj-frequency"] },
    reviewStatus: "pending",
  });
  assert.match(packageData.sourceManifest[0].license, /CC BY-NC-ND 3\.0/);
  assert.match(packageData.sourcePolicy, /no redistribution/);
  assert.equal("sourceRecord" in packageData.records.vocabulary[0], false);
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
