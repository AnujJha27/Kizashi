import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { getWikibooksSection } from "../lib/sources/wikibooks-core.js";

const taeKim = JSON.parse(await readFile(new URL("../data/source-maps/tae-kim.json", import.meta.url), "utf8"));
const wikibooks = JSON.parse(await readFile(new URL("../data/source-maps/wikibooks.json", import.meta.url), "utf8"));

test("Tae Kim mappings use deep links and remain alternative explanations", () => {
  assert.ok(taeKim["grammar-wa"]?.url.includes("#"));
  assert.equal(taeKim["grammar-wa"]?.relationship, "alternative-explanation");
  assert.equal(taeKim["grammar-wa"]?.sourceId, "tae-kim");
  assert.ok(Object.keys(taeKim).length >= 5);
  assert.ok(Object.values(taeKim).every((entry) => entry.attribution && entry.license));
});

test("Wikibooks mappings remain optional references", () => {
  assert.equal(wikibooks["grammar-counters"]?.sourceId, "wikibooks-japanese");
  assert.equal(wikibooks["grammar-counters"]?.relationship, "reference");
  assert.match(wikibooks["grammar-counters"]?.url ?? "", /wikibooks\.org/);
});

test("Wikibooks adapter returns sanitized text and useful links without HTML", async () => {
  const calls = [];
  const fetch = async (input) => {
    calls.push(new URL(input));
    return { ok: true, status: 200, async json() {
      return { parse: { title: "Japanese/Grammar/Particles", sections: [{ index: "2", line: "は" }], wikitext: "== は ==\nUse [[Japanese/Grammar/Basic particles|the particle page]]. <script>alert(1)</script> {{template|bad}} [https://example.com outside]" } };
    } };
  };
  const result = await getWikibooksSection({ page: "Japanese/Grammar/Particles", section: "は" }, { fetch, cache: new Map() });
  assert.equal(result?.title, "Japanese/Grammar/Particles");
  assert.match(result?.text ?? "", /Use the particle page/);
  assert.doesNotMatch(result?.text ?? "", /<script|template|\[\[/iu);
  assert.deepEqual(result?.links, [{ label: "the particle page", url: "https://en.wikibooks.org/wiki/Japanese/Grammar/Basic_particles" }, { label: "outside", url: "https://example.com" }]);
  assert.equal(result?.license, "CC BY-SA 4.0 / GFDL");
  assert.equal(calls.length, 1);
});

test("Wikibooks adapter caches hits and rejects API failures", async () => {
  const cache = new Map();
  let calls = 0;
  const fetch = async () => { calls += 1; return { ok: true, status: 200, async json() { return { parse: { title: "Japanese", wikitext: "Plain reference." } }; } }; };
  const first = await getWikibooksSection({ page: "Japanese" }, { fetch, cache });
  const second = await getWikibooksSection({ page: "Japanese" }, { fetch: () => { throw new Error("cached"); }, cache });
  assert.deepEqual(second, first);
  assert.equal(calls, 1);
  await assert.rejects(() => getWikibooksSection({ page: "Japanese/Grammar" }, { fetch: async () => ({ ok: false, status: 503 }), cache: new Map() }));
});

