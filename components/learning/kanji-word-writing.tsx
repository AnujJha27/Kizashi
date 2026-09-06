"use client";

import { useMemo, useState } from "react";

import { KanjiWritingTrainer } from "@/components/learning/kanji-writing-trainer";
import { getWordWritingCharacters } from "@/lib/kanji-writing-core.js";
import type { KanjiItem } from "@/lib/types";

type UsefulWord = { word: string; reading: string; meaning: string };

export function KanjiWordWriting({ words, kanji }: Readonly<{ words: UsefulWord[]; kanji: KanjiItem[] }>) {
  const candidates = useMemo(() => {
    const available = kanji.map((item) => item.character);
    return words.map((word) => ({ word, characters: getWordWritingCharacters(word.word, available) })).filter((entry) => entry.characters.length > 1);
  }, [kanji, words]);
  const [selectedWord, setSelectedWord] = useState("");
  const [position, setPosition] = useState(0);
  const active = candidates.find((entry) => entry.word.word === selectedWord) ?? candidates[0];
  if (!active) return null;
  const currentCharacter = active.characters[position] ?? active.characters[0];
  const current = kanji.find((item) => item.character === currentCharacter);
  if (!current) return null;
  return <section className="mt-8 rounded-xl border border-[#3f3427] bg-[#211d18]/60 p-5" aria-labelledby="kanji-word-writing-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Word writing · 単語を書く</p><h2 id="kanji-word-writing-title" className="mt-1 text-xl font-medium">Write a useful word</h2><p className="mt-1 text-sm text-[#9297a1]">Build the word one kanji at a time.</p></div><span className="rounded-full border border-[#3f4652] px-3 py-1 text-xs text-[#e5b85c]">Optional</span></div><div className="mt-4 flex flex-wrap gap-2">{candidates.map((entry) => <button key={entry.word.word} type="button" onClick={() => { setSelectedWord(entry.word.word); setPosition(0); }} className={`rounded-lg border px-3 py-2 text-left ${entry.word.word === active.word.word ? "border-[#e5b85c] bg-[#302818]" : "border-[#3f4652] bg-[#151720] hover:border-[#e5b85c]"}`}><span className="jp-serif text-lg text-[#f5f5f2]">{entry.word.word}</span><span className="ml-2 text-xs text-[#9297a1]">{entry.word.meaning}</span></button>)}</div><p className="mt-4 text-sm text-[#c3c7ce]">Write: <span className="jp-serif text-lg text-[#e5b85c]">{active.characters.join(" → ")}</span></p><div className="mt-3 flex flex-wrap items-center gap-2">{active.characters.map((character, index) => <span key={`${active.word.word}-${character}-${index}`} className={`rounded-lg border px-3 py-2 font-serif text-xl ${index === position ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-[#3f4652] text-[#9297a1]"}`}>{character}</span>)}<span className="ml-1 text-xs text-[#9297a1]">{position + 1} / {active.characters.length}</span></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={position === 0} onClick={() => setPosition((value) => Math.max(0, value - 1))} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] disabled:opacity-40">Previous character</button><button type="button" disabled={position === active.characters.length - 1} onClick={() => setPosition((value) => Math.min(active.characters.length - 1, value + 1))} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] disabled:opacity-40">Next character</button></div><KanjiWritingTrainer key={`${active.word.word}-${current.id}`} item={current} /></section>;
}
