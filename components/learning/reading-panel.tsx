"use client";

import { useEffect, useState } from "react";

import { getReadingEntriesForTexts } from "@/components/learning/japanese-text";
import { segmentJapaneseText } from "@/lib/japanese-text-core.js";
import { n5Module } from "@/lib/curriculum";
import { toHiragana } from "@/lib/mastery";
import { readFuriganaMode, readReviewRecords, type FuriganaMode, type ReviewRecord } from "@/lib/session";
import type { KanjiItem, ReadingItem, VocabularyItem } from "@/lib/types";

type ReadingMode = "guided" | "normal" | "challenge";
type PassagePart = { text: string; item?: VocabularyItem; reading?: string };

const furigana: Record<string, string> = { 毎朝: "まいあさ", 私: "わたし", 七時: "しちじ", 起きます: "おきます", 水: "みず", 飲んで: "のんで", 駅: "えき", 友達: "ともだち", 待ちます: "まちます", 電車: "でんしゃ", 大学: "だいがく", 行きます: "いきます" };

function passageParts(text: string, vocabulary: VocabularyItem[], kanji: KanjiItem[]) {
  const entries = new Map([...Object.entries(furigana), ...getReadingEntriesForTexts([text], vocabulary, kanji)]);
  const items = new Map<string, VocabularyItem>();
  vocabulary.forEach((item) => items.set(item.writtenForm, item));
  return segmentJapaneseText(text, [...entries].map(([word, reading]) => ({ text: word, reading }))).map((part: { text: string; status: string; reading?: string }): PassagePart => ({
    text: part.text,
    item: items.get(part.text),
    reading: part.status === "resolved" ? part.reading : undefined,
  }));
}

export function ReadingPanel({ item, vocabulary = n5Module.vocabulary, kanji = n5Module.kanji, always = false }: Readonly<{ item: ReadingItem; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[]; always?: boolean }>) {
  const [mode, setMode] = useState<ReadingMode>("guided");
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeWord, setActiveWord] = useState<VocabularyItem | null>(null);
  const [activePart, setActivePart] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, ReviewRecord>>({});
  const [furiganaMode, setFuriganaMode] = useState<FuriganaMode>("always");
  const parts = passageParts(item.passage, vocabulary, kanji);
  const linkedVocabulary = item.vocabularyIds.map((id) => vocabulary.find((entry) => entry.id === id)).filter((entry): entry is VocabularyItem => Boolean(entry));
  const knownWords = linkedVocabulary.filter((entry) => ["stable", "strong"].includes(records[entry.id]?.masteryState ?? "") || (records[entry.id]?.streak ?? 0) >= 2).length;
  const masteryByWord = new Map<string, string>();
  vocabulary.forEach((entry) => masteryByWord.set(entry.writtenForm, entry.id));
  kanji.forEach((entry) => {
    masteryByWord.set(entry.character, entry.id);
    entry.usefulWords.forEach((word) => { if (!masteryByWord.has(word.word)) masteryByWord.set(word.word, entry.id); });
  });

  useEffect(() => {
    const refresh = () => { setRecords(readReviewRecords()); setFuriganaMode(readFuriganaMode()); };
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-profile-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-profile-updated", refresh); };
  }, [item.id]);

  useEffect(() => { setActiveWord(null); setActivePart(null); }, [item.id]);

  const showReading = (part: PassagePart) => {
    if (!part.reading) return false;
    if (mode === "challenge") return false;
    if (furiganaMode === "hide") return false;
    if (furiganaMode === "tap") return activePart === part.text;
    if (mode === "normal") return activePart === part.text;
    const itemId = part.item?.id ?? masteryByWord.get(part.text);
    if (furiganaMode === "always" || (always && furiganaMode !== "unknown")) return true;
    return !itemId || !["stable", "strong"].includes(records[itemId]?.masteryState ?? "");
  };

  return <div><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2" role="group" aria-label="Reading mode">{(["guided", "normal", "challenge"] as ReadingMode[]).map((value) => <button key={value} type="button" onClick={() => { setMode(value); setShowTranslation(false); setActiveWord(null); setActivePart(null); }} className={`rounded-lg px-3 py-2 text-xs capitalize ${mode === value ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{value}</button>)}</div><p className="text-xs text-[#9297a1]">{knownWords} / {linkedVocabulary.length} words held</p></div><p className="mb-5 text-xs text-[#676c75]">Passage coverage · {Math.round((knownWords / Math.max(linkedVocabulary.length, 1)) * 100)}% familiar</p><p className="whitespace-pre-line text-lg leading-8 text-[#f5f5f2]">{parts.map((part: PassagePart, index: number) => { const reading = toHiragana(part.item?.reading ?? part.reading ?? ""); const inspectable = Boolean(part.reading); const content = showReading(part) ? <ruby>{part.text}<rt className="text-xs text-[#e5b85c]">{reading}</rt></ruby> : part.text; if (!inspectable) return <span key={`${part.text}-${index}`}>{content}</span>; return <button key={`${part.text}-${index}`} type="button" onClick={() => { const nextPart = activePart === part.text ? null : part.text; setActivePart(nextPart); setActiveWord(nextPart && part.item ? part.item : null); }} className="rounded px-0.5 hover:bg-[#302818]" aria-label={`Inspect ${part.text}`}>{content}</button>; })}</p>{activeWord ? <div className="mt-5 rounded-xl border border-[#4b3a29] bg-[#211d18] p-4" role="status"><div className="flex items-baseline gap-3"><p className="jp-serif text-2xl text-[#e5b85c]">{activeWord.writtenForm}</p><p className="jp-serif text-base text-[#9297a1]">{toHiragana(activeWord.reading)}</p></div><p className="mt-2 text-sm text-[#f5f5f2]">{activeWord.meanings.join(" · ")}</p><p className="mt-1 text-xs text-[#9297a1]">{activeWord.partOfSpeech}</p></div> : null}<button type="button" onClick={() => setShowTranslation((value) => !value)} className="mt-6 text-sm font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">{showTranslation ? "Hide translation" : mode === "challenge" ? "Reveal translation" : "Show translation"} <span aria-hidden="true">{showTranslation ? "↑" : "↓"}</span></button>{showTranslation ? <p className="mt-3 border-l-2 border-[#e34a3f] pl-4 text-sm leading-7 text-[#9297a1]">{item.translation}</p> : null}<p className="mt-6 text-xs text-[#676c75]">{mode === "guided" ? furiganaMode === "tap" ? "Tap a word to reveal its reading and meaning." : "Furigana follows your study setting. Tap a word for its meaning." : mode === "challenge" ? "No help until you ask for it. Linked words remain tappable." : "Read first, then reveal only what you need."}</p></div>;
}
