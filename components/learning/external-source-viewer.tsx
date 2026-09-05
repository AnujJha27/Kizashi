"use client";

import { useEffect, useState } from "react";

import { ExternalSourceLauncher, type ExternalSourceLink } from "@/components/learning/external-source-launcher";
import { canEmbedExternalSource, canPlayExternalSourceMedia } from "@/lib/external-resources";
import { markExternalSourceOpened } from "@/lib/external-source-progress.js";

export function ExternalSourceFrame({ source }: Readonly<{ source: ExternalSourceLink }>) {
  const canFrame = canEmbedExternalSource(source.mediaDelivery);
  const mediaUrl = canPlayExternalSourceMedia(source.mediaDelivery) ? source.mediaUrl : undefined;
  return <div className="mt-3 w-full overflow-hidden rounded-xl border border-[#3f4652] bg-[#0b0b0d]">{mediaUrl ? <video title={`${source.name} original video`} controls playsInline preload="metadata" poster={source.posterUrl} className="max-h-[48rem] w-full bg-black"><source src={mediaUrl} type="video/mp4" />Your browser does not support video playback.</video> : null}{mediaUrl ? <p className="border-t border-white/10 px-3 py-2 text-[11px] uppercase tracking-[.1em] text-[#676c75]">Lesson page</p> : null}<p className="border-b border-white/10 bg-[#101b2b]/80 px-3 py-2 text-[11px] leading-5 text-[#c3c7ce]">{canFrame ? <>Provider-hosted frame. If this panel is blank, the provider is blocking embedding or needs a login; use <a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Open original source ↗</a>.</> : <>This source is available on its original provider page; use <a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-[#e5b85c] hover:text-[#f1cf7c]">Open original source ↗</a>.</>}</p>{canFrame ? <iframe title={`${source.name} original source`} src={source.frameUrl ?? source.url} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen className="h-[70vh] min-h-[20rem] max-h-[40rem] w-full border-0" /> : null}<p className="border-t border-white/10 px-3 py-2 text-[11px] leading-5 text-[#9297a1]">{mediaUrl ? "Streaming the provider's original media directly; the lesson page remains below. Kizashi does not store or proxy it." : "This view does not copy, proxy, cache, mirror, or upload the source."}</p></div>;
}

export function ExternalSourceViewer({ source, open, onToggle }: Readonly<{ source: ExternalSourceLink; open?: boolean; onToggle?: () => void }>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : internalOpen;
  const canRender = canEmbedExternalSource(source.mediaDelivery) || (canPlayExternalSourceMedia(source.mediaDelivery) && Boolean(source.mediaUrl));
  const toggle = () => {
    markExternalSourceOpened(source.id);
    if (!controlled) setInternalOpen((value) => !value);
    onToggle?.();
  };
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") toggle(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);
  return <div><div className="flex flex-wrap items-center gap-2">{canRender ? <button type="button" onClick={toggle} aria-expanded={isOpen} className="rounded-lg bg-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#0b0b0d] hover:bg-[#f1cf7c]">{isOpen ? "Close frame" : "View here"}</button> : null}<ExternalSourceLauncher source={source} /></div>{isOpen && canRender ? <div role="dialog" aria-modal="true" aria-label={`${source.name} source viewer`} className="fixed inset-0 z-50 flex items-center justify-center bg-[#05080d]/75 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) toggle(); }}><div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#3f4652] bg-[#101b2b] shadow-2xl sm:max-h-[calc(100vh-3rem)]"><div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><div><p className="eyebrow">Source viewer</p><p className="mt-1 text-sm font-medium text-[#f5f5f2]">{source.title ?? source.name}</p></div><button type="button" onClick={toggle} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#e5b85c]" aria-label="Close source viewer">Close</button></div><div className="min-h-0 overflow-y-auto p-3 sm:p-4"><ExternalSourceFrame source={source} /></div></div></div> : null}</div>;
}
