import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { getExternalSourceCoverage } from "../lib/source-coverage.js";

test("source coverage counts real mappings and keeps runtime audio honest", () => {
  const coverage = getExternalSourceCoverage({
    items: [
      { id: "grammar-wa", category: "grammar", sourceIds: [] },
      { id: "grammar-ga", category: "grammar", sourceIds: [] },
      { id: "vocab-eki", category: "vocabulary", sourceIds: ["irodori"] },
      { id: "kanji-駅", category: "kanji", sourceIds: [] },
    ],
    taeKimMappings: { "grammar-wa": {}, "missing-grammar": {} },
    wikibooksMappings: { "grammar-ga": {} },
    irodoriResources: [{ targetItemIds: ["vocab-eki", "not-in-package"] }],
    tadokuEntries: [{ id: "tadoku-start" }],
    aozoraEnabled: true,
  });

  assert.deepEqual(coverage.grammar.taeKim, { covered: 1, total: 2 });
  assert.deepEqual(coverage.grammar.wikibooks, { covered: 1, total: 2 });
  assert.deepEqual(coverage.vocabulary.commons, { covered: null, total: 1, status: "on-demand" });
  assert.deepEqual(coverage.irodori, { covered: 1, total: 4 });
  assert.equal(coverage.reading.tadoku, 1);
  assert.equal(coverage.reading.aozora, true);
});

test("source coverage does not report enabled sources when their inputs are absent", () => {
  const coverage = getExternalSourceCoverage({ items: [], aozoraEnabled: false });
  assert.deepEqual(coverage.grammar.taeKim, { covered: 0, total: 0 });
  assert.deepEqual(coverage.vocabulary.commons, { covered: null, total: 0, status: "on-demand" });
  assert.deepEqual(coverage.irodori, { covered: 0, total: 0 });
  assert.equal(coverage.reading.tadoku, 0);
  assert.equal(coverage.reading.aozora, false);
});

test("the source manifest registers authored grammar provenance IDs", async () => {
  const manifest = await readFile(new URL("../lib/jlpt.ts", import.meta.url), "utf8");
  assert.match(manifest, /id: "irodori-sentence-patterns"/);
  assert.match(manifest, /id: "michi-authored-n4-grammar"/);
});

test("source coverage distinguishes selective links from package provenance", async () => {
  const component = await readFile(new URL("../components/content/source-coverage.tsx", import.meta.url), "utf8");
  assert.match(component, /const unknownIds = \[\.\.\.new Set/);
  assert.match(component, /Unknown source IDs: \{unknownIds/);
  assert.match(component, /Alternative source links are selective/);
  assert.match(component, /Package provenance/);
  assert.match(component, /Everything is connected/);
});
