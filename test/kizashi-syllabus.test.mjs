import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const load = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));

const syllabus = load("data/kizashi-syllabus.json");
const packages = [
  load("data/n5-foundations.json"),
  load("data/n5-conversation-expansion.json"),
  load("data/n5-practical-expansion.json"),
  load("data/n5-life-expansion.json"),
  load("data/n4-grammar-expansion.json"),
  load("data/original-reading-bank.json"),
  load("data/original-listening-bank.json"),
];

const categories = ["vocabulary", "kanji", "grammar", "readings", "listening"];
const itemCategory = new Map();
for (const pkg of packages) {
  for (const category of categories) {
    for (const item of pkg[category] ?? []) {
      if (item?.id) itemCategory.set(item.id, category);
    }
  }
}

const lessons = (syllabus.course?.chapters ?? []).flatMap((chapter) => (chapter.lessons ?? []).map((lesson) => ({ ...lesson, region: chapter.region })));

test("every explicit Journey item resolves to a real learner item", () => {
  const missing = lessons.flatMap((lesson) => (lesson.itemIds ?? []).filter((id) => !itemCategory.has(id)).map((id) => `${lesson.id}:${id}`));
  assert.deepEqual(missing, [], `Unresolved Journey items:\n${missing.join("\n")}`);
});

test("Journey lesson IDs are unique and no dump/expansion titles survive", () => {
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, lessons.length);
  const bad = lessons.filter((lesson) => /(?:vocabulary|kanji|grammar)\s+expansion|expanded source curriculum/i.test(`${lesson.title} ${lesson.description ?? ""}`));
  assert.deepEqual(bad.map((lesson) => lesson.id), []);
});

test("Journey lessons stay bounded and integrated", () => {
  const oversized = lessons.filter((lesson) => (lesson.itemIds ?? []).length > 30).map((lesson) => [lesson.id, lesson.itemIds.length]);
  assert.deepEqual(oversized, []);

  const thin = [];
  for (const lesson of lessons) {
    const kinds = new Set((lesson.itemIds ?? []).map((id) => itemCategory.get(id)).filter(Boolean));
    if (lesson.placementStatus === "rich" && kinds.size < 2) thin.push([lesson.id, [...kinds]]);
  }
  assert.deepEqual(thin, [], `Rich lessons must mix at least two content categories: ${JSON.stringify(thin)}`);
});

test("the Journey carries explicit audit metadata instead of hiding textbook coverage", () => {
  assert.ok(lessons.every((lesson) => Array.isArray(lesson.requirementIds) && lesson.requirementIds.length > 0));
  assert.ok(lessons.some((lesson) => (lesson.auditRefs ?? []).some((ref) => ref.startsWith("genki-3:"))));
  assert.ok(lessons.some((lesson) => (lesson.auditRefs ?? []).some((ref) => ref.startsWith("minna-2:"))));
});
