import test from "node:test";
import assert from "node:assert/strict";

import { resolveCommonsAudio } from "../lib/sources/commons-audio-core.js";

function response(payload, ok = true, status = 200) {
  return { ok, status, async json() { return payload; } };
}

function fetchFor({ search = [], pages = [] } = {}) {
  const calls = [];
  const fetch = async (input) => {
    const url = new URL(input);
    calls.push(url);
    if (url.searchParams.get("list") === "search") return response({ query: { search } });
    if (url.searchParams.get("prop") === "imageinfo") return response({ query: { pages } });
    throw new Error(`Unexpected Commons request: ${url}`);
  };
  return { fetch, calls };
}

function page(title, { mime = "audio/ogg", url = "https://upload.wikimedia.org/audio.ogg", label = "食べ物", license = "CC BY 4.0", licenseUrl = "https://creativecommons.org/licenses/by/4.0/", artist = "Speaker", category = "Lingua Libre Japanese pronunciation" } = {}) {
  return { title, imageinfo: [{ url, mime, user: artist, extmetadata: {
    ObjectName: { value: label },
    LicenseShortName: { value: license },
    LicenseUrl: { value: licenseUrl },
    Artist: { value: artist },
    Categories: { value: category },
  }}] };
}

test("Commons resolver chooses an exact Japanese label before a weaker filename match", async () => {
  const { fetch, calls } = fetchFor({
    search: [{ title: "File:LL-Q150 (jpn)-食べ物.ogg" }, { title: "File:food.ogg" }],
    pages: [page("File:LL-Q150 (jpn)-食べ物.ogg"), page("File:food.ogg", { label: "food" })],
  });
  const result = await resolveCommonsAudio({ text: "食べ物", reading: "たべもの" }, { fetch, cache: new Map() });
  assert.equal(result?.label, "食べ物");
  assert.equal(result?.collection, "lingua-libre");
  assert.equal(result?.filePage, "https://commons.wikimedia.org/wiki/File:LL-Q150_(jpn)-%E9%A3%9F%E3%81%B9%E7%89%A9.ogg");
  assert.equal(calls.filter((url) => url.searchParams.get("list") === "search").length, 2);
});

test("Commons resolver rejects non-audio, missing-license, and incompatible files", async () => {
  const cases = [
    page("File:食べ物.jpg", { mime: "image/jpeg" }),
    page("File:食べ物.ogg", { license: "" }),
    page("File:食べ物.ogg", { license: "All rights reserved" }),
  ];
  for (const candidate of cases) {
    const { fetch } = fetchFor({ search: [{ title: candidate.title }], pages: [candidate] });
    assert.equal(await resolveCommonsAudio({ text: "食べ物" }, { fetch }), null);
  }
});

test("Commons resolver rejects ambiguous labels and unrelated filename matches", async () => {
  const ambiguous = page("File:食べ物.ogg", { label: "食べ物 / 食物" });
  const unrelated = page("File:食べ物屋.ogg", { label: "食べ物屋" });
  for (const candidate of [ambiguous, unrelated]) {
    const { fetch } = fetchFor({ search: [{ title: candidate.title }], pages: [candidate] });
    assert.equal(await resolveCommonsAudio({ text: "食べ物" }, { fetch, cache: new Map() }), null);
  }
});

test("Commons resolver requires Japanese source evidence even for an exact label", async () => {
  const candidate = page("File:食べ物.ogg", { category: "Audio files" });
  const { fetch } = fetchFor({ search: [{ title: candidate.title }], pages: [candidate] });
  assert.equal(await resolveCommonsAudio({ text: "食べ物" }, { fetch, cache: new Map() }), null);
});

test("Commons resolver preserves creator, license, attribution, and source metadata", async () => {
  const candidate = page("File:食べ物.ogg", { artist: "Aiko", license: "CC BY-SA 4.0", category: "Japanese pronunciation" });
  candidate.imageinfo[0].extmetadata.Credit = { value: "Lingua Libre contributor" };
  const { fetch } = fetchFor({ search: [{ title: candidate.title }], pages: [candidate] });
  assert.deepEqual(await resolveCommonsAudio({ text: "食べ物" }, { fetch, cache: new Map() }), {
    url: "https://upload.wikimedia.org/audio.ogg",
    filePage: "https://commons.wikimedia.org/wiki/File:%E9%A3%9F%E3%81%B9%E7%89%A9.ogg",
    label: "食べ物",
    speaker: "Aiko",
    speakerId: "Aiko",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attribution: "Lingua Libre contributor",
    source: "wikimedia-commons",
    collection: "commons",
  });
});

test("Commons resolver caches hits and misses without fetching again", async () => {
  const cache = new Map();
  const hit = fetchFor({ search: [{ title: "File:食べ物.ogg" }], pages: [page("File:食べ物.ogg")] });
  const first = await resolveCommonsAudio({ text: "食べ物" }, { fetch: hit.fetch, cache });
  const second = await resolveCommonsAudio({ text: "食べ物" }, { fetch: () => { throw new Error("cached hit fetched"); }, cache });
  assert.deepEqual(second, first);
  assert.equal(hit.calls.length, 2);

  const missCache = new Map();
  const miss = fetchFor({ search: [], pages: [] });
  assert.equal(await resolveCommonsAudio({ text: "存在しない" }, { fetch: miss.fetch, cache: missCache }), null);
  assert.equal(await resolveCommonsAudio({ text: "存在しない" }, { fetch: () => { throw new Error("cached miss fetched"); }, cache: missCache }), null);
  assert.equal(miss.calls.length, 1);
});

test("Commons resolver reports API failures without caching them", async () => {
  const cache = new Map();
  await assert.rejects(() => resolveCommonsAudio({ text: "食べ物" }, { fetch: async () => response({}, false, 503), cache }));
  assert.equal(cache.size, 0);
});
