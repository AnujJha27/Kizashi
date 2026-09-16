# Textbook-Union Curriculum Rewrite Design

## Goal

Replace Kizashi's source-dump lesson structure with a coherent, textbook-backed N5-to-N4 curriculum while preserving the app's clicky, Journey-first learning experience and its large source reservoir.

## Governing inclusion rule

The canonical Kizashi beginner/intermediate syllabus is the normalized union of:

- Genki I
- Genki II
- Minna no Nihongo I
- Minna no Nihongo II
- an independent Kizashi N5/N4/everyday-Japanese audit

If any one of those sources says a concept, capability, vocabulary domain, useful expression, conjugation/form, kanji target, reading/listening skill, or pragmatic function belongs in the beginner-to-intermediate path, Kizashi includes it after duplicate/alias normalization.

If required content already exists anywhere in the Kizashi reservoir but has no syllabus placement, that is an error to fix immediately rather than an acceptable backlog state.

The only exclusions are duplicates/aliases already represented by a canonical item, malformed or structurally invalid source records, and clearly advanced/out-of-scope material accidentally present in the reservoir. Every exclusion must carry an explicit reason.

## Product principle

Kizashi should not look or behave like a textbook. The interaction model remains Today, Journey, Practice, Immersion, Library, contextual review, and eventually SRS.

The content structure, however, should be as deliberate as a strong textbook sequence. Kizashi should inherit breadth of coverage, prerequisite ordering, useful pedagogical clusters, deliberate recycling of earlier material, and communicative capabilities rather than isolated fact lists.

## Architecture

Separate four layers that are currently too entangled.

### 1. Source reservoir

The large imported/source-backed package remains available to Library, search, Practice, lookup, SRS/review, Immersion linking, and encounter-driven learning. The reservoir does not create Journey lessons merely because records need somewhere to live.

### 2. Coverage evidence

Maintain machine-readable audit registries for Genki I + II, Minna no Nihongo I + II, the independent Kizashi audit, and final canonical inclusion decisions.

Each evidence row preserves source identity, source lesson/volume where applicable, normalized concept/capability, source level if stated, and Kizashi mapping status.

### 3. Canonical syllabus

Build a canonical syllabus of normalized requirements. A requirement may represent grammar/construction, conjugation/form, vocabulary domain or specific high-value item, kanji target, useful expression/chunk, pragmatic function, communicative capability, reading skill, listening skill, or production capability.

Every required row must resolve to one of:

- placed-rich;
- placed-provisional;
- duplicate-alias;
- rejected-with-reason.

`required + unplaced` is not allowed in a passing audit.

### 4. Journey curriculum

Journey contains coherent integrated lessons, not source-category dumps. Each lesson should be built around a usable context/capability and may combine vocabulary, kanji, grammar, useful expressions, reading, listening, contextual practice, optional production, and review/recycling of earlier material.

The exact number of Journey lessons is an output of sensible sequencing. Do not force Kizashi to have exactly 23 Genki-shaped lessons or 50 Minna-shaped lessons.

## Current anti-pattern to remove

The source merge currently groups unassigned records into generated learner lessons such as `Vocabulary expansion 1`, `Kanji expansion 1`, and `Grammar expansion 1` with large same-category chunks.

This behavior must be removed from the learner Journey. Unassigned non-rejected source records remain available corpus content but do not become Journey lessons automatically.

## Textbook audit policy

### Genki I + II

Audit the full publicly documented syllabus for both volumes, including more than grammar: communicative objectives, grammar/constructions, forms/conjugations, vocabulary domains, kanji targets where publicly documented, reading/writing expectations, and useful expressions/pragmatics where publicly documented.

### Minna no Nihongo I + II

Audit both volumes independently. Do not treat Genki coverage as a substitute for Minna coverage. Capture sentence patterns, communicative objectives, practice/capability themes, vocabulary domains, forms/conjugations, and reading/listening/production expectations where publicly documented. Record edition/source metadata rather than silently mixing editions.

### Independent Kizashi audit

Run a separate audit that does not simply reproduce either textbook. It should cover N5/N4 and practical beginner Japanese capability, including identity and introductions; family and people; numbers, money, dates, time, counters; daily routine; food and restaurants; shopping; home and possessions; locations and existence; transport and directions; school/university/work; weather and seasons; health; invitations and plans; requests and offers; permission, prohibition, obligation; reasons and explanations; comparisons; experiences; opinions and quotation; casual speech; giving/receiving; ability/potential; conditions; state/change; transitivity; inference and reported information; passive; causative; politeness/honorific/humble language at the appropriate stage; reading short text, practical information, and connected text; listening for task, key point, quick response, and situational language; and pragmatic/register distinctions.

Cross-check this audit against existing OpenJLPT, Irodori, Marugoto, lexical/grammar coverage registries, and the released Kizashi corpus.

## Placement rules

A trusted-source requirement should be placed at the earliest sensible prerequisite-safe point.

If Genki and Minna disagree on ordering, preserve the disagreement in evidence and choose the earliest placement that does not violate prerequisite dependencies.

If an item exists in the reservoir but lacks full authored enrichment, place it provisionally rather than withholding it. Availability and personal review status remain separate.

## Lesson design rules

Do not create lessons with giant item dumps. A lesson should have a coherent practical identity and a manageable amount of new material. Large coverage requirements should be distributed across multiple lessons and reinforced through later lessons, Practice, SRS, and Immersion.

Examples of suitable lesson identities include Meeting people; Numbers, time, and schedules; Shopping and money; Daily routines; Places and directions; Food and restaurants; Family and describing people; Invitations and plans; Requests, permission, and rules; Casual speech and opinions; Travel and comparisons; Experiences, health, and advice; Giving and receiving; Ability and potential; Conditionals; State and change; Transitivity; Reported information and inference; Passive/causative; and polite/honorific/humble interaction. These are examples, not a fixed list.

## Recycling rule

Core material must recur naturally after introduction. A concept should not be considered well integrated merely because one card exists. The curriculum should create later opportunities through new contexts, reading/listening appearances, grammar contrasts, mixed practice, SRS review, and Immersion recommendations.

## Progress migration

Preserve existing item IDs wherever possible. Lesson IDs may remain stable when the lesson meaning is still coherent. When lessons are replaced or split, provide explicit alias/migration handling so current learner progress is not silently lost or left pointing at dead lessons. Existing review records are item-based and must survive the curriculum rewrite.

## Source import invariant

Source ingestion/build scripts may never invent learner-facing Journey lessons solely to assign unplaced records. Unplaced corpus records remain corpus records.

Add an automated invariant equivalent to `required canonical requirement + no syllabus placement => audit failure` and a separate invariant that learner-facing lesson titles may not match generated dump patterns such as `Vocabulary expansion N`, `Kanji expansion N`, `Grammar expansion N`, or generic `Expanded source curriculum` structures.

## Audit outputs

Create persistent machine-readable outputs under `data/audits/` (or an equivalent focused location) for Genki I + II coverage, Minna I + II coverage, independent beginner/N5/N4 coverage, canonical union decisions, and syllabus placement coverage.

The audit should make it possible to answer what Genki teaches that Kizashi lacks, what Minna teaches that Kizashi lacks, what the independent audit requires that neither textbook contains, which required items already exist in the reservoir but are not placed, which required items are rich versus provisional, which requirements were collapsed as aliases, and which requirements were explicitly rejected and why.

## Quality and provenance

Do not copy proprietary textbook explanations, exercises, dialogues, examples, or answer keys into Kizashi. Use public syllabus/topic metadata as coverage evidence. Kizashi-authored explanations, examples, questions, dialogues, and exercises remain original unless a separately licensed source explicitly permits reuse. Retain source URLs/edition identifiers/evidence metadata for audit purposes.

## Definition of done

This rewrite is complete when:

- no learner-facing source-dump expansion lessons remain;
- the source reservoir remains accessible outside Journey;
- Genki I + II have been audited comprehensively from public syllabus evidence;
- Minna no Nihongo I + II have been audited comprehensively and independently;
- an independent Kizashi N5/N4/practical-beginner audit exists;
- the normalized union of all three audit families defines required syllabus content;
- every required canonical requirement is placed, provisionally placed, collapsed as an alias, or explicitly rejected with reason;
- required + unplaced is zero;
- existing reservoir content missing from the syllabus is promoted immediately when required;
- Journey lessons are integrated and capability-driven;
- material is sequenced with prerequisites and recycled later;
- current progress/review data remains valid through migration;
- automated tests prevent category-dump lessons and unplaced required content from returning;
- content/provenance audits and the production build pass.
