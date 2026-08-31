import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { draftStorageMode, LARGE_DRAFT_THRESHOLD } from "../lib/content-draft-storage.js";
import { gunzipSync } from "node:zlib";

import { getItemPriority, rankContentCandidates } from "../lib/content-priority.js";
import { generatedReview, validateGenerationRequest } from "../lib/content-generation-core.js";
import { selectWeakPracticeQuestions } from "../lib/weak-practice.js";

const execFileAsync = promisify(execFile);

test("large review drafts use the browser's larger storage path", () => {
  assert.equal(draftStorageMode("x".repeat(LARGE_DRAFT_THRESHOLD)), "localStorage");
  assert.equal(draftStorageMode("x".repeat(LARGE_DRAFT_THRESHOLD + 1)), "indexedDB");
});

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

test("Studio loads the large review package through an admin-only compressed endpoint", async () => {
  const page = await readFile(new URL("../app/(main)/studio/page.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/content/review-package/route.ts", import.meta.url), "utf8");
  assert.match(page, /const module = n5Module/);
  assert.match(route, /getAllowedUser/);
  assert.match(route, /user\.isAdmin/);
  assert.match(route, /Content-Encoding.*gzip/s);
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(studio, /setRaw\(JSON\.stringify\(next, null, 2\)\)/);
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

test("audio metadata is persisted without an audio blob", async () => {
  const migration = await readFile(new URL("../supabase/migrations/0018_audio_metadata.sql", import.meta.url), "utf8");
  const types = await readFile(new URL("../lib/types.ts", import.meta.url), "utf8");
  const renderer = await readFile(new URL("../scripts/render_supabase_content_sql.py", import.meta.url), "utf8");
  assert.match(migration, /audio_metadata jsonb/);
  assert.match(migration, /browser-speech.*remote.*server-tts/s);
  assert.match(types, /interface AudioMetadata/);
  assert.match(renderer, /audio_metadata/);
  assert.doesNotMatch(migration, /bytea|blob/i);
});

test("I-JAS remains aggregate-only through Supabase and SQL export", async () => {
  const migration = await readFile(new URL("../supabase/migrations/0019_ijas_aggregates.sql", import.meta.url), "utf8");
  const types = await readFile(new URL("../lib/types.ts", import.meta.url), "utf8");
  const content = await readFile(new URL("../lib/supabase/content.ts", import.meta.url), "utf8");
  const renderer = await readFile(new URL("../scripts/render_supabase_content_sql.py", import.meta.url), "utf8");
  assert.match(migration, /create table if not exists public\.learner_error_aggregates/);
  assert.match(types, /learner_error_aggregates/);
  assert.match(content, /from\("learner_error_aggregates"\)/);
  assert.match(renderer, /learner_error_aggregates/);
  assert.doesNotMatch(migration, /learner_id|user_id|transcript|audio_url/i);
});

test("approved package export carries only I-JAS aggregate signals", async () => {
  const directory = await mkdtemp("/tmp/kizashi-ijas-sql-test-");
  const packagePath = `${directory}/package.json`;
  const outputPath = `${directory}/content.sql`;
  try {
    const packageData = JSON.parse(await readFile(new URL("../test/fixtures/unassigned-approved-package.json", import.meta.url), "utf8"));
    packageData.course.chapters[0].lessons[0].itemIds.push("vocab-test");
    packageData.sourceManifest[0].license = "Test-only license note";
    packageData.learnerErrorAggregates = [{ pattern: "に", category: "location-vs-action", count: 12, sourceReference: "I-JAS aggregate review" }];
    await writeFile(packagePath, JSON.stringify(packageData), "utf8");
    await execFileAsync("python3", ["scripts/render_supabase_content_sql.py", "--approved", "--package", packagePath, "--output", outputPath]);
    const sql = await readFile(outputPath, "utf8");
    assert.match(sql, /insert into public\.learner_error_aggregates/);
    assert.match(sql, /location-vs-action/);
    const aggregateStatement = sql.slice(sql.indexOf("insert into public.learner_error_aggregates"), sql.indexOf(";", sql.indexOf("insert into public.learner_error_aggregates")));
    assert.doesNotMatch(aggregateStatement, /learner_id|user_id|transcript|audio_url/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
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
  const parentImports = [...seed.matchAll(/select item\.id, item\.id, item\.category[\s\S]{0,800}?from jsonb_to_recordset\(\(payload->'vocabulary'/g)].map(([match]) => match);
  assert.equal(parentImports.length, 2);
  assert.ok(parentImports.every((line) => line.includes("select item.id, item.id, item.category")));
  assert.equal((seed.match(/\(payload->'vocabulary'\) \|\| \(payload->'kanji'\) \|\| \(payload->'grammar'\) \|\| \(payload->'readings'\) \|\| \(payload->'listening'\)/g) ?? []).length, 2);
});

test("seed learning-item slugs are globally unique", async () => {
  const seed = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
  const blocks = [...seed.matchAll(/insert into public\.learning_items[\s\S]*?on conflict \(id\) do nothing;/g)].map(([match]) => match);
  const slugs = blocks.flatMap((block) => [...block.matchAll(/\(\s*'[^']+',\s*'([^']+)',\s*'(?:vocabulary|kanji|grammar|reading|listening)'/g)].map(([, slug]) => slug));
  assert.equal(new Set(slugs).size, slugs.length);
});

test("seed creates the curated source before provenance references it", async () => {
  const seed = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
  const sourceInsert = seed.indexOf("insert into public.content_sources");
  const firstReference = seed.indexOf("insert into public.learning_item_sources");
  assert.ok(sourceInsert >= 0 && sourceInsert < firstReference);
  assert.match(seed.slice(sourceInsert, firstReference), /michi-curated-n5-seed/);
});

test("AI content generation stays allowlisted, rate-limited, and draft-only", async () => {
  const route = await readFile(new URL("../app/api/content/generate/route.ts", import.meta.url), "utf8");
  const validation = await readFile(new URL("../lib/content-validation.ts", import.meta.url), "utf8");
  assert.match(route, /const user = await getAllowedUser\(\);\s+if \(!user\).*status: 401/s);
  assert.match(route, /if \(!user\.isAdmin\).*status: 403/s);
  assert.match(route, /lastGeneratedAt/);
  assert.match(route, /stringValue\(value\.id\) !== itemId/);
  assert.match(route, /value\.reviewStatus !== undefined && value\.reviewStatus !== "approved"/);
  assert.match(route, /source-review/);
  assert.match(route, /validationStatus: "generated"/);
  assert.match(route, /generatedReview\(model, item\.id\)/);
  assert.match(validation, /generatedBy.*openrouter/);
  assert.match(validation, /review.*approved/);
});

test("practice coverage checks every item and normalizes JLPT family aliases", async () => {
  const questions = await readFile(new URL("../lib/questions.ts", import.meta.url), "utf8");
  const validation = await readFile(new URL("../lib/content-validation.ts", import.meta.url), "utf8");
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(questions, /getN5PracticeCoverage/);
  assert.match(questions, /sentence completion.*sentence composition/);
  assert.match(validation, /practiceQuestionTypes/);
  assert.match(studio, /N5 practice coverage/);
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

test("SQL export refuses an approved source record without license terms", async () => {
  const directory = await mkdtemp("/tmp/kizashi-unlicensed-package-");
  const packagePath = `${directory}/package.json`;
  try {
    const packageData = JSON.parse(await readFile(new URL("../test/fixtures/unassigned-approved-package.json", import.meta.url), "utf8"));
    packageData.course.chapters[0].lessons[0].itemIds.push("vocab-test");
    await writeFile(packagePath, JSON.stringify(packageData), "utf8");
    await assert.rejects(
      execFileAsync("python3", ["scripts/render_supabase_content_sql.py", "--approved", "--package", packagePath, "--output", `${directory}/content.sql`]),
      /license terms/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQL export refuses validated AI questions without human approval", async () => {
  const directory = await mkdtemp("/tmp/kizashi-unreviewed-question-");
  const packagePath = `${directory}/package.json`;
  const questionsPath = `${directory}/questions.json`;
  try {
    const packageData = JSON.parse(await readFile(new URL("../test/fixtures/unassigned-approved-package.json", import.meta.url), "utf8"));
    packageData.course.chapters[0].lessons[0].itemIds.push("vocab-test");
    packageData.sourceManifest[0].license = "Test-only license note";
    const question = { id: "ai-vocab-test", itemId: "vocab-test", category: "vocabulary", questionType: "meaning", jlptLevel: "N5", prompt: "What does 駅 mean?", options: ["station", "school"], correctIndex: 0, explanation: "駅 means station.", validationStatus: "validated", generatedBy: "openrouter:test-model", review: { status: "draft" } };
    await writeFile(packagePath, JSON.stringify(packageData), "utf8");
    await writeFile(questionsPath, JSON.stringify([question]), "utf8");
    await assert.rejects(
      execFileAsync("python3", ["scripts/render_supabase_content_sql.py", "--approved", "--package", packagePath, "--questions", questionsPath, "--output", `${directory}/content.sql`]),
      /human approval/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQL export refuses any non-validated question instead of dropping it", async () => {
  const directory = await mkdtemp("/tmp/kizashi-unvalidated-question-");
  const packagePath = `${directory}/package.json`;
  const questionsPath = `${directory}/questions.json`;
  try {
    const packageData = JSON.parse(await readFile(new URL("../test/fixtures/unassigned-approved-package.json", import.meta.url), "utf8"));
    packageData.course.chapters[0].lessons[0].itemIds.push("vocab-test");
    packageData.sourceManifest[0].license = "Test-only license note";
    const question = { id: "draft-vocab-test", itemId: "vocab-test", category: "vocabulary", questionType: "meaning", jlptLevel: "N5", prompt: "What does 駅 mean?", options: ["station", "school"], correctIndex: 0, explanation: "駅 means station.", validationStatus: "generated", generatedBy: "michi-question-factory" };
    await writeFile(packagePath, JSON.stringify(packageData), "utf8");
    await writeFile(questionsPath, JSON.stringify([question]), "utf8");
    await assert.rejects(
      execFileAsync("python3", ["scripts/render_supabase_content_sql.py", "--approved", "--package", packagePath, "--questions", questionsPath, "--output", `${directory}/content.sql`]),
      /not approved/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("frequency fields are represented in the model, editor, database, and SQL export", async () => {
  const types = await readFile(new URL("../lib/types.ts", import.meta.url), "utf8");
  const editor = await readFile(new URL("../components/content/content-record-editor.tsx", import.meta.url), "utf8");
  const migration = await readFile(new URL("../supabase/migrations/0017_spoken_frequency.sql", import.meta.url), "utf8");
  const renderer = await readFile(new URL("../scripts/render_supabase_content_sql.py", import.meta.url), "utf8");
  assert.match(types, /spokenFrequency\?: number/);
  assert.match(editor, /Spoken frequency/);
  assert.match(migration, /add column if not exists spoken_frequency integer/);
  assert.match(renderer, /spoken_frequency/);
});

test("content QA reports review blockers instead of silently publishing them", async () => {
  await assert.rejects(
    execFileAsync("python3", ["scripts/qa_content_package.py", "--package", "test/fixtures/unassigned-approved-package.json", "--strict"]),
    /review blockers/,
  );
});

test("content QA blocks a staged package with no approved source-review records", async () => {
  const { stdout } = await execFileAsync("python3", ["scripts/qa_content_package.py", "--package", "data/staging/kizashi-n5-source-review.json"]);
  const report = JSON.parse(stdout);
  assert.equal(report.status, "blocked");
  assert.match(report.blockers.join("\n"), /No approved source-review items found/);
});

test("content QA requires classification only for imported source-review records", async () => {
  const { stdout } = await execFileAsync("python3", ["scripts/qa_content_package.py", "--package", "test/fixtures/unassigned-approved-package.json"]);
  const report = JSON.parse(stdout);
  const blockers = report.blockers.join("\n");
  assert.match(blockers, /vocab-test: approved source-review item is not assigned to a real Journey lesson/);
  assert.match(blockers, /vocab-test: source test-source has no recorded license terms/);
  assert.doesNotMatch(blockers, /vocab-curated: missing reviewed curriculum classification/);
});

test("content QA and SQL export reject unresolved classification conflicts", async () => {
  const directory = await mkdtemp("/tmp/kizashi-conflict-test-");
  const packagePath = `${directory}/package.json`;
  const outputPath = `${directory}/content.sql`;
  try {
    const packageData = JSON.parse(await readFile(new URL("../test/fixtures/unassigned-approved-package.json", import.meta.url), "utf8"));
    packageData.course.chapters[0].lessons[0].itemIds.push("vocab-test");
    packageData.sourceManifest[0].license = "Test-only license note";
    packageData.vocabulary.find((item) => item.id === "vocab-test").classification.conflict = true;
    await writeFile(packagePath, JSON.stringify(packageData), "utf8");
    const { stdout } = await execFileAsync("python3", ["scripts/qa_content_package.py", "--package", packagePath]);
    assert.match(stdout, /vocab-test: curriculum classification has conflicting source levels/);
    await assert.rejects(
      execFileAsync("python3", ["scripts/render_supabase_content_sql.py", "--approved", "--package", packagePath, "--output", outputPath]),
      /conflicting source levels/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("book extraction keeps candidates review-only and records page provenance", async () => {
  const { stdout } = await execFileAsync("python3", ["scripts/extract_book_candidates.py", "--input", "test/fixtures/book-notes.txt", "--book-id", "test-book", "--dry-run"]);
  assert.match(stdout, /"vocabulary": 2/);
  assert.match(stdout, /"page": 1/);
});

test("book extraction fails clearly when a scanned book has no text layer", async () => {
  const directory = await mkdtemp("/tmp/kizashi-empty-book-");
  const input = `${directory}/empty.txt`;
  await writeFile(input, "", "utf8");
  await assert.rejects(
    execFileAsync("python3", ["scripts/extract_book_candidates.py", "--input", input, "--book-id", "empty-book", "--dry-run"]),
    /No extractable text/,
  );
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

test("Studio exposes review metadata and validates staged curriculum items", async () => {
  const route = await readFile(new URL("../app/api/content/generate/route.ts", import.meta.url), "utf8");
  const reviewRoute = await readFile(new URL("../app/api/content/review-package/route.ts", import.meta.url), "utf8");
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(route, /isAdminUser/);
  assert.match(route, /requestedItem\(body\.item/);
  assert.match(reviewRoute, /Content-Encoding/);
  assert.match(reviewRoute, /user\.isAdmin/);
  assert.match(studio, /\/api\/content\/review-package/);
  assert.match(studio, /Review notes/);
  assert.match(studio, /reviewedBy/);
  assert.match(studio, /question\.review\?\.status !== "approved"/);
});

test("offline worker caches recorded audio without caching arbitrary cross-origin requests", async () => {
  const worker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(worker, /event\.request\.destination === "audio"/);
  assert.match(worker, /response\.type === "opaque"/);
  assert.match(worker, /new URL\(event\.request\.url\)\.origin !== self\.location\.origin/);
});
