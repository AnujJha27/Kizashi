# Textbook-Union Curriculum Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace auto-generated source-dump Journey lessons with an integrated, textbook-backed Kizashi syllabus whose required coverage is the union of Genki I/II, Minna no Nihongo I/II, and an independent N5/N4/practical-Japanese audit.

**Architecture:** Keep the source reservoir available to Library/Practice/review, but make Journey consume only an explicit canonical syllabus. Add machine-readable audit evidence plus union/placement validation, then progressively reorganize Journey lessons around integrated capabilities while preserving item IDs and learner progress.

**Tech Stack:** Next.js 15, React 19, TypeScript/JavaScript, Node test runner, Python ingestion scripts, JSON curriculum/audit data.

**Spec:** `docs/superpowers/specs/2026-09-16-textbook-union-curriculum-design.md`

## Global Constraints

- The required syllabus is the normalized union of Genki I, Genki II, Minna no Nihongo I, Minna no Nihongo II, and the independent Kizashi audit.
- Presence in any one inclusion source is sufficient for inclusion after alias/duplicate normalization.
- `required + unplaced` must fail the audit.
- Unreviewed/provisional content may be learner-visible; review status must not gate syllabus placement.
- Do not copy proprietary textbook prose, dialogues, exercises, examples, or answer keys.
- Preserve existing item IDs and item-based review records wherever possible.
- Source ingestion must never invent learner-facing lessons merely to park imported records.
- The raw source reservoir must remain accessible outside Journey.

---

### Task 1: Remove source-dump Journey generation

**Files:**
- Modify: `scripts/merge_openjlpt_staging.py`
- Modify: `test/content.test.mjs`

**Interfaces:**
- Produces: merged staged packages where unassigned source records remain in category arrays but are not appended to `course.chapters` as `chapter-source-curriculum`.

- [ ] Add a regression test asserting learner course data contains no chapter/lesson generated from the source-dump naming patterns `Expanded source curriculum`, `Vocabulary expansion N`, `Kanji expansion N`, or `Grammar expansion N`.
- [ ] Update `scripts/merge_openjlpt_staging.py` so `source_curriculum_chapter(...)` is no longer used to append unassigned source rows to learner-facing chapters.
- [ ] Preserve unassigned non-rejected rows in vocabulary/kanji/grammar arrays with provenance and review state intact.
- [ ] Ensure existing authored reading/listening curriculum merge behavior remains unchanged.
- [ ] Commit as `fix: stop generating source-dump journey lessons`.

### Task 2: Add canonical syllabus audit core

**Files:**
- Create: `lib/syllabus-audit-core.js`
- Create: `test/syllabus-audit.test.mjs`

**Interfaces:**
- Produces: `normalizeRequirementKey(requirement)`, `buildRequiredUnion(sources)`, `auditSyllabusPlacement({ requirements, lessons, aliases, rejected })`.

- [ ] Write tests for union semantics: a requirement present in only Genki, only Minna, or only independent audit is still required.
- [ ] Write tests proving duplicate aliases collapse into one canonical requirement without weakening source evidence.
- [ ] Write tests proving `required + unplaced` is reported as failure.
- [ ] Write tests proving `duplicate-alias` and `rejected-with-reason` are accepted terminal states only when an explicit canonical target/reason exists.
- [ ] Implement the minimal audit core to satisfy those tests.
- [ ] Commit as `feat: add textbook-union syllabus audit core`.

### Task 3: Add persistent audit evidence registries

**Files:**
- Create: `data/audits/genki-i-ii.json`
- Create: `data/audits/minna-i-ii.json`
- Create: `data/audits/independent-beginner.json`
- Create: `data/audits/canonical-syllabus.json`
- Create: `scripts/build_syllabus_audit.mjs`
- Modify: `test/syllabus-audit.test.mjs`

**Interfaces:**
- Consumes: public syllabus/topic metadata only.
- Produces: normalized canonical requirements with evidence arrays and placement state.

- [ ] Encode all 23 Genki III-edition lesson coverage rows from public syllabus evidence at the level of grammar/construction, form, communicative capability, vocabulary domain, reading/writing skill, and useful-expression/pragmatic topic where publicly documented.
- [ ] Encode Minna no Nihongo Elementary I/II coverage independently, retaining edition/source metadata and lesson number.
- [ ] Encode an independent Kizashi audit covering N5/N4 and practical beginner capabilities from the approved spec.
- [ ] Add `scripts/build_syllabus_audit.mjs` to canonicalize aliases, preserve all evidence sources, and emit `data/audits/canonical-syllabus.json`.
- [ ] Test that every evidence row survives into the canonical union or has an explicit alias/rejection mapping.
- [ ] Commit as `data: add textbook and independent syllabus audits`.

### Task 4: Build explicit integrated Journey syllabus

**Files:**
- Create: `data/kizashi-syllabus.json`
- Modify: `lib/curriculum.ts`
- Modify: `lib/journey-world-core.js`
- Modify: `test/content.test.mjs`
- Modify: `test/journey-world.test.mjs`

**Interfaces:**
- Produces: explicit ordered Journey chapters/lessons with integrated item IDs and requirement IDs.
- Consumes: existing content item IDs; may place provisional source-backed items.

- [ ] Define a coherent N5→N4 lesson sequence around practical capabilities rather than textbook lesson numbers or source categories.
- [ ] Reuse existing coherent lesson IDs where possible; add aliases/migrations for replaced IDs.
- [ ] Each core lesson must integrate appropriate vocabulary plus grammar/kanji and, where available, reading/listening/practice rather than being same-category only.
- [ ] Distribute new items into manageable lesson loads; do not move the entire reservoir into Journey.
- [ ] Ensure requirements identified in the textbook union map to at least one lesson via `requirementIds` or equivalent explicit metadata.
- [ ] Update Journey area mappings for new/renamed lesson IDs without reducing existing world behavior.
- [ ] Add tests for no dump titles, no oversized same-category source batches, valid item IDs, and valid Journey area mapping.
- [ ] Commit as `feat: rebuild journey around integrated syllabus`.

### Task 5: Enforce required-content placement and expose gaps

**Files:**
- Modify: `scripts/build_syllabus_audit.mjs`
- Modify: `lib/content-completeness-core.js`
- Modify: `components/content/lexical-coverage.tsx` or the current Studio completeness surface
- Modify: `test/syllabus-audit.test.mjs`

**Interfaces:**
- Produces: counts/status for `placed-rich`, `placed-provisional`, `duplicate-alias`, `rejected-with-reason`, `required-unplaced`.

- [ ] Resolve canonical requirement placement against the explicit syllabus.
- [ ] Fail the audit if any required requirement remains unplaced.
- [ ] Distinguish content that exists in the reservoir but is not yet in Journey from content genuinely absent from the reservoir.
- [ ] Surface those two gap classes separately in Studio so “we have it but forgot to teach it” is immediately visible.
- [ ] Keep provisional placement valid while preserving personal review status separately.
- [ ] Commit as `feat: enforce textbook-union curriculum placement`.

### Task 6: Fill discovered high-value gaps with original Kizashi content

**Files:**
- Modify/create focused curriculum data files under `data/` rather than one giant generated file.
- Modify: `data/kizashi-syllabus.json`
- Modify: relevant practice/assessment data only where a required concept has no usable teaching/practice surface.

**Interfaces:**
- Consumes: gap report from Task 5.
- Produces: original Kizashi teaching records or provisional placements for every genuine missing required concept.

- [ ] For each `required-unplaced` item that already exists in the reservoir, place the existing canonical item immediately at the earliest prerequisite-safe lesson.
- [ ] For each genuine missing requirement, author the minimum original Kizashi learner contract needed to teach it; preserve evidence/provenance and mark provisional when appropriate.
- [ ] Prefer existing readings/listening/practice contexts for reinforcement before generating new raw banks.
- [ ] Regenerate the placement audit until `required-unplaced = 0`.
- [ ] Commit as `content: close textbook-union syllabus gaps`.

### Task 7: Preserve learner progress across lesson rewrites

**Files:**
- Modify: `lib/session.ts`
- Create/modify: focused lesson migration data/helper if needed
- Modify: `test/journey-world.test.mjs`

**Interfaces:**
- Produces: alias-aware lesson state reads while leaving item-level review records untouched.

- [ ] Add explicit old→new lesson alias mappings only for IDs that actually change.
- [ ] When reading a new lesson state, merge/migrate matching legacy lesson completion without falsely completing unrelated split lessons.
- [ ] Preserve item-based review records, mistakes, notes, and SRS state unchanged.
- [ ] Test representative migrations from old foundation/expansion lesson IDs to new integrated lessons.
- [ ] Commit as `fix: migrate progress into integrated curriculum`.

### Task 8: Documentation and verification

**Files:**
- Modify: `docs/product/MORE_CONTENT.md`
- Modify: any content architecture docs that still describe expansion lessons as learner curriculum.

**Interfaces:**
- Produces: exact audit metrics and documented architecture.

- [ ] Document reservoir-vs-syllabus separation and the union inclusion rule.
- [ ] Record exact Genki/Minna/independent requirement counts, alias counts, provisional/rich placements, and final unplaced count.
- [ ] Run `npm test` and require all Node tests to pass.
- [ ] Run `npm run typecheck` and require success.
- [ ] Run `npm run build` and require success.
- [ ] Verify branch CI/Vercel status before opening a PR.
- [ ] Commit as `docs: report textbook-union curriculum coverage`.

## Self-review

- Every approved inclusion source is represented independently before unioning.
- The plan removes the source-dump generator rather than merely renaming its output.
- The reservoir remains available after Journey cleanup.
- Provisional content can satisfy placement without being mislabeled as reviewed.
- Progress migration is item-safe and lesson aliases are explicit.
- The final audit has a hard `required-unplaced = 0` invariant.
