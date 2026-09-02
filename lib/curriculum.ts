import moduleData from "@/data/n5-foundations.json";
import expansionData from "@/data/n5-conversation-expansion.json";
import practicalExpansionData from "@/data/n5-practical-expansion.json";
import lifeExpansionData from "@/data/n5-life-expansion.json";
import authoredPracticeData from "@/data/n5-authored-practice.json";
import originalReadingData from "@/data/original-reading-bank.json";
import originalListeningData from "@/data/original-listening-bank.json";

import { contentSources } from "@/lib/jlpt";
import type { GrammarItem, JourneyNode, KanjiItem, Lesson, ListeningItem, N5Module, ReadingItem, TargetLevel, VocabularyItem } from "@/lib/types";

const sourceAware = <T extends object>(items: T[]) => items.map((item) => ({ ...item, sourceIds: (item as { sourceIds?: string[] }).sourceIds ?? ["michi-curated-n5-seed"] }));

const foundationVocabulary = moduleData.vocabulary as unknown as VocabularyItem[];
const foundationKanji = moduleData.kanji as unknown as KanjiItem[];
const foundationGrammar = moduleData.grammar as unknown as GrammarItem[];
const foundationReadings = moduleData.readings as unknown as ReadingItem[];
const foundationListening = moduleData.listening as unknown as ListeningItem[];

export function normalizeGrammarPracticeIds(items: GrammarItem[]) {
  return items.map((item) => {
    // ponytail: generated grammar drills remain the fallback until persisted authored question rows are added.
    const ids = item.practiceQuestionIds ?? [];
    if (ids.length >= 2) return item;
    const fallback = [`${item.id}-meaning`, `${item.id}-completion`].filter((id) => !ids.includes(id));
    return { ...item, practiceQuestionIds: [...ids, ...fallback].slice(0, 2) };
  });
}

export const n5Module = {
  ...moduleData,
  course: { ...moduleData.course, chapters: [...moduleData.course.chapters, ...expansionData.course.chapters, ...practicalExpansionData.course.chapters, ...lifeExpansionData.course.chapters, ...originalReadingData.course.chapters, ...originalListeningData.course.chapters] },
  vocabulary: sourceAware([...foundationVocabulary, ...expansionData.vocabulary, ...practicalExpansionData.vocabulary, ...lifeExpansionData.vocabulary]),
  kanji: sourceAware([...foundationKanji, ...expansionData.kanji, ...practicalExpansionData.kanji, ...lifeExpansionData.kanji]),
  grammar: sourceAware(normalizeGrammarPracticeIds([...foundationGrammar, ...expansionData.grammar, ...practicalExpansionData.grammar, ...lifeExpansionData.grammar] as GrammarItem[])),
  grammarContrasts: [...moduleData.grammarContrasts, ...expansionData.grammarContrasts, ...practicalExpansionData.grammarContrasts, ...lifeExpansionData.grammarContrasts],
  readings: sourceAware([...foundationReadings, ...expansionData.readings, ...practicalExpansionData.readings, ...lifeExpansionData.readings, ...originalReadingData.readings]),
  listening: sourceAware([...foundationListening, ...expansionData.listening, ...practicalExpansionData.listening, ...lifeExpansionData.listening, ...originalListeningData.listening]),
  practiceQuestions: authoredPracticeData,
  sourceManifest: contentSources,
} as unknown as N5Module;
export const currentLessonId = "lesson-meeting-people";

export type LessonContentItem = VocabularyItem | KanjiItem | GrammarItem | ReadingItem | ListeningItem;

const topicAliases: Record<string, string> = {
  "daily life": "daily-life",
  routine: "daily-life",
  family: "people",
  introduction: "people",
  relationships: "people",
  language: "study",
  calendar: "time",
  days: "time",
  numbers: "time",
  objects: "home",
  place: "places",
  invitation: "conversation",
  plans: "conversation",
};

export function normalizeTopic(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/gu, "-");
  return topicAliases[normalized] ?? normalized;
}

export function topicLabel(value: string) {
  return value.split("-").filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

export function getTopicItemIds(items: LessonContentItem[], topic: string) {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const normalizedTopic = normalizeTopic(topic);
  const topicItemIds = new Set(items.filter((item) => item.tags.some((tag) => normalizeTopic(tag) === normalizedTopic)).map((item) => item.id));
  [...topicItemIds].forEach((itemId) => {
    const item = itemsById.get(itemId);
    if (item?.category === "reading") [...item.vocabularyIds, ...item.grammarIds, ...item.kanjiIds].forEach((linkedId) => topicItemIds.add(linkedId));
    if (item?.category === "listening") item.prerequisiteIds.forEach((linkedId) => topicItemIds.add(linkedId));
  });
  return topicItemIds;
}

export function getTopicCoverage(items: LessonContentItem[], records: Record<string, { masteryState?: string; streak?: number }> = {}) {
  return [...new Set(items.flatMap((item) => item.tags.map(normalizeTopic)))].map((topic) => {
    const topicItemIds = getTopicItemIds(items, topic);
    const topicItems = [...topicItemIds].map((itemId) => items.find((item) => item.id === itemId)).filter((item): item is LessonContentItem => Boolean(item));
    const counts = { vocabulary: 0, kanji: 0, grammar: 0, reading: 0, listening: 0 };
    topicItems.forEach((item) => { counts[item.category] += 1; });
    const held = topicItems.filter((item) => records[item.id]?.masteryState === "stable" || records[item.id]?.masteryState === "strong" || (records[item.id]?.streak ?? 0) >= 2).length;
    return { topic, held, total: topicItems.length, counts };
  });
}

export function getLessonItemsFromModule(module: N5Module, lesson: Lesson): LessonContentItem[] {
  const items = [...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening];
  return lesson.itemIds.map((id) => items.find((item) => item.id === id)).filter((item): item is LessonContentItem => Boolean(item));
}

export function getLessonItems(lesson: Lesson): LessonContentItem[] {
  return getLessonItemsFromModule(n5Module, lesson);
}

export function getCurriculumForTarget(module: N5Module, targetLevel: TargetLevel): N5Module {
  if (targetLevel === "N5") return module;
  const allItems = [...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening];
  const itemById = new Map(allItems.map((item) => [item.id, item]));
  const targetIds = new Set(allItems.filter((item) => item.jlptLevel === targetLevel).map((item) => item.id));
  const prerequisiteIds = new Set<string>();
  const pending = [...targetIds];
  while (pending.length) {
    const item = itemById.get(pending.pop()!);
    item?.prerequisiteIds.forEach((id) => {
      if (!targetIds.has(id) && !prerequisiteIds.has(id) && itemById.has(id)) {
        prerequisiteIds.add(id);
        pending.push(id);
      }
    });
  }
  const includedIds = new Set([...targetIds, ...prerequisiteIds]);
  const chapters = module.course.chapters.map((chapter) => ({ ...chapter, lessons: chapter.lessons.map((lesson) => ({ ...lesson, itemIds: lesson.itemIds.filter((id) => targetIds.has(id)) })).filter((lesson) => lesson.itemIds.length) })).filter((chapter) => chapter.lessons.length);
  if (prerequisiteIds.size) chapters.unshift({ id: "chapter-n4-prerequisites", slug: "n4-prerequisites", title: "N4 foundations", description: "Review the N5 concepts this path uses most often.", region: "prerequisites", lessons: [{ id: "lesson-n4-prerequisites", slug: "n4-prerequisites", title: "Useful foundations", subtitle: "土台", description: "A short prerequisite pass before new N4 material.", estimatedMinutes: 10, itemIds: [...prerequisiteIds] }] });
  const keep = <T extends { id: string }>(items: T[]) => items.filter((item) => includedIds.has(item.id));
  return { ...module, course: { ...module.course, id: `${module.course.id}-n4`, slug: `${module.course.slug}-n4`, title: `${module.course.title} · N4`, description: "A dedicated N4 path built from the released source reservoir and original N4 practice.", jlptLevel: "N4", chapters }, vocabulary: keep(module.vocabulary), kanji: keep(module.kanji), grammar: keep(module.grammar), readings: keep(module.readings), listening: keep(module.listening), grammarContrasts: module.grammarContrasts.filter((contrast) => contrast.grammarPointIds.some((id) => includedIds.has(id))), practiceQuestions: module.practiceQuestions?.filter((question) => includedIds.has(question.itemId)) };
}

export function getCurrentLesson() {
  return n5Module.course.chapters.flatMap((chapter) => chapter.lessons).find((lesson) => lesson.id === currentLessonId) ?? null;
}

export function getJourneyNodesForModule(module: N5Module, activeLessonId?: string, targetLevel: TargetLevel = "N5"): JourneyNode[] {
  const currentId = activeLessonId ?? currentLessonId;
  const itemById = new Map([...module.vocabulary, ...module.kanji, ...module.grammar, ...module.readings, ...module.listening].map((item) => [item.id, item]));
  const activeChapterIndex = module.course.chapters.findIndex((chapter) => chapter.lessons.some((lesson) => lesson.id === currentId));
  const activeLessonIndex = activeChapterIndex < 0 ? -1 : module.course.chapters[activeChapterIndex].lessons.findIndex((lesson) => lesson.id === currentId);
  const nodes: JourneyNode[] = [
    {
      id: module.course.id,
      label: module.course.title,
      detail: "N5 · first path",
      kind: "course",
      status: "current",
    },
  ];

  module.course.chapters.forEach((chapter, chapterIndex) => {
    nodes.push({
      id: chapter.id,
      label: chapter.title,
      detail: chapter.region.replace("-", " "),
      kind: "chapter",
      status: chapterIndex < activeChapterIndex ? "learned" : chapterIndex === activeChapterIndex ? "current" : "locked",
    });

    chapter.lessons.forEach((lesson, lessonIndex) => {
      const isCurrent = lesson.id === currentId;
      nodes.push({
        id: lesson.id,
        label: lesson.title,
        detail: lesson.subtitle,
        kind: "lesson",
        status: isCurrent ? "current" : chapterIndex < activeChapterIndex || (chapterIndex === activeChapterIndex && lessonIndex < activeLessonIndex) ? "learned" : chapterIndex === activeChapterIndex && lessonIndex === activeLessonIndex + 1 ? "available" : "locked",
        href: `/learn?lesson=${lesson.id}&level=${targetLevel}`,
        itemIds: lesson.itemIds,
        prerequisiteIds: [...new Set(lesson.itemIds.flatMap((itemId) => itemById.get(itemId)?.prerequisiteIds ?? []))].filter((itemId) => !lesson.itemIds.includes(itemId)),
      });
    });
  });

  return nodes;
}

export function getJourneyNodes(): JourneyNode[] {
  return getJourneyNodesForModule(n5Module);
}
