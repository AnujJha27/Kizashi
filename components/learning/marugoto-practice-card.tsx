"use client";

import { useState } from "react";

import { ExternalSourceViewer } from "@/components/learning/external-source-viewer";
import { externalResourceToSourceLink } from "@/components/learning/external-source-launcher";
import { getExternalResourceById } from "@/lib/external-resources";
import { markExternalSourceOpened } from "@/lib/external-source-progress.js";

const resource = getExternalResourceById("marugoto-plus");

export function MarugotoPracticeCard({ itemIds = [] }: Readonly<{ itemIds?: readonly string[] }>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!resource || !resource.targetItemIds?.some((itemId) => itemIds.includes(itemId))) return null;
  const source = externalResourceToSourceLink(resource);
  const selectedEntry = source.catalog?.find((entry) => entry.id === selectedId);
  const selectedSource = selectedEntry ? { ...source, id: `${source.id}:${selectedEntry.id}`, title: selectedEntry.title, url: selectedEntry.url, frameUrl: selectedEntry.url } : source;
  return <section className="mt-6 rounded-xl border border-[#3f3427] bg-[#211d18]/65 p-5"><p className="eyebrow">Another way to practise · 別の練習</p><h2 className="mt-2 text-lg font-medium text-[#f5f5f2]">Marugoto Plus</h2><p className="mt-1 text-sm text-[#e5b85c]">{source.context ?? "Can-do conversations and everyday Japanese"}</p><p className="mt-2 text-sm leading-6 text-[#9297a1]">Continue this lesson with provider-hosted conversation, listening, pronunciation, and culture activities. Marugoto&apos;s source level is separate from Kizashi&apos;s JLPT path.</p>{source.catalog?.length ? <div className="mt-4 rounded-xl border border-white/10 bg-[#101b2b]/45 p-3"><p className="eyebrow">Mapped activities · {source.catalog.length}</p><ul className="mt-2 divide-y divide-white/10">{source.catalog.map((entry) => <li key={entry.id} className="py-2 first:pt-0 last:pb-0"><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => { markExternalSourceOpened(source.id); markExternalSourceOpened(`${source.id}:${entry.id}`); setSelectedId((value) => value === entry.id ? null : entry.id); }} aria-expanded={selectedId === entry.id} className="text-left text-sm font-medium text-[#e5b85c] hover:text-[#f1cf7c]">{selectedId === entry.id ? "Close iframe · " : "View in iframe · "}{entry.title}</button><a href={entry.url} target="_blank" rel="noreferrer" onClick={() => { markExternalSourceOpened(source.id); markExternalSourceOpened(`${source.id}:${entry.id}`); }} className="text-[11px] text-[#9297a1] hover:text-[#f1cf7c]">Open original ↗</a></div><p className="mt-1 text-[11px] leading-4 text-[#9297a1]">{entry.topic} · {entry.activityType} · {entry.sourceLevel ?? source.level ?? "provider"}</p><p className="mt-1 text-[10px] leading-4 text-[#676c75]">{entry.jlptRelevance} · {entry.audioAvailable ? "audio" : entry.videoAvailable ? "video" : "provider page"}</p></li>)}</ul></div> : null}<div className="mt-4">{selectedEntry ? <ExternalSourceViewer source={selectedSource} open onToggle={() => setSelectedId(null)} /> : <ExternalSourceViewer source={source} />}</div><details className="mt-3 text-[11px] text-[#676c75]"><summary className="cursor-pointer">ⓘ Source</summary><p className="mt-2 leading-5">Japan Foundation Marugoto · provider-hosted source material · <a href={source.url} target="_blank" rel="noreferrer" className="text-[#e5b85c]">source page ↗</a></p></details></section>;
}
