import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { gunzipSync } from "node:zlib";

import { getItemPriority, rankContentCandidates } from "../lib/content-priority.js";
import { generatedReview, validateGenerationRequest } from "../lib/content-generation-core.js";
import { selectWeakPracticeQuestions } from "../lib/weak-practice.js";

const execFileAsync = promisify(execFile);

const moduleData = JSON.parse(await readFile(new URL("../data/n5-foundations.json", import.meta.url), "utf8"));
const expansionData = await Promise.all(["n5-conversation-expansion.json", "n5-practical-expansion.json", "n5-life-expansion.json"].map(async (file) => JSON.parse(await readFile(new URL(`../data/${file}`, import.meta.url), "utf8"))));
const authoredQuestions = JSON.parse(await readFile(new URL("../data/n5-authored-practice.json", import.meta.url), "utf8"));
const mergedModule = {
  ...moduleData,
  course: { ...moduleData.course, chapters: [moduleData, ...expansionData].flatMap((module) => module.course.chapters) },
  vocabulary: [moduleData, ...expansionData].flatMap((module) => module.vocabulary),
  kanji: [moduleData, ...expansionData].flatMap((module) => module.kanji),
  grammar: [moduleData, ...expansionData].flatMap((module) => module.grammar),
  grammarContrasts: [moduleData, ...expansionData].flatMap((module) => module.grammarContrasts),
  readings: [moduleData, ...expansionData].flatMap((module) => module.readings),
  listening: [moduleData, ...expansionData].flatMap((module) => module.listening),
};

test("the N5 module has meaningful, linked content", () => {
  assert.ok(mergedModule.vocabulary.length >= 150);
  assert.ok(mergedModule.kanji.length >= 80);
  assert.ok(mergedModule.grammar.length >= 40);
  assert.ok(mergedModule.readings.length >= 12);
  assert.ok(mergedModule.listening.length >= 12);

  const itemIds = new Set([
    ...mergedModule.vocabulary.map((item) => item.id),
    ...mergedModule.kanji.map((item) => item.id),
    ...mergedModule.grammar.map((item) => item.id),
    ...mergedModule.readings.map((item) => item.id),
    ...mergedModule.listening.map((item) => item.id),
  ]);
  const lessonIds = mergedModule.course.chapters.flatMap((chapter) => chapter.lessons.flatMap((lesson) => lesson.itemIds));

  assert.equal(itemIds.size, ["vocabulary", "kanji", "grammar", "readings", "listening"].reduce((total, category) => total + mergedModule[category].length, 0));
  assert.ok(lessonIds.every((id) => itemIds.has(id)));
  assert.ok([...mergedModule.grammar, ...mergedModule.readings, ...mergedModule.listening].every((item) => item.prerequisiteIds.every((id) => itemIds.has(id))));
  assert.ok(mergedModule.grammar.every((item) => item.meaning && item.formation && item.intuition && item.examples.length >= 2 && item.commonMistakes.length >= 2));
  assert.ok(mergedModule.kanji.every((item) => item.usefulWords.length >= 1));
  assert.ok(mergedModule.vocabulary.every((item) => item.exampleSentences.length >= 1 && item.collocations.length >= 1));
  assert.ok(mergedModule.grammarContrasts.every((contrast) => contrast.grammarPointIds.length >= 1 && contrast.examples.length >= 2));
  const listeningTypes = new Set(mergedModule.listening.flatMap((item) => item.questions.map((question) => question.questionType)));
  assert.ok(["task-based response", "key point", "verbal expression", "quick response"].every((type) => listeningTypes.has(type)));
});

test("the deployable Studio review package keeps the staged records", async () => {
  const compressed = await readFile(new URL("../data/staging/kizashi-n5-source-review.json.gz", import.meta.url));
  const staged = JSON.parse(gunzipSync(compressed));
  assert.ok(staged.vocabulary.length > 7000);
  assert.ok(staged.kanji.length > 600);
  assert.ok(staged.grammar.length > 400);
});

test("kanji orthography prompts test the reading instead of visual matching", async () => {
  const questions = await readFile(new URL("../lib/questions.ts", import.meta.url), "utf8");
  assert.match(questions, /Which word is read \$\{word\.reading\}\?/);
  assert.doesNotMatch(questions, /Which written word uses \$\{item\.character\}\?/);
  assert.equal(authoredQuestions.find((question) => question.id === "kanji-byou-word")?.prompt, "Which word is read びょういん?");
});

test("original context coverage is long enough and stays linked", () => {
  const items = ["vocabulary", "kanji", "grammar", "readings", "listening"].flatMap((category) => mergedModule[category]);
  const itemIds = new Set(items.map((item) => item.id));
  const topics = new Set(items.map((item) => item.subcategory));
  assert.ok(["daily actions", "shopping", "places", "school", "health", "time"].every((topic) => topics.has(topic)));
  assert.ok(mergedModule.readings.every((reading) => reading.passage.length >= 35 && reading.questions.length >= 2));
  assert.ok(mergedModule.readings.every((reading) => [...reading.vocabularyIds, ...reading.grammarIds, ...reading.kanjiIds].every((id) => itemIds.has(id))));
  assert.ok(mergedModule.listening.every((listening) => listening.transcript.length >= 30 && listening.questions.length >= 2));
  assert.ok(authoredQuestions.every((question) => itemIds.has(question.itemId)));
});

test("database seed includes RLS and all user-owned foundations", async () => {
  const schema = await readFile(new URL("../supabase/migrations/0001_michi_foundation.sql", import.meta.url), "utf8");
  for (const table of ["user_item_progress", "reviews", "review_history", "mistakes", "notes", "study_sessions", "study_events"]) {
    assert.match(schema, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(schema, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(schema, new RegExp(`users manage .* on public\\.${table}`));
  }
  assert.match(schema, /auth\.uid\(\)\) = user_id/);
});

test("schema repair migration covers a stale migration history", async () => {
  const repair = await readFile(new URL("../supabase/migrations/0016_repair_schema.sql", import.meta.url), "utf8");
  for (const table of ["courses", "learning_items", "practice_questions", "sync_snapshots"]) {
    assert.match(repair, new RegExp(`create table if not exists public\\.${table}`));
  }
  assert.match(repair, /add column if not exists review_status/);
  assert.match(repair, /drop policy if exists "public read courses"/);
});

test("seed grammar contrast exercises close their PostgreSQL array literals", async () => {
  const seed = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
  const firstContrastBlock = seed.slice(seed.indexOf("insert into public.grammar_contrasts"), seed.indexOf("on conflict (id) do nothing;", seed.indexOf("insert into public.grammar_contrasts")));
  const rows = firstContrastBlock.split("\n").filter((line) => /^\s+\('contrast-/.test(line));
  assert.equal(rows.length, 8);
  assert.ok(rows.every((line) => /}'\),?$/.test(line)));
});

test("seed staged payloads insert parent learning items before child rows", async () => {
  const seed = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
  const parentImports = seed.split("\n").filter((line) => line.includes("from jsonb_to_recordset((payload->'vocabulary'"));
  assert.equal(parentImports.length, 2);
  assert.ok(parentImports.every((line) => line.includes("(payload->'vocabulary') || (payload->'kanji')")));
});

test("ranks incomplete high-value source records before complete low-value records", () => {
  const items = [
    { id: "complete", category: "vocabulary", reviewStatus: "pending", jlptLevel: "N5", difficulty: 2, tags: ["source-review"], sourceIds: ["jmdict"], exampleSentences: [{ japanese: "駅です。", translation: "It is a station." }], collocations: ["駅に行く"] },
    { id: "weak", category: "vocabulary", reviewStatus: "pending", jlptLevel: "N5", difficulty: 2, tags: ["source-review"], sourceIds: ["jmdict"], exampleSentences: [], collocations: [] },
    { id: "bridge", category: "vocabulary", reviewStatus: "pending", jlptLevel: "N4", difficulty: 3, tags: ["source-review"], sourceIds: ["jmdict"], exampleSentences: [{ japanese: "住所を書きます。", translation: "I write an address." }], collocations: ["住所を書く"] },
  ];

  assert.deepEqual(
    rankContentCandidates(items, { weak: { attempts: 4, correct: 1 } }, {}, 3).map((item) => item.id),
    ["weak", "complete", "bridge"],
  );
});

test("content priority includes frequency and prerequisite value", () => {
  const common = { id: "common", category: "vocabulary", jlptLevel: "N5", difficulty: 2, tags: [], prerequisiteIds: [], frequency: 1000, commonness: 1, exampleSentences: [{ japanese: "駅です。", translation: "It is a station." }], collocations: ["駅に行く"] };
  const rare = { id: "rare", category: "vocabulary", jlptLevel: "N5", difficulty: 2, tags: [], prerequisiteIds: [], frequency: 10, commonness: 5, exampleSentences: [{ japanese: "駅です。", translation: "It is a station." }], collocations: ["駅に行く"] };
  assert.ok(getItemPriority(common).score > getItemPriority(rare).score);
});

test("weak practice prioritizes recurring question-type mistakes", () => {
  const questions = [
    { id: "grammar-context", itemId: "grammar-ni", questionType: "grammar in context" },
    { id: "grammar-completion", itemId: "grammar-ni", questionType: "sentence completion" },
    { id: "vocabulary", itemId: "vocab-eki", questionType: "meaning" },
  ];
  const selected = selectWeakPracticeQuestions(questions, {
    "grammar-ni": { itemId: "grammar-ni", attempts: 4, correct: 1 },
    "vocab-eki": { itemId: "vocab-eki", attempts: 2, correct: 0 },
  }, {
    "grammar-ni": { itemId: "grammar-ni", count: 3, questionTypes: { "sentence completion": 3 } },
  });
  assert.deepEqual(selected.map((question) => question.id), ["grammar-completion", "grammar-context", "vocabulary"]);
});

test("SQL export refuses an approved source record without a real Journey lesson", async () => {
  await assert.rejects(
    execFileAsync("python3", ["scripts/render_supabase_content_sql.py", "--approved", "--package", "test/fixtures/unassigned-approved-package.json", "--output", "/dev/null"]),
    /assigned to a real Journey lesson/,
  );
});

test("content QA reports review blockers instead of silently publishing them", async () => {
  await assert.rejects(
    execFileAsync("python3", ["scripts/qa_content_package.py", "--package", "test/fixtures/unassigned-approved-package.json", "--strict"]),
    /review blockers/,
  );
});

test("content QA requires classification only for imported source-review records", async () => {
  const { stdout } = await execFileAsync("python3", ["scripts/qa_content_package.py", "--package", "test/fixtures/unassigned-approved-package.json"]);
  const report = JSON.parse(stdout);
  const blockers = report.blockers.join("\n");
  assert.match(blockers, /vocab-test: approved source-review item is not assigned to a real Journey lesson/);
  assert.doesNotMatch(blockers, /vocab-curated: missing reviewed curriculum classification/);
});

test("book extraction keeps candidates review-only and records page provenance", async () => {
  const { stdout } = await execFileAsync("python3", ["scripts/extract_book_candidates.py", "--input", "test/fixtures/book-notes.txt", "--book-id", "test-book", "--dry-run"]);
  assert.match(stdout, /"vocabulary": 2/);
  assert.match(stdout, /"page": 1/);
});

test("JMnedict ingestion keeps names outside the learner vocabulary", async () => {
  const { stdout } = await execFileAsync("python3", ["scripts/ingest_jmnedict.py", "--input", "test/fixtures/jmnedict.xml", "--dry-run"]);
  assert.match(stdout, /"properNames": 1/);
});

test("AI generation requires an admin and a canonical target", () => {
  const base = { apiKey: "test-key", now: 10_000, lastGeneratedAt: 0, body: { itemId: "vocab-eki", questionType: "meaning", item: { id: "vocab-eki", category: "grammar" } }, knownItemIds: new Set(["vocab-eki"]) };
  assert.equal(validateGenerationRequest({ ...base, authenticated: false, admin: false }).status, 401);
  assert.equal(validateGenerationRequest({ ...base, authenticated: true, admin: false }).status, 403);
  assert.equal(validateGenerationRequest({ ...base, authenticated: true, admin: true, body: { ...base.body, itemId: "forged", item: { id: "forged", category: "vocabulary" } }, knownItemIds: new Set(["vocab-eki"]) }).status, 404);
  assert.equal(validateGenerationRequest({ ...base, authenticated: true, admin: true, now: 2_000, lastGeneratedAt: 1_000 }).status, 429);
});

test("generated content carries draft-only review metadata", () => {
  const review = generatedReview("test-model", "vocab-eki", "2026-08-30T00:00:00.000Z");
  assert.deepEqual(review, {
    status: "draft",
    generatedBy: "openrouter:test-model",
    model: "test-model",
    generatedAt: "2026-08-30T00:00:00.000Z",
    targetItemIds: ["vocab-eki"],
    validationIssues: [],
    reviewNotes: "",
  });
});

test("Studio exposes review metadata and never trusts a client curriculum item", async () => {
  const route = await readFile(new URL("../app/api/content/generate/route.ts", import.meta.url), "utf8");
  const reviewRoute = await readFile(new URL("../app/api/content/review-package/route.ts", import.meta.url), "utf8");
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(route, /isAdminUser/);
  assert.doesNotMatch(route, /requestedItem\(body\.item/);
  assert.match(reviewRoute, /Content-Encoding/);
  assert.match(reviewRoute, /isAdminUser/);
  assert.match(studio, /\/api\/content\/review-package/);
  assert.match(studio, /Review notes/);
  assert.match(studio, /reviewedBy/);
});
