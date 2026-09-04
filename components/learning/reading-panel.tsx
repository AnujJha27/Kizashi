"use client";

import { useEffect, useState } from "react";

import { getReadingEntriesForTexts, JapaneseText } from "@/components/learning/japanese-text";
import { segmentJapaneseText } from "@/lib/japanese-text-core.js";
import { n5Module } from "@/lib/curriculum";
import { toHiragana } from "@/lib/mastery";
import { readFuriganaMode, readReviewRecords, type FuriganaMode, type ReviewRecord } from "@/lib/session";
import type { KanjiItem, ReadingItem, VocabularyItem } from "@/lib/types";

type ReadingMode = "guided" | "normal" | "challenge";
type PassagePart = { text: string; item?: VocabularyItem; reading?: string };
const visualFormatLabels: Record<NonNullable<ReadingItem["visualFormat"]>, string> = { notice: "Notice", menu: "Menu", timetable: "Timetable", schedule: "Schedule", sale: "Sale poster", event: "Event flyer", directions: "Directions", hotel: "Hotel guide", work: "Work notice", health: "Clinic notice", school: "School notice", home: "House rules", restaurant: "Restaurant notice", museum: "Museum notice", weather: "Weather notice", delivery: "Delivery notice", transport: "Transport notice" };
const visualFormatAssets: Record<NonNullable<ReadingItem["visualFormat"]>, string> = { notice: "/learning-assets/reading/home-notice.png", menu: "/learning-assets/reading/cafe-counter.png", timetable: "/learning-assets/reading/station-schedule.png", schedule: "/learning-assets/reading/station-schedule.png", sale: "/learning-assets/reading/cafe-counter.png", event: "/learning-assets/reading/classroom-notice.png", directions: "/learning-assets/reading/station-schedule.png", hotel: "/learning-assets/reading/home-notice.png", work: "/learning-assets/reading/classroom-notice.png", health: "/learning-assets/reading/classroom-notice.png", school: "/learning-assets/reading/classroom-notice.png", home: "/learning-assets/reading/home-notice.png", restaurant: "/learning-assets/reading/cafe-counter.png", museum: "/learning-assets/reading/classroom-notice.png", weather: "/learning-assets/reading/home-notice.png", delivery: "/learning-assets/reading/home-notice.png", transport: "/learning-assets/reading/station-schedule.png" };

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

function ReadingArtifact({ item, vocabulary, kanji }: Readonly<{ item: ReadingItem; vocabulary: VocabularyItem[]; kanji: KanjiItem[] }>) {
  if (!item.visualFormat) return null;
  const lines = item.passage.split(/\r?\n/u).filter(Boolean);
  const rows = lines.slice(1);
  const structured = ["menu", "timetable", "schedule", "sale", "event"].includes(item.visualFormat);
  return <aside className={`mb-6 overflow-hidden rounded-xl border ${structured ? "border-[#8f6c2e] bg-[#211d18]" : "border-[#315d4b] bg-[#162b26]"}`} aria-label={`${visualFormatLabels[item.visualFormat]} reading aid`}><img src={visualFormatAssets[item.visualFormat]} alt="" aria-hidden="true" className="h-32 w-full object-cover opacity-75" loading="lazy" /><div className="p-4"><div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3"><p className="eyebrow">{visualFormatLabels[item.visualFormat]}</p><span aria-hidden="true" className="text-lg text-[#e5b85c]">▦</span></div><h3 className="mt-4 text-lg font-medium text-[#f5f5f2]"><JapaneseText text={item.title} vocabulary={vocabulary} kanji={kanji} always inspect={false} /></h3><div className="mt-4 divide-y divide-white/10">{rows.map((line, index) => { const [label, value] = line.split(/：|:/u, 2); return <div key={`${line}-${index}`} className="flex items-start justify-between gap-5 py-2.5 text-sm"><span className="jp-serif text-[#f5f5f2]"><JapaneseText text={value ? label : line} vocabulary={vocabulary} kanji={kanji} always inspect={false} /></span>{value ? <span className="jp-serif text-right text-[#e5b85c]"><JapaneseText text={value.trim()} vocabulary={vocabulary} kanji={kanji} always inspect={false} /></span> : null}</div>; })}</div><p className="mt-4 text-xs leading-5 text-[#9297a1]">Generated visual context · the accessible Japanese text remains below.</p></div></aside>;
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

  return <div><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2" role="group" aria-label="Reading mode">{(["guided", "normal", "challenge"] as ReadingMode[]).map((value) => <button key={value} type="button" onClick={() => { setMode(value); setShowTranslation(false); setActiveWord(null); setActivePart(null); }} className={`rounded-lg px-3 py-2 text-xs capitalize ${mode === value ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{value}</button>)}</div><p className="text-xs text-[#9297a1]">{knownWords} / {linkedVocabulary.length} words held</p></div><p className="mb-5 text-xs text-[#676c75]">Passage coverage · {Math.round((knownWords / Math.max(linkedVocabulary.length, 1)) * 100)}% familiar</p><ReadingArtifact item={item} vocabulary={vocabulary} kanji={kanji} /><p className="whitespace-pre-line text-lg leading-8 text-[#f5f5f2]">{parts.map((part: PassagePart, index: number) => { const reading = toHiragana(part.item?.reading ?? part.reading ?? ""); const inspectable = Boolean(part.reading); const content = showReading(part) ? <ruby>{part.text}<rt className="text-xs text-[#e5b85c]">{reading}</rt></ruby> : part.text; if (!inspectable) return <span key={`${part.text}-${index}`}>{content}</span>; return <button key={`${part.text}-${index}`} type="button" onClick={() => { const nextPart = activePart === part.text ? null : part.text; setActivePart(nextPart); setActiveWord(nextPart && part.item ? part.item : null); }} className="rounded px-0.5 hover:bg-[#302818]" aria-label={`Inspect ${part.text}`}>{content}</button>; })}</p>{activeWord ? <div className="mt-5 rounded-xl border border-[#4b3a29] bg-[#211d18] p-4" role="status"><div className="flex items-baseline gap-3"><p className="jp-serif text-2xl text-[#e5b85c]"><JapaneseText text={activeWord.writtenForm} vocabulary={vocabulary} kanji={kanji} readingEntries={[[activeWord.writtenForm, toHiragana(activeWord.reading)]]} always inspect={false} /></p></div><p className="mt-2 text-sm text-[#f5f5f2]">{activeWord.meanings.join(" · ")}</p><p className="mt-1 text-xs text-[#9297a1]">{activeWord.partOfSpeech}</p></div> : null}<button type="button" onClick={() => setShowTranslation((value) => !value)} className="mt-6 text-sm font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">{showTranslation ? "Hide translation" : mode === "challenge" ? "Reveal translation" : "Show translation"} <span aria-hidden="true">{showTranslation ? "↑" : "↓"}</span></button>{showTranslation ? <p className="mt-3 border-l-2 border-[#e34a3f] pl-4 text-sm leading-7 text-[#9297a1]">{item.translation}</p> : null}<p className="mt-6 text-xs text-[#676c75]">{mode === "guided" ? furiganaMode === "tap" ? "Tap a word to reveal its reading and meaning." : "Furigana follows your study setting. Tap a word for its meaning." : mode === "challenge" ? "No help until you ask for it. Linked words remain tappable." : "Read first, then reveal only what you need."}</p></div>;
}
