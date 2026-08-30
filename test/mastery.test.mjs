import test from "node:test";
import assert from "node:assert/strict";

import {
  applyReview,
  buildReviewQueue,
  normalizeAnswer,
  recordMistake,
  resumeSession,
} from "../lib/mastery.js";

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
