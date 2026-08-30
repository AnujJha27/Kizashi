# Kizashi implementation handoff

Date: 2026-08-30
Status: Active implementation; N5/N4 private preview, review tooling, source staging helpers, original N5 practice, allowlisted/admin auth, opt-in account sync, and the study-mode backlog are implemented. The base hosted seed is complete; imported-content approval/publication, Vercel environment configuration, and final smoke checks remain gated.

## User objective

Build a new Japanese-learning app in this top-level directory:

`/mnt/d/fun stuff/michi`

Do not modify the existing `lattice/` app. The product name/codename is Kizashi; legacy storage/source IDs may still use `michi` for compatibility.

The product should feel like a premium, dark Japanese-learning RPG/editorial
environment. Its defining surface is a Journey page that is a slowly evolving
Japanese landscape, not a literal game map: quiet city → train line → shrine →
mountains → denser reading-focused areas. Details should reveal deterministically
as learning progress grows.

## Source briefs

- `docs/product/PRD.md` — copied from the first pasted PRD.
- `docs/product/MILESTONE-1.md` — copied from the first-milestone brief.
- `docs/product/ADDENDUM.md` — JLPT/mobile requirements and the updated vertical-slice direction.
- `docs/product/ADDENDUM-2.md` — source hierarchy, conservative JLPT coverage, generated-content review, kana progression, and licensed acquisition roadmap.

## Required first slice

Do not build the whole product. Build one complete, useful N5 vertical slice:

- one high-quality N5 module
- 20–30 contextual vocabulary items
- 5–8 kanji taught through useful vocabulary
- 3–5 grammar concepts with formation, intuition, examples, mistakes,
  prerequisites, JLPT metadata, and grammar contrasts
- original exercises: vocabulary reading/context, grammar completion/order,
  kanji-in-word recognition, one short reading, and one listening exercise
  structure
- adaptive practice stages, answer normalization, alternate valid answers,
  progress/mastery measurements, review scheduling, mistake tracking, and
  meaningful progress
- mobile-first study flow: thumb-friendly CTA, full-screen study card, quick
  2/5/10-minute drills, persistent/resumable session state, replayable audio
  structure, buttons always available even if gestures are added later
- desktop shell plus mobile bottom navigation
- Japanese landscape Journey page driven by progress state
- Supabase-ready magic-link auth, strict email allowlist, server-side checks,
  RLS foundations, typed schema/models, and development seed content
- PWA manifest, installable metadata, and a minimal offline-friendly shell

The addendum explicitly prioritizes content quality, review quality, and mobile
study experience over decorative polish. Do not seed hundreds of shallow filler
records. Do not copy textbook, JLPT, or other copyrighted exercises/passages.

## Current state

- Milestone 1 is implemented in the current repository.
- The N5 module is represented in `data/n5-foundations.json` and `supabase/seed.sql`.
- The application runs in local demo mode when Supabase variables are absent. When
  configured, middleware refreshes the auth session, the main route group requires
  the allowlisted email, and Profile exposes explicit opt-in account sync. The
  sync migration must be applied before that control can persist state remotely.
- The frontend has the Japanese landscape styling, shared atmospheric backgrounds,
  sticky shell/sidebar behavior, furigana-aware Japanese text, kana and kanji
  reference surfaces, responsive Journey/Progress/Library/Review/Studio screens,
  and the current Genki I book path. `lib/books.ts` points at the supplied current
  file: `Genki - An Integrated Course in Elementary Japanese I [Second Edition] (2011), WITH PDF BOOKMARKS!.pdf`.
- Content Studio defaults to readable review cards and a normal form editor;
  Advanced JSON is separated for imports/bulk edits. Content cards support
  one-click Approve/Reject, and generated questions can be sent once to the review
  queue. Approved/rejected local drafts remain usable together; pending records are
  excluded from the learner path.
- Imported records now expose editable curriculum classification fields (level,
  Core/Extended/Bridge band, confidence, evidence, and inclusion reason). The SQL
  renderer refuses approved `source-review` records without complete classification
  and learner-facing fields.
- Content triage now uses `lib/content-priority.js` to rank curriculum band,
  frequency, prerequisite value, missing fields, and learner weakness. Content
  Studio exposes search, status filtering, assignment, provenance, and the reason
  a record is next.
- `scripts/qa_content_package.py --strict` is a local publish gate for missing
  fields, provenance, classification, and real Journey assignment. It does not
  approve records or connect to Supabase.
- `scripts/ingest_jmnedict.py` stages proper-name lookup records outside the JLPT
  learner vocabulary. `scripts/extract_book_candidates.py` stages conservative,
  page/checksum-provenanced book candidates and keeps them pending. Optional
  SudachiDict, CEJC, and CSJ source metadata is available from the cache CLI;
  licenses and downstream use still require review.
- Phase 1 acquisition has been run successfully on Windows with:

  ```powershell
  python scripts\build_phase1_staging.py --level N5 --bridge-level N4
  ```

  The cache-first run includes JMdict, linked JMdict examples, KANJIDIC2,
  OpenJLPT N5/N4, Irodori, Marugoto, BCCWJ, and Tatoeba candidates. The resulting
  staging package contains 8,446 records: 50 existing approved seed records and
  8,396 pending imported records. The import is review-only; no Supabase SQL has
  been generated/applied for those records yet.
- The acquisition scripts use Windows-compatible HTTP/mirror fallbacks for the
  EDRDG TLS issue and preserve source manifests, checksums, local filenames,
  record-level provenance, field-level provenance, JLPT level, and curriculum band.
- `TODO.md` is the authoritative backlog. The current largest unfinished phase is
  review → enrichment → lesson assignment → approved SQL publication. Browser-local
  progress/notes/preferences upload is implemented as an explicit opt-in bounded
  snapshot; it never accepts a client user ID and preserves local state on failure.
- The latest Windows acquisition run completed successfully with `--level N5
  --bridge-level N4`; the staged source package is ready for review and has not
  been published to Supabase.
- Existing `lattice/` was inspected for reusable ideas only. It is an unrelated
  knowledge/portrait app with Next 15, Supabase SSR helpers, dark tokens,
  React Query, and a FastAPI/Alembic backend. Reuse concepts, not its files;
  the user explicitly requested a new directory.
- The parent `/mnt/d/fun stuff` checkout is heavily dirty/untracked. Do not run
  reset, checkout, clean, or broad staging commands.
- `michi/` is not currently an independent Git repository/worktree. Keep edits
  scoped to `michi/`.
- Superdesign CLI preflight was attempted and failed because this environment is
  WSL 1 (`WSL 1 is not supported`). Continue with local implementation unless a
  future session has a usable Superdesign environment.

## Proposed minimal architecture

Use a standalone Next.js + TypeScript + Tailwind app in `michi/`.

Frontend:

- App Router route groups for auth and the protected app shell.
- `components/shell/` for responsive navigation and shared layout.
- `components/journey/` for the SVG/CSS landscape and deterministic progress
  detail levels.
- `components/study/` for the study session and answer/rating UI.
- `lib/content.ts` or `lib/curriculum.ts` for the curated N5 module.
- `lib/mastery.ts` for pure answer normalization, mastery transitions, review
  intervals, mistake classification, and queue construction.
- `lib/session.ts` for resumable local session state and later Supabase sync.
- local demo mode when Supabase env vars are absent, so the vertical slice is
  usable immediately; Supabase remains the persistence path when configured.

Data:

- `courses` → `chapters` → `lessons` → `learning_items`
- generic item metadata: `jlpt_level`, category, subcategory, difficulty,
  prerequisites, tags
- content tables/JSON for vocabulary, grammar, kanji, readings, listening, and
  grammar contrasts
- user-owned `item_progress`, `review_history`, `mistakes`, and `study_sessions`
- RLS on every user-owned table using `auth.uid() = user_id`; authenticated
  read-only access for shared curriculum content
- keep content independent of Genki; textbook sequence can be metadata later

Avoid adding AI, charts, graph databases, a state-management library, a large
animation system, or a separate backend until the vertical slice proves the
learning loop.

## Exact next order

1. Continue the content phase in Studio: review the highest-value imported records,
   fill missing examples/grammar fields, assign approved records to real Journey
   lessons, and leave uncertain records pending or rejected.
3. Add/author more original N5 readings and listening exercises so the large lexical
   acquisition is supported by contextual and audio practice. Keep all four N5
   listening task families represented.
4. After a deliberately reviewed subset is approved, run:

   ```powershell
   python scripts\render_supabase_content_sql.py --approved
   ```

   Inspect the generated SQL, apply the pending Supabase migrations, and import the
   SQL only when the owner explicitly wants the database updated. The renderer is
   local and does not connect to Supabase.
5. Extract textbook vocabulary, kanji, grammar, lesson order, page references, and
   provenance from the supplied books; keep extracted facts review-only until they
   are checked and assigned.
6. Add the remaining acquisition roadmap in phases: JMnedict, UniDic/Sudachi,
   then evaluate CEJC/CSJ after beginner audio is stable.
7. Verify allowlisted account sync against the configured project after the
   owner applies the Vercel environment values; the base migrations and seed
   run are complete.
8. Add deeper AI explanation/conversation/writing features after the core content
   bank is strong.
9. Run the focused tests, direct TypeScript check, Next build, and phone/desktop
   route smoke checks before deployment. Keep public GitHub publication limited
   to the clean code-only tree; private book files stay in Supabase Storage.

## Guardrails

- Preserve the user's requested scope: useful learning content first, then
  review/adaptation, mobile experience, progression, speed, visual polish,
  gamification, and AI last.
- Do not mutate `lattice/` or unrelated root changes.
- Use `apply_patch` for source edits.
- Keep the code minimal: reuse browser APIs/localStorage and existing installed
  dependencies only when they are actually available in `michi`.
- Every non-trivial pure logic behavior needs one runnable test.
- Do not add a giant hand-drawn literal map. The landscape is a small,
  deterministic visual layer over the course/progress model.
- Treat the current acquisition/source plan as settled unless the owner
  explicitly reopens it; keep the next session focused on usable study content
  and the learner path.
- Do not treat OpenJLPT, Irodori, or Marugoto labels as official JLPT content
  specifications. Preserve their provenance and require review before publishing.
- Do not expose or commit API keys, Supabase secrets, or other credentials.
- The current environment's `npm` wrapper exits because it detects WSL 1; use the
  installed `/usr/bin/node` and direct TypeScript/Next binaries for verification.
- The browser/Sol relay is unavailable in this environment, so Sol was not
  consulted. Repository instructions and the local handoff remain authoritative.
- The worktree is dirty with user and implementation changes. Preserve unrelated
  edits; do not reset, checkout, clean, or broadly stage files.

## Finish criteria for this handoff

Continue in `michi/`, inspect the current worktree, and continue at content
review/enrichment rather than rebuilding the already-implemented vertical slice.
Do not publish staged content automatically. Before handoff, record verification
results, the exact staged file list, push result, and any remaining human-review or
authorization blocker here.

## Session notes — 2026-08-30

This session paused at the owner's request. Sol was not available in the exposed
tools, so the repository and this handoff remained authoritative. The existing
Supabase foundation is already present: SSR/browser clients, magic-link callback,
allowlist helper, RLS migrations, curriculum tables, and user-owned progress tables.

Work added this session and committed in `ecbcf8a`:

- Added `test/auth.test.mjs` covering case-insensitive allowlisting, fail-closed
  missing allowlist configuration, bounded sync payloads, and client user-ID
  exclusion.
- Added `lib/auth/allowlist-core.js` and made the existing allowlist wrapper use it.
- Added `lib/supabase/sync-core.js`, `lib/supabase/sync.ts`, `app/api/sync/route.ts`,
  `components/profile/account-sync.tsx`, and migration `0014_sync_metadata.sql` for
  a bounded, opt-in user-owned sync snapshot with merge coverage.
- Added `getAllowedUser`, protected the main layout, and changed middleware to
  refresh Supabase cookies when configured. Demo mode remains local-only.
- Added weak-practice ranking, topic/band gap links, 5/10/20/30-minute actions,
  verified Genki chapter jumps, page review notes, and server-side AI auth plus
  generated-draft metadata.
- Spaced every native dropdown arrow from its field edge with the shared select
  styling in `app/globals.css`.

Checks at pause:

- `/usr/bin/node --test test/*.test.mjs` — 3 test files passed, 0 failures.
- `./node_modules/.bin/tsc --noEmit --pretty false --incremental false` passes.
- The direct Next build started but did not produce a result in the available
  environment and was interrupted after hanging in optimized compilation.
- The scoped commit is `ecbcf8a`; its exact Kizashi-only file list is recorded by
  `git show --format= --name-only ecbcf8a`. Unrelated `resumer` and
  `scripts/__pycache__/` remain unstaged.
- The first push failed on the machine SSH config, and an isolated SSH retry
  could not resolve GitHub in the sandbox. An escalated retry also received no
  response and was stopped after the timeout; GitHub still needs the commit.
- The `0014_sync_metadata.sql` migration has not been applied. Do not run a
  production build or start/stop a Next server while the owner's server is active.

Next session order:

1. Re-run the direct tests and typecheck; only run a Next build once the owner's
   active server is stopped or isolated.
2. Apply `0014_sync_metadata.sql` against the configured Supabase project only with
   explicit owner approval, then test sign-in and Profile sync.
3. Continue human review/enrichment/lesson assignment of the staged source package;
   keep SQL publication and licensing decisions manual.
4. GitHub publication is complete on `origin/main`; future changes should be
   reviewed for public disclosure before pushing.

## Session notes — 2026-08-30 continued

- Studio review records were not deleted. The card view had a 60-record cap with
  no paging, and an older smaller browser draft could mask the larger staged
  package. Studio now pages through every match and keeps the larger staged
  package when a stale local draft is smaller, without deleting that draft.
- The staged package is now also stored as the compressed, tracked
  `data/staging/kizashi-n5-source-review.json.gz` snapshot so the Studio review
  material survives deployment. It contains 7,391 vocabulary, 630 kanji, and
  413 grammar records, plus the remaining staged categories.
- Kanji orthography prompts now ask for the word matching a reading rather than
  asking learners to visually spot the target kanji. The Studio/package tests
  cover this regression and the staged snapshot.
- Added free-plan private book chunking at 45 MiB per part, the private bucket
  migration, and browser-side PDF assembly from short-lived signed part URLs.
  This avoids sending the reassembled file through a Vercel Function response.
  All three local PDFs were split and reassembled byte-for-byte successfully.
  The existing `books` bucket was configured private/PDF-only with a 45 MiB
  limit, and all 13 parts were uploaded and verified through signed access using
  the existing local service key.
- Current checks: `/usr/bin/node --test test/*.test.mjs` — 4 files passed;
  direct TypeScript check passes; `git diff --check` passes. The owner's Next
  server was not started, stopped, or restarted.
- Commit `e23edae` contains the scoped Studio, question-quality, review-package,
  and private-book-storage changes. A push using isolated SSH was attempted and
  stayed silent for the timeout, then was stopped with no remote confirmation.
  The GitHub repository is empty with public `main` as its default branch. A
  clean 172-file publish tree excluding the private book blobs was prepared but
  not published because explicit approval is required for that broader public
  disclosure. No history rewrite or force-push was performed. The clean public
  tree was published as `26abf62` on `origin/main`; the local `master` branch
  remains intact. The app now accepts
  the existing `SUPABASE_SERVICE_KEY` env name as well as
  `SUPABASE_SERVICE_ROLE_KEY`; the compatibility fix is `c7cffc6`.
- The bucket settings were applied through the authenticated Storage API because
  no SQL/database connector is available here; `0015_private_book_storage.sql`
  remains the reproducible migration for another project. The Supabase objects
  are uploaded and verified through signed access.
- Read-only PostgREST checks returned HTTP 404 for both `learning_items` and
  `sync_snapshots`, so the configured project still needs the SQL migrations and
  seed applied before remote curriculum or account sync can work. A service key
  can manage Storage but cannot execute arbitrary SQL here; no database password
  or Supabase management token is present.
- Practice review no longer double-counts daily minutes: per-question review
  updates keep XP but the completed practice session records elapsed minutes once.
  The fix is local commit `679b37f`; all four direct test files and the direct
  TypeScript check pass afterward.
- The Vercel-safe Books reader and deployment instructions are local commit
  `ebc79f1`. It adds `/api/books/<book-id>/parts` for authenticated signed URLs;
  the browser assembles the parts and the old whole-file route remains a local
  fallback. The latest local commits are not yet on public GitHub `main`.

## Session notes — Supabase repair

- The owner ran `supabase db push` and the CLI reported the remote database was
  up to date, but running `seed.sql` failed because `public.courses` did not
  exist. This indicates stale migration history or a schema that was cleared;
  it is not fixed by rerunning the seed.
- Added idempotent migration `0016_repair_schema.sql`. It recreates missing
  curriculum, content, user-progress, question, and sync tables, restores the
  additive columns and RLS policies, and does not reset or delete rows. Run
  `npx supabase db push` from `D:\fun stuff\michi`, then run the seed from the
  same directory. The 13 private book parts remain uploaded separately.
- After the repair migration and seed, verify `public.courses` and
  `public.learning_items` in the Supabase Table Editor before deploying.
- The owner then linked the local project with `jjusevtyzousoykpjgzq` and
  confirmed that migrations `0001` through `0016` applied successfully. The
  seed was copied to the clipboard; its SQL Editor run and table verification
  are the remaining hosted-database checks.
- Verification after the repair change: all 4 direct Node test files pass,
  direct TypeScript checking passes, and `git diff --check` passes. The owner’s
  running Next server was not started, stopped, or restarted.

## Session notes — seed repair and clean publication

- Fixed the seed's missing closing brace in the `contrast-wa-ga` PostgreSQL
  `text[]` literal and parenthesized each JSONB payload extraction in the two
  staged import blocks. The latter prevents the parent `learning_items` query
  from evaluating to an empty result before child vocabulary rows are inserted.
- The owner successfully applied migrations `0001` through `0016`. The hosted
  seed should be recopied as UTF-8 and rerun; no `db push` is needed for these
  seed-only fixes.
- A read-only PostgREST check confirms `courses`, `learning_items`,
  `vocabulary`, and `sync_snapshots` now exist (HTTP 200), but the expected
  `n5-foundations`, `vocab-konnichiwa`, and `contrast-wa-ga` rows are absent;
  the seed has not completed yet.
- `/usr/bin/node --test test/*.test.mjs` passes all 5 test files, direct
  TypeScript checking passes after typing the readiness boundary, and
  `git diff --check` passes. The Next build was intentionally not run while
  the owner's local server is active.
- `origin/main` was verified as the clean public snapshot. A 27-file code-only
  publication commit `7dcdb50` was pushed to `origin/main`; it contains no
  `N5-books` files, PDFs, videos, or `node_modules`. The local `master` branch
  remains intact with the private source history.
- Remaining gates are hosted seed/table verification, human review and
  approval of the staged acquisition package, book-fact extraction review, and
  phone/desktop smoke checks before deployment.
- The strict content QA gate now scopes curriculum-classification requirements
  to `source-review` records; authored seed records do not create false
  blockers. The current staged package reports 7,391 vocabulary, 630 kanji,
  413 grammar, 6 reading, and 6 listening records with zero QA blockers while
  imported records remain pending.

## Session notes — source and AI boundary follow-up

- Confirmed the source-roadmap implementation uses `scripts/ingest_jmnedict.py`
  for lookup-only names, `scripts/extract_book_candidates.py` for review-only
  book facts, and `scripts/fetch_dictionary_sources.py` for optional SudachiDict
  cache metadata. No duplicate wrapper tools were added.
- Added a regression check for the existing AI generation boundary: allowlisted
  authentication, target-ID validation, in-memory cooldown, generated/draft
  status, and target provenance metadata. The plan now names the actual source
  tools instead of obsolete filenames.
- The current seed file contains the corrected UTF-8 contrast array and the
  parenthesized staged `learning_items` imports. If Supabase still reports the
  old foreign-key failure, recopy the entire current `supabase/seed.sql` as
  UTF-8 and run the complete file; do not run only a child-table insert or an
  older clipboard copy.
- The seed now creates `michi-curated-n5-seed` before its first
  `learning_item_sources` reference, fixing the final source foreign-key error.

## Session notes — seed collision repair and admin access

- The hosted seed's duplicate-key failure had two root causes: staged payload
  imports used `item.slug` as the parent `learning_items.id`, and the database
  requires globally unique `learning_items.slug` values across vocabulary and
  kanji. The seed now uses each stable item ID for both columns in those
  imports and gives the later duplicate vocabulary/kanji pairs distinct slugs.
  Regression checks cover both cases. Re-copy the complete UTF-8
  `supabase/seed.sql` and rerun the whole file after the migrations; seed edits
  do not require another `supabase db push`.
- Admin access is exact-ID based through `ADMIN_USER_ID`, defaulting to the
  requested `aj05767625`. `ALLOWED_EMAILS` accepts additional comma-,
  semicolon-, or newline-separated accounts, so add
  `aniruddh302004@gmail.com` in Vercel while preserving the existing
  `ALLOWED_EMAIL` value. Content Studio and AI generation are admin-only;
  ordinary allowlisted accounts retain the learner app.
- Supabase Auth user IDs are normally UUIDs. If `aj05767625` is a username or
  dashboard label rather than the actual Auth user ID, set `ADMIN_USER_ID` to
  that account's real Auth UUID in Vercel instead.
- Fresh checks: `/usr/bin/node --test test/*.test.mjs` — 5 test files passed;
  direct TypeScript checking passed; `git diff --check` passed. The Next build
  and browser smoke checks remain intentionally unrun because the owner's Next
  server is active.
- The owner confirmed that the corrected full seed now succeeds against the
  hosted Supabase database. The verified code-only snapshot was pushed to
  GitHub `main`; it contains no private books, PDFs, videos,
  `node_modules`, or credentials. Vercel still needs the production
  `ALLOWED_EMAILS=aniruddh302004@gmail.com` and `ADMIN_USER_ID=aj05767625`
  environment values applied before a redeploy.
- A fresh read-only Supabase REST check returned HTTP 200 for the seeded
  `courses`, `learning_items`, `content_sources`, and
  `learning_item_sources` records, and HTTP 200 for the `sync_snapshots`
  table using its actual `user_id` key. No credentials or row contents were
  printed.
- A fresh read-only Supabase Storage check returned HTTP 200 for the private
  `books` bucket and found all 13 uploaded PDF parts: 3 under `genki-i`, 5
  under `goukaku-dekiru`, and 5 under `nihongo-challenge-kanji`.
- A dry-run of `scripts/extract_book_candidates.py` against all three supplied
  PDFs found no text layer because they are scanned/image-only files. The
  extractor now fails clearly with an OCR/text-export instruction instead of
  silently reporting zero candidates. OCR was intentionally not added; any
  extracted book facts remain a manual, review-only and licensing-gated step.
- Strict `scripts/qa_content_package.py` reports `status: ready` with zero
  blockers for the staged package (7,391 vocabulary, 630 kanji, 413 grammar,
  6 readings, and 6 listening records). The 8,396 imported records remain
  pending until a human reviews and assigns them.
