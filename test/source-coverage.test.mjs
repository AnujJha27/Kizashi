import test from "node:test";
import assert from "node:assert/strict";

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
