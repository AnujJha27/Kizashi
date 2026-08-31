import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const registry = await readFile(new URL("../lib/external-resources.ts", import.meta.url), "utf8");
const immersion = await readFile(new URL("../components/learning/immersion-surface.tsx", import.meta.url), "utf8");
const launcher = await readFile(new URL("../components/learning/external-source-launcher.tsx", import.meta.url), "utf8");

test("external registry contains the existing source families and new pedagogical roles", () => {
  for (const sourceId of ["erin", "cejc", "csj", "common-voice", "tatoeba", "jsut", "japanese-pod101", "tae-kim", "wikibooks-japanese", "wikimedia-commons", "aozora-bunko", "tadoku", "irodori"]) {
    assert.match(registry, new RegExp(`sourceId: [\"']${sourceId}[\"']`));
  }
  assert.match(registry, /alternative grammar intuition/);
  assert.match(registry, /dynamic human pronunciation/);
  assert.match(registry, /graded extensive-reading/);
  assert.match(registry, /native reading/);
  assert.match(registry, /Can-do/);
});

test("registry exposes filtered lookup and an empty result for missing optional matches", () => {
  assert.match(registry, /export function getExternalResources\(filters: ExternalResourceFilters = \{\}\)/);
  assert.match(registry, /registry\.filter/);
  assert.match(registry, /if \(filters\.itemId && !resource\.targetItemIds\?\.includes\(filters\.itemId\)\) return false/);
  assert.match(registry, /Object\.freeze/);
});

test("Immersion consumes the registry and keeps one Erin family card", () => {
  assert.match(immersion, /getExternalResources/);
  assert.match(immersion, /const sources = getExternalResources\(\)/);
  assert.doesNotMatch(immersion, /const sources: ExternalSourceLink\[\] = \[/);
  assert.match(immersion, /getErinLessonSources/);
});

test("the edge adapter maps registry delivery and provenance fields to the existing launcher shape", () => {
  assert.match(launcher, /externalResourceToSourceLink/);
  assert.match(launcher, /mediaDelivery/);
  assert.match(launcher, /resourceType/);
  assert.match(launcher, /deliveryMode/);
});
