# Kizashi TODO

## Content acquisition and curriculum expansion

### Phase 1 — content foundation

- [x] Keep the official JLPT blueprint as exam-format calibration only.
- [x] Cache source artifacts locally with checksums and retrieval metadata.
- [x] Stage JMdict as the vocabulary truth layer.
- [x] Stage KANJIDIC2 as the kanji truth layer.
- [x] Stage OpenJLPT as an unofficial, review-required JLPT level spine.
- [x] Stage BCCWJ for frequency enrichment only.
- [x] Stage Irodori for lesson vocabulary, sentence patterns, and kanji progression.
- [x] Stage Marugoto vocabulary/progression references when the local PDF extractor is available.
- [x] Stage JMdict-linked examples and Tatoeba Japanese-English candidates with attribution metadata.
- [x] Preserve source records, licenses, retrieval dates, checksums, and review status.
- [x] Keep imported records out of the learner path until explicitly approved.
- [x] Run the cache-first acquisition command and inspect the generated N5 review package.
- [x] Acquire N4 bridge vocabulary, kanji, grammar, and linked examples for above-level preparation.
- [ ] Review, enrich, classify, and assign imported records to real Journey lessons.
- [ ] Publish only the approved records through the generated Supabase SQL import.

Review tooling is implemented: Content Studio ranks candidates, edits classification/provenance, assigns real Journey lessons, and QA/export scripts refuse incomplete approved records. Human review and SQL application remain intentionally unchecked.

### Phase 2 — lookup and analysis

- [x] Add JMnedict staging for proper-name lookup without treating names as normal JLPT vocabulary.
- [x] Add optional SudachiDict cache metadata for morphology, lemmas, conjugation, and sentence linking.

### Phase 3 — spoken-language enrichment

- [ ] Evaluate CEJC and CSJ for licensed spoken-language frequency and listening realism.
- [ ] Add spoken-language enrichment only after the beginner audio workflow is stable.

## Learning-content quality
- [x] Use official JLPT material for blueprint/calibration only.
- [x] Stage JMdict, KANJIDIC2, OpenJLPT, BCCWJ, Irodori, Marugoto, JMdict
  examples, and Tatoeba candidates with source and checksum metadata.
- [x] Keep imported records out of learner routes until explicit approval;
  preserve record-level and field-level provenance.
- [x] Add JMnedict staging for proper-name lookup without treating names as
  ordinary JLPT vocabulary.
- [x] Add optional SudachiDict cache metadata for lookup and morphology work.
- [x] Rank review candidates using curriculum band, frequency, missing fields,
  prerequisite value, and learner weakness.
- [ ] Build JLPT classifications from reviewed consensus evidence rather than
  one unofficial level spine.
- [x] Show licensed written-frequency signals in the learner entry and admin
  review surfaces.
- [ ] Add licensed spoken-frequency signals after source and field semantics
  are settled.
- [ ] Evaluate CEJC and CSJ for licensed spoken-language enrichment after the
  beginner audio workflow is stable.
- [ ] Evaluate I-JAS for aggregated learner-error patterns and beginner trap
  drills; do not import learner data casually.
- [x] Add a Learner Trap Engine for recurring confusions such as に vs で,
  with contrast-focused weak practice.
- [x] Keep local custom entries and private book notes portable through the
  bounded, opt-in sync snapshot.
- [x] Import local CSV/JSON personal vocabulary lists and map exact matches to
  canonical Kizashi vocabulary without publishing the personal source.
- [ ] Add personal textbook indexes, screenshots, and richer canonical mapping
  where the privacy model is clear.
- [ ] Keep WaniKani as an optional cross-reference only, never as source truth.

## AI generation boundary

- [x] Keep generation server-side, admin-only, rate-limited, validated, and
  draft-only until review.
- [x] Preserve model, target IDs, validation issues, reviewer, timestamps, and
  notes on generated drafts.
- [ ] Add learner-facing sentence explanation, conversation, and writing
  correction only after the deterministic content bank is strong.

- [ ] Grow the N5 syllabus by topic bands with Core, Extended, and Bridge classifications.
- [ ] Expand grammar coverage to a textbook-level beginner sequence with contrasts, prerequisites, mistakes, and contextual examples.
- [x] Expand kanji drills beyond single-reading recognition: readings, useful-word mapping, orthography, and contextual recall.
- [ ] Expand the question bank across every JLPT N5 task family and every major content item.
- [x] Add more original short readings, practical notices, and listening situations with all four N5 listening task types.
- [ ] Keep Japanese facts grounded in structured sources; use AI only for derived explanations and original exercises.
- [ ] Require structural, lexical, grammar, uniqueness, difficulty, and human review gates before publication.

## Product phases

- [x] Ship the no-auth private preview with host-level deployment gating.
- [x] Restore allowlisted auth and opt-in per-user Supabase progress sync (apply `0014_sync_metadata.sql` before use).
- [ ] Add deeper AI explain/conversation/writing features after the core learning loop and content bank are strong.
- [ ] Run the full build, typecheck, tests, and phone/desktop preview before deployment.

## Books and source library

- [x] Add a Books section where the learner can choose an N5 book.
- [x] Store supplied PDFs outside the public asset directory, using a private allowlisted source route.
- [x] Provide native mobile/desktop PDF viewing for each book.
- [x] Add chapter and page navigation, with source links from extracted records.
- [x] Add a review-only book extraction tool with page provenance.
- [ ] Extract vocabulary, kanji, grammar, lesson order, and examples into review-only Kizashi records.
- [x] Preserve book, page, checksum, retrieval, and license/provenance metadata on extracted candidates.
- [x] Show extracted content beside the original PDF page for verification (review notes and page context are local-only).
- [ ] Generate Kizashi-original explanations and drills from approved book facts.

Suggested routes: `/books` and `/books/[bookId]`.

## Extended content intelligence

### Core content stack

- [ ] Treat official JLPT materials as exam blueprint, format calibration, and timing reference only.
- [ ] Use JMdict for canonical vocabulary spellings, readings, meanings, parts of speech, and senses.
- [ ] Use KANJIDIC2 for canonical kanji readings, meanings, strokes, grades, and metadata.
- [ ] Add BCCWJ written-frequency signals to vocabulary priority.
- [ ] Add CEJC spoken-frequency signals to conversation and listening priority.
- [ ] Build JLPT classifications from reviewed consensus evidence rather than one unofficial list.

### Enrichment layers

- [ ] Add Tatoeba as a reviewed example candidate pool with per-sentence attribution.
- [ ] Evaluate I-JAS for aggregated learner-error patterns and beginner trap drills.
- [ ] Add Sudachi/SudachiDict and/or UniDic for tokenization, lemmas, conjugation, and sentence linking.
- [ ] Allow personal notes, textbook indexes, vocabulary lists, and screenshots to map onto canonical Kizashi items.
- [ ] Use WaniKani only as an optional cross-reference for kanji/vocabulary relationships, never as the source of truth.

### Data intelligence

- [ ] Make written frequency and spoken frequency first-class fields in the content model and UI.
- [x] Add field-level provenance so readings, meanings, classifications, and frequency values can be audited independently.
- [x] Add a priority score combining JLPT band/confidence, frequency, prerequisite value, missing fields, and learner weakness.
- [ ] Add a Learner Trap Engine for recurring confusions such as に vs で, with targeted original drills.
- [ ] Keep facts, classifications, inferred signals, and generated teaching material visibly distinct.

Validate access and licensing for every external source before importing or publishing derived content.

Do not scrape or copy Renshuu content. Use licensed/open sources and original Kizashi material.
