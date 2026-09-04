import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildGrammarCoverageReport, normalizeGrammarPattern } from "../lib/grammar-coverage-core.js";

test("grammar coverage normalizes aliases without claiming them as canonical prose", () => {
  assert.equal(normalizeGrammarPattern(" V ます / Vません "), "vます/vません");
  const report = buildGrammarCoverageReport({
    canonical: [
      { id: "grammar-wa", pattern: "N は N です", jlptLevel: "N5" },
      { id: "grammar-te", pattern: "Vて-form", jlptLevel: "N4" },
      { id: "grammar-missing", pattern: "Vそうです", jlptLevel: "N4" },
    ],
    sources: [
      { id: "openjlpt", records: [{ id: "open-1", pattern: "NはNです", level: "N5" }, { id: "open-2", pattern: "Vて-form", level: "N5" }, { id: "open-3", pattern: "Vそうです", level: "N4" }] },
      { id: "tae-kim", references: [{ canonicalId: "grammar-wa" }] },
      { id: "irodori", records: [{ id: "iro-1", pattern: "NはNです", level: "Starter" }] },
    ],
  });
  assert.deepEqual(report.summary.N5, { rawPatterns: 2, canonicalConcepts: 1, complete: 1, partial: 0, missing: 0, unresolved: 0, levelDisagreements: 0 });
  assert.deepEqual(report.summary.N4, { rawPatterns: 2, canonicalConcepts: 2, complete: 0, partial: 2, missing: 0, unresolved: 0, levelDisagreements: 1 });
  assert.equal(report.canonical.find((item) => item.id === "grammar-wa").status, "complete");
  assert.deepEqual(report.canonical.find((item) => item.id === "grammar-te").levelDisagreements, ["N5"]);
  assert.equal(report.canonical.find((item) => item.id === "grammar-missing").status, "partial");
  assert.equal(report.aliasesMapped, 2);
  assert.equal(report.duplicateFamiliesCollapsed, 1);
});

test("mapped source records leave the unresolved queue", () => {
  const report = buildGrammarCoverageReport({
    canonical: [{ id: "grammar-wa", pattern: "NはNです", jlptLevel: "N5" }],
    sources: [{ id: "irodori", records: [{ id: "iro-1", pattern: "Nは？", level: "Starter" }], references: [{ canonicalId: "grammar-wa", recordId: "iro-1", pattern: "Nは？", level: "Starter" }] }],
  });
  assert.deepEqual(report.unresolved, []);
  assert.equal(report.canonical[0].status, "partial");
});

test("grammar coverage reports source patterns with no canonical match", () => {
  const report = buildGrammarCoverageReport({
    canonical: [{ id: "grammar-wa", pattern: "NはNです", jlptLevel: "N5" }],
    sources: [{ id: "openjlpt", records: [{ id: "open-1", pattern: "NはNです", level: "N5" }, { id: "open-2", pattern: "Vたら", level: "N4" }] }],
  });
  assert.deepEqual(report.unresolved, [{ sourceId: "openjlpt", recordId: "open-2", pattern: "Vたら", level: "N4" }]);
  assert.equal(report.summary.N4.unresolved, 1);
});

test("checked-in grammar registry preserves the current evidence boundary", async () => {
  const registry = JSON.parse(await readFile(new URL("../data/grammar-coverage-union.json", import.meta.url), "utf8"));
  assert.deepEqual(registry.summary.N5, { rawPatterns: 224, canonicalConcepts: 46, complete: 16, partial: 24, missing: 6, unresolved: 105, levelDisagreements: 4 });
  assert.deepEqual(registry.summary.N4, { rawPatterns: 188, canonicalConcepts: 70, complete: 3, partial: 58, missing: 9, unresolved: 86, levelDisagreements: 7 });
  assert.equal(registry.sourcePolicy.includes("review"), true);
  assert.equal(registry.sources.find((source) => source.id === "irodori-sentence-patterns").rawRecords, 348);
  assert.equal(registry.sources.find((source) => source.id === "irodori-sentence-patterns").references, 111);
  assert.equal(registry.canonical.find((concept) => concept.id === "grammar-yotei").status, "missing");
});

test("high-confidence N5 source aliases are mapped into the coverage registry", async () => {
  const registry = JSON.parse(await readFile(new URL("../data/grammar-coverage-union.json", import.meta.url), "utf8"));
  for (const id of ["grammar-ga-but", "grammar-ta-koto", "grammar-deshita", "grammar-dewa-arimasen", "grammar-nakutemo-ii", "grammar-nakereba-naranai"]) {
    const item = registry.canonical.find((concept) => concept.id === id);
    assert.ok(item);
    assert.notEqual(item.status, "missing");
  }
});

test("grammar coverage UI exposes evidence and disagreement context", async () => {
  const ui = await readFile(new URL("../components/content/grammar-coverage.tsx", import.meta.url), "utf8");
  assert.match(ui, /item\.evidenceCount/);
  assert.match(ui, /item\.sourceIds/);
  assert.match(ui, /openjlpt.*references/);
});

test("grammar coverage UI exposes the full unresolved review queue", async () => {
  const ui = await readFile(new URL("../components/content/grammar-coverage.tsx", import.meta.url), "utf8");
  assert.match(ui, /coverage\.unresolved\.map/);
  assert.doesNotMatch(ui, /coverage\.unresolved\.slice\(0, 16\)/);
});
