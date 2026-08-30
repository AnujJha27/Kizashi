# Kizashi

Kizashi is a calm, dark-first Japanese-learning path. The current slice includes the responsive shell, Journey, interactive N5 study/review loop, PWA shell, content validation, and Supabase-backed curriculum.

## Local setup

```sh
npm install
cp .env.example .env.local
npm run dev
```

Without Supabase variables the app runs in local demo mode. With Supabase configured, magic-link auth, the `ALLOWED_EMAIL` allowlist, protected app routes, and RLS-backed account sync are active. Apply the migrations in `supabase/migrations/`, including `0014_sync_metadata.sql`, before enabling account sync in Profile.

Apply the migrations in `supabase/migrations/`, then run `supabase/seed.sql` in the Supabase SQL Editor. Curriculum reads require an authenticated user when Supabase is configured; user-owned tables remain protected by RLS. Profile sync is explicit opt-in and keeps browser state intact if the network fails.

### Private books on the free plan

The supplied PDFs are intentionally not part of Git history or the deployment bundle. Supabase Free limits each Storage object to 50 MiB, so split each PDF into 45 MiB parts and upload the generated files to a private `books` bucket. Run the splitter once per book (the output is ignored by Git):

```sh
python scripts/split_books_for_storage.py --input "N5-books/Study Material N5/Genki - An Integrated Course in Elementary Japanese I [Second Edition] (2011), WITH PDF BOOKMARKS!.pdf" --book-id genki-i
python scripts/split_books_for_storage.py --input "N5-books/Study Material N5/Goukaku_Dekiru_N4.5.pdf" --book-id goukaku-dekiru
python scripts/split_books_for_storage.py --input "N5-books/Study Material N5/Nihongo_Challenge_Kanji_N4-N5.pdf" --book-id nihongo-challenge-kanji
```

Apply `0015_private_book_storage.sql`, upload `.book-storage/books/<book-id>/part-*.pdf` to the matching paths in the private bucket, and set `SUPABASE_SERVICE_ROLE_KEY` (or the existing `SUPABASE_SERVICE_KEY`) only in the server deployment environment. The app checks the existing allowlist, returns short-lived signed URLs for each private part, and assembles the PDF in the browser so large books do not pass through a Vercel Function response. Free Supabase storage includes 1 GB, so these three PDFs fit by size; videos are not part of the deployed Books surface.

### Vercel deployment

1. Import this repository into Vercel with the project root set to this directory and the Next.js framework preset. Use the current production branch configured in Vercel; pushes to that branch create production deployments, while other branches create previews.
2. Add these environment variables in Vercel Project Settings → Environment Variables:

   ```text
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   ALLOWED_EMAIL
   SUPABASE_SERVICE_KEY
   SUPABASE_BOOKS_BUCKET=books
   OPENROUTER_API_KEY                 # optional, Studio AI only
   OPENROUTER_MODELS                  # optional
   OPENROUTER_MODEL                   # optional fallback
   ```

   Apply the public variables to Preview and Production. Apply the service key, allowlisted email, and optional AI key only where needed. Never use `NEXT_PUBLIC_` for a service key.
3. In Supabase Dashboard → Authentication → URL Configuration, set Site URL to the production domain and add `<production-domain>/auth/callback`. Add the matching Vercel preview callback pattern if preview sign-in is needed.
4. In Supabase SQL Editor, run every migration in `supabase/migrations/` in filename order, including `0014_sync_metadata.sql`, `0015_private_book_storage.sql`, and the idempotent `0016_repair_schema.sql` when the remote migration history says it is current but a seed reports missing tables. Then run `supabase/seed.sql`. Do not enable account sync until the tables exist.
5. Confirm the `books` bucket is private, PDF-only, and contains every uploaded part. The deployed Books reader should load through `/api/books/<book-id>/parts`; the old whole-file endpoint remains only as a local fallback.
6. Deploy, then smoke-test: magic-link login, `/journey`, `/practice`, `/profile` sync, `/studio`, and every `/books/<book-id>` reader. Change Vercel environment variables only before a new deployment; existing deployments keep their previous values.

## Checks

```sh
/usr/bin/node --test test/*.test.mjs
./node_modules/.bin/tsc --noEmit --pretty false --incremental false
./node_modules/.bin/next build
```

AI generation is server-side, allowlist-gated, and draft-only until review. Renshuu content is not imported; the current curriculum is original/curated, and dictionary sources are cached by a project script before review. The review queue now has deterministic priority scoring, provenance-aware editing, and publish QA.

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

The browser does not ask you to load source files. Run `python scripts/fetch_dictionary_sources.py --source core --level N5` once to cache the approved dictionary, curriculum, frequency, and sentence artifacts in ignored `data/source-cache/`. Then run `python scripts/ingest_openjlpt.py --level N5`; it automatically consumes cached JMdict, linked JMdict examples, BCCWJ frequency data, and capped Tatoeba Japanese-English candidates when both Tatoeba exports exist. Run `python scripts/merge_openjlpt_staging.py` to build an importable, review-only package. Content Studio loads the tracked compressed snapshot `data/staging/kizashi-n5-source-review.json.gz`, so the review package is available after deployment; after regenerating the JSON locally, refresh the snapshot with `gzip -c data/staging/kizashi-n5-source-review.json > data/staging/kizashi-n5-source-review.json.gz`. Imported records start with `reviewStatus: "pending"`; approve each record in Content Studio before exporting. `qa_content_package.py --strict` fails on missing learner fields, provenance, reviewed classification, or real-lesson assignment. After reviewing and fixing the package, export the approved question array if needed, then run `python scripts/render_supabase_content_sql.py --approved --questions data/staging/kizashi-question-review.json` and apply the generated SQL; this exporter only writes a local SQL file, validates required learner-facing fields, and never connects to Supabase. Omit `--questions` when importing curriculum records only. Migrations `0010_content_review_status.sql` and `0011_content_source_types.sql` store the review gate and source roles in Supabase.

Optional lookup and book tools remain review-only:

```sh
python scripts/fetch_dictionary_sources.py --source lookup --level N5
python scripts/ingest_jmnedict.py --input data/source-cache/JMnedict.xml.gz
python scripts/extract_book_candidates.py --input "N5-books/Study Material N5/<book>.pdf" --book-id <book-id>
```

JMnedict is proper-name lookup data, not JLPT vocabulary. Book extraction preserves page/checksum provenance and emits pending candidates. Neither tool publishes to Supabase; SudachiDict, CEJC, and CSJ remain optional inputs pending license review.
