import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const entries = JSON.parse(await readFile(new URL("../data/source-maps/tadoku.json", import.meta.url), "utf8"));

test("Tadoku shelf entries preserve hosted source metadata and forbid transformation", () => {
  assert.ok(entries.length >= 3);
  assert.ok(entries.some((entry) => entry.level === "Start"));
  assert.ok(entries.some((entry) => entry.level === "Level 1"));
  for (const entry of entries) {
    assert.equal(entry.sourceId, "tadoku");
    assert.equal(entry.transformAllowed, false);
    assert.equal(entry.license, "CC BY-NC-ND 4.0");
    assert.match(entry.url, /^https:\/\/tadoku\.org\/japanese\/book\//u);
    assert.equal(entry.attribution, "NPO多言語多読");
    assert.equal(entry.audio?.delivery, "provider-hosted");
    assert.equal("transformedText" in entry, false);
    assert.equal("questions" in entry, false);
  }
});

test("Tadoku remains a source-hosted reading shelf with local progress support", async () => {
  const page = await readFile(new URL("../app/(main)/immersion/page.tsx", import.meta.url), "utf8");
  const shelf = await readFile(new URL("../components/learning/tadoku-shelf.tsx", import.meta.url), "utf8");
  assert.match(page, /TadokuShelf/);
  assert.match(shelf, /markExternalSourceOpened/);
  assert.match(shelf, /ExternalSourceViewer/);
  assert.match(shelf, /AudioControls/);
  assert.doesNotMatch(shelf, /fetch\(|questions|translation/);
});

