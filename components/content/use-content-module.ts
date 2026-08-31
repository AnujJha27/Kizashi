"use client";

import { useEffect, useState } from "react";

import { getContentReviewStatus, getModuleItems, isLearnerReleased, parseAndValidateModule, parseModuleForReview, readValidatedContentDraft } from "@/lib/content-validation";
import { readContentDraft } from "@/lib/content-draft-storage.js";
import { n5Module } from "@/lib/curriculum";
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

export function useContentModule(seed: N5Module = n5Module) {
  const [module, setModule] = useState(seed);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const draft = readValidatedContentDraft();
      if (draft) {
        setModule(withPersonalVocabulary(learnerModule(draft)));
        return;
      }
      const storedRaw = await readContentDraft();
      const stored = storedRaw ? parseAndValidateModule(storedRaw).value : null;
      if (stored && getModuleItems(stored).every((item) => getContentReviewStatus(item) !== "pending")) {
        if (!cancelled) setModule(withPersonalVocabulary(learnerModule(stored)));
        return;
      }
      const learnerResponse = await fetch("/api/content/review-package?audience=learner", { cache: "no-store" }).catch(() => null);
      if (learnerResponse?.ok) {
        const learner = parseModuleForReview(await learnerResponse.text());
        if (!cancelled && learner) {
          setModule(withPersonalVocabulary(learnerModule(learner)));
          return;
        }
      }
      const remote = await fetchSupabaseN5Module(seed).catch(() => null);
      if (cancelled) return;
      const parsed = parseAndValidateModule(JSON.stringify(remote ?? seed));
      if (parsed.value) setModule(withPersonalVocabulary(learnerModule(parsed.value)));
    };
    const onDraftUpdated = () => void refresh();
    void refresh();
    window.addEventListener("michi-content-draft-updated", onDraftUpdated);
    window.addEventListener("michi-custom-entries-updated", onDraftUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("michi-content-draft-updated", onDraftUpdated);
      window.removeEventListener("michi-custom-entries-updated", onDraftUpdated);
    };
  }, [seed]);

  return module;
}
