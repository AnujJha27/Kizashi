"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { audioSourceInfo } from "@/lib/audio-core.js";
import { createAudioProvider, playAudioWithBrowserFallback, resolveHumanAudio, type AudioProvider } from "@/lib/audio";
import type { AudioMetadata } from "@/lib/types";

export function AudioControls({ text, reading, externalUrl, metadata, preferredRate, autoPlay = false, humanFirst = false, className = "" }: Readonly<{ text?: string; reading?: string; externalUrl?: string | null; metadata?: AudioMetadata; preferredRate?: number; autoPlay?: boolean; humanFirst?: boolean; className?: string }>) {
  const provider = useRef<AudioProvider | null>(null);
  const resolvedRequest = useRef<Awaited<ReturnType<typeof resolveHumanAudio>> | null>(null);
  const playbackId = useRef(0);
  const [message, setMessage] = useState("");
  const [playbackState, setPlaybackState] = useState<"idle" | "playing" | "paused">("idle");
  const [sourceInfo, setSourceInfo] = useState<{ label: string; filePage?: string; attribution?: string; license?: string } | null>(null);
  const request = { text, externalUrl, metadata };
  const providerKey = `${externalUrl || metadata?.externalUrl || metadata?.sourceType || "browser-speech"}|${text || ""}|${reading || ""}|${humanFirst}`;
  const normalRate = preferredRate ?? metadata?.preferredRate ?? 0.9;
  const playAt = useCallback(async (rate: number) => {
    const currentPlaybackId = ++playbackId.current;
    const playableRequest = resolvedRequest.current ?? await resolveHumanAudio(request, reading, humanFirst);
    if (currentPlaybackId !== playbackId.current) return;
    resolvedRequest.current = playableRequest;
    provider.current ??= createAudioProvider(playableRequest);
    setPlaybackState("playing");
    const playback = await playAudioWithBrowserFallback(provider.current, playableRequest, rate);
    if (currentPlaybackId !== playbackId.current) return;
    provider.current = playback.provider;
    const result = playback.result;
    setSourceInfo(audioSourceInfo(playback.provider.sourceType, playableRequest.metadata));
    setMessage(result.status === "played" ? "" : result.message ?? "Audio is unavailable.");
    setPlaybackState("idle");
  }, [externalUrl, humanFirst, metadata, reading, text]);

  useEffect(() => {
    playbackId.current += 1;
    provider.current?.stop();
    provider.current = null;
    resolvedRequest.current = null;
    setSourceInfo(null);
    setPlaybackState("idle");
  }, [providerKey]);

  useEffect(() => {
    if (autoPlay) void playAt(normalRate);
    return () => {
      playbackId.current += 1;
      provider.current?.stop();
      setPlaybackState("idle");
    };
  }, [autoPlay, normalRate, playAt]);

  if (!text && !externalUrl && !metadata?.externalUrl) return null;
  return <div className={`flex flex-wrap items-center gap-2 ${className}`}>{playbackState === "playing" ? <button type="button" onClick={() => { provider.current?.pause(); setPlaybackState("paused"); }} className="rounded-lg border border-[#e5b85c] bg-[#302818] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#45391f]" aria-label="Pause Japanese audio">Pause</button> : playbackState === "paused" ? <button type="button" onClick={() => { provider.current?.resume(); setPlaybackState("playing"); }} className="rounded-lg border border-[#4f9ac0] bg-[#102536]/70 px-3 py-2 text-xs font-semibold text-[#d9eef8] hover:border-[#8cc9e5]" aria-label="Resume Japanese audio">Resume</button> : <button type="button" onClick={() => void playAt(normalRate)} className="rounded-lg border border-[#4f9ac0] bg-[#102536]/70 px-3 py-2 text-xs font-semibold text-[#d9eef8] hover:border-[#8cc9e5]" aria-label="Play Japanese audio">Play</button>}<button type="button" onClick={() => void playAt(normalRate)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#8cc9e5]" aria-label="Replay Japanese audio">Replay</button><button type="button" onClick={() => void playAt(0.6)} className="rounded-lg border border-[#3f4652] px-3 py-2 text-xs text-[#c3c7ce] hover:border-[#8cc9e5]" aria-label="Play Japanese audio slowly">Slow</button>{sourceInfo ? <details className="text-xs text-[#9297a1]"><summary className="cursor-pointer text-[#e5b85c]">{sourceInfo.label} ⓘ</summary><p className="mt-1 max-w-xs leading-5">{sourceInfo.attribution}{sourceInfo.license ? ` · ${sourceInfo.license}` : ""}{sourceInfo.filePage ? <> · <a href={sourceInfo.filePage} target="_blank" rel="noreferrer" className="text-[#e5b85c]">Source file ↗</a></> : null}</p></details> : null}{message ? <span role="status" className="basis-full text-xs text-[#ef675d]">{message}</span> : null}</div>;
}
