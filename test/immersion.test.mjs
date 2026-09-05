import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { getEarWarmup, getErinLessonSources, getListeningClipMetadata, selectImmersionClips } from "../lib/immersion-core.js";
import { normalizeInterestTopics } from "../lib/interest-core.js";
import { buildDictationBank, dictationMatches, getDictationDifference } from "../lib/dictation-core.js";
import { buildOutputBanks, outputReviewId, outputReviewRating } from "../lib/output-core.js";

const items = [
  { id: "easy", title: "Easy", situation: "greeting", difficulty: 1, jlptLevel: "N5", sourceType: "tts", transcript: "こんにちは。", prerequisiteIds: ["vocab-hello"], questions: [{ questionType: "key point" }] },
  { id: "middle", title: "Middle", situation: "shop", difficulty: 2, jlptLevel: "N5", sourceType: "tts", transcript: "水をください。", prerequisiteIds: ["vocab-water"], questions: [{ questionType: "verbal expression" }] },
  { id: "hard", title: "Hard", situation: "station", difficulty: 3, jlptLevel: "N5", sourceType: "recorded", transcript: "駅はどこですか。", prerequisiteIds: ["grammar-ni"], questions: [{ questionType: "task-based response" }] },
];

test("listening metadata reports learner coverage and source role", () => {
  const metadata = getListeningClipMetadata(items[2], new Map([["grammar-ni", { id: "grammar-ni", category: "grammar" }]]), new Set(["grammar-ni"]));
  assert.equal(metadata.source, "recorded");
  assert.equal(metadata.naturalness, "natural");
  assert.equal(metadata.grammarCoverage, 1);
  assert.deepEqual(metadata.skills, ["task-based response"]);
});

test("immersion selection is deterministic and ear warm-up spans difficulty", () => {
  assert.deepEqual(selectImmersionClips(items, "guided", new Set(["vocab-hello"]), 2).map((item) => item.id), ["easy", "middle"]);
  assert.deepEqual(selectImmersionClips(items, "immersion", new Set(), 2).map((item) => item.id), ["hard", "middle"]);
  assert.deepEqual(getEarWarmup(items, new Set()).map((item) => item.id), ["easy", "middle", "hard"]);
});

test("interest preferences bias immersion without replacing learning signals", () => {
  assert.deepEqual(normalizeInterestTopics(["travel", "unknown", "travel", "food", "books"]), ["travel", "food", "books"]);
  assert.equal(selectImmersionClips(items, "guided", new Set(), 1, { interests: ["travel"] })[0].id, "hard");
});

test("Erin source shelf points to exact original N5 lesson pages", () => {
  const sources = getErinLessonSources();
  assert.deepEqual(sources.map((source) => source.id), ["erin-01", "erin-02", "erin-03", "erin-04", "erin-06", "erin-08"]);
  assert.ok(sources.every((source) => source.url.startsWith("https://www.erin.jpf.go.jp/en/lesson/")));
  assert.equal(sources[0].title, "First-meeting greetings · classroom");
  assert.equal(sources[0].level, "N5");
  assert.ok(sources.every((source) => source.annotationStatus === "reviewed"));
  assert.deepEqual(sources[0].resourceTypes, ["basic skit", "script PDF", "script audio MP3"]);
  assert.equal(sources[0].mediaUrl, "https://www.erin.jpf.go.jp/movie/01/01-ba_high.mp4");
  assert.equal(sources[3].transcriptAvailable, true);
  assert.equal(sources[3].mediaDelivery, "original-site");
  assert.deepEqual(sources[3].targetSkills, ["location question"]);
  assert.deepEqual(sources[3].targetItemIds, ["vocab-doko", "grammar-doko", "grammar-ni", "grammar-de"]);
  assert.equal(sources.at(-1).title, "Ordering · fast food");
});

test("dictation derives explicit difficulty lanes from the authored listening bank", async () => {
  const source = JSON.parse(await readFile(new URL("../data/original-listening-bank.json", import.meta.url), "utf8"));
  const bank = buildDictationBank(source.listening);
  assert.equal(bank.length, 155);
  assert.deepEqual(Object.fromEntries(["N5", "N4"].map((level) => [level, bank.filter((item) => item.level === level).length])), { N5: 75, N4: 80 });
  assert.deepEqual(Object.fromEntries(["word", "phrase", "sentence", "dialogue-gap", "key-information"].map((mode) => [mode, bank.filter((item) => item.mode === mode).length])), { word: 15, phrase: 40, sentence: 65, "dialogue-gap": 18, "key-information": 17 });
  assert.equal(dictationMatches("きのう、友達と映画を見ました。", "きのう 友達と映画を見ました"), true);
  assert.equal(dictationMatches("きのう、友達と本を見ました。", "きのう 友達と映画を見ました"), false);
  assert.deepEqual(getDictationDifference("きのう、友達と本を見ました。", "きのう、友達と映画を見ました。"), { prefix: "きのう、友達と", answer: "本", expected: "映画", suffix: "を見ました。" });
});

test("output banks reuse released content at the documented depth", async () => {
  const files = ["n5-foundations.json", "n5-conversation-expansion.json", "n5-practical-expansion.json", "n5-life-expansion.json", "original-reading-bank.json", "original-listening-bank.json"];
  const sources = await Promise.all(files.map(async (file) => JSON.parse(await readFile(new URL(`../data/${file}`, import.meta.url), "utf8"))));
  const banks = buildOutputBanks({
    vocabulary: sources.flatMap((source) => source.vocabulary ?? []),
    readings: sources.flatMap((source) => source.readings ?? []),
    listening: sources.flatMap((source) => source.listening ?? []),
  });
  assert.equal(banks.speaking.filter((item) => item.level === "N5").length, 40);
  assert.equal(banks.speaking.filter((item) => item.level === "N4").length, 40);
  assert.equal(banks.writing.filter((item) => item.level === "N5").length, 25);
  assert.equal(banks.writing.filter((item) => item.level === "N4").length, 35);
  assert.ok(banks.pragmatics.length >= 100);
  assert.ok(banks.chunks.length >= 200);
  assert.ok(banks.chunks.every((item) => item.targetLevel && item.headVocabularyIds.length && item.sourceEvidence.length));
  assert.ok(banks.pragmatics.every((item) => item.function && item.choices?.length >= 2 && item.answer !== undefined));
});

test("output self-ratings reuse the shared review schedule", async () => {
  const component = await readFile(new URL("../components/learning/output-practice.tsx", import.meta.url), "utf8");
  assert.equal(outputReviewId("speaking-listen-1"), "output:speaking-listen-1");
  assert.deepEqual(["again", "close", "got-it"].map(outputReviewRating), ["again", "hard", "good"]);
  assert.match(component, /recordReview\(outputReviewId\(activity\.id\)/);
  assert.match(component, /`output-\$\{activity\.kind\}`/);
  assert.match(component, /, false\);/);
});

test("Immersion continue state can reopen the selected local activity", async () => {
  const surface = await readFile(new URL("../components/learning/immersion-surface.tsx", import.meta.url), "utf8");
  const player = await readFile(new URL("../components/learning/immersion-player.tsx", import.meta.url), "utf8");
  assert.match(surface, /URLSearchParams\(window\.location\.search\)/);
  assert.match(surface, /setSelectedReadingId/);
  assert.match(surface, /setSelectedClipId/);
  assert.match(surface, /listeningVisualAsset/);
  assert.match(surface, /loading="lazy" decoding="async"/);
  assert.match(player, /\/immersion\?reading=/);
  assert.match(player, /\/immersion\?listen=/);
});
