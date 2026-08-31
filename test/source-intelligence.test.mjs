import test from "node:test";
import assert from "node:assert/strict";

import { getConversationPriority, getSpokenFrequencySignal } from "../lib/spoken-intelligence.js";
import { getIjasDifficultySignal, getIjasWarning, ijasBoostForQuestion } from "../lib/ijas-core.js";

const ijas = [{ pattern: "に", category: "location-vs-action", count: 12, sourceReference: "reviewed aggregate" }];

test("CEJC spoken aggregates are a distinct conversation signal", () => {
  const item = { id: "grammar-ni", category: "grammar", spokenFrequency: 18, spokenFrequencyMetadata: { corpus: "CEJC", version: "2024.03", pmw: 4.2 } };
  assert.deepEqual(getSpokenFrequencySignal(item), { value: 18, corpus: "CEJC", perMillion: 4.2 });
  assert.ok(getConversationPriority(item) > 0);
});

test("missing spoken aggregates do not pretend to be CEJC evidence", () => {
  assert.deepEqual(getSpokenFrequencySignal({ id: "word" }), { value: null, corpus: null, perMillion: null });
  assert.equal(getConversationPriority({ id: "word", tags: [] }), 0);
});

test("reviewed I-JAS aggregates boost matching adaptive questions", () => {
  const item = { id: "grammar-ni", title: "に", pattern: "Place/time に verb", tags: ["destination"] };
  const signal = getIjasDifficultySignal(item, ijas);
  assert.equal(signal.count, 12);
  assert.equal(signal.category, "location-vs-action");
  assert.ok(ijasBoostForQuestion({ itemId: item.id, category: "grammar" }, new Map([[item.id, item]]), ijas) > 0);
  assert.match(getIjasWarning(item, { count: 4 }, ijas)?.message ?? "", /4/);
});
