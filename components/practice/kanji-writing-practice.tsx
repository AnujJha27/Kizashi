"use client";

import { useMemo, useState } from "react";

import { KanjiWritingTrainer } from "@/components/learning/kanji-writing-trainer";
import { prioritizeKanjiWritingItems } from "@/lib/kanji-writing-core.js";
import { readKanjiWritingProgress, readMistakes, readReviewRecords } from "@/lib/session";
import type { KanjiItem, TargetLevel } from "@/lib/types";

export function KanjiWritingPractice({ kanji, duration, targetLevel, initialItemId, lessonItemIds = [] }: Readonly<{ kanji: KanjiItem[]; duration: number; targetLevel: TargetLevel; initialItemId?: string; lessonItemIds?: readonly string[] }>) {
  const cards = useMemo(() => {
    const levelCards = kanji.filter((item) => item.jlptLevel === targetLevel);
    const pool = levelCards.length ? levelCards : kanji;
    const prioritized = prioritizeKanjiWritingItems(pool, { initialItemId, lessonItemIds, reviewRecords: readReviewRecords(), mistakes: readMistakes(), writingProgress: readKanjiWritingProgress() });
    return prioritized.slice(0, duration <= 2 ? 2 : duration <= 5 ? 4 : 8);
  }, [duration, initialItemId, kanji, lessonItemIds, targetLevel]);
  const [position, setPosition] = useState(0);
  const current = cards[position];
  if (!current) return <div className="rounded-xl border border-[#5d4c2c] bg-[#211d18] p-5 text-sm text-[#c3c7ce]">No kanji are ready for writing practice yet.</div>;
  return <div><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Focus · 漢字を書く</p><h2 className="mt-1 text-xl font-medium">Write the characters you meet.</h2><p className="mt-1 text-sm text-[#9297a1]">{position + 1} / {cards.length} · prioritized from your lesson, due reviews, mistakes, and unwritten kanji.</p></div>{cards.length > 1 ? <button type="button" onClick={() => setPosition((value) => (value + 1) % cards.length)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">Next kanji →</button> : null}</div><KanjiWritingTrainer key={current.id} item={current} /></div>;
}
