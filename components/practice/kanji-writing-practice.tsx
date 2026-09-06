"use client";

import { useMemo, useState } from "react";

import { KanjiWritingTrainer } from "@/components/learning/kanji-writing-trainer";
import type { KanjiItem, TargetLevel } from "@/lib/types";

export function KanjiWritingPractice({ kanji, duration, targetLevel }: Readonly<{ kanji: KanjiItem[]; duration: number; targetLevel: TargetLevel }>) {
  const cards = useMemo(() => {
    const levelCards = kanji.filter((item) => item.jlptLevel === targetLevel);
    return (levelCards.length ? levelCards : kanji).slice(0, duration <= 2 ? 2 : duration <= 5 ? 4 : 8);
  }, [duration, kanji, targetLevel]);
  const [position, setPosition] = useState(0);
  const current = cards[position];
  if (!current) return <div className="rounded-xl border border-[#5d4c2c] bg-[#211d18] p-5 text-sm text-[#c3c7ce]">No kanji are ready for writing practice yet.</div>;
  return <div><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Focus · 漢字を書く</p><h2 className="mt-1 text-xl font-medium">Write the characters you meet.</h2><p className="mt-1 text-sm text-[#9297a1]">{position + 1} / {cards.length} · writing familiarity is separate from recognition mastery.</p></div>{cards.length > 1 ? <button type="button" onClick={() => setPosition((value) => (value + 1) % cards.length)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]">Next kanji →</button> : null}</div><KanjiWritingTrainer key={current.id} item={current} /></div>;
}
