"use client";

import { useEffect, useState } from "react";

import { readFuriganaMode, readReviewRecords, type FuriganaMode, type ReviewRecord } from "@/lib/session";
import { toHiragana } from "@/lib/mastery";
import type { KanjiItem, VocabularyItem } from "@/lib/types";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const godanIRow: Record<string, [string, string]> = { "う": ["い", "い"], "く": ["き", "き"], "ぐ": ["ぎ", "ぎ"], "す": ["し", "し"], "つ": ["ち", "ち"], "ぬ": ["に", "に"], "ぶ": ["び", "び"], "む": ["み", "み"], "る": ["り", "り"] };

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
  const entries = new Map<string, string>();
  vocabulary.filter((item) => /[一-龯]/u.test(item.writtenForm)).forEach((item) => {
    entries.set(item.writtenForm, toHiragana(item.reading));
    [...verbAliases(item), ...adjectiveAliases(item)].forEach(([word, reading]) => entries.set(word, toHiragana(reading)));
  });
  kanji.forEach((item) => {
    item.usefulWords.forEach((word) => { if (!entries.has(word.word)) entries.set(word.word, toHiragana(word.reading)); });
    const reading = toHiragana(item.kunyomi[0] ?? item.onyomi[0] ?? "");
    if (reading && !entries.has(item.character)) entries.set(item.character, reading);
  });
  return [...entries.entries()].sort((left, right) => right[0].length - left[0].length);
}

export function JapaneseText({ text, vocabulary, kanji = [], className = "" }: Readonly<{ text: string; vocabulary: VocabularyItem[]; kanji?: KanjiItem[]; className?: string }>) {
  const [mode, setMode] = useState<FuriganaMode>("unknown");
  const [records, setRecords] = useState<Record<string, ReviewRecord>>({});
  const [tapped, setTapped] = useState(false);
  useEffect(() => {
    const refresh = () => { setMode(readFuriganaMode()); setRecords(readReviewRecords()); };
    refresh();
    window.addEventListener("michi-profile-updated", refresh);
    window.addEventListener("michi-review-updated", refresh);
    return () => { window.removeEventListener("michi-profile-updated", refresh); window.removeEventListener("michi-review-updated", refresh); };
  }, []);
  const entries = getJapaneseReadingEntries(vocabulary, kanji);
  if (!entries.length) return <span className={className}>{text}</span>;
  const readings = new Map(entries);
  const vocabularyByWord = new Map(vocabulary.map((item) => [item.writtenForm, item]));
  const parts = text.split(new RegExp(`(${entries.map(([word]) => escapeRegExp(word)).join("|")})`, "gu"));
  const showReading = (part: string) => { if (mode === "always") return true; if (mode === "hide") return false; if (mode === "tap") return tapped; const item = vocabularyByWord.get(part); return !item || !["stable", "strong"].includes(records[item.id]?.masteryState ?? ""); };
  return <span className={className} onClick={mode === "tap" ? () => setTapped((value) => !value) : undefined}>{parts.map((part, index) => readings.has(part) && showReading(part) ? <ruby key={`${part}-${index}`}>{part}<rt className="text-[.42em] font-normal tracking-normal text-[#e5b85c]">{readings.get(part)}</rt></ruby> : <span key={`${part}-${index}`}>{part}</span>)}</span>;
}
