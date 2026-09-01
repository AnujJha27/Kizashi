# Kizashi

Kizashi is a private Japanese-learning application focused on JLPT N5 study,
practical comprehension, and long-term immersion. It combines a structured
learning journey with adaptive practice, reading, listening, references, and
progress tracking in one responsive interface.

## Features

- Guided N5 Journey covering vocabulary, kanji, grammar, reading, and listening
- Adaptive drills, weak-area practice, integrated questions, and mock exams
- Furigana, sentence inspection, human pronunciation lookup, and browser speech
- Graded reading, native reading, dialogue, shadowing, and practical lessons
- Tae Kim, Wikibooks, Irodori, Tadoku, Aozora, and Wikimedia integrations
- Exam planning, mastery tracking, and targeted mistake repair
- Searchable library and provenance-aware Content Studio
- Private book reader, optional account sync, and PWA support

## Stack

- Next.js 15 and React 19
- TypeScript and Tailwind CSS
- Supabase Auth, PostgreSQL, and Storage
- Vercel deployment
- Node and Python content tooling

## Local development

```sh
npm install
cp .env.example .env.local
npm run dev
```

The application runs with bundled local content when Supabase variables are
absent. Configure Supabase to enable authentication, hosted curriculum, private
books, and account sync.

### Environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ALLOWED_EMAIL
ALLOWED_EMAILS                  # optional
ADMIN_EMAIL
ADMIN_USER_ID                   # optional
SUPABASE_SERVICE_KEY
SUPABASE_BOOKS_BUCKET=books
OPENROUTER_API_KEY              # optional Content Studio generation
OPENROUTER_MODELS               # optional
OPENROUTER_MODEL                # optional fallback
```

Keep service-role and AI credentials server-side.

## Database setup

For a new Supabase project, apply the migrations and seed:

```sh
supabase login
supabase link --project-ref <project-ref>
supabase migration list
supabase db push
```

Then run `supabase/seed.sql`. Generate the current idempotent curriculum import
with:

```sh
python scripts/render_supabase_content_sql.py
```

The generated file is `supabase/generated/kizashi-content.sql`. Pending records
remain marked as unreviewed; rejected records are excluded.

## Content pipeline

Build the staged N5 package from cached source material:

```sh
python scripts/build_phase1_staging.py --level N5 --bridge-level N4
```

Use `--offline` to work from `data/source-cache/`, or `--force` to refresh
cached inputs. The resulting learner package is
`data/staging/kizashi-n5-source-review.json`; the deployed snapshot is its
tracked gzip version.

Useful commands:

```sh
python scripts/report_phase1_staging.py
python scripts/qa_content_package.py --package data/staging/kizashi-n5-source-review.json --strict
python scripts/render_supabase_content_sql.py --questions data/staging/kizashi-question-review.json
```

Content Studio keeps source metadata, review status, field provenance, and
learner flags visible. All non-rejected records are assigned to bounded Journey
lessons so study and practice do not load the entire package at once.

Source roles and integration details are documented in
[`docs/product/CONTENT-SOURCES.md`](docs/product/CONTENT-SOURCES.md) and
[`docs/product/SOURCE-EVALUATION.md`](docs/product/SOURCE-EVALUATION.md).

## Private books

Large books can be split into Storage-compatible parts:

```sh
python scripts/split_books_for_storage.py --input "path/to/book.pdf" --book-id <book-id>
```

Upload `.book-storage/books/<book-id>/part-*.pdf` to the corresponding path in
the private `books` bucket. The authenticated reader requests short-lived URLs
and assembles the parts in the browser.

The Books page also includes a shared Google Drive shelf at `/books/drive` for
large reference collections; access follows the permissions of that Drive
folder.

## Verification

```sh
npm test
npm run typecheck
npm run build
git diff --check
```

## Deployment

Import the repository into Vercel, configure the environment variables, and set
the Supabase authentication redirect URL to:

```text
https://<production-domain>/auth/callback
```

For Google sign-in, configure the OAuth callback shown by the Supabase Google
provider. After deployment, smoke-test authentication, Journey, Practice,
Profile sync, Content Studio, Immersion, and the private book reader.

## Documentation

- [`HANDOFF.md`](HANDOFF.md) — current implementation and deployment state
- [`TODO.md`](TODO.md) — remaining work and completed milestones
- [`docs/product/PRD.md`](docs/product/PRD.md) — product requirements
- [`docs/product/CONTENT-SOURCES.md`](docs/product/CONTENT-SOURCES.md) — content inventory
