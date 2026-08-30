import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { parseLearnerAssistResponse, validateLearnerAssistRequest } from "../lib/learner-assist-core.js";

test("learner assist validates bounded public requests", () => {
  const known = new Set(["vocab-eki"]);
  assert.deepEqual(validateLearnerAssistRequest({ task: "explain", text: "駅へ行きます。", itemId: "vocab-eki" }, known), {
    status: 200,
    task: "explain",
    text: "駅へ行きます。",
    itemId: "vocab-eki",
  });
  assert.equal(validateLearnerAssistRequest({ task: "writing", text: "x".repeat(2001) }, known).status, 400);
  assert.equal(validateLearnerAssistRequest({ task: "unknown", text: "駅" }, known).status, 400);
  assert.equal(validateLearnerAssistRequest({ task: "explain", text: "駅", itemId: "missing" }, known).status, 404);
});

test("learner assist only accepts the expected derived response shape", () => {
  assert.deepEqual(parseLearnerAssistResponse("explain", JSON.stringify({ segmentation: ["駅", "へ", "行きます"], grammar: ["へ marks destination."], literalTranslation: "Go toward the station.", naturalTranslation: "I am going to the station." })), {
    segmentation: ["駅", "へ", "行きます"],
    grammar: ["へ marks destination."],
    literalTranslation: "Go toward the station.",
    naturalTranslation: "I am going to the station.",
  });
  assert.deepEqual(parseLearnerAssistResponse("writing", { corrected: "駅へ行きます。", explanation: "Use へ for the destination.", alternatives: ["駅に行きます。"] }), {
    corrected: "駅へ行きます。",
    explanation: "Use へ for the destination.",
    alternatives: ["駅に行きます。"],
  });
  assert.deepEqual(parseLearnerAssistResponse("conversation", { reply: "こんにちは。", translation: "Hello.", question: "今日は何をしますか。", tip: "Use は to mark the topic." }), {
    reply: "こんにちは。",
    translation: "Hello.",
    question: "今日は何をしますか。",
    tip: "Use は to mark the topic.",
  });
  assert.equal(parseLearnerAssistResponse("conversation", { reply: "こんにちは。", translation: "Hello.", tip: "A casual greeting." }), null);
});

test("learner assist route is available to allowed learners without publishing drafts", async () => {
  const route = await readFile(new URL("../app/api/learner-assist/route.ts", import.meta.url), "utf8");
  assert.match(route, /const user = await getAllowedUser\(\)/);
  assert.match(route, /validateLearnerAssistRequest/);
  assert.match(route, /withinRateLimit/);
  assert.match(route, /OPENROUTER_API_KEY/);
  assert.doesNotMatch(route, /user\.isAdmin/);
});
