"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { JapaneseText } from "@/components/learning/japanese-text";
import { AudioControls } from "@/components/learning/audio-controls";
import { GrammarVisual } from "@/components/learning/grammar-visual";
import { ReadingPanel } from "@/components/learning/reading-panel";
import { ItemNote } from "@/components/library/item-note";
import { LearnerAssistant } from "@/components/learning/learner-assistant";
import { SaveSentence } from "@/components/library/save-sentence";
import { StudyLaterButton } from "@/components/library/study-later";
import { ContentFlagButton } from "@/components/library/content-flag-button";
import { SourceReferencePanel } from "@/components/learning/source-reference-panel";
import { IrodoriPatternReference } from "@/components/learning/irodori-pattern-reference";
import { n5Module } from "@/lib/curriculum";
import { classifyItem } from "@/lib/jlpt";
import { toHiragana } from "@/lib/mastery";
import { readReviewRecords } from "@/lib/session";
import type { GrammarContrast, KanjiItem, ListeningItem, ReadingItem, VocabularyItem, GrammarItem } from "@/lib/types";

type Entry = VocabularyItem | KanjiItem | GrammarItem | ReadingItem | ListeningItem;

function VocabularyDetail({ item, vocabulary, kanji }: Readonly<{ item: VocabularyItem; vocabulary: VocabularyItem[]; kanji: KanjiItem[] }>) {
  const frequency = typeof item.frequency === "number" ? item.frequency.toLocaleString() : "";
  const perMillion = typeof item.frequencyMetadata?.pmw === "number" ? item.frequencyMetadata.pmw.toFixed(2) : "";
  const spokenFrequency = typeof item.spokenFrequency === "number" ? item.spokenFrequency.toLocaleString() : "";
  const spokenPerMillion = typeof item.spokenFrequencyMetadata?.pmw === "number" ? item.spokenFrequencyMetadata.pmw.toFixed(2) : "";
  return <>
    <p className="jp-serif text-6xl text-[#f5f5f2]"><JapaneseText text={item.writtenForm} vocabulary={vocabulary} kanji={kanji} readingEntries={[[item.writtenForm, toHiragana(item.reading)]]} always inspect={false} /></p>
    <AudioControls text={item.writtenForm} reading={item.reading} humanFirst externalUrl={item.audioUrl} metadata={item.audio} className="mt-4" />
    <p className="mt-5 text-lg text-[#f5f5f2]">{item.meanings.join(" · ")}</p>
    <p className="mt-2 text-sm text-[#9297a1]">{item.partOfSpeech} · {item.collocations.join(" · ")}</p>
    {frequency || perMillion ? <p className="mt-3 text-xs text-[#676c75]">Written frequency · {frequency || "—"}{perMillion ? ` · ${perMillion} per million` : ""}</p> : null}
    {spokenFrequency || spokenPerMillion ? <p className="mt-1 text-xs text-[#676c75]">Spoken frequency · {spokenFrequency || "—"}{spokenPerMillion ? ` · ${spokenPerMillion} per million` : ""}</p> : null}
    <div className="mt-8 space-y-3">{item.exampleSentences.map((example) => <div key={example.japanese} className="rounded-xl bg-[#101b2b]/70 p-4"><p className="jp-serif text-lg text-[#e5b85c]"><JapaneseText text={example.japanese} vocabulary={vocabulary} kanji={kanji} always /></p><p className="mt-1 text-sm text-[#9297a1]">{example.translation}</p><AudioControls text={example.japanese} metadata={example.audio} className="mt-3" /><SaveSentence sourceItemId={item.id} japanese={example.japanese} translation={example.translation} /></div>)}</div>
  </>;
}

function KanjiDetail({ item, vocabulary, kanji }: Readonly<{ item: KanjiItem; vocabulary: VocabularyItem[]; kanji: KanjiItem[] }>) {
  const metadata = [item.strokeCount ? `${item.strokeCount} strokes` : "", item.grade ? `school grade ${item.grade}` : "", item.radical ? `radical ${item.radical}` : ""].filter(Boolean);
  const reading = toHiragana(item.kunyomi[0] ?? item.onyomi[0] ?? "");
  return <><p className="jp-serif text-8xl text-[#f5f5f2]"><JapaneseText text={item.character} vocabulary={vocabulary} kanji={kanji} readingEntries={reading ? [[item.character, reading]] : []} always inspect={false} /></p><AudioControls text={item.character} metadata={item.audio} humanFirst className="mt-4" /><p className="mt-5 text-lg text-[#f5f5f2]">{item.meanings.join(" · ")}</p><p className="mt-3 text-sm text-[#9297a1]">On: {item.onyomi.map(toHiragana).join(" · ") || "—"} · Kun: {item.kunyomi.map(toHiragana).join(" · ") || "—"}</p>{metadata.length || item.nanori?.length || item.components?.length || item.mnemonic || item.strokeOrder ? <div className="mt-5 rounded-xl border border-white/10 bg-[#101b2b]/60 p-4"><p className="eyebrow mb-2">Kanji study data</p>{metadata.length ? <p className="text-sm text-[#c3c7ce]">{metadata.join(" · ")}</p> : null}{item.nanori?.length ? <p className="mt-2 text-xs text-[#9297a1]">Name readings: {item.nanori.map(toHiragana).join(" · ")}</p> : null}{item.components?.length ? <p className="mt-2 text-xs text-[#9297a1]">Components: {item.components.join(" · ")}</p> : null}{item.mnemonic ? <p className="mt-3 text-sm leading-6 text-[#c3a998]">{item.mnemonic}</p> : null}{item.strokeOrder ? <p className="mt-3 text-xs text-[#9297a1]">Stroke order: {item.strokeOrder}</p> : null}</div> : null}<div className="mt-8"><p className="eyebrow mb-3">Useful words</p><div className="grid gap-3 sm:grid-cols-2">{item.usefulWords.map((word) => { const linked = vocabulary.find((entry) => entry.writtenForm === word.word); const content = <><p className="jp-serif text-xl text-[#e5b85c]"><JapaneseText text={word.word} vocabulary={vocabulary} kanji={kanji} readingEntries={[[word.word, toHiragana(word.reading)]]} always inspect={false} /></p><p className="mt-1 text-sm text-[#9297a1]">{word.meaning}</p></>; return linked ? <Link key={word.word} href={`/entry/${linked.id}`} className="rounded-xl bg-[#101b2b]/70 p-4 hover:bg-[#172434]">{content}<p className="mt-3 text-xs text-[#e5b85c]">Open word →</p></Link> : <div key={word.word} className="rounded-xl bg-[#101b2b]/70 p-4">{content}</div>; })}</div></div></>;
}

function GrammarDetail({ item, contrasts, vocabulary, kanji }: Readonly<{ item: GrammarItem; contrasts: GrammarContrast[]; vocabulary: VocabularyItem[]; kanji: KanjiItem[] }>) {
  const contrast = contrasts.find((entry) => item.contrastIds.includes(entry.id));
  const [showSupport, setShowSupport] = useState(true);
  useEffect(() => {
    const record = readReviewRecords()[item.id];
    const experienced = Boolean(record && ((["stable", "strong"] as string[]).includes(record.masteryState ?? "") || (record.attempts ?? 0) >= 3));
    setShowSupport(!experienced);
  }, [item.id]);
  if (!item.meaning.trim()) return <><p className="jp-serif text-3xl text-[#e5b85c]"><JapaneseText text={item.pattern} vocabulary={vocabulary} kanji={kanji} always /></p><IrodoriPatternReference item={item} vocabulary={vocabulary} kanji={kanji} /><SourceReferencePanel grammarId={item.id} /></>;
  return <><p className="jp-serif text-3xl text-[#e5b85c]"><JapaneseText text={item.pattern} vocabulary={vocabulary} kanji={kanji} always /></p><AudioControls text={item.pattern} metadata={item.audio} className="mt-4" /><h2 className="mt-5 text-xl font-medium">{item.meaning}</h2>{showSupport ? <><p className="mt-3 text-sm leading-7 text-[#9297a1]">{item.formation}</p><p className="mt-5 text-sm leading-7 text-[#c3a998]">{item.intuition}</p></> : <button type="button" onClick={() => setShowSupport(true)} className="mt-3 rounded-lg border border-[#3f4652] px-3 py-2 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c]">Show formation hint</button>}<div className="mt-7"><p className="eyebrow mb-3">Usage conditions</p><ul className="space-y-2 text-sm leading-6 text-[#c3c7ce]">{item.usageConditions.map((condition) => <li key={condition}>— {condition}</li>)}</ul></div><div className="mt-7 space-y-3">{item.examples.map((example) => <div key={example.japanese} className="rounded-xl bg-[#101b2b]/70 p-4"><p className="jp-serif text-lg text-[#e5b85c]"><JapaneseText text={example.japanese} vocabulary={vocabulary} kanji={kanji} always /></p><p className="mt-1 text-sm text-[#9297a1]">{example.translation}</p><AudioControls text={example.japanese} metadata={example.audio} className="mt-3" /><GrammarVisual sentence={example.japanese} vocabulary={vocabulary} kanji={kanji} /><SaveSentence sourceItemId={item.id} japanese={example.japanese} translation={example.translation} /></div>)}</div><div className="mt-7 rounded-xl border border-[#713b37]/70 bg-[#21191a]/60 p-4"><p className="eyebrow mb-2">Common mistake</p><p className="text-sm leading-6 text-[#c3c7ce]">{item.commonMistakes.join(" ")}</p></div>{contrast ? <div className="mt-7 border-l-2 border-[#e34a3f] pl-4"><p className="eyebrow">Contrast · {contrast.title}</p><p className="mt-2 text-sm leading-6 text-[#c3a998]">{contrast.explanation}</p></div> : null}<SourceReferencePanel grammarId={item.id} /></>;
}

function OtherDetail({ item, vocabulary, kanji }: Readonly<{ item: ReadingItem | ListeningItem; vocabulary: VocabularyItem[]; kanji: KanjiItem[] }>) {
  const [showTranscript, setShowTranscript] = useState(true);
  useEffect(() => {
    if (item.category === "reading") return;
    const record = readReviewRecords()[item.id];
    const experienced = Boolean(record && ((["stable", "strong"] as string[]).includes(record.masteryState ?? "") || (record.attempts ?? 0) >= 3));
    setShowTranscript(!experienced);
  }, [item.category, item.id]);
  if (item.category === "reading") return <><AudioControls text={item.passage} metadata={item.audio} className="mt-6" /><ReadingPanel item={item} vocabulary={vocabulary} kanji={kanji} always /></>;
  return <><p className="text-sm leading-7 text-[#9297a1]">{item.situation}</p><AudioControls text={item.transcript} externalUrl={item.audioUrl} metadata={item.audio} preferredRate={item.speed} className="mt-6" />{showTranscript ? <p className="jp-serif mt-6 whitespace-pre-line text-lg leading-8 text-[#f5f5f2]"><JapaneseText text={item.transcript} vocabulary={vocabulary} kanji={kanji} always /></p> : <button type="button" onClick={() => setShowTranscript(true)} className="mt-6 rounded-lg border border-[#3f4652] px-3 py-2 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c]">Show transcript</button>}<p className="mt-6 text-sm text-[#9297a1]">{item.questions.length} listening questions ready in Practice.</p></>;
}

export function EntryDetail({ item, contrasts, vocabulary = n5Module.vocabulary, kanji = n5Module.kanji }: Readonly<{ item: Entry; contrasts: GrammarContrast[]; vocabulary?: VocabularyItem[]; kanji?: KanjiItem[] }>) {
  const detail = item.category === "vocabulary" ? <VocabularyDetail item={item} vocabulary={vocabulary} kanji={kanji} /> : item.category === "kanji" ? <KanjiDetail item={item} vocabulary={vocabulary} kanji={kanji} /> : item.category === "grammar" ? <GrammarDetail item={item} contrasts={contrasts} vocabulary={vocabulary} kanji={kanji} /> : <OtherDetail item={item} vocabulary={vocabulary} kanji={kanji} />;
  const assistantText = item.category === "vocabulary" ? item.exampleSentences[0]?.japanese : item.category === "grammar" ? item.examples[0]?.japanese : item.category === "reading" || item.category === "listening" ? item.category === "reading" ? item.passage : item.transcript : "";
  const classification = classifyItem(item);
  const autoReleased = item.contentReview?.method === "automatic" && !item.contentReview.humanReviewed;
  const immersionLabel = item.category === "reading" ? "Read in Immersion" : item.category === "listening" ? "Listen in Immersion" : "Hear in Immersion";
  const title = item.category === "vocabulary"
    ? <JapaneseText text={item.writtenForm} vocabulary={vocabulary} kanji={kanji} readingEntries={[[item.writtenForm, toHiragana(item.reading)]]} always inspect={false} />
    : item.category === "kanji"
      ? <JapaneseText text={item.character} vocabulary={vocabulary} kanji={kanji} readingEntries={[[item.character, toHiragana(item.kunyomi[0] ?? item.onyomi[0] ?? "")]]} always inspect={false} />
      : item.category === "grammar"
        ? <JapaneseText text={item.pattern} vocabulary={vocabulary} kanji={kanji} always inspect={false} />
        : <JapaneseText text={item.title} vocabulary={vocabulary} kanji={kanji} always inspect={false} />;
  return <div className="mx-auto max-w-4xl"><div className="mb-6"><Link href="/library" className="text-sm text-[#e5b85c] hover:text-[#f1cf7c]">← Back to Library</Link></div><section className="surface-panel overflow-hidden p-7 sm:p-10"><div className="mb-8 flex items-start justify-between gap-4"><div><p className="eyebrow">{item.category} · {item.jlptLevel ?? "open"}</p><h1 className="mt-2 text-2xl font-medium text-[#f5f5f2]">{title}</h1><p className="mt-1 text-xs text-[#9297a1]">{item.subcategory ?? "N5 Foundations"} · difficulty {item.difficulty}</p></div><div className="flex flex-col items-end gap-3"><span className="seal" aria-label={`${item.jlptLevel ?? "Open"} entry`}><span>{item.jlptLevel ?? "—"}</span><small>道</small></span><StudyLaterButton itemId={item.id} /><ContentFlagButton itemId={item.id} /></div></div><div className="mb-7 flex flex-wrap gap-2 text-[10px] text-[#676c75]"><span className="rounded-md border border-white/10 px-2 py-1">{classification ? `${classification.band} · ${classification.confidence} confidence` : "unclassified"}</span>{autoReleased ? <span className="rounded-md border border-[#5d4c2c] bg-[#302818] px-2 py-1 text-[#e5b85c]">Auto-released · not human reviewed</span> : null}{item.sourceIds?.map((sourceId) => <span key={sourceId} className="rounded-md border border-white/10 px-2 py-1">source · {sourceId}</span>)}</div>{detail}<LearnerAssistant defaultText={assistantText} itemId={item.id} vocabulary={vocabulary} kanji={kanji} /><div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-5"><Link href={`/practice?mode=${item.category}`} className="inline-flex rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Practice {item.category} <span className="ml-2" aria-hidden="true">→</span></Link><Link href="/immersion" className="inline-flex rounded-xl border border-[#3f4652] px-4 py-3 text-sm text-[#c3c7ce] hover:border-[#e5b85c]">{immersionLabel} <span className="ml-2" aria-hidden="true">→</span></Link></div><ItemNote itemId={item.id} /></section></div>;
}

export type { Entry };
