"use client";

import { useEffect, useState } from "react";

import { PracticePlayer } from "@/components/practice/practice-player";
import { ijasBoostForQuestion } from "@/lib/ijas-core.js";
import { readMistakes, readQuestionStats, readReviewRecords, readStudyLaterIds, type MasterySignal, type ReviewRecord } from "@/lib/session";
import type { IjasAggregate, KanjiItem, LearningItem, PracticeQuestion, VocabularyItem } from "@/lib/types";

function masterySignal(question: PracticeQuestion): MasterySignal {
  if (question.category === "reading" || question.category === "listening") return "context";
  return ["meaning", "audio recognition", "kanji reading", "kanji meaning"].includes(question.questionType) ? "recognition" : "recall";
}

function stagePriority(question: PracticeQuestion, record?: ReviewRecord) {
  const signal = masterySignal(question);
  if (!record || (record.exposureCount ?? record.attempts) < 2) return signal === "recognition" ? 4 : 0;
  const strengths = {
    recognition: record.recognitionStrength ?? 0,
    recall: record.recallStrength ?? 0,
    context: record.contextStrength ?? 0,
  };
  const weakest = Math.min(...Object.values(strengths));
  return (1 - strengths[signal]) * 4 + (strengths[signal] === weakest ? 2 : 0);
}

function priority(question: PracticeQuestion, now: number, records: ReturnType<typeof readReviewRecords>, mistakes: ReturnType<typeof readMistakes>, stats: ReturnType<typeof readQuestionStats>, studyLater: Set<string>, items: Map<string, LearningItem>, aggregates: IjasAggregate[], passMode = false) {
  const record = records[question.itemId];
  const mistake = mistakes[question.itemId];
  const questionStats = stats[question.id];
  const accuracy = record ? record.correct / Math.max(record.attempts, 1) : 0;
  const passWeight = passMode ? ({ listening: 4, reading: 3, grammar: 2, kanji: 1, vocabulary: 0 }[question.category] ?? 0) + (question.jlptLevel === "N5" ? 1 : 0) : 0;
  // ponytail: favor unseen question variants; mistakes, due reviews, and ambiguity still outrank novelty.
  return (mistake?.count ?? 0) * 6 + (studyLater.has(question.itemId) ? 5 : 0) + (record && record.dueAt <= now ? 4 : 0) + (questionStats?.slowCount ?? 0) * 2 + (!record ? 2 : 0) + (record ? 1 - accuracy : 0) + stagePriority(question, record) + passWeight + ijasBoostForQuestion(question, items, aggregates) - (questionStats?.ambiguityReports ?? 0) * 4 - (questionStats?.attempts ?? 0) * 3;
}

export function AdaptivePractice({ questions, vocabulary = [], kanji = [], items = [], learnerErrorAggregates = [], limit, passMode = false, sessionId }: Readonly<{ questions: PracticeQuestion[]; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[]; items?: LearningItem[]; learnerErrorAggregates?: IjasAggregate[]; limit?: number; passMode?: boolean; sessionId?: string }>) {
  const [ordered, setOrdered] = useState<PracticeQuestion[] | null>(null);
  const [session, setSession] = useState(0);

  useEffect(() => {
    const records = readReviewRecords();
    const mistakes = readMistakes();
    const stats = readQuestionStats();
    const studyLater = new Set(readStudyLaterIds());
    const now = Date.now();
    const itemMap = new Map(items.map((item) => [item.id, item]));
    const ranked = [...questions].sort((left, right) => priority(right, now, records, mistakes, stats, studyLater, itemMap, learnerErrorAggregates, passMode) - priority(left, now, records, mistakes, stats, studyLater, itemMap, learnerErrorAggregates, passMode));
    setOrdered(limit ? ranked.slice(0, limit) : ranked);
  }, [items, learnerErrorAggregates, limit, passMode, questions, session]);

  if (ordered === null) return <div className="min-h-80 animate-pulse rounded-xl bg-[#17181d]" aria-label="Building your practice queue" />;
  return <PracticePlayer key={session} questions={ordered} vocabulary={vocabulary} kanji={kanji} sessionId={sessionId} onRestart={() => setSession((value) => value + 1)} />;
}
