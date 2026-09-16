import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { auditSyllabusPlacement, buildRequiredUnion, normalizeRequirementKey } from "../lib/syllabus-audit-core.js";

function loadAudit(filename) {
  const url = new URL(`../data/audits/${filename}`, import.meta.url);
  const path = fileURLToPath(url);
  assert.equal(existsSync(path), true, `${filename} must exist as persistent audit evidence`);
  return JSON.parse(readFileSync(path, "utf8"));
}

test("the canonical syllabus is a union: any one inclusion source makes a requirement required", () => {
  const union = buildRequiredUnion([
    { id: "genki", requirements: [{ id: "grammar-genki-only", kind: "grammar", label: "Genki only" }] },
    { id: "minna", requirements: [{ id: "grammar-minna-only", kind: "grammar", label: "Minna only" }] },
    { id: "independent", requirements: [{ id: "capability-audit-only", kind: "capability", label: "Audit only" }] },
  ]);

  assert.deepEqual(
    union.map((item) => item.id).sort(),
    ["capability-audit-only", "grammar-genki-only", "grammar-minna-only"],
  );
});

test("aliases from different sources collapse into one canonical requirement without losing evidence", () => {
  const union = buildRequiredUnion([
    {
      id: "genki",
      requirements: [{ id: "genki-permission", canonicalId: "grammar-temoii", kind: "grammar", label: "permission" }],
    },
    {
      id: "minna",
      requirements: [{ id: "minna-permission", canonicalId: "grammar-temoii", kind: "grammar", label: "permission" }],
    },
  ]);

  assert.equal(union.length, 1);
  assert.equal(union[0].id, "grammar-temoii");
  assert.deepEqual(union[0].evidenceSources.sort(), ["genki", "minna"]);
  assert.deepEqual(union[0].sourceRequirementIds.sort(), ["genki-permission", "minna-permission"]);
});

test("required plus unplaced fails the syllabus audit", () => {
  const requirements = [
    { id: "grammar-a", kind: "grammar", evidenceSources: ["genki"] },
    { id: "grammar-b", kind: "grammar", evidenceSources: ["minna"] },
  ];

  const result = auditSyllabusPlacement({
    requirements,
    lessons: [{ id: "lesson-a", requirementIds: ["grammar-a"], placementStatus: "rich" }],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.unplaced.map((item) => item.id), ["grammar-b"]);
  assert.equal(result.summary.requiredUnplaced, 1);
});

test("an explicit alias or rejection reason is a terminal audit state", () => {
  const requirements = [
    { id: "grammar-a", kind: "grammar", evidenceSources: ["genki"] },
    { id: "grammar-alias", kind: "grammar", evidenceSources: ["minna"] },
    { id: "advanced-x", kind: "grammar", evidenceSources: ["independent"] },
  ];

  const result = auditSyllabusPlacement({
    requirements,
    lessons: [{ id: "lesson-a", requirementIds: ["grammar-a"], placementStatus: "provisional" }],
    aliases: { "grammar-alias": "grammar-a" },
    rejected: { "advanced-x": "Clearly beyond the N5/N4 plus beginner-intermediate scope." },
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.placedProvisional, 1);
  assert.equal(result.summary.duplicateAlias, 1);
  assert.equal(result.summary.rejectedWithReason, 1);
  assert.equal(result.summary.requiredUnplaced, 0);
});

test("normalization is stable for generated capability keys", () => {
  assert.equal(
    normalizeRequirementKey({ kind: "capability", label: "  Ask / give Permission  " }),
    "capability:ask-give-permission",
  );
});

test("persistent textbook and independent audits are complete at the lesson-evidence layer", () => {
  const genki = loadAudit("genki-i-ii.json");
  const minna = loadAudit("minna-i-ii.json");
  const independent = loadAudit("independent-beginner.json");

  assert.equal(genki.lessons.length, 23, "Genki I + II should contain all 23 lessons");
  assert.equal(minna.lessons.length, 50, "Minna no Nihongo I + II should contain all 50 lessons");
  assert.ok(genki.lessons.every((lesson) => Array.isArray(lesson.requirements) && lesson.requirements.length > 0));
  assert.ok(minna.lessons.every((lesson) => Array.isArray(lesson.requirements) && lesson.requirements.length > 0));
  assert.ok(Array.isArray(independent.requirements) && independent.requirements.length >= 70, "independent audit should cover the approved practical/N5/N4 capability set");

  assert.deepEqual(genki.lessons.map((lesson) => lesson.lesson), Array.from({ length: 23 }, (_, index) => index + 1));
  assert.deepEqual(minna.lessons.map((lesson) => lesson.lesson), Array.from({ length: 50 }, (_, index) => index + 1));
});

test("the syllabus builder can reproduce the checked-in canonical union without dropping evidence", () => {
  const result = spawnSync(process.execPath, ["scripts/build_syllabus_audit.mjs", "--check"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout || "syllabus audit builder failed");
  const canonical = loadAudit("canonical-syllabus.json");
  assert.ok(canonical.summary.required >= 250, "the canonical union should be broad enough to represent both textbooks plus the independent audit");
  assert.equal(canonical.summary.sourceRows, 529, "all 529 source requirement references must survive into the union evidence");
  assert.equal(canonical.sources.length, 3);
});
