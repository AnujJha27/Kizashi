"use client";

import { useEffect, useState } from "react";

import { getContentReviewStatus, getModuleItems, isLearnerReleased, parseAndValidateModule, parseModuleForReview, readValidatedContentDraft } from "@/lib/content-validation";
import { readContentDraft } from "@/lib/content-draft-storage.js";
import { n5Module } from "@/lib/curriculum";
import { fetchWithTimeout } from "@/lib/request-timeout.js";
import { readCustomEntries } from "@/lib/session";
import { fetchSupabaseN5Module } from "@/lib/supabase/content";
import type { N5Module, VocabularyItem } from "@/lib/types";

function customVocabulary(): VocabularyItem[] {
  return readCustomEntries().map((entry) => ({ id: entry.id, slug: entry.id, title: entry.writtenForm, jlptLevel: null, category: "vocabulary", subcategory: "personal shelf", difficulty: 2, prerequisiteIds: [], tags: ["personal", "custom"], sourceIds: ["user-draft"], writtenForm: entry.writtenForm, reading: entry.reading || entry.writtenForm, meanings: [entry.meaning], partOfSpeech: "personal entry", exampleSentences: entry.sentence ? [{ japanese: entry.sentence, translation: "Personal example" }] : [{ japanese: entry.writtenForm, translation: entry.meaning }], collocations: [], relatedWords: [], antonyms: [] }));
}

function withPersonalVocabulary(module: N5Module) {
  const existing = new Set(module.vocabulary.map((item) => item.id));
  return { ...module, vocabulary: [...module.vocabulary, ...customVocabulary().filter((item) => !existing.has(item.id))] };
}

function mergeById<T extends { id: string }>(preferred: T[], fallback: T[]) {
  const merged = new Map(fallback.map((item) => [item.id, item]));
  preferred.forEach((item) => merged.set(item.id, item));
  return [...merged.values()];
}

function mergeModules(preferred: N5Module, fallback: N5Module): N5Module {
  const fallbackChapters = new Map(fallback.course.chapters.map((chapter) => [chapter.id, chapter]));
  const chapters = preferred.course.chapters.map((chapter) => {
    const fallbackChapter = fallbackChapters.get(chapter.id);
    if (!fallbackChapter) return chapter;
    const lessons = mergeById(chapter.lessons, fallbackChapter.lessons).map((lesson) => {
      const fallbackLesson = fallbackChapter.lessons.find((entry) => entry.id === lesson.id);
      return fallbackLesson ? { ...fallbackLesson, ...lesson, itemIds: [...new Set([...fallbackLesson.itemIds, ...lesson.itemIds])] } : lesson;
    });
    return { ...fallbackChapter, ...chapter, lessons };
  });
  const preferredChapterIds = new Set(chapters.map((chapter) => chapter.id));
  chapters.push(...fallback.course.chapters.filter((chapter) => !preferredChapterIds.has(chapter.id)));
  return {
    ...fallback,
    ...preferred,
    course: { ...fallback.course, ...preferred.course, chapters },
    vocabulary: mergeById(preferred.vocabulary, fallback.vocabulary),
    kanji: mergeById(preferred.kanji, fallback.kanji),
    grammar: mergeById(preferred.grammar, fallback.grammar),
    readings: mergeById(preferred.readings, fallback.readings),
    listening: mergeById(preferred.listening, fallback.listening),
    grammarContrasts: mergeById(preferred.grammarContrasts, fallback.grammarContrasts),
    practiceQuestions: mergeById(preferred.practiceQuestions ?? [], fallback.practiceQuestions ?? []),
    sourceManifest: mergeById(preferred.sourceManifest ?? [], fallback.sourceManifest ?? []),
  };
}

function learnerModule(module: N5Module) {
  const active = <T extends { id: string; reviewStatus?: unknown; tags?: unknown; contentReview?: unknown }>(items: T[]) => items.filter(isLearnerReleased);
  const vocabulary = active(module.vocabulary);
  const kanji = active(module.kanji);
  const grammar = active(module.grammar);
  const readings = active(module.readings);
  const listening = active(module.listening);
  const itemIds = new Set([...vocabulary, ...kanji, ...grammar, ...readings, ...listening].map((item) => item.id));
  return {
    ...module,
    course: { ...module.course, chapters: module.course.chapters.map((chapter) => ({ ...chapter, lessons: chapter.lessons.map((lesson) => ({ ...lesson, itemIds: lesson.itemIds.filter((itemId) => itemIds.has(itemId)) })) })) },
    vocabulary,
    kanji,
    grammar,
    readings,
    listening,
    grammarContrasts: module.grammarContrasts.filter((contrast) => contrast.grammarPointIds.some((itemId) => itemIds.has(itemId))),
    practiceQuestions: module.practiceQuestions?.filter((question) => itemIds.has(question.itemId) && question.validationStatus !== "rejected"),
  };
}

let cachedModule: N5Module | null = null;
let modulePromise: Promise<N5Module> | null = null;

function loadSharedModule(seed: N5Module) {
  if (cachedModule) return Promise.resolve(cachedModule);
  if (modulePromise) return modulePromise;
  const pending = (async () => {
    const draft = readValidatedContentDraft();
    if (draft) return learnerModule(draft);
    const storedRaw = await readContentDraft();
    const stored = storedRaw ? parseAndValidateModule(storedRaw).value : null;
    if (stored && getModuleItems(stored).every((item) => getContentReviewStatus(item) !== "pending")) return learnerModule(stored);
    const learnerResponse = await fetchWithTimeout("/api/content/review-package?audience=learner", { cache: "no-store" }).catch(() => null);
    if (learnerResponse?.ok) {
      const learner = parseModuleForReview(await learnerResponse.text());
      if (learner) return learnerModule(mergeModules(learner, seed));
    }
    const remote = await fetchSupabaseN5Module(seed).catch(() => null);
    const parsed = parseAndValidateModule(JSON.stringify(remote ? mergeModules(remote, seed) : seed));
    return learnerModule(parsed.value ?? seed);
  })();
  modulePromise = pending.then((value) => {
    cachedModule = value;
    return value;
  }).finally(() => {
    modulePromise = null;
  });
  return modulePromise;
}

export function useContentModule(seed: N5Module = n5Module) {
  const [module, setModule] = useState(seed);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const loaded = await loadSharedModule(seed);
      if (!cancelled) setModule(withPersonalVocabulary(loaded));
    };
    const onDraftUpdated = () => {
      cachedModule = null;
      modulePromise = null;
      void refresh();
    };
    const cancelScheduledRefresh = typeof window.requestIdleCallback === "function"
      ? (() => { const id = window.requestIdleCallback(() => { if (!cancelled) void refresh(); }, { timeout: 3000 }); return () => window.cancelIdleCallback(id); })()
      : (() => { const id = window.setTimeout(() => { if (!cancelled) void refresh(); }, 250); return () => window.clearTimeout(id); })();
    window.addEventListener("michi-content-draft-updated", onDraftUpdated);
    window.addEventListener("michi-custom-entries-updated", onDraftUpdated);
    return () => {
      cancelled = true;
      cancelScheduledRefresh();
      window.removeEventListener("michi-content-draft-updated", onDraftUpdated);
      window.removeEventListener("michi-custom-entries-updated", onDraftUpdated);
    };
  }, [seed]);

  return module;
}
