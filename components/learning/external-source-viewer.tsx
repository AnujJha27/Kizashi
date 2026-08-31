"use client";

import { useState } from "react";

import { ExternalSourceLauncher, type ExternalSourceLink } from "@/components/learning/external-source-launcher";

export function ExternalSourceFrame({ source }: Readonly<{ source: ExternalSourceLink }>) {
  return <div className="mt-3 w-full overflow-hidden rounded-xl border border-[#3f4652] bg-[#0b0b0d]"><iframe title={`${source.name} original source`} src={source.url} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen className="h-[70vh] min-h-[34rem] max-h-[48rem] w-full border-0" /><p className="border-t border-white/10 px-3 py-2 text-[11px] leading-5 text-[#9297a1]">If the provider blocks framing or requires a login, use <a href={source.url} target="_blank" rel="noreferrer" className="text-[#e5b85c] hover:text-[#f1cf7c]">Open original source ↗</a>. This view does not copy, proxy, cache, or upload the source.</p></div>;
}

export function ExternalSourceViewer({ source, open, onToggle }: Readonly<{ source: ExternalSourceLink; open?: boolean; onToggle?: () => void }>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : internalOpen;
  const toggle = () => {
    if (!controlled) setInternalOpen((value) => !value);
    onToggle?.();
  };
  return <div className="mt-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={toggle} aria-expanded={isOpen} className="rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d] hover:bg-[#f1cf7c]">{isOpen ? "Close frame" : "View here"}</button><ExternalSourceLauncher source={source} /></div>{!controlled && isOpen ? <ExternalSourceFrame source={source} /> : null}</div>;
}
