"use client";

import { useEffect, useState } from "react";

import entries from "@/data/source-maps/tadoku.json";
import { AudioControls } from "@/components/learning/audio-controls";
import { ExternalSourceFrame, ExternalSourceViewer } from "@/components/learning/external-source-viewer";
import { markExternalSourceOpened, readExternalSourceProgress } from "@/lib/external-source-progress.js";
import type { ExternalSourceLink } from "@/components/learning/external-source-launcher";

function sourceFor(entry: (typeof entries)[number]): ExternalSourceLink {
  return { id: entry.id, sourceId: entry.sourceId, name: "Tadoku", title: entry.title, level: entry.level, context: entry.genre, resourceTypes: ["graded reader", ...(entry.audio.available ? ["audio"] : [])], mediaDelivery: "frame-or-link", description: "Read the unchanged original at Tadoku.", url: entry.url, license: entry.license, attribution: entry.attribution };
}

export function TadokuShelf() {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => setProgress(readExternalSourceProgress());
    refresh();
    window.addEventListener("michi-source-progress-updated", refresh);
    return () => window.removeEventListener("michi-source-progress-updated", refresh);
  }, []);

  const selectedEntry = entries.find((entry) => entry.id === selectedId);
  return <section className="mx-auto mt-6 max-w-5xl rounded-xl border border-white/10 bg-[#101b2b]/55 p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">読む · 多読</p><h2 className="mt-1 text-2xl font-medium text-[#f5f5f2]">Beginner graded reading</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9297a1]">Read the original Tadoku books at the source. Start easy, keep moving, and use the audio when it is available.</p></div><span className="text-xs text-[#9297a1]">Opened · {entries.filter((entry) => progress[entry.id]).length} / {entries.length}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{entries.map((entry) => { const source = sourceFor(entry); return <article key={entry.id} className="rounded-xl border border-white/10 bg-[#17181d]/75 p-4"><p className="text-sm font-medium text-[#f5f5f2]">{entry.title}</p><p className="mt-1 text-xs uppercase tracking-[.12em] text-[#e5b85c]">{entry.level} · {entry.genre}</p><p className="mt-2 text-xs text-[#9297a1]">{entry.length}{entry.audio.available ? " · audio available" : ""}</p>{progress[entry.id] ? <p className="mt-2 text-[11px] text-[#8bcca6]">✓ Opened at Tadoku</p> : null}<AudioControls text={entry.title} externalUrl={entry.audio.url} className="mt-3" /><ExternalSourceViewer source={source} open={selectedId === entry.id} onToggle={() => { markExternalSourceOpened(entry.id); setProgress((value) => ({ ...value, [entry.id]: true })); setSelectedId((value) => value === entry.id ? null : entry.id); }} /><details className="mt-3 text-[11px] text-[#676c75]"><summary className="cursor-pointer">ⓘ Source</summary><p className="mt-2 leading-5">{entry.attribution} · {entry.license}</p></details></article>; })}</div>{selectedEntry ? <ExternalSourceFrame source={sourceFor(selectedEntry)} /> : null}</section>;
}
