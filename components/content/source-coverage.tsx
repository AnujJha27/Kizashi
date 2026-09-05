"use client";

import { useMemo } from "react";

import taeKimMappings from "@/data/source-maps/tae-kim.json";
import wikibooksMappings from "@/data/source-maps/wikibooks.json";
import irodoriGrammarMappings from "@/data/source-maps/irodori-grammar.json";
import tadokuEntries from "@/data/source-maps/tadoku.json";
import { getExternalResourceById } from "@/lib/external-resources";
import { getExternalSourceCoverage } from "@/lib/source-coverage.js";
import type { LessonContentItem } from "@/lib/curriculum";
import type { ContentSource } from "@/lib/types";

function ratio(value: { covered: number | null; total: number }) {
  return value.covered === null ? "Not measured" : `${value.covered} / ${value.total}`;
}

function CoverageValue({ label, value }: Readonly<{ label: string; value: string }>) {
  return <div className="rounded-lg border border-white/10 bg-[#101b2b]/65 p-3"><p className="text-[10px] uppercase tracking-[.12em] text-[#676c75]">{label}</p><p className="mt-1 text-sm text-[#f5f5f2]">{value}</p></div>;
}

function modalityCoverage(items: LessonContentItem[]) {
  const exampleItems = items.filter((item) => (item.category === "vocabulary" && item.exampleSentences.length > 0) || (item.category === "grammar" && item.examples.length > 0));
  const audioItems = items.filter((item) => (item.category === "vocabulary" && Boolean(item.audio?.sourceType || item.audioUrl)) || (item.category === "reading" && Boolean(item.audio?.sourceType)) || (item.category === "listening" && Boolean(item.audio?.sourceType || item.audioUrl)));
  const contextQuestions = items.filter((item) => (item.category === "reading" && Boolean(item.questions?.length)) || (item.category === "listening" && item.questions.length > 0));
  const conjugationCandidates = items.filter((item) => item.category === "vocabulary" && (item.jlptLevel === "N5" || item.jlptLevel === "N4") && (item.commonness ?? 0) >= 4 && /verb|adjective/u.test(item.partOfSpeech));
  return [`Examples · ${exampleItems.length} / ${items.filter((item) => item.category === "vocabulary" || item.category === "grammar").length}`, `Audio attached · ${audioItems.length} / ${items.length}`, `Reading/listening checks · ${contextQuestions.length} / ${items.filter((item) => item.category === "reading" || item.category === "listening").length}`, `Conjugation candidates · ${conjugationCandidates.length}`];
}

function packageProvenance(items: LessonContentItem[], sources: readonly ContentSource[]) {
  const knownSources = new Set(sources.map((source) => source.id));
  const connected = items.filter((item) => item.sourceIds?.some((sourceId) => knownSources.has(sourceId))).length;
  return { connected, total: items.length };
}

function ProvenanceGaps({ items, sources }: Readonly<{ items: LessonContentItem[]; sources: readonly ContentSource[] }>) {
  const knownSources = new Set(sources.map((source) => source.id));
  const missing = items.filter((item) => !item.sourceIds?.length);
  const unknown = items.filter((item) => item.sourceIds?.some((sourceId) => !knownSources.has(sourceId)));
  const unknownIds = [...new Set(items.flatMap((item) => (item.sourceIds ?? []).filter((sourceId) => !knownSources.has(sourceId))))];
  const categories = ["vocabulary", "kanji", "grammar", "reading", "listening"] as const;
  const counts = categories.map((category) => {
    const categoryItems = items.filter((item) => item.category === category);
    return `${category}: ${categoryItems.filter((item) => !item.sourceIds?.length).length} missing / ${categoryItems.length}`;
  });

  return <section className="mt-4 rounded-lg border border-white/10 bg-[#101b2b]/45 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#e5b85c]">Provenance gaps</p><p className={missing.length || unknown.length ? "text-xs text-[#e5b85c]" : "text-xs text-[#6fb98f]"}>{missing.length || unknown.length ? `${missing.length + unknown.length} records to inspect` : "No gaps found"}</p></div><p className="mt-1 text-xs text-[#9297a1]">A record counts as sourced when it has a source ID registered in the current source manifest.</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{counts.map((count) => <span key={count} className="rounded-md bg-[#17181d]/75 px-2 py-1 text-[11px] text-[#c3c7ce]">{count}</span>)}</div>{unknownIds.length ? <p className="mt-3 text-xs text-[#ef675d]">Unknown source IDs: {unknownIds.slice(0, 8).join(", ")}{unknownIds.length > 8 ? "…" : ""}</p> : null}{missing.length ? <p className="mt-1 text-xs text-[#ef675d]">Missing source records: {missing.slice(0, 8).map((item) => item.id).join(", ")}{missing.length > 8 ? "…" : ""}</p> : null}</section>;
}

export function SourceCoverage({ items, sources = [] }: Readonly<{ items: LessonContentItem[]; sources?: readonly ContentSource[] }>) {
  const coverage = useMemo(() => getExternalSourceCoverage({
    items,
    taeKimMappings,
    wikibooksMappings,
    irodoriGrammarMappings,
    irodoriResources: [{ targetItemIds: getExternalResourceById("irodori-ordering-food")?.targetItemIds ?? [] }],
    tadokuEntries,
    aozoraEnabled: Boolean(getExternalResourceById("aozora-bunko")),
  }), [items]);
  const modality = useMemo(() => modalityCoverage(items), [items]);
  const provenance = useMemo(() => packageProvenance(items, sources), [items, sources]);
  const provenanceComplete = provenance.connected === provenance.total;

  return <section className="rounded-xl border border-white/10 bg-[#0d1522]/65 p-4"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Source coverage</p><h2 className="mt-1 text-lg font-medium text-[#f5f5f2]">{provenanceComplete ? "Everything is connected" : "What is connected to this package"}</h2></div><p className="text-[11px] text-[#676c75]">Computed from current mappings and registry data</p></div><p className="mt-2 text-xs text-[#9297a1]">{provenance.connected} / {provenance.total} package records have registered provenance. Alternative source links are selective references, not package-source requirements.</p><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><CoverageValue label="Package provenance" value={`${provenance.connected} / ${provenance.total}`} /><CoverageValue label="Tae Kim · optional links" value={ratio(coverage.grammar.taeKim)} /><CoverageValue label="Wikibooks · optional links" value={ratio(coverage.grammar.wikibooks)} /><CoverageValue label="Irodori · optional links" value={ratio(coverage.grammar.irodori)} /><CoverageValue label="Lingua Libre · vocabulary" value={`On demand · ${coverage.vocabulary.commons.total} targets`} /><CoverageValue label="Irodori · practical overlap" value={ratio(coverage.irodori)} /><CoverageValue label="Tadoku · shelf" value={`${coverage.reading.tadoku} resources`} /><CoverageValue label="Aozora · native reading" value={coverage.reading.aozora ? "Enabled" : "Unavailable"} /></div><div className="mt-4 border-t border-white/10 pt-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#e5b85c]">Learning modality coverage</p><div className="mt-2 grid gap-1 text-xs text-[#c3c7ce] sm:grid-cols-2">{modality.map((value) => <p key={value}>{value}</p>)}</div></div><ProvenanceGaps items={items} sources={sources} /></section>;
}
