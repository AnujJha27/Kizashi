"use client";

import { useEffect, useMemo, useState } from "react";

import coverage from "@/data/grammar-coverage-union.json";
import { getContentReviewStatus, isActivePracticeQuestion } from "@/lib/content-validation";
import { readContentFlags } from "@/lib/content-flags.js";
import type { N5Module } from "@/lib/types";

const levels = ["N5", "N4"] as const;

function Status({ value }: Readonly<{ value: string }>) {
  const color = value === "complete" ? "text-[#8bcca6]" : value === "partial" ? "text-[#e5b85c]" : "text-[#ef675d]";
  return <span className={`text-[10px] uppercase tracking-[.12em] ${color}`}>{value}</span>;
}

function grammarLiveStats(level: (typeof levels)[number], module: N5Module, flags: ReturnType<typeof readContentFlags>) {
  const itemById = new Map(module.grammar.filter((item) => item.jlptLevel === level).map((item) => [item.id, item]));
  const canonical = coverage.canonical.filter((item) => item.level === level).flatMap((item) => {
    const record = itemById.get(item.id);
    return record ? [record] : [];
  });
  const usable = canonical.filter((item) => getContentReviewStatus(item) !== "rejected");
  return {
    available: usable.length,
    rejected: canonical.length - usable.length,
    reviewed: usable.filter((item) => getContentReviewStatus(item) === "approved" || flags[item.id]?.status === "reviewed").length,
    provisional: usable.filter((item) => getContentReviewStatus(item) === "pending").length,
    flagged: usable.filter((item) => flags[item.id]?.status === "flagged").length,
    textGrammar: (module.practiceQuestions ?? []).filter((question) => question.category === "grammar" && question.jlptLevel === level && question.questionType === "text grammar" && isActivePracticeQuestion(question)).length,
  };
}

function StaticGrammarCoverage() {
  return <section className="mb-7 rounded-xl border border-[#5d4c2c] bg-[#211d18]/55 p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="eyebrow">Grammar coverage union</p><h2 className="mt-1 text-lg font-medium text-[#f5f5f2]">Coverage evidence, not fake completeness.</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[#9297a1]">Canonical concepts are compared with cached OpenJLPT, Irodori sentence patterns, reviewed Irodori mappings, Tae Kim, and Wikibooks evidence. Source rows stay review-only until a human maps and enriches them.</p></div><span className="text-[10px] uppercase tracking-[.12em] text-[#676c75]">Generated {coverage.generatedAt}</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{levels.map((level) => { const summary = coverage.summary[level]; return <div key={level} className="rounded-lg border border-white/10 bg-[#101b2b]/70 p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-[#f5f5f2]">{level}</span><span className="text-xs text-[#9297a1]">{summary.rawPatterns} raw · {summary.canonicalConcepts} canonical</span></div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><div><p className="text-lg text-[#8bcca6]">{summary.complete}</p><p className="text-[10px] text-[#676c75]">complete</p></div><div><p className="text-lg text-[#e5b85c]">{summary.partial}</p><p className="text-[10px] text-[#676c75]">partial</p></div><div><p className="text-lg text-[#ef675d]">{summary.missing}</p><p className="text-[10px] text-[#676c75]">missing</p></div></div><p className="mt-3 text-[10px] text-[#9297a1]">{summary.unresolved} unresolved source patterns · {summary.levelDisagreements} level disagreements</p></div>; })}</div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#e5b85c]">Canonical review states</p><div className="mt-2 max-h-56 overflow-y-auto divide-y divide-white/10 pr-2">{coverage.canonical.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-2 text-xs"><span className="min-w-0 truncate text-[#c3c7ce]">{item.pattern}</span>{item.evidencePatterns.length ? <span className="min-w-0 truncate text-[10px] text-[#9297a1]" title={item.evidencePatterns.map((entry) => `${entry.sourceId}: ${entry.pattern}`).join(" · ")}>Sources: {item.evidencePatterns.map((entry) => `${entry.sourceId}: ${entry.pattern}`).join(" · ")}</span> : null}<span className="shrink-0"><Status value={item.status} /><span className="ml-2 text-[10px] text-[#676c75]">{item.evidenceCount} evidence · {item.sourceIds.join("/") || "no source"}</span>{item.levelDisagreements.length ? <span className="ml-2 text-[10px] text-[#ef675d]">{item.levelDisagreements.join("/")}</span> : null}</span></div>)}</div></div><div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#e5b85c]">Unresolved source patterns</p><div className="mt-2 max-h-56 overflow-y-auto divide-y divide-white/10 pr-2">{coverage.unresolved.map((item) => <div key={`${item.sourceId}-${item.recordId}`} className="flex items-center justify-between gap-3 py-2 text-xs"><span className="min-w-0 truncate text-[#c3c7ce]">{item.pattern}</span><span className="shrink-0 text-[10px] text-[#9297a1]">{item.sourceId} · {item.level ?? "unclassified"}</span></div>)}</div></div></div><p className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-4 text-[#676c75]">{coverage.aliasesMapped} aliases mapped · {coverage.duplicateFamiliesCollapsed} duplicate source families collapsed · {coverage.sources.find((source) => source.id === "irodori-sentence-patterns")?.references ?? 0} reviewed Irodori mappings · {coverage.sources.find((source) => source.id === "openjlpt")?.references ?? 0} curated OpenJLPT mappings · unresolved rows are coverage gaps, not learner lessons.</p></section>;
}

export function GrammarCoverage({ module }: Readonly<{ module: N5Module }>) {
  const [reviewVersion, setReviewVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setReviewVersion((value) => value + 1);
    window.addEventListener("michi-content-flagged-updated", refresh);
    return () => window.removeEventListener("michi-content-flagged-updated", refresh);
  }, []);
  const flags = useMemo(() => {
    void reviewVersion;
    return readContentFlags();
  }, [reviewVersion]);
  return <><section className="mb-7 rounded-xl border border-[#3f3427] bg-[#211d18]/55 p-4 sm:p-5"><p className="eyebrow">Live review status</p><p className="mt-1 text-xs leading-5 text-[#9297a1]">Canonical gaps stay separate from what the current learner package actually makes available.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{levels.map((level) => { const stats = grammarLiveStats(level, module, flags); return <div key={level} className="rounded-lg border border-white/10 bg-[#101b2b]/70 p-3"><p className="text-sm text-[#f5f5f2]">{level}</p><p className="mt-2 text-xs text-[#c3c7ce]">{stats.available} available · {stats.reviewed} reviewed · {stats.provisional} provisional · {stats.flagged} flagged · {stats.rejected} rejected</p><p className="mt-1 text-[10px] text-[#9297a1]">{coverage.summary[level].missing} canonical missing · {stats.textGrammar} text-grammar questions available</p></div>; })}</div></section><StaticGrammarCoverage /></>;
}
