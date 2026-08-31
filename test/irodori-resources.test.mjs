import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
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
    assert.equal(record.course, "初級1");
    assert.equal(record.lesson, "Lesson 5");
    assert.equal(record.canDo, "レストランで注文する");
    assert.equal(record.jlptLevel, undefined);
    assert.equal(record.audio.available, true);
    assert.equal(record.audio.delivery, "provider-hosted");
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
  assert.equal(resource?.metadata?.canDo, "レストランで注文する");
  assert.deepEqual(resource?.targetItemIds, ["grammar-kudasai", "grammar-wo", "vocab-gohan"]);
  assert.equal(resource?.metadata?.jlptClassification, undefined);
});

