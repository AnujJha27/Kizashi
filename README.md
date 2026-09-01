# Kizashi

Kizashi is a calm, dark-first Japanese-learning path. The current private preview includes the responsive shell, Journey, interactive N5 study/review loop, immersion/source shelf, browser Japanese speech, PWA shell, content validation, and Supabase-backed curriculum. It also includes full-coverage reading segmentation with sentence inspection, an exam-date plan, weakness-aware Immersion ordering, and deterministic integrated-context exam sets with targeted repair links. Source integrations are organized by learning intent: Tae Kim/Wikibooks references, Commons/Lingua Libre human-pronunciation fallback, Irodori practical lessons, Tadoku graded reading, and rights-filtered Aozora native reading. External audio/text remains provider-hosted or dynamically fetched; it is not mirrored into Supabase Storage.

## Local setup

```sh
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase variables the app runs in local demo mode. With Supabase configured, magic-link auth, the `ALLOWED_EMAIL`/`ALLOWED_EMAILS` allowlist, protected app routes, and RLS-backed account sync are active. Set `ADMIN_EMAIL` to the admin email (`aj05767625@gmail.com`) to protect Content Studio and AI generation; `ADMIN_USER_ID` is an optional UUID override. The configured hosted project already has the migrations and seed applied and was verified on 2026-08-31.

For a fresh Supabase project, apply the migrations in `supabase/migrations/` (including `0017_spoken_frequency.sql`, `0018_audio_metadata.sql`, and `0019_ijas_aggregates.sql`) and then run `supabase/seed.sql`. That setup instruction is not a pending action for the configured project: no additional SQL Editor work is currently required. Curriculum reads require an authenticated user when Supabase is configured; user-owned tables remain protected by RLS. Profile sync is explicit opt-in and keeps browser state intact if the network fails.

To check and apply the hosted migration history with the Supabase CLI (from this directory):

```sh
supabase login
supabase link --project-ref jjusevtyzousoykpjgzq
supabase migration list
supabase db push --dry-run
supabase db push
supabase migration list
```

If the CLI is installed only as an npm project dependency, prefix those commands
with `npx`. The list compares local files with the remote migration history, and
`db push` applies only pending migrations. Never use `supabase db reset --linked`
against this project; that is destructive. The linked project is already current
and its seed/core tables were verified; only a new project or an intentional
seed repair needs the SQL Editor step.

### Private books on the free plan

The supplied PDFs are intentionally not part of Git history or the deployment bundle. Supabase Free limits each Storage object to 50 MiB, so split each PDF into 45 MiB parts and upload the generated files to a private `books` bucket. Run the splitter once per book (the output is ignored by Git):

```sh
python scripts/split_books_for_storage.py --input "N5-books/Study Material N5/Genki - An Integrated Course in Elementary Japanese I [Second Edition] (2011), WITH PDF BOOKMARKS!.pdf" --book-id genki-i
python scripts/split_books_for_storage.py --input "N5-books/Study Material N5/Goukaku_Dekiru_N4.5.pdf" --book-id goukaku-dekiru
python scripts/split_books_for_storage.py --input "N5-books/Study Material N5/Nihongo_Challenge_Kanji_N4-N5.pdf" --book-id nihongo-challenge-kanji
```

Apply `0015_private_book_storage.sql`, upload `.book-storage/books/<book-id>/part-*.pdf` to the matching paths in the private bucket, and set `SUPABASE_SERVICE_ROLE_KEY` (or the existing `SUPABASE_SERVICE_KEY`) only in the server deployment environment. The app checks the existing allowlist, returns short-lived signed URLs for each private part, and assembles the PDF in the browser so large books do not pass through a Vercel Function response. Routine pronunciation uses browser speech; generated audio blobs are not stored by default. Third-party audio remains source-linked or externally streamed only after its terms/provenance are recorded.

### Vercel deployment

1. Import this repository into Vercel with the project root set to this directory and the Next.js framework preset. Use the current production branch configured in Vercel; pushes to that branch create production deployments, while other branches create previews.
2. Add these environment variables in Vercel Project Settings → Environment Variables:

   ```text
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ALLOWED_EMAIL
   ALLOWED_EMAILS                   # optional additional accounts
   ADMIN_EMAIL                     # Content Studio / AI owner
   ADMIN_USER_ID                   # optional exact Supabase Auth UUID
   SUPABASE_SERVICE_KEY
   SUPABASE_BOOKS_BUCKET=books
   OPENROUTER_API_KEY                 # optional, Studio AI only
   OPENROUTER_MODELS                  # optional
   OPENROUTER_MODEL                   # optional fallback
   ```

   Apply the public variables to Preview and Production. Apply the service key, allowlisted email, and optional AI key only where needed. Never use `NEXT_PUBLIC_` for a service key.
3. In Supabase Dashboard → Authentication → URL Configuration, set Site URL to the production domain and add `<production-domain>/auth/callback`. Add the matching Vercel preview callback pattern if preview sign-in is needed.
4. For Google sign-in, open Supabase Dashboard → Authentication → Providers → Google, enable it, and paste the Google OAuth Client ID and Client Secret. In Google Cloud, create a Web application OAuth client and set its authorized redirect URI to the callback URL shown in the Supabase Google provider panel (`https://<project-ref>.supabase.co/auth/v1/callback`). In Supabase Authentication → URL Configuration, add `<production-domain>/auth/callback` to Redirect URLs. The app's Google button already uses that callback, and the callback still enforces the email allowlist and admin email.
5. For a new Supabase project, run every migration in `supabase/migrations/` in filename order, including `0014_sync_metadata.sql`, `0015_private_book_storage.sql`, `0016_repair_schema.sql`, and `0017`–`0019`, then run `supabase/seed.sql`. For the configured project, migrations, seed, core tables, and the 313-row hosted curriculum have already been verified; there is no SQL Editor action left.
6. Confirm the `books` bucket is private and contains every uploaded book part. The deployed Books reader loads through `/api/books/<book-id>/parts`; the old whole-file endpoint remains only as a local fallback.
7. Deploy, then smoke-test: magic-link login, Google login, `/journey`, `/practice`, `/profile` sync, `/studio` as admin, and every `/books/<book-id>` reader. Change Vercel environment variables only before a new deployment; existing deployments keep their previous values.

## Checks

```sh
/usr/bin/node --test test/*.test.mjs
./node_modules/.bin/tsc --noEmit --pretty false --incremental false
./node_modules/.bin/next build
```

AI generation is server-side, admin-gated, and draft-only until review. Renshuu content is not imported; the current curriculum is original/curated, and dictionary sources are cached by a project script before review. The review queue now has deterministic priority scoring, provenance-aware editing, source coverage diagnostics, and publish QA. See [`docs/product/CONTENT-SOURCES.md`](docs/product/CONTENT-SOURCES.md) and [`docs/product/SOURCE-EVALUATION.md`](docs/product/SOURCE-EVALUATION.md) for the complete source roles, delivery boundaries, and term decisions.

## Staged source import

Run the full cache-first N5 acquisition phase with one command. It creates ignored review-only files and does not publish anything. Marugoto PDF indexes are extracted when `pdftotext` is available; otherwise they remain cached with provenance for a later pass:

```sh
python scripts/build_phase1_staging.py --level N5 --bridge-level N4
```

Use `--offline` when the source artifacts are already in `data/source-cache/`, or `--force` to refresh them. The individual steps remain available when debugging a single importer:

```sh
python scripts/ingest_openjlpt.py --level N5
python scripts/ingest_irodori_wordlist.py
python scripts/ingest_irodori_sentence_patterns.py
python scripts/ingest_irodori_kanji.py
python scripts/merge_openjlpt_staging.py --source-manifest data/source-cache/manifest.json --extra data/staging/irodori-vocabulary.json --extra data/staging/irodori-grammar.json --extra data/staging/irodori-kanji.json
python scripts/report_phase1_staging.py
python scripts/qa_content_package.py --package data/staging/kizashi-n5-source-review.json
python scripts/render_supabase_content_sql.py --approved --questions data/staging/kizashi-question-review.json
```

The browser does not ask you to load source files. Run `python scripts/fetch_dictionary_sources.py --source core --level N5` once to cache the approved dictionary, curriculum, frequency, and sentence artifacts in ignored `data/source-cache/`. Then run `python scripts/ingest_openjlpt.py --level N5`; it automatically consumes cached JMdict, linked JMdict examples, BCCWJ frequency data, and capped Tatoeba Japanese-English candidates when both Tatoeba exports exist. Run `python scripts/merge_openjlpt_staging.py` to build an importable, review-only package. Content Studio loads the tracked compressed snapshot `data/staging/kizashi-n5-source-review.json.gz`, so the review package is available after deployment; after regenerating the JSON locally, refresh the snapshot with `gzip -c data/staging/kizashi-n5-source-review.json > data/staging/kizashi-n5-source-review.json.gz`. Imported records retain `reviewStatus: "pending"`; the private learner route can expose non-rejected records with an explicit `humanReviewed: false` marker, while Content Studio/SQL export still require approval. `qa_content_package.py --strict` fails on missing learner fields, provenance, reviewed classification, or real-lesson assignment. After reviewing and fixing the package, export the approved question array if needed, then run `python scripts/render_supabase_content_sql.py --approved --questions data/staging/kizashi-question-review.json` and apply the generated SQL; this exporter only writes a local SQL file, validates required learner-facing fields, and never connects to Supabase. Omit `--questions` when importing curriculum records only. Migrations `0010_content_review_status.sql` and `0011_content_source_types.sql` store the review gate and source roles in Supabase.

Optional lookup, corpus-evaluation, and book tools remain review-only:

```sh
python scripts/fetch_dictionary_sources.py --source lookup --level N5
python scripts/ingest_jmnedict.py --input data/source-cache/JMnedict.xml.gz
python scripts/ingest_sudachi.py --input data/source-cache/sudachi-dictionary-latest.zip
python scripts/fetch_dictionary_sources.py --source spoken-evaluation --level N5
python scripts/fetch_dictionary_sources.py --source learner-evaluation --level N5
python scripts/extract_book_candidates.py --input "N5-books/Study Material N5/<book>.pdf" --book-id <book-id>
python scripts/extract_book_content.py --input "<reviewed text export>" --book-id <book-id>
```

JMnedict is proper-name lookup data, not JLPT vocabulary. Sudachi staging is morphology lookup data, not curriculum truth. Book extraction preserves page/checksum provenance and emits pending candidates; structured book facts require explicit `CHAPTER`, `PAGE`, and fact-type lines. Neither tool publishes to Supabase. See [`docs/product/CONTENT-SOURCES.md`](docs/product/CONTENT-SOURCES.md) and `docs/product/SOURCE-EVALUATION.md` for the CEJC, CSJ, I-JAS, audio, and WaniKani decisions.
