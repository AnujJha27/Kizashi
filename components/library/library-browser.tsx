"use client";

import { useEffect, useMemo, useState } from "react";

import type { LessonContentItem } from "@/lib/curriculum";
import { useLocalItems } from "@/components/content/use-local-items";
import { JapaneseText } from "@/components/learning/japanese-text";
import { ItemNote } from "@/components/library/item-note";
import { StudyLaterButton } from "@/components/library/study-later";
import { n5Module } from "@/lib/curriculum";
import { classifyItem } from "@/lib/jlpt";
import { matchesKanjiNotebookFilter } from "@/lib/kanji-writing-core.js";
import { toHiragana } from "@/lib/mastery";
import { getContentReviewStatus } from "@/lib/content-validation";
import { readContentFlags } from "@/lib/content-flags.js";
import { readKanjiWritingProgress, readLessonState, readMistakes, readNotes, readReviewRecords, readStudyLaterIds, type NoteRecord, type ReviewRecord } from "@/lib/session";
import type { KanjiItem, VocabularyItem } from "@/lib/types";
import Link from "next/link";

type LibraryFilter = "all" | LessonContentItem["category"] | "queue" | "new" | "weak" | "learned" | "provisional" | "reviewed" | "flagged" | "N5" | "N4" | "kanji-notebook" | "current" | "writing-due" | "recently-learned" | "not-written";
const filters: LibraryFilter[] = ["all", "kanji-notebook", "current", "writing-due", "not-written", "recently-learned", "new", "weak", "learned", "provisional", "reviewed", "flagged", "queue", "N5", "N4", "vocabulary", "kanji", "reading", "listening", "grammar"];

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
  return filter === "all" ? "All" : filter === "kanji-notebook" ? "漢字帳 · Kanji notebook" : filter === "current" ? "Current journey" : filter === "writing-due" ? "Writing due" : filter === "recently-learned" ? "Recently learned" : filter === "not-written" ? "Not written yet" : filter === "queue" ? "Study later" : filter === "new" ? "New" : filter === "weak" ? "Weak" : filter === "learned" ? "Learned" : filter === "provisional" ? "Provisional" : filter === "reviewed" ? "Reviewed" : filter === "flagged" ? "Flagged" : filter === "N5" || filter === "N4" ? filter : categoryLabel(filter);
}

function matchesProgressFilter(filter: LibraryFilter, item: LessonContentItem, records: Record<string, ReviewRecord>, signals: Parameters<typeof matchesKanjiNotebookFilter>[2]) {
  const record = records[item.id];
  if (filter === "N5" || filter === "N4") return item.jlptLevel === filter;
  if (["current", "writing-due", "recently-learned", "not-written"].includes(filter)) return matchesKanjiNotebookFilter(item, filter, signals);
  if (filter === "new") return !record;
  if (filter === "weak") return Boolean(record && ((record.incorrectCount ?? 0) > 0 || (record.attempts > 0 && record.correct / record.attempts < 0.75) || record.masteryState === "learning"));
  if (filter === "learned") return Boolean(record && (record.masteryState === "stable" || record.masteryState === "strong" || record.streak >= 2));
  return true;
}

function writingLabel(state?: string) {
  return state === "written-from-memory" ? "Written" : state === "written-with-support" ? "With support" : state === "traced" ? "Traced" : state === "watched" ? "Watched" : "Not started";
}

function detail(item: LessonContentItem, vocabulary: VocabularyItem[], kanji: KanjiItem[], writingProgress: ReturnType<typeof readKanjiWritingProgress>) {
  if (item.category === "vocabulary") return <><p className="mt-2 text-sm text-[#f5f5f2]">{item.meanings.join(" · ")}</p><p className="mt-1 text-xs text-[#9297a1]">{item.partOfSpeech}</p></>;
  if (item.category === "kanji") return <div><p className="jp-serif text-4xl text-[#e5b85c]"><JapaneseText text={item.character} vocabulary={vocabulary} kanji={kanji} readingEntries={[[item.character, toHiragana(item.kunyomi[0] ?? item.onyomi[0] ?? "")]]} always inspect={false} /></p><p className="mt-2 text-xs text-[#9297a1]">{item.strokeCount ? `${item.strokeCount} strokes` : "Stroke count unavailable"} · {toHiragana(item.kunyomi[0] ?? item.onyomi[0] ?? "—")}</p><p className="mt-2 text-sm text-[#f5f5f2]">{item.meanings.join(" · ")}</p><div className="mt-4 flex flex-wrap items-center gap-3 text-xs"><span className="text-[#9297a1]">Writing: <span className="text-[#c3c7ce]">{writingLabel(writingProgress[item.id]?.state)}</span></span><Link href={`/practice?mode=kanji-writing&item=${encodeURIComponent(item.id)}`} className="text-[#e5b85c] hover:text-[#f1cf7c]">Write →</Link></div></div>;
  if (item.category === "grammar") return <><p className="jp-serif text-xl text-[#e5b85c]"><JapaneseText text={item.pattern} vocabulary={vocabulary} kanji={kanji} /></p><p className="mt-2 text-sm text-[#f5f5f2]">{item.meaning}</p></>;
  return item.category === "reading" ? <p className="jp-serif mt-2 line-clamp-2 text-sm leading-6 text-[#f5f5f2]"><JapaneseText text={item.passage} vocabulary={vocabulary} kanji={kanji} inspect={false} /></p> : <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#f5f5f2]">{item.situation}</p>;
}

export function LibraryBrowser({ items, initialFilter = "all", initialQuery = "" }: Readonly<{ items: LessonContentItem[]; initialFilter?: LibraryFilter; initialQuery?: string }>) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<(typeof filters)[number]>(initialFilter);
  const [notes, setNotes] = useState<Record<string, NoteRecord>>({});
  const [studyLater, setStudyLater] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, ReviewRecord>>({});
  const [mistakes, setMistakes] = useState<ReturnType<typeof readMistakes>>({});
  const [writingProgress, setWritingProgress] = useState<ReturnType<typeof readKanjiWritingProgress>>({});
  const [lessonItemIds, setLessonItemIds] = useState<string[]>([]);
  const [contentFlags, setContentFlags] = useState<ReturnType<typeof readContentFlags>>({});
  const catalog = useLocalItems(items);
  const vocabulary = catalog.filter((item): item is VocabularyItem => item.category === "vocabulary");
  const kanji = catalog.filter((item): item is KanjiItem => item.category === "kanji");
  useEffect(() => setFilter(initialFilter), [initialFilter]);
  useEffect(() => setQuery(initialQuery), [initialQuery]);
  useEffect(() => { const refresh = () => { const lessonId = readLessonState().lessonId; const lesson = n5Module.course.chapters.flatMap((chapter) => chapter.lessons).find((entry) => entry.id === lessonId); setLessonItemIds(lesson?.itemIds ?? []); setNotes(readNotes()); setStudyLater(readStudyLaterIds()); setRecords(readReviewRecords()); setMistakes(readMistakes()); setWritingProgress(readKanjiWritingProgress()); setContentFlags(readContentFlags()); }; refresh(); ["michi-notes-updated", "michi-study-later-updated", "michi-review-updated", "michi-content-flagged-updated", "michi-kanji-writing-updated", "michi-lesson-updated", "michi-mistakes-updated"].forEach((event) => window.addEventListener(event, refresh)); return () => ["michi-notes-updated", "michi-study-later-updated", "michi-review-updated", "michi-content-flagged-updated", "michi-kanji-writing-updated", "michi-lesson-updated", "michi-mistakes-updated"].forEach((event) => window.removeEventListener(event, refresh)); }, []);
  const notebookSignals = { lessonItemIds, reviewRecords: records, mistakes, writingProgress };
  const filtered = useMemo(() => catalog.filter((item) => (filter === "all" || (filter === "queue" ? studyLater.includes(item.id) : filter === "kanji-notebook" ? item.category === "kanji" : ["new", "weak", "learned", "N5", "N4", "current", "writing-due", "recently-learned", "not-written"].includes(filter) ? matchesProgressFilter(filter, item, records, notebookSignals) : filter === "provisional" ? getContentReviewStatus(item) === "pending" : filter === "reviewed" ? getContentReviewStatus(item) === "approved" || contentFlags[item.id]?.status === "reviewed" : filter === "flagged" ? contentFlags[item.id]?.status === "flagged" : item.category === filter)) && `${searchText(item)} ${notes[item.id]?.body ?? ""}`.toLowerCase().includes(query.toLowerCase().trim())).slice(0, 60), [catalog, contentFlags, filter, mistakes, notes, query, records, studyLater, writingProgress, lessonItemIds]);

  return <div className="relative z-10"><div className="relative z-20 mb-7 flex flex-col gap-4 sm:flex-row"><label className="block min-w-0 flex-1"><span className="sr-only">Search the library</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Japanese, meaning, or pattern" className="relative z-30 w-full rounded-xl border border-[#3f4652] bg-[#101b2b]/75 px-4 py-3 text-sm text-[#f5f5f2] placeholder:text-[#676c75] focus:border-[#e5b85c] focus:outline-none" /></label><div className="relative z-20 flex flex-wrap gap-2" role="group" aria-label="Filter library">{filters.map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs ${filter === value ? "bg-[#e34a3f] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{filterLabel(value)}{value === "queue" ? ` · ${studyLater.length}` : ""}</button>)}</div></div><div className="mb-4 flex items-center justify-between text-xs text-[#9297a1]"><span>{filtered.length} items</span><span>{filter === "kanji-notebook" || ["current", "writing-due", "not-written", "recently-learned"].includes(filter) ? "Kanji notebook · writing aware" : "N5 Foundations · searchable study shelf"}</span></div>{filtered.length ? <div className="grid gap-3 sm:grid-cols-2">{filtered.map((item) => { const classification = classifyItem(item); const title = item.category === "vocabulary" ? <JapaneseText text={item.writtenForm} vocabulary={vocabulary} kanji={kanji} readingEntries={[[item.writtenForm, toHiragana(item.reading)]]} always inspect={false} /> : item.category === "kanji" ? <JapaneseText text={item.character} vocabulary={vocabulary} kanji={kanji} readingEntries={[[item.character, toHiragana(item.kunyomi[0] ?? item.onyomi[0] ?? "")]]} always inspect={false} /> : item.category === "grammar" ? <JapaneseText text={item.pattern} vocabulary={vocabulary} kanji={kanji} inspect={false} /> : <JapaneseText text={item.title} vocabulary={vocabulary} kanji={kanji} always inspect={false} />; const reviewStatus = getContentReviewStatus(item); return <article key={item.id} className="rounded-xl border border-white/10 bg-[#101b2b]/62 p-5 transition-colors hover:border-[#e5b85c]/40"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="eyebrow">{categoryLabel(item.category)}</p><Link href={`/entry/${item.id}`} className="jp-serif mt-1 block text-lg font-medium text-[#f5f5f2]">{title}</Link></div><span className="rounded-full border border-[#3f4652] px-2 py-1 text-[10px] text-[#e5b85c]">{item.jlptLevel ?? "open"}</span></div>{detail(item, vocabulary, kanji, writingProgress)}<div className="mt-5 flex flex-wrap gap-2">{item.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md bg-[#171f2c] px-2 py-1 text-[10px] text-[#9297a1]">{tag}</span>)}{classification ? <span className="rounded-md bg-[#2a2130] px-2 py-1 text-[10px] text-[#d7b1a4]">{classification.band} · {classification.confidence} confidence</span> : null}{reviewStatus === "pending" ? <span className="rounded-md border border-[#5d4c2c] px-2 py-1 text-[10px] text-[#e5b85c]">◌ provisional</span> : null}{contentFlags[item.id]?.status === "reviewed" ? <span className="rounded-md border border-[#315d4b] px-2 py-1 text-[10px] text-[#8bcca6]">reviewed here</span> : null}{contentFlags[item.id]?.status === "flagged" ? <span className="rounded-md border border-[#713b37] px-2 py-1 text-[10px] text-[#ef675d]">flagged</span> : null}</div><div className="mt-4 flex items-center justify-between gap-3"><StudyLaterButton itemId={item.id} /><Link href={`/entry/${item.id}`} className="text-xs text-[#e5b85c] hover:text-[#f1cf7c]">Open entry →</Link></div><ItemNote itemId={item.id} /></article>; })}</div> : <div className="rounded-xl border border-[#3f3427] bg-[#211d18] p-8 text-center text-sm text-[#9297a1]">Nothing matches that search yet.</div>}</div>;
}
