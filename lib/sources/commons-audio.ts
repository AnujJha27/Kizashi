import { resolveCommonsAudio as resolve } from "./commons-audio-core.js";

export interface CommonsAudioLookup {
  text: string;
  reading?: string;
}

export interface CommonsAudioResult {
  url: string;
  filePage: string;
  label: string;
  speaker?: string;
  speakerId?: string;
  license: string;
  licenseUrl?: string;
  attribution?: string;
  source: "wikimedia-commons";
  collection?: "lingua-libre" | "commons";
}

export interface CommonsAudioOptions {
  fetch?: typeof fetch;
  cache?: Map<string, CommonsAudioResult | null>;
  acceptedLicenses?: readonly string[];
}

export function resolveCommonsAudio(lookup: CommonsAudioLookup, options?: CommonsAudioOptions): Promise<CommonsAudioResult | null> {
  return resolve(lookup, options) as Promise<CommonsAudioResult | null>;
}

