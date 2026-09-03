"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type TouchEvent } from "react";

import { readLessonState, readReviewRecords, recordReview, recordStudyActivity, type MasterySignal, type ReviewRating, writeLessonState } from "@/lib/session";
import { JapaneseText } from "@/components/learning/japanese-text";
import { AudioControls } from "@/components/learning/audio-controls";
import { GrammarVisual } from "@/components/learning/grammar-visual";
import { ReadingPanel } from "@/components/learning/reading-panel";
import { SaveSentence } from "@/components/library/save-sentence";
import { TypedRecall } from "@/components/learning/typed-recall";
import { toHiragana } from "@/lib/mastery";
import type { LessonContentItem } from "@/lib/curriculum";
import type { GrammarContrast, KanjiItem, VocabularyItem } from "@/lib/types";

function categoryLabel(category: LessonContentItem["category"]) {
  return { vocabulary: "Vocabulary", kanji: "Kanji", grammar: "Grammar", reading: "Reading", listening: "Listening" }[category];
}

function masterySignal(category: LessonContentItem["category"]): MasterySignal {
  return category === "reading" || category === "listening" ? "context" : "recall";
}

function JapaneseWord({ written, reading, className = "" }: Readonly<{ written: string; reading: string; className?: string }>) {
  return <ruby className={className}>{written}<rt className="text-[.35em] font-normal tracking-normal text-[#e5b85c]">{toHiragana(reading)}</rt></ruby>;
}

function Prompt({ item, onReveal, vocabulary = [], kanji = [] }: Readonly<{ item: LessonContentItem; onReveal: () => void; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[] }>) {
  if (item.category === "vocabulary") return <><p className="jp-serif text-6xl text-[#f5f5f2]"><JapaneseWord written={item.writtenForm} reading={item.reading} /></p><AudioControls text={item.writtenForm} reading={item.reading} humanFirst /><TypedRecall item={item} onReveal={onReveal} /></>;
  if (item.category === "kanji") return <><p className="jp-serif text-8xl text-[#f5f5f2]"><ruby>{item.character}<rt className="text-[.3em] font-normal tracking-normal text-[#e5b85c]">{toHiragana(item.kunyomi[0] ?? item.onyomi[0] ?? "")}</rt></ruby></p><AudioControls text={item.character} humanFirst /><TypedRecall item={item} onReveal={onReveal} /></>;
  if (item.category === "grammar") return <><p className="jp-serif text-4xl text-[#f5f5f2]"><JapaneseText text={item.pattern} vocabulary={vocabulary} kanji={kanji} always /></p><AudioControls text={item.pattern} /></>;
  return <p className="jp-serif text-3xl text-[#f5f5f2]">{item.title}</p>;
}

function Answer({ item, contrasts, vocabulary, kanji }: Readonly<{ item: LessonContentItem; contrasts: GrammarContrast[]; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[] }>) {
  if (item.category === "vocabulary") return <><p className="text-lg font-medium text-[#f5f5f2]">{item.meanings.join(" · ")}</p><p className="mt-3 text-sm text-[#9297a1]">{item.partOfSpeech} · {item.collocations.slice(0, 2).join(" · ")}</p><p className="jp-serif mt-4 text-lg text-[#e5b85c]"><JapaneseText text={item.exampleSentences[0]?.japanese ?? ""} vocabulary={vocabulary ?? []} kanji={kanji} always /></p><p className="mt-1 text-sm text-[#9297a1]">{item.exampleSentences[0]?.translation}</p>{item.exampleSentences[0] ? <><AudioControls text={item.exampleSentences[0].japanese} metadata={item.exampleSentences[0].audio} className="mt-3" /><SaveSentence sourceItemId={item.id} japanese={item.exampleSentences[0].japanese} translation={item.exampleSentences[0].translation} /></> : null}</>;
  if (item.category === "kanji") return <><p className="text-lg font-medium text-[#f5f5f2]">{item.meanings.join(" · ")}</p><p className="mt-3 text-sm text-[#9297a1]">On: {item.onyomi.map(toHiragana).join(" · ") || "—"} · Kun: {item.kunyomi.map(toHiragana).join(" · ") || "—"}</p><div className="mt-4 flex flex-wrap gap-2">{item.usefulWords.slice(0, 3).map((word) => <span key={word.word} className="rounded-lg border border-[#3f3427] bg-[#211d18] px-3 py-2 text-sm text-[#e5b85c]"><ruby>{word.word}<rt className="text-[10px] text-[#e5b85c]">{toHiragana(word.reading)}</rt></ruby></span>)}</div></>;
  if (item.category === "grammar") { const contrast = contrasts.find((entry) => item.contrastIds.includes(entry.id)); return <><p className="text-lg font-medium text-[#f5f5f2]">{item.meaning}</p><p className="mt-3 text-sm leading-6 text-[#9297a1]">{item.formation}</p><p className="mt-4 text-sm leading-6 text-[#c3a998]">{item.intuition}</p>{item.examples[0] ? <GrammarVisual sentence={item.examples[0].japanese} vocabulary={vocabulary} kanji={kanji} /> : null}<div className="mt-5 space-y-3">{item.examples.slice(0, 2).map((example) => <div key={example.japanese} className="rounded-lg bg-[#17181d]/80 p-3"><p className="jp-serif text-lg text-[#e5b85c]"><JapaneseText text={example.japanese} vocabulary={vocabulary ?? []} kanji={kanji} always /></p><p className="mt-1 text-xs text-[#9297a1]">{example.translation}</p><AudioControls text={example.japanese} metadata={example.audio} className="mt-3" /><SaveSentence sourceItemId={item.id} japanese={example.japanese} translation={example.translation} /></div>)}</div><p className="mt-5 text-sm leading-6 text-[#9297a1]">Common mistake: {item.commonMistakes[0]}</p>{contrast ? <div className="mt-5 border-l-2 border-[#e34a3f] pl-4"><p className="eyebrow">Contrast · {contrast.title}</p><p className="mt-2 text-sm leading-6 text-[#c3a998]">{contrast.explanation}</p></div> : null}</>;
  }
  if (item.category === "reading") return <><AudioControls text={item.passage} metadata={item.audio} /><ReadingPanel item={item} vocabulary={vocabulary} kanji={kanji} always /></>;
  return <><AudioControls text={item.transcript} externalUrl={item.audioUrl} metadata={item.audio} preferredRate={item.speed} className="mb-4" /><p className="whitespace-pre-line text-sm leading-7 text-[#f5f5f2]"><JapaneseText text={item.transcript} vocabulary={vocabulary ?? []} kanji={kanji} always /></p><p className="mt-4 text-sm text-[#9297a1]">{item.questions.length} listening questions ready.</p></>;
}

export function LessonPlayer({ lessonId, items, contrasts = [], vocabulary, kanji, onComplete }: Readonly<{ lessonId: string; items: LessonContentItem[]; contrasts?: GrammarContrast[]; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[]; onComplete?: () => void }>) {
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [complete, setComplete] = useState(false);
  const [ready, setReady] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, newItems: 0 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const saved = readLessonState(lessonId);
    if (saved.lessonId === lessonId) {
      setPosition(Math.min(saved.position, items.length));
      setComplete(saved.status === "complete" || saved.position >= items.length);
    } else {
      setPosition(0);
      setComplete(false);
    }
    setSessionStats({ reviewed: 0, newItems: 0 });
    setReady(true);
  }, [items.length, lessonId]);

  useEffect(() => {
    if (!ready) return;
    writeLessonState({ lessonId, position, status: complete ? "complete" : "in_progress" });
  }, [complete, lessonId, position, ready]);

  useEffect(() => {
    if (!ready || complete) return;
    const upcoming = items[position + 1];
    if (upcoming?.category !== "listening" || !upcoming.audioUrl) return;
    const audio = new Audio(upcoming.audioUrl);
    audio.preload = "auto";
    return () => { audio.src = ""; };
  }, [complete, items, position, ready]);

  useEffect(() => {
    if (!ready || complete || !items[position]) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === " " && !revealed) {
        event.preventDefault();
        setRevealed(true);
      }
      const ratings: Record<string, ReviewRating> = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
      const rating = ratings[event.key];
      if (revealed && rating) {
        const isNew = !readReviewRecords()[items[position].id];
        setSessionStats((stats) => ({ reviewed: stats.reviewed + 1, newItems: stats.newItems + (isNew ? 1 : 0) }));
        recordReview(items[position].id, rating, masterySignal(items[position].category));
        if (rating === "again") {
          setRevealed(false);
        } else if (position >= items.length - 1) {
          recordStudyActivity(50);
          setPosition(items.length);
          setComplete(true);
          onComplete?.();
        } else {
          setPosition((value) => value + 1);
          setRevealed(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [complete, items, onComplete, position, ready, revealed]);

  if (!ready) return <div className="min-h-80 animate-pulse rounded-xl bg-[#17181d]" aria-label="Loading lesson" />;

  if (!items.length) return <div className="rounded-xl border border-[#713b37] bg-[#21191a] p-5 text-sm text-[#f5f5f2]">This lesson has no study items yet.</div>;

  if (complete) return <div className="grid min-h-80 place-items-center rounded-xl border border-[#3f3427] bg-[#211d18] p-8 text-center"><div><p className="jp-serif text-4xl text-[#e5b85c]">よくできました</p><p className="mt-3 text-sm text-[#9297a1]">You finished this pass. Tricky items will return when they are due.</p><div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-2 text-left"><div className="rounded-lg bg-[#101b2b]/70 p-3"><p className="text-xs text-[#9297a1]">Cards reviewed</p><p className="mt-1 text-xl font-semibold text-[#f5f5f2]">{sessionStats.reviewed}</p></div><div className="rounded-lg bg-[#2b2418]/70 p-3"><p className="text-xs text-[#9297a1]">New today</p><p className="mt-1 text-xl font-semibold text-[#e5b85c]">{sessionStats.newItems}</p></div></div><div className="mt-7 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => { setPosition(0); setComplete(false); setRevealed(false); setSessionStats({ reviewed: 0, newItems: 0 }); }} className="rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">Study again</button><Link href="/journey" className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Return to Journey</Link><Link href="/review" className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#9297a1] hover:text-[#f5f5f2]">Check review</Link></div></div></div>;

  const item = items[position];
  const next = (rating: ReviewRating) => {
    const isNew = !readReviewRecords()[item.id];
    setSessionStats((stats) => ({ reviewed: stats.reviewed + 1, newItems: stats.newItems + (isNew ? 1 : 0) }));
    recordReview(item.id, rating, masterySignal(item.category));
    if (rating === "again") {
      setRevealed(false);
      return;
    }
    if (position >= items.length - 1) {
      recordStudyActivity(50);
      setPosition(items.length);
      setComplete(true);
      onComplete?.();
    } else {
      setPosition((value) => value + 1);
      setRevealed(false);
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!revealed) return;
    const touch = event.changedTouches[0];
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!revealed || !start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return;
    next(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "easy" : "again") : (dy < 0 ? "good" : "hard"));
  };

  return <div><div className="mb-5 flex items-center justify-between text-xs text-[#9297a1]"><span>{categoryLabel(item.category)} · active recall</span><span>{position + 1} / {items.length}</span></div><div className="mb-7 h-1 overflow-hidden rounded-full bg-[#292b31]"><div className="h-full rounded-full bg-[#e34a3f] transition-[width] duration-300" style={{ width: `${((position + (revealed ? 1 : 0)) / items.length) * 100}%` }} /></div><div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className="rounded-xl border border-[#3f3427] bg-[#151720]/80 p-7 sm:p-10"><div className="min-h-32"><p className="eyebrow mb-5">Recall this</p><Prompt item={item} onReveal={() => setRevealed(true)} vocabulary={vocabulary} kanji={kanji} /></div>{revealed ? <div className="mt-8 border-t border-[#292b31] pt-7" aria-live="polite"><p className="eyebrow mb-3 text-[#6fb98f]">Answer</p><Answer item={item} contrasts={contrasts} vocabulary={vocabulary} kanji={kanji} /></div> : <button type="button" onClick={() => setRevealed(true)} className="mt-8 w-full rounded-xl bg-[#e34a3f] px-5 py-3.5 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Reveal answer <span aria-hidden="true">→</span></button>}</div>{revealed ? <><p className="mt-3 text-center text-[10px] text-[#676c75] sm:hidden">Swipe left / down / up / right · Again / Hard / Good / Easy</p><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><button type="button" onClick={() => next("again")} className="rounded-xl border border-[#5d3936] bg-[#211d18] px-3 py-3 text-sm font-semibold text-[#e5b85c] hover:border-[#e34a3f]">Again <span className="block text-[10px] font-normal text-[#9297a1]">1</span></button><button type="button" onClick={() => next("hard")} className="rounded-xl border border-[#3f4652] bg-[#172434] px-3 py-3 text-sm font-semibold text-[#a6c9dc] hover:border-[#4f9ac0]">Hard <span className="block text-[10px] font-normal text-[#9297a1]">2</span></button><button type="button" onClick={() => next("good")} className="rounded-xl bg-[#6fb98f] px-3 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#8bcca6]">Good <span className="block text-[10px] font-normal text-[#234130]">3</span></button><button type="button" onClick={() => next("easy")} className="rounded-xl bg-[#e5b85c] px-3 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#f1cf7c]">Easy <span className="block text-[10px] font-normal text-[#4c3a12]">4</span></button></div></> : null}</div>;
}
