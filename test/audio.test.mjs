import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { preferredJapaneseVoice, shouldFallbackToBrowser } from "../lib/audio-core.js";

test("Japanese voice selection prefers a voice whose language begins with ja", () => {
  const voices = [{ lang: "en-US", name: "English" }, { lang: "ja-JP", name: "Japanese" }];
  assert.equal(preferredJapaneseVoice(voices), voices[1]);
  assert.equal(preferredJapaneseVoice([{ lang: "en-US" }]), null);
});

test("audio UI and providers keep pronunciation ephemeral by default", async () => {
  const provider = await readFile(new URL("../lib/audio.ts", import.meta.url), "utf8");
  const controls = await readFile(new URL("../components/learning/audio-controls.tsx", import.meta.url), "utf8");
  assert.match(provider, /class BrowserSpeechProvider/);
  assert.match(provider, /class RemoteAudioProvider/);
  assert.match(provider, /class ServerTTSProvider/);
  assert.match(provider, /resolveHumanAudio/);
  assert.match(provider, /playAudioWithBrowserFallback/);
  assert.match(await readFile(new URL("../lib/audio-core.js", import.meta.url), "utf8"), /startsWith\("ja"\)/);
  assert.match(provider, /setTimeout\(finish, 1500\)/);
  assert.match(controls, /Play Japanese audio/);
  assert.match(controls, /Replay Japanese audio/);
  assert.match(controls, /Play Japanese audio slowly/);
  assert.match(controls, /autoPlay/);
  assert.doesNotMatch(provider, /supabase\.storage|upload\(/);
});

test("remote playback selects the browser fallback after a remote failure", () => {
  assert.equal(shouldFallbackToBrowser({ sourceType: "remote", status: "error", text: "食べ物" }), true);
  assert.equal(shouldFallbackToBrowser({ sourceType: "remote", status: "played", text: "食べ物" }), false);
  assert.equal(shouldFallbackToBrowser({ sourceType: "browser-speech", status: "error", text: "食べ物" }), false);
});
