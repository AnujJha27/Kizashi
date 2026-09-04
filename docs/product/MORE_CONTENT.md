# KIZASHI — N5/N4 CONTENT DEPTH, EXAM BANK, AND IMMERSION MASTER MILESTONE

Repository:

`AnujJha27/Kizashi`

This prompt supersedes the previous content-depth / N4 / Irodori milestone prompts and incorporates all of their requirements.

This is an IMPLEMENTATION task.

Do not stop at:

* planning,
* architecture notes,
* TODOs,
* UI mockups,
* empty adapters,
* placeholder data,
* schemas with no content,
* source cards with no actual integration.

Inspect the repository, preserve its existing architecture, implement the milestone, run validation/tests/build, and report exact resulting counts.

Do not ask the user to make routine implementation decisions. Inspect the existing conventions and make the narrowest sensible choice.

---

## Code-backed implementation status

Updated 2026-09-04. This checklist records verified repository state, not
intent. Counts come from `data/staging/kizashi-n5-source-review.json.gz`.

Legend: `[x]` implemented, `[~]` partially implemented or needs broader
coverage/verification, `[ ]` not implemented.

### Current evidence

- [x] The tracked staged package currently contains 7,328 vocabulary, 630 kanji, 413 grammar, 121 reading, and 166 listening records: 8,658 records across 74 lessons; 946 records carry N4 classification and every item is assigned to a Journey lesson. The authored 115-reading and 160-listening banks are now in the same released package as the source reservoir.
- [x] The learner release path exposes every non-rejected staged record immediately with automatic provenance, while merging bundled authored expansions so remote package loading does not hide original reading/listening lessons; pending remains a Studio status, not a learner gate.
- [x] The existing three Irodori item ingestors remain in place and preserve source IDs, field-level provenance, course, and source-level metadata.
- [x] Irodori sentence patterns now have a conservative generated map to 32 canonical Kizashi grammar concepts across 60 source-pattern references; source record IDs, course/level, lesson focus, source URL, attribution, and terms remain attached and source-only grammar cards show that relationship in Learn/Library.
- [x] Irodori now indexes all 72 source-hosted audio lesson pages across Starter, Elementary 1, Elementary 2, and Pre-Intermediate with course/lesson/Can-do metadata in the dedicated Immersion real-life lane; seven curated overlap activities are retained and four currently have explicit Kizashi target mappings.
- [x] Aozora has a rights-filtered metadata shelf and dynamic reader (1 currently curated reusable work); Tadoku has a provider-hosted graded-reading shelf with local opened progress (4 featured books) plus a direct launcher to the provider's complete free catalog.
- [x] Tae Kim, Wikibooks, and Commons/Lingua Libre use the existing external-resource/audio/reference abstractions without copying third-party media into Supabase.
- [x] Shared furigana scaffolding now honors `Always`, `Unknown`, `Tap`, and `Hide` in learner text renderers, including Immersion list/player titles and passages, Aozora/Tadoku titles, Practice text, lesson prompts/answers, selected reading words, learner-assistant output, Library cards and entry headers, Mistake Center entries, Knowledge Map, and the Content Studio review modal; LessonPlayer and Library details fade experienced grammar formation and listening transcripts to explicit support buttons, while Practice builds a compact reading-only index from the full learner module so bounded question loading does not remove readings. Production models are explicit reveals; Content Studio remains fully inspectable for review. Learner routes no longer synchronously parse the large local Studio draft before loading the released package.
- [x] Conjugation Lab is learner-visible as a Focus mode and reuses the existing PracticePlayer for bounded N5/N4 verb and adjective transformations: polite, negative, past, て, ない, た, たい, and adjective forms.
- [x] Erin's registry now indexes all 25 Basic and 25 Advanced provider lesson pages; six curated Basic entries additionally have Kizashi target mappings and direct provider MP4 metadata.
- [x] The learner curriculum contains the original reading target: 115 assets (N5 60, N4 55) across short, mid-length, and information-retrieval families; the listening bank contains 160 N5/N4 scenarios across task-based, key-point, verbal-expression, and quick-response families. Immersion now exposes the full banks progressively instead of showing only the first eight.
- [x] Tatoeba has metadata-only exact-sentence audio resolution through the existing `AudioControls` fallback chain; per-recording license, contributor, sentence page, and remote URL are retained without mirroring audio.
- [x] Japanese with Shun and Nihongo con Teppei are learner-facing provider-hosted listening entries in the shared registry and Immersion `寄り道` shelf; Shun loads a validated rotating catalog from the official YouTube channel feed with a selectable episode and channel fallback, Teppei loads canonical RSS episode metadata with selectable native remote audio and an official-site fallback, and Kizashi stores no media.
- [x] Profile stores up to three optional interest topics; Immersion uses them as a bounded tie-breaker for original reading/listening and Shun/Teppei episode titles while preserving lesson level, weakness, coverage, and naturalness signals.
- [x] Content Studio now separates package quantity, Journey lesson assignment, required learner fields, review workflow status, unique reading/listening contexts, and grammar-depth readiness in a live JLPT completeness dashboard; all 71 authored N5/N4 grammar items now meet the 4-example, 2-mistake, and 2-reviewed-practice-link gate. Visual listening-question counts are reported separately rather than implied by total question volume.
- [x] Content Studio now runs a deterministic authored-bank quality audit: reading is 115/115 unique normalized templates with 0 near-duplicate clusters; listening is 160/160 unique normalized templates with 0 near-duplicate clusters, with question-family and source-type counts visible. The generator now varies listening prompts/scripts and removes the prior exact and cross-level duplicates; all 160 current scenarios remain browser-TTS, so naturalness still needs human-speaker review.
- [x] Pronunciation is now a first-class Immersion activity with 20 authored lessons (15 N5, 5 N4), 60 discrimination items, separate conservative progress states, browser audio fallback, and optional OJAD reference; it never changes JLPT readiness.
- [x] Dictation now has explicit N5/N4 word, phrase, sentence, dialogue-gap, and key-information lanes backed by 155 current activities (N5 75 / N4 80), with harmless punctuation/spacing normalization, mistake recording, and a compact answer-difference display.
- [x] Original verbal-expression listening items now carry scene metadata and render small accessible Kizashi SVG situation illustrations in Lesson and Practice; no third-party image or media is copied.
- [x] The shared staged package includes 946 N4-classified records and N4 source evidence, and the app now derives a dedicated N4 Journey/Learn/Practice path from that reservoir while retaining the authored N4 reading/listening banks.
- [x] Practice routing accepts an explicit N4 target and keeps N5 prerequisite questions available in the same existing PracticePlayer; N5 remains the default route.
- [x] Content Studio has computed source coverage plus a live provenance-gap dashboard showing missing and unknown source IDs by content category from the current source manifest.
- [x] Content Studio now reports computed modality coverage for examples, attached audio, reading/listening checks, and conjugation candidates alongside source coverage.
- [x] The latest staging audit reports 8,658 records with 0 missing provenance, 0 unknown provenance IDs, 0 unlinked lessons, and 0 rejected records; strict package QA is `ready`. The release rule intentionally keeps the 8,333 pending records learner-visible while Studio remains the review workspace.
- [x] Immersion's Real life lane derives 80 speaking situations, 60 constrained writing prompts, 119 pragmatic contexts, and 296 natural collocations from released listening, reading, and vocabulary records. Model audio reuses the existing fallback, revealed attempts can be self-rated through the shared review scheduler, and open writing is explicitly not auto-graded or counted as JLPT readiness.
- [x] Practice includes a focused Micro skills mode for numbers, time, dates, prices, and counters, using canonical N5 vocabulary/kanji/grammar items and the existing MCQ player.
- [x] The eight authored N4 vocabulary bridge items now generate explicit natural-usage questions with complete Japanese sentence options and authored distractors; the larger staged N4 vocabulary reservoir remains review-only for this dimension.
- [x] Integrated context attempts now persist as integrated results even when the session carries its N5/N4 suffix, retaining the blended set and concept-level breakdown for review.
- [x] Today now composes existing review, lesson, quick-practice, listening, and reading activities into one resumable in-place session; duration controls choose the coherent stage sequence without creating a second recommendation engine.
- [x] Practice drill switches now opt out of full release-package hydration and use the bounded bundled/generated bank; lesson, library, Journey, and other full-content routes retain complete release loading.
- [~] Mobile, external-frame, performance, and source-failure behavior have been improved in affected flows; Practice mode/length/topic changes update the controls immediately, unmount the old queue, and keep a visible transition until the new client queue reports ready, route navigation shows immediate feedback and avoids speculative heavy-route prefetching, saved-question validation is idle-scheduled, Practice remounts reuse the cached learner module and merge small local question drafts into the full generated bank, unreviewed generated/AI questions stay out of learner queues until approved, adaptive queue inputs are memoized so ranking does not re-trigger itself on each render, the diagnostic bank is client-side instead of server-generated during navigation, Studio's route no longer generates the full question bank during server render, its full review-package/local-draft work is idle/user initiated and no longer re-runs on question-bank state changes, generated question coverage is explicitly on-demand, its repeated 8k-item review scans are page-local, reading diagnostics are explicit and chunked, Practice furigana construction is bounded to the visible queue while one-record Studio inspection keeps the full learner index, JapaneseText shares cached preference/review-record reads across rendered instances, AI target selection no longer renders the full package as DOM options, the service worker caches the released learner package after first load, html owns vertical scrolling without a competing body scroll container, queue identity is isolated, lesson/Journey grids use `minmax(0, …)` and `min-w-0` to prevent narrow-card clipping, private-book loading accepts both deployed Storage path conventions with a bounded client timeout, failed account-sync writes now persist in a local outbox for reconnect retry, and the shell now provides global keyboard focus rings plus a skip-to-content target; a full end-to-end audit remains.

### Priority tracking

- [~] Priority 1 — Irodori grammar now has 32 canonical concept mappings and an audit-backed learner reference path; source-only rows with no canonical meaning render as labeled Japanese pattern references in Learn and Library instead of blank grammar answers. Source-derived meanings, formations, and example translations remain pending review.
- [~] Grammar coverage union — `scripts/build_grammar_coverage_registry.mjs`, `data/grammar-coverage-union.json`, and Content Studio now compare 75 canonical concepts with cached OpenJLPT, Irodori, the 64 reviewed Irodori mapping references, 21 curated OpenJLPT alias references, Tae Kim, and Wikibooks evidence. The current baseline is N5 224 raw / 46 canonical / 16 complete / 24 partial / 6 missing / 114 unresolved and N4 148 raw / 29 canonical / 0 complete / 25 partial / 4 missing / 111 unresolved; twenty-four dedicated N4 expansion concepts and five N4 life-bridge concepts are placed in lessons, with direction, benefit-perspective, inference/appearance, and conditional contrast clusters linked in the learner curriculum. Content Studio now exposes each canonical concept's evidence count/source IDs and level disagreements. Mapped records are removed from the unresolved queue, while remaining rows stay review-only.
- [~] Vocabulary + kanji coverage union — `scripts/build_lexical_coverage_registry.mjs`, `data/lexical-coverage-union.json`, and Content Studio compare cached OpenJLPT, Irodori, Marugoto, released Kizashi, and staged evidence. Vocabulary currently reports N5 1,704 (153 covered / 534 partial / 1,017 missing) and N4 1,850 (8 / 625 / 1,217); kanji reports N5 125 (80 / 45 / 0; 112 with 3+ useful words) and N4 166 (2 / 159 / 5; 89 with 3+). Status is level-specific; staged rows, per-source level-claim examples, ambiguity, and native-speaker review remain visible.
- [~] Grammar assessment depth — Content Studio now reports 92 approved persisted authored N5 grammar questions across 92 normalized contexts and 55 approved persisted authored N4 grammar questions across 55 normalized contexts (147 form-selection, 5 ordering, 0 text-grammar, and 6 contrast-cluster questions), and 125 text-grammar drafts pending review (50 N5 / 75 N4), each with persisted context IDs/text for review; explicit context-set metadata can collapse variants of one passage across both aggregate and per-family metrics, while generated fallback drills and unreviewed drafts are excluded from learner-ready coverage. The 50 N5 / 75 N4 independent text-grammar target is staged for review, not yet learner-ready.
- [x] Content Studio’s grammar assessment panel now reports those counts by level and includes contrast-cluster questions, so sparse assessment depth is visible beside the curriculum metrics.
- [~] The Irodori grammar audit currently finds 348 source patterns: 51 record-level canonical matches covering 32 concepts, 297 source-only records, 343 partial records, and 0 complete authored learning units. All non-rejected rows remain learner-visible; source-only rows are references rather than silently treated as Kizashi-authored grammar. This is an explicit quality boundary, not a learner-content gate.
- [x] A calculated `scripts/audit_irodori_grammar.py` report now measures Irodori source records by course/source level, canonical pattern matches, duplicate sets, relevance, review status, and learner-field completeness before further mapping work.
- [x] Priority 2 — the existing Irodori resource pipeline emits activity types, course levels, lesson/Can-do metadata, categorized target IDs where reviewed, and provenance; all 72 official lesson activities are learner-visible progressively, while provider-hosted media remains remote.
- [x] Priority 3 — all 25 Basic and 25 Advanced Erin skit pages are indexed; only the six curated Basic entries are currently mapped into Kizashi item context.
- [~] Priority 4 — the deterministic original-reading generator and the complete initial N5/N4 bank are implemented at the required 60 N5 + 55 N4 distribution; the quality audit finds 115 unique normalized templates and no near-duplicate clusters, while human review and non-template expansion remain follow-up work.
- [~] Priority 5 — the deterministic original-listening generator and 160-scenario N5/N4 bank (20 task-based, 20 key-point, 15 verbal-expression, and 25 quick-response items per level) are implemented; the generator accepts level/family/situation/vocabulary/forbidden-context filters, varies three dialogue/question shapes, and the quality audit now reports 0 near-duplicate clusters. All current items use browser TTS, so recorded-speaker naturalness review and richer scenario variation remain. Immersion rotates the first listening slice per browser session so the bank is not presented as the same fixed eight items.
- [x] Priority 6 — dynamic Tatoeba audio is wired for exact sentence matches with reusable API-reported licenses; misses fall through to Browser Speech.
- [x] Priority 7 — Japanese with Shun and Nihongo con Teppei are registered as provider-hosted video/podcast immersion.
- [x] Priority 8 — the Conjugation Lab now derives bounded N5/N4 verb and adjective transformation prompts through the existing PracticePlayer and answer normalization.
- [~] Addendum source providers — Marugoto Plus, JFS Reading Activities, KC Yom Yom, Hirogaru, and OJAD now have learner-visible provider-hosted entries plus bounded activity maps in the shared registry and Immersion `寄り道` shelf. Marugoto Plus also appears as a Learn follow-up when the lesson contains one of its mapped conversation targets. Broader provider catalogs, validated per-activity source audits, and deeper provider-specific pronunciation/reading activities remain follow-up work; the authored pronunciation curriculum is now implemented, and source levels are not converted into JLPT classifications.
- [x] Japanese with Shun now uses the official channel feed (`/api/immersion/shun`) to load a bounded catalog, rotates the first visible choice per browser session, and lets the learner select any returned video; feed failure falls back to the official channel.
- [x] Nihongo con Teppei now uses the official site feed (`/api/immersion/teppei`) to load a bounded episode catalog, rotates the first visible choice per browser session, plays provider-hosted audio when the feed supplies it, and falls back to the original site when it does not.
- [x] Optional profile interests now bias those free reading/listening and provider catalogs without changing the learner's JLPT path or readiness calculations.

This status block must be refreshed whenever a milestone slice is implemented;
unchecked requirements below remain active.

# 1. PRODUCT GOAL

Kizashi should become a serious Japanese-learning system covering:

```text
N5
 ↓
N4
```

through four complementary loops:

```text
LEARN
structured concepts

PRACTICE
retrieval + adaptive review

ASSESS
unfamiliar JLPT-style original material

IMMERSE
real Japanese from human/provider-hosted sources
```

The core philosophy is:

> Kizashi teaches the concept, tests whether the learner can transfer it to unfamiliar material, and then exposes the learner to that Japanese in real human content.

Do not collapse these into one content type.

---

# 2. THE FUNDAMENTAL ARCHITECTURE

The final product architecture should reflect this model:

```text
                           KIZASHI
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
         EXAM MODE                         IMMERSION
            │                                   │
     Kizashi-original                       Human media
            │                                   │
     ┌──────┴───────┐          ┌───────────────┼──────────────┐
     │              │          │               │              │
  Reading        Listening   Irodori          Erin          Tadoku
     │              │          │               │
 generated        generated  audio/read      skits          books
 80/250/250       dialogue
   N5 scale
     │              │
     └──────┬───────┘
            │
  official JLPT blueprint
   for calibration only
```

This is a conceptual architecture.

Do not duplicate existing code simply to mirror the diagram.

Also support:

```text
Tatoeba
→ licensed sentence-level human audio

Commons / Lingua Libre
→ word/phrase pronunciation

Japanese with Shun
→ hosted easy-Japanese video immersion

Nihongo con Teppei
→ hosted beginner podcast immersion

Aozora
→ later native reading

Tae Kim
→ grammar alternative explanation

Wikibooks
→ grammar/reference enrichment
```

---

# 3. CURRENT DATA REALITY

Before changing anything, independently recompute these numbers.

The current staged package is expected to be approximately:

```text
Vocabulary    7,328
Kanji           630
Grammar         413
Reading           6
Listening         6
────────────────────
Total         8,383
```

Do not assume these numbers remain exact if the repository has changed.

Print the actual current numbers first.

The strategic conclusion is already clear:

```text
Vocabulary
████████████████████████████████████
huge reservoir

Kanji
████████
large reservoir

Grammar
█████
large source-record reservoir,
but quality/canonicalization problem

Reading
▏
severe shortage

Listening
▏
severe shortage
```

Do NOT spend this milestone acquiring another large generic vocabulary corpus.

---

# 4. INSPECT EXISTING ARCHITECTURE BEFORE EDITING

At minimum inspect:

```text
README.md
HANDOFF.md
TODO.md

docs/product/CONTENT-SOURCES.md
docs/product/SOURCE-EVALUATION.md

lib/curriculum.ts
lib/types.ts
lib/questions.ts
lib/jlpt.ts
lib/jlpt-core.js
lib/content-validation.ts
lib/audio.ts
lib/immersion-core.js
lib/mastery*
lib/session*
lib/external-resources*
lib/source-coverage*

components/learning/immersion-surface.tsx
components/learning/irodori-practice-card.tsx
components/learning/source-reference-panel.tsx
components/learning/external-source-viewer.tsx
components/learning/external-source-launcher.tsx
components/learning/audio-controls.tsx
components/learning/reading-panel.tsx
components/learning/lesson-player.tsx
components/learning/aozora-shelf.tsx
components/learning/tadoku-shelf.tsx

components/practice/*
components/content/*

scripts/build_phase1_staging.py
scripts/ingest_openjlpt.py
scripts/ingest_irodori_wordlist.py
scripts/ingest_irodori_sentence_patterns.py
scripts/ingest_irodori_kanji.py
scripts/merge_openjlpt_staging.py
scripts/report_phase1_staging.py
scripts/qa_content_package.py

data/n5-foundations.json
data/n5-conversation-expansion.json
data/n5-practical-expansion.json
data/n5-life-expansion.json
data/n4-grammar-expansion.json
data/n5-authored-practice.json

data/source-maps/*
data/staging/*
```

If newer files supersede these, inspect those too.

Do not create:

* another AudioProvider system,
* another provenance system,
* another curriculum engine,
* another SRS system,
* another source registry,

when one already exists.

---

# 5. IMMEDIATE IMPLEMENTATION PRIORITIES

Execute these priorities in this order:

## Priority 1

Fix Irodori grammar ingestion.

Specifically:

* import the example field properly,
* preserve its provenance,
* classify records by Irodori course/source level,
* canonicalize equivalent patterns,
* stop treating source rows as independent learner lessons.

## Priority 2

Build:

```text
ingest_irodori_activities
```

or equivalent.

This is the missing reading/listening/activity acquisition pipeline.

## Priority 3

Index ALL Erin material relevant to immersion:

```text
25 Basic Skits
25 Advanced Skits
```

not six manually selected links.

## Priority 4

Build original Kizashi reading generators calibrated against official N5 and N4 reading families.

## Priority 5

Build original Kizashi listening generators covering all official N5/N4 listening families.

## Priority 6

Wire Tatoeba audio dynamically.

## Priority 7

Add:

```text
Japanese with Shun
Nihongo con Teppei
```

as provider-hosted immersion sources.

All requirements below apply in addition to these priorities.

---

# 6. CONTENT LAYERS MUST REMAIN DISTINCT

Maintain this pipeline:

```text
SOURCE RECORD
      ↓
CANONICAL LEARNING ITEM
      ↓
LEARNING CONTENT
      ↓
REVIEW CONTENT
      ↓
ASSESSMENT CONTENT
      ↓
IMMERSION MAPPINGS
```

Example:

```text
Irodori row:
〜てもいいですか

       ↓

Canonical grammar:
grammar-temoii

       ↓

Kizashi learning lesson:
meaning
formation
intuition
examples
mistakes
contrasts

       ↓

Review:
simple recognition/recall

       ↓

Assessment:
independent JLPT-style contexts

       ↓

Immersion:
Irodori/Erin activity using the concept
```

Do not let these objects collapse into one another.

---

# 7. TARGET LEVEL MODEL

Kizashi must now treat BOTH:

```text
N5
N4
```

as real target levels.

Support a learner preference equivalent to:

```typescript
targetJLPTLevel: "N5" | "N4";
```

Default safely to N5 for existing users.

The learner may browse higher-level content manually.

Recommendations should respect the target.

---

# 8. SOURCE LEVEL AND JLPT LEVEL ARE DIFFERENT

This is non-negotiable.

Do NOT equate:

```text
Irodori A1 = N5
Irodori A2 = N4
Irodori A2/B1 = N3
```

Instead represent both dimensions.

Example:

```typescript
sourceLevel: {
  system: "JF Standard",
  value: "A2"
}

jlptRelevance: {
  level: "N4",
  relationship: "reinforcement",
  confidence: "medium",
  evidenceSourceIds: [...],
  reason: "..."
}
```

Display conceptually:

```text
Source level
A2

Kizashi relevance
N4 reinforcement
```

Never:

```text
Official JLPT Level: N4
```

unless the record genuinely represents Kizashi's reviewed JLPT classification.

---

# 9. IRODORI COURSES

Support:

```text
Starter
Elementary 1
Elementary 2
Pre-Intermediate
```

Preserve official source level:

```text
Starter          → A1

Elementary 1     → A2

Elementary 2     → A2

Pre-Intermediate → A2/B1
```

Do not restrict Irodori to N5.

N4 learners should receive substantial material from:

```text
Elementary 1
Elementary 2
selected Pre-Intermediate activities
```

based on actual concept overlap and difficulty.

---

# 10. IRODORI MUST HAVE TWO FIRST-CLASS ROLES

Irodori is BOTH:

## CURRICULUM ENRICHMENT

Use it for:

```text
vocabulary
kanji
sentence patterns
Can-do goals
practical contexts
example sentences
communicative progression
```

AND:

## IMMERSION

Use it for:

```text
listening
reading
dialogues
shadowing
real-life tasks
situational comprehension
```

Do not make one Irodori system for Learn and another unrelated system for Immersion.

Use common source metadata.

---

# 11. FIX THE IRODORI GRAMMAR IMPORTER

Current behavior loses useful teaching information.

The existing sentence-pattern importer stores an example under source metadata but often produces:

```text
examples: []
```

Fix this.

If a source row contains a valid example:

```text
sourceRecord.example
```

convert it into a learner-facing example candidate while preserving:

```text
source ID
field provenance
course
lesson
original source record
```

Do not label source-derived examples as Kizashi-authored.

---

# 12. IRODORI GRAMMAR CANONICALIZATION

The staged package has hundreds of grammar source records.

Do NOT expose them as hundreds of lessons.

Canonicalize equivalent patterns.

Examples:

```text
Vてもいいですか
〜てもいいですか
Verbて + もいいですか
```

may all map to:

```text
grammar-temoii
```

Use evidence such as:

```text
normalized pattern
formation
meaning
existing aliases
source lesson
manual mappings
existing canonical grammar
```

Do NOT merge solely because two strings are vaguely similar.

Maintain:

```text
sourceGrammarRecordId
       ↓
canonicalGrammarId
```

---

# 13. GRAMMAR AUDIT

Create a real grammar audit.

For the current ~413 staged records compute:

```text
total records

by source
by source course
by source level

canonical matches
canonical concepts
duplicate aliases
potential duplicates
unmapped records

N5 relevance
N4 relevance
above-target
unclassified

pending
approved
rejected
```

Also compute completeness:

```text
has meaning
has formation
has intuition
has usage conditions
has >= 2 examples
has >= 4 examples
has common mistakes
has contrasts
has practice
has assessment contexts
```

Example output:

```text
GRAMMAR AUDIT

Source records            413
Canonical concepts        ...
Mapped                     ...
Unmapped                   ...
Potential duplicate sets   ...

Full learning units        ...
Partial learning units     ...
Source-only records        ...
```

Every number must be calculated.

---

# 14. CANONICAL GRAMMAR TARGET

Do NOT optimize for 413 lessons.

Target a sensible canonical curriculum approximately around:

```text
N5
60–80 strong concepts

N4
80–120 strong concepts
```

These are INTERNAL Kizashi curriculum targets.

They are not official JLPT exhaustive lists.

Reuse prerequisite relationships:

```text
N5 grammar
    ↓
N4 grammar
```

---

# 15. FULL GRAMMAR LESSON CONTRACT

A grammar concept is learner-ready only when it has:

```text
pattern

core meaning

formation

plain-language intuition

usage conditions

at least 4 examples
prefer 5–8 for major concepts

at least 2 common mistakes

prerequisites

contrasts where relevant

mini dialogue / context

practice coverage

assessment coverage
```

A row containing:

```text
pattern + meaning
```

is a SOURCE RECORD, not a full lesson.

---

# 16. GRAMMAR PRACTICE

Important grammar concepts should be tested through genuinely different contexts.

Use, where appropriate:

```text
meaning recognition

form selection

sentence completion

sentence ordering

contextual meaning

contrast/confusion

text grammar

typed production
```

Aim approximately:

```text
8–12 useful contexts
per important grammar concept
```

Do not merely rotate answer options.

---

# 17. GRAMMAR CONTRAST ENGINE

Use existing contrast infrastructure aggressively.

Examples:

```text
は vs が

に vs で

あります vs います

たい vs 欲しい

これ vs それ vs あれ

い-adjective vs な-adjective

てください vs ないでください

から vs まで

前に vs あとで

ている vs simple present where relevant
```

Mistakes involving these pairs should trigger dedicated contrast repair.

---

# 18. KANJI STRATEGY

The current ~630 staged kanji candidates mean acquisition is not the bottleneck.

Do not dump 630 kanji into the N5/N4 Journey.

Build reviewed core subsets.

Teach kanji through vocabulary.

A strong core kanji entry should have:

```text
meaning

common readings in actual words

3–6 useful vocabulary items

sentence examples

components/radical when useful

confusable kanji when useful

human pronunciation where available
```

Do NOT prioritize memorizing every isolated reading.

---

# 19. REVIEW QUESTIONS VS ASSESSMENT QUESTIONS

This distinction must exist explicitly.

## REVIEW QUESTIONS

Derived mechanically from known facts.

Example:

```text
食べる
→ meaning

食べる
→ reading

食べる
→ Japanese recall
```

Purpose:

```text
SRS
recognition
recall
```

## ASSESSMENT QUESTIONS

Independent contexts designed to test transfer.

Example:

```text
new sentence
new dialogue
new notice
new reading
new listening situation
```

Purpose:

```text
JLPT preparation
skill transfer
unfamiliar-context comprehension
```

Never call 1,000 generated flashcard inversions:

```text
1,000 exam questions
```

---

# 20. UNIQUE CONTEXT METRIC

Track:

```text
question count
```

AND:

```text
unique context count
```

Example:

```text
Grammar assessment questions     470
Unique grammar contexts          250

Listening questions              300
Independent listening scenarios  160
```

This protects against fake volume.

---

# 21. READING HAS TWO SEPARATE SYSTEMS

Maintain:

```text
JLPT ASSESSMENT READING
```

and:

```text
IMMERSION READING
```

Do not mix them.

---

# 22. JLPT ASSESSMENT READING

Use ORIGINAL Kizashi material.

Do not copy official JLPT questions.

Do not convert Tadoku books into exam questions.

Do not copy provider passages just because they are convenient.

Use the official JLPT blueprint only for:

```text
task type
difficulty
length
decision type
time pressure
```

---

# 23. OFFICIAL N5 READING CALIBRATION

Use these approximate official scales:

```text
SHORT COMPREHENSION

~80 Japanese characters


MID-SIZE COMPREHENSION

~250 Japanese characters


INFORMATION RETRIEVAL

~250 Japanese characters/material equivalent
```

These are approximate calibration values.

Do not reject a good 270-character passage just because it is not exactly 250.

---

# 24. OFFICIAL N4 READING CALIBRATION

Use approximately:

```text
SHORT

100–200 Japanese characters


MID-SIZE

~450 Japanese characters


INFORMATION RETRIEVAL

~400 Japanese characters/material equivalent
```

Again: approximate calibration, not an exact-length contest.

---

# 25. ORIGINAL READING GENERATOR

Implement a constrained reading-generation pipeline.

Do NOT use:

```text
Generate an N5 reading passage.
```

A generation request must specify:

```text
target JLPT level

reading family

target length range

target grammar IDs

allowed grammar set

target vocabulary

allowed vocabulary set

allowed kanji

unknown-word budget

topic

tested skills

number of questions

forbidden/recently-used contexts
```

Example:

```text
targetLevel = N5

readingType = information-retrieval

length = 220–280 characters

topic = library notice

targetGrammar =
[
  kara-made,
  te-kudasai,
  ni
]

knownVocabularyCoverage >= 90%

questions =
[
  retrieve detail,
  appropriate action
]
```

---

# 26. READING CONTENT TYPES

Create original material including:

```text
personal message

email

short diary

school notice

university notice

store hours

menu

restaurant information

weather plan

train/bus timetable

class timetable

event poster

library notice

shop sale

appointment sheet

simple directions/map

schedule

short narrative

daily routine

family description

travel plan

work/part-time schedule
```

Information-retrieval material should use structured visual layouts where useful.

Do not flatten everything into a paragraph.

---

# 27. READING QUESTION FAMILIES

Use:

```text
specific detail

main idea

reason

sequence

reference

simple inference

appropriate action

information retrieval
```

Avoid repeating:

> What did Tanaka do?

across half the bank.

---

# 28. INITIAL ORIGINAL READING BANK

Create at minimum:

## N5

```text
30 short
15 mid
15 information-retrieval

TOTAL 60
```

## N4

```text
25 short
15 mid
15 information-retrieval

TOTAL 55
```

Initial combined bank:

```text
115 independent reading assets
```

Quality validation overrides raw quantity.

Near-duplicates do not count.

---

# 29. OFFICIAL MOCK DISTRIBUTION CALIBRATION

When constructing representative mock/section practice, approximately respect official composition.

N5 reading is approximately:

```text
3 short
2 mid
1 information retrieval
```

N4 reading approximately:

```text
4 short
4 mid
2 information retrieval
```

Do not claim Kizashi reproduces an official test exactly.

---

# 30. IMMERSION READING

Use:

```text
Irodori
Tadoku
Aozora
other already approved hosted/open sources
```

Purpose:

```text
reading stamina
natural language exposure
vocabulary encounter
grammar encounter
comprehension
```

Do not treat Immersion reading completion as exam mastery.

---

# 31. BUILD `ingest_irodori_activities`

This is mandatory.

Create or extend a pipeline equivalent to:

```text
scripts/fetch_irodori_resources.py
scripts/ingest_irodori_activities.py
```

Follow existing cache-first conventions.

Do not live-scrape Irodori on every page request.

Index useful learning activities from:

```text
Starter
Elementary 1
Elementary 2
Pre-Intermediate
```

---

# 32. IRODORI ACTIVITY MODEL

Capture as much reliable metadata as available:

```typescript
{
  id,

  provider: "irodori",

  course,
  courseLevel,

  lessonNumber,
  lessonTitle,

  canDo,

  activityType,

  sourcePageUrl,

  mediaUrl,

  transcriptAvailable,
  translationAvailable,

  targetGrammarIds,
  targetVocabularyIds,
  targetKanjiIds,

  sourceLevel,

  jlptRelevance,

  tags,

  provenance
}
```

Possible activity types:

```text
listening
reading
dialogue
shadowing
speaking
writing
grammar
vocabulary
real-life-task
```

Adapt this to existing repository types.

---

# 33. IRODORI IN IMMERSION

Irodori MUST appear prominently in Immersion.

Do not hide it in:

```text
External resources
```

Example:

```text
実際の日本語
REAL-LIFE JAPANESE

Irodori · Elementary 1

レストランで

Can-do
Order food and ask a simple question.

Listening · 3 min

Source level
A2

Kizashi relevance
N5 stretch / N4 reinforcement

[ Start ]
```

---

# 34. IRODORI CAN APPEAR IN MULTIPLE MODES

The same activity may appear under:

```text
LISTEN

READ

SHADOW

REAL-LIFE JAPANESE
```

Do not duplicate its progress record.

One source activity:

```text
one canonical activity ID
```

with multiple presentation modes.

---

# 35. IMMERSION INFORMATION ARCHITECTURE

The Immersion page should be organized primarily by learner intent.

Suggested structure:

```text
今日
FOR YOU


聞く
LISTEN


読む
READ


シャドーイング
SHADOW


実際に使う
REAL-LIFE JAPANESE


聞き流し
FREE IMMERSION
```

Do not make the main navigation simply:

```text
Irodori
Erin
Tadoku
Shun
Teppei
```

Providers belong within activity modes.

---

# 36. IRODORI AUDIO

Do NOT mirror Irodori audio into Supabase.

Preferred:

```text
provider-hosted audio
        ↓
RemoteAudioProvider
```

If direct remote playback is unsuitable:

```text
ExternalSourceViewer
```

If framing fails:

```text
open original provider page
```

The core Kizashi lesson must remain functional regardless.

---

# 37. IRODORI LISTENING UX

For suitable activities:

```text
▶ Play

Replay

0.8×
1.0×

Transcript
[ hidden initially ]

Translation
[ optional ]
```

Immersion defaults to:

```text
audio first
```

not transcript first.

---

# 38. SHADOWING MODE

Implement or strengthen a reusable shadowing flow:

```text
1. Listen

2. Listen again

3. Shadow with audio

4. Shadow again

5. Speak without audio
```

For line-segmented material:

```text
▶ もう一度お願いします。

[ replay ]
[ 0.8x ]
```

Do not pretend automatically segmented dialogue is perfect if source boundaries are unknown.

Whole-clip shadowing is acceptable as fallback.

---

# 39. IRODORI → CURRICULUM CONNECTION

After completing Irodori material, surface concepts encountered.

Example:

```text
You encountered

〜てもいい
駅
切符
前に

[ Review these ]
```

Do not automatically add everything to SRS.

---

# 40. CURRICULUM → IRODORI CONNECTION

After learning a relevant grammar concept:

```text
You learned
〜てください

REAL-LIFE PRACTICE

Irodori
Ordering food

[ Listen ]
```

This bidirectional link is a major goal.

---

# 41. ERIN — INDEX THE FULL USEFUL LIBRARY

Index ALL:

```text
25 Basic Skits

25 Advanced Skits
```

Do not maintain only six hand-picked links.

Capture:

```text
lesson number

lesson title

situation

basic / advanced

key communicative function

source page

script availability

audio/video availability

target grammar mappings

target vocabulary mappings

JLPT relevance

source metadata
```

---

# 42. ERIN ROLE

Use Erin primarily for:

```text
situational listening

natural dialogue

shadowing

communicative phrases

real-world context
```

Basic does not automatically mean N5.

Advanced does not automatically mean N4.

Map based on actual linguistic content.

---

# 43. ERIN DELIVERY

Prefer provider-hosted media/source pages.

Do not mirror the whole MP3/video library into Supabase.

Use existing external-source architecture.

Indexing metadata is expected.

Media mirroring is not.

---

# 44. LISTENING ALSO HAS TWO SYSTEMS

Maintain:

```text
JLPT ASSESSMENT LISTENING
```

and:

```text
IMMERSION LISTENING
```

Assessment:

```text
Kizashi-original
controlled
calibrated
repeatable
```

Immersion:

```text
human
real
varied
provider-hosted
```

---

# 45. OFFICIAL LISTENING FAMILIES

Both N5 and N4 use:

```text
task-based comprehension

comprehension of key points

verbal / utterance expressions

quick response
```

Build explicit banks for all four.

---

# 46. ORIGINAL LISTENING GENERATOR

Build a constrained generator.

Generation request must specify:

```text
target level

listening family

situation

number of speakers

target grammar

allowed grammar

target vocabulary

allowed vocabulary

unknown-word budget

desired duration

question

answer structure

forbidden/recent contexts
```

Example:

```text
level = N5

family = task-based

situation = station

grammar =
[
  mae-ni,
  tai
]

dialogue length = 3–6 turns

question =
"What time should they meet?"
```

---

# 47. LISTENING SCRIPT QUALITY

Scripts should sound plausible.

Allow level-appropriate conversational markers:

```text
あの
ええ
じゃあ
そうですか
そうですね
すみません
ちょっと
```

Do not add fillers merely for fake authenticity.

Do not suddenly introduce N2 vocabulary because it sounds “natural.”

---

# 48. INITIAL N5 LISTENING BANK

Create:

```text
20 task-based

20 key-point

15 verbal-expression

25 quick-response

TOTAL 80
```

---

# 49. INITIAL N4 LISTENING BANK

Create:

```text
20 task-based

20 key-point

15 verbal-expression

25 quick-response

TOTAL 80
```

Total:

```text
160 independent listening scenarios
```

One transcript with five questions counts as:

```text
one scenario
```

not five scenarios.

---

# 50. OFFICIAL LISTENING DISTRIBUTION CALIBRATION

Approximate official item distributions can inform representative mock sessions.

N5 approximately:

```text
7 task-based
6 key-point
5 verbal-expression
6 quick-response
```

N4 approximately:

```text
8 task-based
7 key-point
5 verbal-expression
8 quick-response
```

Use these only as calibration.

Do not claim exact official reproduction.

---

# 51. EXAM AUDIO

Use existing audio architecture.

Initial path:

```text
Kizashi original transcript
        ↓
BrowserSpeechProvider
```

Later optional path:

```text
ServerTTSProvider
        ↓
VOICEVOX / configured provider
```

Do not block this milestone on server TTS.

Do not pre-generate 160 MP3 files.

---

# 52. MULTI-SPEAKER SYNTHETIC AUDIO

When multiple Japanese voices are available:

```text
Speaker A
→ Japanese voice A

Speaker B
→ Japanese voice B
```

If only one Japanese voice exists:

use the same voice.

Do not fail.

---

# 53. EXAM LISTENING UX

During assessment:

```text
audio
 ↓
question
 ↓
answer
```

Do NOT show transcript beforehand.

After submission:

```text
transcript
translation/explanation
target concepts
```

may become available.

---

# 54. TATOEBA DYNAMIC AUDIO

Implement Tatoeba as a dynamic micro-listening source.

Flow:

```text
Japanese sentence
       ↓
find compatible Tatoeba human audio
       ↓
license metadata acceptable?
       │
       ├── yes → remote human recording
       │
       └── no  → BrowserSpeechProvider
```

Store:

```text
sentence ID
audio ID
recorder metadata
license
attribution
source URL
```

Do not store audio blobs.

---

# 55. TATOEBA ROLE

Use for:

```text
sentence-level listening

micro-listening

human pronunciation in context

sentence examples
```

Do NOT use it as the main coherent dialogue corpus.

---

# 56. COMMONS / LINGUA LIBRE

Keep their existing role:

```text
word and short-phrase pronunciation
```

Flow:

```text
human pronunciation available
        ↓
RemoteAudioProvider

otherwise
        ↓
BrowserSpeechProvider
```

Do not treat word pronunciation as listening-comprehension content.

---

# 57. JAPANESE WITH SHUN

Add Japanese with Shun as a hosted Immersion provider.

Primary role:

```text
easy Japanese video immersion

N5/N4 listening

real-life vlog Japanese

interviews

natural beginner-accessible speech
```

Do not download/rehost YouTube videos.

Use official YouTube embedding.

---

# 58. SHUN DISCOVERY

Do not manually hardcode five videos and stop.

Build a lightweight provider adapter capable of indexing an appropriate subset of the official channel.

Prefer standard YouTube mechanisms such as:

```text
channel/video metadata
official embed URLs
provider-hosted thumbnails
```

Do not scrape transcripts or premium transcript material.

Cache only useful metadata.

---

# 59. SHUN RESOURCE MODEL

Capture:

```text
video ID

title

published date

duration when available

official URL

embed URL

declared level when supplied by creator

Kizashi estimated relevance

topic

watched/completed state
```

Do not automatically trust a title containing “N4” as canonical curriculum classification.

---

# 60. SHUN IMMERSION UX

Example:

```text
FREE IMMERSION

Japanese with Shun

A Day in Japan

Easy Japanese
N5–N4

Video · 12 min

[ Watch ]
```

Use standard YouTube embed behavior.

---

# 61. NIHONGO CON TEPPEI

Add Nihongo con Teppei Beginner as a provider-hosted audio immersion source.

Role:

```text
extensive listening

beginner natural Japanese

listening stamina

casual Japanese rhythm
```

Do NOT turn the podcast corpus into Kizashi-owned assessment material.

---

# 62. TEPPEI FEED ADAPTER

Use the publisher's canonical podcast feed / RSS metadata if available.

Do not hand-code episode URLs.

Resolve the feed from the official site if necessary.

Cache episode metadata.

Store:

```text
episode ID

title

date

duration if available

episode URL

remote audio enclosure URL if legitimately supplied through the feed

provider

progress
```

Do not copy audio into Supabase.

---

# 63. TEPPEI PLAYER

When provider/feed terms and CORS permit:

```text
remote audio
    ↓
Kizashi audio controls
```

Otherwise:

```text
open original episode
```

Graceful degradation is mandatory.

---

# 64. FREE IMMERSION SECTION

Create a learner-friendly area such as:

```text
聞き流し
FREE IMMERSION
```

Possible content:

```text
Japanese with Shun

Nihongo con Teppei

selected Irodori

selected Erin
```

This mode is not assessment.

No score required.

Track exposure lightly.

---

# 65. IMMERSION FILTERS

Support:

```text
Target level
N5 / N4 / All

Mode
Listen / Read / Shadow

Difficulty
Comfortable / Stretch / Challenge

Provider
Irodori
Erin
Tadoku
Shun
Teppei
Tatoeba
etc.

Length
 min
3–10 min
10+ min
```

Mobile UI must remain clean.

---

# 66. COMPREHENSIBILITY ESTIMATION

Where transcript/text is available, estimate:

```text
known vocabulary %

known grammar %

known kanji %
```

Use actual learner mastery data.

Example:

```text
Vocabulary 91%
Grammar    86%
Kanji      89%

Difficulty
Comfortable
```

If source text is unavailable:

```text
Coverage unavailable
```

Do not invent percentages.

---

# 67. IMMERSION RECOMMENDATION ENGINE

Rank activities using:

```text
target-level relevance

recently learned grammar

weak grammar overlap

known-vocabulary coverage

known-kanji coverage

recent mistakes

difficulty fit

novelty

previous completion
```

Conceptually:

```text
priority =
    targetLevelWeight
  + conceptOverlap
  + weaknessRepair
  + comprehensibility
  + novelty
```

Do not optimize for guilt or streak pressure.

---

# 68. EAR WARM-UP

Implement or enhance:

```text
耳慣らし
EAR WARM-UP
```

Daily 2–5 minutes.

Prefer:

```text
1 comfortable clip

1 target-level clip

1 stretch clip
```

Potential providers:

```text
Irodori
Erin
Tatoeba
Kizashi original
Shun/Teppei short material where suitable
```

Avoid synthetic speech for all three if human audio is available.

---

# 69. TADOKU

Keep Tadoku as:

```text
EXTENSIVE READING
```

Do not:

```text
copy books
modify books
generate quizzes from book text
extract/repackage illustrations
```

Use provider-hosted reading.

Track:

```text
level
title
audio availability
source URL
opened
completed
```

---

# 70. AOZORA

Keep Aozora as:

```text
NATIVE READING
```

Primarily useful for:

```text
advanced N4
post-N4
challenge
```

Use known-vocabulary/difficulty estimates.

Do not label literary works “N4” solely because the heuristic produces a low difficulty score.

Prefer:

```text
Native · Challenge
```

where appropriate.

---

# 71. N4 CURRICULUM

Build N4 from the existing source reservoir.

Use:

```text
OpenJLPT N4
JMdict
KANJIDIC2
Irodori
Marugoto
Tae Kim
Wikibooks
existing curated evidence
```

Do not acquire another generic massive source unless a clearly identified gap requires it.

---

# 72. GENERALIZE CURRICULUM WITHOUT A GIANT REWRITE

Existing code is N5-centric.

Generalize narrowly.

Conceptual API:

```typescript
getCurriculumForTarget("N5")
getCurriculumForTarget("N4")
```

or equivalent.

Do not rename every historical `N5Module` symbol merely for aesthetic cleanliness if doing so risks regressions.

---

# 73. PRACTICE LEVEL ROUTING

Support N4 explicitly.

Conceptually:

```text
/practice?level=N4&mode=vocabulary

/practice?level=N4&mode=kanji

/practice?level=N4&mode=grammar

/practice?level=N4&mode=reading

/practice?level=N4&mode=listening

/practice?level=N4&mode=mixed

/practice?level=N4&mode=section

/practice?level=N4&mode=mini
```

Reuse PracticePlayer.

Do not duplicate it.

---

# 74. MOCK TEST QUALITY GATE

Do not call something:

```text
FULL N5 MOCK
```

or:

```text
FULL N4 MOCK
```

unless sufficient unique content exists.

Check:

```text
independent reading passages

independent listening scenarios

grammar context diversity

vocabulary diversity

question-family coverage
```

If insufficient:

```text
N5 Practice Sampler
```

or:

```text
N4 Section Practice
```

is the correct label.

---

# 75. ORIGINAL CONTENT GENERATION PIPELINE

Extend existing AI-generation infrastructure.

Pipeline:

```text
CURRICULUM TARGET

       ↓

CONSTRAINED GENERATION

       ↓

SCHEMA VALIDATION

       ↓

JAPANESE CONTENT VALIDATION

       ↓

LEVEL VALIDATION

       ↓

VOCAB COVERAGE

       ↓

GRAMMAR COVERAGE

       ↓

ANSWER UNIQUENESS

       ↓

DISTRACTOR QUALITY

       ↓

JLPT-FAMILY VALIDATION

       ↓

NEAR-DUPLICATE CHECK

       ↓

PENDING / VALIDATED CONTENT
```

Do not immediately mark generated material as human-authored.

---

# 76. DUPLICATION DETECTION

Reject fake depth.

Flag questions/passages/dialogues that differ only through:

```text
noun replacement

person-name replacement

number replacement

option rotation

punctuation

minor tense substitution

renaming speakers
```

Use normalized Japanese token overlap plus structural features.

Do not introduce a vector database unless clearly necessary.

---

# 77. SOURCE MATERIAL VS ORIGINAL ASSESSMENT

The boundary is:

```text
IRODORI
ERIN
TADOKU
SHUN
TEPPEI
TATOEBA

        ↓

IMMERSION / REFERENCE / ENRICHMENT
```

and:

```text
KIZASHI-ORIGINAL

        ↓

JLPT ASSESSMENT
```

Do not accidentally create exam questions by copying third-party scripts.

---

# 78. CONTENT STUDIO DASHBOARD

Content Studio must expose the actual situation.

Create a useful dashboard such as:

```text
CONTENT DEPTH

                     N5      N4

Vocabulary           ...     ...

Kanji                ...     ...

Canonical grammar    ...     ...

Full grammar lessons ...     ...

Partial grammar      ...     ...

Reading short        ...     ...

Reading mid          ...     ...

Reading info         ...     ...

Listening task       ...     ...

Listening key point  ...     ...

Listening verbal     ...     ...

Listening quick      ...     ...

Review questions     ...     ...

Assessment questions ...     ...

Unique contexts      ...     ...
```

No fake numbers.

---

# 79. IRODORI AUDIT PANEL

Display:

```text
IRODORI

Starter
activities ...
mapped ...

Elementary 1
activities ...
mapped ...

Elementary 2
activities ...
mapped ...

Pre-Intermediate
activities ...
mapped ...

Listening activities ...
Reading activities ...
Dialogue activities ...

Canonical grammar mappings ...

Unmapped patterns ...

N5-relevant ...

N4-relevant ...
```

---

# 80. GRAMMAR SOURCE PANEL

A canonical grammar concept should show sources such as:

```text
〜てもいいですか

Sources

Kizashi authored

OpenJLPT

Irodori · Elementary 1 · Lesson X

Tae Kim

Wikibooks
```

Source count is evidence, not automatic correctness.

---

# 81. IMMERSION PROGRESS

Track lightweight exposure:

```text
not opened

opened

started

completed

repeated
```

Immersion completion does NOT equal mastery.

It may count as:

```text
exposure
```

only.

---

# 82. STORAGE POLICY

This milestone should add almost no third-party media to Supabase Storage.

Use:

```text
Irodori
→ remote/provider-hosted

Erin
→ remote/provider-hosted

Shun
→ YouTube hosted/embed

Teppei
→ podcast hosted

Tadoku
→ provider-hosted

Tatoeba
→ remote

Commons
→ remote

Kizashi exam audio
→ dynamically synthesized

Aozora
→ source text dynamically where applicable
```

Supabase stores:

```text
metadata
progress
mappings
source IDs
provenance
```

not third-party media mirrors.

---

# 83. FAILURE BEHAVIOR

External source failure must never destroy core study.

Examples:

```text
Irodori unavailable
→ Kizashi lesson still works

Erin unavailable
→ card shows source link/retry

YouTube unavailable
→ open original video

Teppei remote player blocked
→ open provider episode

Tatoeba audio unavailable
→ BrowserSpeechProvider

Commons miss
→ BrowserSpeechProvider

Tadoku iframe blocked
→ open original page
```

---

# 84. MOBILE UX

Immersion should be excellent on mobile.

Audio:

```text
large play button
replay
speed
progress
```

Reading:

```text
comfortable line height

adjustable text size

furigana integration

no horizontal scrolling

resume reading position
```

Filters:

use compact drawer/bottom-sheet patterns.

Do not build desktop-only control panels.

---

# 85. PERFORMANCE

Do NOT ship:

```text
7,000 vocab rows
413 grammar records
1,500 podcast entries
hundreds of video records
```

inside every client bundle.

Use:

```text
server filtering

lazy loading

pagination

API queries

cached provider manifests
```

where appropriate.

---

# 86. LOCAL-FIRST

Preserve Kizashi's local-first behavior.

Learning/review state must continue functioning without Supabase availability.

External immersion obviously requires a network connection when media is remote.

That must not prevent local review/study.

---

# 87. CONTENT TARGETS FOR THIS MILESTONE

## Grammar

Do NOT generate arbitrary grammar concepts simply to hit a number.

Audit the existing ~413 records and construct reviewed canonical N5/N4 curricula.

## Reading

At minimum:

```text
N5
60 independent assets

N4
55 independent assets
```

distributed as specified earlier.

## Listening

At minimum:

```text
N5
80 independent scenarios

N4
80 independent scenarios
```

## Irodori

Index all useful activity metadata across:

```text
Starter
Elementary 1
Elementary 2
Pre-Intermediate
```

subject to source availability.

## Erin

Index:

```text
25 Basic
25 Advanced
```

## Shun

Implemented via the official channel-feed adapter and learner-visible catalog at `/api/immersion/shun`; provider-hosted video and channel fallback remain the boundary.

## Teppei

Implemented via the official RSS adapter and learner-visible catalog at `/api/immersion/teppei`; provider-hosted audio and original-site episode fallback remain the boundary.

## Tatoeba

Implement dynamic licensed human-audio resolution.

---

# 88. QUALITY OVERRIDES COUNTS

If generated content is bad:

reject it.

If near-duplicate:

reject it.

If answer ambiguity exists:

reject it.

If level fit is bad:

downgrade/reclassify/reject it.

Do NOT loosen validators merely to make target counts green.

Report deficits honestly.

---

# 89. TESTS — GRAMMAR

Test:

```text
Irodori example extraction

canonical mapping

alias handling

source-level preservation

JLPT-relevance preservation

no A2=N4 automatic mapping

duplicate detection

lesson completeness

source provenance
```

---

# 90. TESTS — READING

Test:

```text
N5 short

N5 mid

N5 information retrieval

N4 short

N4 mid

N4 information retrieval

length-band sanity

question answer validity

target grammar existence

target vocab existence

near-duplicate detection

unique context accounting
```

---

# 91. TESTS — LISTENING

Test:

```text
all four families

N5/N4 separation

audio text exists

exam transcript hidden initially

review transcript available

dynamic audio fallback

multi-speaker optional behavior

independent scenario count

near-duplicate rejection
```

---

# 92. TESTS — IMMERSION

Test:

```text
Irodori in Listen

Irodori in Read

Irodori in Shadow

Irodori in Real-life Japanese

same Irodori activity uses one progress ID

Erin Basic/Advanced indexed

Tadoku still provider-hosted

Shun embed route

Teppei feed behavior

Tatoeba human-audio fallback

provider failure fallback

completion != mastery
```

---

# 93. TESTS — LEVELS

Test:

```text
N5 target excludes N4-only assessment material

N4 target includes relevant N5 prerequisites

source level and JLPT relevance remain separate

changing target does not erase progress

existing N5 behavior remains compatible
```

---

# 94. REQUIRED IMPLEMENTATION ORDER

Follow this order.

Do not jump straight to UI polish.

## 1

Audit current exact content counts.

## 2

Audit all grammar source records.

## 3

Generalize target-level handling for N5/N4.

## 4

Fix Irodori grammar ingestion.

## 5

Canonicalize Irodori/OpenJLPT grammar mappings.

## 6

Build `ingest_irodori_activities`.

## 7

Integrate Irodori deeply into Immersion.

## 8

Index all Erin Basic + Advanced skits.

## 9

Wire Tatoeba dynamic audio.

## 10

Add Japanese with Shun provider.

## 11

Add Nihongo con Teppei provider.

## 12

Build original reading generator.

## 13

Generate/validate N5 reading bank.

## 14

Generate/validate N4 reading bank.

## 15

Build original listening generator.

## 16

Generate/validate N5 listening bank.

## 17

Generate/validate N4 listening bank.

## 18

Expand grammar assessment contexts.

## 19

Build Content Studio audits.

## 20

Polish mobile Immersion.

## 21

Run complete test/build/QA suite.

---

# 95. DO NOT DO

Do NOT:

```text
add another generic vocabulary source

treat 413 grammar rows as 413 lessons

map CEFR directly to JLPT

copy official JLPT questions

copy Tadoku books

copy podcast transcripts

mirror YouTube videos

mirror Irodori media into Supabase

mirror Erin media into Supabase

mirror Teppei audio

generate assessment questions from copyrighted third-party scripts

count flashcard permutations as exam questions

count multiple questions from one listening transcript as multiple scenarios

ship huge manifests to every client

build a second SRS

build a second audio system

build a second provenance system

replace the existing curriculum engine unnecessarily

perform a giant unrelated refactor

stop after scaffolding
```

---

# 96. LEARNER EXPERIENCE — N5

Example:

```text
TODAY

〜てもいいですか

Learn
✓ Meaning
✓ Formation
✓ Examples
✓ Contrast

Practice
8 contexts

──────────────

REAL JAPANESE

Irodori
Asking permission

Source level · A2
Kizashi · N5 stretch

[ Listen ]

──────────────

ASSESSMENT

New Kizashi-original context
You have not seen this sentence before.

[ Start ]
```

---

# 97. LEARNER EXPERIENCE — N4

Example:

```text
TARGET
JLPT N4

FOR YOU

Grammar
〜ながら

Reading
N4 mid-size · ~450 characters

Listening
Key-point comprehension

Immersion
Irodori · Elementary 2
N4 reinforcement

Free listening
Japanese with Shun
N5–N4

[ Continue ]
```

---

# 98. LEARNER EXPERIENCE — IMMERSION

Example:

```text
聞く
LISTEN

Recommended

Irodori
レストランで
2:48

Vocabulary known · 93%
Grammar known · 88%

Comfortable

[ ▶ Play ]


──────────────

Erin
Making Requests
Basic Skit

Stretch

[ Watch ]


──────────────

Japanese with Shun
Easy Japanese Vlog

Free immersion · 11 min

[ Watch ]


──────────────

Nihongo con Teppei
Beginner Podcast

Free immersion

[ Listen ]
```

---

# 99. LEARNER EXPERIENCE — READING

Example:

```text
読む
READ

JLPT PRACTICE

N5 · Information Retrieval

図書館のお知らせ

[ Start ]


──────────────

EXTENSIVE READING

Tadoku
Level Start

[ Read original ]


──────────────

REAL-LIFE JAPANESE

Irodori
Reading activity

[ Read ]


──────────────

NATIVE CHALLENGE

Aozora Bunko

Known vocabulary · 76%

[ Read ]
```

---

# 100. FINAL REPORT

At completion give an exact report.

## CONTENT COUNTS

```text
N5 vocabulary
N5 kanji
N5 canonical grammar

N5 reading:
short
mid
information retrieval

N5 listening:
task
key
verbal
quick


N4 vocabulary
N4 kanji
N4 canonical grammar

N4 reading:
short
mid
information retrieval

N4 listening:
task
key
verbal
quick
```

---

## GRAMMAR AUDIT

Report:

```text
source grammar records

canonical concepts

mapped records

aliases/duplicates

unmapped records

complete lessons

partial lessons

source-only records

N5 concepts

N4 concepts
```

---

## IRODORI

Report:

```text
Starter activities

Elementary 1 activities

Elementary 2 activities

Pre-Intermediate activities

reading activities

listening activities

dialogue/shadowing activities

grammar mappings

N5 relevance mappings

N4 relevance mappings

unmapped activities
```

---

## ERIN

Report:

```text
Basic skits indexed / 25

Advanced skits indexed / 25

grammar mappings

N5 relevance

N4 relevance
```

---

## IMMERSION PROVIDERS

Report operational status for:

```text
Irodori

Erin

Tadoku

Tatoeba

Commons/Lingua Libre

Japanese with Shun

Nihongo con Teppei

Aozora
```

---

## QUESTION BANK

Current addendum bank evidence: pronunciation has 20 lessons (15 N5, 5 N4), 60 discrimination exercises, and 10 covered topics. Dictation has 155 activities (N5 75 / N4 80): word 15, phrase 40, sentence 65, dialogue-gap 18, and key-information 17. Output derives 80 speaking situations (40 N5 / 40 N4), 60 writing prompts (25 N5 / 35 N4), 119 pragmatic contexts, and 296 collocations from released records. These lanes are self-check learning modes, are not auto-graded, and do not contribute to JLPT readiness.

Report separately:

```text
review questions

assessment questions

unique grammar contexts

independent reading assets

independent listening scenarios
```

---

## STORAGE

Confirm whether ANY third-party media blobs were added to Supabase.

Expected answer:

```text
No large third-party media libraries were mirrored.
```

If anything was stored, explain exactly what and why.

---

## TESTS

Report all commands run and whether they passed:

```text
TypeScript

lint

unit tests

content tests

source tests

strict QA

Next production build

git diff --check
```

Do not hide failed checks.

---

# 101. DEFINITION OF DONE

This milestone is complete only when:

* the existing staged grammar reservoir has been audited;
* source records are distinguished from canonical grammar lessons;
* Irodori examples are no longer discarded;
* Irodori course/source level is preserved;
* JLPT relevance is separately mapped;
* N5 and N4 are both supported target levels;
* Irodori is deeply integrated into Immersion;
* Irodori supports listening, reading, shadowing and real-life practice where source material permits;
* all 25 Erin Basic skits are indexed;
* all 25 Erin Advanced skits are indexed;
* Tatoeba human audio resolves dynamically where valid;
* Japanese with Shun is available as hosted video immersion;
* Nihongo con Teppei is available as hosted podcast immersion;
* N5 has a substantial original reading bank;
* N4 has a substantial original reading bank;
* N5 has a substantial original listening bank;
* N4 has a substantial original listening bank;
* all official N5/N4 reading families are represented;
* all official N5/N4 listening families are represented;
* review questions are distinguished from assessments;
* independent contexts are counted;
* mock labels are gated by actual bank diversity;
* external immersion never becomes a prerequisite for core study;
* third-party media is not mirrored into Supabase unnecessarily;
* mobile Immersion works properly;
* Content Studio exposes actual deficits rather than vanity metrics;
* existing N5 functionality remains intact;
* tests and production build pass.

The final quality test is:

```text
Can the learner learn the concept?

Can they recall it later?

Can they distinguish it from similar Japanese?

Can they solve a new question they have never seen?

Can they understand it in a new reading?

Can they hear it in a new listening scenario?

Can they encounter it in actual Japanese spoken or written by humans?
```

If the answer to those questions is yes, Kizashi has actual learning depth.

If the answer is merely:

```text
"We imported lots of records."
```

the milestone is not complete.
# ADDENDUM — CONTENT COMPLETENESS, OUTPUT SKILLS, AND ADDITIONAL IMMERSION SOURCES

This is an ADDENDUM to the existing:

`KIZASHI — N5/N4 CONTENT DEPTH, EXAM BANK, AND IMMERSION MASTER MILESTONE`

It does **NOT** supersede, replace, relax, or reorder the requirements of that master milestone except where this addendum explicitly introduces additional work.

All previous requirements remain active, including:

* N5/N4 curriculum support,
* grammar auditing and canonicalization,
* Irodori curriculum + Immersion integration,
* full Erin indexing,
* original N5/N4 reading banks,
* original N5/N4 listening banks,
* Tadoku,
* Aozora,
* Tatoeba dynamic audio,
* Commons/Lingua Libre,
* Japanese with Shun,
* Nihongo con Teppei,
* review-vs-assessment separation,
* unique-context accounting,
* source provenance,
* Content Studio auditing,
* local-first operation,
* mobile support,
* provider-hosted third-party media,
* validation and QA requirements.

The purpose of this addendum is to close several remaining content gaps:

```text
pronunciation
phonological awareness
conjugation automaticity
dictation
speaking/output
writing
pragmatics
chunks/collocations
casual-language recognition
micro-skills
additional human reading/listening material
```

Do not interpret this addendum as permission to abandon or postpone the original reading/listening/grammar work.

---

# A1. EXPANDED LEARNING MODEL

Kizashi should now support the following complete learning loop:

```text
                         KIZASHI
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
      LEARN               PRACTICE             ASSESS
       │                    │                    │
 Grammar                Retrieval          JLPT-style
 Vocabulary             Conjugation        unfamiliar
 Kanji                  Dictation          material
 Pronunciation          Contrasts
 Chunks                 Production
       │                    │
       └────────────────────┼────────────────────┐
                            │                    │
                         IMMERSE               OUTPUT
                            │                    │
                       Real Japanese        Speaking
                       Reading              Writing
                       Listening            Responses
                       Shadowing            Reconstruction
```

The learner should increasingly move through:

```text
SEE IT
↓
UNDERSTAND IT
↓
RECOGNIZE IT
↓
RECALL IT
↓
HEAR IT
↓
READ IT
↓
PRODUCE IT
↓
USE IT IN CONTEXT
↓
UNDERSTAND IT IN UNFAMILIAR MATERIAL
```

Do not make every learner complete every stage before progressing.

These are dimensions of competence, not a rigid unlock chain.

---

# A2. DO NOT ADD ANOTHER GENERIC VOCABULARY DATASET

This remains important.

Kizashi already has a very large lexical acquisition reservoir.

Do not spend this addendum acquiring another generic vocabulary corpus.

The remaining content deficit is primarily:

```text
usage
contexts
automaticity
pronunciation
listening discrimination
production
pragmatics
collocations
real Japanese exposure
```

Use the vocabulary already present.

---

# A3. ADD MARUGOTO PLUS AS A REAL LEARNING SOURCE

The existing Marugoto integration is currently much more useful for lexical acquisition than for learner-facing study.

Expand Marugoto Plus into a real source/provider integration.

Its role should include, where source material supports it:

```text
conversation
listening
pronunciation
grammar reinforcement
Can-do practice
speaking prompts
situational Japanese
kanji reinforcement
cultural context
```

Do NOT reduce Marugoto to vocabulary extraction.

Do NOT duplicate Irodori concepts unnecessarily.

Irodori and Marugoto may overlap, but each source record/activity should retain its own provenance.

---

# A4. MARUGOTO PROVIDER MODEL

Create or extend a provider manifest using the existing external-resource architecture.

Capture, where reliably available:

```text
course
source level
topic
Can-do
activity type
source URL
audio/video availability
target grammar
target vocabulary
target kanji
communicative function
JLPT relevance
provenance
```

Source level and JLPT relevance remain separate.

Do not globally assert:

```text
Marugoto A1 = N5
Marugoto A2 = N4
```

Use reviewed mappings.

---

# A5. MARUGOTO PRODUCT ROLE

Marugoto may appear inside:

```text
Learn enrichment
Listen
Shadow
Real-life Japanese
Pronunciation
Speaking practice
```

Do not create a top-level Marugoto silo unless the existing Immersion architecture genuinely benefits from a provider browser.

The primary learner navigation remains activity-oriented.

---

# A6. ADD JF MINNA NO KYOZAI READING MATERIAL

Add Japan Foundation Minna no Kyozai reading resources as another human/practical reading provider.

Prioritize:

```text
JFS Reading Activities
A1
A2
```

These are especially useful for practical reading such as:

```text
menus
advertisements
opening hours
notices
emails
shop information
schedules
real-life information retrieval
```

This material should complement:

```text
Kizashi-original JLPT assessment reading
        ↕
real-world provider reading
        ↕
extensive reading
```

---

# A7. JFS READING ROLE

Treat these resources primarily as:

```text
IMMERSION
PRACTICAL READING
REAL-LIFE READING
```

not as Kizashi-owned assessment material.

Index metadata such as:

```text
title
source level
activity type
topic
practical task
target grammar
target vocabulary
source URL
JLPT relevance
progress
provenance
```

Where appropriate, classify the reading skill:

```text
find a price
find an opening time
choose appropriate option
understand a notice
understand a short message
locate information
```

---

# A8. ADD KC YOM YOM

Add KC Yom Yom as another extensive-reading provider.

Role:

```text
EXTENSIVE READING
```

Index available levels such as:

```text
A1
A2
A2/B1
```

without automatically converting them to JLPT levels.

Track:

```text
title
source level
topic
length if available
audio availability
source URL
provider
JLPT relevance
opened
completed
repeated
```

If audio exists and remote playback is technically appropriate, integrate through the existing audio architecture.

Otherwise preserve provider-hosted behavior.

---

# A9. READING SHOULD NOW HAVE FOUR DISTINCT LANES

The learner-facing reading ecosystem should conceptually contain:

```text
1. JLPT PRACTICE
   Kizashi-original assessment

2. PRACTICAL READING
   Irodori
   JFS Reading Activities
   Marugoto where relevant

3. EXTENSIVE READING
   Tadoku
   KC Yom Yom

4. NATIVE READING
   Aozora
```

Do not display this as four giant tabs unless the existing design supports it elegantly.

The distinction should exist in content metadata and recommendation behavior.

---

# A10. ADD HIROGARU

Add Hirogaru as an interest-driven immersion provider.

Its product role is:

```text
interesting Japanese
topic-driven discovery
natural reading
human video/listening
culture-linked exposure
```

Possible topic categories include areas such as:

```text
music
books
anime/manga
food
cafés/tea
outdoors
temples/shrines
aquariums
culture
```

Use the actual source categories rather than inventing unsupported metadata.

---

# A11. HIROGARU UX

Hirogaru should support a learner experience like:

```text
興味から日本語
LEARN THROUGH INTERESTS

Anime & Manga
Music
Books
Food
Outdoors

────────────

Recommended

Interesting topic
A2 source material
N4 reinforcement

[ Explore ]
```

This should be intentionally less exam-focused.

The goal is:

> consume Japanese because the subject is interesting.

Track lightweight exposure, not mastery.

---

# A12. PRONUNCIATION MUST BECOME A REAL CONTENT AREA

Current audio playback is not enough.

Add an explicit pronunciation/phonology learning layer.

At N5/N4, prioritize practical perceptual and production concepts rather than advanced phonological theory.

Core topics should include:

```text
mora timing

long vowels

small っ / gemination

ん

contracted sounds
きゃ / きゅ / きょ
しゃ / しゅ / しょ
etc.

vowel devoicing awareness

Japanese rhythm

word segmentation

basic sentence intonation

pitch-accent awareness
```

Pitch accent should remain proportional.

Do NOT turn beginner Japanese into an accent-dictionary memorization course.

---

# A13. PRONUNCIATION LESSON EXAMPLES

Examples of useful distinctions:

```text
おばさん
vs
おばあさん
```

```text
きて
vs
きって
```

```text
びょういん
mora awareness
```

```text
きょう
vs
きょ
```

Exercises should test hearing as well as explanation.

---

# A14. PRONUNCIATION CONTENT TYPES

Support:

```text
listen and choose

same/different discrimination

long-vowel discrimination

small-っ discrimination

mora counting

listen and repeat

shadowing

word pronunciation

sentence rhythm

intonation awareness
```

Do not rely purely on written explanations.

---

# A15. OJAD INTEGRATION

Add OJAD as an optional pronunciation/pitch-accent reference source.

Primary role:

```text
pronunciation reference
pitch-accent exploration
verb/adjective accent reference
prosody exploration
```

Do not make OJAD data mandatory for normal N5/N4 progress.

Where practical, expose it through:

```text
Pronunciation details
[ Explore in OJAD ]
```

Use provider-hosted behavior unless current terms clearly support a deeper integration.

Do not bulk mirror the source into Supabase.

---

# A16. PRONUNCIATION PROGRESS

Track pronunciation learning separately from lexical mastery.

Conceptually:

```text
not introduced
aware
discriminates
practised
```

Do not claim:

```text
pronunciation mastered
```

based on one self-study click.

No speech-recognition scoring is required for this milestone.

---

# A17. BUILD A DICTATION SYSTEM

Add Dictation as a first-class Immersion activity (Practice remains the JLPT-style MCQ surface).

Dictation should reuse existing:

```text
audio
Japanese text
answer normalization
mastery
mistake
practice
```

infrastructure. The current learner slice is wired at `lib/dictation-core.js` and `components/learning/dictation-activity.tsx` with deterministic N5/N4 word/phrase/sentence/dialogue-gap/key-information lanes, hear/type/reveal/next behavior, formatting-tolerant normalization, answer differences, and mistake recording.

Do NOT build a parallel testing engine.

---

# A18. DICTATION MODES

Support:

```text
WORD DICTATION

PHRASE DICTATION

SENTENCE DICTATION

DIALOGUE GAP-FILL

KEY-INFORMATION RECONSTRUCTION
```

Progressive difficulty:

```text
N5
word
→ phrase
→ short sentence

N4
sentence
→ multi-turn gap
→ reconstruct key information
```

---

# A19. DICTATION EXAMPLE

Example:

```text
🎧

[ Play ]

Type what you hear:

________________________

Answer:

きのう、友達と映画を見ました。

Difference:

きのう、友達と [映画] を [見ました]。
```

Provide useful comparison.

Do not punish harmless formatting differences.

---

# A20. JAPANESE ANSWER NORMALIZATION

For typed Japanese answers, handle reasonable equivalences.

Examples:

```text
spaces
Japanese/ASCII punctuation
hiragana/katakana where exercise permits
full-width/half-width forms
```

Do NOT automatically treat arbitrary kanji/kana replacements as equivalent where the exercise explicitly tests orthography.

Normalization depends on question intent.

---

# A21. DICTATION AUDIO PRIORITY

Prefer:

```text
human source audio
```

where the exact text and usage boundary allow it.

Possible sources:

```text
Irodori
Erin
Tatoeba
Marugoto
```

Otherwise use:

```text
Kizashi-original text
→ AudioProvider
```

Do not create dictation exercises by copying third-party text where transformation/use is not permitted.

---

# A22. BUILD A CONJUGATION LAB

Add a dedicated:

```text
活用
CONJUGATION LAB
```

or equivalent practice experience.

Grammar explanation alone is not enough.

The learner needs automaticity.

---

# A23. N5 CONJUGATION CONTENT

At minimum cover relevant verb/adjective transformations such as:

```text
polite non-past
polite negative
polite past
polite past negative where curriculum includes it

dictionary form

て-form

ない-form

た-form

たい-form

い-adjective present
い-adjective negative
い-adjective past

な-adjective/copular forms
```

Respect the reviewed Kizashi curriculum rather than blindly treating this list as official N5 requirements.

---

# A24. N4 CONJUGATION EXPANSION

Extend automatically as N4 grammar requires additional forms.

The Conjugation Lab should derive supported forms from canonical grammar metadata where practical.

Avoid giant hardcoded form tables duplicated across components.

---

# A25. CONJUGATION EXERCISE TYPES

Use:

```text
prompt → type transformed form

recognize form

reverse transformation

sentence completion

choose appropriate form

rapid drill

mixed conjugation
```

Examples:

```text
飲む
→ て-form

[ type ]

飲んで
```

```text
行きません
→ plain negative

[ type ]

行かない
```

```text
高い
→ past

[ type ]

高かった
```

---

# A26. CONJUGATION MISTAKE INTELLIGENCE

Track error categories such as:

```text
ichidan/godan confusion

う → って

む/ぶ/ぬ → んで

く → いて

ぐ → いで

す → して

行く exception

する

来る

い-adjective ending errors

な-adjective/copula confusion
```

Use recurring errors to create targeted repair sessions.

---

# A27. ADD MICRO-SKILL PACKS

Create explicit practice banks for high-friction beginner material.

These deserve special treatment because recognition must become automatic.

Support:

```text
numbers

prices

time

minutes

hours

calendar dates

days of week

months

age

duration

people counters

general counters

common object counters

floor numbers

phone numbers

train/platform numbers

quantities
```

---

# A28. MICRO-SKILL MODALITIES

Each micro-skill should combine:

```text
visual recognition
typed recall
audio recognition
context
```

Example:

```text
🎧
ろっぴゃくはちじゅうえん

[ ¥? ]

680円
```

or:

```text
10月8日

[ type reading ]

じゅうがつようか
```

These should become quick 1–3 minute practice sets.

---

# A29. MICRO-SKILL AUTOMATICITY

Track:

```text
accuracy
response speed
recent failures
```

Do not require complicated psychometric modeling.

The purpose is to detect:

> learner eventually gets it right but is painfully slow.

Those items should resurface.

---

# A30. ADD PRODUCTION PRACTICE

Kizashi should include lightweight Japanese output even though JLPT does not test speaking.

Do not let the learner become recognition-only.

Support:

```text
guided speaking

guided written response

sentence construction

situation response

personalized prompt

reconstruction
```

---

# A31. SPEAKING PRACTICE

Do NOT require automatic speech scoring for this milestone.

Use a self-practice model:

```text
Situation
↓
learner speaks
↓
reveal model
↓
hear model
↓
compare
↓
self-rate
```

Example:

```text
SITUATION

You are at a café.

Ask for two coffees.

[ Speak ]

────────

MODEL

コーヒーを二つください。

[ ▶ Hear model ]
```

---

# A32. SPEAKING PROMPT TYPES

N5 examples:

```text
introduce yourself

ask someone's name

order food

ask a price

ask where something is

say what you like

say what you want

ask permission

invite someone

describe your day
```

N4 expands into:

```text
describe what happened

give a reason

compare choices

talk about plans

explain an experience

respond to suggestions

describe simultaneous/sequential actions
```

Use canonical grammar coverage.

---

# A33. WRITING PRACTICE

Add short constrained writing prompts.

Do not try to build an essay-grading product.

N5:

```text
self-introduction

daily routine

simple message

meeting arrangement

short diary

short invitation/reply

describe family/home
```

N4:

```text
longer diary

travel description

reason/explanation

comparison

invitation and response

short email

describe event

give simple advice/opinion where curriculum supports it
```

---

# A34. WRITING FEEDBACK

For initial implementation use:

```text
target grammar checklist

target vocabulary suggestions

model answer

self-comparison
```

If existing AI infrastructure can safely support optional feedback, expose it as an optional tool.

Do not make generative evaluation mandatory.

Do not confidently label open-ended Japanese:

```text
wrong
```

when multiple natural answers exist.

---

# A35. OUTPUT MUST NOT DISTORT JLPT READINESS

Speaking/writing are useful learning modes but are not JLPT N5/N4 test sections.

Keep:

```text
JLPT readiness
```

based on relevant tested modalities.

Output practice can influence:

```text
general Japanese proficiency
```

but must not inflate mock/exam readiness scores.

---

# A36. ADD PRAGMATIC JAPANESE

Create a first-class concept of:

```text
communicative function
```

where useful.

Japanese meaning is not only dictionary semantics.

Teach expressions such as:

```text
すみません

お願いします

どうぞ

そうですか

そうですね

大丈夫です

ちょっと…

分かりました

もう一度お願いします

いいですね
```

through situational meaning.

---

# A37. PRAGMATICS EXAMPLE

Example:

```text
ちょっと…

Dictionary-level meaning:
a little

Possible conversational function:
hesitation
soft refusal
difficulty accepting a request
```

Show context.

Do not teach every occurrence as identical.

---

# A38. PRAGMATIC QUESTION TYPES

Use:

```text
What is the speaker trying to do?

What response is natural?

Which phrase fits this situation?

Why does the speaker use this expression?

What does the hesitation imply?
```

These should be based on level-appropriate contexts.

---

# A39. USE HUMAN SOURCES TO GROUND PRAGMATICS

Prioritize examples/context evidence from:

```text
Irodori
Erin
Marugoto
CEJC-derived aggregate signals where appropriate
```

Do not invent sweeping sociolinguistic rules from one dialogue.

---

# A40. ADD CASUAL-VS-POLITE RECOGNITION

The learner will encounter casual Japanese in human media.

Introduce recognition gradually.

Examples:

```text
食べます
→ 食べる

行きません
→ 行かない

しています
→ している

している
→ してる

では
→ じゃ
```

Only include reductions/forms supported by reviewed level/context.

---

# A41. RECOGNITION MAY LEAD PRODUCTION

For casual Japanese:

```text
recognize earlier
produce later
```

is acceptable.

N5 learners may be taught:

> You may hear this.

without being required to produce it.

Do not flood N5 lessons with advanced colloquial contractions.

---

# A42. IMMERSION TRANSCRIPT HELP

Where human material exposes casual forms:

allow:

```text
tap phrase
↓
canonical form
↓
meaning
```

Example:

```text
何してる？

canonical:
何をしていますか / 何をしている？

meaning:
What are you doing?
```

Use context-sensitive mappings.

---

# A43. ADD CHUNKS / COLLOCATIONS AS A LEARNING LAYER

Vocabulary should increasingly include common multi-word combinations.

Examples:

```text
写真を撮る

薬を飲む

電車に乗る

お風呂に入る

宿題をする

時間がかかる

気をつける
```

Do not treat all language as:

```text
isolated noun
+
isolated verb
```

---

# A44. CHUNK MODEL

Prefer extending existing vocabulary/sentence structures before creating a giant new database category.

If a dedicated type is genuinely cleaner, use something equivalent to:

```typescript
ExpressionItem
```

or:

```typescript
ChunkItem
```

but only if it integrates naturally with:

```text
SRS
practice
reading
listening
lesson content
search
```

Avoid architectural novelty for its own sake.

---

# A45. CHUNK SOURCING

Use:

```text
CEJC spoken-frequency/collocation evidence

BCCWJ written evidence

JMdict expressions

Irodori

Marugoto

reviewed Kizashi examples
```

to prioritize useful chunks.

Corpus frequency is evidence, not a teaching explanation.

---

# A46. CHUNK PRACTICE

Support:

```text
complete the phrase

choose natural collocation

audio recognition

reconstruct chunk

use in sentence
```

Example:

```text
写真を ______

見る
撮る
飲む
乗る

→ 撮る
```

Distractors should be plausible but unambiguous.

---

# A47. IMPROVE SENTENCE CONTENT DEPTH

Create a richer sentence bank connected to canonical concepts.

A sentence record should ideally identify:

```text
vocabulary used

grammar used

kanji used

difficulty

register

source/authorship

audio availability

naturalness/review state
```

Do not generate thousands of disconnected sentences with no pedagogical relation.

---

# A48. SENTENCE DIFFICULTY

Where possible estimate sentence difficulty using:

```text
target grammar

known vocabulary

kanji load

length

source level

register
```

Use this to select:

```text
example
review
dictation
micro-listening
production model
```

appropriately.

---

# A49. CONTENT REUSE IS ALLOWED WHEN PEDAGOGICALLY DIFFERENT

A sentence may be reused across modalities when appropriate:

```text
Learn example
→ later audio dictation
```

but avoid immediate memorization leakage.

Assessment contexts must remain unfamiliar.

Maintain a distinction between:

```text
instructional sentence
review sentence
assessment sentence
```

---

# A50. CONTENT STUDIO — ADD SKILL COVERAGE

Extend Content Studio's audit beyond:

```text
vocab
kanji
grammar
reading
listening
```

to report:

```text
pronunciation lessons

dictation items

conjugation forms

micro-skill drills

production prompts

writing prompts

pragmatic functions

chunks/collocations

shadowing activities
```

Report N5/N4 separately where level mapping applies.

---

# A51. CONTENT STUDIO — MODALITY COVERAGE

For major grammar concepts show something like:

```text
〜てもいい

Teach                 ✓
Examples              6
Review                 ✓
Grammar assessment    9 contexts
Reading appearances   4
Listening appearances 5
Immersion mappings    3
Production prompt     2
Dictation             1
```

Do not require every grammar point to have identical counts.

Use this to identify thin concepts.

---

# A52. SKILL-GAP RECOMMENDATIONS

Recommendations should eventually distinguish:

```text
You know what this means
but struggle to hear it.

You recognize this form
but struggle to produce it.

You read this word correctly
but miss it in audio.

You understand this grammar
but confuse it with X.
```

Reuse existing mistake/mastery infrastructure.

Do not build a massive new learner model unnecessarily.

---

# A53. IMMERSION PROVIDER INVENTORY AFTER THIS ADDENDUM

The Immersion ecosystem should now include:

```text
Irodori
→ practical reading/listening/dialogue

Erin
→ situational human skits

Marugoto Plus
→ Can-do/conversation/pronunciation

JFS Reading Activities
→ practical reading

KC Yom Yom
→ extensive reading

Tadoku
→ extensive reading

Hirogaru
→ interest-driven reading/video

Japanese with Shun
→ easy video immersion

Nihongo con Teppei
→ extensive listening

Tatoeba
→ human sentence micro-listening

Commons / Lingua Libre
→ pronunciation

Aozora
→ native reading

OJAD
→ pronunciation/prosody reference
```

Do not visually dump this list onto the learner.

The system should choose relevant material.

---

# A54. SOURCE DISCOVERY MUST NOT BECOME THE MAIN UI

The learner should usually see:

```text
Listen
Read
Shadow
Speak
Practice
For You
```

not:

```text
Choose one of 13 providers.
```

Provider identity should remain visible but secondary.

---

# A55. ADD INTEREST PREFERENCES IF LOW-COST

If compatible with existing Profile/preferences architecture, allow lightweight topic preferences:

```text
anime/manga
technology
food
travel
music
books
daily life
culture
sports
etc.
```

Use these only to improve Immersion recommendations.

Do not make them mandatory onboarding questions.

Do not build a recommender system rabbit hole.

---

# A56. DIAGNOSTICS SHOULD INCLUDE MODALITY

Extend diagnostic/recommendation logic so weakness can be modality-specific.

Conceptually:

```text
grammar knowledge
vocab knowledge
kanji recognition
reading
listening
audio discrimination
conjugation
```

Speaking/writing do not need formal diagnostic scores initially.

---

# A57. DAILY SESSION MAY MIX MODALITIES

The normal study session should eventually be capable of producing:

```text
3 overdue reviews

1 grammar repair

1 conjugation drill

1 short listening

1 micro dictation

1 short reading
```

instead of:

```text
12 flashcards
```

Do not force every session to contain every modality.

Use available time and weakness priorities.

---

# A58. QUICK MODES

Add useful short-session choices where compatible with existing Practice UX:

```text
2 MIN

Quick review
Ear warm-up
Numbers & time
Conjugation burst
Dictation burst


5 MIN

Grammar repair
Listening sprint
Reading sprint
Output practice
```

Do not overwhelm the main nav with separate permanent pages for each mode.

---

# A59. VALIDATION — PRONUNCIATION

Test:

```text
long-vowel items

small-っ items

mora metadata

audio presence/fallback

pronunciation lesson completeness

no pitch-accent requirement for ordinary completion
```

---

# A60. VALIDATION — CONJUGATION

Test:

```text
ichidan forms

godan forms

する

来る

行く special て/た handling

adjective transformations

accepted-answer normalization

wrong-form rejection
```

Derive forms programmatically where safe.

Maintain explicit exceptions.

---

# A61. VALIDATION — DICTATION

Test:

```text
Japanese answer normalization

punctuation tolerance

spaces

kana expectations

orthography-sensitive mode

audio fallback

answer diff display
```

---

# A62. VALIDATION — OUTPUT

Test:

```text
speaking prompt target grammar exists

model answer exists

writing prompts have target constraints

open-ended prompts are not falsely scored as single-answer MCQs

completion does not equal linguistic mastery
```

---

# A63. VALIDATION — CHUNKS

Test:

```text
linked vocabulary exists

natural collocation metadata

source provenance

no duplicate equivalent chunks

practice distractors remain unambiguous
```

---

# A64. ADDENDUM IMPLEMENTATION PRIORITY

Do not interrupt critical unfinished requirements from the master milestone.

Once the core master milestone work is stable, implement this addendum approximately in this order:

## 1

Expand Marugoto into provider/learning metadata.

## 2

Add JFS Reading Activities.

## 3

Add KC Yom Yom.

## 4

Add Hirogaru.

## 5

Add pronunciation/phonology curriculum.

## 6

Add OJAD reference integration.

## 7

Build Conjugation Lab.

## 8

Build Dictation.

## 9

Build micro-skill packs:

```text
numbers
time
dates
prices
counters
```

## 10

Add chunk/collocation learning.

## 11

Add pragmatic Japanese content.

## 12

Add casual-vs-polite recognition support.

## 13

Add guided speaking practice.

## 14

Add guided writing practice.

## 15

Connect all new modalities to recommendation/mistake systems.

## 16

Add Content Studio modality auditing.

## 17

Run complete tests/QA/build.

If dependencies make a slightly different order more efficient, adjust locally.

Do not use that as justification to omit features.

---

# A65. DO NOT DO

Do NOT:

```text
replace the existing master milestone

delay reading/listening generation in favor of shiny new features

acquire another giant generic vocabulary list

build pronunciation scoring with unreliable speech recognition

turn pitch accent into a mandatory beginner grind

make speaking/writing affect JLPT mock scores

copy provider-owned content into Kizashi without the allowed source boundary

mirror large media libraries into Supabase

make every provider a top-level navigation tab

create another practice engine

create another recommendation engine

create another learner-state model

create another source-provenance model

generate thousands of disconnected example sentences

treat CEFR/JF source levels as JLPT labels

treat exposure as mastery

treat one typed production as mastery

use open-ended writing as single-answer grading

over-engineer before proving learner-visible usefulness
```

---

# A66. REQUIRED LEARNER EXPERIENCE — PRONUNCIATION

Example:

```text
発音
PRONUNCIATION

Long vowels

おばさん
おばあさん

Can you hear the difference?

[ ▶ A ]
[ ▶ B ]

Which did you hear?

────────

Japanese timing uses morae.

おばさん
4 morae

おばあさん
5 morae

[ Try another ]
```

---

# A67. REQUIRED LEARNER EXPERIENCE — CONJUGATION

Example:

```text
活用
CONJUGATION

飲む

て-form

[ __________ ]

Submit

✓ 飲んで

む / ぶ / ぬ
→ んで

[ Next ]
```

---

# A68. REQUIRED LEARNER EXPERIENCE — DICTATION

Example:

```text
聞き取り
DICTATION

▶ Play

[ __________________ ]

Submit

Answer:

明日は八時に駅で会いましょう。

You missed:

八時
会いましょう

[ Replay ]
```

---

# A69. REQUIRED LEARNER EXPERIENCE — MICRO-SKILL

Example:

```text
QUICK DRILL
時間

🎧

しちじよんじゅうごふん

What time?

7:15
7:45
8:15
8:45

→ 7:45
```

---

# A70. REQUIRED LEARNER EXPERIENCE — SPEAKING

Example:

```text
話す
SPEAK

At a restaurant:

Ask for water.

[ Speak ]

────────

MODEL

水をください。

[ ▶ Listen ]

Did you communicate the idea?

Again
Almost
Yes
```

No fake automatic pronunciation grade required.

---

# A71. REQUIRED LEARNER EXPERIENCE — WRITING

Example:

```text
書く
WRITE

Write 2 sentences about what you did yesterday.

Try to use:

Vました
と
で

[ Write ]

────────

Check yourself

Target grammar used:
✓ / —

[ Show model answer ]
```

---

# A72. REQUIRED LEARNER EXPERIENCE — PRAGMATICS

Example:

```text
実際の会話

A:
明日、一緒に映画を見ませんか。

B:
明日はちょっと…。

What is B probably doing?

A. Asking what time
B. Softly declining
C. Saying tomorrow is short
D. Asking to watch longer

→ Softly declining
```

---

# A73. REQUIRED LEARNER EXPERIENCE — CHUNKS

Example:

```text
自然な組み合わせ

写真を ______

見る
飲む
撮る
乗る

→ 撮る

写真を撮る
take a photo

[ ▶ ]
```

---

# A74. FINAL REPORT — ADDENDUM METRICS

In addition to all final-report requirements from the master milestone, report:

```text
Marugoto activities indexed

JFS reading activities indexed

KC Yom Yom resources indexed

Hirogaru resources indexed


Pronunciation lessons

Pronunciation discrimination items

Dictation items:
word
phrase
sentence
dialogue


Conjugation:
verbs covered
forms covered
exercise count


Micro-skill items:
numbers
time
dates
prices
counters


Speaking prompts

Writing prompts

Pragmatics items

Chunks/collocations


Human-audio-backed activities

Synthetic-audio-backed activities
```

Use actual numbers.

---

# A75. ADDENDUM DEFINITION OF DONE

This addendum is complete when:

* the original master milestone remains intact;
* Marugoto is useful beyond vocabulary extraction;
* JFS Reading Activities are learner-visible;
* KC Yom Yom is available as extensive reading;
* Hirogaru provides interest-driven immersion;
* Kizashi explicitly teaches core Japanese pronunciation phenomena;
* pronunciation learning includes listening discrimination;
* OJAD is available as an optional reference where useful;
* Dictation exists as a real practice mode;
* Conjugation exists as a real practice mode;
* numbers/time/dates/prices/counters have focused automaticity drills;
* common chunks/collocations are teachable and reviewable;
* pragmatic Japanese is taught in situations;
* casual-vs-polite recognition is introduced gradually;
* speaking/output prompts exist;
* short writing prompts exist;
* speaking/writing remain separate from JLPT exam scoring;
* new modalities connect to the existing learner/mistake/recommendation system;
* Content Studio reports modality coverage;
* third-party media remains provider-hosted where required;
* mobile interaction is usable;
* tests pass.

The content-quality question added by this addendum is:

```text
Can the learner pronounce what they know?

Can they hear the important sound distinctions?

Can they conjugate without stopping to reconstruct the rule?

Can they write what they hear?

Can they produce a simple response themselves?

Can they understand what a phrase is DOING socially,
not merely translate its dictionary meaning?

Can they recognize natural chunks rather than assembling
Japanese word-by-word?

Can they survive the gap between textbook Japanese
and the real Japanese appearing in human media?
```

If not, the app still has a content gap even if its N5/N4 exam bank is large.
