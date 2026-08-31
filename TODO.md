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
- [x] Retry the six audited vocabulary extraction errors with pitch-accent-aware parsing; four now merge into canonical records and two corrected rows remain pending review.
- [ ] Review, enrich, classify, and assign imported records to real Journey lessons. The current staged package has 97 approved seed-derived records, 8,345 records remain pending, and none are rejected. The private learner path now releases every non-rejected staged record with an explicit `humanReviewed: false` marker; the admin review queue remains available for cleanup and promotion.
- [ ] Apply the generated Supabase SQL import after the hosted project receives
  migrations 0017–0019. The 47 approved rows and their supported fields,
  classifications, provenance, and lesson links are already published through
  a narrow equivalent REST upsert; pending and rejected records remain excluded.

Review tooling is implemented: Content Studio ranks candidates, edits classification/provenance, assigns real Journey lessons, and QA/export scripts refuse incomplete approved records. Human review remains an optional quality pass for the private learner path; SQL publication still requires approved records.

- [x] Keep large staged review packages resumable with browser IndexedDB; small drafts may use localStorage, and no draft is sent to a server by this path.

### Phase 2 — lookup and analysis

- [x] Add JMnedict staging for proper-name lookup without treating names as normal JLPT vocabulary.
- [x] Add optional SudachiDict cache metadata for morphology, lemmas, conjugation, and sentence linking.

### Phase 3 — spoken-language enrichment

- [x] Evaluate CEJC and CSJ for licensed spoken-language frequency and listening realism; see `docs/product/SOURCE-EVALUATION.md`.
- [x] Add a review-only CEJC aggregate frequency importer and exact-form applier; keep CEJC audio, transcripts, annotations, and raw rows out of the learner bundle.
- [x] Add a review-only CSJ short-unit frequency importer; keep the CC BY-NC-ND source table and all CSJ corpus assets out of the learner bundle.
- [x] Keep I-JAS inputs aggregate-only with a validator that rejects learner IDs, transcripts, audio, and other raw-record fields.
- [x] Wire reviewed CEJC aggregates into distinct spoken-frequency ranking;
  conversation tags, collocations, and original dialogue authoring still need
  reviewed content decisions before they are automated.
- [x] Wire approved I-JAS aggregates into common learner-trap warnings and
  adaptive drill boosts around the learner's level; no learner records enter
  the app.
- [x] Keep corpus evidence subordinate to reliable grammar explanations: never
  infer a teaching rule directly from CEJC or I-JAS counts.
- [x] Keep the bulk audio workflow deferred until exact source terms and a
  justified preservation need exist; BrowserSpeechProvider covers routine
  pronunciation without creating an audio archive.

### Deferred audio roadmap

- [x] Verify **Erin's Challenge (Japan Foundation)** terms for situational
  listening: personal learning and linking are permitted by the site policy;
  video downloading is prohibited, so Kizashi uses an original-page launcher
  and does not copy/re-host Erin audio/video by default.
- [x] Verify **Common Voice Japanese** terms for broad human-speaker exposure:
  the current dataset is CC0 and lists CALL as an intended use, but the service
  terms prohibit re-posting, redistribution, or mirroring and prohibit speaker
  identification. Keep it source-linked unless a different delivery path is
  separately permitted.
- [x] Treat **CEJC audio** as restricted research corpus material: use the
  authorized source launcher for approved listening/access, and do not copy it
  into Supabase, publish it, or use it in learner drills without a matching
  written license.
- [x] Verify Tatoeba and JSUT terms: Tatoeba audio is licensed per contributor/file
  and needs attribution; JSUT permits personal/non-commercial research but does
  not generally permit redistribution. Use only individually cleared Tatoeba
  recordings or a small, justified JSUT subset; do not bulk mirror either.
- [x] Keep Common Voice source-linked rather than mirrored or re-hosted; CC0
  dataset metadata does not override the current dataset service terms.
- [x] Verify the general VOICEVOX terms: future output may be used with required
  VOICEVOX and voice-library/character credits, but selected voice terms remain
  a per-voice gate. Keep Open JTalk as a future local fallback pending its own
  current-term check.
- [x] Store audio provenance with `source`, `speakerId`, `license`, `isSynthetic`, and `speed`, and map every clip to a reviewed vocabulary, grammar, reading, or listening target.
- [x] Keep the fallback chain deterministic: approved remote recording when configured, otherwise BrowserSpeechProvider; reserve ServerTTSProvider for a later approved synthetic source.
- [x] Keep audio archives, generated audio, and private book resources outside GitHub and the public deployment bundle; serve them only through the authenticated private storage route.

### Audio architecture

- [x] Route vocabulary pronunciation, kanji readings, grammar examples, and
  ordinary sentence playback through BrowserSpeechProvider by default.
- [x] Stream explicitly approved human recordings through RemoteAudioProvider
  when a useful external URL exists.
- [x] Reserve ServerTTSProvider for future consistent mock-JLPT dialogues; do
  not generate or persist server audio yet.
- [x] Keep the UI controls consistent: play, replay, slow playback, and the
  existing optional autoplay preference.
- [x] Prefer browser voices whose `voice.lang` begins with `ja`; show a clear
  unavailable message when the device has no Japanese voice.
- [x] Persist metadata only: `audio_source`, optional `audio_url`, speaker
  metadata, license/provenance, `is_synthetic`, and `speech_rate`; store a
  blob only when a specific recording has a documented preservation reason.
- [x] Keep the audio routing map explicit: vocabulary pronunciation, kanji
  readings, grammar examples, and ordinary lesson dialogue use Browser Speech;
  useful human exposure may use Common Voice/Tatoeba/JSUT; future mock-JLPT
  dialogue may use dynamically generated, multi-speaker server TTS.
- [x] Keep the persisted shape equivalent to `{ text, audio_source,
  audio_url, speaker_id, is_synthetic, speech_rate, license, provenance }`;
  browser TTS uses a null URL and zero backend audio storage.

### Immersion / 聞く roadmap

- [x] Add a dedicated Immersion / 聞く surface instead of treating browser TTS
  as the listening curriculum.
- [x] Add exact original-page launchers for the verified Erin N5 situations:
  first-meeting greetings, requests, indicating things, locations, prices, and
  ordering. Scripts/MP3s/videos remain on the original site.
- [x] Review the six selected Erin lessons against Kizashi listening targets
  and annotate their N5 context, target IDs/skills, available script/audio
  resources, and original-site delivery boundary; do not import or re-host the
  provider's media without a specific preservation or embedding permission.
- [x] Keep the source roles distinct: Erin's Challenge for beginner natural
  dialogue, Tatoeba for short sentence audio, Common Voice for speaker
  variation, CEJC for conversation-pattern research, JapanesePod101 only where
  its free-material terms permit use, and original/generated recordings for
  JLPT mock listening.
- [x] Preserve the intended source-purpose map:

  | Purpose | Preferred source |
  | --- | --- |
  | Pronunciation | Browser Speech API |
  | Controlled example sentence | Browser TTS, then Tatoeba where licensed |
  | Beginner natural dialogue | Erin's Challenge (Japan Foundation) |
  | Diverse human voices | Common Voice Japanese, subject to current terms |
  | Real conversation patterns | CEJC aggregate research signal; no raw streaming by default |
  | Polished learner listening | JapanesePod101 free material where permitted |
  | JLPT mock listening | Original/generated dialogues, later server TTS or recorded audio |
- [x] Do not architect around dynamically streaming raw CEJC audio; use CEJC
  primarily as a naturalness/conversation-pattern signal unless approved
  corpus access and licensing cover the exact product use.
- [x] Add three listening modes: **Guided** (level-appropriate audio with
  transcript and tap-for-help), **Listen** (audio first, transcript hidden until
  comprehension answers), and **Immersion** (natural speed with minimal help).
- [x] Add clip metadata for `source`, `level`, `naturalness`, `context`,
  `vocabularyCoverage`, `grammarCoverage`, transcript/translation availability,
  duration, and target skills; choose clips using the learner's known content.
- [x] Add delayed transcript controls: show transcript, replay at a slower
  rate, and explain unknown words only after the learner attempts the clip.
- [x] Add shadowing mode with native audio, repeated listens, shadow-along,
  speak-alone playback, phrase progression, and a next-phrase action.
- [x] Progress assistance from transcript + furigana in early N5, to on-demand
  transcript, to comprehension-first audio, to exam-style no-text listening,
  and finally natural-speed immersion.
- [x] Add a daily **耳慣らし / Ear Warm-up**: three short clips in about two
  minutes—one understandable, one slightly harder, and one normal-speed native
  clip that is explicitly not expected to be fully understood.
- [x] Add an external-source launcher so learners can study linked
  Erin/CEJC/other material from one Kizashi surface without Kizashi downloading,
  proxying, caching, or re-hosting the source audio/data.
- [x] Add an opt-in original-source frame attempt for Erin, CEJC, CSJ, Common
  Voice, Tatoeba, JSUT, and JapanesePod101, with a direct-link fallback when a
  provider blocks framing or login cookies. The iframe loads the provider URL
  directly; it does not grant permission, copy, proxy, cache, mirror, or upload
  source material.
- [x] Add a private learner release path for all non-rejected staged records;
  keep their source-review status pending while attaching
  `contentReview.method = "automatic"` and `humanReviewed = false`.
- [x] Add local-first learner content flags in item detail and practice, with
  optional account-sync/backup persistence, so bad records can be flagged
  during study instead of requiring an 8k-record pre-review pass.

External-source framing nuance is recorded in `docs/product/SOURCE-EVALUATION.md`:
single-user/private use reduces exposure risk but is not a blanket license;
Kizashi stores a launcher URL/provenance only, never downloads, proxies,
caches, mirrors, re-hosts, or uploads third-party source material; the frame is
only a direct browser view and falls back to a new tab when headers, cookies, or
provider behavior block it. CEJC's free service is listen-only for searched
audio/video, while corpus assets are contract-controlled; Erin and every other
source retain their own terms and attribution rules.

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
- [x] Build JLPT classifications from reviewed consensus evidence rather than
  one unofficial level spine.
- [x] Show licensed written-frequency signals in the learner entry and admin
  review surfaces.
- [ ] Publish additional spoken-frequency values after source and field
  semantics are settled; CEJC aggregate values are wired, while CSJ remains a
  local review-only input because its current terms prohibit redistribution.
- [x] Route pronunciation through browser speech by default, with remote audio
  and a reserved server-TTS provider behind the same UI controls.
- [x] Persist audio metadata only: source type, optional external URL, speaker,
  licensing/provenance metadata, and preferred rate; do not persist generated
  pronunciation blobs by default.
- [x] Evaluate CEJC and CSJ for licensed spoken-language enrichment after the
  beginner audio workflow is stable; see `docs/product/SOURCE-EVALUATION.md`.
- [x] Evaluate I-JAS for aggregated learner-error patterns and beginner trap
  drills; retain only the privacy-safe, research-only decision in
  `docs/product/SOURCE-EVALUATION.md`.
- [x] Add a Learner Trap Engine for recurring confusions such as に vs で,
  with contrast-focused weak practice.
- [x] Keep local custom entries and private book notes portable through the
  bounded, opt-in sync snapshot.
- [x] Import local CSV/JSON personal vocabulary lists and map exact matches to
  canonical Kizashi vocabulary without publishing the personal source.
- [x] Add personal textbook indexes, screenshots, and richer canonical mapping
  where the privacy model is clear.
- [x] Support configurable strict or kana-friendly typed-answer matching, with
  unknown-kanji furigana as the recommended default.
- [x] Keep WaniKani as an optional cross-reference only, never as source truth; no integration is enabled without compatible permission.

## AI generation boundary

- [x] Keep generation server-side, admin-only, rate-limited, validated, and
  draft-only until review.
- [x] Preserve model, target IDs, validation issues, reviewer, timestamps, and
  notes on generated drafts.
- [x] Add learner-facing sentence explanation, conversation, and writing
  correction only after the deterministic content bank is strong.

- [x] Grow the N5 syllabus by topic bands with Core, Extended, and Bridge classifications.
- [x] Expand grammar coverage to a textbook-level beginner sequence with contrasts, prerequisites, mistakes, and contextual examples.
- [x] Expand kanji drills beyond single-reading recognition: readings, useful-word mapping, orthography, and contextual recall.
- [x] Expand the question bank across every JLPT N5 task family and every major content item.
- [x] Add more original short readings, practical notices, and listening situations with all four N5 listening task types.
- [x] Keep Japanese facts grounded in structured sources; use AI only for derived explanations and original exercises.
- [x] Enforce deterministic structural, category, uniqueness, and human-approval gates before publication.
- [x] Complete semantic lexical/grammar/difficulty review for every persisted
  authored question; the imported source package contains learning items only,
  while deterministic factory questions remain structurally validation-gated.

## Product phases

- [x] Ship the no-auth private preview with host-level deployment gating.
- [x] Restore allowlisted auth and opt-in per-user Supabase progress sync (apply `0014_sync_metadata.sql` before use).
- [x] Add deeper AI explain/conversation/writing features after the core learning loop and content bank are strong.
- [x] Provide a bounded 2-minute adaptive micro-session alongside the longer quick-drill presets.
- [x] Run the full build, typecheck, and tests locally.
- [ ] Complete the phone/desktop preview before deployment.

## Books and source library

- [x] Add a Books section where the learner can choose an N5 book.
- [x] Store supplied PDFs outside the public asset directory, using a private allowlisted source route.
- [x] Provide native mobile/desktop PDF viewing for each book.
- [x] Add chapter and page navigation, with source links from extracted records.
- [x] Add a review-only book extraction tool with page provenance.
- [x] Extract vocabulary, kanji, grammar, lesson order, and examples into review-only Kizashi records.
- [x] Preserve book, page, checksum, retrieval, and license/provenance metadata on extracted candidates.
- [x] Show extracted content beside the original PDF page for verification (review notes and page context are local-only).
- [x] Generate Kizashi-original explanations and drills from approved book facts.

Suggested routes: `/books` and `/books/[bookId]`.

## Extended content intelligence

### Core content stack

- [x] Treat official JLPT materials as exam blueprint, format calibration, and timing reference only.
- [x] Use JMdict for canonical vocabulary spellings, readings, meanings, parts of speech, and senses.
- [x] Use KANJIDIC2 for canonical kanji readings, meanings, strokes, grades, and metadata.
- [x] Add BCCWJ written-frequency signals to vocabulary priority.
- [x] Add CEJC spoken-frequency signals to content priority from the reviewed
  aggregate import, without copying CEJC corpus content; listening-specific
  source selection remains data/curation-gated.
- [x] Let CEJC and BCCWJ remain distinct spoken-versus-written signals and use
  their combined score to prioritize useful beginner vocabulary.
- [x] Build JLPT classifications from reviewed consensus evidence rather than one unofficial list.

### Enrichment layers

- [x] Add Tatoeba as a reviewed example candidate pool with per-sentence attribution.
- [x] Evaluate I-JAS for aggregated learner-error patterns and beginner trap drills; no learner data is imported.
- [x] Use approved I-JAS aggregate error categories to boost matching adaptive
  drills, while keeping the actual explanation tied to a reliable grammar source.
- [x] Add Sudachi/SudachiDict and/or UniDic for tokenization, lemmas, conjugation, and sentence linking.
- [x] Allow personal notes, textbook indexes, vocabulary lists, and screenshots to map onto canonical Kizashi items.
- [x] Keep WaniKani out of source truth; no integration is enabled without compatible permission.

### Data intelligence

- [x] Make written frequency and spoken frequency first-class fields in the content model and UI.
- [x] Add field-level provenance so readings, meanings, classifications, and frequency values can be audited independently.
- [x] Add a priority score combining JLPT band/confidence, frequency, prerequisite value, missing fields, and learner weakness.
- [x] Add a Learner Trap Engine for recurring confusions such as に vs で, with targeted original drills.
- [x] Keep facts, classifications, inferred signals, and generated teaching material visibly distinct.

Validate access and licensing for every external source before importing or publishing derived content.

Do not scrape or copy Renshuu content. Use licensed/open sources and original Kizashi material.
