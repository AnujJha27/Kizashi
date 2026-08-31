# Kizashi source-integration milestone

## Goal

Integrate Tae Kim, Wikibooks Japanese, Wikimedia Commons/Lingua Libre,
Aozora Bunko, Free Tadoku Books, and Irodori as learner-facing extensions of
the existing Kizashi curriculum. Each source must have a defined pedagogical
role, appear at the relevant learning moment, preserve provenance, degrade
gracefully, and add essentially no third-party media to Supabase Storage or
GitHub.

Implementation is complete on `main` at source commit `16639d5`; documentation
is synchronized in `47fd417`. Only
the manual viewport smoke test remains. The source specification supplied by
the user is the authority:
`docs/product/NEW_SOURCE.md`.

## Implementation status — 2026-09-01

- [x] Tasks 1–6: registry, Commons audio fallback, grammar references, Tae Kim,
  Wikibooks, Irodori, and Tadoku.
- [x] Task 7: intent-organized listening surface, one Erin family card, and
  mobile-safe source/reader controls.
- [x] Task 8: readable Content Studio source evidence and computed coverage.
- [x] Task 9: source documentation, focused tests, full test suite, TypeScript,
  Python syntax, production build, and diff checks.
- [ ] Manual phone/desktop viewport smoke test after deployment.

## Architecture

Extend these existing abstractions:

- `ContentSource` and `N5Module.sourceManifest` for source identity,
  attribution, license, retrieval, and source URLs.
- `LearningItem.sourceIds` and `LearningItem.fieldSourceIds` for item- and
  field-level provenance.
- `AudioProvider`, `BrowserSpeechProvider`, `RemoteAudioProvider`, and the
  reserved `ServerTTSProvider` in `lib/audio.ts`.
- `ExternalSourceLauncher`, `ExternalSourceViewer`, `ExternalSourceFrame`,
  and `lib/external-source-progress.js` for provider-hosted resources,
  opening/read markers, framing, and link fallback.
- `components/learning/japanese-text` and existing reading/session helpers
  for Japanese display, furigana, known-item linking, study-later, and local
  reading state.
- Existing Content Studio review status, validation, source evidence, and
  learner-release gates.
- `scripts/ingest_irodori_wordlist.py`,
  `scripts/ingest_irodori_sentence_patterns.py`, and
  `scripts/ingest_irodori_kanji.py` for the existing review-only Irodori
  staging pipeline.

Add only one new learner-facing registry, likely `lib/external-resources.ts`.
Do not add a second content database, curriculum engine, audio archive, or
publisher-directory route set.

## Tech stack

- Existing Next.js/React/TypeScript app and native browser APIs.
- Existing Node test runner: `node --test test/*.test.mjs`.
- Existing Python cache/staging scripts; no new Python dependency unless an
  already-used parser is insufficient.
- Wikimedia/MediaWiki APIs for Commons/Lingua Libre and Wikibooks.
- Browser/local cache or Next fetch caching for small metadata responses only.
- Existing Supabase schema and provenance migrations; no new persistence by
  default.

## Spec and global constraints

- Follow `docs/product/NEW_SOURCE.md` in the stated priority order.
- Kizashi's reviewed JLPT classification, JMdict, KANJIDIC2, authored
  explanations, practice, mastery, and SRS remain the backbone.
- Corpus/resource evidence can inform a learner surface but cannot silently
  become JLPT truth or overwrite authored explanations.
- No third-party audio/text mirror in GitHub, Supabase Storage, SQL seed
  output, or the public deployment bundle.
- Store metadata and external URLs, not blobs. A specific preservation need
  would require an explicit later decision and source-specific permission.
- Treat rights as source-specific engineering constraints, not generic UI
  warnings. Keep detailed attribution behind compact source-info controls.
- External failure must never block a core Kizashi lesson.
- Do not stage, commit, delete, or rewrite user-local artifacts such as
  `docs/product/NEW_SOURCE.md`, `browser/.../_metadata/`, `resumer`,
  `scripts/__pycache__/`, or `supabase/.temp/` unless the user explicitly asks.

## Verified baseline and current gaps

The repository audit on 2026-08-31 found:

- The audio abstraction already selects server TTS, remote audio, or browser
  speech, and BrowserSpeechProvider already prefers `voice.lang.startsWith("ja")`
  and reports a clear no-Japanese-voice message.
- `AudioMetadata` already carries source type, external URL, speaker data,
  synthetic flag, license, provenance, and preferred rate. Migrations 0018
  and the Supabase row mapper persist JSON metadata but no audio blob.
- The source manifest and item-source tables already support source IDs and
  field provenance. `content_sources.source_type` currently supports official,
  dictionary, curriculum, frequency, examples, generated, and user.
- The current Immersion source shelf is hard-coded in
  `components/learning/immersion-surface.tsx`; Erin is represented by one
  selector-driven source family in the runtime but the other source metadata
  remains in the component.
- `ExternalSourceViewer` already provides a native media/frame/link path and
  `ExternalSourceLauncher` records local opened status. It must be reused for
  Tadoku, Aozora links where appropriate, and Irodori provider-hosted content.
- Content Studio now has a readable modal, source evidence, and review gates;
  the planned source diagnostics should extend that model rather than revive
  raw JSON review.
- Irodori is already staged through three ingestors. The current package has
  review-only Irodori vocabulary, sentence-pattern, and kanji records, with
  source IDs and source records. The gap is learner-facing lesson/Can-do/
  resource/audio enrichment, not another vocabulary/grammar/kanji importer.
- Existing `reading-panel.tsx` and Japanese-text helpers provide useful
  behavior, but there is no Aozora catalog/reader integration yet. The private
  `book-reader.tsx` is not a generic public-source reader and should not be
  copied into a parallel reading engine.
- Existing tests cover audio ephemerality, Immersion/Erin metadata, source
  manifests, provenance, I-JAS/CEJC/CSJ aggregate boundaries, review gates,
  and external viewer fallback. New tests should follow these patterns.

## Rights preflight recorded for implementation

These are source-boundary inputs for the implementation, verified against
first-party pages on 2026-08-31. The implementation must record the retrieved
date and exact URLs in `docs/product/SOURCE-EVALUATION.md` before shipping:

| Source | Verified boundary | Planned delivery |
| --- | --- | --- |
| Tae Kim | The guide page identifies CC BY-NC-SA 3.0. | Deep-linked alternative explanation; no automatic replacement or copied prose. |
| Wikibooks Japanese | General text is CC BY-SA 4.0/GFDL, with page/history/footer/media exceptions. | MediaWiki API reference; attribution and source page retained for any excerpt. |
| Commons/Lingua Libre | Individual files expose their own media/license/creator metadata; structured data and unstructured text have separate Wikimedia terms. | Exact-match remote audio only after per-file metadata validation. |
| Aozora Bunko | The official guide distinguishes expired-rights works from still-protected works and provides separate file rules. | Metadata catalog for all entries; in-app text only for qualifying works. |
| Free Tadoku Books | Official guide identifies CC BY-NC-ND 4.0, permits linking with NPO多言語多読 credit, and forbids altered copies/add-on tests. | Unchanged provider-hosted reader/link with progress marker; no extraction or quiz generation. |
| Irodori | Official guidance permits independent study and educational use; site content remains owned by the Foundation/other rights holders and audio can be streamed/downloaded under the site boundary. | Official lesson/resource metadata and source-hosted audio/link; preserve attribution and source relation. |

Primary pages checked:

- Tae Kim: `https://www.guidetojapanese.org/start.html`
- Wikibooks: `https://en.wikibooks.org/wiki/Wikibooks:Copyrights`
- Commons/Lingua Libre: `https://commons.wikimedia.org/wiki/Help:Lingua_Libre/APIs`
  and `https://www.mediawiki.org/wiki/API:Imageinfo/en`
- Aozora: `https://www.aozora.gr.jp/guide/aozora_bunko_hayawakari`
- Tadoku: `https://tadoku.org/japanese/en/free-books-en/note-en/`
- Irodori: `https://www.irodori.jpf.go.jp/en/faq.html`,
  `https://www.irodori.jpf.go.jp/en/about.html`, and
  `https://www.irodori.jpf.go.jp/en/privacy.html`

## Implementation plan

### Task 0 — Lock the contract and baseline

Files to inspect/change:

- `docs/product/NEW_SOURCE.md`
- `TODO.md`
- `README.md`
- `HANDOFF.md`
- `docs/product/CONTENT-SOURCES.md`
- `docs/product/SOURCE-EVALUATION.md`
- `lib/types.ts`
- `lib/audio.ts`
- `lib/immersion-core.js`
- `components/learning/immersion-surface.tsx`
- `components/learning/external-source-launcher.tsx`
- `components/learning/external-source-viewer.tsx`
- `lib/content-validation.ts`
- `lib/dictionary-import.ts`
- `scripts/build_phase1_staging.py`
- `scripts/ingest_irodori_*.py`
- `supabase/migrations/0002_content_system.sql`, `0008_content_source_provenance.sql`,
  `0011_content_source_types.sql`, `0013_field_source_provenance.sql`,
  `0018_audio_metadata.sql`, and `0019_ijas_aggregates.sql`
- `test/audio.test.mjs`, `test/immersion.test.mjs`, `test/source-tools.test.mjs`,
  `test/source-intelligence.test.mjs`, and `test/content.test.mjs`

Actions:

1. Preserve this plan and the user-provided source spec as the implementation
   contract.
2. Run the current baseline tests/typecheck/build before feature changes and
   record any pre-existing failure.
3. Confirm the current data package contains only the existing approved seed
   plus review-only source candidates; do not promote new external-source
   material during this milestone.
4. Re-check first-party terms at implementation time and update the rights
   table if a source page changed.

Verification:

```text
npm test
npm run typecheck
npm run build
git diff --check
```

Commit checkpoint: `chore: lock source integration boundaries` (only if the
baseline and docs changes are intentional).

### Task 1 — Central external-resource registry

Files:

- Add `lib/external-resources.ts`.
- Refactor `lib/immersion-core.js` only where Erin metadata belongs in the
  registry; keep listening selection helpers there.
- Refactor `components/learning/immersion-surface.tsx` to consume registry
  entries.
- Extend `components/learning/external-source-launcher.tsx` and
  `components/learning/external-source-viewer.tsx` only if a shared registry
  field cannot map cleanly to the existing `ExternalSourceLink` shape.
- Add `test/external-resources.test.mjs` or extend the narrowest existing source
  test.

Proposed minimal model:

```ts
type ExternalResourceMode =
  | "reference"
  | "remote-media"
  | "frame-or-link"
  | "link-only"
  | "dynamic"
  | "import";

type ExternalResourceType =
  | "grammar-reference"
  | "pronunciation"
  | "graded-reader"
  | "native-reading"
  | "lesson"
  | "listening"
  | "reference";

interface ExternalResource {
  id: string;
  sourceId: string;
  name: string;
  title?: string;
  description?: string;
  resourceType: ExternalResourceType;
  level?: string;
  url: string;
  deliveryMode: ExternalResourceMode;
  targetItemIds?: string[];
  targetSkills?: string[];
  tags?: string[];
  license?: string;
  attribution?: string;
  transformAllowed?: boolean;
  metadata?: Record<string, unknown>;
}
```

Implementation details:

1. Put the current seven source families in the registry, with Erin as one
   family plus six lesson records. Keep CEJC/CSJ/Common Voice/Tatoeba/JSUT/
   JapanesePod101 link-only unless a source-specific delivery is approved.
2. Add one or two initial records per new source, not hundreds of hard-coded
   links. Use deep links only where a real learner mapping exists.
3. Export `getExternalResources({ itemId, skill, type, tag })` and a source
   lookup by ID. Return immutable registry data.
4. Adapt registry entries to the existing launcher/viewer props at the edge,
   rather than making every learning component know about source-specific data.
5. Include source role and rights behavior in metadata, not in JSX prose.

Tests:

- Existing Erin IDs, URLs, lesson selector, target IDs, and native MP4 behavior
  remain unchanged.
- The shelf has one Erin family card, not six independent publisher cards.
- A missing optional registry item returns an empty result and does not throw.
- Registry entries expose all six new source families and the expected
  pedagogical role/delivery mode.

### Task 2 — Commons/Lingua Libre resolver and audio fallback

Files:

- Add `lib/sources/commons-audio.ts`.
- Add `app/api/audio/commons/route.ts`.
- Extend `lib/audio.ts` and, if needed, `components/learning/audio-controls.tsx`.
- Add `test/commons-audio.test.mjs` and extend `test/audio.test.mjs` only for
  the shared fallback contract.

Proposed contracts:

```ts
interface CommonsAudioLookup {
  text: string;
  reading?: string;
}

interface CommonsAudioResult {
  url: string;
  filePage: string;
  label: string;
  speaker?: string;
  speakerId?: string;
  license: string;
  licenseUrl?: string;
  attribution?: string;
  source: "wikimedia-commons";
  collection?: "lingua-libre" | "commons";
}

async function resolveCommonsAudio(
  lookup: CommonsAudioLookup,
  options?: { fetch?: typeof fetch; cache?: Map<string, CommonsAudioResult | null> },
): Promise<CommonsAudioResult | null>;
```

Implementation details:

1. Normalize Japanese text without collapsing distinctions that matter to an
   exact recording match.
2. Query MediaWiki search/category APIs and then `imageinfo`/`extmetadata`.
   Request only titles, MIME/media type, remote URL, description URL, user,
   and license/attribution metadata.
3. Accept exact Japanese label/reading matches first. Recognize Lingua Libre
   Japanese records by language/category metadata, not filename shape alone.
4. Reject non-audio MIME/media types, missing/ambiguous labels, missing license
   data, and licenses that the app's configured accepted set does not allow.
   Do not invent a speaker identity.
5. Return remote metadata to `RemoteAudioProvider`; do not add a Supabase row,
   Storage object, proxy response, or downloaded cache.
6. Cache successful resolutions and misses for a bounded duration. Keep the
   cache local to the resolver/fetch layer and make the cache injectable in
   unit tests.
7. The route validates text/reading input, returns `{ result: null }` for a
   clean miss, and returns a non-fatal error shape for API failures.
8. Add the resolver as an on-demand pronunciation branch after explicit audio
   metadata and before BrowserSpeechProvider. Browser speech remains the
   default if no resolver target or no compatible result exists.

Tests:

- Exact Japanese result wins over weaker candidates.
- Non-audio, missing-license, incompatible-license, ambiguous, and unrelated
  filename results are rejected.
- Returned metadata preserves file page, creator/speaker, license, license
  URL, and attribution.
- A cached hit avoids a fetch; a cached miss avoids repeated lookup.
- Resolver failure and RemoteAudioProvider failure both select browser speech.
- No test or implementation path writes audio bytes to Supabase Storage.

### Task 3 — Grammar reference framework, Tae Kim, and Wikibooks

Files:

- Add `components/learning/source-reference-panel.tsx`.
- Add `data/source-maps/tae-kim.json`.
- Add `data/source-maps/wikibooks.json` only if mappings cannot live in the
  typed registry without scattering source-specific lookup data.
- Add `lib/sources/wikibooks.ts`.
- Add `app/api/reference/wikibooks/route.ts`.
- Integrate the panel into the existing grammar detail component found during
  implementation; do not create a grammar route.
- Add `test/grammar-references.test.mjs` and any focused API adapter test.

Tae Kim steps:

1. Select a small reviewed set of current Kizashi grammar IDs such as particle
   contrasts and structural forms that have a meaningful Tae Kim section.
2. Store specific deep URLs, section titles, relationship
   `alternative-explanation`, source ID, and attribution. Do not map every
   grammar page to the homepage.
3. Render the mapping under `別の見方 / Alternative explanation` with a link.
   Kizashi remains the canonical explanation and practice source.
4. Do not add an importer in this phase. Add `scripts/ingest_tae_kim.py` only
   if a concrete review-only excerpt requirement emerges; otherwise linking
   is the lower-risk end-to-end integration.

Wikibooks steps:

1. Implement `getWikibooksSection({ page, section? })` against the MediaWiki
   API with typed responses, bounded fetch caching, and a small sanitization
   function that returns safe text/links rather than arbitrary HTML.
2. Validate page/section inputs in the API route and return a typed non-fatal
   error. Do not persist fetched Wikibooks content in Supabase.
3. Add reviewed mappings for particle, counter, conjugation, and pronunciation
   or pitch-accent references only where a Kizashi item benefits.
4. If a small excerpt is shown, keep source URL, page title, attribution, and
   license visible behind source info, and never merge it into authored fields.
5. If the API fails, render the source launcher and the complete Kizashi
   grammar explanation.

Tests:

- Tae Kim mappings resolve to deep links and retain relationship/attribution.
- Unmapped grammar remains valid and usable.
- Wikibooks section parsing strips unsafe markup while keeping useful links.
- API failure and empty response leave the grammar page usable.
- Source-derived text is distinguishable from Kizashi-authored text.

### Task 4 — Irodori lesson, Can-do, and resource enrichment

Files:

- Keep `scripts/ingest_irodori_wordlist.py`,
  `scripts/ingest_irodori_sentence_patterns.py`,
  `scripts/ingest_irodori_kanji.py`, and
  `scripts/build_phase1_staging.py` as the existing item staging path.
- Add `scripts/ingest_irodori_resources.py` only for official resource
  metadata/manifest rows, not for media downloads.
- Add a small manifest/mapping data file under `data/source-maps/` if needed.
- Extend `lib/external-resources.ts`, the Learn/Journey surface, and the
  existing audio/viewer edge adapters.
- Add `test/irodori-resources.test.mjs` and preserve existing source-tools
  coverage.

Steps:

1. Identify official Irodori course/lesson URLs, Can-do labels, resource types,
   and available audio/video links from the published source metadata.
2. Emit review-only manifest records with course, lesson, Can-do, URL, resource
   types, audio availability, target item IDs, terms, retrieval date, and
   source ID. Do not emit copied page text or media blobs.
3. Keep Irodori course levels and Can-do labels in separate source mapping
   fields. Never write them into `curriculum_classifications.level`.
4. Add at least one practical overlap, e.g. ordering food, to an existing
   N5 lesson as a `real-world practice` reference. Use a provider-hosted audio
   URL only when the official URL is suitable for direct playback; otherwise
   use the existing viewer/launcher.
5. Preserve `sourceIds`, `fieldSourceIds`, source records, pending review, and
   automatic-release markers for existing staged item candidates.
6. Keep the normal Kizashi lesson fully functional if Irodori is unavailable.

Tests:

- All three existing ingestors still produce their current review-only shape.
- Resource manifest rows retain official URL, course, lesson, Can-do, and
  source terms.
- Can-do mapping is learner-facing but not JLPT classification.
- Irodori audio remains remote/provider-hosted and no media file is staged.
- At least one Learn/Journey card links to an Irodori practical activity.

### Task 5 — Tadoku shelf and source-hosted reading

Files:

- Add a small official metadata manifest, likely
  `data/source-maps/tadoku.json` or a typed registry section.
- Extend `components/learning/immersion-surface.tsx` or the existing reading
  library surface, reusing `ExternalSourceViewer`/`ExternalSourceLauncher`.
- Reuse `lib/external-source-progress.js`; add a separate local resource
  position helper only if the current progress shape cannot hold a page/resource
  marker.
- Add `test/tadoku.test.mjs`.

Steps:

1. Add a small curated set of official Free Tadoku Books with title, level,
   genre, original URL, audio availability, approximate length, and attribution.
2. Set `transformAllowed: false` and treat the original work as immutable.
   Do not fetch/extract pages, rewrite text, alter illustrations, make
   translations, or generate Kizashi questions.
3. Use the existing frame-or-link path. If the provider blocks framing, show
   a clear original link and mark the source opened/read locally.
4. Keep the shelf organized as beginner extensive reading, not a generic
   source directory. Include a usable Level Start/Level 1 example.
5. Keep cards thumb-friendly and avoid copying cover/page assets into the app
   unless their source terms explicitly permit that specific asset use.

Tests:

- Tadoku entries retain original URLs, level, audio availability, and credit.
- The model prevents transformation/quiz generation.
- A blocked frame still exposes the original source link.
- Read/open progress is local metadata only.

### Task 6 — Aozora catalog and native-reading experience

Files:

- Add `scripts/fetch_aozora_catalog.py`.
- Add a small parser/normalizer module if the script cannot remain easily
  tested in isolation.
- Add the server-side Aozora metadata/text route under
  `app/api/reading/aozora/route.ts` or an equivalent narrow route.
- Extend the existing reading library/surface and Japanese text helpers; do
  not reuse `book-reader.tsx` as a copy-pasted second reader engine.
- Add `test/aozora.test.mjs`.

Catalog steps:

1. Fetch the published UTF-8 bibliographic CSV cache-first into ignored
   `data/source-cache/`, retaining retrieval date/checksum and not committing
   the catalog.
2. Parse work ID, person ID, title, author, card URL, text URL, orthography,
   and rights status. Recognize the official public-domain/expired-rights
   marker separately from still-protected works.
3. Return all safe metadata for a shelf, but reject protected work text before
   fetching/rendering. Preserve the source card URL for fallback.

Reader steps:

1. Add one confirmed qualifying short work, `羅生門` if its current Aozora
   rights marker still qualifies at implementation time, as the end-to-end
   example with native difficulty label,
   estimated known-vocabulary/kanji coverage, character length, and sentence
   length. The estimate is not JLPT certification.
2. On Read, fetch only qualifying public/reusable source text server-side,
   normalize Aozora markup conservatively, and render Japanese text in a
   comfortable mobile reader.
3. Reuse known vocabulary/kanji links, existing furigana behavior, study-later,
   and local browser storage for font size and resume position. Do not rewrite
   the source into a simplified text.
4. On source failure, show saved metadata, retry, and original source link.

Tests:

- CSV parsing maps card/text URLs and rights status correctly.
- Protected works are rejected before text fetch/render.
- Public/reusable text normalization preserves Japanese content without
  introducing fake simplification.
- Difficulty estimate uses actual input signals and is clearly labeled.
- Reader has no horizontal overflow and local resume/font-size state works.

### Task 7 — Immersion organization and mobile polish

Files:

- `components/learning/immersion-surface.tsx`
- `components/learning/external-source-launcher.tsx`
- `components/learning/external-source-viewer.tsx`
- any existing mobile shell/navigation file only if a real regression appears
- `test/immersion.test.mjs` and `test/content.test.mjs`

Steps:

1. Group registry resources by learner intent: `聞く / LISTEN`,
   `読む / READ`, `実際の日本語 / REAL JAPANESE`, and
   `参考 / REFERENCE`.
2. Keep the current Ear Warm-up, Guided/Listen/Immersion modes, shadowing,
   transcript reveal, and mapped furigana behavior.
3. Keep Erin as one source card with its lesson selector and the existing
   below-card selected viewer/full-width behavior.
4. Add visible entry points for Tadoku, Aozora, Irodori, Tae Kim, Wikibooks,
   and Commons pronunciation in the context where each helps; do not require
   the learner to browse a publisher list.
5. Test one-tap mobile playback, source buttons, readable Japanese text,
   responsive cards, no horizontal overflow, and link fallback.

### Task 8 — Content Studio source evidence and real coverage

Files:

- `components/content/content-studio.tsx`
- `components/content/content-record-editor.tsx`
- `lib/content-validation.ts`
- `lib/supabase/content.ts` only if existing row mapping needs a non-breaking
  source field
- add focused source coverage/provenance tests

Steps:

1. Extend existing readable source evidence to show source role, mapping
   relationship, field-level provenance, Irodori pattern/Can-do relation, and
   resolved human-audio metadata.
2. Keep raw JSON as an internal serialization/editing fallback only; the
   review UI remains readable and source-aware.
3. Calculate coverage from actual registry mappings, staged/package records,
   and successful Commons metadata resolutions. Do not hard-code totals.
4. Preserve pending/approved/rejected review gates, automatic learner release,
   human-reviewed markers, source manifest validation, and learner flags.
5. Add a compact admin summary for the requested source coverage categories,
   while making unavailable/uncalculated values explicit rather than inventing
   percentages.

Tests:

- Provenance survives serialization and Supabase row mapping.
- Coverage counts use fixture data and change when mappings/resolutions change.
- Source evidence is readable and no longer requires opening JSON.
- A source-specific failure does not alter item review status.

### Task 9 — Documentation and final verification

Files:

- `docs/product/CONTENT-SOURCES.md`
- `docs/product/SOURCE-EVALUATION.md`
- `README.md`
- `HANDOFF.md`
- focused/new tests from the preceding tasks

Documentation requirements:

1. Document each source's pedagogical role, exact delivery behavior, storage
   boundary, failure behavior, attribution/license/provenance fields, and one
   end-to-end learner-visible example.
2. Keep source rights current and source-specific. Record current first-party
   URLs and retrieval dates; do not add broad legal disclaimers to normal
   learner UI.
3. Clarify that CEJC/CSJ/I-JAS aggregate/restricted boundaries remain intact,
   and that the six new sources do not become JLPT truth.
4. Record that Commons, Irodori, Tadoku, and Aozora content is provider-hosted
   or dynamically fetched under the source-specific gate, not mirrored.
5. Update the handoff with implemented items, known source failures, cache
   behavior, and the remaining deferred ServerTTS/audio-archive work.

Final checks:

```text
npm test
npm run typecheck
npm run build
git diff --check
```

Additional read-only checks:

```text
git status --short
git diff --stat
rg -n "supabase|storage|audio|proxy|rehost|transformAllowed|sourceId" \
  lib app components scripts docs/product test
```

Verify manually in the private preview:

1. Vocabulary pronunciation resolves Commons when a compatible exact result
   exists and uses Japanese Browser Speech after a miss.
2. A grammar page shows Kizashi content plus Tae Kim/Wikibooks references.
3. A lesson shows an Irodori practical Can-do card.
4. Immersion shows one Erin card, Tadoku beginner reading, and reference/
   native-reading sections in the intended learner order.
5. A qualifying Aozora work reads in-app; a protected work remains source-link
   only.
6. Tadoku blocked framing falls back to the original page and records progress.
7. Mobile cards, audio controls, furigana, and reader typography remain usable.

Delivery:

- Stage only intentional implementation/docs/test files.
- Leave user-local untracked artifacts alone.
- Commit each verified milestone in small cohesive commits.
- Push verified commits to `main`, then confirm the remote `main` SHA matches
  the local SHA.

## Self-review checklist for this plan

- [x] Covers all six requested sources and gives each a pedagogical role.
- [x] Extends existing audio, source, provenance, viewer, review, and Irodori
  abstractions instead of creating parallel systems.
- [x] Puts Commons dynamic audio, browser fallback, and no-storage behavior in
  the same flow.
- [x] Includes Tae Kim deep mappings and a Wikibooks API adapter.
- [x] Includes Irodori learner-facing enrichment beyond the existing ingestors.
- [x] Includes Tadoku non-transformable hosted reading and progress.
- [x] Includes Aozora rights filtering, catalog cache, dynamic reader, and
  difficulty estimate.
- [x] Includes mobile behavior, graceful failure, Content Studio visibility,
  provenance, tests, docs, build, and delivery verification.
- [x] Records the implementation status and the one remaining manual check.
