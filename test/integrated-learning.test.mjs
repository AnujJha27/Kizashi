import test from "node:test";
import assert from "node:assert/strict";

import { segmentJapaneseText } from "../lib/japanese-text-core.js";
import { getAdaptivePlan, getDaysRemaining } from "../lib/exam-plan-core.js";
import { getImmersionReason, selectImmersionClips } from "../lib/immersion-core.js";
import { buildIntegratedExamSets, conceptBreakdown, validateIntegratedExamSet } from "../lib/integrated-exam-core.js";
import { buildRepairPlan, getDueRepairs } from "../lib/repair-core.js";

test("reading segmentation preserves text and uses the longest trustworthy match", () => {
  const segments = segmentJapaneseText("駅前で本を読みます。", [
    { text: "駅", reading: "えき", itemId: "vocab-eki" },
    { text: "駅前", reading: "えきまえ", itemId: "vocab-ekimae" },
    { text: "本", reading: "ほん", itemId: "vocab-hon" },
  ]);

  assert.equal(segments.map((segment) => segment.text).join(""), "駅前で本を読みます。");
  assert.deepEqual(segments.filter((segment) => segment.status === "resolved").map((segment) => [segment.text, segment.reading]), [["駅前", "えきまえ"], ["本", "ほん"]]);
  assert.ok(segments.some((segment) => segment.status === "unresolved" && segment.text.includes("読")));
  assert.ok(segments.some((segment) => segment.status === "not-applicable" && segment.text.includes("で")));
});

test("ambiguous kanji readings stay unresolved instead of guessing", () => {
  const segments = segmentJapaneseText("生", [{ text: "生", reading: "せい" }, { text: "生", reading: "なま" }]);
  assert.deepEqual(segments, [{ text: "生", status: "unresolved", reading: undefined, itemId: undefined }]);
});

test("exam dates use stable local date arithmetic", () => {
  assert.equal(getDaysRemaining("2026-09-10", new Date("2026-09-01T23:59:59+05:30")), 9);
  assert.equal(getDaysRemaining("2026-09-01", new Date("2026-09-01T01:00:00+05:30")), 0);
  assert.equal(getDaysRemaining("2028-03-01", new Date("2028-02-29T17:00:00Z")), 1);
});

test("adaptive plan prioritizes due work, repairs, then integrated practice", () => {
  assert.equal(getAdaptivePlan({ examDate: "2026-09-30", now: new Date("2026-09-01T12:00:00+05:30"), dueCount: 3, weakCount: 2 }).action.key, "review");
  assert.equal(getAdaptivePlan({ examDate: "2026-09-30", now: new Date("2026-09-01T12:00:00+05:30"), dueCount: 0, weakCount: 2 }).action.key, "repair");
  assert.equal(getAdaptivePlan({ examDate: "2026-09-15", now: new Date("2026-09-01T12:00:00+05:30"), dueCount: 0, weakCount: 0 }).action.key, "integrated");
});

test("immersion queue boosts weakness-aware understandable stretch clips", () => {
  const items = [
    { id: "easy", title: "Easy", difficulty: 1, sourceType: "tts", transcript: "駅です。", prerequisiteIds: ["vocab-eki"], questions: [] },
    { id: "stretch", title: "Stretch", difficulty: 2, sourceType: "recorded", transcript: "駅の前です。", prerequisiteIds: ["vocab-eki", "grammar-ni"], questions: [] },
  ];
  const ranked = selectImmersionClips(items, "guided", new Set(["vocab-eki"]), 2, { mistakes: { "grammar-ni": { count: 2 } } });
  assert.deepEqual(ranked.map((item) => item.id), ["stretch", "easy"]);
  assert.match(getImmersionReason(ranked[0], new Set(["vocab-eki"]), { "grammar-ni": { count: 2 } }), /weak/iu);
});

test("integrated exam sets preserve one context and multiple target concepts", () => {
  const sets = buildIntegratedExamSets(new Set(["vocab-gohan", "vocab-mizu", "grammar-kudasai", "grammar-masu", "listening-cafe-order"]));
  assert.ok(sets.length >= 1);
  const restaurant = sets.find((set) => set.id === "integrated-restaurant");
  assert.ok(restaurant);
  assert.ok(restaurant.questions.every((question) => question.contextSetId === restaurant.id));
  assert.ok(restaurant.questions.some((question) => question.targetItemIds.length > 1));
  assert.match(restaurant.questions[0].prompt, /店員/u);
  assert.deepEqual(conceptBreakdown(restaurant.questions, { [restaurant.questions[0].id]: true, [restaurant.questions[1].id]: false }), { "vocab-gohan": { correct: 1, total: 1 }, "grammar-kudasai": { correct: 0, total: 1 } });
  assert.equal(validateIntegratedExamSet(restaurant, new Set(restaurant.targetItemIds)).valid, true);
});

test("repair plans retain the failed concept and schedule a delayed follow-up", () => {
  const plan = buildRepairPlan({ id: "integrated-restaurant-request", itemId: "grammar-kudasai", questionType: "polite request", contextSetId: "integrated-restaurant", targetItemIds: ["grammar-kudasai", "vocab-mizu"] }, 1000);
  assert.deepEqual(plan, { id: "repair-integrated-restaurant-request", itemId: "grammar-kudasai", questionId: "integrated-restaurant-request", contextSetId: "integrated-restaurant", targetItemIds: ["grammar-kudasai", "vocab-mizu"], followUpDueAt: 86401000, status: "started" });
  assert.equal(getDueRepairs([plan], 86401000).length, 1);
});
