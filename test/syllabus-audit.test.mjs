import assert from "node:assert/strict";
import test from "node:test";

import { auditSyllabusPlacement, buildRequiredUnion, normalizeRequirementKey } from "../lib/syllabus-audit-core.js";

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
