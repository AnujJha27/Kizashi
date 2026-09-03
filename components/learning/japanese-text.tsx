"use client";

import { useEffect, useState } from "react";

import { readFuriganaMode, readReviewRecords, type FuriganaMode, type ReviewRecord } from "@/lib/session";
import { StudyLaterButton } from "@/components/library/study-later";
import { toHiragana } from "@/lib/mastery";
import { segmentJapaneseText } from "@/lib/japanese-text-core.js";
import type { KanjiItem, VocabularyItem } from "@/lib/types";

const godanIRow: Record<string, [string, string]> = { "う": ["い", "い"], "く": ["き", "き"], "ぐ": ["ぎ", "ぎ"], "す": ["し", "し"], "つ": ["ち", "ち"], "ぬ": ["に", "に"], "ぶ": ["び", "び"], "む": ["み", "み"], "る": ["り", "り"] };
const reviewedReadingHints: [string, string][] = [["お客さん", "おきゃくさん"], ["飲み物", "のみもの"], ["午後", "ごご"], ["午前", "ごぜん"], ["何時", "なんじ"], ["一人", "ひとり"], ["二人", "ふたり"], ["お願いします", "おねがいします"], ["読みます", "よみます"], ["会います", "あいます"], ["食べます", "たべます"], ["飲みます", "のみます"], ["行きます", "いきます"], ["来ます", "きます"]];
const readingEntryCache = new WeakMap<object, WeakMap<object, [string, string][]>>();

function verbAliases(item: VocabularyItem) {
  if (!/verb/u.test(item.partOfSpeech)) return [] as [string, string][];
  const word = item.writtenForm;
  const reading = item.reading;
  const aliases: [string, string][] = [];
  const add = (written: string, kana: string) => { if (written && /[一-龯]/u.test(written)) aliases.push([written, kana]); };
  if (word === "来る") {
    add("来ます", "きます");
    add("来ません", "きません");
    add("来ました", "きました");
    add("来た", "きた");
    add("来て", "きて");
    return aliases;
  }
  const isSuru = word.endsWith("する");
  if (isSuru) {
    const writtenStem = word.slice(0, -2);
    const readingStem = reading.endsWith("する") ? reading.slice(0, -2) : reading;
    add(`${writtenStem}し`, `${readingStem}し`);
    add(`${writtenStem}します`, `${readingStem}します`);
    add(`${writtenStem}しません`, `${readingStem}しません`);
    add(`${writtenStem}しました`, `${readingStem}しました`);
    add(`${writtenStem}した`, `${readingStem}した`);
    add(`${writtenStem}して`, `${readingStem}して`);
    add(`${writtenStem}したい`, `${readingStem}したい`);
    return aliases;
  }
  const last = word.slice(-1);
  const lastReading = reading.slice(-1);
  if (item.partOfSpeech.includes("ichidan")) {
    const writtenStem = word.slice(0, -1);
    const readingStem = reading.slice(0, -1);
    add(writtenStem, readingStem);
    add(`${writtenStem}ます`, `${readingStem}ます`);
    add(`${writtenStem}ません`, `${readingStem}ません`);
    add(`${writtenStem}ました`, `${readingStem}ました`);
    add(`${writtenStem}た`, `${readingStem}た`);
    add(`${writtenStem}て`, `${readingStem}て`);
    add(`${writtenStem}たい`, `${readingStem}たい`);
    return aliases;
  }
  const iRow = godanIRow[last];
  const readingIRow = godanIRow[lastReading]?.[1] ?? lastReading;
  if (!iRow) return aliases;
  const writtenStem = word.slice(0, -1) + iRow[0];
  const readingStem = reading.slice(0, -1) + readingIRow;
  add(writtenStem, readingStem);
  add(`${writtenStem}ます`, `${readingStem}ます`);
  add(`${writtenStem}ません`, `${readingStem}ません`);
  add(`${writtenStem}ました`, `${readingStem}ました`);
  const pastEnding = ["う", "つ", "る"].includes(last) ? "った" : ["む", "ぶ", "ぬ"].includes(last) ? "んだ" : last === "く" ? word === "行く" ? "った" : "いた" : last === "ぐ" ? "いだ" : last === "す" ? "した" : "";
  const pastReadingEnding = ["う", "つ", "る"].includes(lastReading) ? "った" : ["む", "ぶ", "ぬ"].includes(lastReading) ? "んだ" : lastReading === "く" ? reading === "いく" ? "った" : "いた" : lastReading === "ぐ" ? "いだ" : lastReading === "す" ? "した" : "";
  if (pastEnding) add(word.slice(0, -1) + pastEnding, reading.slice(0, -1) + pastReadingEnding);
  add(`${writtenStem}たい`, `${readingStem}たい`);
  const teEnding = ["う", "つ", "る"].includes(last) ? "って" : ["む", "ぶ", "ぬ"].includes(last) ? "んで" : last === "く" ? word === "行く" ? "って" : "いて" : last === "ぐ" ? "いで" : last === "す" ? "して" : "";
  const teReadingEnding = ["う", "つ", "る"].includes(lastReading) ? "って" : ["む", "ぶ", "ぬ"].includes(lastReading) ? "んで" : lastReading === "く" ? reading === "いく" ? "って" : "いて" : lastReading === "ぐ" ? "いで" : lastReading === "す" ? "して" : "";
  if (teEnding) add(word.slice(0, -1) + teEnding, reading.slice(0, -1) + teReadingEnding);
  return aliases;
}

function adjectiveAliases(item: VocabularyItem) {
  if (!/い-adjective/u.test(item.partOfSpeech) || !item.writtenForm.endsWith("い") || !item.reading.endsWith("い")) return [] as [string, string][];
  if (item.writtenForm === "いい") return [["よくない", "よくない"], ["よかった", "よかった"], ["よくなかった", "よくなかった"]] as [string, string][];
  const writtenStem = item.writtenForm.slice(0, -1);
  const readingStem = item.reading.slice(0, -1);
  return [[`${writtenStem}くない`, `${readingStem}くない`], [`${writtenStem}かった`, `${readingStem}かった`], [`${writtenStem}くなかった`, `${readingStem}くなかった`]] as [string, string][];
}

export function getJapaneseReadingEntries(vocabulary: VocabularyItem[], kanji: KanjiItem[] = []) {
  const kanjiKey = kanji.length ? kanji : emptyKanji;
  const cachedByKanji = readingEntryCache.get(vocabulary);
  const cached = cachedByKanji?.get(kanjiKey);
  if (cached) return cached;
  const entries = new Map<string, string>();
  vocabulary.filter((item) => /[一-龯]/u.test(item.writtenForm)).forEach((item) => {
    entries.set(item.writtenForm, toHiragana(item.reading));
    [...verbAliases(item), ...adjectiveAliases(item)].forEach(([word, reading]) => entries.set(word, toHiragana(reading)));
  });
  kanji.forEach((item) => {
    item.usefulWords.forEach((word) => { if (!entries.has(word.word)) entries.set(word.word, toHiragana(word.reading)); });
    const readings = [...new Set([...item.kunyomi, ...item.onyomi].map(toHiragana).filter(Boolean))];
    if (readings.length === 1 && !entries.has(item.character)) entries.set(item.character, readings[0]);
  });
  reviewedReadingHints.forEach(([word, reading]) => { if (!entries.has(word)) entries.set(word, reading); });
  const result = [...entries.entries()].sort((left, right) => right[0].length - left[0].length);
  const nextCache = cachedByKanji ?? new WeakMap<object, [string, string][]>();
  nextCache.set(kanjiKey, result);
  if (!cachedByKanji) readingEntryCache.set(vocabulary, nextCache);
  return result;
}

const emptyKanji: KanjiItem[] = [];

export function getReadingEntriesForTexts(texts: string[], vocabulary: VocabularyItem[], kanji: KanjiItem[] = []) {
  const corpus = texts.filter(Boolean).join("\n");
  if (!corpus) return [] as [string, string][];
  return getJapaneseReadingEntries(vocabulary, kanji).filter(([word]) => corpus.includes(word));
}

export function JapaneseText({ text, vocabulary, kanji = [], readingEntries = [], className = "", always = false, inspect = true }: Readonly<{ text: string; vocabulary: VocabularyItem[]; kanji?: KanjiItem[]; readingEntries?: [string, string][]; className?: string; always?: boolean; inspect?: boolean }>) {
  const [mode, setMode] = useState<FuriganaMode>("always");
  const [records, setRecords] = useState<Record<string, ReviewRecord>>({});
  const [tappedPart, setTappedPart] = useState<string | null>(null);
  const [inspected, setInspected] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => { setMode(readFuriganaMode()); setRecords(readReviewRecords()); };
    refresh();
    window.addEventListener("michi-profile-updated", refresh);
    window.addEventListener("michi-review-updated", refresh);
    return () => { window.removeEventListener("michi-profile-updated", refresh); window.removeEventListener("michi-review-updated", refresh); };
  }, []);
  const entriesByWord = new Map<string, string>();
  readingEntries.forEach(([word, reading]) => entriesByWord.set(word, reading));
  if (!readingEntries.length) getReadingEntriesForTexts([text], vocabulary, kanji).forEach(([word, reading]) => { if (!entriesByWord.has(word)) entriesByWord.set(word, reading); });
  const entries = [...entriesByWord.entries()];
  const masteryByWord = new Map<string, string>();
  const itemsByWord = new Map<string, VocabularyItem | KanjiItem>();
  vocabulary.forEach((item) => masteryByWord.set(item.writtenForm, item.id));
  vocabulary.forEach((item) => itemsByWord.set(item.writtenForm, item));
  kanji.forEach((item) => {
    masteryByWord.set(item.character, item.id);
    itemsByWord.set(item.character, item);
    item.usefulWords.forEach((word) => { if (!masteryByWord.has(word.word)) masteryByWord.set(word.word, item.id); });
    item.usefulWords.forEach((word) => { if (!itemsByWord.has(word.word)) itemsByWord.set(word.word, item); });
  });
  const segments = segmentJapaneseText(text, entries.map(([word, reading]) => ({ text: word, reading, itemId: masteryByWord.get(word) })));
  const showReading = (part: (typeof segments)[number]) => { if (mode === "hide") return false; if (mode === "tap") return part.status === "resolved" && tappedPart === part.text; const itemId = part.itemId; if (mode === "always" || (always && mode !== "unknown")) return part.status === "resolved"; return part.status === "resolved" && (!itemId || !["stable", "strong"].includes(records[itemId]?.masteryState ?? "")); };
  const inspectedItem = inspected ? [...itemsByWord.entries()].find(([word]) => word === inspected)?.[1] : undefined;
  const inspectedSegment = inspected ? segments.find((segment: { text: string; status: string; reading?: string }) => segment.text === inspected) : undefined;
  const renderPart = (part: (typeof segments)[number], index: number) => {
    const content = showReading(part) ? <ruby>{part.text}<rt className="text-[.42em] font-normal tracking-normal text-[#e5b85c]">{part.reading}</rt></ruby> : part.text;
    if (!inspect || part.status === "not-applicable") return <span key={`${part.text}-${index}`}>{content}</span>;
    return <button type="button" key={`${part.text}-${index}`} onClick={(event) => { event.stopPropagation(); if (mode === "tap") setTappedPart(tappedPart === part.text ? null : part.text); setInspected(inspected === part.text ? null : part.text); }} className="rounded px-0.5 hover:bg-[#302818]" aria-label={`Inspect ${part.text}`}>{content}</button>;
  };
  return <span className={`japanese-text ${className}`.trim()}>{segments.map(renderPart)}{inspectedItem ? <span className="ml-3 inline-flex items-center gap-2 rounded-lg border border-[#4b3a29] bg-[#211d18] px-2 py-1 align-middle text-left text-xs" role="status"><span className="jp-serif text-[#e5b85c]">{"writtenForm" in inspectedItem ? inspectedItem.writtenForm : inspectedItem.character}</span><span className="text-[#c3c7ce]">{inspectedItem.meanings.join(" · ")}</span><span className="text-[#676c75]">{inspectedItem.category} · {(inspectedItem.sourceIds ?? []).join(", ")}</span><StudyLaterButton itemId={inspectedItem.id} /></span> : inspectedSegment?.status === "resolved" ? <span className="ml-3 inline-flex items-center gap-2 rounded-lg border border-[#4b3a29] bg-[#211d18] px-2 py-1 align-middle text-left text-xs" role="status"><span className="jp-serif text-[#e5b85c]">{inspected}</span><span className="text-[#9297a1]">{inspectedSegment.reading}</span></span> : inspected ? <span className="ml-3 inline-flex items-center gap-2 rounded-lg border border-[#4b3a29] bg-[#211d18] px-2 py-1 align-middle text-left text-xs" role="status"><span className="jp-serif text-[#e5b85c]">{inspected}</span><span className="text-[#9297a1]">Reading unavailable</span><button type="button" onClick={() => void navigator.clipboard?.writeText(inspected)} className="text-[#e5b85c] underline underline-offset-2">Copy for lookup</button><a href={`/library?query=${encodeURIComponent(inspected)}`} className="text-[#e5b85c] underline underline-offset-2">Search library</a></span> : null}</span>;
}
