"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { LazyPractice } from "@/components/practice/lazy-practice";
import { PracticeModeTabs } from "@/components/practice/practice-mode-tabs";
import type { PracticeMode, TargetLevel } from "@/lib/types";

type ModeEntry = { value: PracticeMode; label: string; jp: string };
type Selection = { mode: PracticeMode; duration: number; focus?: string; section: string; topic?: string; targetLevel: TargetLevel };

function fromHref(href: string, current: Selection): Selection {
  const params = new URL(href, window.location.origin).searchParams;
  const duration = Number(params.get("duration"));
  return { mode: (params.get("mode") as PracticeMode | null) ?? current.mode, duration: [2, 5, 10, 20, 30].includes(duration) ? duration : current.duration, focus: params.get("focus") ?? undefined, section: params.get("section") ?? "vocabulary", topic: params.get("topic") ?? undefined, targetLevel: params.get("level") === "N4" ? "N4" : "N5" };
}

function queryFor(selection: Selection) {
  const params = new URLSearchParams({ mode: selection.mode });
  if (selection.duration !== 5) params.set("duration", String(selection.duration));
  if (selection.focus) params.set("focus", selection.focus);
  if (selection.section !== "vocabulary") params.set("section", selection.section);
  if (selection.topic) params.set("topic", selection.topic);
  if (selection.targetLevel === "N4") params.set("level", "N4");
  return params.toString();
}

export function PracticePageClient({ modes, initial }: Readonly<{ modes: ModeEntry[]; initial: Selection }>) {
  const [selection, setSelection] = useState(initial);
  const [practiceSelection, setPracticeSelection] = useState(initial);
  const [switching, setSwitching] = useState(false);
  const switchToken = useRef(0);
  const pendingPracticeKey = useRef("");
  const navigate = (href: string) => {
    const next = fromHref(href, selection);
    window.history.replaceState({}, "", `/practice?${queryFor(next)}`);
    setSelection(next);
    setSwitching(true);
    const token = switchToken.current + 1;
    switchToken.current = token;
    pendingPracticeKey.current = `${next.targetLevel}:${next.mode}:${next.duration}:${next.focus ?? ""}:${next.section}:${next.topic ?? ""}`;
    setPracticeSelection(next);
    window.setTimeout(() => { if (switchToken.current === token) setSwitching(false); }, 12000);
  };
  const context = `${selection.targetLevel === "N4" ? "&level=N4" : ""}${selection.topic ? `&topic=${encodeURIComponent(selection.topic)}` : ""}`;
  const practiceKey = `${practiceSelection.targetLevel}:${practiceSelection.mode}:${practiceSelection.duration}:${practiceSelection.focus ?? ""}:${practiceSelection.section}:${practiceSelection.topic ?? ""}`;

  return <div className="mx-auto max-w-5xl" aria-busy={switching}>
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-3">Practice · JLPT {selection.targetLevel}</p><h1 className="jp-serif text-3xl tracking-tight text-[#f5f5f2] sm:text-4xl">小さく解いて、強くなる。</h1><p className="mt-2 max-w-xl text-sm text-[#9297a1]">Exam-shaped multiple-choice practice for a comfortable {selection.targetLevel} pass. Passage and dialogue drills live in Immersion.</p></div><div className="flex flex-wrap gap-3"><Link prefetch={false} href="/practice/kana" className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e5b85c]">Kana foundations <span aria-hidden="true">→</span></Link><Link prefetch={false} href="/practice/diagnostic" className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#f5f5f2] hover:border-[#e34a3f]">N5 diagnostic <span aria-hidden="true">→</span></Link><Link prefetch={false} href="/review" className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#9297a1] hover:border-[#e34a3f]">Review queue <span aria-hidden="true">→</span></Link></div></div>
    <PracticeModeTabs modes={modes} activeMode={selection.mode} activeTopic={selection.topic} targetLevel={selection.targetLevel} onNavigate={navigate} />
    {selection.topic ? <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#4b3a29] bg-[#211d18]/70 px-4 py-3 text-sm"><span>Topic focus · <span className="text-[#e5b85c]">{selection.topic.replace(/-/gu, " ")}</span></span><button type="button" onClick={() => navigate(`/practice?mode=${selection.mode}${selection.targetLevel === "N4" ? "&level=N4" : ""}`)} className="text-xs text-[#9297a1] hover:text-[#f5f5f2]">Clear focus</button></div> : null}
    {selection.mode === "section" ? <div className="mb-6 flex flex-wrap items-center gap-2"><span className="text-xs text-[#9297a1]">Section</span>{[["vocabulary", "Vocabulary + kanji"], ["grammar-reading", "Grammar + reading"], ["listening", "Listening"]].map(([value, label]) => <button key={value} type="button" onClick={() => navigate(`/practice?mode=section&section=${value}${context}`)} className={`rounded-lg px-3 py-2 text-xs ${selection.section === value ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{label}</button>)}</div> : selection.mode === "quick" ? <div className="mb-6 flex flex-wrap items-center gap-2"><span className="text-xs text-[#9297a1]">Session length</span>{[2, 5, 10, 20, 30].map((minutes) => <button key={minutes} type="button" onClick={() => navigate(`/practice?mode=quick&duration=${minutes}${context}`)} className={`rounded-lg px-3 py-2 text-xs ${selection.duration === minutes ? "bg-[#e5b85c] text-[#0b0b0d]" : "border border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c]"}`}>{minutes} min</button>)}</div> : null}
    <section className="surface-panel relative overflow-hidden p-7 sm:p-10"><LazyPractice key={practiceKey} mode={practiceSelection.mode} duration={practiceSelection.duration} focus={practiceSelection.focus} section={practiceSelection.mode === "section" ? practiceSelection.section : undefined} topic={practiceSelection.topic} targetLevel={practiceSelection.targetLevel} onReady={() => { if (pendingPracticeKey.current === practiceKey) { pendingPracticeKey.current = ""; setSwitching(false); } }} />{switching ? <div className="absolute inset-0 z-10 grid place-items-center bg-[#0d1522]/80 p-6 backdrop-blur-sm" role="status"><div className="rounded-xl border border-[#e5b85c]/60 bg-[#111216] px-5 py-4 text-center shadow-2xl"><p className="text-sm font-semibold text-[#f5f5f2]">Switching practice</p><p className="mt-1 text-xs text-[#9297a1]">Loading a fresh question set…</p></div></div> : null}</section>
  </div>;
}
