"use client";

import { useEffect, useMemo, useState } from "react";

import { useContentModule } from "@/components/content/use-content-module";
import { ExternalSourceViewer } from "@/components/learning/external-source-viewer";
import { externalResourceToSourceLink, type ExternalSourceLink } from "@/components/learning/external-source-launcher";
import { ImmersionPlayer } from "@/components/learning/immersion-player";
import { getListeningClipMetadata, selectImmersionClips } from "@/lib/immersion-core.js";
import { readExternalSourceProgress } from "@/lib/external-source-progress.js";
import { readMistakes, readReviewRecords, type MistakeRecord, type ReviewRecord } from "@/lib/session";
import { getExternalResources } from "@/lib/external-resources";

type ImmersionMode = "listen" | "read" | "shadow" | "real-life" | "explore";

function knownIds(records: Record<string, ReviewRecord>) {
  return new Set(Object.keys(records));
}

function coverageLabel(value: number) {
  return value ? `${Math.round(value * 100)}% familiar` : "coverage pending";
}

function sourceCards() {
  return getExternalResources().filter((resource) => resource.id === "erin" || (resource.resourceType === "listening" && resource.sourceId !== "irodori")).map(externalResourceToSourceLink);
}

export function ImmersionSurface() {
  const module = useContentModule();
  const [records, setRecords] = useState<Record<string, ReviewRecord>>({});
  const [mistakes, setMistakes] = useState<Record<string, MistakeRecord>>({});
  const [sourceProgress, setSourceProgress] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<ImmersionMode>("listen");
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => { setRecords(readReviewRecords()); setMistakes(readMistakes()); setSourceProgress(readExternalSourceProgress()); };
    refresh();
    window.addEventListener("michi-review-updated", refresh);
    window.addEventListener("michi-mistakes-updated", refresh);
    window.addEventListener("michi-source-progress-updated", refresh);
    return () => { window.removeEventListener("michi-review-updated", refresh); window.removeEventListener("michi-mistakes-updated", refresh); window.removeEventListener("michi-source-progress-updated", refresh); };
  }, []);

  const known = useMemo(() => knownIds(records), [records]);
  const clips = useMemo(() => selectImmersionClips(module.listening, "guided", known, 8, { mistakes, sourceProgress }), [known, mistakes, module.listening, sourceProgress]);
  const itemMap = useMemo(() => new Map([...module.vocabulary, ...module.grammar, ...module.kanji].map((item) => [item.id, item])), [module.grammar, module.kanji, module.vocabulary]);
  const readings = module.readings.slice(0, 8);
  const sources = useMemo(sourceCards, []);
  const irodoriActivities = useMemo(() => getExternalResources({ skill: "real-world-practice" }).map(externalResourceToSourceLink), []);
  const openedSourceCount = sources.filter((source) => sourceProgress[source.id]).length;

  if (selectedClipId) return <ImmersionPlayer clipId={selectedClipId} focus="listen" startShadowing={mode === "shadow"} onClose={() => setSelectedClipId(null)} />;
  if (selectedReadingId) return <ImmersionPlayer readingId={selectedReadingId} focus="read" onClose={() => setSelectedReadingId(null)} />;

  return <div className="space-y-7"><section className="surface-panel overflow-hidden p-6 sm:p-9"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Immersion · 浸る</p><h1 className="mt-1 text-3xl font-medium text-[#f5f5f2] sm:text-4xl">Explore Japanese in context.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9297a1]">A quieter place for natural listening, short reading, shadowing, and useful detours. Pick an experience; Kizashi keeps the study machinery out of the way.</p></div><span className="text-xs text-[#9297a1]">{openedSourceCount} / {sources.length} sources opened</span></div><div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-5" role="tablist" aria-label="Immersion activities">{(["listen", "read", "shadow", "real-life", "explore"] as ImmersionMode[]).map((value) => <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => setMode(value)} className={`rounded-xl border px-4 py-3 text-left text-sm ${mode === value ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-white/10 bg-[#101b2b]/45 text-[#9297a1] hover:border-[#e5b85c]"}`}><span className="block font-semibold capitalize">{value === "real-life" ? "Real life" : value}</span><span className="jp-serif text-xs text-[#e5b85c]">{value === "listen" ? "聞く" : value === "read" ? "読む" : value === "shadow" ? "まねる" : value === "real-life" ? "実際に使う" : "寄り道"}</span></button>)}</div></section>
    {mode === "explore" ? <section className="surface-panel p-6 sm:p-9"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">寄り道 · Detours</p><h2 className="mt-1 text-2xl font-medium">Explore the source worlds.</h2><p className="mt-2 text-sm text-[#9297a1]">Open provider-hosted material when you want to wander further.</p></div><span className="text-xs text-[#9297a1]">{openedSourceCount} opened</span></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sources.map((source) => <SourceCard key={source.id} source={source} opened={Boolean(sourceProgress[source.id])} />)}</div></section> : null}
    {mode === "read" ? <section className="surface-panel p-6 sm:p-9"><div><p className="eyebrow">読む · Quick read</p><h2 className="mt-1 text-2xl font-medium">Read a little Japanese.</h2><p className="mt-2 text-sm text-[#9297a1]">Short passages stay together with their questions.</p></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{readings.map((reading) => <button key={reading.id} type="button" onClick={() => setSelectedReadingId(reading.id)} className="border-l border-white/15 pl-4 text-left hover:border-[#e5b85c]"><p className="eyebrow text-[10px]">{reading.subcategory ?? "reading"}</p><p className="mt-2 text-lg font-medium text-[#f5f5f2]">{reading.title}</p><p className="jp-serif mt-1 line-clamp-2 text-sm text-[#e5b85c]">{reading.passage}</p><p className="mt-3 text-xs text-[#9297a1]">Open reading activity →</p></button>)}</div></section> : null}
    {mode === "real-life" ? <section className="surface-panel p-6 sm:p-9"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">実際に使う · Real-life Japanese</p><h2 className="mt-1 text-2xl font-medium">Practice a real situation.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9297a1]">Irodori lessons turn Kizashi foundations into useful listening, dialogue, shadowing, and Can-do practice. The original lesson stays with the Japan Foundation.</p></div><span className="text-xs text-[#9297a1]">{irodoriActivities.length} activities</span></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{irodoriActivities.map((source) => <article key={source.id} className="flex min-h-64 flex-col rounded-xl border border-[#3f3427] bg-[#211d18]/55 p-4"><div><p className="eyebrow text-[10px]">{source.level} · {source.course ?? "Irodori"} · {source.lesson ?? "lesson"}</p><h3 className="mt-2 text-lg font-medium text-[#f5f5f2]">{source.title ?? source.name}</h3><p className="mt-2 text-sm leading-6 text-[#e5b85c]">{source.canDo ?? source.description}</p><p className="mt-3 text-xs leading-5 text-[#9297a1]">{source.resourceTypes.join(" · ")} · provider-hosted</p></div><div className="mt-auto pt-5"><ExternalSourceViewer source={source} /><details className="mt-3 text-[11px] text-[#676c75]"><summary className="cursor-pointer">ⓘ Source</summary><p className="mt-2 leading-5">{source.attribution} · {source.license}</p></details></div></article>)}</div></section> : null}
    {mode === "listen" || mode === "shadow" ? <section className="surface-panel p-6 sm:p-9"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{mode === "shadow" ? "まねる · Shadow" : "聞く · For you"}</p><h2 className="mt-1 text-2xl font-medium">{mode === "shadow" ? "Speak along with the scene." : "Hear Japanese where it lives."}</h2><p className="mt-2 text-sm text-[#9297a1]">{mode === "shadow" ? "Listen, shadow, then speak alone. Support stays available when you need it." : "Start with a clip selected from your current knowledge and recent signals."}</p></div><span className="text-xs text-[#9297a1]">{clips.length} activities</span></div>{clips.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{clips.map((clip, index) => { const metadata = getListeningClipMetadata(clip, itemMap, known); return <button key={clip.id} type="button" onClick={() => setSelectedClipId(clip.id)} className={`${index === 0 ? "sm:col-span-2 lg:col-span-2" : ""} border-l border-[#e5b85c] pl-4 text-left hover:border-[#f1cf7c]`}><p className="eyebrow text-[10px]">{metadata.context} · {metadata.naturalness} speech</p><p className="mt-2 text-xl font-medium text-[#f5f5f2]">{clip.title}</p><p className="mt-2 text-sm text-[#9297a1]">{metadata.source} · {metadata.level} · {coverageLabel(Math.max(metadata.vocabularyCoverage, metadata.grammarCoverage))}</p><p className="mt-3 text-xs text-[#e5b85c]">{mode === "shadow" ? "Shadow this clip →" : index === 0 ? "Recommended for you →" : "Open activity →"}</p></button>; })}</div> : <p className="mt-6 text-sm text-[#9297a1]">No listening activities are ready yet. Try a short reading or a source detour.</p>}</section> : null}
  </div>;
}

function SourceCard({ source, opened }: Readonly<{ source: ExternalSourceLink; opened: boolean }>) {
  return <article className="border-l border-white/15 pl-4"><p className="text-lg font-medium text-[#f5f5f2]">{source.title ?? source.name}</p><p className="mt-1 text-xs uppercase tracking-[.1em] text-[#676c75]">{source.name}{source.level ? ` · ${source.level}` : ""}</p><p className="mt-3 text-sm leading-6 text-[#9297a1]">{source.description}</p><div className="mt-4 flex flex-wrap items-center gap-2"><ExternalSourceViewer source={source} /><span className="text-[11px] text-[#676c75]">{opened ? "Opened" : "Provider-hosted"}</span></div></article>;
}
