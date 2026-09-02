import { preferredJapaneseVoice, shouldFallbackToBrowser } from "@/lib/audio-core.js";
import type { AudioMetadata, AudioSourceType } from "@/lib/types";

export type { AudioMetadata, AudioSourceType } from "@/lib/types";

export interface AudioRequest {
  text?: string;
  externalUrl?: string | null;
  metadata?: AudioMetadata;
}

export interface AudioPlayResult {
  status: "played" | "unavailable" | "error";
  message?: string;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sentenceLike(text: string) {
  return text.length >= 4 && /[。！？!?]/u.test(text);
}

export async function resolveHumanAudio(request: AudioRequest, reading?: string, enabled = false): Promise<AudioRequest> {
  if (!enabled || !request.text?.trim() || request.externalUrl || request.metadata?.externalUrl) return request;
  const endpoints = ["/api/audio/commons", ...(sentenceLike(request.text) ? ["/api/audio/tatoeba"] : [])];
  for (const endpoint of endpoints) {
    try {
      const params = new URLSearchParams({ text: request.text });
      if (reading?.trim()) params.set("reading", reading.trim());
      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) continue;
      const payload: unknown = await response.json();
      if (!record(payload) || !record(payload.result)) continue;
      const result = payload.result;
      const remoteUrl = result && typeof result.url === "string" ? result.url : "";
      if (!remoteUrl) continue;
      const speaker = typeof result.speaker === "string" ? result.speaker : undefined;
      const speakerId = typeof result.speakerId === "string" ? result.speakerId : undefined;
      const sourceId = typeof result.source === "string" ? result.source : "wikimedia-commons";
      return {
        ...request,
        externalUrl: remoteUrl,
        metadata: {
          ...request.metadata,
          sourceType: "remote",
          externalUrl: remoteUrl,
          ...(speaker ? { speaker } : {}),
          ...(speakerId ? { speakerId } : {}),
          isSynthetic: false,
          ...(typeof result.license === "string" ? { license: result.license } : {}),
          provenance: {
            ...request.metadata?.provenance,
            sourceId,
            sourceUrl: typeof result.filePage === "string" ? result.filePage : undefined,
            licenseUrl: typeof result.licenseUrl === "string" ? result.licenseUrl : undefined,
            attribution: typeof result.attribution === "string" ? result.attribution : undefined,
            ...(typeof result.collection === "string" ? { collection: result.collection } : {}),
            ...(Number.isInteger(result.sentenceId) ? { sentenceId: result.sentenceId } : {}),
          },
        },
      };
    } catch {
      continue;
    }
  }
  return request;
}

export async function playAudioWithBrowserFallback(provider: AudioProvider, request: AudioRequest, rate?: number) {
  let result: AudioPlayResult;
  try {
    result = await provider.play(request, rate);
  } catch {
    result = { status: "error", message: "Audio could not be played." };
  }
  if (!shouldFallbackToBrowser({ sourceType: provider.sourceType, status: result.status, text: request.text })) return { provider, result };
  const fallback = new BrowserSpeechProvider();
  return { provider: fallback, result: await fallback.play({ text: request.text, metadata: request.metadata }, rate) };
}

export interface AudioProvider {
  readonly sourceType: AudioSourceType;
  canPlay(request: AudioRequest): boolean;
  play(request: AudioRequest, rate?: number): Promise<AudioPlayResult>;
  pause(): void;
  resume(): void;
  stop(): void;
}

function playbackRate(rate: number | undefined, fallback = 0.9) {
  const value = Number.isFinite(rate) ? Number(rate) : fallback;
  return Math.min(2, Math.max(0.4, value));
}

function japaneseVoice(synthesis: SpeechSynthesis) {
  const voices = synthesis.getVoices();
  const selected = preferredJapaneseVoice(voices);
  if (selected) return Promise.resolve(selected);
  return new Promise<SpeechSynthesisVoice | null>((resolve) => {
    const deadline = Date.now() + 1500;
    const finish = () => {
      const next = preferredJapaneseVoice(synthesis.getVoices());
      if (!next && Date.now() < deadline) return;
      synthesis.removeEventListener("voiceschanged", finish);
      resolve(next);
    };
    synthesis.addEventListener("voiceschanged", finish);
    window.setTimeout(finish, 1500);
    finish();
  });
}

export class BrowserSpeechProvider implements AudioProvider {
  readonly sourceType = "browser-speech" as const;
  private requestId = 0;

  canPlay(request: AudioRequest) {
    return typeof window !== "undefined" && "speechSynthesis" in window && Boolean(request.text?.trim());
  }

  async play(request: AudioRequest, rate?: number): Promise<AudioPlayResult> {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return { status: "unavailable", message: "Speech synthesis is unavailable on this device." };
    if (!request.text?.trim()) return { status: "error", message: "No Japanese text is available to play." };
    const requestId = ++this.requestId;
    const voice = await japaneseVoice(window.speechSynthesis);
    if (requestId !== this.requestId) return { status: "error", message: "Audio playback was cancelled." };
    if (!voice) return { status: "unavailable", message: "Japanese speech is unavailable on this device." };
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(request.text);
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = playbackRate(rate ?? request.metadata?.preferredRate);
    return new Promise((resolve) => {
      utterance.onend = () => resolve({ status: "played" });
      utterance.onerror = () => resolve({ status: "error", message: "Japanese speech could not be played." });
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        resolve({ status: "error", message: "Japanese speech could not be played." });
      }
    });
  }

  stop() {
    this.requestId += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  pause() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.pause();
  }

  resume() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.resume();
  }
}

export class RemoteAudioProvider implements AudioProvider {
  readonly sourceType = "remote" as const;
  private audio: HTMLAudioElement | null = null;

  canPlay(request: AudioRequest) {
    return Boolean(request.externalUrl || request.metadata?.externalUrl);
  }

  async play(request: AudioRequest, rate?: number): Promise<AudioPlayResult> {
    const url = request.externalUrl || request.metadata?.externalUrl;
    if (!url) return { status: "error", message: "No external audio is configured." };
    try {
      this.stop();
      this.audio = new Audio(url);
      const audio = this.audio;
      audio.playbackRate = playbackRate(rate ?? request.metadata?.preferredRate);
      await audio.play();
      return await new Promise<AudioPlayResult>((resolve) => {
        audio.onended = () => resolve({ status: "played" });
        audio.onerror = () => resolve({ status: "error", message: "The external audio could not be played." });
      });
    } catch {
      return { status: "error", message: "The external audio could not be played." };
    }
  }

  stop() {
    this.audio?.pause();
    if (this.audio) this.audio.currentTime = 0;
    this.audio = null;
  }

  pause() {
    this.audio?.pause();
  }

  resume() {
    void this.audio?.play();
  }
}

export class ServerTTSProvider implements AudioProvider {
  readonly sourceType = "server-tts" as const;

  canPlay() {
    return false;
  }

  async play() {
    return { status: "unavailable" as const, message: "Server pronunciation is not configured." };
  }

  pause() {}
  resume() {}
  stop() {}
}

export function createAudioProvider(request: AudioRequest = {}): AudioProvider {
  const sourceType = request.metadata?.sourceType;
  if (sourceType === "server-tts") return new ServerTTSProvider();
  if (sourceType === "remote" || request.externalUrl || request.metadata?.externalUrl) return new RemoteAudioProvider();
  return new BrowserSpeechProvider();
}
