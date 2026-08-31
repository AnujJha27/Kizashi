import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  estimateAozoraDifficulty,
  fetchAozoraText,
  isReusableAozoraWork,
  normalizeAozoraText,
  parseAozoraCatalog,
} from "../lib/sources/aozora-core.js";

const catalog = [
  "作品ID,人物ID,作品名,著者名,カードURL,テキストURL,文字遣い,状態,備考",
  "127,879,羅生門,芥川 竜之介,https://www.aozora.gr.jp/cards/000879/card127.html,https://www.aozora.gr.jp/cards/000879/files/127_15260.html,新字新仮名,公開中",
  "999,1000,保護作品,存続著者,https://example.test/card999,https://example.test/text999,新字新仮名,公開中,＊著作権存続＊",
  "1000,1001,公開作品,消滅著者,https://example.test/card1000,https://example.test/text1000,新字新仮名,公開中,著作権消滅",
].join("\n");

test("Aozora catalog parsing maps bibliographic fields and rights markers", () => {
  const works = parseAozoraCatalog(catalog);
  assert.deepEqual(works[0], {
    workId: "127",
    personId: "879",
    title: "羅生門",
    author: "芥川 竜之介",
    cardUrl: "https://www.aozora.gr.jp/cards/000879/card127.html",
    textUrl: "https://www.aozora.gr.jp/cards/000879/files/127_15260.html",
    orthography: "新字新仮名",
    rightsMarker: "公開中",
    rightsStatus: "unknown",
  });
  assert.equal(works[1].rightsStatus, "protected");
  assert.equal(works[2].rightsStatus, "public-domain");
  assert.equal(isReusableAozoraWork(works[0]), false);
  assert.equal(isReusableAozoraWork(works[2]), true);
  assert.equal(isReusableAozoraWork(works[1]), false);
});

test("protected Aozora text is rejected before the fetcher runs", async () => {
  let fetches = 0;
  await assert.rejects(
    fetchAozoraText({ textUrl: "https://example.test/protected", rightsStatus: "protected" }, async () => {
      fetches += 1;
      return { ok: true, text: async () => "must not load" };
    }),
    /protected/i,
  );
  assert.equal(fetches, 0);
});

test("public Aozora markup is normalized without simplifying the source", async () => {
  const html = "<html><head><title>ignored shell</title></head><body><div class=main_text>｜下人《げにん》が、<br>羅生門にいた。</div><script>alert(1)</script></body></html>";
  const text = normalizeAozoraText(html);
  assert.equal(text, "下人（げにん）が、\n羅生門にいた。");
  const loaded = await fetchAozoraText({ textUrl: "https://example.test/public", rightsStatus: "public-domain" }, async () => ({ ok: true, text: async () => html }));
  assert.equal(loaded, text);
});

test("difficulty estimate reports actual coverage and clearly remains an estimate", () => {
  const estimate = estimateAozoraDifficulty("私は駅で水を飲みます。", {
    vocabulary: [{ writtenForm: "私" }, { writtenForm: "駅" }, { writtenForm: "水" }],
    kanji: [{ character: "私" }, { character: "駅" }, { character: "水" }, { character: "飲" }],
  });
  assert.equal(estimate.label, "estimated");
  assert.equal(estimate.characterCount, 11);
  assert.equal(estimate.sentenceCount, 1);
  assert.equal(estimate.knownVocabularyCount, 3);
  assert.equal(estimate.knownKanjiCount, 4);
  assert.ok(estimate.vocabularyCoverage > 0);
  assert.ok(estimate.vocabularyCoverage <= 1);
  assert.ok(estimate.kanjiCoverage === 1);
});

test("Aozora shelf and reader preserve source fallback and local reading state", async () => {
  const [shelf, page] = await Promise.all([
    readFile(new URL("../components/learning/aozora-shelf.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/(main)/immersion/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(shelf, /JapaneseText/);
  assert.match(shelf, /ExternalSourceViewer/);
  assert.match(shelf, /localStorage/);
  assert.match(shelf, /fontSize/);
  assert.match(shelf, /Resume/);
  assert.match(shelf, /overflow-x-hidden/);
  assert.match(page, /AozoraShelf/);
});
