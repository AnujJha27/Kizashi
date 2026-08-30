import type { ContentReviewStatus, LearningCategory, N5Module, PracticeQuestion } from "@/lib/types";

export type ContentIssue = {
  path: string;
  message: string;
  severity: "error" | "warning";
};

export type ContentValidationResult = {
  valid: boolean;
  checked: number;
  errors: ContentIssue[];
  warnings: ContentIssue[];
};

const categories = ["vocabulary", "kanji", "grammar", "reading", "listening"] as const;
type Category = (typeof categories)[number];
const collectionKeys = { vocabulary: "vocabulary", kanji: "kanji", grammar: "grammar", reading: "readings", listening: "listening" } as const;
const practiceQuestionTypes: Record<Category, readonly string[]> = {
  vocabulary: ["meaning", "contextual vocabulary", "paraphrase", "orthography", "kana recall", "Japanese recall", "audio recognition"],
  kanji: ["kanji reading", "kanji meaning", "reading in context", "word to kanji recall", "orthography", "kana recall", "kanji in context"],
  grammar: ["meaning", "sentence completion", "sentence composition", "sentence ordering", "text grammar", "grammar in context"],
  reading: ["short passage", "short passage detail", "mid-length passage", "information retrieval", "reading in context", "main idea", "sequence", "condition detail", "task-based response"],
  listening: ["task-based response", "key point", "verbal expression", "quick response", "information retrieval"],
};

export const CONTENT_DRAFT_STORAGE_KEY = "michi.content-draft";
export const QUESTION_DRAFT_STORAGE_KEY = "michi.question-draft";

export function isActivePracticeQuestion(question: Pick<PracticeQuestion, "validationStatus" | "generatedBy" | "review">) {
  if (question.validationStatus === "generated" || question.validationStatus === "rejected") return false;
  return !question.generatedBy?.startsWith("openrouter:") || question.review?.status === "approved";
}

export function getContentReviewStatus(item: { reviewStatus?: unknown; tags?: unknown }): ContentReviewStatus {
  if (item.reviewStatus === "pending" || item.reviewStatus === "approved" || item.reviewStatus === "rejected") return item.reviewStatus;
  return Array.isArray(item.tags) && item.tags.includes("source-review") ? "pending" : "approved";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, path: string, issues: ContentIssue[], required = true) {
  if (typeof value === "string" && value.trim()) return value;
  if (required) issues.push({ path, message: "Required text is missing.", severity: "error" });
  return null;
}

function stringArray(value: unknown, path: string, issues: ContentIssue[], minimum = 1) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || !entry.trim())) {
    issues.push({ path, message: "Expected an array of non-empty strings.", severity: "error" });
    return [];
  }
  if (value.length < minimum) issues.push({ path, message: `Add at least ${minimum} item${minimum === 1 ? "" : "s"}.`, severity: "error" });
  return value as string[];
}

function uniqueStrings(values: string[], path: string, issues: ContentIssue[]) {
  if (new Set(values).size !== values.length) issues.push({ path, message: "Duplicate values are not useful here.", severity: "error" });
}

function uniqueNormalizedStrings(values: string[], path: string, issues: ContentIssue[]) {
  const normalized = values.map((value) => value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLocaleLowerCase());
  if (new Set(normalized).size !== normalized.length) issues.push({ path, message: "Choices must remain unique after spacing and width normalization.", severity: "error" });
}

function qualityWarning(condition: boolean, path: string, message: string, issues: ContentIssue[]) {
  if (condition) issues.push({ path, message, severity: "warning" });
}

function optionalNonNegativeNumber(value: unknown, path: string, issues: ContentIssue[]) {
  if (value !== undefined && (typeof value !== "number" || !Number.isInteger(value) || value < 0)) issues.push({ path, message: "Use a non-negative integer when this signal is available.", severity: "error" });
}

function validateClassification(item: Record<string, unknown>, path: string, issues: ContentIssue[]) {
  const sourceReview = Array.isArray(item.tags) && item.tags.includes("source-review");
  const classification = item.classification;
  if (classification === undefined) {
    if (sourceReview) {
      const severity = item.reviewStatus === "approved" ? "error" : "warning";
      issues.push({ path: `${path}.classification`, message: "Add a reviewed level, band, confidence, evidence, and inclusion reason before publishing.", severity });
    }
    return;
  }
  if (!isRecord(classification)) {
    issues.push({ path: `${path}.classification`, message: "Classification must be an object.", severity: "error" });
    return;
  }
  if (classification.itemType !== item.category) issues.push({ path: `${path}.classification.itemType`, message: `Classification itemType must be ${String(item.category)}.`, severity: "error" });
  if (classification.itemId !== item.id) issues.push({ path: `${path}.classification.itemId`, message: "Classification itemId must match the learning item ID.", severity: "error" });
  if (!["N5", "N4", "N3", "N2", "N1"].includes(classification.level as string)) issues.push({ path: `${path}.classification.level`, message: "Use N5, N4, N3, N2, or N1.", severity: "error" });
  if (!["core", "extended", "bridge"].includes(classification.band as string)) issues.push({ path: `${path}.classification.band`, message: "Use core, extended, or bridge.", severity: "error" });
  if (!["high", "medium", "low"].includes(classification.confidence as string)) issues.push({ path: `${path}.classification.confidence`, message: "Use high, medium, or low.", severity: "error" });
  stringArray(classification.evidenceSources, `${path}.classification.evidenceSources`, issues);
  stringValue(classification.inclusionReason, `${path}.classification.inclusionReason`, issues);
  stringValue(classification.reviewedAt, `${path}.classification.reviewedAt`, issues);
  if (classification.sourceLevels !== undefined) {
    if (!isRecord(classification.sourceLevels)) issues.push({ path: `${path}.classification.sourceLevels`, message: "Source levels must map source IDs to JLPT levels.", severity: "error" });
    else Object.entries(classification.sourceLevels).forEach(([sourceId, level]) => {
      if (!sourceId.trim() || !["N5", "N4", "N3", "N2", "N1"].includes(level as string)) issues.push({ path: `${path}.classification.sourceLevels.${sourceId}`, message: "Use a valid source ID and JLPT level.", severity: "error" });
    });
  }
  if (classification.conflictingLevels !== undefined && (!Array.isArray(classification.conflictingLevels) || classification.conflictingLevels.some((level) => !["N5", "N4", "N3", "N2", "N1"].includes(level as string)))) issues.push({ path: `${path}.classification.conflictingLevels`, message: "Conflicting levels must be valid JLPT levels.", severity: "error" });
  if (classification.conflict !== undefined && typeof classification.conflict !== "boolean") issues.push({ path: `${path}.classification.conflict`, message: "Classification conflict must be true or false.", severity: "error" });
  if (classification.conflict === true) issues.push({ path: `${path}.classification.conflict`, message: "Resolve conflicting source levels before approving this item.", severity: getContentReviewStatus(item) === "approved" ? "error" : "warning" });
}

function examples(value: unknown, path: string, issues: ContentIssue[], minimum = 1) {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "Add example sentences.", severity: "error" });
    return;
  }
  if (value.length < minimum) issues.push({ path, message: `Add at least ${minimum} example sentence${minimum === 1 ? "" : "s"}.`, severity: "error" });
  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push({ path: `${path}[${index}]`, message: "Example must be an object.", severity: "error" });
      return;
    }
    stringValue(entry.japanese, `${path}[${index}].japanese`, issues);
    stringValue(entry.translation, `${path}[${index}].translation`, issues);
  });
}

function baseItem(item: Record<string, unknown>, path: string, category: string, issues: ContentIssue[]) {
  stringValue(item.id, `${path}.id`, issues);
  stringValue(item.slug, `${path}.slug`, issues);
  stringValue(item.title, `${path}.title`, issues);
  if (item.category !== category) issues.push({ path: `${path}.category`, message: `Category must be ${category}.`, severity: "error" });
  if (!categories.includes(item.category as (typeof categories)[number])) issues.push({ path: `${path}.category`, message: "Unknown learning category.", severity: "error" });
  if (!["N5", "N4", "N3", "N2", "N1", null].includes(item.jlptLevel as string | null)) issues.push({ path: `${path}.jlptLevel`, message: "Use N5, N4, N3, N2, N1, or null.", severity: "error" });
  if (typeof item.difficulty !== "number" || item.difficulty < 1 || item.difficulty > 5) issues.push({ path: `${path}.difficulty`, message: "Difficulty must be a number from 1 to 5.", severity: "error" });
  if (item.reviewStatus !== undefined && !["pending", "approved", "rejected"].includes(item.reviewStatus as string)) issues.push({ path: `${path}.reviewStatus`, message: "Use pending, approved, or rejected.", severity: "error" });
  const prerequisites = stringArray(item.prerequisiteIds, `${path}.prerequisiteIds`, issues, 0);
  const tags = stringArray(item.tags, `${path}.tags`, issues, 1);
  uniqueStrings(prerequisites, `${path}.prerequisiteIds`, issues);
  uniqueStrings(tags, `${path}.tags`, issues);
  if (!Array.isArray(item.sourceIds) || item.sourceIds.length === 0 || item.sourceIds.some((sourceId) => typeof sourceId !== "string" || !sourceId.trim())) issues.push({ path: `${path}.sourceIds`, message: "Add provenance before publishing this item.", severity: "error" });
  validateClassification(item, path, issues);
}

function validateItem(item: unknown, path: string, category: (typeof categories)[number], issues: ContentIssue[]) {
  if (!isRecord(item)) {
    issues.push({ path, message: "Learning item must be an object.", severity: "error" });
    return;
  }
  baseItem(item, path, category, issues);

  if (category === "vocabulary") {
    stringValue(item.writtenForm, `${path}.writtenForm`, issues);
    stringValue(item.reading, `${path}.reading`, issues);
    stringArray(item.meanings, `${path}.meanings`, issues);
    stringValue(item.partOfSpeech, `${path}.partOfSpeech`, issues);
    optionalNonNegativeNumber(item.frequency, `${path}.frequency`, issues);
    optionalNonNegativeNumber(item.spokenFrequency, `${path}.spokenFrequency`, issues);
    examples(item.exampleSentences, `${path}.exampleSentences`, issues);
    stringArray(item.collocations, `${path}.collocations`, issues, 0);
    stringArray(item.relatedWords, `${path}.relatedWords`, issues, 0);
    stringArray(item.antonyms, `${path}.antonyms`, issues, 0);
    qualityWarning(Array.isArray(item.collocations) && item.collocations.length === 0, `${path}.collocations`, "Add at least one useful collocation before treating this word as production-ready.", issues);
  }

  if (category === "kanji") {
    const character = stringValue(item.character, `${path}.character`, issues);
    stringArray(item.meanings, `${path}.meanings`, issues);
    stringArray(item.onyomi, `${path}.onyomi`, issues, 0);
    stringArray(item.kunyomi, `${path}.kunyomi`, issues, 0);
    if (!Array.isArray(item.usefulWords) || !item.usefulWords.length) issues.push({ path: `${path}.usefulWords`, message: "Add vocabulary-driven useful words.", severity: "error" });
    else item.usefulWords.forEach((word, index) => {
      const wordPath = `${path}.usefulWords[${index}]`;
      if (!isRecord(word)) {
        issues.push({ path: wordPath, message: "Useful word must be an object.", severity: "error" });
        return;
      }
      const written = stringValue(word.word, `${wordPath}.word`, issues);
      stringValue(word.reading, `${wordPath}.reading`, issues);
      stringValue(word.meaning, `${wordPath}.meaning`, issues);
      if (character && written && !written.includes(character)) issues.push({ path: `${wordPath}.word`, message: `Useful word should contain ${character}.`, severity: "error" });
    });
    qualityWarning(Array.isArray(item.usefulWords) && item.usefulWords.length < 2, `${path}.usefulWords`, "Add a second useful word so this kanji is learned in more than one context.", issues);
  }

  if (category === "grammar") {
    stringValue(item.pattern, `${path}.pattern`, issues);
    stringValue(item.meaning, `${path}.meaning`, issues);
    stringValue(item.formation, `${path}.formation`, issues);
    stringValue(item.intuition, `${path}.intuition`, issues);
    stringArray(item.usageConditions, `${path}.usageConditions`, issues);
    examples(item.examples, `${path}.examples`, issues, 2);
    stringArray(item.commonMistakes, `${path}.commonMistakes`, issues);
    stringArray(item.contrastIds, `${path}.contrastIds`, issues, 0);
    const practiceQuestionIds = stringArray(item.practiceQuestionIds, `${path}.practiceQuestionIds`, issues, 0);
    uniqueStrings(practiceQuestionIds, `${path}.practiceQuestionIds`, issues);
    qualityWarning(practiceQuestionIds.length < 2, `${path}.practiceQuestionIds`, "Add at least two authored practice question IDs for a reusable grammar point.", issues);
  }

  if (category === "reading") {
    stringValue(item.passage, `${path}.passage`, issues);
    stringValue(item.translation, `${path}.translation`, issues);
    stringArray(item.vocabularyIds, `${path}.vocabularyIds`, issues, 0);
    stringArray(item.grammarIds, `${path}.grammarIds`, issues, 0);
    stringArray(item.kanjiIds, `${path}.kanjiIds`, issues, 0);
    qualityWarning(Array.isArray(item.vocabularyIds) && item.vocabularyIds.length === 0, `${path}.vocabularyIds`, "Link the passage to the vocabulary it is meant to reinforce.", issues);
    qualityWarning(Array.isArray(item.grammarIds) && item.grammarIds.length === 0, `${path}.grammarIds`, "Link at least one grammar point when the passage applies one.", issues);
    qualityWarning(Array.isArray(item.kanjiIds) && item.kanjiIds.length === 0, `${path}.kanjiIds`, "Link the passage to contextual kanji where applicable.", issues);
    if (typeof item.estimatedDifficulty !== "number" || item.estimatedDifficulty < 1 || item.estimatedDifficulty > 5) issues.push({ path: `${path}.estimatedDifficulty`, message: "Estimated difficulty must be a number from 1 to 5.", severity: "error" });
    if (item.questions !== undefined) {
      if (!Array.isArray(item.questions) || !item.questions.length) issues.push({ path: `${path}.questions`, message: "Add at least one reading question or omit the field.", severity: "error" });
      else item.questions.forEach((question, index) => {
        const questionPath = `${path}.questions[${index}]`;
        if (!isRecord(question)) {
          issues.push({ path: questionPath, message: "Question must be an object.", severity: "error" });
          return;
        }
        stringValue(question.prompt, `${questionPath}.prompt`, issues);
        const options = stringArray(question.options, `${questionPath}.options`, issues, 2);
        uniqueStrings(options, `${questionPath}.options`, issues);
        uniqueNormalizedStrings(options, `${questionPath}.options`, issues);
        if (typeof question.correctAnswer !== "number" || !Number.isInteger(question.correctAnswer) || question.correctAnswer < 0 || question.correctAnswer >= options.length) issues.push({ path: `${questionPath}.correctAnswer`, message: "Correct answer must point to one option.", severity: "error" });
        stringValue(question.questionType, `${questionPath}.questionType`, issues, false);
        stringValue(question.explanation, `${questionPath}.explanation`, issues, false);
      });
    }
  }

  if (category === "listening") {
    stringValue(item.situation, `${path}.situation`, issues);
    stringValue(item.voice, `${path}.voice`, issues);
    stringValue(item.transcript, `${path}.transcript`, issues);
    if (typeof item.speed !== "number" || item.speed <= 0) issues.push({ path: `${path}.speed`, message: "Speed must be greater than zero.", severity: "error" });
    if (!["recorded", "tts", "imported"].includes(item.sourceType as string)) issues.push({ path: `${path}.sourceType`, message: "Use recorded, tts, or imported.", severity: "error" });
    if (!Array.isArray(item.questions) || !item.questions.length) {
      issues.push({ path: `${path}.questions`, message: "Add at least one listening question.", severity: "error" });
    } else {
      item.questions.forEach((question, index) => {
        if (!isRecord(question)) {
          issues.push({ path: `${path}.questions[${index}]`, message: "Question must be an object.", severity: "error" });
          return;
        }
        stringValue(question.prompt, `${path}.questions[${index}].prompt`, issues);
        const answers = stringArray(question.answers, `${path}.questions[${index}].answers`, issues, 2);
        uniqueStrings(answers, `${path}.questions[${index}].answers`, issues);
        uniqueNormalizedStrings(answers, `${path}.questions[${index}].answers`, issues);
        if (typeof question.correctAnswer !== "number" || !Number.isInteger(question.correctAnswer) || question.correctAnswer < 0 || question.correctAnswer >= answers.length) issues.push({ path: `${path}.questions[${index}].correctAnswer`, message: "Correct answer must point to one answer.", severity: "error" });
        stringValue(question.questionType, `${path}.questions[${index}].questionType`, issues, false);
        stringValue(question.explanation, `${path}.questions[${index}].explanation`, issues, false);
      });
    }
  }
}

export function validateLearningItem(item: unknown): ContentValidationResult {
  const issues: ContentIssue[] = [];
  const category = isRecord(item) && categories.includes(item.category as Category) ? item.category as Category : null;
  if (!category) {
    issues.push({ path: "item.category", message: "Item must have a known learning category.", severity: "error" });
  } else {
    validateItem(item, "item", category, issues);
  }
  const errors = issues.filter((issue) => issue.severity === "error");
  return { valid: errors.length === 0, checked: 1, errors, warnings: issues.filter((issue) => issue.severity === "warning") };
}

function validateReferences(module: Record<string, unknown>, ids: Set<string>, issues: ContentIssue[]) {
  const allItems = categories.flatMap((category) => Array.isArray(module[collectionKeys[category]]) ? module[collectionKeys[category]] as unknown[] : []);
  const idsByCategory = new Map<Category, Set<string>>(categories.map((category) => {
    const items = Array.isArray(module[collectionKeys[category]]) ? module[collectionKeys[category]] as unknown[] : [];
    return [category, new Set(items.flatMap((item) => isRecord(item) && typeof item.id === "string" ? [item.id] : []))];
  }));
  const checkLinks = (item: Record<string, unknown>, field: string, category: (typeof categories)[number]) => {
    const linked = Array.isArray(item[field]) ? item[field] : [];
    linked.forEach((id, index) => { if (typeof id === "string" && !idsByCategory.get(category)?.has(id)) issues.push({ path: `${item.id ?? "item"}.${field}[${index}]`, message: `Unknown ${category} reference: ${id}.`, severity: "error" }); });
  };
  allItems.forEach((rawItem, index) => {
    if (!isRecord(rawItem)) return;
    const itemId = typeof rawItem.id === "string" ? rawItem.id : `${index}`;
    const prerequisites = Array.isArray(rawItem.prerequisiteIds) ? rawItem.prerequisiteIds : [];
    prerequisites.forEach((id, prerequisiteIndex) => {
      if (typeof id === "string" && !ids.has(id)) issues.push({ path: `${itemId}.prerequisiteIds[${prerequisiteIndex}]`, message: `Unknown prerequisite: ${id}.`, severity: "error" });
    });
    if (rawItem.category === "reading") {
      checkLinks(rawItem, "vocabularyIds", "vocabulary");
      checkLinks(rawItem, "grammarIds", "grammar");
      checkLinks(rawItem, "kanjiIds", "kanji");
    }
  });

  const contrastIds = new Set((Array.isArray(module.grammarContrasts) ? module.grammarContrasts : []).flatMap((contrast) => isRecord(contrast) && typeof contrast.id === "string" ? [contrast.id] : []));
  (Array.isArray(module.grammar) ? module.grammar : []).forEach((grammar) => {
    if (!isRecord(grammar) || !Array.isArray(grammar.contrastIds)) return;
    grammar.contrastIds.forEach((id, index) => { if (typeof id === "string" && !contrastIds.has(id)) issues.push({ path: `${grammar.id ?? "grammar"}.contrastIds[${index}]`, message: `Unknown grammar contrast: ${id}.`, severity: "error" }); });
  });

  const assignedIds = new Set<string>();
  const course = isRecord(module.course) ? module.course : null;
  const chapters = course && Array.isArray(course.chapters) ? course.chapters : [];
  chapters.forEach((rawChapter, chapterIndex) => {
    if (!isRecord(rawChapter) || !Array.isArray(rawChapter.lessons)) return;
    rawChapter.lessons.forEach((rawLesson, lessonIndex) => {
      if (!isRecord(rawLesson) || !Array.isArray(rawLesson.itemIds)) return;
      rawLesson.itemIds.forEach((id, itemIndex) => {
        if (typeof id === "string") assignedIds.add(id);
        if (typeof id === "string" && !ids.has(id)) issues.push({ path: `course.chapters[${chapterIndex}].lessons[${lessonIndex}].itemIds[${itemIndex}]`, message: `Unknown learning item: ${id}.`, severity: "error" });
      });
    });
  });
  categories.forEach((category) => {
    const items = Array.isArray(module[collectionKeys[category]]) ? module[collectionKeys[category]] as unknown[] : [];
    items.forEach((item: unknown, index: number) => {
      if (isRecord(item) && typeof item.id === "string") qualityWarning(!assignedIds.has(item.id), `${collectionKeys[category]}[${index}].id`, "Assign this item to a Journey lesson before publishing it.", issues);
    });
  });
}

function validateCourse(value: unknown, ids: Set<string>, issues: ContentIssue[]) {
  if (!isRecord(value)) return;
  stringValue(value.id, "course.id", issues);
  stringValue(value.slug, "course.slug", issues);
  stringValue(value.title, "course.title", issues);
  stringValue(value.description, "course.description", issues);
  if (!Array.isArray(value.chapters) || !value.chapters.length) {
    issues.push({ path: "course.chapters", message: "Add at least one chapter.", severity: "error" });
    return;
  }
  const chapterIds = new Set<string>();
  value.chapters.forEach((chapter, chapterIndex) => {
    const path = `course.chapters[${chapterIndex}]`;
    if (!isRecord(chapter)) {
      issues.push({ path, message: "Chapter must be an object.", severity: "error" });
      return;
    }
    const chapterId = stringValue(chapter.id, `${path}.id`, issues);
    if (chapterId && chapterIds.has(chapterId)) issues.push({ path: `${path}.id`, message: `Duplicate chapter id: ${chapterId}.`, severity: "error" });
    if (chapterId) chapterIds.add(chapterId);
    stringValue(chapter.slug, `${path}.slug`, issues);
    stringValue(chapter.title, `${path}.title`, issues);
    stringValue(chapter.description, `${path}.description`, issues);
    stringValue(chapter.region, `${path}.region`, issues);
    if (!Array.isArray(chapter.lessons) || !chapter.lessons.length) {
      issues.push({ path: `${path}.lessons`, message: "Add at least one lesson.", severity: "error" });
      return;
    }
    const lessonIds = new Set<string>();
    chapter.lessons.forEach((lesson, lessonIndex) => {
      const lessonPath = `${path}.lessons[${lessonIndex}]`;
      if (!isRecord(lesson)) {
        issues.push({ path: lessonPath, message: "Lesson must be an object.", severity: "error" });
        return;
      }
      const lessonId = stringValue(lesson.id, `${lessonPath}.id`, issues);
      if (lessonId && lessonIds.has(lessonId)) issues.push({ path: `${lessonPath}.id`, message: `Duplicate lesson id: ${lessonId}.`, severity: "error" });
      if (lessonId) lessonIds.add(lessonId);
      stringValue(lesson.slug, `${lessonPath}.slug`, issues);
      stringValue(lesson.title, `${lessonPath}.title`, issues);
      stringValue(lesson.subtitle, `${lessonPath}.subtitle`, issues);
      stringValue(lesson.description, `${lessonPath}.description`, issues);
      if (typeof lesson.estimatedMinutes !== "number" || lesson.estimatedMinutes <= 0) issues.push({ path: `${lessonPath}.estimatedMinutes`, message: "Estimated minutes must be greater than zero.", severity: "error" });
      const itemIds = stringArray(lesson.itemIds, `${lessonPath}.itemIds`, issues, 0);
      uniqueStrings(itemIds, `${lessonPath}.itemIds`, issues);
    });
  });
}

function validateContrasts(value: unknown, grammarIds: Set<string>, issues: ContentIssue[]) {
  if (!Array.isArray(value)) {
    issues.push({ path: "grammarContrasts", message: "Add the grammar contrasts array.", severity: "error" });
    return;
  }
  const ids = new Set<string>();
  value.forEach((contrast, index) => {
    const path = `grammarContrasts[${index}]`;
    if (!isRecord(contrast)) {
      issues.push({ path, message: "Contrast must be an object.", severity: "error" });
      return;
    }
    const id = stringValue(contrast.id, `${path}.id`, issues);
    if (id && ids.has(id)) issues.push({ path: `${path}.id`, message: `Duplicate contrast id: ${id}.`, severity: "error" });
    if (id) ids.add(id);
    stringValue(contrast.title, `${path}.title`, issues);
    stringValue(contrast.explanation, `${path}.explanation`, issues);
    const linkedGrammar = stringArray(contrast.grammarPointIds, `${path}.grammarPointIds`, issues);
    linkedGrammar.forEach((grammarId, grammarIndex) => { if (!grammarIds.has(grammarId)) issues.push({ path: `${path}.grammarPointIds[${grammarIndex}]`, message: `Unknown grammar point: ${grammarId}.`, severity: "error" }); });
    examples(contrast.examples, `${path}.examples`, issues, 2);
    stringArray(contrast.exercises, `${path}.exercises`, issues);
  });
}

function validateSourceManifest(value: unknown, items: unknown[], issues: ContentIssue[]) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    issues.push({ path: "sourceManifest", message: "Source manifest must be an array.", severity: "error" });
    return;
  }
  const sourceIds = new Set<string>();
  value.forEach((source, index) => {
    const path = `sourceManifest[${index}]`;
    if (!isRecord(source)) {
      issues.push({ path, message: "Source record must be an object.", severity: "error" });
      return;
    }
    const id = stringValue(source.id, `${path}.id`, issues);
    if (id && sourceIds.has(id)) issues.push({ path: `${path}.id`, message: `Duplicate source id: ${id}.`, severity: "error" });
    if (id) sourceIds.add(id);
    stringValue(source.name, `${path}.name`, issues);
    if (!["official", "dictionary", "curriculum", "frequency", "examples", "generated", "user"].includes(source.type as string)) issues.push({ path: `${path}.type`, message: "Unknown source type.", severity: "error" });
  });
  items.forEach((item) => {
    if (!isRecord(item)) return;
    if (Array.isArray(item.sourceIds)) item.sourceIds.forEach((sourceId, index) => {
      if (typeof sourceId === "string" && !sourceIds.has(sourceId)) issues.push({ path: `${item.id ?? "item"}.sourceIds[${index}]`, message: `Unknown source: ${sourceId}.`, severity: "error" });
    });
    if (item.fieldSourceIds === undefined) return;
    if (!isRecord(item.fieldSourceIds)) {
      issues.push({ path: `${item.id ?? "item"}.fieldSourceIds`, message: "Field provenance must be an object of field names to source IDs.", severity: "error" });
      return;
    }
    Object.entries(item.fieldSourceIds).forEach(([field, values]) => {
      if (!Array.isArray(values) || !values.length || values.some((sourceId) => typeof sourceId !== "string" || !sourceId.trim())) {
        issues.push({ path: `${item.id ?? "item"}.fieldSourceIds.${field}`, message: "Add one or more valid source IDs.", severity: "error" });
        return;
      }
      values.forEach((sourceId, index) => { if (!sourceIds.has(sourceId as string)) issues.push({ path: `${item.id ?? "item"}.fieldSourceIds.${field}[${index}]`, message: `Unknown source: ${sourceId}.`, severity: "error" }); });
    });
  });
}

export function validateModule(value: unknown): ContentValidationResult {
  const issues: ContentIssue[] = [];
  if (!isRecord(value)) return { valid: false, checked: 0, errors: [{ path: "root", message: "Content package must be a JSON object.", severity: "error" }], warnings: [] };

  const ids = new Set<string>();
  categories.forEach((category) => {
    const key = collectionKeys[category];
    const items = value[key];
    if (!Array.isArray(items)) {
      issues.push({ path: key, message: `Add the ${key} array.`, severity: "error" });
      return;
    }
    items.forEach((item, index) => {
      validateItem(item, `${key}[${index}]`, category, issues);
      if (isRecord(item) && typeof item.id === "string") {
        if (ids.has(item.id)) issues.push({ path: `${key}[${index}].id`, message: `Duplicate learning item id: ${item.id}.`, severity: "error" });
        ids.add(item.id);
      }
    });
  });

  if (!isRecord(value.course)) issues.push({ path: "course", message: "Add the course hierarchy.", severity: "error" });
  validateCourse(value.course, ids, issues);
  const grammarIds = new Set((Array.isArray(value.grammar) ? value.grammar : []).flatMap((item) => isRecord(item) && typeof item.id === "string" ? [item.id] : []));
  validateContrasts(value.grammarContrasts, grammarIds, issues);
  validateReferences(value, ids, issues);
  validateSourceManifest(value, categories.flatMap((category) => Array.isArray(value[collectionKeys[category]]) ? value[collectionKeys[category]] : []), issues);
  const errors = issues.filter((issue) => issue.severity === "error");
  return { valid: errors.length === 0, checked: ids.size, errors, warnings: issues.filter((issue) => issue.severity === "warning") };
}

export function validatePracticeQuestions(questions: unknown, knownItemIds: Set<string>, knownItemCategories?: Map<string, LearningCategory>): ContentValidationResult {
  const issues: ContentIssue[] = [];
  if (!Array.isArray(questions)) return { valid: false, checked: 0, errors: [{ path: "questions", message: "Questions must be an array.", severity: "error" }], warnings: [] };
  const questionIds = new Set<string>();
  questions.forEach((rawQuestion, index) => {
    const path = `questions[${index}]`;
    if (!isRecord(rawQuestion)) {
      issues.push({ path, message: "Question must be an object.", severity: "error" });
      return;
    }
    const id = stringValue(rawQuestion.id, `${path}.id`, issues);
    if (id && questionIds.has(id)) issues.push({ path: `${path}.id`, message: `Duplicate question id: ${id}.`, severity: "error" });
    if (id) questionIds.add(id);
    const itemId = stringValue(rawQuestion.itemId, `${path}.itemId`, issues);
    if (itemId && !knownItemIds.has(itemId)) issues.push({ path: `${path}.itemId`, message: `Unknown learning item: ${itemId}.`, severity: "error" });
    const category = stringValue(rawQuestion.category, `${path}.category`, issues);
    if (category && !categories.includes(category as (typeof categories)[number])) issues.push({ path: `${path}.category`, message: "Unknown learning category.", severity: "error" });
    if (itemId && category && knownItemCategories?.get(itemId) && knownItemCategories.get(itemId) !== category) issues.push({ path: `${path}.category`, message: `Question category must match ${knownItemCategories.get(itemId)}.`, severity: "error" });
    if (category && categories.includes(category as Category) && typeof rawQuestion.questionType === "string" && !practiceQuestionTypes[category as Category].includes(rawQuestion.questionType)) issues.push({ path: `${path}.questionType`, message: `Question type is not supported for ${category}.`, severity: "error" });
    if (!['N5', 'N4', 'N3', 'N2', 'N1', null].includes(rawQuestion.jlptLevel as string | null)) issues.push({ path: `${path}.jlptLevel`, message: "Use N5, N4, N3, N2, N1, or null.", severity: "error" });
    stringValue(rawQuestion.questionType, `${path}.questionType`, issues);
    stringValue(rawQuestion.prompt, `${path}.prompt`, issues);
    stringValue(rawQuestion.explanation, `${path}.explanation`, issues);
    if (rawQuestion.validationStatus !== undefined && !["generated", "validated", "rejected"].includes(rawQuestion.validationStatus as string)) issues.push({ path: `${path}.validationStatus`, message: "Use generated, validated, or rejected.", severity: "error" });
    if (rawQuestion.generatedBy !== undefined) stringValue(rawQuestion.generatedBy, `${path}.generatedBy`, issues, false);
    if (rawQuestion.validationStatus === "validated" && typeof rawQuestion.generatedBy !== "string") issues.push({ path: `${path}.generatedBy`, message: "Validated questions need a provenance label.", severity: "error" });
    if (rawQuestion.validationStatus === "validated" && typeof rawQuestion.generatedBy === "string" && rawQuestion.generatedBy.startsWith("openrouter:")) {
      const review = rawQuestion.review;
      if (!isRecord(review) || review.status !== "approved" || typeof review.reviewedBy !== "string" || !review.reviewedBy.trim() || typeof review.reviewedAt !== "string" || !review.reviewedAt.trim()) issues.push({ path: `${path}.review`, message: "AI questions need human approval, reviewer, and review timestamp before activation.", severity: "error" });
    }
    const answerMode = rawQuestion.answerMode ?? "choice";
    if (answerMode !== "choice" && answerMode !== "text") issues.push({ path: `${path}.answerMode`, message: "Use choice or text.", severity: "error" });
    if (answerMode === "text") {
      const acceptedAnswers = stringArray(rawQuestion.acceptedAnswers, `${path}.acceptedAnswers`, issues);
      if (!acceptedAnswers.length) issues.push({ path: `${path}.acceptedAnswers`, message: "Add at least one accepted answer for typed questions.", severity: "error" });
      uniqueStrings(acceptedAnswers, `${path}.acceptedAnswers`, issues);
      uniqueNormalizedStrings(acceptedAnswers, `${path}.acceptedAnswers`, issues);
    } else {
      const options = stringArray(rawQuestion.options, `${path}.options`, issues, 2);
      uniqueStrings(options, `${path}.options`, issues);
      uniqueNormalizedStrings(options, `${path}.options`, issues);
      if (typeof rawQuestion.correctIndex !== "number" || !Number.isInteger(rawQuestion.correctIndex) || rawQuestion.correctIndex < 0 || rawQuestion.correctIndex >= options.length) issues.push({ path: `${path}.correctIndex`, message: "Correct answer must point to one option.", severity: "error" });
    }
    if (rawQuestion.questionType === "sentence ordering") {
      const tokens = stringArray(rawQuestion.tokens, `${path}.tokens`, issues, 2);
      const order = Array.isArray(rawQuestion.correctOrder) ? rawQuestion.correctOrder : [];
      if (order.length !== tokens.length || order.some((entry) => typeof entry !== "number" || entry < 0 || entry >= tokens.length) || new Set(order).size !== tokens.length) issues.push({ path: `${path}.correctOrder`, message: "Correct order must use every token exactly once.", severity: "error" });
    }
  });
  const errors = issues.filter((issue) => issue.severity === "error");
  return { valid: errors.length === 0, checked: questions.length, errors, warnings: issues.filter((issue) => issue.severity === "warning") };
}

export function parseAndValidateModule(raw: string): { value: N5Module | null; result: ContentValidationResult } {
  try {
    const value = JSON.parse(raw) as unknown;
    const result = validateModule(value);
    return { value: result.valid ? value as N5Module : null, result };
  } catch (error) {
    return {
      value: null,
      result: { valid: false, checked: 0, errors: [{ path: "json", message: error instanceof Error ? error.message : "Invalid JSON.", severity: "error" }], warnings: [] },
    };
  }
}

export function parseModuleForReview(raw: string): N5Module | null {
  try {
    const value = JSON.parse(raw) as unknown;
    if (!isRecord(value)) return null;
    const draft = { ...value } as Record<string, unknown>;
    categories.forEach((category) => {
      const key = collectionKeys[category];
      if (!Array.isArray(draft[key])) draft[key] = [];
    });
    return draft as unknown as N5Module;
  } catch {
    return null;
  }
}

export function readValidatedContentDraft(): N5Module | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONTENT_DRAFT_STORAGE_KEY);
    const value = raw ? parseAndValidateModule(raw).value : null;
    return value && getModuleItems(value).every((item) => getContentReviewStatus(item) !== "pending") ? value : null;
  } catch {
    return null;
  }
}

export function readValidatedQuestionDraft(knownItemIds: Set<string>, knownItemCategories?: Map<string, LearningCategory>): PracticeQuestion[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(QUESTION_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const questions = JSON.parse(raw) as unknown;
    const result = validatePracticeQuestions(questions, knownItemIds, knownItemCategories);
    if (!result.valid) return null;
    const active = (questions as PracticeQuestion[]).filter(isActivePracticeQuestion);
    return active.length ? active : null;
  } catch {
    return null;
  }
}

export function getModuleItems(module: N5Module) {
  return [...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening];
}
