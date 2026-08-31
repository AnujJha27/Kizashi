import test from "node:test";
import assert from "node:assert/strict";

import { getEarWarmup, getErinLessonSources, getListeningClipMetadata, selectImmersionClips } from "../lib/immersion-core.js";

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
