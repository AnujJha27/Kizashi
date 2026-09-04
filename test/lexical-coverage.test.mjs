import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildLexicalCoverageReport, kanjiKey, vocabularyKey } from "../lib/lexical-coverage-core.js";

test("lexical coverage normalizes kana variants and separates release status", () => {
  assert.equal(vocabularyKey("駅", "えき"), vocabularyKey("駅", "エキ"));
  assert.equal(kanjiKey("駅"), "駅");
  const report = buildLexicalCoverageReport({
    sourceVocabulary: [{ record: { word: "駅", reading: "エキ", level: "N5", sourceId: "openjlpt-vocab-n5" }, origin: "openjlpt" }],
    releasedVocabulary: [{ writtenForm: "駅", reading: "えき", jlptLevel: "N5" }],
    sourceKanji: [{ record: { character: "駅", level: "N5", sourceId: "openjlpt-kanji-n5" }, origin: "openjlpt" }],
    stagedKanji: [{ character: "駅", jlptLevel: "N5", sourceIds: ["irodori-kanji"], usefulWords: [{ word: "駅", reading: "えき" }, { word: "駅前", reading: "えきまえ" }, { word: "駅員", reading: "えきいん" }] }],
  });
  assert.equal(report.vocabulary.records[0].coverageStatus, "covered");
  assert.equal(report.vocabulary.summary.N5.covered, 1);
  assert.equal(report.kanji.records[0].coverageStatus, "partial");
  assert.equal(report.kanji.summary.N5.partial, 1);
  assert.equal(report.kanji.summary.N5.usefulWords3Plus, 1);
});

test("checked-in lexical union reports current N5/N4 evidence", async () => {
  const report = JSON.parse(await readFile(new URL("../data/lexical-coverage-union.json", import.meta.url), "utf8"));
  assert.deepEqual(report.vocabulary.summary, {
    N5: { total: 1704, covered: 153, partial: 534, missing: 1017, multiSource: 1660, ambiguous: 234, levelDisagreements: 685, usefulWords2Plus: 0, usefulWords3Plus: 0 },
    N4: { total: 1850, covered: 8, partial: 625, missing: 1217, multiSource: 1840, ambiguous: 206, levelDisagreements: 685, usefulWords2Plus: 0, usefulWords3Plus: 0 },
  });
  assert.deepEqual(report.kanji.summary, {
    N5: { total: 125, covered: 80, partial: 45, missing: 0, multiSource: 84, ambiguous: 0, levelDisagreements: 37, usefulWords2Plus: 118, usefulWords3Plus: 112 },
    N4: { total: 166, covered: 2, partial: 159, missing: 5, multiSource: 161, ambiguous: 0, levelDisagreements: 37, usefulWords2Plus: 139, usefulWords3Plus: 89 },
  });
  const disagreement = report.vocabulary.records.find((record) => record.levelDisagreement);
  assert.ok(disagreement?.levelClaims?.length >= 2);
  assert.ok(disagreement.levelClaims.every((claim) => claim.sourceId && claim.level));
  const panel = await readFile(new URL("../components/content/lexical-coverage.tsx", import.meta.url), "utf8");
  assert.match(panel, /levelClaims/);
});
