import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { normalizeGrammarPracticeIds } from "@/lib/curriculum";
import type { AudioMetadata, ContentReviewStatus, ContentSource, CurriculumClassification, ExampleSentence, GrammarContrast, GrammarItem, KanjiItem, LearningItem, ListeningItem, N5Module, PracticeQuestion, ReadingItem, VocabularyItem } from "@/lib/types";

function examples(value: unknown, fallback: ExampleSentence[] = []) {
  return Array.isArray(value) ? value as ExampleSentence[] : fallback;
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function numbers(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is number => typeof entry === "number" && Number.isInteger(entry)) : [];
}

function fieldSources(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const entries = Object.entries(value).flatMap(([field, sources]) => {
    const ids = strings(sources);
    return ids.length ? [[field, ids] as [string, string[]]] : [];
  });
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function baseItem(row: {
  id: string;
  slug: string;
  item_type: string;
  jlpt_level: LearningItem["jlptLevel"];
  subcategory: string | null;
  difficulty: number;
  prerequisite_ids: string[];
  tags: string[];
  review_status?: ContentReviewStatus | null;
  field_source_ids?: unknown;
  audio_metadata?: unknown;
}, title: string, sourceIdsByItem: Map<string, string[]>, classificationsByItem: Map<string, CurriculumClassification>): LearningItem {
  const sourceIds = sourceIdsByItem.get(row.id);
  return {
    id: row.id,
    slug: row.slug,
    title,
    jlptLevel: row.jlpt_level,
    category: row.item_type as LearningItem["category"],
    reviewStatus: row.review_status === "pending" || row.review_status === "rejected" ? row.review_status : "approved",
    subcategory: row.subcategory ?? undefined,
    difficulty: row.difficulty,
    prerequisiteIds: row.prerequisite_ids,
    tags: row.tags,
    sourceIds: sourceIds?.length ? sourceIds : ["michi-curated-n5-seed"],
    fieldSourceIds: fieldSources(row.field_source_ids),
    audio: row.audio_metadata && typeof row.audio_metadata === "object" && !Array.isArray(row.audio_metadata) ? row.audio_metadata as AudioMetadata : undefined,
    classification: classificationsByItem.get(`${row.item_type}:${row.id}`),
  };
}

export async function fetchSupabaseN5Module(seed: N5Module): Promise<N5Module | null> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;

  const [courseResult, chapterResult, lessonResult, itemResult, vocabularyResult, kanjiResult, grammarResult, contrastResult, readingResult, listeningResult, lessonItemResult, practiceQuestionResult, sourceLinkResult, classificationResult, sourceResult] = await Promise.all([
    supabase.from("courses").select("*").eq("slug", seed.course.slug).maybeSingle(),
    supabase.from("chapters").select("*").order("sort_order"),
    supabase.from("lessons").select("*").order("sort_order"),
    supabase.from("learning_items").select("*").eq("review_status", "approved"),
    supabase.from("vocabulary").select("*"),
    supabase.from("kanji").select("*"),
    supabase.from("grammar_points").select("*"),
    supabase.from("grammar_contrasts").select("*"),
    supabase.from("readings").select("*"),
    supabase.from("listening_exercises").select("*"),
    supabase.from("lesson_learning_items").select("*").order("sort_order"),
    supabase.from("practice_questions").select("*").eq("validation_status", "validated"),
    supabase.from("learning_item_sources").select("item_id, source_id"),
    supabase.from("curriculum_classifications").select("*"),
    supabase.from("content_sources").select("*"),
  ]);

  if ([courseResult, chapterResult, lessonResult, itemResult, vocabularyResult, kanjiResult, grammarResult, contrastResult, readingResult, listeningResult, lessonItemResult, practiceQuestionResult, sourceLinkResult, classificationResult].some((result) => result.error) || !courseResult.data) return null;

  const itemRows = itemResult.data ?? [];
  const items = new Map(itemRows.map((item) => [item.id, item]));
  const sourceIdsByItem = new Map<string, string[]>();
  (sourceLinkResult.data ?? []).forEach((link) => sourceIdsByItem.set(link.item_id, [...(sourceIdsByItem.get(link.item_id) ?? []), link.source_id]));
  const classificationsByItem = new Map<string, CurriculumClassification>((classificationResult.data ?? []).map((row) => [`${row.item_type}:${row.item_id}`, { itemType: row.item_type, itemId: row.item_id, level: row.level, band: row.band, confidence: row.confidence, evidenceSources: row.evidence_sources, inclusionReason: row.inclusion_reason, reviewedAt: row.reviewed_at }]));
  const vocabulary = (vocabularyResult.data ?? []).map((row): VocabularyItem | null => {
    const base = items.get(row.item_id);
    return base ? { ...baseItem(base, row.written_form, sourceIdsByItem, classificationsByItem), category: "vocabulary", writtenForm: row.written_form, reading: row.reading, meanings: row.meanings, partOfSpeech: row.part_of_speech, commonness: row.commonness ?? undefined, frequency: row.frequency ?? undefined, frequencyMetadata: row.frequency_metadata && typeof row.frequency_metadata === "object" ? row.frequency_metadata as Record<string, unknown> : undefined, spokenFrequency: row.spoken_frequency ?? undefined, spokenFrequencyMetadata: row.spoken_frequency_metadata && typeof row.spoken_frequency_metadata === "object" ? row.spoken_frequency_metadata as Record<string, unknown> : undefined, exampleSentences: examples(row.example_sentences), collocations: row.collocations, relatedWords: row.related_words, antonyms: row.antonyms, notes: row.notes ?? undefined, audioUrl: row.audio_url } : null;
  }).filter((item): item is VocabularyItem => Boolean(item));
  const kanji = (kanjiResult.data ?? []).map((row): KanjiItem | null => {
    const base = items.get(row.item_id);
    return base ? { ...baseItem(base, row.character, sourceIdsByItem, classificationsByItem), category: "kanji", character: row.character, meanings: row.meanings, onyomi: row.onyomi, kunyomi: row.kunyomi, strokeCount: row.stroke_count ?? undefined, grade: row.grade ?? undefined, radical: row.radical ?? undefined, nanori: row.nanori, components: row.components, mnemonic: row.mnemonic ?? undefined, strokeOrder: row.stroke_order ?? undefined, usefulWords: Array.isArray(row.useful_words) ? row.useful_words as KanjiItem["usefulWords"] : [] } : null;
  }).filter((item): item is KanjiItem => Boolean(item));
  const grammar = normalizeGrammarPracticeIds((grammarResult.data ?? []).map((row): GrammarItem | null => {
    const base = items.get(row.item_id);
    return base ? { ...baseItem(base, row.pattern, sourceIdsByItem, classificationsByItem), category: "grammar", pattern: row.pattern, meaning: row.meaning, formation: row.formation, intuition: row.intuition, usageConditions: row.usage_conditions, examples: examples(row.examples), commonMistakes: row.common_mistakes, contrastIds: row.contrast_ids, practiceQuestionIds: row.practice_question_ids } : null;
  }).filter((item): item is GrammarItem => Boolean(item)));
  const readings = (readingResult.data ?? []).map((row): ReadingItem | null => {
    const base = items.get(row.item_id);
    const fallback = seed.readings.find((item) => item.id === row.item_id);
    return base ? { ...baseItem(base, row.title, sourceIdsByItem, classificationsByItem), category: "reading", title: row.title, passage: row.passage, translation: row.translation, vocabularyIds: row.vocabulary_ids, grammarIds: row.grammar_ids, kanjiIds: row.kanji_ids, estimatedDifficulty: row.estimated_difficulty, questions: fallback?.questions } : null;
  }).filter((item): item is ReadingItem => Boolean(item));
  const listening = (listeningResult.data ?? []).map((row): ListeningItem | null => {
    const base = items.get(row.item_id);
    const fallback = seed.listening.find((item) => item.id === row.item_id);
    return base ? { ...baseItem(base, row.title, sourceIdsByItem, classificationsByItem), category: "listening", title: row.title, situation: row.situation, audioUrl: row.audio_url, voice: row.voice ?? fallback?.voice ?? "ja-JP", speed: row.speed, sourceType: row.source_type, transcript: row.transcript ?? fallback?.transcript ?? "", questions: Array.isArray(row.questions) ? row.questions as ListeningItem["questions"] : fallback?.questions ?? [] } : null;
  }).filter((item): item is ListeningItem => Boolean(item));
  const practiceQuestions = (practiceQuestionResult.data ?? []).map((row): PracticeQuestion => ({
    id: row.id,
    itemId: row.item_id,
    category: row.category,
    questionType: row.question_type,
    jlptLevel: row.jlpt_level,
    prompt: row.prompt,
    options: strings(row.options),
    correctIndex: row.correct_index,
    explanation: row.explanation,
    answerMode: row.answer_mode,
    acceptedAnswers: strings(row.accepted_answers),
    tokens: strings(row.tokens),
    correctOrder: numbers(row.correct_order),
    audioUrl: row.audio_url,
    audioText: row.audio_text,
    audio: row.audio_metadata && typeof row.audio_metadata === "object" && !Array.isArray(row.audio_metadata) ? row.audio_metadata as AudioMetadata : undefined,
    validationStatus: row.validation_status,
    generatedBy: row.generated_by ?? undefined,
    review: row.review_metadata && typeof row.review_metadata === "object" ? row.review_metadata as PracticeQuestion["review"] : undefined,
  }));
  const expectedCounts = ["vocabulary", "kanji", "grammar", "reading", "listening"].map((category) => itemRows.filter((item) => item.item_type === category).length);
  const actualCounts = [vocabulary.length, kanji.length, grammar.length, readings.length, listening.length];
  if (expectedCounts.some((count, index) => count !== actualCounts[index])) return null;
  const localCounts = [seed.vocabulary.length, seed.kanji.length, seed.grammar.length, seed.readings.length, seed.listening.length];
  if (actualCounts.some((count, index) => count < localCounts[index])) return null;

  const itemIdsByLesson = new Map<string, string[]>();
  (lessonItemResult.data ?? []).forEach((row) => itemIdsByLesson.set(row.lesson_id, [...(itemIdsByLesson.get(row.lesson_id) ?? []), row.item_id]));
  const chapters = (chapterResult.data ?? []).filter((chapter) => chapter.course_id === courseResult.data.id).map((chapter) => ({
    id: chapter.id,
    slug: chapter.slug,
    title: chapter.title,
    description: chapter.description ?? "",
    region: chapter.region,
    lessons: (lessonResult.data ?? []).filter((lesson) => lesson.chapter_id === chapter.id).map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      subtitle: lesson.subtitle,
      description: lesson.description ?? "",
      estimatedMinutes: lesson.estimated_minutes,
      itemIds: itemIdsByLesson.get(lesson.id) ?? [],
    })),
  }));
  const remoteLessonIds = new Set(chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id)));
  const seedLessons = seed.course.chapters.flatMap((chapter) => chapter.lessons);
  if (seedLessons.some((lesson) => !remoteLessonIds.has(lesson.id) || lesson.itemIds.some((itemId) => !itemIdsByLesson.get(lesson.id)?.includes(itemId)))) return null;
  const grammarContrasts = (contrastResult.data ?? []).map((row): GrammarContrast => ({ id: row.id, title: row.title, grammarPointIds: row.grammar_point_ids, explanation: row.explanation, examples: examples(row.examples), exercises: row.exercises }));
  const sourceManifest = sourceResult.error ? seed.sourceManifest ?? [] : (sourceResult.data ?? []).map((row): ContentSource => ({ id: row.id, name: row.name, type: row.source_type, url: row.url ?? undefined, license: row.license ?? undefined, retrievedAt: row.retrieved_at ?? undefined, notes: row.notes ?? undefined, sha256: row.sha256 ?? undefined, localFilename: row.local_filename ?? undefined }));

  return {
    course: { id: courseResult.data.id, slug: courseResult.data.slug, title: courseResult.data.title, description: courseResult.data.description ?? seed.course.description, jlptLevel: courseResult.data.jlpt_level, chapters },
    vocabulary,
    kanji,
    grammar,
    grammarContrasts,
    readings,
    listening,
    practiceQuestions,
    sourceManifest,
  };
}
