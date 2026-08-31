"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createAudioProvider, type AudioProvider } from "@/lib/audio";
import type { AudioMetadata } from "@/lib/types";

export function AudioControls({ text, externalUrl, metadata, preferredRate, autoPlay = false, className = "" }: Readonly<{ text?: string; externalUrl?: string | null; metadata?: AudioMetadata; preferredRate?: number; autoPlay?: boolean; className?: string }>) {
  const provider = useRef<AudioProvider | null>(null);
  const [message, setMessage] = useState("");
  const request = { text, externalUrl, metadata };
  const providerKey = externalUrl || metadata?.externalUrl || metadata?.sourceType || "browser-speech";
  const normalRate = preferredRate ?? metadata?.preferredRate ?? 0.9;
  const playAt = useCallback(async (rate: number) => {
    provider.current ??= createAudioProvider(request);
    const result = await provider.current.play(request, rate);
    setMessage(result.status === "played" ? "" : result.message ?? "Audio is unavailable.");
  }, [externalUrl, metadata, text]);

  useEffect(() => {
    provider.current?.stop();
    provider.current = null;
  }, [providerKey]);

  useEffect(() => {
    if (autoPlay) void playAt(normalRate);
    return () => provider.current?.stop();
  }, [autoPlay, normalRate, playAt]);

  if (!text && !externalUrl && !metadata?.externalUrl) return null;
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}><button type="button" onClick={() => void playAt(normalRate)} className="rounded-lg border border-[#4f9ac0] bg-[#102536]/70 px-3 py-2 text-xs font-semibold text-[#d9eef8] hover:border-[#8cc9e5]" aria-label="Play Japanese audio">Play</button><button type="button" onClick={() => void playAt(normalRate)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#8cc9e5]" aria-label="Replay Japanese audio">Replay</button><button type="button" onClick={() => void playAt(0.6)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#8cc9e5]" aria-label="Play Japanese audio slowly">Slow</button>{message ? <span role="status" className="basis-full text-xs text-[#ef675d]">{message}</span> : null}</div>;
}
