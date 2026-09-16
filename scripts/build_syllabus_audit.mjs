#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { auditSyllabusPlacement, buildRequiredUnion } from "../lib/syllabus-audit-core.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIT_DIR = resolve(ROOT, "data", "audits");
const OUTPUT = resolve(AUDIT_DIR, "canonical-syllabus.json");
const SYLLABUS = resolve(ROOT, "data", "kizashi-syllabus.json");
const SOURCE_FILES = ["genki-i-ii.json", "minna-i-ii.json", "independent-beginner.json"];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function kindForId(id) {
  for (const kind of ["grammar", "form", "domain", "capability", "skill"]) {
    if (id.startsWith(`${kind}-`)) return kind;
  }
  return "requirement";
}

function normalizedRequirement(id, context = {}) {
  return { id, kind: kindForId(id), label: id, ...context };
}

function sourceForAudit(audit) {
  const source = audit.source ?? {};
  const requirements = [];
  for (const id of Array.isArray(audit.requirements) ? audit.requirements : []) {
    if (typeof id === "string" && id.trim()) requirements.push(normalizedRequirement(id.trim()));
  }
  for (const lesson of Array.isArray(audit.lessons) ? audit.lessons : []) {
    for (const id of Array.isArray(lesson.requirements) ? lesson.requirements : []) {
      if (typeof id !== "string" || !id.trim()) continue;
      requirements.push(normalizedRequirement(id.trim(), {
        lesson: lesson.lesson,
        ...(lesson.volume ? { volume: lesson.volume } : {}),
      }));
    }
  }
  return { id: source.id, name: source.name, edition: source.edition, requirements };
}

function auditLessonRequirements(audits) {
  const result = new Map();
  for (const audit of audits) {
    const sourceId = audit.source?.id;
    if (!sourceId) continue;
    for (const lesson of Array.isArray(audit.lessons) ? audit.lessons : []) {
      result.set(`${sourceId}:${lesson.lesson}`, Array.isArray(lesson.requirements) ? lesson.requirements : []);
    }
  }
  return result;
}

function syllabusState(audits) {
  if (!existsSync(SYLLABUS)) return { lessons: [], aliases: {}, rejected: {} };
  const syllabus = readJson(SYLLABUS);
  const rawLessons = Array.isArray(syllabus.lessons)
    ? syllabus.lessons
    : (syllabus.course?.chapters ?? []).flatMap((chapter) => chapter.lessons ?? []);
  const byAuditRef = auditLessonRequirements(audits);
  const lessons = rawLessons.map((lesson) => {
    const requirementIds = new Set(Array.isArray(lesson.requirementIds) ? lesson.requirementIds : []);
    for (const ref of Array.isArray(lesson.auditRefs) ? lesson.auditRefs : []) {
      for (const id of byAuditRef.get(ref) ?? []) requirementIds.add(id);
    }
    return { ...lesson, requirementIds: [...requirementIds] };
  });
  return {
    lessons,
    aliases: syllabus.requirementAliases ?? {},
    rejected: syllabus.rejectedRequirements ?? {},
  };
}

function sourceRowCount(sources) {
  return sources.reduce((count, source) => count + source.requirements.length, 0);
}

function buildOutput() {
  const audits = SOURCE_FILES.map((filename) => readJson(resolve(AUDIT_DIR, filename)));
  const sources = audits.map(sourceForAudit);
  const requirements = buildRequiredUnion(sources).sort((left, right) => left.id.localeCompare(right.id));
  const syllabus = syllabusState(audits);
  const placement = auditSyllabusPlacement({ requirements, lessons: syllabus.lessons, aliases: syllabus.aliases, rejected: syllabus.rejected });
  const sourceRows = sourceRowCount(sources);
  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    sources: sources.map(({ id, name, edition }) => ({ id, name, edition })),
    summary: { ...placement.summary, sourceRows },
    requirements: requirements.map(({ id, kind, evidenceSources }) => ({ id, kind, evidenceSources })),
    unplaced: placement.unplaced.map((item) => item.id),
  };
}

function canonicalComparable(value) {
  return {
    sources: (value.sources ?? []).map((source) => typeof source === "string" ? source : source.id).sort(),
    summary: {
      required: value.summary?.required,
      sourceRows: value.summary?.sourceRows,
      placedRich: value.summary?.placedRich,
      placedProvisional: value.summary?.placedProvisional,
      duplicateAlias: value.summary?.duplicateAlias,
      rejectedWithReason: value.summary?.rejectedWithReason,
      requiredUnplaced: value.summary?.requiredUnplaced,
    },
    requirements: (value.requirements ?? []).map((requirement) => typeof requirement === "string" ? requirement : requirement.id).sort(),
    unplaced: [...(value.unplaced ?? [])].sort(),
  };
}

const output = buildOutput();
const check = process.argv.includes("--check");
if (check) {
  if (!existsSync(OUTPUT)) {
    console.error("canonical-syllabus.json is missing; run node scripts/build_syllabus_audit.mjs");
    process.exit(1);
  }
  const checkedIn = readJson(OUTPUT);
  const expected = canonicalComparable(output);
  const actual = canonicalComparable(checkedIn);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    console.error("canonical-syllabus.json is stale; regenerate it with node scripts/build_syllabus_audit.mjs");
    console.error(JSON.stringify({ expected: expected.summary, actual: actual.summary }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ ok: true, ...output.summary }));
  process.exit(0);
}
writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output: "data/audits/canonical-syllabus.json", ...output.summary }));
