import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { getExternalSourceCoverage } from "../lib/source-coverage.js";
import { repairModuleProvenance } from "../lib/content-provenance-core.js";

test("repairs stale provenance from matching fallback records without inventing sources", () => {
  const fallback = {
    sourceManifest: [{ id: "michi-authored-n4-grammar" }],
    vocabulary: [],
    kanji: [],
    grammar: [{ id: "grammar-to-conditional", sourceIds: ["michi-authored-n4-grammar"] }],
    readings: [],
    listening: [],
  };
  const draft = {
    sourceManifest: [],
    vocabulary: [],
    kanji: [],
    grammar: [{ id: "grammar-to-conditional", sourceIds: ["grammar-to-conditional"] }, { id: "unknown", sourceIds: ["unknown"] }],
    readings: [],
    listening: [],
  };

  const result = repairModuleProvenance(draft, fallback);
  assert.equal(result.repaired, 1);
  assert.deepEqual(result.module.grammar[0].sourceIds, ["michi-authored-n4-grammar"]);
  assert.deepEqual(result.module.grammar[1].sourceIds, ["unknown"]);
  assert.equal(result.module.sourceManifest[0].id, "michi-authored-n4-grammar");
});

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
  assert.match(component, /sources = contentSources/);
  assert.match(component, /Audio provenance/);
  assert.match(component, /humanAudio/);
  assert.match(component, /syntheticAudio/);
});

test("Studio coverage follows the active package source manifest", async () => {
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(studio, /const coverageSources = useMemo\(\(\) =>/);
  assert.match(studio, /SourceCoverage items=\{coverageItems\} sources=\{coverageSources\}/);
  assert.match(studio, /const merged = repairModuleProvenance\(mergeContentModules\(next, seed\), seed\)\.module/);
  assert.match(studio, /setRaw\(JSON\.stringify\(merged, null, 2\)\)/);
});

test("Studio renders repaired provenance instead of the stale saved JSON", async () => {
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(studio, /const repairedRaw = repairedSaved\?\.repaired \? JSON\.stringify\(savedDraft, null, 2\) : saved/);
  assert.match(studio, /setRaw\(repairedRaw\)/);
});
