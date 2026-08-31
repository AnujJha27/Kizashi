import test from "node:test";
import assert from "node:assert/strict";

import { getEarWarmup, getListeningClipMetadata, selectImmersionClips } from "../lib/immersion-core.js";

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
