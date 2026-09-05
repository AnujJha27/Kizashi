import test from "node:test";
import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";

import { getJourneyWorldState, getNextJourneyArea, journeyVisualManifest } from "../lib/journey-world-core.js";

const lessons = [
  { id: "lesson-food-and-routines", itemIds: ["word-1", "word-2"] },
  { id: "lesson-weather-and-shopping", itemIds: ["word-3"] },
];

test("world state follows the active lesson and area progress", () => {
  assert.equal(getJourneyWorldState({ lessonId: "lesson-food-and-routines", lessons }).area.id, "station");
  assert.equal(getJourneyWorldState({ lessonId: "lesson-food-and-routines", lessons }).stage.id, "arrival");
  assert.equal(getJourneyWorldState({ lessonId: "lesson-weather-and-shopping", lessons, records: { "word-1": {}, "word-2": {} } }).stage.id, "lived-in");
  assert.equal(getJourneyWorldState({ lessonId: "lesson-weather-and-shopping", lessons, records: { "word-1": {}, "word-2": {}, "word-3": {} } }).stage.id, "settled");
});

test("callers without a full curriculum still receive area progression", () => {
  assert.equal(getJourneyWorldState({ lessonId: "lesson-morning-route" }).area.id, "neighborhood");
  assert.equal(getJourneyWorldState({ lessonId: "lesson-morning-route" }).stage.id, "lived-in");
  assert.equal(getJourneyWorldState({ lessonId: "lesson-original-n4-2", targetLevel: "N4" }).area.id, "wide-station");
});

test("N4 assessment work opens the wider-world transition", () => {
  const state = getJourneyWorldState({ lessonId: "lesson-original-n4-1", targetLevel: "N4" });
  assert.equal(state.area.id, "wide-station");
  assert.equal(state.area.level, "N4");
  assert.equal(state.stage.id, "arrival");
});

test("the generated N4 prerequisite stop also opens the wider station", () => {
  assert.equal(getJourneyWorldState({ lessonId: "lesson-n4-prerequisites", targetLevel: "N4" }).area.id, "wide-station");
});

test("world areas carry deliberate desktop and mobile focal points", () => {
  for (const area of Object.values(journeyVisualManifest)) {
    assert.match(area.focalPoint.desktop, /^\w+ \d+%$/);
    assert.match(area.focalPoint.mobile, /^\w+ \d+%$/);
  }
  assert.notEqual(journeyVisualManifest.station.focalPoint.mobile, journeyVisualManifest["shopping-street"].focalPoint.mobile);
});

test("world areas use distinct owned visual variants with role metadata", async () => {
  const areas = Object.values(journeyVisualManifest);
  assert.equal(new Set(areas.map((area) => area.visualAssets.hero)).size, areas.length);
  assert.equal(new Set(areas.map((area) => area.visualAssets.today)).size, areas.length);
  assert.ok(areas.every((area) => new Set([area.visualAssets.hero, area.visualAssets.today, area.visualAssets.lesson]).size === 3));
  assert.ok(areas.every((area) => area.visualAssetMetadata.length === 7));
  assert.ok(areas.flatMap((area) => area.visualAssetMetadata).every((asset) => asset.sourceType === "generated-raster" && asset.path.endsWith(".webp") && asset.attribution && asset.focalPoint));
  await Promise.all(areas.flatMap((area) => [area.visualAssets.hero, area.visualAssets.today, area.visualAssets.lesson].map((path) => access(new URL(`../public${path}`, import.meta.url)))));
});

test("Journey, Today, and Learn consume their own visual roles", async () => {
  const [journey, today, learn] = await Promise.all([
    readFile(new URL("../components/journey/journey-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/journey/daily-session.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/learning/local-lesson.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(journey, /visualAssets\.hero/);
  assert.match(journey, /visualAssets\.lesson/);
  assert.match(today, /visualAssets\.today/);
  assert.match(learn, /visualAssets\.lesson/);
});

test("Journey and profile scenery use raster images instead of SVG art", async () => {
  const [landscape, portrait, worldFiles] = await Promise.all([
    readFile(new URL("../components/journey/landscape.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/profile/study-portrait.tsx", import.meta.url), "utf8"),
    readdir(new URL("../public/world", import.meta.url)),
  ]);
  assert.doesNotMatch(landscape, /<svg/);
  assert.doesNotMatch(portrait, /<svg/);
  assert.ok(worldFiles.every((file) => file.endsWith(".webp")));
});

test("world imagery hides a failed asset without removing the surrounding UI", async () => {
  const [landscape, portrait] = await Promise.all([
    readFile(new URL("../components/journey/landscape.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/profile/study-portrait.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(landscape, /onError=\{\(event\) => \{ event\.currentTarget\.hidden = true; \}\}/);
  assert.match(portrait, /onError=\{\(event\) => \{ event\.currentTarget\.hidden = true; \}\}/);
});

test("the profile portrait consumes the resolved area visual", async () => {
  const portrait = await readFile(new URL("../components/profile/study-portrait.tsx", import.meta.url), "utf8");
  assert.match(portrait, /world\.area\.visualAssets\.portrait/);
  assert.match(portrait, /"--world-focal": world\.area\.focalPoint\.desktop/);
  assert.match(portrait, /settled/);
});

test("image scenery carries both responsive focal points", async () => {
  const [landscape, portrait, css] = await Promise.all([
    readFile(new URL("../components/journey/landscape.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/profile/study-portrait.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(landscape, /focalPoint\.mobile/);
  assert.match(portrait, /focalPoint\.mobile/);
  assert.match(css, /\.world-scene-image/);
  assert.match(css, /world-focal-mobile/);
});

test("finishing an area points to the next mapped place", () => {
  const next = getNextJourneyArea({ lessonId: "lesson-weather-and-shopping", lessons: [...lessons, { id: "lesson-home-and-directions", itemIds: ["word-4"] }] });
  assert.equal(next.id, "shopping-street");
  assert.equal(next.japaneseTitle, "商店街");
});
