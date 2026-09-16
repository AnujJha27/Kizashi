import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

function lessonIds() {
  const syllabus = JSON.parse(readFileSync(fileURLToPath(new URL("../data/kizashi-syllabus.json", import.meta.url)), "utf8"));
  return (syllabus.course?.chapters ?? []).flatMap((chapter) => chapter.lessons ?? []).map((lesson) => lesson.id);
}

test("the integrated syllabus reuses semantically matching legacy lesson ids so completion survives without a runtime migration layer", () => {
  const ids = new Set(lessonIds());
  for (const id of [
    "lesson-meeting-people",
    "lesson-morning-route",
    "lesson-food-and-routines",
    "lesson-weather-and-shopping",
    "lesson-home-and-directions",
    "lesson-conversation-and-plans",
    "lesson-practical-errands",
    "lesson-health-and-school",
    "lesson-weather-and-hobbies",
  ]) {
    assert.equal(ids.has(id), true, `${id} should be reused by the integrated path`);
  }
});

test("genuinely new or substantially restructured lessons keep new ids rather than inheriting unrelated completion", () => {
  const ids = new Set(lessonIds());
  assert.equal(ids.has("lesson-experience-and-comparison"), true);
  assert.equal(ids.has("lesson-food-and-restaurants"), true);
  assert.equal(ids.has("lesson-requests-permission-rules"), true);
  assert.equal(ids.has("lesson-plans-and-descriptions"), false, "the old mixed lesson should not falsely complete a new split lesson");
});

test("lesson ids remain unique after the curriculum rewrite", () => {
  const ids = lessonIds();
  assert.equal(new Set(ids).size, ids.length);
});
