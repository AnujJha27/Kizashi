import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

import { buildLexicalCoverageReport } from "../lib/lexical-coverage-core.js";

const ROOT = new URL("../", import.meta.url);
const path = (name) => new URL(name, ROOT);
const json = async (name) => JSON.parse(await readFile(path(name), "utf8"));
const staged = JSON.parse(gunzipSync(await readFile(path("data/staging/kizashi-n5-source-review.json.gz"))));
const active = await Promise.all(["n5-foundations.json", "n5-conversation-expansion.json", "n5-practical-expansion.json", "n5-life-expansion.json"].map((name) => json(`data/${name}`)));

const records = (payload, kind) => {
  const values = payload?.records?.[kind] ?? payload?.[kind] ?? [];
  return Array.isArray(values) ? values : [];
};
const level = (value) => value === "N5" || value === "N4" ? value : null;
const irodoriLevel = (record) => {
  const course = String(record.sourceRecord?.course || record.sourceRecord?.cells?.[9] || "");
  if (/入門|初級1/u.test(course)) return "N5";
  if (/初級2|初中級/u.test(course)) return "N4";
  return null;
};
const marugotoLevel = (sourceId) => /starter/u.test(sourceId) ? "N5" : /elementary1/u.test(sourceId) ? "N5" : /elementary2/u.test(sourceId) ? "N4" : null;
const sourceRecord = (record, sourceId, sourceLevel = null, origin = sourceId) => ({ record: { ...record, sourceId, level: sourceLevel }, origin });
const validJapanese = (value) => /[ぁ-んァ-ヶ一-龯々ー]/u.test(String(value ?? ""));

const openVocabulary = (await Promise.all(["n5", "n4"].map(async (suffix) => (await json(`data/source-cache/openjlpt-vocab-${suffix}.json`)).map((record) => sourceRecord(record, `openjlpt-vocab-${suffix}`, suffix.toUpperCase(), "openjlpt"))))).flat();
const openKanji = (await Promise.all(["n5", "n4"].map(async (suffix) => (await json(`data/source-cache/openjlpt-kanji-${suffix}.json`)).map((record) => sourceRecord(record, `openjlpt-kanji-${suffix}`, suffix.toUpperCase(), "openjlpt"))))).flat();
const irodori = await json("data/staging/irodori-vocabulary.json");
const marugoto = await json("data/staging/marugoto-vocabulary.json");
const irodoriVocabulary = records(irodori, "vocabulary").filter((record) => validJapanese(record.writtenForm)).map((record) => sourceRecord(record, "irodori-wordlist", irodoriLevel(record), "irodori"));
const marugotoVocabulary = records(marugoto, "vocabulary").filter((record) => validJapanese(record.writtenForm)).map((record) => sourceRecord(record, record.sourceIds?.[0] || "marugoto-vocab", marugotoLevel(record.sourceIds?.[0]), "marugoto"));

const releasedVocabulary = active.flatMap((module) => module.vocabulary ?? []);
const releasedKanji = active.flatMap((module) => module.kanji ?? []);
const stagedVocabulary = staged.vocabulary ?? [];
const stagedKanji = staged.kanji ?? [];
const report = buildLexicalCoverageReport({
  sourceVocabulary: [...openVocabulary, ...irodoriVocabulary, ...marugotoVocabulary],
  sourceKanji: openKanji,
  releasedVocabulary,
  releasedKanji,
  stagedVocabulary,
  stagedKanji,
});
for (const kind of ["vocabulary", "kanji"]) report[kind].records = report[kind].records.map(({ sourceClaims, surfaceForms, readings, ...record }) => ({
  ...record,
  ...(record.levelDisagreement ? { levelClaims: sourceClaims.filter((claim) => claim.level).map(({ sourceId, level, origin }) => ({ sourceId, level, origin })) } : {}),
}));
report.sources = {
  vocabulary: { openjlpt: openVocabulary.length, irodori: irodoriVocabulary.length, marugoto: marugotoVocabulary.length, staged: stagedVocabulary.length, released: releasedVocabulary.length },
  kanji: { openjlpt: openKanji.length, staged: stagedKanji.length, released: releasedKanji.length },
};
await writeFile(path("data/lexical-coverage-union.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
for (const kind of ["vocabulary", "kanji"]) console.log(`${kind}:`, report[kind].summary);
