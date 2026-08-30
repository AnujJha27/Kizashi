"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { kanaCardsFor, kanaRomajiLabel, type KanaCard, type KanaScript } from "@/lib/kana";
import { recordStudyActivity } from "@/lib/session";

type Direction = "recognize" | "recall";

function shuffle<T>(values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function normalizeKana(value: string) {
  return [...value.normalize("NFKC")].map((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint >= 0x30a1 && codePoint <= 0x30f6 ? String.fromCodePoint(codePoint - 0x60) : character;
  }).join("").trim();
}

export function KanaPractice() {
  const [script, setScript] = useState<KanaScript>("hiragana");
  const [batchSize, setBatchSize] = useState(12);
  const [direction, setDirection] = useState<Direction>("recognize");
  const [cards, setCards] = useState<KanaCard[]>([]);
  const [position, setPosition] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [complete, setComplete] = useState(false);
  const [ready, setReady] = useState(false);

  const prepare = (card: KanaCard | undefined, nextScript = script) => {
    if (!card) return;
    const pool = kanaCardsFor(nextScript);
    const label = kanaRomajiLabel(card.kana, card.romaji);
    const distractors = [...new Set(shuffle(pool.filter((entry) => entry.kana !== card.kana).map((entry) => kanaRomajiLabel(entry.kana, entry.romaji))))].slice(0, 3);
    setOptions(shuffle([label, ...distractors]));
    setAnswer("");
    setSubmitted(false);
  };

  const begin = (nextScript = script, nextBatchSize = batchSize) => {
    const nextCards = shuffle(kanaCardsFor(nextScript)).slice(0, nextBatchSize);
    setCards(nextCards);
    setPosition(0);
    setScore(0);
    setComplete(false);
    prepare(nextCards[0], nextScript);
    setReady(true);
  };

  useEffect(() => {
    begin(script);
  }, [script]);

  if (!ready || !cards.length) return <div className="min-h-80 animate-pulse rounded-xl bg-[#17181d]" aria-label="Loading kana practice" />;

  if (complete) return <div className="grid min-h-72 place-items-center rounded-2xl border border-[#3f3427] bg-[#211d18] p-8 text-center"><div><p className="jp-serif text-5xl text-[#e5b85c]">{script === "hiragana" ? "ひらがな、できた" : "カタカナ、できた"}</p><h2 className="mt-3 text-xl font-medium text-[#f5f5f2]">Kana session complete.</h2><p className="mt-2 text-sm text-[#9297a1]">{score} / {cards.length} correct · keep the sounds close before adding more kanji.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => begin()} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d]">Practice again</button><Link href="/practice" className="rounded-xl border border-[#5d3936] px-4 py-3 text-sm text-[#f5f5f2]">Back to practice</Link></div></div></div>;

  const card = cards[position];
  const correct = direction === "recognize" ? answer === kanaRomajiLabel(card.kana, card.romaji) : normalizeKana(answer) === normalizeKana(card.kana);
  const submit = () => {
    if (!answer.trim() || submitted) return;
    if (correct) setScore((value) => value + 1);
    setSubmitted(true);
  };
  const next = () => {
    if (!submitted) return;
    if (position >= cards.length - 1) {
      recordStudyActivity(10, 2);
      setComplete(true);
      return;
    }
    const nextPosition = position + 1;
    setPosition(nextPosition);
    prepare(cards[nextPosition]);
  };

  const switchDirection = () => { setDirection((value) => value === "recognize" ? "recall" : "recognize"); setAnswer(""); setSubmitted(false); };
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">Script foundations · かな</p><h1 className="jp-serif text-3xl text-[#f5f5f2]">Give every sound a shape.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#9297a1]">Small batches keep recall honest. Start with the basic rows, then meet dakuten, handakuten, and blended sounds like ぎ and づ.</p></div><Link href="/practice" className="text-sm text-[#e5b85c] hover:text-[#f1cf7c]">Back to practice →</Link></div><div className="flex flex-wrap gap-2" role="group" aria-label="Kana script"><button type="button" onClick={() => setScript("hiragana")} className={`rounded-lg px-3 py-2 text-xs ${script === "hiragana" ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>Hiragana <span className="jp-serif ml-1">ひらがな</span></button><button type="button" onClick={() => setScript("katakana")} className={`rounded-lg px-3 py-2 text-xs ${script === "katakana" ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>Katakana <span className="jp-serif ml-1">カタカナ</span></button><button type="button" onClick={switchDirection} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#9297a1] hover:border-[#e5b85c]">Mode · {direction === "recognize" ? "recognize" : "recall"}</button><span className="ml-auto self-center text-xs text-[#9297a1]">{kanaCardsFor(script).length} sounds · batch {cards.length}</span></div><div className="flex flex-wrap items-center gap-2 text-xs text-[#9297a1]"><span>Batch size</span>{[8, 12, 20].map((size) => <button key={size} type="button" onClick={() => { setBatchSize(size); begin(script, size); }} className={`rounded-lg px-3 py-2 ${batchSize === size ? "bg-[#3a2023] text-[#f5f5f2]" : "border border-[#3f4652] hover:border-[#e5b85c]"}`}>{size} cards</button>)}</div><div className="mb-7 h-1 overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-[#e34a3f] transition-[width] duration-300" style={{ width: `${((position + (submitted ? 1 : 0)) / cards.length) * 100}%` }} /></div><div className="rounded-2xl border border-[#3f3427] bg-[#151720]/85 p-7 sm:p-10"><div className="flex items-center justify-between text-xs text-[#9297a1]"><span>{direction === "recognize" ? "Which sound is this?" : "Write this kana"}</span><span>{position + 1} / {cards.length}</span></div><div className="grid min-h-44 place-items-center py-8">{direction === "recognize" ? <p className="jp-serif text-8xl text-[#f5f5f2]" aria-label={`Kana ${card.kana}`}>{card.kana}</p> : <p className="text-5xl font-semibold tracking-tight text-[#e5b85c]">{kanaRomajiLabel(card.kana, card.romaji)}</p>}</div>{direction === "recognize" ? <div className="grid gap-3 sm:grid-cols-2">{options.map((option) => <button key={option} type="button" disabled={submitted} onClick={() => setAnswer(option)} aria-pressed={answer === option} className={`rounded-xl border px-4 py-3 text-left text-sm ${answer === option ? "border-[#e34a3f] bg-[#3a2023] text-[#f5f5f2]" : "border-[#3f4652] bg-[#101b2b]/70 text-[#c3c7ce] hover:border-[#e5b85c]"}`}>{option}</button>)}</div> : <label className="block text-sm text-[#9297a1]"><span className="sr-only">Kana answer</span><input value={answer} onChange={(event) => !submitted && setAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} autoComplete="off" autoFocus aria-label="Type the kana" placeholder="Type the kana character" className="w-full rounded-xl border border-[#3f4652] bg-[#101b2b]/75 px-4 py-3 text-3xl text-[#f5f5f2] placeholder:text-base placeholder:text-[#676c75] focus:border-[#e5b85c] focus:outline-none" /></label>}{submitted ? <div className={`mt-6 rounded-xl border p-4 ${correct ? "border-[#376d4c] bg-[#183225]" : "border-[#713b37] bg-[#21191a]"}`} aria-live="polite"><p className={`font-semibold ${correct ? "text-[#8bcca6]" : "text-[#ef675d]"}`}>{correct ? "Correct" : "Keep this one close"}</p><p className="mt-2 text-sm text-[#c3c7ce]">{card.kana} sounds like <span className="text-[#e5b85c]">{kanaRomajiLabel(card.kana, card.romaji)}</span>.</p></div> : null}<button type="button" disabled={!answer.trim() || submitted} onClick={submit} className="mt-7 w-full rounded-xl bg-[#e34a3f] px-5 py-3.5 text-sm font-semibold text-[#0b0b0d] disabled:cursor-not-allowed disabled:opacity-40">Check answer</button>{submitted ? <button type="button" onClick={next} className="mt-3 w-full rounded-xl border border-[#5d3936] px-5 py-3.5 text-sm font-semibold text-[#f5f5f2]">{position === cards.length - 1 ? "Finish session" : "Next kana"} →</button> : null}</div></div>;
}
