# Kizashi Remaining Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the actionable remaining Kizashi backlog around reviewed content, learner adaptation, authenticated sync, books, source tooling, and original N5 practice without publishing unreviewed or proprietary material.

**Architecture:** Keep the existing Next.js App Router, local-first browser state, typed curriculum package, and Supabase schema. Add pure deterministic scoring/selection helpers where behavior is shared, server-side Supabase sync behind the existing auth boundary, and small source/import utilities that stage data for owner review. Keep external source acquisition and AI generation downstream from canonical facts and human approval.

**Tech Stack:** Next.js 15, React 19, TypeScript, browser localStorage/SpeechSynthesis, Supabase SSR, PostgreSQL migrations, Python standard library, Node test runner.

**Spec:** `TODO.md`, `docs/product/PRD.md`, `docs/product/ADDENDUM.md`, `docs/product/ADDENDUM-2.md`, and `HANDOFF.md`.

## Global Constraints

- Do not modify `lattice/` or unrelated root changes.
- Do not publish pending or rejected content to the learner path.
- Do not copy copyrighted textbook, JLPT, Renshuu, or third-party exercise content.
- Preserve source records, licenses, retrieval dates, checksums, local filenames, and review status.
- Use official JLPT materials for blueprint/calibration only, not as a bulk content database.
- Keep AI keys server-side and never treat generated output as canonical linguistic data.
- Keep the app usable without Supabase configuration through local demo mode.
- Preserve field-level provenance for readings, meanings, classifications, and frequency values.
- No broad staging; commit/push only the explicitly requested Kizashi files after verification.

---

### Task 1: Make reviewed content publishable only through a real learner route

**Files:**
- Modify: `components/content/content-studio.tsx`
- Modify: `components/content/content-record-editor.tsx`
- Modify: `lib/content-validation.ts`
- Modify: `scripts/render_supabase_content_sql.py`
- Test: `test/content.test.mjs`

**Interfaces:**
- Content records continue to use `reviewStatus`, `classification`, `sourceIds`, and `fieldSourceIds`.
- Approved source-review records must have at least one non-review Journey lesson assignment before SQL export.

- [x] **Step 1: Write failing checks** for rejected/pending exclusion, approved source-review classification, and unassigned-approved export failure.
- [x] **Step 2: Run the direct Node and Python checks** and confirm the new assertions fail for the missing behavior.
- [x] **Step 3: Add the smallest shared validation/export guards** and expose lesson assignment in the existing normal Studio editor.
- [x] **Step 4: Re-run the focused checks** and inspect generated SQL for approved records only.

### Task 2: Finish review triage and content intelligence

**Files:**
- Create: `lib/content-priority.js`
- Modify: `components/content/content-studio.tsx`
- Modify: `components/content/topic-coverage.tsx`
- Modify: `lib/curriculum.ts`
- Modify: `lib/session.ts`
- Test: `test/content.test.mjs`

**Interfaces:**
- `rankContentCandidates(items, records, mistakes, limit)` returns stable priority order using review status, curriculum band, frequency, missing learner fields, and learner weakness.
- `getItemPriority(item, records, mistakes)` returns a numeric priority and reason string.

- [x] **Step 1: Add failing tests** for stable candidate ordering, missing-field priority, and learner weakness priority.
- [x] **Step 2: Run the focused Node test** and confirm it fails because the helper is absent.
- [x] **Step 3: Implement the pure helper** with standard-library data operations and wire the Studio queue to search, filter, paginate, and show the reason.
- [ ] **Step 4: Add explicit topic/band coverage gaps** and a weak-concept route without inventing content.
- [x] **Step 5: Run focused checks** and confirm pending/rejected records remain out of learner counts.

### Task 3: Expand the original N5 content route

**Files:**
- Modify: `data/n5-conversation-expansion.json`
- Modify: `data/n5-practical-expansion.json`
- Modify: `data/n5-life-expansion.json`
- Modify: `data/n5-authored-practice.json`
- Modify: `lib/questions.ts`
- Modify: `lib/curriculum.ts`
- Test: `test/content.test.mjs`

**Interfaces:**
- Keep existing `VocabularyItem`, `KanjiItem`, `GrammarItem`, `ReadingItem`, `ListeningItem`, and `PracticeQuestion` shapes.
- Represent the four listening families with `task-based response`, `key point`, `verbal expression`, and `quick response` question types.

- [ ] **Step 1: Add failing content-shape assertions** for topic coverage, contextual links, original reading lengths, listening-family coverage, and linked question targets.
- [ ] **Step 2: Run the content checks** and confirm the current package fails the missing coverage assertions.
- [ ] **Step 3: Add only authored, original records** with readings, useful kanji words, prerequisites, contrasts, examples, and plausible distractors.
- [ ] **Step 4: Make practice selection preserve skill and listening-family coverage** in quick, section, pass, and full modes.
- [ ] **Step 5: Run the focused checks** and verify every active question targets an existing item.

### Task 4: Restore allowlisted auth and per-user Supabase sync safely

**Files:**
- Modify: `middleware.ts`
- Modify: `app/(main)/layout.tsx`
- Modify: `components/auth/login-form.tsx`
- Modify: `lib/auth/allowlist.ts`
- Modify: `lib/auth/guard.ts`
- Create: `app/api/sync/route.ts`
- Create: `lib/supabase/sync.ts`
- Modify: `lib/session.ts`
- Modify: `supabase/migrations/0014_sync_metadata.sql`
- Modify: `lib/types.ts`
- Test: `test/auth.test.mjs`

**Interfaces:**
- `POST /api/sync` accepts a bounded typed snapshot and merges only the authenticated user’s rows.
- `GET /api/sync` returns the authenticated user’s progress, review history, mistakes, notes, study sessions, and preferences.
- Missing Supabase configuration continues to use local demo mode.

- [ ] **Step 1: Add failing allowlist and sync payload tests** for case-insensitive email matching, missing allowlist denial, bounded payloads, and user ownership.
- [ ] **Step 2: Run direct checks** and confirm the tests fail before the route/helper exists.
- [ ] **Step 3: Protect the main route group and callback with the existing server guard**, preserving the no-auth branch when Supabase is absent.
- [ ] **Step 4: Add server-side sync with table allowlisting and conflict-safe upserts**; never accept a user ID from the client.
- [ ] **Step 5: Add a local-first sync hook** that retries on reconnect and keeps unsynced local state intact on failure.
- [ ] **Step 6: Run auth/payload checks** without requiring real credentials.

### Task 5: Complete study modes, daily goals, and mistake remediation

**Files:**
- Modify: `components/journey/daily-session.tsx`
- Modify: `components/practice/local-practice.tsx`
- Modify: `components/practice/practice-player.tsx`
- Modify: `components/learning/review-queue.tsx`
- Modify: `components/mistakes/mistake-notebook.tsx`
- Modify: `lib/questions.ts`
- Modify: `lib/session.ts`
- Modify: `lib/jlpt.ts`
- Test: `test/mastery.test.mjs`

**Interfaces:**
- Daily actions support 5/10/20/30-minute goals and resumable sessions.
- Learning mode shows feedback; exam mode defers feedback and records a timed attempt.
- Weak practice prioritizes recurring mistakes and grammar contrasts.

- [ ] **Step 1: Add failing mastery/session checks** for confidence-weighted ratings, section weakness precedence, daily goal progress, and exact resume position.
- [ ] **Step 2: Run the direct mastery checks** and confirm the new cases fail.
- [ ] **Step 3: Implement the smallest deterministic queue/session changes** using the existing local storage keys.
- [ ] **Step 4: Wire the UI states and accessible button fallbacks** while preserving keyboard and reduced-motion behavior.
- [ ] **Step 5: Run focused mastery checks** and inspect the resulting question mix.

### Task 6: Finish books and source-roadmap tooling

**Files:**
- Create: `scripts/ingest_jmnedict.py`
- Create: `scripts/ingest_sudachi.py`
- Create: `scripts/extract_book_content.py`
- Modify: `scripts/build_phase1_staging.py`
- Modify: `components/books/book-reader.tsx`
- Modify: `app/(main)/books/[bookId]/page.tsx`
- Modify: `lib/books.ts`
- Modify: `lib/types.ts`
- Test: `test/source-tools.test.mjs`

**Interfaces:**
- Source tools write review-only JSON with source manifest and per-record provenance.
- Book extraction records contain book ID, chapter, page, extracted fact type, raw text, and `reviewStatus: pending`.
- No source tool publishes to Supabase or treats names/morphology as JLPT curriculum.

- [x] **Step 1: Add failing parser checks** for JMnedict names and book provenance records.
- [x] **Step 2: Run the checks** and confirm the new parsers are absent.
- [x] **Step 3: Implement standard-library parsers and cache-first CLI options** with explicit license/source metadata.
- [ ] **Step 4: Add book chapter/page selection and a side-by-side review panel** without exposing private PDFs publicly.
- [ ] **Step 5: Run parser checks** against small fixtures only; do not ingest or publish the supplied books automatically.

### Task 7: Harden AI/admin boundaries and documentation

**Files:**
- Modify: `app/api/content/generate/route.ts`
- Modify: `components/content/ai-generator.tsx`
- Modify: `components/content/content-studio.tsx`
- Modify: `lib/content-validation.ts`
- Modify: `README.md`
- Modify: `TODO.md`
- Modify: `HANDOFF.md`
- Test: `test/content.test.mjs`

**Interfaces:**
- Generated content remains draft-only until explicit review.
- Generated records carry model, target IDs, validation issues, reviewer, timestamp, and notes.

- [ ] **Step 1: Add failing checks** for unauthenticated generation, target-item mismatch, rate-limit behavior, and draft-only output.
- [ ] **Step 2: Run direct checks** and confirm the missing boundary behavior.
- [ ] **Step 3: Enforce the existing server-side validation and auth boundary** and make review metadata editable in Studio.
- [ ] **Step 4: Update backlog/handoff entries only for work actually implemented**, keeping human review and licensing gates visible.
- [ ] **Step 5: Run focused checks** and inspect the final diff for unrelated files.

### Task 8: Full verification and GitHub push

**Files:**
- No new source files; inspect all changed files.

- [ ] **Step 1: Run `node --test test/*.test.mjs` directly** and record every test result.
- [ ] **Step 2: Run TypeScript directly through the installed compiler** if the npm wrapper remains blocked.
- [ ] **Step 3: Run the Next build directly through the installed Next binary** if possible.
- [ ] **Step 4: Run `git diff --check`, inspect `git status`, and exclude `scripts/__pycache__/` and unrelated changes.**
- [ ] **Step 5: Push the scoped branch to `origin` (`git@github.com:AnujJha27/Kizashi.git`) using the current branch only after the checks and an explicit review of the staged file list.**
