"use client";

import { useState } from "react";

import { ExternalSourceLauncher, type ExternalSourceLink } from "@/components/learning/external-source-launcher";

export function ExternalSourceFrame({ source }: Readonly<{ source: ExternalSourceLink }>) {
  return <div className="mt-3 w-full overflow-hidden rounded-xl border border-[#3f4652] bg-[#0b0b0d]">{source.mediaUrl ? <video title={`${source.name} original video`} controls playsInline preload="metadata" poster={source.posterUrl} className="max-h-[48rem] w-full bg-black"><source src={source.mediaUrl} type="video/mp4" />Your browser does not support video playback.</video> : null}{source.mediaUrl ? <p className="border-t border-white/10 px-3 py-2 text-[11px] uppercase tracking-[.1em] text-[#676c75]">Lesson page</p> : null}<iframe title={`${source.name} original source`} src={source.url} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen className="h-[70vh] min-h-[34rem] max-h-[48rem] w-full border-0" /><p className="border-t border-white/10 px-3 py-2 text-[11px] leading-5 text-[#9297a1]">{source.mediaUrl ? "Streaming the provider's original media directly; the lesson page remains below. Kizashi does not store or proxy it." : "If the provider blocks framing or requires a login, use "}<a href={source.url} target="_blank" rel="noreferrer" className="text-[#e5b85c] hover:text-[#f1cf7c]">Open original source ↗</a>{source.mediaUrl ? "." : ". This view does not copy, proxy, cache, mirror, or upload the source."}</p></div>;
}

export function ExternalSourceViewer({ source, open, onToggle }: Readonly<{ source: ExternalSourceLink; open?: boolean; onToggle?: () => void }>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : internalOpen;
  const toggle = () => {
    if (!controlled) setInternalOpen((value) => !value);
    onToggle?.();
  };
  return <div className="mt-4"><div className="flex flex-wrap items-center gap-2">{source.mediaDelivery === "link-only" ? <p className="text-xs text-[#9297a1]">This provider does not allow in-app framing.</p> : <button type="button" onClick={toggle} aria-expanded={isOpen} className="rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d] hover:bg-[#f1cf7c]">{isOpen ? "Close frame" : "View here"}</button>}<ExternalSourceLauncher source={source} /></div>{!controlled && isOpen ? <ExternalSourceFrame source={source} /> : null}</div>;
}
