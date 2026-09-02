"use client";

import { useEffect, useRef, useState } from "react";

import entries from "@/data/source-maps/aozora.json";
import { JapaneseText } from "@/components/learning/japanese-text";
import { ExternalSourceViewer } from "@/components/learning/external-source-viewer";
import type { ExternalSourceLink } from "@/components/learning/external-source-launcher";
import { estimateAozoraDifficulty, type AozoraEstimate } from "@/lib/sources/aozora";
import { n5Module } from "@/lib/curriculum";
import { markExternalSourceOpened, readExternalSourceProgress } from "@/lib/external-source-progress.js";

type Entry = (typeof entries)[number];
const stateKey = (id: string) => `michi.aozora.reader:${id}`;

function sourceFor(entry: Entry): ExternalSourceLink {
  return { id: entry.id, sourceId: entry.sourceId, name: "Aozora Bunko", title: entry.title, level: "Native reading", context: entry.author, resourceTypes: ["native reading"], mediaDelivery: "frame-or-link", description: "Open the original Aozora work.", url: entry.cardUrl, license: entry.license, attribution: entry.attribution };
}

export function AozoraShelf() {
  const entry = entries[0];
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [text, setText] = useState("");
  const [estimate, setEstimate] = useState<AozoraEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fontSize, setFontSize] = useState(20);
  const reader = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => setProgress(readExternalSourceProgress());
    refresh();
    window.addEventListener("michi-source-progress-updated", refresh);
    return () => window.removeEventListener("michi-source-progress-updated", refresh);
  }, []);

  useEffect(() => {
    if (!text) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(stateKey(entry.id)) ?? "null") as { position?: number; fontSize?: number } | null;
      if (saved?.fontSize && saved.fontSize >= 16 && saved.fontSize <= 32) setFontSize(saved.fontSize);
      if (reader.current && typeof saved?.position === "number") reader.current.scrollTop = saved.position;
    } catch { /* local state is optional */ }
  }, [entry.id, text]);

  const savePosition = () => {
    if (!reader.current) return;
    window.localStorage.setItem(stateKey(entry.id), JSON.stringify({ position: reader.current.scrollTop, fontSize }));
  };

  const read = async () => {
    setLoading(true);
    setError("");
    markExternalSourceOpened(entry.id);
    try {
      const response = await fetch(`/api/reading/aozora?workId=${entry.workId}`);
      const payload = await response.json() as { text?: string; error?: string };
      if (!response.ok || !payload.text) throw new Error(payload.error || "The Aozora text could not be loaded.");
      setText(payload.text);
      setEstimate(estimateAozoraDifficulty(payload.text, { vocabulary: n5Module.vocabulary, kanji: n5Module.kanji }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The Aozora text could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const source = sourceFor(entry);
  return <section className="mx-auto mt-6 max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-[#101b2b]/55 p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">読む · 青空文庫</p><h2 className="mt-1 text-2xl font-medium text-[#f5f5f2]">Native reading</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#9297a1]">Long-form Japanese for later immersion. Estimates come from the original text and your current known items.</p></div><span className="text-xs text-[#9297a1]">Opened · {progress[entry.id] ? "1" : "0"} / 1</span></div><article className="mt-5 flex flex-col rounded-xl border border-white/10 bg-[#17181d]/75 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="jp-serif text-2xl text-[#f5f5f2]">{entry.title}</h3><p className="mt-1 text-sm text-[#9297a1]">{entry.author} · {entry.orthography}</p></div><span className="rounded-full border border-[#3f4652] px-2 py-1 text-[10px] uppercase tracking-[.12em] text-[#e5b85c]">Native difficulty · {estimate?.difficultyBand ?? "high"}</span></div><p className="mt-3 text-xs leading-5 text-[#9297a1]">{estimate ? `Estimated known vocabulary · ${Math.round(estimate.vocabularyCoverage * 100)}% · known kanji · ${Math.round(estimate.kanjiCoverage * 100)}% · ${estimate.characterCount.toLocaleString()} characters · ${estimate.averageSentenceLength.toFixed(1)} chars/sentence` : "Estimated vocabulary and kanji coverage appears after opening the work."}</p><div className="mt-auto flex flex-wrap items-center gap-2 pt-5"><button type="button" onClick={read} disabled={loading} className="rounded-lg bg-[#e5b85c] px-4 py-2 text-xs font-semibold text-[#0b0b0d] disabled:opacity-60">{loading ? "Loading…" : text ? "Reload text" : "Read"}</button><ExternalSourceViewer source={source} /><details className="text-[11px] text-[#676c75]"><summary className="cursor-pointer">ⓘ Source</summary><p className="mt-2 leading-5">{entry.attribution} · {entry.license}</p></details></div>{error ? <div className="mt-4 rounded-lg border border-[#713b37]/70 bg-[#21191a]/60 p-3 text-sm text-[#d7b1a4]" role="alert">{error} Try again or open the original source above.</div> : null}{text ? <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#101b2b]/70"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2"><p className="eyebrow">Original text · estimated reading support</p><p className="text-[11px] text-[#676c75]">Resume saved locally</p><div className="flex gap-1"><button type="button" onClick={() => { const next = Math.max(16, fontSize - 2); setFontSize(next); window.localStorage.setItem(stateKey(entry.id), JSON.stringify({ position: reader.current?.scrollTop ?? 0, fontSize: next })); }} className="rounded border border-[#3f4652] px-2 py-1 text-xs" aria-label="Decrease font size">A−</button><button type="button" onClick={() => { const next = Math.min(32, fontSize + 2); setFontSize(next); window.localStorage.setItem(stateKey(entry.id), JSON.stringify({ position: reader.current?.scrollTop ?? 0, fontSize: next })); }} className="rounded border border-[#3f4652] px-2 py-1 text-xs" aria-label="Increase font size">A＋</button></div></div><div ref={reader} onScroll={savePosition} className="max-h-[70vh] overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-7" style={{ fontSize: `${fontSize}px`, lineHeight: 2 }}><JapaneseText text={text} vocabulary={n5Module.vocabulary} kanji={n5Module.kanji} className="jp-serif break-words whitespace-pre-wrap text-[#f5f5f2]" always /></div></div> : null}</article></section>;
}
