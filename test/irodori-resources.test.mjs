import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("Irodori resource manifest keeps Can-do separate from JLPT and media provider-hosted", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "kizashi-irodori-test-"));
  const output = path.join(directory, "resources.json");
  try {
    await execFileAsync("python3", ["scripts/ingest_irodori_resources.py", "--input", "test/fixtures/irodori-resources.json", "--output", output]);
    const manifest = JSON.parse(await readFile(output, "utf8"));
    const record = manifest.records[0];
    assert.equal(manifest.status, "staged");
    assert.equal(record.sourceId, "irodori");
    assert.equal(record.course, "Starter");
    assert.equal(record.lesson, "Lesson 6");
    assert.equal(record.canDo, "Order at a fast food restaurant");
    assert.equal(record.jlptLevel, undefined);
    assert.equal(record.audio.available, true);
    assert.equal(record.audio.delivery, "provider-hosted");
    assert.equal(record.audio.url, "https://www.irodori.jpf.go.jp/en/starter/audio/lesson06.html");
    assert.equal("audioBytes" in record, false);
    assert.equal(record.terms.url, "https://www.irodori.jpf.go.jp/en/faq.html");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Irodori registry exposes a practical ordering activity", async () => {
  const { getExternalResourceById } = await import("../lib/external-resources-runtime.js");
  const resource = getExternalResourceById("irodori-ordering-food");
  assert.equal(resource?.sourceId, "irodori");
  assert.equal(resource?.metadata?.canDo, "Order at a fast food restaurant");
  assert.deepEqual(resource?.targetItemIds, ["grammar-kudasai", "grammar-wo", "vocab-gohan"]);
  assert.equal(resource?.metadata?.jlptClassification, undefined);
});

test("the three existing Irodori ingestors remain runnable and review-only when the local source cache is present", async () => {
  const inputs = [
    ["scripts/ingest_irodori_wordlist.py", "data/source-cache/irodori-wordlist_all.xlsx"],
    ["scripts/ingest_irodori_sentence_patterns.py", "data/source-cache/irodori-sentence-patterns.xlsx"],
    ["scripts/ingest_irodori_kanji.py", "data/source-cache/irodori-kanji_list.xlsx"],
  ];
  try {
    await Promise.all(inputs.map(([, input]) => access(input)));
  } catch {
    return;
  }
  const directory = await mkdtemp(path.join(tmpdir(), "kizashi-irodori-ingestors-"));
  try {
    for (const [script, input] of inputs) {
      const output = path.join(directory, `${path.basename(script)}.json`);
      await execFileAsync("python3", [script, "--input", input, "--output", output]);
      const packageData = JSON.parse(await readFile(output, "utf8"));
      const records = Object.values(packageData.records).flat().filter((record) => record && typeof record === "object");
      assert.ok(records.every((record) => record.reviewStatus === "pending"));
      assert.ok(records.every((record) => Array.isArray(record.sourceIds)));
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
