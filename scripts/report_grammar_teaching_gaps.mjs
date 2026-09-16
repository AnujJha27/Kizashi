#!/usr/bin/env node
import { readFileSync } from "node:fs";

const load = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const packages = [
  load("data/n5-foundations.json"),
  load("data/n5-conversation-expansion.json"),
  load("data/n5-practical-expansion.json"),
  load("data/n5-life-expansion.json"),
  load("data/n4-grammar-expansion.json"),
  load("data/textbook-gap-grammar.json"),
];
const canonical = load("data/audits/canonical-syllabus.json");
const aliases = load("data/syllabus-item-aliases.json");
const grammar = packages.flatMap((pkg) => pkg.grammar ?? []);
const byId = new Map(grammar.map((item) => [item.id, item]));
const requirementIds = (canonical.requirements ?? []).map((entry) => typeof entry === "string" ? entry : entry.id).filter((id) => id?.startsWith("grammar-"));

function tokens(id) {
  return new Set(id.replace(/^grammar-/, "").split("-").filter((token) => token.length > 1));
}
function similarity(a, b) {
  const aa = tokens(a); const bb = tokens(b);
  let overlap = 0;
  for (const token of aa) if (bb.has(token)) overlap += 1;
  const union = new Set([...aa, ...bb]).size || 1;
  return overlap / union;
}
const missing = requirementIds.filter((id) => !byId.has(aliases[id] ?? id));
const report = missing.map((id) => ({
  id,
  candidates: grammar
    .map((item) => ({ id: item.id, score: similarity(id, item.id), pattern: item.pattern, meaning: item.meaning }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 5),
}));
console.log(JSON.stringify({ existingGrammarIds: grammar.map((item) => item.id).sort(), missingCount: missing.length, report }, null, 2));
