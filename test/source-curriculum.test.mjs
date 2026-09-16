import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const scriptPath = new URL("../scripts/merge_openjlpt_staging.py", import.meta.url);

function minimalCourse() {
  return {
    course: {
      id: "course-test",
      slug: "test",
      title: "Test course",
      description: "Fixture",
      jlptLevel: "N5",
      chapters: [
        {
          id: "chapter-authored",
          slug: "authored",
          title: "Authored lesson",
          description: "A real learner chapter.",
          region: "quiet-city",
          lessons: [
            {
              id: "lesson-authored",
              slug: "authored",
              title: "Meeting people",
              subtitle: "はじめまして",
              description: "A coherent learner lesson.",
              estimatedMinutes: 10,
              itemIds: [],
            },
          ],
        },
      ],
    },
    vocabulary: [],
    kanji: [],
    grammar: [],
    readings: [],
    listening: [],
    grammarContrasts: [],
    sourceManifest: [],
  };
}

function stagedPackage() {
  return {
    sources: [{ id: "fixture-source", name: "Fixture source" }],
    records: {
      vocabulary: [
        {
          id: "vocab-source-only",
          writtenForm: "約束",
          reading: "やくそく",
          meanings: ["promise"],
          partOfSpeech: "noun",
          jlptLevel: "N4",
          sourceIds: ["fixture-source"],
        },
      ],
      kanji: [],
      grammar: [],
    },
  };
}

test("source records stay in the learner reservoir without creating dump Journey lessons", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kizashi-source-curriculum-"));
  try {
    const basePath = join(directory, "base.json");
    const stagedPath = join(directory, "staged.json");
    const outputPath = join(directory, "output.json");
    await writeFile(basePath, JSON.stringify(minimalCourse()), "utf8");
    await writeFile(stagedPath, JSON.stringify(stagedPackage()), "utf8");

    const run = spawnSync("python3", [
      scriptPath.pathname,
      "--base",
      basePath,
      "--staged",
      stagedPath,
      "--output",
      outputPath,
    ], { encoding: "utf8" });

    assert.equal(run.status, 0, run.stderr || run.stdout);
    const output = JSON.parse(await readFile(outputPath, "utf8"));

    assert.ok(output.vocabulary.some((item) => item.id === "vocab-source-only"), "source vocabulary should remain learner-accessible");
    assert.deepEqual(
      output.course.chapters.map((chapter) => chapter.id),
      ["chapter-authored"],
      "source ingestion must not manufacture learner-facing review/expansion chapters",
    );
    assert.equal(
      output.course.chapters.flatMap((chapter) => chapter.lessons ?? []).some((lesson) => /(?:vocabulary|kanji|grammar) expansion \d+/iu.test(lesson.title ?? "")),
      false,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
