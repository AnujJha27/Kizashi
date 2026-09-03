"use client";

import Link from "next/link";
import { useState } from "react";

import { JapaneseText } from "@/components/learning/japanese-text";
import type { LessonContentItem } from "@/lib/curriculum";
import { toHiragana } from "@/lib/mastery";

export function KnowledgeMap({ items }: Readonly<{ items: LessonContentItem[] }>) {
  const kanji = items.filter((item) => item.category === "kanji");
  const vocabulary = items.filter((item) => item.category === "vocabulary");
  const [selectedId, setSelectedId] = useState(kanji[0]?.id ?? "");
  const selected = kanji.find((item) => item.id === selectedId) ?? kanji[0];

  if (!selected) return null;
  const linkedWords = selected.usefulWords.map((word) => ({ ...word, item: vocabulary.find((entry) => entry.writtenForm === word.word) }));

  return <section className="surface-panel-raised p-6"><div className="mb-5"><p className="eyebrow mb-2">Knowledge map · つながり</p><h2 className="text-xl font-medium">See how the pieces connect.</h2><p className="mt-1 max-w-2xl text-sm text-[#9297a1]">Kanji stays attached to the words you actually meet, so a character becomes useful instead of isolated.</p></div><div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Choose a kanji thread">{kanji.map((item) => <button key={item.id} type="button" role="tab" aria-selected={selected.id === item.id} onClick={() => setSelectedId(item.id)} className={`shrink-0 rounded-xl border px-4 py-3 text-left ${selected.id === item.id ? "border-[#e5b85c] bg-[#302818]" : "border-[#3f4652] bg-[#101b2b]/60 hover:border-[#e5b85c]"}`}><span className="jp-serif block text-2xl text-[#f5f5f2]"><JapaneseText text={item.character} vocabulary={vocabulary} kanji={kanji} readingEntries={[[item.character, toHiragana(item.kunyomi[0] ?? item.onyomi[0] ?? "")]]} always inspect={false} /></span><span className="mt-1 block text-[10px] text-[#9297a1]">{item.meanings[0]}</span></button>)}</div><div className="mt-6 grid gap-3 md:grid-cols-[.8fr_auto_1.4fr] md:items-center"><Link href={`/entry/${selected.id}`} className="rounded-xl border border-[#4b3a29] bg-[#211d18] p-4 hover:border-[#e5b85c]"><p className="eyebrow">Kanji</p><p className="jp-serif mt-2 text-5xl text-[#e5b85c]"><JapaneseText text={selected.character} vocabulary={vocabulary} kanji={kanji} readingEntries={[[selected.character, toHiragana(selected.kunyomi[0] ?? selected.onyomi[0] ?? "")]]} always inspect={false} /></p><p className="mt-2 text-sm text-[#f5f5f2]">{selected.meanings.join(" · ")}</p><p className="mt-3 text-xs text-[#9297a1]">Open entry →</p></Link><p className="text-center text-2xl text-[#e34a3f]" aria-hidden="true">→</p><div className="grid gap-2 sm:grid-cols-2">{linkedWords.map((word) => word.item ? <Link key={word.word} href={`/entry/${word.item.id}`} className="rounded-xl border border-white/10 bg-[#101b2b]/65 p-4 hover:border-[#e5b85c]"><p className="jp-serif text-xl text-[#f5f5f2]"><JapaneseText text={word.word} vocabulary={vocabulary} kanji={kanji} readingEntries={[[word.word, toHiragana(word.reading)]]} always inspect={false} /></p><p className="mt-1 text-xs text-[#9297a1]">{word.meaning}</p></Link> : <div key={word.word} className="rounded-xl border border-white/10 bg-[#101b2b]/65 p-4"><p className="jp-serif text-xl text-[#f5f5f2]"><JapaneseText text={word.word} vocabulary={vocabulary} kanji={kanji} readingEntries={[[word.word, toHiragana(word.reading)]]} always inspect={false} /></p><p className="mt-1 text-xs text-[#9297a1]">{word.meaning}</p></div>)}</div></div></section>;
}
