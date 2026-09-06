import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getJishoKanjiUrl, getKanjiVgUrl, normalizeStrokeData, evaluateStrokeOrder } from "../lib/kanji-writing-core.js";

test("kanji writing helpers keep source URLs and stroke order deterministic", () => {
  assert.equal(getJishoKanjiUrl("駅"), "https://jisho.org/search/%E9%A7%85%20%23kanji");
  assert.equal(getKanjiVgUrl("駅"), "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/099c5.svg");
  assert.deepEqual(normalizeStrokeData({ character: "駅", strokes: [{ order: 1, path: "M1 1" }, { order: 2, path: "M2 2" }] }), { character: "駅", strokes: [{ order: 1, path: "M1 1" }, { order: 2, path: "M2 2" }] });
  assert.equal(normalizeStrokeData({ character: "駅", strokes: [{ order: 2, path: "M1 1" }] }), null);
  assert.deepEqual(evaluateStrokeOrder(2, 1), { ok: false, message: "This should be stroke 2" });
  assert.deepEqual(evaluateStrokeOrder(2, 2), { ok: true, message: "Good" });
});

test("kanji writing surfaces keep the trainer native and references lazy", async () => {
  const trainer = await readFile(new URL("../components/learning/kanji-writing-trainer.tsx", import.meta.url), "utf8");
  const practice = await readFile(new URL("../components/practice/kanji-writing-practice.tsx", import.meta.url), "utf8").catch(() => "");
  const practicePage = await readFile(new URL("../app/(main)/practice/page.tsx", import.meta.url), "utf8");
  const localPractice = await readFile(new URL("../components/practice/local-practice.tsx", import.meta.url), "utf8");
  const entry = await readFile(new URL("../components/library/entry-detail.tsx", import.meta.url), "utf8");
  const importer = await readFile(new URL("../scripts/import_kanjivg.py", import.meta.url), "utf8");
  const manifest = JSON.parse(await readFile(new URL("../browser/kizashi-private-frame-unlocker/manifest.json", import.meta.url), "utf8"));
  assert.match(trainer, /onPointerDown/);
  assert.match(trainer, /Write from memory/);
  assert.match(trainer, /ExternalSourceViewer source=\{jishoSource\}/);
  assert.match(practice, /KanjiWritingTrainer/);
  assert.match(practicePage, /kanji-writing/);
  assert.match(localPractice, /KanjiWritingPractice/);
  assert.match(entry, /KanjiWritingTrainer item=\{item\}/);
  assert.match(importer, /canonical_characters/);
  assert.match(importer, /KanjiVG/);
  assert.ok(manifest.host_permissions.includes("https://jisho.org/*"));
});
