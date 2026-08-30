import test from "node:test";
import assert from "node:assert/strict";

import { aggregateExamEvidence, chooseReadinessPriority, filterExamLevelQuestions } from "../lib/jlpt-core.js";

test("prioritizes a below-minimum listening section before general skill weakness", () => {
  const skills = [
    { skillType: "vocabulary", coverage: 0.1, recentAccuracy: 0.2, retention: 0.1 },
    { skillType: "listening", coverage: 0.8, recentAccuracy: 0.8, retention: 0.8 },
  ];
  const sections = [{ id: "listening", status: "below-minimum" }];
  assert.equal(chooseReadinessPriority(skills, sections).skillType, "listening");
});

test("uses general skill weakness when every section is above minimum", () => {
  const skills = [
    { skillType: "vocabulary", coverage: 0.2, recentAccuracy: 0.2, retention: 0.2 },
    { skillType: "listening", coverage: 0.8, recentAccuracy: 0.8, retention: 0.8 },
  ];
  const sections = [{ id: "listening", status: "above-minimum" }];
  assert.equal(chooseReadinessPriority(skills, sections).skillType, "vocabulary");
});

test("pass practice stays on the requested exam level when bridge questions exist", () => {
  const questions = [{ id: "n4", jlptLevel: "N4" }, { id: "n5", jlptLevel: "N5" }];
  assert.deepEqual(filterExamLevelQuestions(questions).map((question) => question.id), ["n5"]);
  assert.deepEqual(filterExamLevelQuestions([{ id: "open", jlptLevel: null }]).map((question) => question.id), ["open"]);
});

test("readiness evidence aggregates recent attempts instead of only the latest section", () => {
  const attempts = [
    { completedAt: 3, categoryBreakdown: { listening: { correct: 2, total: 4 } } },
    { completedAt: 2, categoryBreakdown: { listening: { correct: 3, total: 4 } } },
    { completedAt: 1, categoryBreakdown: { listening: { correct: 4, total: 4 } } },
  ];
  assert.deepEqual(aggregateExamEvidence(attempts, ["listening"], 2), { correct: 5, total: 8, ratio: 0.625 });
});
