import { readFile, writeFile } from "node:fs/promises";

import { buildGrammarCoverageReport } from "../lib/grammar-coverage-core.js";

const root = new URL("../", import.meta.url);
const readJson = (path) => readFile(new URL(path, root), "utf8").then(JSON.parse);

const [canonicalPackages, openN5, openN4, irodori, irodoriMap, taeKim, wikibooks] = await Promise.all([
  Promise.all(["n5-foundations.json", "n5-conversation-expansion.json", "n5-practical-expansion.json", "n5-life-expansion.json", "n4-grammar-expansion.json"].map((file) => readJson(`data/${file}`))),
  readJson("data/source-cache/openjlpt-grammar-n5.json"),
  readJson("data/source-cache/openjlpt-grammar-n4.json"),
  readJson("data/staging/irodori-grammar.json"),
  readJson("data/source-maps/irodori-grammar.json"),
  readJson("data/source-maps/tae-kim.json"),
  readJson("data/source-maps/wikibooks.json"),
]);

const canonical = canonicalPackages.flatMap((pkg) => pkg.grammar ?? []);
const openjlptRecords = [...openN5.map((item, index) => ({ id: `openjlpt-n5-${index + 1}`, pattern: item.pattern, level: "N5" })), ...openN4.map((item, index) => ({ id: `openjlpt-n4-${index + 1}`, pattern: item.pattern, level: "N4" }))];
const openjlptReferences = [
  ["openjlpt-n5-1", "grammar-ga-but", "〜が（but）"],
  ["openjlpt-n5-2", "grammar-arimasu", "〜がいます / 〜があります"],
  ["openjlpt-n5-2", "grammar-imasu", "〜がいます / 〜があります"],
  ["openjlpt-n5-3", "grammar-kara", "〜から（reason）"],
  ["openjlpt-n5-4", "grammar-suki", "〜が好きです / 〜が嫌いです"],
  ["openjlpt-n5-5", "grammar-tai", "〜たい"],
  ["openjlpt-n5-6", "grammar-ta-koto", "〜たことがあります"],
  ["openjlpt-n5-7", "grammar-de", "〜で（place/means）"],
  ["openjlpt-n5-8", "grammar-teiru", "〜ている"],
  ["openjlpt-n5-9", "grammar-te-kudasai", "〜てください"],
  ["openjlpt-n5-10", "grammar-deshita", "〜でした"],
  ["openjlpt-n5-11", "grammar-dewa-arimasen", "〜ではありません"],
  ["openjlpt-n5-12", "grammar-tewaikenai", "〜てはいけません"],
  ["openjlpt-n5-13", "grammar-temoii", "〜てもいいです"],
  ["openjlpt-n5-14", "grammar-to", "〜と（and/with）"],
  ["openjlpt-n5-15", "grammar-nakutemo-ii", "〜なくてもいいです"],
  ["openjlpt-n5-16", "grammar-nakereba-naranai", "〜なければなりません / 〜なくてはいけません"],
  ["openjlpt-n5-17", "grammar-ni", "〜に（time/destination）"],
  ["openjlpt-n5-18", "grammar-mashou", "〜ましょう"],
  ["openjlpt-n5-19", "grammar-masenka", "〜ませんか"],
  ["openjlpt-n5-20", "grammar-wo", "〜を（object particle）"],
].map(([recordId, canonicalId, pattern]) => ({ recordId, canonicalId, pattern, level: "N5" }));
const source = [
  { id: "openjlpt", records: openjlptRecords, references: openjlptReferences },
  { id: "irodori-sentence-patterns", records: (irodori.records?.grammar ?? []).map((item) => ({ id: item.id, pattern: item.pattern, level: item.sourceLevel })), references: Object.entries(irodoriMap).flatMap(([canonicalId, references]) => (Array.isArray(references) ? references : []).map((reference) => ({ canonicalId, recordId: reference.sourceRecordId, pattern: reference.pattern, level: reference.sourceLevel }))) },
  { id: "tae-kim", references: Object.entries(taeKim).map(([canonicalId, reference]) => ({ canonicalId, pattern: reference.sectionTitle })) },
  { id: "wikibooks-japanese", references: Object.entries(wikibooks).map(([canonicalId, reference]) => ({ canonicalId, pattern: reference.sectionTitle })) },
];

const report = buildGrammarCoverageReport({ canonical, sources: source });
const output = {
  ...report,
  sourcePolicy: "Coverage evidence only; source records do not become learner lessons without review.",
  sources: source.map((item) => ({ id: item.id, rawRecords: item.records?.length ?? 0, references: item.references?.length ?? 0 })),
};
await writeFile(new URL("data/grammar-coverage-union.json", root), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote grammar coverage registry: ${output.canonical.length} canonical concepts, ${output.unresolved.length} unresolved source patterns.`);
