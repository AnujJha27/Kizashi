"use client";

import { useEffect, useState } from "react";

import { PracticePlayer } from "@/components/practice/practice-player";
import { selectWeakPracticeQuestions } from "@/lib/weak-practice.js";
import { readMistakes, readReviewRecords } from "@/lib/session";
import type { IjasAggregate, KanjiItem, LearningItem, PracticeQuestion, VocabularyItem } from "@/lib/types";

export function WeakPractice({ questions, vocabulary = [], kanji = [], items = [], learnerErrorAggregates = [] }: Readonly<{ questions: PracticeQuestion[]; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[]; items?: LearningItem[]; learnerErrorAggregates?: IjasAggregate[] }>) {
  const [weakQuestions, setWeakQuestions] = useState<PracticeQuestion[] | null>(null);

  useEffect(() => {
    setWeakQuestions(selectWeakPracticeQuestions(questions, readReviewRecords(), readMistakes(), 12, new Map(items.map((item) => [item.id, item])), learnerErrorAggregates));
  }, [items, learnerErrorAggregates, questions]);

  if (weakQuestions === null) return <div className="min-h-80 animate-pulse rounded-xl bg-[#17181d]" aria-label="Loading weak areas" />;

  return <PracticePlayer questions={weakQuestions.length ? weakQuestions : questions.slice(0, 7)} vocabulary={vocabulary} kanji={kanji} />;
}
