"use client";

import { useEffect, useMemo, useState } from "react";

import type { LessonContentItem } from "@/lib/curriculum";
import { useLocalItems } from "@/components/content/use-local-items";
import { JapaneseText } from "@/components/learning/japanese-text";
import { ItemNote } from "@/components/library/item-note";
import { StudyLaterButton } from "@/components/library/study-later";
import { classifyItem } from "@/lib/jlpt";
import { toHiragana } from "@/lib/mastery";
import { readNotes, readReviewRecords, readStudyLaterIds, type NoteRecord, type ReviewRecord } from "@/lib/session";
import type { KanjiItem, VocabularyItem } from "@/lib/types";
import Link from "next/link";

type LibraryFilter = "all" | LessonContentItem["category"] | "queue" | "new" | "weak" | "learned" | "N5" | "N4";
const filters: LibraryFilter[] = ["all", "new", "weak", "learned", "queue", "N5", "N4", "vocabulary", "kanji", "reading", "listening", "grammar"];

function searchText(item: LessonContentItem) {
  if (item.category === "vocabulary") return [item.title, item.writtenForm, item.reading, ...item.meanings, ...item.collocations].join(" ");
  if (item.category === "kanji") return [item.title, item.character, ...item.meanings, ...item.onyomi, ...item.kunyomi, ...item.usefulWords.flatMap((word) => [word.word, word.reading, word.meaning])].join(" ");
  if (item.category === "grammar") return [item.title, item.pattern, item.meaning, item.formation].join(" ");
  if (item.category === "reading") return [item.title, item.passage, item.translation].join(" ");
  return [item.title, item.situation, item.transcript].join(" ");
}

function categoryLabel(category: LessonContentItem["category"]) {
  return { vocabulary: "Vocabulary", kanji: "Kanji", grammar: "Grammar", reading: "Reading", listening: "Listening" }[category];
}

function filterLabel(filter: (typeof filters)[number]) {
  return filter === "all" ? "All" : filter === "queue" ? "Study later" : filter === "new" ? "New" : filter === "weak" ? "Weak" : filter === "learned" ? "Learned" : filter === "N5" || filter === "N4" ? filter : categoryLabel(filter);
}

function matchesProgressFilter(filter: LibraryFilter, item: LessonContentItem, records: Record<string, ReviewRecord>) {
  const record = records[item.id];
  if (filter === "N5" || filter === "N4") return item.jlptLevel === filter;
  if (filter === "new") return !record;
  if (filter === "weak") return Boolean(record && ((record.incorrectCount ?? 0) > 0 || (record.attempts > 0 && record.correct / record.attempts < 0.75) || record.masteryState === "learning"));
  if (filter === "learned") return Boolean(record && (record.masteryState === "stable" || record.masteryState === "strong" || record.streak >= 2));
  return true;
}

function detail(item: LessonContentItem, vocabulary: VocabularyItem[], kanji: KanjiItem[]) {
  if (item.category === "vocabulary") return <><p className="mt-2 text-sm text-[#f5f5f2]">{item.meanings.join(" · ")}</p><p className="mt-1 text-xs text-[#9297a1]">{item.partOfSpeech}</p></>;
  if (item.category === "kanji") return <p className="jp-serif text-3xl text-[#e5b85c]"><ruby>{item.character}<rt className="text-xs text-[#e5b85c]">{toHiragana(item.kunyomi[0] ?? item.onyomi[0] ?? "")}</rt></ruby></p>;
  if (item.category === "grammar") return <><p className="jp-serif text-xl text-[#e5b85c]"><JapaneseText text={item.pattern} vocabulary={vocabulary} kanji={kanji} /></p><p className="mt-2 text-sm text-[#f5f5f2]">{item.meaning}</p></>;
  return <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#f5f5f2]">{item.category === "reading" ? item.passage : item.situation}</p>;
}

export function LibraryBrowser({ items, initialFilter = "all" }: Readonly<{ items: LessonContentItem[]; initialFilter?: LibraryFilter }>) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>(initialFilter);
  const [notes, setNotes] = useState<Record<string, NoteRecord>>({});
  const [studyLater, setStudyLater] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, ReviewRecord>>({});
  const catalog = useLocalItems(items);
  const vocabulary = catalog.filter((item): item is VocabularyItem => item.category === "vocabulary");
  const kanji = catalog.filter((item): item is KanjiItem => item.category === "kanji");
  useEffect(() => setFilter(initialFilter), [initialFilter]);
  useEffect(() => { const refresh = () => { setNotes(readNotes()); setStudyLater(readStudyLaterIds()); setRecords(readReviewRecords()); }; refresh(); window.addEventListener("michi-notes-updated", refresh); window.addEventListener("michi-study-later-updated", refresh); window.addEventListener("michi-review-updated", refresh); return () => { window.removeEventListener("michi-notes-updated", refresh); window.removeEventListener("michi-study-later-updated", refresh); window.removeEventListener("michi-review-updated", refresh); }; }, []);
  const filtered = useMemo(() => catalog.filter((item) => (filter === "all" || (filter === "queue" ? studyLater.includes(item.id) : ["new", "weak", "learned", "N5", "N4"].includes(filter) ? matchesProgressFilter(filter, item, records) : item.category === filter)) && `${searchText(item)} ${notes[item.id]?.body ?? ""}`.toLowerCase().includes(query.toLowerCase().trim())).slice(0, 60), [catalog, filter, notes, query, records, studyLater]);

  return <div className="relative z-10"><div className="relative z-20 mb-7 flex flex-col gap-4 sm:flex-row"><label className="block min-w-0 flex-1"><span className="sr-only">Search the library</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Japanese, meaning, or pattern" className="relative z-30 w-full rounded-xl border border-[#3f4652] bg-[#101b2b]/75 px-4 py-3 text-sm text-[#f5f5f2] placeholder:text-[#676c75] focus:border-[#e5b85c] focus:outline-none" /></label><div className="relative z-20 flex flex-wrap gap-2" role="group" aria-label="Filter library">{filters.map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs ${filter === value ? "bg-[#e34a3f] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{filterLabel(value)}{value === "queue" ? ` · ${studyLater.length}` : ""}</button>)}</div></div><div className="mb-4 flex items-center justify-between text-xs text-[#9297a1]"><span>{filtered.length} items</span><span>N5 Foundations · searchable study shelf</span></div>{filtered.length ? <div className="grid gap-3 sm:grid-cols-2">{filtered.map((item) => { const classification = classifyItem(item); return <article key={item.id} className="rounded-xl border border-white/10 bg-[#101b2b]/62 p-5 transition-colors hover:border-[#e5b85c]/40"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="eyebrow">{categoryLabel(item.category)}</p><Link href={`/entry/${item.id}`} className="jp-serif mt-1 block text-lg font-medium text-[#f5f5f2] hover:text-[#e5b85c]">{item.category === "vocabulary" ? <ruby>{item.writtenForm}<rt className="text-[10px] text-[#e5b85c]">{toHiragana(item.reading)}</rt></ruby> : item.category === "kanji" ? <ruby>{item.character}<rt className="text-[10px] text-[#e5b85c]">{toHiragana(item.kunyomi[0] ?? item.onyomi[0] ?? "")}</rt></ruby> : item.category === "grammar" ? <JapaneseText text={item.pattern} vocabulary={vocabulary} kanji={kanji} /> : item.title}</Link></div><span className="rounded-full border border-[#3f4652] px-2 py-1 text-[10px] text-[#e5b85c]">{item.jlptLevel ?? "open"}</span></div>{detail(item, vocabulary, kanji)}<div className="mt-5 flex flex-wrap gap-2">{item.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md bg-[#171f2c] px-2 py-1 text-[10px] text-[#9297a1]">{tag}</span>)}{classification ? <span className="rounded-md bg-[#2a2130] px-2 py-1 text-[10px] text-[#d7b1a4]">{classification.band} · {classification.confidence} confidence</span> : null}</div><div className="mt-4 flex items-center justify-between gap-3"><StudyLaterButton itemId={item.id} /><Link href={`/entry/${item.id}`} className="text-xs text-[#e5b85c] hover:text-[#f1cf7c]">Open entry →</Link></div><ItemNote itemId={item.id} /></article>; })}</div> : <div className="rounded-xl border border-[#3f3427] bg-[#211d18] p-8 text-center text-sm text-[#9297a1]">Nothing matches that search yet.</div>}</div>;
}
