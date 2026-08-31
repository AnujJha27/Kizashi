import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { preferredJapaneseVoice } from "../lib/audio-core.js";

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
  assert.match(await readFile(new URL("../lib/audio-core.js", import.meta.url), "utf8"), /startsWith\("ja"\)/);
  assert.match(controls, /Play Japanese audio/);
  assert.match(controls, /Replay Japanese audio/);
  assert.match(controls, /Play Japanese audio slowly/);
  assert.match(controls, /autoPlay/);
  assert.doesNotMatch(provider, /supabase\.storage|upload\(/);
});
