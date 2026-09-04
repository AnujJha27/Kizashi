import test from "node:test";
import assert from "node:assert/strict";

import { pronunciationLessons, pronunciationItems } from "../data/pronunciation-bank.js";
import { advancePronunciationProgress, checkPronunciationAnswer, pronunciationProgressStage } from "../lib/pronunciation-core.js";

test("pronunciation bank covers the documented N5/N4 sequence", () => {
  assert.equal(pronunciationLessons.filter((lesson) => lesson.level === "N5").length, 15);
  assert.equal(pronunciationLessons.filter((lesson) => lesson.level === "N4").length, 5);
  assert.ok(pronunciationItems.length >= 50);
  for (const lesson of pronunciationLessons) {
    assert.ok(lesson.explanation);
    assert.ok(lesson.hearingExamples.length);
    assert.ok(lesson.listenRepeat);
    assert.ok(lesson.words.length);
    assert.ok(lesson.shortPhrases.length);
    assert.ok(lesson.sentenceExamples.length);
    assert.ok(lesson.exerciseIds.length);
  }
  assert.ok(["mora", "long-vowel", "small-tsu", "n", "contracted", "rhythm", "intonation", "pitch-awareness"].every((topic) => pronunciationLessons.some((lesson) => lesson.topic === topic)));
});

test("pronunciation answers tolerate kana variation but preserve the target choice", () => {
  assert.equal(checkPronunciationAnswer("キッテ", "きって"), true);
  assert.equal(checkPronunciationAnswer("きて", "きって"), false);
});

test("pronunciation progress is separate and conservative", () => {
  assert.equal(pronunciationProgressStage(undefined), "not-introduced");
  assert.equal(advancePronunciationProgress("not-introduced", "aware"), "aware");
  assert.equal(advancePronunciationProgress("aware", "discriminates"), "discriminates");
  assert.equal(advancePronunciationProgress("discriminates", "aware"), "discriminates");
  assert.equal(advancePronunciationProgress("discriminates", "practised"), "practised");
});
