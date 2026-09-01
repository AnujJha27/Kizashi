import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { audioSourceInfo, preferredJapaneseVoice, shouldFallbackToBrowser } from "../lib/audio-core.js";

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
  assert.match(provider, /pause\(\)/);
  assert.match(provider, /resume\(\)/);
  assert.match(provider, /resolveHumanAudio/);
  assert.match(provider, /enabled = false/);
  assert.match(provider, /playAudioWithBrowserFallback/);
  assert.match(await readFile(new URL("../lib/audio-core.js", import.meta.url), "utf8"), /startsWith\("ja"\)/);
  assert.match(provider, /setTimeout\(finish, 1500\)/);
  assert.doesNotMatch(provider, /if \(selected \|\| voices\.length\)/);
  assert.match(controls, /Play Japanese audio/);
  assert.match(controls, /Replay Japanese audio/);
  assert.match(controls, /Play Japanese audio slowly/);
  assert.match(controls, /Pause Japanese audio/);
  assert.match(controls, /Resume Japanese audio/);
  assert.match(controls, /autoPlay/);
  assert.match(controls, /resolveHumanAudio\(request, reading, humanFirst\)/);
  assert.doesNotMatch(provider, /supabase\.storage|upload\(/);
});

test("remote playback selects the browser fallback after a remote failure", () => {
  assert.equal(shouldFallbackToBrowser({ sourceType: "remote", status: "error", text: "食べ物" }), true);
  assert.equal(shouldFallbackToBrowser({ sourceType: "remote", status: "played", text: "食べ物" }), false);
  assert.equal(shouldFallbackToBrowser({ sourceType: "browser-speech", status: "error", text: "食べ物" }), false);
});

test("audio provenance is hidden after browser fallback", () => {
  const metadata = { sourceType: "remote", license: "CC BY 4.0", provenance: { sourceId: "wikimedia-commons", collection: "lingua-libre", sourceUrl: "https://commons.wikimedia.org/wiki/File:X", attribution: "Speaker" } };
  assert.equal(audioSourceInfo("browser-speech", metadata), null);
  assert.equal(audioSourceInfo("remote", metadata).label, "Human recording · Lingua Libre");
});

test("Commons route keeps auth, bounded input, clean misses, and upstream error boundaries", async () => {
  const route = await readFile(new URL("../app/api/audio/commons/route.ts", import.meta.url), "utf8");
  assert.match(route, /Authentication required/);
  assert.match(route, /MAX_INPUT_LENGTH/);
  assert.match(route, /result: null/);
  assert.match(route, /resolveCommonsAudio/);
});
