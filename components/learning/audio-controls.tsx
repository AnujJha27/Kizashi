"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createAudioProvider, playAudioWithBrowserFallback, resolveHumanAudio, type AudioProvider } from "@/lib/audio";
import type { AudioMetadata } from "@/lib/types";

export function AudioControls({ text, reading, externalUrl, metadata, preferredRate, autoPlay = false, humanFirst = false, className = "" }: Readonly<{ text?: string; reading?: string; externalUrl?: string | null; metadata?: AudioMetadata; preferredRate?: number; autoPlay?: boolean; humanFirst?: boolean; className?: string }>) {
  const provider = useRef<AudioProvider | null>(null);
  const resolvedRequest = useRef<Awaited<ReturnType<typeof resolveHumanAudio>> | null>(null);
  const [message, setMessage] = useState("");
  const [sourceInfo, setSourceInfo] = useState<{ label: string; filePage?: string; attribution?: string; license?: string } | null>(null);
  const request = { text, externalUrl, metadata };
  const providerKey = `${externalUrl || metadata?.externalUrl || metadata?.sourceType || "browser-speech"}|${text || ""}|${reading || ""}|${humanFirst}`;
  const normalRate = preferredRate ?? metadata?.preferredRate ?? 0.9;
  const playAt = useCallback(async (rate: number) => {
    const playableRequest = resolvedRequest.current ?? await resolveHumanAudio(request, humanFirst ? reading : undefined);
    resolvedRequest.current = playableRequest;
    provider.current ??= createAudioProvider(playableRequest);
    const playback = await playAudioWithBrowserFallback(provider.current, playableRequest, rate);
    provider.current = playback.provider;
    const result = playback.result;
    const provenance = playableRequest.metadata?.provenance ?? {};
    const sourceId = typeof provenance?.sourceId === "string" ? provenance.sourceId : "";
    setSourceInfo(sourceId === "wikimedia-commons" ? {
      label: provenance?.collection === "lingua-libre" ? "Human recording · Lingua Libre" : "Human recording · Wikimedia Commons",
      filePage: typeof provenance.sourceUrl === "string" ? provenance.sourceUrl : undefined,
      attribution: typeof provenance.attribution === "string" ? provenance.attribution : undefined,
      license: typeof playableRequest.metadata?.license === "string" ? playableRequest.metadata.license : undefined,
    } : null);
    setMessage(result.status === "played" ? "" : result.message ?? "Audio is unavailable.");
  }, [externalUrl, humanFirst, metadata, reading, text]);

  useEffect(() => {
    provider.current?.stop();
    provider.current = null;
    resolvedRequest.current = null;
    setSourceInfo(null);
  }, [providerKey]);

  useEffect(() => {
    if (autoPlay) void playAt(normalRate);
    return () => provider.current?.stop();
  }, [autoPlay, normalRate, playAt]);

  if (!text && !externalUrl && !metadata?.externalUrl) return null;
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}><button type="button" onClick={() => void playAt(normalRate)} className="rounded-lg border border-[#4f9ac0] bg-[#102536]/70 px-3 py-2 text-xs font-semibold text-[#d9eef8] hover:border-[#8cc9e5]" aria-label="Play Japanese audio">Play</button><button type="button" onClick={() => void playAt(normalRate)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#8cc9e5]" aria-label="Replay Japanese audio">Replay</button><button type="button" onClick={() => void playAt(0.6)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#8cc9e5]" aria-label="Play Japanese audio slowly">Slow</button>{sourceInfo ? <details className="text-xs text-[#9297a1]"><summary className="cursor-pointer text-[#e5b85c]">{sourceInfo.label} ⓘ</summary><p className="mt-1 max-w-xs leading-5">{sourceInfo.attribution}{sourceInfo.license ? ` · ${sourceInfo.license}` : ""}{sourceInfo.filePage ? <> · <a href={sourceInfo.filePage} target="_blank" rel="noreferrer" className="text-[#e5b85c]">Source file ↗</a></> : null}</p></details> : null}{message ? <span role="status" className="basis-full text-xs text-[#ef675d]">{message}</span> : null}</div>;
}
