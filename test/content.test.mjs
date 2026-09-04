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
import { releaseForLearners } from "../lib/content-release.js";
import { fetchWithTimeout } from "../lib/request-timeout.js";
import { preservePracticePosition } from "../lib/practice-session-core.js";
import { getContentCompleteness } from "../lib/content-completeness-core.js";
import { buildContentQualityReport } from "../lib/content-quality-core.js";

const execFileAsync = promisify(execFile);

test("large review drafts use the browser's larger storage path", () => {
  assert.equal(draftStorageMode("x".repeat(LARGE_DRAFT_THRESHOLD)), "localStorage");
  assert.equal(draftStorageMode("x".repeat(LARGE_DRAFT_THRESHOLD + 1)), "indexedDB");
});

test("shared request timeout aborts a stalled upstream request", async () => {
  await assert.rejects(
    fetchWithTimeout("https://example.test", {}, 5, (_input, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    })),
    { name: "AbortError" },
  );
});

test("tab content loading is bounded and shared", async () => {
  const hook = await readFile(new URL("../components/content/use-content-module.ts", import.meta.url), "utf8");
  const worker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const supabaseFiles = await Promise.all([
    readFile(new URL("../lib/supabase/browser.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/server.ts", import.meta.url), "utf8"),
    readFile(new URL("../middleware.ts", import.meta.url), "utf8"),
  ]);
  assert.match(hook, /fetchWithTimeout/);
  assert.match(hook, /modulePromise/);
  assert.match(hook, /mergeGrammar/);
  assert.match(hook, /aliases: item\.aliases\?\.length \? item\.aliases : fallbackItem\.aliases/);
  assert.match(worker, /_next\//);
  assert.match(worker, /\/api\//);
  assert.ok(supabaseFiles.every((source) => /fetchWithTimeout/u.test(source)));
});

test("practice navigation reuses validated questions and restores the active tab", async () => {
  const questions = await readFile(new URL("../lib/questions.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/(main)/practice/page.tsx", import.meta.url), "utf8");
  const tabs = await readFile(new URL("../components/practice/practice-mode-tabs.tsx", import.meta.url), "utf8");
  assert.match(questions, /validatedPracticeCache/);
  assert.match(page, /PracticeModeTabs/);
  assert.match(page, /<LazyPractice[\s\S]*key=\{[\s\S]*mode/);
  assert.match(tabs, /scrollIntoView/);
  assert.match(tabs, /aria-label="Practice modes"/);
});

test("practice review names grammar contrast clusters", async () => {
  const player = await readFile(new URL("../components/practice/practice-player.tsx", import.meta.url), "utf8");
  assert.match(player, /const contrastLabel = \(question: PracticeQuestion\)/);
  assert.match(player, /Contrast: \{contrastLabel\(question\)\}/);
  assert.doesNotMatch(player, /void grammarContrasts/);
});

test("completeness dashboard exposes grammar assessment families by level", async () => {
  const dashboard = await readFile(new URL("../components/content/completeness-dashboard.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /grammarAssessment\.byLevel\.N5\.formSelectionContexts/);
  assert.match(dashboard, /grammarAssessment\.byLevel\.N4\.sentenceOrderingContexts/);
  assert.match(dashboard, /grammarAssessment\.byLevel\.N4\.textGrammarContexts/);
  assert.match(dashboard, /grammarConsistency\.duplicateExampleItems/);
  assert.match(dashboard, /vocabularyContract\.contractReady/);
  assert.match(dashboard, /vocabularyContract\.pendingContextualDrafts/);
  assert.match(dashboard, /collocationQuality\.duplicateRows/);
  assert.match(dashboard, /quality\.reading\.byLevel\.N5\.questionFamilies/);
  assert.match(dashboard, /quality\.reading\.lexicalLoad/);
  assert.match(dashboard, /quality\.reading\.distractorSignals/);
  assert.match(dashboard, /quality\.listening\.contextTypes/);
  assert.match(dashboard, /quality\.listening\.complexity/);
  assert.match(dashboard, /quality\.listening\.visualSceneTypes/);
  assert.match(dashboard, /quality\.listening\.byLevel\.N4\.nearDuplicateClusters/);
  assert.doesNotMatch(dashboard, /N5 \$\{report\.quality/);
});

test("question drafts stay out of learner queues until approved", async () => {
  const validation = await readFile(new URL("../lib/content-validation.ts", import.meta.url), "utf8");
  assert.match(validation, /validationStatus === "generated"/);
  assert.match(validation, /generatedBy\?\.startsWith\("openrouter:"\)/);
  assert.match(validation, /review\?\.status === "approved"/);
});

test("vocabulary validation surfaces high-frequency example depth", async () => {
  const validation = await readFile(new URL("../lib/content-validation.ts", import.meta.url), "utf8");
  assert.match(validation, /commonness >= 5/);
  assert.match(validation, /High-frequency vocabulary should have at least two example sentences/);
});

test("grammar validation surfaces missing lesson-contract fields", async () => {
  const validation = await readFile(new URL("../lib/content-validation.ts", import.meta.url), "utf8");
  assert.match(validation, /item\.aliases/);
  assert.match(validation, /item\.context/);
  assert.match(validation, /context\.japanese/);
  assert.match(validation, /dedicated Japanese mini-context/);
});

test("practice defers the question bank until its panel loads", async () => {
  const page = await readFile(new URL("../app/(main)/practice/page.tsx", import.meta.url), "utf8");
  const lazyPractice = await readFile(new URL("../components/practice/lazy-practice.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /getValidatedPracticeQuestions/);
  assert.match(page, /LazyPractice/);
  assert.match(lazyPractice, /dynamic/);
  assert.match(lazyPractice, /ssr:\s*false/);
});

test("practice query changes rebuild the queue without restarting it", async () => {
  const page = await readFile(new URL("../app/(main)/practice/page.tsx", import.meta.url), "utf8");
  const player = await readFile(new URL("../components/practice/practice-player.tsx", import.meta.url), "utf8");
  assert.match(page, /export const dynamic = ["']force-dynamic["']/);
  assert.match(player, /preservePracticePosition/);
  assert.equal(preservePracticePosition(["a", "b", "c"], 1, ["x", "b", "y"]), 1);
  assert.equal(preservePracticePosition(["a", "b", "c"], 1, ["x"]), 0);
});

test("opted-in account sync stays mounted across route changes", async () => {
  const shell = await readFile(new URL("../components/shell/app-shell.tsx", import.meta.url), "utf8");
  const sync = await readFile(new URL("../components/profile/account-sync.tsx", import.meta.url), "utf8");
  const profile = await readFile(new URL("../app/(main)/profile/page.tsx", import.meta.url), "utf8");
  assert.match(shell, /AccountSync/);
  assert.match(shell, /visible=\{pathname === "\/profile"\}/);
  assert.match(sync, /visible\?/);
  assert.match(sync, /sync\(true\)/);
  assert.doesNotMatch(profile, /AccountSync/);
});

test("shell background follows the resolved Journey visual asset", async () => {
  const shell = await readFile(new URL("../components/shell/app-shell.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(shell, /--world-shell.*visualAssets\.shell/);
  assert.match(css, /var\(--world-shell, url\("\/site-atmosphere\.png"\)\)/);
});

const moduleData = JSON.parse(await readFile(new URL("../data/n5-foundations.json", import.meta.url), "utf8"));
const expansionData = await Promise.all(["n5-conversation-expansion.json", "n5-practical-expansion.json", "n5-life-expansion.json", "n4-grammar-expansion.json"].map(async (file) => JSON.parse(await readFile(new URL(`../data/${file}`, import.meta.url), "utf8"))));
const authoredQuestions = JSON.parse(await readFile(new URL("../data/n5-authored-practice.json", import.meta.url), "utf8"));
const grammarDrafts = JSON.parse(await readFile(new URL("../data/n5-grammar-assessment-drafts.json", import.meta.url), "utf8"));
const vocabularyDrafts = JSON.parse(await readFile(new URL("../data/vocabulary-assessment-drafts.json", import.meta.url), "utf8"));
const vocabularyExampleExpansions = JSON.parse(await readFile(new URL("../data/vocabulary-example-expansions.json", import.meta.url), "utf8"));
const originalListening = JSON.parse(await readFile(new URL("../data/original-listening-bank.json", import.meta.url), "utf8"));
const originalReading = JSON.parse(await readFile(new URL("../data/original-reading-bank.json", import.meta.url), "utf8"));
const mergedModule = {
  ...moduleData,
  course: { ...moduleData.course, chapters: [moduleData, ...expansionData].flatMap((module) => module.course.chapters) },
  vocabulary: [moduleData, ...expansionData].flatMap((module) => module.vocabulary).map((item) => ({ ...item, exampleSentences: [...item.exampleSentences, ...(vocabularyExampleExpansions[item.id] ?? [])] })),
  kanji: [moduleData, ...expansionData].flatMap((module) => module.kanji),
  grammar: [moduleData, ...expansionData].flatMap((module) => module.grammar),
  grammarContrasts: [moduleData, ...expansionData].flatMap((module) => module.grammarContrasts),
  readings: [moduleData, ...expansionData].flatMap((module) => module.readings),
  listening: [moduleData, ...expansionData].flatMap((module) => module.listening),
  practiceQuestions: [...authoredQuestions, ...grammarDrafts],
};

test("the N5 module has meaningful, linked content", async () => {
  assert.ok(mergedModule.vocabulary.length >= 150);
  assert.ok(mergedModule.kanji.length >= 80);
  assert.ok(mergedModule.grammar.length >= 50);
  assert.ok(["grammar-koto-ni-suru", "grammar-zuni", "grammar-sou-appearance", "grammar-tsumori", "grammar-te-ageru", "grammar-te-oku", "grammar-te-kureru", "grammar-te-shimau", "grammar-te-miru", "grammar-te-morau", "grammar-te-iku", "grammar-te-kuru", "grammar-ni-chigai-nai", "grammar-ni-kimatte-iru", "grammar-mitai", "grammar-rashii", "grammar-wake-ni-wa-ikanai", "grammar-sugiru", "grammar-chu", "grammar-kata"].every((id) => mergedModule.grammar.some((item) => item.id === id)));
  const n4ExpansionGrammar = expansionData.find((data) => data.course.id === "n4-grammar-expansion").grammar;
  const n4ExpansionLessonIds = new Set(expansionData.find((data) => data.course.id === "n4-grammar-expansion").course.chapters.flatMap((chapter) => chapter.lessons).flatMap((lesson) => lesson.itemIds));
  assert.equal(n4ExpansionGrammar.length, 65);
  assert.ok(["grammar-to-conditional", "grammar-tara", "grammar-ba", "grammar-nara", "grammar-potential-godan", "grammar-potential-ichidan", "grammar-koto-ga-dekiru", "grammar-passive-godan", "grammar-passive-ichidan", "grammar-causative-godan", "grammar-causative-ichidan", "grammar-volitional", "grammar-giving-receiving", "grammar-te-aru", "grammar-te-ita", "grammar-youni-naru", "grammar-youni-suru", "grammar-koto-ni-naru", "grammar-yotei", "grammar-sou-hearsay", "grammar-youda", "grammar-kamoshirenai", "grammar-hazu", "grammar-to-omou", "grammar-to-iu", "grammar-to-kiku", "grammar-to-iu-noun", "grammar-koto-nominalization", "grammar-no-nominalization", "grammar-koto-ga-aru", "grammar-noni", "grammar-temo", "grammar-shi", "grammar-sore-ni", "grammar-soredemo", "grammar-keredomo", "grammar-aida", "grammar-aida-ni", "grammar-tokoro", "grammar-teiru-tokoro", "grammar-ta-tokoro", "grammar-bakari", "grammar-yasui", "grammar-nikui", "grammar-zurai"].every((id) => n4ExpansionGrammar.some((item) => item.id === id)));
  assert.ok(n4ExpansionGrammar.every((item) => n4ExpansionLessonIds.has(item.id)));
  assert.ok(n4ExpansionGrammar.every((item) => item.examples.length >= 4 && item.examples.every((example) => typeof example.japanese === "string" && typeof example.translation === "string")));
  const authoredQuestionIds = new Set(authoredQuestions.map((question) => question.id));
  assert.ok(n4ExpansionGrammar.every((item) => item.practiceQuestionIds.length >= 2 && item.practiceQuestionIds.every((id) => authoredQuestionIds.has(id))));
  const transitivityIds = ["vocab-aku", "vocab-akeru", "vocab-shimaru", "vocab-shimeru", "vocab-hajimaru", "vocab-hajimeru", "vocab-tomaru", "vocab-tomeru"];
  assert.ok(transitivityIds.every((id) => n4ExpansionLessonIds.has(id)));
  assert.ok(transitivityIds.every((id) => /[自他]動詞/u.test(mergedModule.vocabulary.find((item) => item.id === id)?.notes ?? "") && mergedModule.vocabulary.find((item) => item.id === id)?.relatedWords.length === 1));
  const n4LifeGrammar = expansionData.find((data) => data.course.chapters.some((chapter) => chapter.id === "chapter-life-and-seasons")).grammar.filter((item) => item.jlptLevel === "N4");
  assert.equal(n4LifeGrammar.length, 5);
  assert.ok(n4LifeGrammar.every((item) => item.examples.length >= 4));
  const n5Grammar = mergedModule.grammar.filter((item) => item.jlptLevel === "N5");
  const n5GrammarQuestionIds = new Set(authoredQuestions.filter((question) => question.category === "grammar" && question.jlptLevel === "N5").map((question) => question.id));
  assert.equal(n5Grammar.length, 46);
  assert.ok(["grammar-ga-but", "grammar-ta-koto", "grammar-deshita", "grammar-dewa-arimasen", "grammar-nakutemo-ii", "grammar-nakereba-naranai"].every((id) => n5Grammar.some((item) => item.id === id)));
  assert.ok(n5Grammar.every((item) => item.examples.length >= 4 && item.commonMistakes.length >= 2 && item.practiceQuestionIds.length >= 2 && item.practiceQuestionIds.every((id) => n5GrammarQuestionIds.has(id))));
  const n4Vocabulary = mergedModule.vocabulary.filter((item) => item.jlptLevel === "N4");
  assert.equal(n4Vocabulary.length, 16);
  assert.ok(n4Vocabulary.every((item) => item.usageAssessment?.correct && item.usageAssessment.distractors.length === 3));
  const questionFactory = await readFile(new URL("../lib/questions.ts", import.meta.url), "utf8");
  assert.match(questionFactory, /questionType: "usage"/);
  assert.ok(["contrast-n4-te-direction", "contrast-n4-benefit-perspective", "contrast-n4-inference", "contrast-n4-change-habit-decision", "contrast-n4-quotation-thought", "contrast-n4-nominalization-capability", "contrast-n4-contrast-conjunction", "contrast-n4-time-aspect", "contrast-n4-ease-difficulty"].every((id) => mergedModule.grammarContrasts.some((contrast) => contrast.id === id)));
  assert.ok(["grammar-te-iku", "grammar-te-kuru", "grammar-te-ageru", "grammar-te-kureru", "grammar-te-morau", "grammar-ni-chigai-nai", "grammar-ni-kimatte-iru", "grammar-mitai", "grammar-rashii"].every((id) => mergedModule.grammar.find((item) => item.id === id)?.contrastIds.length));
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
  const n4GrammarIds = mergedModule.grammar.filter((item) => item.jlptLevel === "N4" && item.id.startsWith("grammar-") && !["grammar-ta-form", "grammar-mae-ni", "grammar-ato-de", "grammar-toki", "grammar-nagara"].includes(item.id)).map((item) => item.id);

  assert.equal(itemIds.size, ["vocabulary", "kanji", "grammar", "readings", "listening"].reduce((total, category) => total + mergedModule[category].length, 0));
  assert.ok(lessonIds.every((id) => itemIds.has(id)));
  assert.ok(n4GrammarIds.every((id) => lessonIds.includes(id)));
  assert.ok(mergedModule.grammar.filter((item) => n4GrammarIds.includes(item.id)).every((item) => item.sourceIds?.some((sourceId) => ["openjlpt", "irodori-sentence-patterns", "michi-authored-n4-grammar"].includes(sourceId))));
  assert.ok([...mergedModule.grammar, ...mergedModule.readings, ...mergedModule.listening].every((item) => item.prerequisiteIds.every((id) => itemIds.has(id))));
  assert.ok(mergedModule.grammar.every((item) => item.meaning && item.formation && item.intuition && item.examples.length >= 2 && item.commonMistakes.length >= 2));
  assert.ok(mergedModule.kanji.every((item) => item.usefulWords.length >= 1));
  assert.ok(mergedModule.vocabulary.every((item) => item.exampleSentences.length >= 1 && item.collocations.length >= 1));
  const authoredN5Kanji = mergedModule.kanji.filter((item) => item.jlptLevel === "N5");
  assert.equal(authoredN5Kanji.length, 81);
  assert.ok(authoredN5Kanji.every((item) => item.usefulWords.length >= 3), "Every authored N5 kanji needs a 3-word teaching set.");
  assert.ok(mergedModule.grammarContrasts.every((contrast) => contrast.grammarPointIds.length >= 1 && contrast.examples.length >= 2));
  const listeningTypes = new Set(mergedModule.listening.flatMap((item) => item.questions.map((question) => question.questionType)));
  assert.ok(["task-based response", "key point", "verbal expression", "quick response"].every((type) => listeningTypes.has(type)));
});

test("original verbal-expression listening items carry visual context", () => {
  const items = originalListening.listening.filter((item) => item.subcategory === "verbal expression");
  assert.ok(items.length >= 4);
  assert.ok(items.every((item) => item.questions.some((question) => question.visualContext)));
});

test("authored listening items persist grammar links", () => {
  assert.ok(originalListening.listening.every((item) => Array.isArray(item.grammarIds) && item.grammarIds.length >= 3));
});

test("authored reading and listening banks expose diversity QA", () => {
  const report = buildContentQualityReport({ readings: originalReading.readings, listening: originalListening.listening });
  assert.deepEqual(report.reading.byLevel, { N5: { total: 60, uniqueTemplates: 60, nearDuplicateClusters: [], questionFamilies: { "information retrieval": 12, "mid-length passage": 18, "short passage detail": 30, "main idea": 5, sequence: 2, reason: 4, "appropriate action": 3 } }, N4: { total: 55, uniqueTemplates: 55, nearDuplicateClusters: [], questionFamilies: { "information retrieval": 15, "mid-length passage": 14, "short passage detail": 26, "appropriate action": 3, reference: 3, reason: 2, "simple inference": 3, "condition detail": 1, "main idea": 1, "task-based response": 1 } } });
  assert.equal(report.reading.nearDuplicateClusters.length, 0);
  assert.deepEqual(report.listening.byLevel, { N5: { total: 80, uniqueTemplates: 80, nearDuplicateClusters: [], questionFamilies: { "task-based response": 20, "key point": 20, "verbal expression": 15, "quick response": 25 } }, N4: { total: 80, uniqueTemplates: 80, nearDuplicateClusters: [], questionFamilies: { "task-based response": 20, "key point": 20, "verbal expression": 15, "quick response": 25 } } });
  assert.equal(report.listening.uniqueTemplates, 160);
  assert.equal(report.listening.sourceTypes.tts, 160);
  assert.equal(report.listening.nearDuplicateClusters.length, 0);
  assert.ok(Object.keys(report.listening.contextTypes).length >= 15);
  assert.equal(Object.values(report.listening.contextTypes).reduce((total, count) => total + count, 0), 160);
  assert.ok(Object.keys(report.listening.visualSceneTypes).length >= 15);
  assert.ok(report.listening.complexity.byLevel.N4.averageLines > report.listening.complexity.byLevel.N5.averageLines);
  assert.equal(report.listening.complexity.byLevel.N4.cueItems, report.listening.complexity.byLevel.N4.total);
  assert.deepEqual(report.listening.dialogueStructure.turnProfiles, { "3 turns / 2 speakers": 80, "4 turns / 2 speakers": 80 });
  assert.deepEqual(report.listening.dialogueStructure.speakerPatterns, { "A-B-A": 80, "A-B-A-B": 80 });
  assert.equal(report.listening.dialogueStructure.answerEchoes, 92);
  assert.ok((report.reading.questionFamilies["main idea"] ?? 0) >= 4);
  assert.ok((report.reading.questionFamilies.sequence ?? 0) >= 2);
  assert.ok((report.reading.questionFamilies.reason ?? 0) >= 5);
  assert.ok((report.reading.questionFamilies["appropriate action"] ?? 0) >= 5);
  assert.ok((report.reading.questionFamilies.reference ?? 0) >= 3);
  assert.ok((report.reading.questionFamilies["simple inference"] ?? 0) >= 3);
  assert.ok(report.reading.answerQuality.questions > report.reading.total);
});

test("information-retrieval readings carry visual formats", async () => {
  const panel = await readFile(new URL("../components/learning/reading-panel.tsx", import.meta.url), "utf8");
  const visualAssets = await readFile(new URL("../lib/learning-visual-assets.ts", import.meta.url), "utf8");
  const retrieval = originalReading.readings.filter((item) => item.subcategory === "information-retrieval");
  assert.equal(retrieval.length, 27);
  assert.ok(retrieval.every((item) => ["notice", "menu", "timetable", "schedule", "sale", "event", "directions", "hotel", "work", "health", "school", "home", "restaurant", "museum", "weather", "delivery", "transport"].includes(item.visualFormat)));
  assert.match(panel, /visualFormat/);
  assert.match(panel, /visualFormatLayouts/);
  assert.match(panel, /data-visual-format/);
  assert.match(panel, /readingVisualAssets/);
  assert.match(visualAssets, /neighborhood-post-office\.webp/);
  assert.match(visualAssets, /clinic-reception\.webp/);
  assert.match(visualAssets, /local-museum\.webp/);
  assert.match(visualAssets, /local-bus-stop\.webp/);
  assert.doesNotMatch(panel, /<svg/);
});

test("visual listening contexts use generated raster assets", async () => {
  const scene = await readFile(new URL("../components/learning/listening-scene.tsx", import.meta.url), "utf8");
  assert.match(scene, /listeningVisualAsset/);
  assert.doesNotMatch(scene, /<svg/);
});

test("learning imagery hides failed assets while retaining accessible content", async () => {
  const [scene, panel] = await Promise.all([
    readFile(new URL("../components/learning/listening-scene.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/learning/reading-panel.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(scene, /onError=\{\(event\) => \{ event\.currentTarget\.hidden = true; \}\}/);
  assert.match(panel, /onError=\{\(event\) => \{ event\.currentTarget\.hidden = true; \}\}/);
});

test("generated learning visuals have centralized provenance metadata", async () => {
  const manifest = await readFile(new URL("../lib/learning-visual-assets.ts", import.meta.url), "utf8");
  assert.match(manifest, /sourceType: "generated-raster"/);
  assert.match(manifest, /license: "Kizashi project asset"/);
  assert.match(manifest, /attribution: "Kizashi generated asset"/);
  assert.match(manifest, /station-help\.webp/);
});

test("grammar contract fields are editable and reviewable", async () => {
  const editor = await readFile(new URL("../components/content/content-record-editor.tsx", import.meta.url), "utf8");
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(editor, /Aliases \/ variants/);
  assert.match(editor, /Mini dialogue\/context/);
  assert.match(studio, /item\.aliases/);
  assert.match(studio, /item\.context/);
});

test("Studio exposes the grammar contract review queue", async () => {
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(studio, /Grammar contract queue/);
  assert.match(studio, /missingGrammarContract/);
  assert.match(studio, /onEdit\("grammar", item\.id\)/);
});

test("quality audit keeps reading and listening families visible by level", () => {
  const report = buildContentQualityReport({
    readings: [{ id: "reading-n5", jlptLevel: "N5", passage: "駅の案内です。", questions: [{ questionType: "information retrieval" }] }, { id: "reading-n4", jlptLevel: "N4", passage: "病院の案内です。", questions: [{ questionType: "mid-length passage" }] }],
    listening: [{ id: "listen-n5", jlptLevel: "N5", transcript: "駅の案内です。", questions: [{ questionType: "quick response" }] }, { id: "listen-n4", jlptLevel: "N4", transcript: "店の案内です。", questions: [{ questionType: "key point" }] }],
  });
  assert.equal(report.reading.byLevel.N5.questionFamilies["information retrieval"], 1);
  assert.equal(report.reading.byLevel.N4.questionFamilies["mid-length passage"], 1);
  assert.equal(report.listening.byLevel.N5.questionFamilies["quick response"], 1);
  assert.equal(report.listening.byLevel.N4.questionFamilies["key point"], 1);
  assert.deepEqual(report.listening.contextTypes, {});
  assert.deepEqual(report.reading.answerQuality, { questions: 2, missingChoices: 2, duplicateChoiceSets: 0, invalidCorrectIndexes: 2 });
  assert.deepEqual(report.listening.answerQuality, { questions: 2, missingChoices: 2, duplicateChoiceSets: 0, invalidCorrectIndexes: 2 });
  assert.equal(report.reading.byLevel.N5.nearDuplicateClusters.length, 0);
  assert.equal(report.listening.byLevel.N4.nearDuplicateClusters.length, 0);
});

test("quality audit exposes lexical load and distractor structure", () => {
  const report = buildContentQualityReport({
    readings: [{ id: "reading", jlptLevel: "N5", passage: "駅です。", vocabularyIds: ["vocab-1", "vocab-2"], grammarIds: ["grammar-1"], kanjiIds: ["kanji-1", "kanji-2", "kanji-3"], questions: [{ options: ["駅", "店", "家", "本"], correctAnswer: 0 }] }],
    listening: [],
  });
  assert.deepEqual(report.reading.lexicalLoad, { vocabulary: { linked: 1, missing: 0, average: 2, min: 2, max: 2 }, grammar: { linked: 1, missing: 0, average: 1, min: 1, max: 1 }, kanji: { linked: 1, missing: 0, average: 3, min: 3, max: 3 } });
  assert.deepEqual(report.reading.distractorSignals, { questions: 1, setsWithBlankDistractors: 0, setsWithDuplicateDistractors: 0, setsWithFewerThan3Distractors: 0 });
  const weak = buildContentQualityReport({ readings: [{ id: "weak-reading", jlptLevel: "N5", passage: "駅です。", questions: [{ options: ["駅", "", "店", "店"], correctAnswer: 0 }] }], listening: [] });
  assert.deepEqual(weak.reading.distractorSignals, { questions: 1, setsWithBlankDistractors: 1, setsWithDuplicateDistractors: 1, setsWithFewerThan3Distractors: 0 });
});

test("answer quality audit catches duplicate and invalid choices", () => {
  const report = buildContentQualityReport({ readings: [{ id: "reading", jlptLevel: "N5", passage: "駅です。", questions: [{ options: ["駅", "駅", "店"], correctAnswer: 3 }] }], listening: [] });
  assert.deepEqual(report.reading.answerQuality, { questions: 1, missingChoices: 0, duplicateChoiceSets: 1, invalidCorrectIndexes: 1 });
});

test("the deployable Studio review package keeps the staged records", async () => {
  const compressed = await readFile(new URL("../data/staging/kizashi-n5-source-review.json.gz", import.meta.url));
  const staged = JSON.parse(gunzipSync(compressed));
  assert.ok(staged.vocabulary.length > 7000);
  assert.ok(staged.kanji.length > 600);
  assert.ok(staged.grammar.length > 400);
});

test("known source extraction errors are retried or merged canonically", async () => {
  const compressed = await readFile(new URL("../data/staging/kizashi-n5-source-review.json.gz", import.meta.url));
  const staged = JSON.parse(gunzipSync(compressed));
  const vocabulary = new Map(staged.vocabulary.map((item) => [item.id, item]));
  assert.equal(vocabulary.has("openjlpt-vocabulary-cd2f86eedfd9"), false);
  assert.equal(vocabulary.has("marugoto-starter-vocab-7ddb68d985db"), false);
  assert.equal(vocabulary.has("marugoto-starter-vocab-cee10e7167df"), false);
  assert.equal(vocabulary.has("marugoto-starter-vocab-0a5e23e8d9b2"), false);
  assert.equal(vocabulary.get("vocab-ikura")?.sourceIds.includes("openjlpt-vocab-n5"), true);
  assert.equal(vocabulary.get("vocab-ikura")?.sourceIds.includes("marugoto-starter-vocab"), true);
  const elementaryOne = [...vocabulary.values()].filter((item) => item.sourceIds?.includes("marugoto-elementary1-vocab"));
  const sumimasen = elementaryOne.find((item) => item.writtenForm === "すみません");
  const arigatou = elementaryOne.find((item) => item.writtenForm === "ありがとう");
  assert.equal(sumimasen?.reading, "すみません");
  assert.equal(arigatou?.reading, "ありがとう");
  assert.equal(sumimasen?.reviewStatus, "pending");
  assert.equal(arigatou?.reviewStatus, "pending");
  assert.equal(staged.vocabulary.some((item) => item.reviewStatus === "rejected"), false);
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

test("learner release keeps source-review status and marks records as not human reviewed", () => {
  const released = releaseForLearners({
    vocabulary: [{ id: "auto", reviewStatus: "pending" }, { id: "rejected", reviewStatus: "rejected" }, { id: "human", reviewStatus: "approved" }],
  }, "2026-08-31T00:00:00.000Z");
  assert.deepEqual(released.vocabulary[0].contentReview, { method: "automatic", humanReviewed: false, releasedAt: "2026-08-31T00:00:00.000Z" });
  assert.equal(released.vocabulary[0].reviewStatus, "pending");
  assert.equal(released.vocabulary[1].contentReview, undefined);
  assert.deepEqual(released.vocabulary[2].contentReview, { method: "human", humanReviewed: true, releasedAt: "2026-08-31T00:00:00.000Z" });
  assert.deepEqual(released.learnerRelease, { method: "automatic", humanReviewed: false, releasedAt: "2026-08-31T00:00:00.000Z" });
});

test("learners can receive the private auto-release while Studio stays admin-only", async () => {
  const route = await readFile(new URL("../app/api/content/review-package/route.ts", import.meta.url), "utf8");
  const moduleHook = await readFile(new URL("../components/content/use-content-module.ts", import.meta.url), "utf8");
  assert.match(route, /audience.*learner/);
  assert.match(route, /releaseForLearners/);
  assert.match(route, /getAllowedUser/);
  assert.match(route, /user\.isAdmin/);
  assert.match(moduleHook, /review-package\?audience=learner/);
  assert.match(moduleHook, /isLearnerReleased/);
});

test("learners can flag source-review content while studying", async () => {
  const flags = await readFile(new URL("../lib/content-flags.js", import.meta.url), "utf8");
  const button = await readFile(new URL("../components/library/content-flag-button.tsx", import.meta.url), "utf8");
  const practice = await readFile(new URL("../components/practice/practice-player.tsx", import.meta.url), "utf8");
  const entry = await readFile(new URL("../components/library/entry-detail.tsx", import.meta.url), "utf8");
  assert.match(flags, /toggleContentFlag/);
  assert.match(button, /Flag content/);
  assert.match(practice, /ContentFlagButton/);
  assert.match(practice, /question\.itemId/);
  assert.match(entry, /ContentFlagButton/);
});

test("external sources use native media and safe framing fallbacks", async () => {
  const viewer = await readFile(new URL("../components/learning/external-source-viewer.tsx", import.meta.url), "utf8");
  const surface = await readFile(new URL("../components/learning/immersion-surface.tsx", import.meta.url), "utf8");
  const player = await readFile(new URL("../components/learning/immersion-player.tsx", import.meta.url), "utf8");
  const launcher = await readFile(new URL("../components/learning/external-source-launcher.tsx", import.meta.url), "utf8");
  const sourceProgress = await readFile(new URL("../lib/external-source-progress.js", import.meta.url), "utf8");
  const frameExtension = JSON.parse(await readFile(new URL("../browser/kizashi-private-frame-unlocker/manifest.json", import.meta.url), "utf8"));
  const frameRules = JSON.parse(await readFile(new URL("../browser/kizashi-private-frame-unlocker/rules.json", import.meta.url), "utf8"));
  const shell = await readFile(new URL("../components/shell/app-shell.tsx", import.meta.url), "utf8");
  const library = await readFile(new URL("../components/library/library-browser.tsx", import.meta.url), "utf8");
  assert.match(viewer, /iframe/);
  assert.match(viewer, /mediaUrl/);
  assert.match(viewer, /<video/);
  assert.match(viewer, /const mediaUrl = canPlayExternalSourceMedia\(source\.mediaDelivery\) \? source\.mediaUrl : undefined/);
  assert.match(viewer, /mediaUrl \? <video[\s\S]*?<\/video> : null/);
  assert.doesNotMatch(viewer, /source\.mediaDelivery !== "link-only"/);
  assert.match(viewer, /Lesson page/);
  assert.match(viewer, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.match(viewer, /allow="autoplay; fullscreen; picture-in-picture; encrypted-media"/);
  assert.match(viewer, /allowFullScreen/);
  assert.match(viewer, /ExternalSourceFrame/);
  assert.match(viewer, /w-full/);
  assert.match(viewer, /Open original source/);
  assert.match(viewer, /const canFrame = canEmbedExternalSource\(source\.mediaDelivery\)/);
  assert.match(viewer, /const canRender = canEmbedExternalSource\(source\.mediaDelivery\) \|\| \(canPlayExternalSourceMedia\(source\.mediaDelivery\) && Boolean\(source\.mediaUrl\)\)/);
  assert.doesNotMatch(viewer, /\{source\.mediaDelivery === "link-only" \? <p[^>]*>This provider does not allow in-app framing/);
  assert.match(viewer, /View here/);
  assert.match(viewer, /role="dialog"/);
  assert.match(viewer, /backdrop-blur/);
  assert.match(surface, /ExternalSourceViewer/);
  assert.match(surface, /ImmersionPlayer/);
  assert.match(surface, /role="tablist"/);
  assert.match(surface, /selectedClipId/);
  assert.match(surface, /SourceCard/);
  assert.match(surface, /sources opened/);
  assert.match(surface, /readExternalSourceProgress/);
  assert.match(launcher, /markExternalSourceOpened/);
  assert.match(launcher, /Opened/);
  assert.match(sourceProgress, /EXTERNAL_SOURCE_PROGRESS_STORAGE_KEY/);
  assert.match(sourceProgress, /michi-source-progress-updated/);
  assert.equal(frameExtension.manifest_version, 3);
  assert.ok(frameExtension.host_permissions.length > 0);
  assert.equal(frameRules[0].action.type, "modifyHeaders");
  assert.ok(frameRules[0].action.responseHeaders.some((header) => header.header === "x-frame-options" && header.operation === "remove"));
  assert.ok(frameRules[0].action.responseHeaders.some((header) => header.header === "content-security-policy" && header.operation === "remove"));
  assert.match(shell, /const primaryNavItems = \[/);
  assert.match(shell, /href: "\/library"/);
  assert.match(shell, /grid-cols-5/);
  assert.match(library, /relative z-10/);
  assert.match(player, /JapaneseText/);
  assert.match(player, /always/);
  assert.match(player, /JapaneseText text=\{question\.prompt\}/);
  assert.match(player, /JapaneseText text=\{answer\}/);
});

test("Studio exposes every pending question through a searchable paged review queue", async () => {
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(studio, /Search pending questions/);
  assert.match(studio, /Filter pending questions/);
  assert.match(studio, /questionTypeFilter/);
  assert.match(studio, /questionPageSize/);
  assert.match(studio, /questionPageCount/);
  assert.match(studio, /Listening structure signals/);
  assert.doesNotMatch(studio, /questions\.slice\(0, 20\)/);
});

test("Studio shows persisted question context during review", async () => {
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(studio, /question\.contextSetId/);
  assert.match(studio, /question\.contextText/);
  assert.match(studio, /Context set/);
});

test("content review cards open a readable modal before approval", async () => {
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(studio, /<ContentReviewCard key=\{item\.id\}/);
  assert.match(studio, /role="dialog"/);
  assert.match(studio, /aria-modal="true"/);
  assert.match(studio, /backdrop-blur/);
  assert.match(studio, /ReadableRecord/);
  assert.doesNotMatch(studio, /<details className=/);
  assert.doesNotMatch(studio, /JSON\.stringify\(item, null, 2\)/);
  assert.match(studio, /Edit record/);
});

test("lesson completion uses the area transition language", async () => {
  const lesson = await readFile(new URL("../components/learning/local-lesson.tsx", import.meta.url), "utf8");
  assert.match(lesson, /data-world-transition="area-complete"/);
  assert.match(lesson, /You can now/);
  assert.match(lesson, /Next stop/);
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

test("content completeness separates quantity, fields, review, and context coverage", () => {
  const report = getContentCompleteness({
    course: { chapters: [{ lessons: [{ itemIds: ["vocab-1", "reading-1"] }] }] },
    vocabulary: [{ id: "vocab-1", category: "vocabulary", jlptLevel: "N5", writtenForm: "駅", reading: "えき", meanings: ["station"], exampleSentences: [{}], collocations: ["駅前"] }],
    kanji: [],
    grammar: [{ id: "grammar-1", category: "grammar", jlptLevel: "N4", pattern: "〜", meaning: "pattern", formation: "〜", intuition: "pattern", usageConditions: [], examples: [], reviewStatus: "pending" }],
    readings: [{ id: "reading-1", category: "reading", jlptLevel: "N5", title: "Notice", subcategory: "notice", passage: "お知らせ", translation: "Notice", vocabularyIds: [], grammarIds: [], kanjiIds: [], questions: [{ questionType: "visual detail" }] }],
    listening: [{ id: "listen-1", category: "listening", jlptLevel: "N5", situation: "station announcement", transcript: "電車が来ます", questions: [{ questionType: "visual verbal expression" }] }],
    practiceQuestions: [
      { category: "grammar", questionType: "sentence completion", prompt: "雨が降ったので、出かけませんでした。" },
      { category: "grammar", questionType: "sentence ordering", prompt: "Build the natural sentence." },
      { category: "grammar", questionType: "text grammar", prompt: "昨日は雨でした。___、家にいました。" },
      { category: "grammar", questionType: "meaning", prompt: "これは何を表しますか。" },
    ],
  });
  assert.deepEqual(report.levels, { N5: 3, N4: 1 });
  assert.deepEqual(report.review, { approved: 3, pending: 1, rejected: 0 });
  assert.equal(report.lessonAssignment, 2);
  assert.equal(report.fieldComplete, 2);
  assert.equal(report.uniqueContexts, 2);
  assert.equal(report.visualListeningQuestions, 1);
  assert.deepEqual(report.pronunciation, { lessons: 20, n5Lessons: 15, n4Lessons: 5, discriminationItems: 60, topics: 10 });
  assert.deepEqual(report.dictation, { total: 1, N5: 1, N4: 0, byMode: { word: 1, phrase: 0, sentence: 0, "dialogue-gap": 0, "key-information": 0 } });
  assert.deepEqual(report.output, { speaking: 1, writing: 1, pragmatics: 0, chunks: 1 });
  assert.deepEqual(report.grammarDepth, { total: 1, examplesAtLeast4: 0, mistakesAtLeast2: 0, practiceCovered: 0, contractReady: 0, byLevel: { N5: { total: 0, examplesAtLeast4: 0, mistakesAtLeast2: 0, practiceCovered: 0, contractReady: 0 }, N4: { total: 1, examplesAtLeast4: 0, mistakesAtLeast2: 0, practiceCovered: 0, contractReady: 0 } } });
  assert.deepEqual(report.grammarContract, { total: 1, aliases: 0, contexts: 0, readingAppearances: 0, listeningAppearances: 0, practiceContexts: 0, contractReady: 0, byLevel: { N5: { total: 0, aliases: 0, contexts: 0, readingAppearances: 0, listeningAppearances: 0, practiceContexts: 0, contractReady: 0 }, N4: { total: 1, aliases: 0, contexts: 0, readingAppearances: 0, listeningAppearances: 0, practiceContexts: 0, contractReady: 0 } } });
  assert.deepEqual(report.grammarAssessment, { questions: 4, uniqueContexts: 4, formSelectionContexts: 1, sentenceCompositionContexts: 0, sentenceOrderingContexts: 1, textGrammarContexts: 1, contrastClusterQuestions: 0, pendingQuestions: 0, pendingByLevel: { N5: 0, N4: 0 }, byType: { "sentence completion": 1, "sentence ordering": 1, "text grammar": 1, meaning: 1 }, byLevel: { N5: { questions: 0, uniqueContexts: 0, formSelectionContexts: 0, sentenceOrderingContexts: 0, textGrammarContexts: 0 }, N4: { questions: 0, uniqueContexts: 0, formSelectionContexts: 0, sentenceOrderingContexts: 0, textGrammarContexts: 0 } } });
  assert.equal(report.byCategory.vocabulary.lessonLinked, 1);
  assert.equal(report.byCategory.grammar.fieldComplete, 0);
});

test("every persisted authored question has a semantic review decision", () => {
  assert.equal(authoredQuestions.length, 258);
  assert.ok(authoredQuestions.every((question) => question.review?.status === "approved"));
  assert.ok(authoredQuestions.every((question) => question.review?.reviewedBy && question.review?.reviewedAt && question.review?.reviewNotes));
  assert.ok(authoredQuestions.every((question) => question.review?.targetItemIds?.includes(question.itemId)));
});

test("reviewed grammar contrast questions use independent contexts", () => {
  const contrastQuestions = authoredQuestions.filter((question) => question.category === "grammar" && (question.targetItemIds?.length ?? 0) > 1);
  assert.equal(contrastQuestions.length, 18);
  assert.equal(new Set(contrastQuestions.map((question) => question.prompt)).size, 18);
  assert.ok(contrastQuestions.every((question) => question.questionType === "sentence completion" && question.contextSetId && question.contextText));
  assert.deepEqual(new Set(contrastQuestions.flatMap((question) => question.targetItemIds ?? [])), new Set(["grammar-te-iku", "grammar-te-kuru", "grammar-te-ageru", "grammar-te-kureru", "grammar-te-morau", "grammar-ni-chigai-nai", "grammar-ni-kimatte-iru", "grammar-mitai", "grammar-rashii", "grammar-sou-appearance", "grammar-sou-hearsay", "grammar-youda", "grammar-kamoshirenai", "grammar-hazu", "grammar-to-omou", "grammar-to-iu", "grammar-to-kiku", "grammar-to-iu-noun", "grammar-koto-nominalization", "grammar-no-nominalization", "grammar-koto-ga-dekiru", "grammar-koto-ga-aru", "grammar-noni", "grammar-temo", "grammar-shi", "grammar-sore-ni", "grammar-soredemo", "grammar-keredomo", "grammar-aida", "grammar-aida-ni", "grammar-tokoro", "grammar-teiru-tokoro", "grammar-ta-tokoro", "grammar-bakari", "grammar-yasui", "grammar-nikui", "grammar-zurai"]));
});

test("every N4 bridge grammar item has persisted practice contexts", () => {
  const n4Ids = expansionData.find((data) => data.course.id === "n4-grammar-expansion").grammar.map((item) => item.id);
  const counts = new Map(n4Ids.map((id) => [id, 0]));
  authoredQuestions.filter((question) => question.category === "grammar" && n4Ids.includes(question.itemId)).forEach((question) => counts.set(question.itemId, (counts.get(question.itemId) ?? 0) + 1));
  assert.ok(n4Ids.every((id) => (counts.get(id) ?? 0) >= 2), JSON.stringify(Object.fromEntries(counts)));
});

test("authored sentence-ordering prompts identify their context", () => {
  const ordering = authoredQuestions.filter((question) => question.category === "grammar" && question.questionType === "sentence ordering");
  assert.equal(ordering.length, 5);
  assert.ok(ordering.every((question) => question.contextText));
  assert.equal(new Set(ordering.map((question) => question.contextText)).size, ordering.length);
});

test("grammar assessment drafts are independent and review-only", async () => {
  const curriculum = await readFile(new URL("../lib/curriculum.ts", import.meta.url), "utf8");
  assert.equal(grammarDrafts.length, 125);
  assert.equal(new Set(grammarDrafts.map((question) => question.prompt)).size, grammarDrafts.length);
  assert.equal(grammarDrafts.filter((question) => question.jlptLevel === "N5").length, 50);
  assert.equal(grammarDrafts.filter((question) => question.jlptLevel === "N4").length, 75);
  assert.ok(grammarDrafts.every((question) => question.category === "grammar" && question.questionType === "text grammar"));
  assert.ok(grammarDrafts.every((question) => question.validationStatus === "generated" && question.review?.status === "draft"));
  assert.ok(grammarDrafts.every((question) => question.prompt.includes("\n\n")));
  assert.ok(grammarDrafts.every((question) => question.contextSetId && question.contextText));
  assert.equal(new Set(grammarDrafts.map((question) => question.contextSetId)).size, grammarDrafts.length);
  const grammarIds = new Set(mergedModule.grammar.map((item) => item.id));
  assert.ok(grammarDrafts.every((question) => grammarIds.has(question.itemId) && question.options.length >= 4 && question.correctIndex >= 0 && question.correctIndex < question.options.length));
  assert.match(curriculum, /grammarAssessmentDrafts/);
  assert.match(curriculum, /n4GrammarExpansionData\.grammarContrasts/);
});

test("vocabulary context drafts are independent and review-only", async () => {
  const curriculum = await readFile(new URL("../lib/curriculum.ts", import.meta.url), "utf8");
  assert.equal(vocabularyDrafts.length, 338);
  assert.equal(new Set(vocabularyDrafts.map((question) => question.id)).size, vocabularyDrafts.length);
  assert.equal(vocabularyDrafts.filter((question) => question.questionType === "contextual vocabulary").length, 169);
  assert.equal(vocabularyDrafts.filter((question) => question.questionType === "paraphrase").length, 169);
  assert.ok(vocabularyDrafts.every((question) => question.category === "vocabulary" && question.validationStatus === "generated" && question.review?.status === "draft"));
  assert.ok(vocabularyDrafts.filter((question) => question.questionType === "contextual vocabulary").every((question) => question.contextSetId && question.contextText));
  assert.ok(vocabularyDrafts.filter((question) => question.questionType === "contextual vocabulary").every((question) => !question.prompt.endsWith("\n＿＿")));
  assert.ok(vocabularyDrafts.every((question) => question.options.length >= 2 && question.correctIndex >= 0 && question.correctIndex < question.options.length));
  assert.match(curriculum, /vocabularyAssessmentDrafts/);
});

test("N4 grammar assessment drafts cover distinct bridge concepts", () => {
  const n4Drafts = grammarDrafts.filter((question) => question.jlptLevel === "N4");
  assert.equal(n4Drafts.length, 75);
  assert.deepEqual(new Set(n4Drafts.map((question) => question.itemId)), new Set(["grammar-ta-form", "grammar-mae-ni", "grammar-ato-de", "grammar-toki", "grammar-nagara"]));
});

test("content completeness keeps grammar drafts out of approved assessment counts", () => {
  const report = getContentCompleteness({ practiceQuestions: [{ category: "grammar", questionType: "text grammar", jlptLevel: "N5", prompt: "雨です。___、家にいます。", validationStatus: "generated", review: { status: "draft" } }] });
  assert.equal(report.grammarAssessment.questions, 0);
  assert.equal(report.grammarAssessment.pendingQuestions, 1);
  assert.deepEqual(report.grammarAssessment.pendingByLevel, { N5: 1, N4: 0 });
  assert.deepEqual(report.grammarConsistency, { items: 0, duplicateExampleItems: 0, duplicateExampleCount: 0, conflictingTranslationExamples: 0, emptyExamples: 0 });
});

test("generated draft activation requires explicit review metadata", async () => {
  const validation = await readFile(new URL("../lib/content-validation.ts", import.meta.url), "utf8");
  assert.match(validation, /generatedBy\?\.includes\("draft"\)/);
  assert.match(validation, /reviewedBy/);
  assert.match(validation, /reviewedAt/);
});

test("vocabulary context audit reports the learner contract", () => {
  const report = getContentCompleteness({
    vocabulary: [{ id: "vocab-contract", category: "vocabulary", jlptLevel: "N4", exampleSentences: [{ japanese: "例です。", translation: "It is an example." }, { japanese: "もう一つです。", translation: "It is another one." }], collocations: ["例を使う"], relatedWords: ["練習"], usageAssessment: { correct: "例を使います。", distractors: ["例を食べます。", "例を歩きます。", "例を寝ます。"] } }],
    practiceQuestions: [{ itemId: "vocab-contract", questionType: "contextual vocabulary" }, { itemId: "vocab-contract", questionType: "paraphrase" }],
  });
  assert.deepEqual(report.vocabularyContract, { total: 1, examplesAtLeast2: 1, collocations: 1, relatedWords: 1, audio: 0, contextualAssessments: 1, paraphraseAssessments: 1, pendingContextualDrafts: 0, pendingParaphraseDrafts: 0, usageAssessments: 1, contractReady: 1, byLevel: { N5: { total: 0, examplesAtLeast2: 0, collocations: 0, relatedWords: 0, audio: 0, contextualAssessments: 0, paraphraseAssessments: 0, pendingContextualDrafts: 0, pendingParaphraseDrafts: 0, usageAssessments: 0, contractReady: 0 }, N4: { total: 1, examplesAtLeast2: 1, collocations: 1, relatedWords: 1, audio: 0, contextualAssessments: 1, paraphraseAssessments: 1, pendingContextualDrafts: 0, pendingParaphraseDrafts: 0, usageAssessments: 1, contractReady: 1 } } });
});

test("authored vocabulary context coverage remains visible", () => {
  assert.ok(mergedModule.vocabulary.every((item) => item.exampleSentences.length >= 2));
  assert.deepEqual(getContentCompleteness(mergedModule).vocabularyContract, { total: 169, examplesAtLeast2: 169, collocations: 169, relatedWords: 169, audio: 0, contextualAssessments: 0, paraphraseAssessments: 0, pendingContextualDrafts: 0, pendingParaphraseDrafts: 0, usageAssessments: 16, contractReady: 0, byLevel: { N5: { total: 153, examplesAtLeast2: 153, collocations: 153, relatedWords: 153, audio: 0, contextualAssessments: 0, paraphraseAssessments: 0, pendingContextualDrafts: 0, pendingParaphraseDrafts: 0, usageAssessments: 0, contractReady: 0 }, N4: { total: 16, examplesAtLeast2: 16, collocations: 16, relatedWords: 16, audio: 0, contextualAssessments: 0, paraphraseAssessments: 0, pendingContextualDrafts: 0, pendingParaphraseDrafts: 0, usageAssessments: 16, contractReady: 0 } } });
});

test("collocation quality audit flags repeated or isolated entries", () => {
  const report = getContentCompleteness({ vocabulary: [
    { id: "good", category: "vocabulary", jlptLevel: "N5", writtenForm: "駅", reading: "えき", collocations: ["駅に行く", "駅前"] },
    { id: "weak", category: "vocabulary", jlptLevel: "N5", writtenForm: "本", reading: "ほん", collocations: ["本", "本"] },
  ] });
  assert.deepEqual(report.collocationQuality, { total: 2, populated: 2, withAtLeast2: 2, duplicateRows: 1, headwordOnly: 1, byLevel: { N5: { total: 2, populated: 2, withAtLeast2: 2, duplicateRows: 1, headwordOnly: 1 }, N4: { total: 0, populated: 0, withAtLeast2: 0, duplicateRows: 0, headwordOnly: 0 } } });
});

test("authored collocations pass the structural quality audit", () => {
  assert.deepEqual(getContentCompleteness(mergedModule).collocationQuality, { total: 169, populated: 169, withAtLeast2: 169, duplicateRows: 0, headwordOnly: 0, byLevel: { N5: { total: 153, populated: 153, withAtLeast2: 153, duplicateRows: 0, headwordOnly: 0 }, N4: { total: 16, populated: 16, withAtLeast2: 16, duplicateRows: 0, headwordOnly: 0 } } });
});

test("grammar contract reports aliases, context, and linked assessment coverage", () => {
  const report = getContentCompleteness({
    grammar: [{ id: "grammar-contract", category: "grammar", jlptLevel: "N4", pattern: "〜", meaning: "pattern", formation: "〜", intuition: "pattern", usageConditions: ["condition"], examples: [{ japanese: "例です。", translation: "It is an example." }], commonMistakes: ["mistake"], contrastIds: [], practiceQuestionIds: [], aliases: ["〜"], context: { japanese: "例です。", translation: "It is an example." } }],
    practiceQuestions: [{ itemId: "grammar-contract", category: "grammar", questionType: "sentence completion", prompt: "例___。", contextSetId: "contract-1", review: { status: "approved" } }, { itemId: "grammar-contract", category: "grammar", questionType: "sentence completion", prompt: "例___。", contextSetId: "contract-2", review: { status: "approved" } }],
  });
  assert.deepEqual(report.grammarContract, { total: 1, aliases: 1, contexts: 1, readingAppearances: 0, listeningAppearances: 0, practiceContexts: 1, contractReady: 1, byLevel: { N5: { total: 0, aliases: 0, contexts: 0, readingAppearances: 0, listeningAppearances: 0, practiceContexts: 0, contractReady: 0 }, N4: { total: 1, aliases: 1, contexts: 1, readingAppearances: 0, listeningAppearances: 0, practiceContexts: 1, contractReady: 1 } } });
});

test("foundational grammar contract fields are explicit authored data", async () => {
  const foundation = JSON.parse(await readFile(new URL("../data/n5-foundations.json", import.meta.url), "utf8"));
  const expansions = await Promise.all(["n5-conversation-expansion.json", "n5-practical-expansion.json", "n5-life-expansion.json", "n4-grammar-expansion.json"].map(async (file) => JSON.parse(await readFile(new URL(`../data/${file}`, import.meta.url), "utf8"))));
  const fields = JSON.parse(await readFile(new URL("../data/grammar-contract-fields.json", import.meta.url), "utf8"));
  const practice = JSON.parse(await readFile(new URL("../data/n5-authored-practice.json", import.meta.url), "utf8"));
  const curriculum = await readFile(new URL("../lib/curriculum.ts", import.meta.url), "utf8");
  assert.equal(Object.keys(fields).length, 116);
  for (const item of [foundation, ...expansions].flatMap((module) => module.grammar)) {
    assert.ok(fields[item.id]?.aliases?.length);
    assert.match(fields[item.id]?.context?.japanese ?? "", /。/u);
    assert.ok(fields[item.id]?.context?.translation);
  }
  for (const id of ["grammar-ta-form", "grammar-mae-ni", "grammar-ato-de", "grammar-toki", "grammar-nagara"]) {
    assert.ok(practice.filter((question) => question.itemId === id && question.contextSetId).length >= 2);
  }
  assert.match(curriculum, /addGrammarContractFields/);
});

test("foundational vocabulary has explicit authored second examples", async () => {
  const foundation = JSON.parse(await readFile(new URL("../data/n5-foundations.json", import.meta.url), "utf8"));
  const expansions = JSON.parse(await readFile(new URL("../data/vocabulary-example-expansions.json", import.meta.url), "utf8"));
  const curriculum = await readFile(new URL("../lib/curriculum.ts", import.meta.url), "utf8");
  assert.ok(Object.keys(expansions).length >= foundation.vocabulary.length);
  for (const item of foundation.vocabulary) {
    assert.equal(expansions[item.id]?.length, 1);
    assert.ok(expansions[item.id][0].japanese);
    assert.ok(expansions[item.id][0].translation);
  }
  assert.match(curriculum, /addVocabularyExamples/);
});

test("grammar consistency catches duplicated or conflicting example prose", () => {
  const report = getContentCompleteness({ grammar: [
    { id: "grammar-one", category: "grammar", jlptLevel: "N5", examples: [{ japanese: "同じです。", translation: "It is the same." }, { japanese: "同じです。", translation: "It is identical." }] },
    { id: "grammar-two", category: "grammar", jlptLevel: "N5", examples: [{ japanese: "同じです。", translation: "It is the same." }] },
  ] });
  assert.deepEqual(report.grammarConsistency, { items: 2, duplicateExampleItems: 1, duplicateExampleCount: 1, conflictingTranslationExamples: 1, emptyExamples: 0 });
});

test("authored grammar examples pass the internal consistency audit", () => {
  assert.deepEqual(getContentCompleteness(mergedModule).grammarConsistency, { items: 116, duplicateExampleItems: 0, duplicateExampleCount: 0, conflictingTranslationExamples: 0, emptyExamples: 0 });
});

test("text grammar validation requires a persisted passage context", async () => {
  const validation = await readFile(new URL("../lib/content-validation.ts", import.meta.url), "utf8");
  const questions = await readFile(new URL("../lib/questions.ts", import.meta.url), "utf8");
  assert.match(validation, /rawQuestion\.questionType === "text grammar"/);
  assert.match(validation, /contextText/);
  assert.match(validation, /contextSetId/);
  assert.match(validation, /visible blank/);
  assert.match(questions, /contextSetId: "grammar-masu-text"/);
});

test("grammar context metrics collapse variants sharing a context set", () => {
  const report = getContentCompleteness({ practiceQuestions: [
    { category: "grammar", questionType: "text grammar", jlptLevel: "N5", prompt: "駅で切符を買います。", contextSetId: "station-ticket" },
    { category: "grammar", questionType: "text grammar", jlptLevel: "N5", prompt: "店でパンを買います。", contextSetId: "station-ticket" },
  ] });
  assert.equal(report.grammarAssessment.uniqueContexts, 1);
  assert.equal(report.grammarAssessment.textGrammarContexts, 1);
  assert.equal(report.grammarAssessment.byLevel.N5.textGrammarContexts, 1);
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

test("grammar context and reading practice data survive the Supabase boundary", async () => {
  const migration = await readFile(new URL("../supabase/migrations/0020_learning_context_fields.sql", import.meta.url), "utf8");
  const types = await readFile(new URL("../lib/types.ts", import.meta.url), "utf8");
  const content = await readFile(new URL("../lib/supabase/content.ts", import.meta.url), "utf8");
  const renderer = await readFile(new URL("../scripts/render_supabase_content_sql.py", import.meta.url), "utf8");
  const seed = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
  for (const field of ["aliases", "context", "visual_format", "questions"]) {
    assert.match(migration, new RegExp(`add column if not exists ${field}`));
    assert.match(types, new RegExp(field));
    assert.match(content, new RegExp(field));
    assert.match(renderer, new RegExp(field));
  }
  assert.match(seed, /item\.aliases[\s\S]*item\.context/);
  assert.match(seed, /item\."visualFormat"[\s\S]*item\.questions/);
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

test("AI content generation stays allowlisted and rate-limited while drafts remain review-only", async () => {
  const route = await readFile(new URL("../app/api/content/generate/route.ts", import.meta.url), "utf8");
  const validation = await readFile(new URL("../lib/content-validation.ts", import.meta.url), "utf8");
  assert.match(route, /const user = await getAllowedUser\(\);\s+if \(!user\).*status: 401/s);
  assert.match(route, /if \(!user\.isAdmin\).*status: 403/s);
  assert.match(route, /lastGeneratedAt/);
  assert.match(route, /stringValue\(value\.id\) !== itemId/);
  assert.match(route, /getContentReviewStatus/);
  assert.match(route, /validationStatus: "generated"/);
  assert.match(route, /generatedReview\(model, item\.id\)/);
  assert.match(validation, /generatedBy.*openrouter/);
  assert.match(validation, /validationStatus === "generated"/);
  assert.match(validation, /review\?\.status === "approved"/);
});

test("practice coverage checks every item and normalizes JLPT family aliases", async () => {
  const questions = await readFile(new URL("../lib/questions.ts", import.meta.url), "utf8");
  const validation = await readFile(new URL("../lib/content-validation.ts", import.meta.url), "utf8");
  const studio = await readFile(new URL("../components/content/content-studio.tsx", import.meta.url), "utf8");
  assert.match(questions, /getN5PracticeCoverage/);
  assert.match(questions, /sentence completion.*sentence composition/);
  assert.match(validation, /practiceQuestionTypes/);
  assert.match(studio, /N5 practice coverage/);
  assert.match(studio, /CompletenessDashboard/);
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

test("approved source exports use globally unique item IDs as slugs", async () => {
  const directory = await mkdtemp("/tmp/kizashi-slug-export-");
  const outputPath = `${directory}/content.sql`;
  await execFileAsync("python3", ["scripts/render_supabase_content_sql.py", "--approved", "--package", "data/staging/kizashi-n5-source-review.json", "--output", outputPath]);
  const sql = await readFile(outputPath, "utf8");
  assert.match(sql, /insert into public\.learning_items \(id, slug, item_type[\s\S]*\('vocab-kyou', 'vocab-kyou', 'vocabulary'/);
  await rm(directory, { recursive: true, force: true });
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

test("SQL export keeps unreviewed AI questions flagged and active", async () => {
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
    const outputPath = `${directory}/content.sql`;
    await execFileAsync("python3", ["scripts/render_supabase_content_sql.py", "--package", packagePath, "--questions", questionsPath, "--output", outputPath]);
    assert.match(await readFile(outputPath, "utf8"), /'ai-vocab-test'.*'validated'.*'openrouter:test-model'/s);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("SQL export publishes generated questions with their unreviewed status", async () => {
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
    const outputPath = `${directory}/content.sql`;
    await execFileAsync("python3", ["scripts/render_supabase_content_sql.py", "--package", packagePath, "--questions", questionsPath, "--output", outputPath]);
    assert.match(await readFile(outputPath, "utf8"), /'draft-vocab-test'.*'generated'.*'michi-question-factory'/s);
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

test("content QA accepts the staged package after the reviewed batch is approved", async () => {
  const { stdout } = await execFileAsync("python3", ["scripts/qa_content_package.py", "--package", "data/staging/kizashi-n5-source-review.json"]);
  const report = JSON.parse(stdout);
  assert.equal(report.status, "ready");
  assert.deepEqual(report.blockers, []);
});

test("content QA requires classification only for imported source-review records", async () => {
  const { stdout } = await execFileAsync("python3", ["scripts/qa_content_package.py", "--package", "test/fixtures/unassigned-approved-package.json"]);
  const report = JSON.parse(stdout);
  const blockers = report.blockers.join("\n");
  assert.match(blockers, /vocab-test: non-rejected source-review item is not assigned to a real Journey lesson/);
  assert.match(blockers, /vocab-test: source test-source has no recorded license terms/);
  assert.doesNotMatch(blockers, /vocab-curated: missing reviewed curriculum classification/);
});

test("content QA accepts pending records once they have real lesson placement", async () => {
  const directory = await mkdtemp("/tmp/kizashi-no-approved-qa-");
  const packagePath = `${directory}/package.json`;
  try {
    const packageData = JSON.parse(await readFile(new URL("../test/fixtures/unassigned-approved-package.json", import.meta.url), "utf8"));
    packageData.vocabulary.find((item) => item.id === "vocab-test").reviewStatus = "pending";
    packageData.course.chapters[0].lessons[0].itemIds.push("vocab-test");
    packageData.sourceManifest[0].license = "Test-only license note";
    await writeFile(packagePath, JSON.stringify(packageData), "utf8");
    const { stdout } = await execFileAsync("python3", ["scripts/qa_content_package.py", "--package", packagePath]);
    const report = JSON.parse(stdout);
    assert.equal(report.status, "ready");
    assert.deepEqual(report.blockers, []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("content QA recognizes source records assigned by item ID in real lessons", async () => {
  const directory = await mkdtemp("/tmp/kizashi-assignment-qa-");
  const packagePath = `${directory}/package.json`;
  try {
    const packageData = JSON.parse(await readFile(new URL("../test/fixtures/unassigned-approved-package.json", import.meta.url), "utf8"));
    packageData.course.chapters[0].lessons[0].itemIds.push("vocab-test");
    packageData.sourceManifest[0].license = "Test-only license note";
    await writeFile(packagePath, JSON.stringify(packageData), "utf8");
    const { stdout } = await execFileAsync("python3", ["scripts/qa_content_package.py", "--package", packagePath]);
    assert.doesNotMatch(stdout, /assigned to a real Journey lesson/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
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
  assert.match(worker, /url\.origin !== self\.location\.origin/);
  assert.match(worker, /url\.pathname\.startsWith\("\/_next\/"\)/);
  assert.match(worker, /url\.pathname\.startsWith\("\/api\/"\)/);
});
