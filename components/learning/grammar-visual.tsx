"use client";

import { useState } from "react";

import { getJapaneseReadingEntries, JapaneseText } from "@/components/learning/japanese-text";
import type { KanjiItem, VocabularyItem } from "@/lib/types";

const particleLabels: Record<string, string> = { は: "topic", が: "subject", を: "object", に: "destination / time", で: "place / means", へ: "direction", も: "also", と: "with / and", の: "connection", か: "question" };
const protectedGrammarUnits = ["てはいけません", "ないでください", "てもいい", "ませんか", "あとで", "ながら", "とき", "前に", "ましょう"];

function splitSentence(sentence: string, vocabulary: VocabularyItem[], kanji: KanjiItem[]) {
  const text = sentence.replace(/[。！？]$/u, "");
  const parts: { text: string; label: string }[] = [];
  let start = 0;
  const protectedRanges = [...getJapaneseReadingEntries(vocabulary, kanji).map(([word]) => word), ...protectedGrammarUnits].flatMap((word) => {
    const ranges: { start: number; end: number }[] = [];
    for (let offset = text.indexOf(word); offset >= 0; offset = text.indexOf(word, offset + word.length)) ranges.push({ start: offset, end: offset + word.length });
    return ranges;
  });
  for (const match of text.matchAll(/[はがをにでへもとのか]/gu)) {
    const index = match.index ?? 0;
    if (protectedRanges.some((range) => index > range.start && index < range.end)) continue;
    const end = index + match[0].length;
    if (end > start) parts.push({ text: text.slice(start, end), label: particleLabels[match[0]] ?? "particle" });
    start = end;
  }
  if (start < text.length) parts.push({ text: text.slice(start), label: "predicate / detail" });
  return parts;
}

export function GrammarVisual({ sentence, vocabulary = [], kanji = [] }: Readonly<{ sentence: string; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[] }>) {
  const [active, setActive] = useState<number | null>(null);
  const parts = splitSentence(sentence, vocabulary, kanji);
  if (parts.length < 2) return null;

  return <div className="mt-4 rounded-xl border border-[#3f4652] bg-[#101b2b]/55 p-3"><p className="eyebrow mb-2">Sentence anatomy · 文の形</p><div className="flex flex-wrap gap-2">{parts.map((part, index) => <button key={`${part.text}-${index}`} type="button" onClick={() => setActive(active === index ? null : index)} aria-expanded={active === index} className={`rounded-lg border px-3 py-2 text-left ${active === index ? "border-[#e5b85c] bg-[#302818]" : "border-[#3f4652] bg-[#17181d]/70 hover:border-[#e5b85c]"}`}><span className="jp-serif block text-base text-[#f5f5f2]"><JapaneseText text={part.text} vocabulary={vocabulary} kanji={kanji} always /></span><span className="block text-[10px] text-[#9297a1]">{active === index ? part.label : "tap to inspect"}</span></button>)}</div></div>;
}
