"use client";

import { useEffect, useState } from "react";

import { PracticePlayer } from "@/components/practice/practice-player";
import { selectWeakPracticeQuestions } from "@/lib/weak-practice.js";
import { completeRepair, readMistakes, readRepairRecords, readReviewRecords } from "@/lib/session";
import { JapaneseText } from "@/components/learning/japanese-text";
import type { GrammarContrast, IjasAggregate, KanjiItem, LearningItem, PracticeQuestion, VocabularyItem } from "@/lib/types";

function RepairCard({ repair, vocabulary, kanji }: Readonly<{ repair: ReturnType<typeof readRepairRecords>[number]; vocabulary: VocabularyItem[]; kanji: KanjiItem[] }>) {
  if (!repair.card) return null;
  return <section className="mb-5 rounded-xl border border-[#e5b85c]/50 bg-[#211d18]/75 p-5 text-left"><p className="eyebrow">Concept repair · 修理</p><h2 className="mt-1 text-lg font-medium text-[#f5f5f2]">Rebuild the idea, then try it again.</h2><p className="mt-3 text-sm leading-6 text-[#c3c7ce]">{repair.card.explanation}</p><p className="mt-3 rounded-lg border border-[#5d4c2c] bg-[#2b2418]/70 p-3 text-sm leading-6 text-[#f1cf7c]"><span className="font-semibold">Contrast: </span>{repair.card.contrast}</p><div className="mt-3 rounded-lg border border-white/10 bg-[#101b2b]/70 p-3"><p className="eyebrow">Fresh example</p><p className="mt-2 jp-serif text-lg text-[#f5f5f2]"><JapaneseText text={repair.card.example} vocabulary={vocabulary} kanji={kanji} /></p>{repair.card.exampleTranslation ? <p className="mt-1 text-xs text-[#9297a1]">{repair.card.exampleTranslation}</p> : null}</div><p className="mt-3 text-sm text-[#c3c7ce]"><span className="font-semibold text-[#e5b85c]">Answer to review: </span>{repair.card.answer}</p><p className="mt-3 rounded-lg border border-[#315d4b] bg-[#162b26]/60 p-3 text-sm leading-6 text-[#c6ded2]"><span className="font-semibold">Delayed follow-up: </span>{repair.card.followUp}</p><p className="mt-2 text-xs leading-5 text-[#9297a1]">Follow-up due {new Date(repair.followUpDueAt).toLocaleDateString()} · {repair.card.sourceIds.length ? `source: ${repair.card.sourceIds.join(", ")}` : "Kizashi-authored repair"}</p></section>;
}

export function WeakPractice({ questions, vocabulary = [], kanji = [], items = [], grammarContrasts = [], learnerErrorAggregates = [], repairId }: Readonly<{ questions: PracticeQuestion[]; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[]; items?: LearningItem[]; grammarContrasts?: GrammarContrast[]; learnerErrorAggregates?: IjasAggregate[]; repairId?: string }>) {
  const [weakQuestions, setWeakQuestions] = useState<PracticeQuestion[] | null>(null);

  useEffect(() => {
    setWeakQuestions(selectWeakPracticeQuestions(questions, readReviewRecords(), readMistakes(), 12, new Map(items.map((item) => [item.id, item])), learnerErrorAggregates));
  }, [items, learnerErrorAggregates, questions]);

  if (weakQuestions === null) return <div className="min-h-80 animate-pulse rounded-xl bg-[#17181d]" aria-label="Loading weak areas" />;

  const repair = repairId ? readRepairRecords().find((record) => record.id === repairId) : undefined;
  return <>{repair ? <RepairCard repair={repair} vocabulary={vocabulary} kanji={kanji} /> : null}<PracticePlayer questions={weakQuestions.length ? weakQuestions : questions.slice(0, 7)} vocabulary={vocabulary} kanji={kanji} items={items} grammarContrasts={grammarContrasts} onComplete={() => { if (repairId) completeRepair(repairId); }} /></>;
}
