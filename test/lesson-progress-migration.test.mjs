import assert from "node:assert/strict";
import test from "node:test";

import { legacyLessonIdsFor, migratedCompletionState } from "../lib/lesson-progress-migration-core.js";

const aliases = {
  "lesson-morning-route": "lesson-time-and-schedules",
  "lesson-weather-and-shopping": "lesson-shopping-and-money",
  "lesson-home-and-directions": "lesson-home-and-places",
  "lesson-plans-and-descriptions": "lesson-invitations-and-plans",
  "lesson-conversation-and-plans": "lesson-invitations-and-plans",
  "lesson-practical-errands": "lesson-transport-and-directions",
  "lesson-weather-and-hobbies": "lesson-weather-and-seasons",
};

test("legacy lesson aliases point to one explicit destination instead of completing every lesson created by a split", () => {
  assert.deepEqual(legacyLessonIdsFor("lesson-shopping-and-money", aliases), ["lesson-weather-and-shopping"]);
  assert.deepEqual(legacyLessonIdsFor("lesson-weather-and-seasons", aliases), ["lesson-weather-and-hobbies"]);
  assert.deepEqual(legacyLessonIdsFor("lesson-transport-and-directions", aliases), ["lesson-practical-errands"]);
  assert.deepEqual(legacyLessonIdsFor("lesson-food-and-restaurants", aliases), []);
});

test("only a completed predecessor migrates completion into the new lesson", () => {
  const complete = migratedCompletionState("lesson-time-and-schedules", aliases, (id) =>
    id === "lesson-morning-route" ? { lessonId: id, position: 9, status: "complete" } : undefined,
  );
  assert.deepEqual(complete, { lessonId: "lesson-time-and-schedules", position: 0, status: "complete" });

  const partial = migratedCompletionState("lesson-time-and-schedules", aliases, (id) =>
    id === "lesson-morning-route" ? { lessonId: id, position: 4, status: "in_progress" } : undefined,
  );
  assert.equal(partial, undefined);
});

test("several old lessons may converge on one replacement without leaking completion elsewhere", () => {
  assert.deepEqual(
    legacyLessonIdsFor("lesson-invitations-and-plans", aliases),
    ["lesson-plans-and-descriptions", "lesson-conversation-and-plans"],
  );
  const migrated = migratedCompletionState("lesson-invitations-and-plans", aliases, (id) =>
    id === "lesson-conversation-and-plans" ? { lessonId: id, position: 52, status: "complete" } : undefined,
  );
  assert.equal(migrated?.status, "complete");
  assert.equal(migrated?.lessonId, "lesson-invitations-and-plans");
});
