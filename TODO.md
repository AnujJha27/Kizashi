# Kizashi TODO

Status audited 2026-08-31: the private learner release, learner flags, source
viewer, audio-provider routing, hosted migrations/seed, and GitHub `main` push
are complete. Remaining unchecked items below are intentionally optional source
rights/quality work or the manual browser viewport gate. The complete source
register is [`docs/product/CONTENT-SOURCES.md`](docs/product/CONTENT-SOURCES.md).

## Source-integration milestone — preflight verified, implementation pending

The requested source milestone is specified in
[`docs/product/NEW_SOURCE.md`](docs/product/NEW_SOURCE.md) and planned in
[`docs/superpowers/plans/2026-08-31-source-integration-milestone.md`](docs/superpowers/plans/2026-08-31-source-integration-milestone.md).
The repository audit verified that the milestone extends existing abstractions:
`ContentSource`/`sourceManifest`, `sourceIds`/`fieldSourceIds`, the existing
`AudioProvider` chain, `ExternalSourceViewer`/`ExternalSourceLauncher`, local
external-source progress, Content Studio review gates, the existing reading
text helpers, and the three Irodori ingestors. No second source database or
audio mirror is planned.

### Verified boundaries before implementation

- [x] Record the six-source product roles: Tae Kim = alternative grammar
  intuition; Wikibooks = supplementary reference; Commons/Lingua Libre =
  dynamic human pronunciation; Aozora = native reading; Tadoku = unchanged
  graded reading; Irodori = practical Can-do, vocabulary, patterns, kanji,
  and provider-hosted lesson media.
- [x] Confirm Tae Kim's source page identifies CC BY-NC-SA 3.0. Any adapted
  source text must retain attribution and ShareAlike metadata and remain
  separate from Kizashi-authored explanations.
- [x] Confirm Wikibooks' general text handling is CC BY-SA 4.0/GFDL, while
  page history, footer, and media metadata can impose page/file-specific
  conditions. Prefer API-backed references and avoid bulk copying.
- [x] Confirm Commons/Lingua Libre recordings need file-level license and
  attribution inspection; never assume a global recording license.
- [x] Confirm Aozora distinguishes public-domain/expired-rights works from
  still-protected works and provides separate file-handling guidance. Only
  qualifying works may be rendered through Kizashi's reader.
- [x] Confirm Free Tadoku Books are CC BY-NC-ND 4.0: linking is allowed with
  NPO多言語多読 credit, but Kizashi must not alter, translate, annotate,
  quiz-generate, or re-publish the books.
- [x] Confirm Irodori supports independent study and educational use, while
  site content remains owned by the Foundation/other rights holders. Keep
  source relation, attribution, and provider-hosted media metadata.
- [x] Confirm the storage boundary: no Commons, Irodori, Tadoku, Tae Kim,
  Wikibooks, or Aozora audio/text mirror in Supabase or GitHub; Supabase
  Storage remains for genuinely private user assets.

### Ordered implementation todos

#### 1. Registry and shared source-reference foundation

- [ ] Add one typed registry module, preferably `lib/external-resources.ts`,
  with source ID, pedagogical role, resource type, level, URL, delivery mode,
  target item/skill mappings, attribution, license, and provider metadata.
- [ ] Move the existing Erin, CEJC, CSJ, Common Voice, Tatoeba, JSUT, and
  JapanesePod101 shelf metadata out of `immersion-surface.tsx` into the
  registry; preserve the existing Erin lesson selector and six exact URLs.
- [ ] Add registry entries for Tae Kim, Wikibooks, Commons/Lingua Libre,
  Aozora, Tadoku, and Irodori without adding six publisher-directory routes.
- [ ] Keep external-resource metadata distinct from `ContentSource`: use the
  existing source manifest/provenance model for content fields and the new
  registry only for learner-facing resource delivery.
- [ ] Add a small resolver/filter API so grammar, vocabulary, lessons,
  immersion, reading, and Content Studio can request resources by item ID,
  skill, role, or tag.
- [ ] Add tests proving links are centralized, source roles are preserved, and
  a missing optional resource never removes core Kizashi content.

#### 2. Commons/Lingua Libre dynamic pronunciation

- [ ] Add `lib/sources/commons-audio.ts` using the Wikimedia/MediaWiki APIs,
  not HTML scraping, with an injectable fetch boundary for deterministic tests.
- [ ] Add `app/api/audio/commons/route.ts` as a same-origin metadata resolver;
  it may return remote metadata but must never proxy or persist the audio blob.
- [ ] Resolve only actual audio and rank exact Japanese label, exact reading,
  Lingua Libre Japanese pronunciation, then other clearly Japanese recordings.
  Reject filename-only fuzzy matches.
- [ ] Read `imageinfo`/`extmetadata` and retain remote audio URL, file page,
  label, creator/speaker metadata, license, license URL, attribution, source,
  and collection.
- [ ] Reject non-audio, missing/incompatible-license, and ambiguous results;
  return a typed miss so the caller can use BrowserSpeechProvider.
- [ ] Cache successful metadata and misses briefly using the Next/server or
  browser cache already available; do not add a persistent audio table.
- [ ] Add unit tests for exact match, non-audio rejection, license rejection,
  attribution retention, cache hit/miss, and no-result fallback.

#### 3. Existing audio-flow extension

- [ ] Extend the current `AudioProvider` flow in `lib/audio.ts` rather than
  replacing it: explicit approved remote recording, Commons resolution, then
  BrowserSpeechProvider.
- [ ] Add the smallest request/metadata field needed to identify a Commons
  lookup target; keep `AudioMetadata` as the persisted shape.
- [ ] Keep BrowserSpeechProvider as the default for vocabulary, kanji, grammar
  examples, ordinary sentences, and lesson dialogue.
- [ ] Preserve play, replay, slow playback, autoplay, preferred rate, Japanese
  voice selection, and the current graceful unavailable-device message.
- [ ] Show “human recording” and a compact attribution/info affordance without
  putting legal text in the main study card.
- [ ] Test that Commons failure and remote playback failure both fall back to
  BrowserSpeechProvider and that no blob/storage write path is introduced.

#### 4. Reusable grammar/reference panel

- [ ] Add `components/learning/source-reference-panel.tsx` with the roles
  alternative explanation, reference, human pronunciation, graded reader,
  real-world practice, and native reading.
- [ ] Integrate the panel into the existing grammar detail surface without
  replacing Kizashi's explanation, formation, examples, mistakes, or practice.
- [ ] Show attribution/license/source details behind an info control and keep
  source-derived excerpts visually separate from authored Kizashi text.
- [ ] Add failure rendering that leaves the grammar page fully usable when a
  remote reference cannot load.
- [ ] Add component/source-resolution tests for optional and missing references.

#### 5. Tae Kim deep-link mappings

- [ ] Add `data/source-maps/tae-kim.json` for a small reviewed set of existing
  grammar IDs, using specific section URLs and a relationship label such as
  `alternative-explanation`; do not map every item to the homepage.
- [ ] Resolve mappings through the registry/reference panel and preserve the
  Kizashi explanation as canonical for curriculum and practice.
- [ ] Include the verified CC BY-NC-SA 3.0 attribution/ShareAlike metadata in
  the registry/docs; keep any future cached/adapted prose review-only.
- [ ] Add tests for mapping resolution, deep-link URLs, missing mapping, and
  “external reference unavailable does not break grammar.”
- [ ] Defer `scripts/ingest_tae_kim.py` unless a concrete review-only excerpt
  use is approved; linking is enough for the first end-to-end example.

#### 6. Wikibooks API reference

- [ ] Add `lib/sources/wikibooks.ts` with `getWikibooksSection({ page,
  section? })`, MediaWiki API requests, response typing, minimal sanitization,
  and short-lived caching.
- [ ] Add `app/api/reference/wikibooks/route.ts` with input validation and a
  typed error response; never write fetched reference prose to Supabase.
- [ ] Add a few reviewed mappings for particles, counters, conjugation, and
  pronunciation/pitch-accent lookup where the existing curriculum benefits.
- [ ] Show a small attributed excerpt only when the API returns safe structured
  content; otherwise show the source launcher and keep Kizashi content intact.
- [ ] Add tests for section parsing, sanitization, attribution/source URL,
  cache behavior, API failure, and missing mapping.

#### 7. Irodori learner-facing enrichment

- [ ] Preserve and test `ingest_irodori_wordlist.py`,
  `ingest_irodori_sentence_patterns.py`, and `ingest_irodori_kanji.py`; do not
  create a replacement ingestion pipeline.
- [ ] Add a resource manifest generator only for official metadata needed by
  the learner UI, preferably `scripts/ingest_irodori_resources.py`; keep raw
  media out of staging, GitHub, and Supabase Storage.
- [ ] Store course, lesson, Can-do, official URL, available resource types,
  listening/audio availability, target item IDs, source terms, and retrieval
  metadata as review-only source metadata.
- [ ] Add separate Irodori lesson/Can-do mappings; never put Irodori level or
  Can-do into `curriculum_classifications` as JLPT truth.
- [ ] Surface “Real-world practice” on overlapping Learn/Journey lessons with
  an original lesson link or provider-hosted `RemoteAudioProvider` URL.
- [ ] Add a practical follow-up card for at least one existing N5 lesson, with
  attribution and a failure fallback to the normal Kizashi lesson.
- [ ] Add tests for manifest parsing, Can-do mapping, remote audio metadata,
  no-JLPT-classification leakage, and preservation of existing ingestor output.

#### 8. Tadoku beginner reading shelf

- [ ] Add a small source manifest of official Free Tadoku Books containing only
  published metadata: title, level, genre, original URL, audio availability,
  approximate length, and provider attribution.
- [ ] Mark Tadoku entries non-transformable and do not extract book text,
  illustrations, translations, explanations, tests, or generated questions.
- [ ] Reuse `ExternalSourceViewer`/`ExternalSourceLauncher` for source-hosted
  reading and frame/link fallback; show one useful beginner shelf rather than
  a directory of duplicated pages.
- [ ] Reuse/localize external-source progress for opened/read status and add a
  local resume marker only for the source page/resource ID, not copied pages.
- [ ] Add mobile-friendly shelf cards and tests proving `transformAllowed` is
  false and blocked framing still provides a working original link.

#### 9. Aozora native-reading catalog and reader

- [ ] Add `scripts/fetch_aozora_catalog.py` for the published UTF-8
  bibliographic CSV, cache-first under `data/source-cache/`, with retrieval
  date/checksum and no catalog commit.
- [ ] Parse work/person/title/card/text URLs, orthography, and rights status;
  filter protected works before any in-app text fetch.
- [ ] Add a small server-side text route for qualifying public/reusable works,
  with source URL, normalization, bounded fetch/cache behavior, and explicit
  protected-work rejection.
- [ ] Reuse existing Japanese text/furigana, known-item links, study-later,
  and local browser storage patterns; do not create a second reader engine.
- [ ] Add a native-reading shelf with estimated difficulty signals: known
  vocabulary/kanji coverage, length, and sentence length. Label it as an
  estimate, never a JLPT certification.
- [ ] Add mobile typography, adjustable font size, no horizontal scrolling,
  consistent furigana, and local resume position.
- [ ] Add tests for CSV parsing, rights filtering, URL mapping, text
  normalization, protected-work rejection, difficulty estimate, and fetch
  failure fallback.

#### 10. Immersion and mobile reorganization

- [ ] Refactor `immersion-surface.tsx` to consume the registry and organize
  sources by learner intent: 聞く, 読む, 実際の日本語, and 参考.
- [ ] Keep Ear Warm-up, Guided/Listen/Immersion modes, shadowing, transcript
  reveal, mapped furigana, and the existing listening selection logic intact.
- [ ] Put Erin in one source card with its lesson selector; do not render six
  separate Erin cards.
- [ ] Add Tadoku/Aozora/Irodori/Tae Kim/Wikibooks learner entry points in the
  relevant section, with no core lesson dependency on external availability.
- [ ] Ensure one-tap mobile audio, thumb-sized source controls, readable
  Japanese text, and no horizontal overflow in shelf/reader/reference views.
- [ ] Add responsive tests or source-level assertions for registry rendering,
  one Erin card, all six new source roles, and external failure fallbacks.

#### 11. Content Studio provenance and coverage diagnostics

- [ ] Extend the existing readable review modal/source evidence UI with source
  roles and field-level provenance; do not expose raw JSON as the review path.
- [ ] Show grammar mappings, Irodori patterns, dictionary/frequency evidence,
  and resolved human-audio metadata as inspectable source evidence.
- [ ] Add actual coverage calculations from registry mappings, staged data,
  and successful resolver metadata; never hard-code percentages.
- [ ] Keep imported/source-review records pending and preserve existing approval,
  rejection, learner-release, and learner-flag behavior.
- [ ] Add tests for provenance serialization, actual coverage counts, source
  evidence rendering, and unchanged review gates.

#### 12. Documentation, full verification, and delivery

- [ ] Update `docs/product/CONTENT-SOURCES.md` with the resulting source roles,
  delivery modes, storage boundary, provenance shape, and failure behavior.
- [ ] Update `docs/product/SOURCE-EVALUATION.md` with first-party term dates,
  exact integration behavior, and source-specific restrictions.
- [ ] Keep `README.md`/`HANDOFF.md` accurate about what is implemented,
  provider-hosted, dynamically resolved, cached, or still deferred.
- [ ] Run the repository commands: `npm test`, `npm run typecheck`,
  `npm run build`, and `git diff --check`.
- [ ] Run focused source tests with mocked APIs and no network dependency.
- [ ] Verify no third-party audio/text is added to GitHub, Supabase Storage,
  SQL seed output, or the public deployment bundle.
- [ ] Commit only intentional milestone files, keep user-local artifacts
  untracked, and push the verified result to `main`.

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
- [x] Release all non-rejected staged records through the private learner path with an explicit `humanReviewed: false` marker, while preserving pending status and the admin review/export queue. The current package has 47 approved source-review records, 50 authored/curated records, 8,345 pending records, and none rejected.
- [ ] Optional quality pass: review, enrich, classify, and assign imported records to real Journey lessons before promoting them to the approved SQL/content pool.
- [x] Apply the generated Supabase SQL import after the hosted project receives
  migrations 0017–0019. The hosted schema now exposes spoken-frequency,
  audio-metadata, and I-JAS aggregate support; the 47 approved staged IDs all
  match hosted rows, and the seeded curriculum is present. Pending and rejected
  staging records remain excluded from the database export.

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
  video downloading is prohibited, so Kizashi streams only the six selected
  provider-hosted MP4 URLs in a native player and does not copy, proxy, or
  persist Erin audio/video.
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
  and needs attribution; its browse page sends `X-Frame-Options: Deny`, so the
  source shelf is link-only. Individual cleared Tatoeba audio URLs remain a
  possible future native-player path. JSUT permits personal/non-commercial
  research but does not generally permit redistribution; do not bulk mirror
  either.
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
- [x] Add an opt-in original-source viewer with a direct-link fallback when a
  provider blocks framing or login cookies. The default app keeps CEJC, CSJ,
  Common Voice, Tatoeba, JSUT, and JapanesePod101 link-only after current
  frame attempts failed. Erin uses one source card with a lesson selector and
  a native player pointed at six provider-hosted MP4 URLs; its full lesson page
  stays below. The device-local Chromium helper in
  `browser/kizashi-private-frame-unlocker/` can retry those frames by removing
  only the allowlisted response headers. The selected viewer expands below the
  full source-card grid; immersion transcripts and shadowing always show mapped
  furigana. No source material is copied, proxied, cached, mirrored, or
  uploaded.
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
- [x] Wire the permitted CEJC aggregate spoken-frequency signal through the
  reviewed analysis path; keep it distinct from BCCWJ written frequency.
- [ ] Obtain matching downstream permission before publishing CSJ-derived
  spoken-frequency values; CSJ remains a local review-only input under its
  current no-redistribution/ND terms.
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
- [ ] Complete the manual phone/desktop viewport preview before deployment.
  Route/HTTP smoke checks, build, typecheck, and tests pass; a browser-capable
  environment must still inspect protected routes at real phone and desktop
  widths.

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
