import { resolveTatoebaAudio as resolve } from "./tatoeba-audio-core.js";

export interface TatoebaAudioLookup {
  text: string;
}

export interface TatoebaAudioResult {
  url: string;
  filePage: string;
  label: string;
  speaker?: string;
  attribution?: string;
  license: string;
  licenseUrl?: string;
  source: "tatoeba";
  sentenceId: number;
}

export interface TatoebaAudioOptions {
  fetch?: typeof fetch;
  cache?: Map<string, TatoebaAudioResult | null>;
}

export function resolveTatoebaAudio(lookup: TatoebaAudioLookup, options?: TatoebaAudioOptions): Promise<TatoebaAudioResult | null> {
  return resolve(lookup, options) as Promise<TatoebaAudioResult | null>;
}
