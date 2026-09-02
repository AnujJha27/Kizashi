"use client";

import { useState } from "react";

import taeKim from "@/data/source-maps/tae-kim.json";
import wikibooks from "@/data/source-maps/wikibooks.json";
import irodori from "@/data/source-maps/irodori-grammar.json";

type Reference = {
  sourceId: string;
  sectionTitle: string;
  url: string;
  relationship: string;
  description: string;
  license: string;
  attribution: string;
  page?: string;
  sourceRecordId?: string;
  sourceCourse?: string;
  sourceLevel?: string;
  sourceUrl?: string;
};

const taeKimById = taeKim as Record<string, Reference>;
const wikibooksById = wikibooks as Record<string, Reference>;
const irodoriById = irodori as Record<string, Reference[]>;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function grammarReferencesFor(grammarId: string) {
  return [taeKimById[grammarId], wikibooksById[grammarId], ...(irodoriById[grammarId] ?? []).slice(0, 2)].filter((reference): reference is Reference => Boolean(reference));
}

function sourceLabel(reference: Reference) {
  if (reference.sourceId === "tae-kim") return "Tae Kim";
  if (reference.sourceId === "wikibooks-japanese") return "Wikibooks · Japanese";
  return `Irodori · ${reference.sourceCourse || reference.sourceLevel || "practical pattern"}`;
}

function Preview({ reference }: Readonly<{ reference: Reference }>) {
  const [state, setState] = useState<{ status: "idle" | "loading" | "ready" | "error"; text?: string; links?: { label: string; url: string }[] }>({ status: "idle" });

  async function load() {
    if (!reference.page || state.status === "loading" || state.status === "ready") return;
    setState({ status: "loading" });
    try {
      const params = new URLSearchParams({ page: reference.page, section: reference.sectionTitle });
      const response = await fetch(`/api/reference/wikibooks?${params.toString()}`);
      const payload: unknown = await response.json();
      const result = record(payload) && record(payload.result) ? payload.result : null;
      if (!response.ok || !result || typeof result.text !== "string") throw new Error("Reference unavailable");
      setState({ status: "ready", text: result.text, links: Array.isArray(result.links) ? result.links as { label: string; url: string }[] : [] });
    } catch {
      setState({ status: "error" });
    }
  }

  return <div className="mt-3"><button type="button" onClick={() => void load()} disabled={state.status === "loading"} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c] disabled:opacity-60">{state.status === "loading" ? "Loading…" : state.status === "ready" ? "Loaded" : "Preview reference"}</button>{state.status === "error" ? <p role="status" className="mt-2 text-xs text-[#ef675d]">Wikibooks is unavailable; the Kizashi explanation still works.</p> : null}{state.status === "ready" ? <div className="mt-3 rounded-lg border border-white/10 bg-[#101b2b]/70 p-3"><p className="text-xs leading-6 text-[#c3c7ce]">{state.text}</p>{state.links?.length ? <div className="mt-2 flex flex-wrap gap-2">{state.links.map((link) => <a key={`${link.url}-${link.label}`} href={link.url} target="_blank" rel="noreferrer" className="text-xs text-[#e5b85c] hover:text-[#f1cf7c]">{link.label} ↗</a>)}</div> : null}</div> : null}</div>;
}

export function SourceReferencePanel({ grammarId }: Readonly<{ grammarId: string }>) {
  const references = grammarReferencesFor(grammarId);
  if (!references.length) return null;
  return <section className="mt-8 border-t border-[#4b3a29] pt-5"><p className="eyebrow">別の見方 · Alternative explanations</p><div className="mt-3 divide-y divide-white/10">{references.map((reference) => <article key={`${reference.sourceId}-${reference.sectionTitle}-${reference.sourceRecordId ?? ""}`} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-sm font-medium text-[#f5f5f2]">{sourceLabel(reference)}</p><p className="mt-1 text-xs text-[#e5b85c]">{reference.sectionTitle}</p><p className="mt-2 text-xs leading-5 text-[#9297a1]">{reference.description}</p></div><div className="shrink-0"><a href={reference.url} target="_blank" rel="noreferrer" className="inline-flex rounded-lg border border-[#3f4652] px-3 py-2 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c]">{reference.sourceId === "tae-kim" ? "Read explanation ↗" : reference.sourceId === "wikibooks-japanese" ? "Open reference ↗" : "Open Irodori ↗"}</a>{reference.sourceId === "wikibooks-japanese" ? <Preview reference={reference} /> : null}</div></div><details className="mt-3 text-[11px] text-[#676c75]"><summary className="cursor-pointer hover:text-[#c3c7ce]">ⓘ Source</summary><p className="mt-2 leading-5">{reference.attribution} · {reference.license}{reference.sourceUrl ? <> · <a href={reference.sourceUrl} target="_blank" rel="noreferrer" className="text-[#e5b85c]">source data ↗</a></> : null}</p></details></article>)}</div><p className="mt-3 text-[11px] text-[#676c75]">Kizashi's explanation and practice remain the primary lesson.</p></section>;
}
