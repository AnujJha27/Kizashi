"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createAudioProvider, playAudioWithBrowserFallback, resolveHumanAudio, type AudioProvider } from "@/lib/audio";
import type { AudioMetadata } from "@/lib/types";

export function AudioControls({ text, reading, externalUrl, metadata, preferredRate, autoPlay = false, humanFirst = false, className = "" }: Readonly<{ text?: string; reading?: string; externalUrl?: string | null; metadata?: AudioMetadata; preferredRate?: number; autoPlay?: boolean; humanFirst?: boolean; className?: string }>) {
  const provider = useRef<AudioProvider | null>(null);
  const resolvedRequest = useRef<Awaited<ReturnType<typeof resolveHumanAudio>> | null>(null);
  const [message, setMessage] = useState("");
  const request = { text, externalUrl, metadata };
  const providerKey = externalUrl || metadata?.externalUrl || metadata?.sourceType || "browser-speech";
  const normalRate = preferredRate ?? metadata?.preferredRate ?? 0.9;
  const playAt = useCallback(async (rate: number) => {
    const playableRequest = resolvedRequest.current ?? await resolveHumanAudio(request, humanFirst ? reading : undefined);
    resolvedRequest.current = playableRequest;
    provider.current ??= createAudioProvider(playableRequest);
    const playback = await playAudioWithBrowserFallback(provider.current, playableRequest, rate);
    provider.current = playback.provider;
    const result = playback.result;
    setMessage(result.status === "played" ? "" : result.message ?? "Audio is unavailable.");
  }, [externalUrl, humanFirst, metadata, reading, text]);

  useEffect(() => {
    provider.current?.stop();
    provider.current = null;
    resolvedRequest.current = null;
  }, [providerKey]);

  useEffect(() => {
    if (autoPlay) void playAt(normalRate);
    return () => provider.current?.stop();
  }, [autoPlay, normalRate, playAt]);

  if (!text && !externalUrl && !metadata?.externalUrl) return null;
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}><button type="button" onClick={() => void playAt(normalRate)} className="rounded-lg border border-[#4f9ac0] bg-[#102536]/70 px-3 py-2 text-xs font-semibold text-[#d9eef8] hover:border-[#8cc9e5]" aria-label="Play Japanese audio">Play</button><button type="button" onClick={() => void playAt(normalRate)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#8cc9e5]" aria-label="Replay Japanese audio">Replay</button><button type="button" onClick={() => void playAt(0.6)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#8cc9e5]" aria-label="Play Japanese audio slowly">Slow</button>{message ? <span role="status" className="basis-full text-xs text-[#ef675d]">{message}</span> : null}</div>;
}
