import test from "node:test";
import assert from "node:assert/strict";

import {
  applyReview,
  buildReviewQueue,
  normalizeAnswer,
  recordMistake,
  reviewRatingForConfidence,
  resumeSession,
} from "../lib/mastery.js";
import { dailyGoalProgress } from "../lib/study-core.js";

test("maps answer confidence to a review rating", () => {
  assert.equal(reviewRatingForConfidence(false, "confident"), "again");
  assert.equal(reviewRatingForConfidence(true, "guess"), "hard");
  assert.equal(reviewRatingForConfidence(true, "unsure"), "good");
  assert.equal(reviewRatingForConfidence(true, "confident"), "easy");
  assert.equal(reviewRatingForConfidence(true, null), "good");
});

test("normalizes equivalent kana and answer whitespace", () => {
  assert.equal(normalizeAnswer("  たべる  "), "たべる");
  assert.equal(normalizeAnswer("ﾀﾍﾞﾙ"), "たべる");
  assert.equal(normalizeAnswer("食べる　"), "食べる");
});

test("moves an item through conservative mastery states", () => {
  const first = applyReview({ state: "unseen", score: 0, intervalDays: 0 }, "correct");
  const second = applyReview(first, "correct");
  const miss = applyReview(second, "incorrect");

  assert.deepEqual(first, { state: "learning", score: 1, intervalDays: 1 });
  assert.deepEqual(second, { state: "stable", score: 2, intervalDays: 3 });
  assert.deepEqual(miss, { state: "learning", score: 1, intervalDays: 1 });
});

test("prioritizes overdue and weak items within a short-session cap", () => {
  const queue = buildReviewQueue(
    [
      { id: "later", dueAt: "2099-01-01", score: 0.9 },
      { id: "overdue", dueAt: "2020-01-01", score: 0.8 },
      { id: "weak", dueAt: "2099-01-01", score: 0.1 },
    ],
    new Date("2026-08-29T00:00:00Z"),
    2,
  );

  assert.deepEqual(queue.map((item) => item.id), ["overdue", "weak"]);
});

test("captures repeated confusion as a recurring mistake", () => {
  const first = recordMistake([], { itemId: "particle-ni", category: "grammar", answer: "で" });
  const second = recordMistake(first, { itemId: "particle-ni", category: "grammar", answer: "で" });

  assert.equal(second[0].count, 2);
  assert.equal(second[0].recurring, true);
});

test("restores the saved position without restarting the session", () => {
  assert.deepEqual(
    resumeSession({ sessionId: "s1", itemIds: ["a", "b"], position: 1, status: "active" }),
    { sessionId: "s1", itemIds: ["a", "b"], position: 1, status: "active" },
  );
});

test("calculates bounded daily-goal progress", () => {
  assert.deepEqual(dailyGoalProgress(7, 5), { minutes: 7, goal: 5, percent: 100, complete: true });
  assert.deepEqual(dailyGoalProgress(-2, 99), { minutes: 0, goal: 10, percent: 0, complete: false });
});
