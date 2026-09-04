import { pronunciationItems, pronunciationLessons } from "../data/pronunciation-bank.js";
import { buildDictationBank } from "./dictation-core.js";
import { buildOutputBanks } from "./output-core.js";
import { buildContentQualityReport } from "./content-quality-core.js";

const categories = Object.freeze(["vocabulary", "kanji", "grammar", "reading", "listening"]);

function itemsFor(module, category) {
  return module?.[category === "reading" ? "readings" : category] ?? [];
}

function hasValues(value) {
  return Array.isArray(value) ? value.length > 0 : typeof value === "string" ? Boolean(value.trim()) : Boolean(value);
}

function fieldsComplete(item) {
  if (item.category === "vocabulary") return hasValues(item.writtenForm) && hasValues(item.reading) && hasValues(item.meanings) && hasValues(item.exampleSentences) && hasValues(item.collocations);
  if (item.category === "kanji") return hasValues(item.character) && hasValues(item.meanings) && hasValues(item.usefulWords);
  if (item.category === "grammar") return hasValues(item.pattern) && hasValues(item.meaning) && hasValues(item.formation) && hasValues(item.intuition) && hasValues(item.usageConditions) && hasValues(item.examples);
  if (item.category === "reading") return hasValues(item.passage) && hasValues(item.translation) && hasValues(item.vocabularyIds) && hasValues(item.grammarIds) && hasValues(item.kanjiIds) && hasValues(item.questions);
  return hasValues(item.situation) && hasValues(item.transcript) && hasValues(item.questions);
}

function reviewStatus(item) {
  if (["approved", "pending", "rejected"].includes(item.reviewStatus)) return item.reviewStatus;
  return item.tags?.includes("source-review") ? "pending" : "approved";
}

function contextFor(item) {
  return item.category === "listening" ? item.situation : item.category === "reading" ? item.subcategory ?? item.title : "";
}

function normalized(value) {
  return String(value ?? "").normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase();
}

function grammarContextKey(question) {
  return normalized(question.contextSetId ?? question.contextText ?? question.prompt);
}

function uniqueGrammarContexts(questions) {
  return new Set(questions.map(grammarContextKey).filter(Boolean)).size;
}

function isReadyGrammarQuestion(question) {
  if (question.validationStatus === "generated" || question.review?.status === "draft") return false;
  return !question.generatedBy?.startsWith("openrouter:") || question.review?.status === "approved";
}

function grammarDepth(module) {
  const items = itemsFor(module, "grammar");
  const questions = Array.isArray(module.practiceQuestions) ? module.practiceQuestions : [];
  const summarize = (subset) => {
    const examplesAtLeast4 = subset.filter((item) => Array.isArray(item.examples) && item.examples.length >= 4).length;
    const mistakesAtLeast2 = subset.filter((item) => Array.isArray(item.commonMistakes) && item.commonMistakes.length >= 2).length;
    const practiceCovered = subset.filter((item) => questions.filter((question) => question.itemId === item.id && isReadyGrammarQuestion(question)).length >= 2).length;
    return { total: subset.length, examplesAtLeast4, mistakesAtLeast2, practiceCovered, contractReady: subset.filter((item) => Array.isArray(item.examples) && item.examples.length >= 4 && Array.isArray(item.commonMistakes) && item.commonMistakes.length >= 2 && questions.filter((question) => question.itemId === item.id && isReadyGrammarQuestion(question)).length >= 2).length };
  };
  return { ...summarize(items), byLevel: Object.fromEntries(["N5", "N4"].map((level) => [level, summarize(items.filter((item) => item.jlptLevel === level))])) };
}

function grammarContract(module) {
  const items = itemsFor(module, "grammar");
  const readings = itemsFor(module, "reading");
  const listening = itemsFor(module, "listening");
  const questions = Array.isArray(module.practiceQuestions) ? module.practiceQuestions : [];
  const linked = (question, item) => question.itemId === item.id || question.targetItemIds?.includes(item.id);
  const hasContext = (item) => item.context && hasValues(item.context.japanese) && hasValues(item.context.translation);
  const summarize = (subset) => {
    const practiceContexts = subset.filter((item) => questions.filter((question) => linked(question, item) && isReadyGrammarQuestion(question) && hasValues(question.contextSetId ?? question.contextText)).length >= 2).length;
    const readingAppearances = subset.filter((item) => readings.some((reading) => reading.grammarIds?.includes(item.id))).length;
    const listeningAppearances = subset.filter((item) => listening.some((entry) => entry.grammarIds?.includes(item.id))).length;
    const aliases = subset.filter((item) => Array.isArray(item.aliases)).length;
    const contexts = subset.filter(hasContext).length;
    const contractReady = subset.filter((item) => hasContext(item) && Array.isArray(item.aliases) && questions.filter((question) => linked(question, item) && isReadyGrammarQuestion(question) && hasValues(question.contextSetId ?? question.contextText)).length >= 2).length;
    return { total: subset.length, aliases, contexts, readingAppearances, listeningAppearances, practiceContexts, contractReady };
  };
  return { ...summarize(items), byLevel: Object.fromEntries(["N5", "N4"].map((level) => [level, summarize(items.filter((item) => item.jlptLevel === level))])) };
}

function grammarConsistency(module) {
  const items = itemsFor(module, "grammar");
  const translations = new Map();
  let duplicateExampleItems = 0;
  let duplicateExampleCount = 0;
  let emptyExamples = 0;
  items.forEach((item) => {
    const seen = new Set();
    let itemDuplicates = 0;
    (item.examples ?? []).forEach((example) => {
      if (!hasValues(example.japanese) || !hasValues(example.translation)) emptyExamples += 1;
      if (seen.has(example.japanese)) itemDuplicates += 1;
      seen.add(example.japanese);
      const values = translations.get(example.japanese) ?? new Set();
      values.add(example.translation);
      translations.set(example.japanese, values);
    });
    if (itemDuplicates) duplicateExampleItems += 1;
    duplicateExampleCount += itemDuplicates;
  });
  return { items: items.length, duplicateExampleItems, duplicateExampleCount, conflictingTranslationExamples: [...translations.values()].filter((values) => values.size > 1).length, emptyExamples };
}

function vocabularyContract(module) {
  const items = itemsFor(module, "vocabulary");
  const questions = Array.isArray(module.practiceQuestions) ? module.practiceQuestions : [];
  const linked = (item, types) => questions.some((question) => question.itemId === item.id && types.includes(question.questionType) && isReadyGrammarQuestion(question));
  const hasUsage = (item) => item.usageAssessment && hasValues(item.usageAssessment.correct) && Array.isArray(item.usageAssessment.distractors) && item.usageAssessment.distractors.length >= 3;
  const summarize = (subset) => {
    const examplesAtLeast2 = subset.filter((item) => Array.isArray(item.exampleSentences) && item.exampleSentences.length >= 2).length;
    const collocations = subset.filter((item) => hasValues(item.collocations)).length;
    const relatedWords = subset.filter((item) => hasValues(item.relatedWords)).length;
    const audio = subset.filter((item) => item.audio || item.audioUrl).length;
    const contextualAssessments = subset.filter((item) => linked(item, ["contextual vocabulary"])).length;
    const paraphraseAssessments = subset.filter((item) => linked(item, ["paraphrase"])).length;
    const usageAssessments = subset.filter(hasUsage).length;
    const contractReady = subset.filter((item) => Array.isArray(item.exampleSentences) && item.exampleSentences.length >= 2 && hasValues(item.collocations) && linked(item, ["contextual vocabulary"]) && linked(item, ["paraphrase"]) && (item.jlptLevel !== "N4" || hasUsage(item))).length;
    return { total: subset.length, examplesAtLeast2, collocations, relatedWords, audio, contextualAssessments, paraphraseAssessments, usageAssessments, contractReady };
  };
  return { ...summarize(items), byLevel: Object.fromEntries(["N5", "N4"].map((level) => [level, summarize(items.filter((item) => item.jlptLevel === level))])) };
}

function collocationQuality(module) {
  const items = itemsFor(module, "vocabulary");
  const summarize = (subset) => {
    const populated = subset.filter((item) => hasValues(item.collocations)).length;
    const withAtLeast2 = subset.filter((item) => Array.isArray(item.collocations) && item.collocations.length >= 2).length;
    const duplicateRows = subset.reduce((total, item) => {
      const values = (item.collocations ?? []).map(normalized);
      return total + values.length - new Set(values).size;
    }, 0);
    const headwordOnly = subset.filter((item) => (item.collocations ?? []).some((value) => [normalized(item.writtenForm), normalized(item.reading)].includes(normalized(value)))).length;
    return { total: subset.length, populated, withAtLeast2, duplicateRows, headwordOnly };
  };
  return { ...summarize(items), byLevel: Object.fromEntries(["N5", "N4"].map((level) => [level, summarize(items.filter((item) => item.jlptLevel === level))])) };
}

function grammarAssessment(module) {
  const allQuestions = (Array.isArray(module.practiceQuestions) ? module.practiceQuestions : []).filter((question) => question.category === "grammar");
  const questions = allQuestions.filter(isReadyGrammarQuestion);
  const pendingQuestions = allQuestions.filter((question) => !isReadyGrammarQuestion(question));
  const byType = Object.fromEntries([...new Set(questions.map((question) => question.questionType).filter(Boolean))].map((type) => [type, questions.filter((question) => question.questionType === type).length]));
  const formSelectionTypes = new Set(["sentence completion", "particle choice", "grammar in context"]);
  const byLevel = Object.fromEntries(["N5", "N4"].map((level) => {
    const levelQuestions = questions.filter((question) => question.jlptLevel === level);
    return [level, {
      questions: levelQuestions.length,
      uniqueContexts: uniqueGrammarContexts(levelQuestions),
      formSelectionContexts: uniqueGrammarContexts(levelQuestions.filter((question) => formSelectionTypes.has(question.questionType))),
      sentenceOrderingContexts: uniqueGrammarContexts(levelQuestions.filter((question) => question.questionType === "sentence ordering")),
      textGrammarContexts: uniqueGrammarContexts(levelQuestions.filter((question) => question.questionType === "text grammar")),
    }];
  }));
  return {
    questions: questions.length,
    uniqueContexts: uniqueGrammarContexts(questions),
    formSelectionContexts: uniqueGrammarContexts(questions.filter((question) => formSelectionTypes.has(question.questionType))),
    sentenceCompositionContexts: uniqueGrammarContexts(questions.filter((question) => question.questionType === "sentence composition")),
    sentenceOrderingContexts: uniqueGrammarContexts(questions.filter((question) => question.questionType === "sentence ordering")),
    textGrammarContexts: uniqueGrammarContexts(questions.filter((question) => question.questionType === "text grammar")),
    contrastClusterQuestions: questions.filter((question) => Array.isArray(question.targetItemIds) && question.targetItemIds.length > 1).length,
    pendingQuestions: pendingQuestions.length,
    pendingByLevel: Object.fromEntries(["N5", "N4"].map((level) => [level, pendingQuestions.filter((question) => question.jlptLevel === level).length])),
    byType,
    byLevel,
  };
}

/** @param {any} module @returns {any} */
export function getContentCompleteness(module = {}) {
  const allItems = categories.flatMap((category) => itemsFor(module, category));
  const dictationItems = buildDictationBank(itemsFor(module, "listening"));
  const outputBanks = buildOutputBanks(module);
  const lessonItemIds = new Set((module.course?.chapters ?? []).flatMap((chapter) => (chapter.lessons ?? []).flatMap((lesson) => lesson.itemIds ?? [])));
  const report = Object.fromEntries(categories.map((category) => {
    const items = itemsFor(module, category);
    const contexts = new Set(items.map(contextFor).map(normalized).filter(Boolean));
    return [category, {
      count: items.length,
      lessonLinked: items.filter((item) => lessonItemIds.has(item.id)).length,
      fieldComplete: items.filter(fieldsComplete).length,
      approved: items.filter((item) => reviewStatus(item) === "approved").length,
      pending: items.filter((item) => reviewStatus(item) === "pending").length,
      rejected: items.filter((item) => reviewStatus(item) === "rejected").length,
      uniqueContexts: contexts.size,
    }];
  }));
  const review = { approved: 0, pending: 0, rejected: 0 };
  allItems.forEach((item) => { review[reviewStatus(item)] += 1; });
  return {
    total: allItems.length,
    levels: { N5: allItems.filter((item) => item.jlptLevel === "N5").length, N4: allItems.filter((item) => item.jlptLevel === "N4").length },
    lessonAssignment: allItems.filter((item) => lessonItemIds.has(item.id)).length,
    fieldComplete: allItems.filter(fieldsComplete).length,
    review,
    uniqueContexts: new Set(allItems.map(contextFor).map(normalized).filter(Boolean)).size,
    visualListeningQuestions: itemsFor(module, "listening").flatMap((item) => item.questions ?? []).filter((question) => /visual|image|picture/iu.test(question.questionType ?? "")).length,
    pronunciation: {
      lessons: pronunciationLessons.length,
      n5Lessons: pronunciationLessons.filter((lesson) => lesson.level === "N5").length,
      n4Lessons: pronunciationLessons.filter((lesson) => lesson.level === "N4").length,
      discriminationItems: pronunciationItems.length,
      topics: new Set(pronunciationLessons.map((lesson) => lesson.topic)).size,
    },
    dictation: {
      total: dictationItems.length,
      N5: dictationItems.filter((item) => item.level === "N5").length,
      N4: dictationItems.filter((item) => item.level === "N4").length,
      byMode: Object.fromEntries(["word", "phrase", "sentence", "dialogue-gap", "key-information"].map((mode) => [mode, dictationItems.filter((item) => item.mode === mode).length])),
    },
    output: Object.fromEntries(["speaking", "writing", "pragmatics", "chunks"].map((kind) => [kind, outputBanks[kind].length])),
    grammarDepth: grammarDepth(module),
    grammarContract: grammarContract(module),
    grammarConsistency: grammarConsistency(module),
    vocabularyContract: vocabularyContract(module),
    collocationQuality: collocationQuality(module),
    grammarAssessment: grammarAssessment(module),
    quality: buildContentQualityReport({ readings: itemsFor(module, "reading"), listening: itemsFor(module, "listening") }),
    byCategory: report,
  };
}
