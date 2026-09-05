# ADDENDUM — KIZASHI UX, INFORMATION ARCHITECTURE, AND DAILY LEARNING FLOW

Repository:

`AnujJha27/Kizashi`

This is an ADDENDUM to the existing Kizashi implementation milestones:

1. `KIZASHI — N5/N4 CONTENT DEPTH, EXAM BANK, AND IMMERSION MASTER MILESTONE`
2. `ADDENDUM — CONTENT COMPLETENESS, OUTPUT SKILLS, AND ADDITIONAL IMMERSION SOURCES`

It does NOT supersede, weaken, postpone, or replace those requirements.

All content, curriculum, source, N5/N4, exam-bank, Immersion, pronunciation, dictation, conjugation, output, provenance, validation, and storage requirements from those prompts remain active.

This addendum addresses a different problem:

> Kizashi is accumulating many strong systems, but its UX must not expose all of those systems as an overwhelming set of pages, modes, datasets, and controls.

The objective is to make Kizashi feel like:

> a personal Japanese learning operating system that knows what the learner should do next

rather than:

> a collection of Japanese-learning tools requiring the learner to manually orchestrate their study plan.

This is an IMPLEMENTATION task.

Do not stop at:

* wireframes,
* UX recommendations,
* screenshots,
* TODO lists,
* component scaffolding,
* empty navigation changes,
* disconnected mock data.

## Code-backed implementation status

Updated 2026-09-04. These checkboxes describe what is currently present in the
repository; they are not a replacement for the requirements below.

Legend: `[x]` implemented in code, `[~]` partially implemented or still needs
verification, `[ ]` not implemented.

### Learner flow

- [x] Primary navigation reduced to Today, Practice, Immersion, and Library; secondary destinations live behind More.
- [x] Mobile navigation uses the same primary destinations with an accessible More menu.
- [x] Today/Journey has a time-aware greeting, current-path CTA, duration choices, and a resumable in-place session that advances through the existing review, lesson, quick-practice, listening, and reading components; short durations select a smaller coherent subset and longer durations add context blocks.
- [x] Practice is organized around Quick, Focus, Weaknesses, and Test while retaining compatible deep links for existing modes.
- [x] Practice defers its question bank and bounds the live working catalog instead of retaining the full imported lesson corpus on every drill.
- [x] Learner content loading merges the released remote package with bundled authored expansions, so deployment does not drop bundled reading/listening lessons while waiting on review data.
- [x] Learn opens the active lesson directly with a compact lesson selector and step progression.
- [x] Immersion is split into a recommendation feed and a focused activity player.
- [x] Immersion includes a compact pronunciation lane with authored N5/N4 lessons, discrimination exercises, separate progress states, browser audio fallback, and optional OJAD exploration; it remains outside JLPT readiness.
- [x] Immersion includes a dedicated `実際に使う` real-life lane for source-hosted Irodori activities, separate from the general source shelf.
- [x] Grammar entries surface mapped Irodori communicative patterns beside the existing Tae Kim and Wikibooks references, with source course/lesson focus and attribution available on demand; unmapped source-only patterns remain clearly labeled rather than masquerading as Kizashi explanations.
- [x] Continue/resume state is shared across lessons, practice, immersion, and reading using the existing local session layer.
- [x] Mistakes acts as a Repair Center with modality-specific repair actions.
- [x] Cmd/Ctrl-K searches Japanese content, lessons, reading, immersion, and references through the bounded search route.
- [x] Progress leads with a weekly narrative, recent strengths, accuracy, and priority signals before detailed metrics.
- [x] Library entries expose direct Practice and Immersion actions; Books, Reference, and saved sentences are reachable from Library.
- [x] Journey visual hierarchy is reduced to the active lesson plus up to three nearby lessons, with learner-sized current-lesson totals.
- [x] Shelf/card spacing uses editorial action rows so the current Aozora/Tadoku controls stay readable; book readers give the PDF more width than the notes pane while retaining side-by-side notes on wide screens.

### Adaptive support and presentation

- [x] Furigana preference support now honors `Always`, `Unknown`, `Tap`, and `Hide` in the shared `JapaneseText` and `ReadingPanel` renderers; Immersion list/player titles and passages, Aozora/Tadoku titles, Practice text, lesson prompts/answers, selected reading words, Library cards and entry headers, Progress recurring mistakes, Mistake Center entries, Knowledge Map, learner-assistant output, and Content Studio review fields now use the same Japanese-aware renderer, `Tap` reveals the clicked word, and challenge mode remains strict. Lesson and Library detail grammar formation plus listening transcripts fade to explicit support buttons after repeated/strong performance, while production models remain explicit reveals. Content Studio intentionally remains fully inspectable.
- [x] Quick practice favors unseen question variants across restarts while preserving stronger priority for mistakes, due reviews, and flagged ambiguity; its pool includes additional vocabulary, kanji, grammar, reading, and listening variants so a short session does not immediately recycle the same few questions.
- [x] Contextual actions connect items to practice, immersion, study-later, and repair flows.
- [x] Card density and source/player separation have been reduced; Immersion and Practice activity navigation are compact scrollable tab rows, while reading/listening, real-life activities, source detours, and grammar references use editorial separator rows and progressive loading.
- [x] Practice and Studio defer heavy package work, isolate persisted queues by mode/length/topic, switch Practice controls immediately while moving the expensive queue replacement into a React transition and keeping a ready/loading overlay until the new queue reports ready, show route loading feedback, disable speculative heavy-route prefetching, defer Studio's large review-package/local-draft work and saved-question validation to idle time without re-running that work when the question bank state changes, rank only the visible Studio review page, scope Studio card furigana to the visible page while retaining full-index inspection in the one-record modal, keep AI target selection searchable instead of mounting thousands of options, show only pending question drafts, keep generated/AI drafts out of learner queues until approved, load the generated question bank and coverage on demand, cache bounded generated questions across switches, memoize the filtered question/item inputs so adaptive ranking cannot re-trigger itself on every render, reuse the cached learner module on Practice remounts, merge valid local question drafts into the complete active bank instead of replacing it, keep full Studio reading diagnostics explicit and chunked instead of auto-running on page load, keep the diagnostic bank client-side, cache shared furigana preference/review-record reads across JapaneseText instances, include reviewed readings for common polysemous words such as 水/本/ご飯 in the shared renderer, and avoid the stale global scroll lock/browser overflow interaction that previously stranded route scrolling; a complete mobile, accessibility, and performance audit remains.

### Delivery status by implementation phase

- [x] Phase 1 — UX audit
- [x] Phase 2 — Navigation simplification
- [x] Phase 3 — Today/session orchestrator
- [x] Phase 4 — Practice IA
- [x] Phase 5 — Learn simplification
- [x] Phase 6 — Immersion refactor
- [x] Phase 7 — Universal continue/resume
- [x] Phase 8 — Repair Center
- [x] Phase 9 — Unified Japanese search
- [x] Phase 10 — Adaptive scaffolding (core furigana, grammar formation, production model, and lesson/listening transcript reveals are wired; Content Studio remains fully inspectable by design)
- [x] Phase 11 — Progress narrative
- [x] Phase 12 — Journey visual hierarchy
- [x] Phase 13 — Contextual actions
- [~] Phase 14 — Visual refinement (area-aware atmosphere, progression stages, distinct generated-raster imagery for the Journey hero, Today, Journey current-lesson tracker, and Learn lesson opening, plus restrained area-completion transitions now feed the shell, Today, Journey, Learn, and profile; screenshot review and the final visual audit remain)
- [~] Phase 15 — Mobile/accessibility/performance (global keyboard focus ring, skip-to-content target, and responsive min-width-safe lesson/Journey grids are wired; final device/browser audit remains)
- [x] Phase 16 — Tests/build verification (24/24 direct Node test files pass; strict package QA, typecheck, and production build are green)

### Feature-to-code evidence

This is the short implementation index for the requirements below. A checked
item means the learner-facing path exists in the current repository; partial
items intentionally remain visible until the remaining surfaces are finished.

- [x] **Navigation shell** — `components/shell/app-shell.tsx`, `/journey`, `/practice`, `/immersion`, and `/library`; secondary destinations remain available through More.
- [x] **Offline visual shell** — `public/sw.js` pre-caches the current Journey/Today/lesson raster scenes and local listening illustrations under a new cache revision, while CSS fallbacks use the generated neighborhood scene instead of retired PNG atmosphere assets.
- [x] **Offline reading visuals** — the same shell cache includes the eight local reading scene assets used by `ReadingPanel`; Japanese passage text remains the actual study content if any image is unavailable.
- [x] **Today/session orchestration** — `components/journey/daily-session.tsx`, `app/(main)/journey/page.tsx`, `components/learning/lesson-player.tsx`, `components/practice/lazy-practice.tsx`, and `lib/exam-plan-core.js`; duration chooses a coherent stage sequence, the existing players run in-place, progress is saved by date/lesson/level, and completion has a stop point.
- [x] **Today interruption resume** — an interrupted local Today flow restores by date, lesson, and target level, and the Journey path exposes the next stage plus completed-stage count before resuming.
- [x] **Practice IA and bounded loading** — `components/practice/practice-mode-tabs.tsx`, `components/practice/lazy-practice.tsx`, `components/practice/practice-player.tsx`, `components/content/use-content-module.ts`, and `lib/questions.ts`; Quick/Focus/Weaknesses/Test group the existing modes, the question bank loads inside the practice panel, N4 vocabulary bridge items add explicit natural-usage questions, and repeated mode switches reuse the stable bounded learner module instead of rebuilding the full pool.
- [x] **Practice empty state** — an empty learner queue now explains that reviews are clear and offers an Ear warm-up or current-lesson path; unavailable exam sets keep a separate test-specific message.
- [x] **Transitivity learning cluster** — `data/n4-grammar-expansion.json` adds a focused lesson for four useful 自動詞／他動詞 pairs with paired examples and particle cues, keeping the distinction concrete in the learner path.
- [x] **Conjugation focus** — the existing PracticePlayer exposes bounded reviewed verb/adjective transformation prompts through `/practice?mode=conjugation`; it stays inside Focus while reading/listening drills remain in Immersion.
- [~] **Original reading practice** — `data/original-reading-bank.json`, `scripts/generate_original_reading_bank.py`, `scripts/merge_openjlpt_staging.py`, `lib/curriculum.ts`, and `components/learning/reading-panel.tsx`; the 115 N5/N4 original passages now provide 143 questions across 11 families, with each of reason, reference, simple-inference, and appropriate-action represented at least three times, and the 27 information-retrieval assets pair generated no-text raster scene support with explicit accessible HTML visual formats for menus, notices, timetables, posters, and related practical material. The shared quality audit now reports linked lexical-load ranges, structural distractor signals, and 104 exact passage-answer echoes for review. They are assigned to learner-facing reading lessons, the shared release package, and the existing PracticePlayer; distractor plausibility, level calibration, and native review remain open.
- [~] **Original listening practice** — `data/original-listening-bank.json`, `scripts/generate_original_listening_bank.py`, `scripts/audit_content_quality.mjs`, `lib/content-quality-core.js`, and `lib/curriculum.ts`; the 160 N5/N4 original scenarios cover task-based, key-point, verbal-expression, and quick-response families across 20 context tags in the shared release package, use deterministic constraint filters plus three dialogue/question shapes, and give N4 a distinct four-turn dependency path. The quality audit reports 160 unique normalized templates, 20 contexts, 0 near-duplicate clusters, 80 three-turn `A-B-A` and 80 four-turn `A-B-A-B` profiles, and 92 transcript-answer echoes for review alongside the 3-line/44-character N5 versus 4-line/94-character N4 transcript signal; all current audio remains browser TTS.
- [x] **Lesson-first Learn flow** — `components/learning/local-lesson.tsx`, `components/learning/lesson-player.tsx`, and `app/(main)/learn/page.tsx`; active lesson selection, area-aware lesson opening, step progression, and final-lesson next-area handoff are learner-facing.
- [x] **Immersion feed/player split** — `components/learning/immersion-surface.tsx` and `components/learning/immersion-player.tsx`; feed selection and focused playback are separate states, the reading/listening feed rotates its bounded first page per browser session, Shun exposes a validated provider-feed catalog with selectable videos and channel fallback, Teppei exposes RSS-selected native audio with original-site fallback, and the Detours shelf exposes bounded activity maps for the curated Marugoto/JFS/KC Yom Yom/Hirogaru/OJAD provider entries.
- [x] **Pronunciation lane** — `data/pronunciation-bank.js`, `lib/pronunciation-core.js`, and `components/learning/pronunciation-activity.tsx`; Immersion exposes 20 authored N5/N4 lessons and 60 discrimination exercises with browser audio, listen-and-repeat prompts, separate conservative progress, and optional OJAD exploration.
- [x] **Interest-aware detours** — `components/profile/profile-settings.tsx`, `lib/interest-core.js`, and `components/learning/immersion-surface.tsx`; learners can save up to three optional topics, which rank free reading/listening and Shun/Teppei titles only after the existing learning signals.
- [x] **Guided output lane** — `lib/output-core.js`, `components/learning/output-practice.tsx`, and the shared review scheduler; Real life immersion derives 80 speaking situations, 60 writing prompts, 119 pragmatic contexts, and 296 vocabulary collocations from released records, with model audio and namespaced persistent self-rating without changing JLPT readiness.
- [x] **Micro-skill practice** — the `micro` Practice mode uses the existing question player for focused N5 numbers, time, date, price, and counter automaticity drills.
- [x] **Real-world practice lane** — `components/learning/irodori-practice-card.tsx` and the Irodori entries in `lib/external-resources-runtime.js`; Irodori is surfaced as practical activity context.
- [x] **External-source viewer and fallback** — `components/learning/external-source-viewer.tsx`, `components/learning/external-source-launcher.tsx`, and `lib/external-resources-runtime.js`; frame, native media, and original-source fallback paths are wired.
- [x] **Continue/resume state** — `lib/session.ts` and `lib/external-source-progress.js`; lesson, practice, immersion, reading, and source-open state use the existing local session layer, and Immersion Continue links now carry validated reading/listening IDs so the selected local activity reopens instead of dropping at the shelf.
- [x] **Repair Center** — `app/(main)/mistakes/page.tsx`, `components/mistakes/mistake-notebook.tsx`, and `lib/repair-core.js`; misses expose repair actions instead of only a list.
- [x] **Japanese-aware search and contextual actions** — `components/shell/command-palette.tsx`, `app/api/search/route.ts`, `components/library/study-later.tsx`, and item action components.
- [x] **Content completeness audit** — `components/content/completeness-dashboard.tsx`, `components/content/content-record-editor.tsx`, `components/content/content-studio.tsx`, `lib/content-completeness-core.js`, and `lib/content-quality-core.js` report quantity, lesson placement, required-field completeness, review workflow status, unique reading/listening contexts, grammar-depth readiness, the grammar lesson-contract audit, normalized template diversity, near-duplicate review signals, visual listening-question count, separate pronunciation/dictation counts, and output-bank counts from the live package/bank; Content Studio exposes grammar aliases and mini-contexts for editing/review; the N5/N4 grammar depth gate and the broader grammar contract audit are now 116/116.
- [x] **Grammar prose consistency** — `lib/content-completeness-core.js` audits duplicate examples, translation collisions, and empty example fields across the authored grammar package; the current 116-record package passes those internal consistency checks after the repeated N5 prose was rewritten, while shared-example native review remains open.
- [x] **Text-grammar context contract** — `validatePracticeQuestions` now requires text-grammar questions to carry a persisted context ID and passage with a visible blank; connected-passage shape and four-choice coverage remain review signals, and the 125-draft corpus stays unapproved pending linguistic review.
- [~] **Vocabulary context contract** — `lib/content-completeness-core.js`, `lib/content-validation.ts`, and the Studio completeness surface now audit example depth, collocations, related words, persisted audio, approved contextual/paraphrase links, pending draft counts, N4 usage assessments, and structural collocation quality; all 169 current vocabulary records now have at least two authored examples, 338 deterministic contextual/paraphrase drafts are staged for human review from existing vocabulary facts, the pending Studio question queue can filter drafts by question family, high-frequency records with fewer than two examples receive a review warning, and generated drafts remain excluded from learner-ready coverage until explicit approval metadata is present.
- [~] **Grammar assessment depth audit** — the same dashboard reports approved grammar question count, context-set-aware normalized contexts, form-selection, sentence-composition, sentence-ordering, text-grammar, contrast-cluster, N5/N4 counts, and pending review counts; validation and the direct Grammar contract queue surface missing grammar aliases and dedicated mini-contexts, and locally generated draft questions now require explicit approval, reviewer, and timestamp metadata before activation. Content Studio renders each pending draft's persisted context ID and passage text in the review card. The current persisted authored bank has 92 approved N5 grammar questions across 92 contexts and 55 approved N4 questions across 55 contexts (including 6 contrast-cluster questions), plus 125 text-grammar drafts pending review (50 N5 / 75 N4), each with persisted context IDs/text for review, so it does not yet meet the learner-ready N5/N4 text-grammar targets.
- [~] **Grammar coverage audit** — `scripts/build_grammar_coverage_registry.mjs`, `data/grammar-coverage-union.json`, and `components/content/grammar-coverage.tsx` expose multi-source raw patterns, exact mapped source-pattern labels, canonical concept status, evidence source IDs/counts, level disagreements, aliases, duplicates, and the full unresolved source-row queue in a bounded scrollable panel; sixty-five dedicated N4 expansion concepts, five N4 life-bridge concepts, and six additional N5 concepts now have lesson placement, with fourteen linked contrast clusters for direction, benefit perspective, inference/appearance, conditionals, potential ability, passive/potential, causative, change/habit/decision, modality/inference, quotation/thought, nominalization/capability, contrast/conjunction, time/aspect, and ease/difficulty forms, while the registry remains an evidence baseline rather than completed N5/N4 grammar coverage.
- [~] **Vocabulary + kanji coverage audit** — `scripts/build_lexical_coverage_registry.mjs`, `data/lexical-coverage-union.json`, and `components/content/lexical-coverage.tsx` expose released/staged/source-only status, multi-source evidence, ambiguous forms, per-source level-claim examples, level disagreements, and kanji useful-word depth including the 3+ teaching-set threshold; the registry is an evidence baseline, not completed N5/N4 release coverage.
- [x] **Visual listening context** — `scripts/generate_original_listening_bank.py`, `components/learning/listening-scene.tsx`, LessonPlayer, and PracticePlayer preserve original verbal-expression scene metadata and show generated raster illustrations with accessible descriptions; no external image assets are copied.
- [x] **Progress narrative and Journey hierarchy** — `components/progress/progress-dashboard.tsx`, `components/journey/journey-overview.tsx`, `components/journey/journey-map.tsx`, and `components/journey/lesson-progress.tsx`.
- [x] **Library knowledge home** — `app/(main)/library/page.tsx`, `components/library/library-browser.tsx`, `components/learning/tadoku-shelf.tsx`, and `components/learning/aozora-shelf.tsx`.
- [x] **Book reader and personal notes** — `components/books/book-reader.tsx`, `components/books/drive-shelf.tsx`, and `components/books/handwritten-notes.tsx`; the reader and Drive viewer use the same equal-width side-by-side scratchpad, with local pages, colors, highlighter, and PDF export. Authenticated Drive lookup is the deployed-reader fallback when private storage parts are unavailable, and the private-book API accepts both the current `books/<id>/...` and already-uploaded `<id>/...` Storage layouts.
- [x] **Reading/listening activity placement** — Immersion owns the source-hosted listening and reading shelves; `app/(main)/practice/page.tsx` owns the JLPT-style MCQ practice surface.
- [x] **Immersion dictation** — `lib/dictation-core.js` and `components/learning/dictation-activity.tsx` expose explicit N5/N4 word, phrase, sentence, dialogue-gap, and key-information lanes from the existing listening bank, reuse audio/normalization/mistake infrastructure, show answer differences, and do not create a second Practice system.
- [x] **Integrated context practice** — `lib/integrated-exam-core.js`, the integrated Practice mode, and `PracticePlayer` result persistence retain one primary item plus `targetItemIds` for multi-concept sets and save integrated attempts with their per-concept breakdown.
- [x] **Practice hydration boundary** — `useContentModule(..., { loadRemote: false })` keeps drill switches on the bundled/generated bounded bank, so Practice does not hydrate the full 8k-record release package while changing modes, topics, or lengths; full learner routes continue to load the complete released package.
- [x] **Furigana/scaffolding** — `components/learning/japanese-text.tsx`, `components/learning/reading-panel.tsx`, `components/learning/lesson-player.tsx`, `components/library/entry-detail.tsx`, `components/learning/learner-assistant.tsx`, and `components/practice/local-practice.tsx` implement shared `Always`/`Unknown`/`Tap`/`Hide` behavior with per-word tap reveal; LessonPlayer and Library detail fade experienced grammar formation and listening transcripts to explicit support buttons, while Practice keeps its bounded question bank and derives its reading index from the bounded visible queue. Production models are explicit reveals, and Content Studio stays fully inspectable for review.
- [~] **Visual refinement/card density** — Immersion and Practice navigation plus reading/listening, Irodori activities, source detours, Tadoku, Aozora, Journey module metrics, and the Studio source/review queues use compact/editorial layouts without nested shelf-card grids; the shell/Journey hero keeps eight area-specific generated-raster WebP scenes, Today now maps eight distinct generated scenes to those areas, and Learn uses a separate generated station-opening scene, with area-aware atmosphere, progression stages, deliberate desktop/mobile focal points, and restrained completion transitions; screenshot review and the final U65/U66/U70 audit remain.
- [~] **Mobile/accessibility/performance** — responsive navigation, deferred module loading, bounded Practice questions, a dedicated Studio route fallback, learner routes that fetch the released package without synchronously parsing the large local Studio draft, idle-scheduled Studio draft/question validation work, memoized 8k-item Studio scans, page-local Studio ranking, bounded Practice furigana construction, one-record full-index Studio inspection, bounded question review, explicit html-owned document vertical scrolling with compatible horizontal clipping, scroll-safe overlays, immediate route transition feedback, disabled heavy-route prefetching, bounded Studio source-register loading, bounded private-book loading, responsive `minmax(0, …)` lesson/Journey grids, global keyboard focus rings, a skip-to-content target, a fresh service-worker shell revision, and lazy async decoding plus a 350 KB byte-budget check for world raster scenes are in code; the new Shun feed is bounded/cached, provider Detours activity maps are bounded, and the final cross-surface device/browser audit remains a follow-up.
- [~] **Persistence beyond the browser** — local resume/progress works through `lib/session.ts`; the opt-in account snapshot now includes default lesson state and Continue state alongside review/progress data. Supabase migration `0020_learning_context_fields.sql`, `supabase/seed.sql`, the SQL renderer, and the remote loader now preserve grammar aliases/mini-context plus reading visual formats/questions; applying and verifying the migration on the deployed project remains.
- [x] **Verification** — strict package QA, `tsc --noEmit`, the production build, and all 24 direct Node test files pass.
- [~] **Remaining follow-up** — complete fading scaffolding and the final all-surface accessibility/performance pass. Dedicated area visuals, progression-aware profile portrait evolution, and the N5→N4 “new road” plus restrained area-completion transitions are now learner-visible; account sync now keeps a local outbox for failed writes and retries it on reconnect; the service worker caches the released learner package after first load and revisions are forced for deployed clients; private review/admin and sync APIs remain online-only.

Inspect the current repository first, preserve working behavior, implement the UX changes end-to-end, and run existing tests/builds.

---

# U1. CURRENT UX PROBLEMS TO AUDIT FIRST

Before editing, inspect the current implementation and recompute the exact current product surfaces.

At the time this addendum was written, the repository approximately exposed:

## Desktop navigation

```text
Journey
Learn
Practice
Immersion
Review
Mistakes
Library
Books
Reference
Progress
Profile
Studio
```

## Mobile navigation

Approximately:

```text
Journey
Learn
Practice
Immersion
Review
Profile
```

## Practice

Approximately 12 top-level modes including:

```text
Quick drill
Vocabulary
Kanji
Grammar
Mixed
Pass N5
Mini test
Section test
Full mock
Integrated context
Sampler
Weak areas
```

## Learn

The learner currently encounters:

```text
Page intro
↓
Study index
↓
Lesson index
↓
Actual lesson
```

## Immersion

The existing `ImmersionSurface` currently combines substantial functionality inside one surface, including:

```text
guided listening
listening modes
ear warm-up
questions
transcript
shadowing
reading
Erin selection
external sources
```

The content milestones will add substantially more providers and modes.

Audit the current code rather than blindly trusting these counts.

Report the actual current state before restructuring.

---

# U2. PRODUCT PRINCIPLE

Kizashi should expose complexity progressively.

The internal system may contain:

```text
curriculum
SRS
mistake repair
assessment
pronunciation
conjugation
dictation
reading
listening
output
immersion
source providers
JLPT readiness
content provenance
```

The learner should NOT need to understand that architecture to study.

The learner should usually answer only one question:

> What should I do next?

Kizashi should answer it clearly.

---

# U3. PRIMARY UX HIERARCHY

The learner-facing hierarchy should become:

```text
TODAY
↓
JOURNEY
↓
PRACTICE
↓
IMMERSE
↓
LIBRARY
```

These are the primary destinations.

Everything else should become contextual, secondary, or profile/admin functionality.

Conceptually:

```text
TODAY
今日

JOURNEY
道

PRACTICE
練習

IMMERSE
浸る

LIBRARY
本棚
```

Do not force these exact Japanese labels if the existing design language suggests better ones.

Preserve the existing Kizashi Japanese editorial aesthetic.

---

# U4. SIMPLIFY DESKTOP NAVIGATION

Reduce the primary learner navigation.

Target approximately:

```text
Today
Journey
Practice
Immersion
Library
```

or:

```text
Journey
Practice
Immersion
Library
```

if Journey itself becomes the Today surface.

Make the narrowest architecture choice based on the existing routing.

Secondary functions should move appropriately.

Examples:

```text
Review
→ Today
→ Practice

Mistakes
→ Practice / Weaknesses

Progress
→ Journey / Profile / secondary navigation

Books
→ Library

Reference
→ Library

Profile
→ avatar/account menu

Studio
→ admin-only command palette / account menu
```

Do NOT delete useful existing routes merely because they leave the main navigation.

Deep links must continue working where practical.

---

# U5. MOBILE NAVIGATION

Target FIVE main destinations maximum.

Example:

```text
Today
Journey
Practice
Immersion
Library
```

If Today and Journey are merged:

```text
Journey
Practice
Immersion
Library
Profile
```

Do not place six tiny labels into an overcrowded bottom bar if five are sufficient.

Profile can usually be accessed through the avatar/header rather than permanent bottom navigation.

Requirements:

```text
large enough tap targets
safe-area handling
clear active state
no horizontal scrolling
no truncated critical labels
```

---

# U6. BUILD A TRUE TODAY EXPERIENCE

This is the highest-priority UX feature.

Kizashi should produce a daily study plan requiring almost no decision-making.

Example:

```text
おはよう

Wednesday · N5

TODAY
18 min

1. REVIEW
14 due
~4 min

[ Start ]

2. LEARN
〜てもいいですか
Permission and rules
~6 min

3. LISTEN
Irodori · レストランで
Comfortable
~3 min

4. READ
Library notice
N5 short
~3 min

────────────────────

OPTIONAL

Conjugation burst
Ear warm-up
Free immersion
```

Primary CTA:

```text
CONTINUE TODAY
```

or:

```text
今日を続ける
```

---

# U7. TODAY SESSION ORCHESTRATOR

Build a session orchestrator using existing recommendation/mastery/mistake infrastructure.

Do NOT build another recommendation engine if existing modules can be extended.

A daily session may combine:

```text
due SRS reviews

weakness repair

current lesson

grammar repair

conjugation

dictation

micro-skill

short reading

short listening

immersion reinforcement
```

Not every session needs every modality.

---

# U8. TODAY PRIORITY LOGIC

A reasonable conceptual priority is:

```text
1. overdue reviews

2. severe recurring weakness

3. active lesson continuation

4. target-level weak skill

5. short reading/listening exposure

6. recently learned concept reinforcement

7. optional immersion
```

Also account for:

```text
available study time
exam target
N5/N4 target
recent activity
recent modality imbalance
```

Do not make the learner manually assemble today's curriculum.

---

# U9. DAILY TIME OPTIONS

Support lightweight time choices:

```text
5 min
10 min
20 min
30 min
```

or preserve the existing values if already useful.

Example:

```text
How much time?

5
10
20
30
```

Changing duration should adjust the session composition intelligently.

Do not merely truncate questions halfway through a logical activity.

---

# U10. SESSION FLOW

The user should be able to press one button and move through:

```text
Review
↓
Learn
↓
Practice
↓
Listen
↓
Read
↓
Done
```

without navigating between six pages.

Individual parts may still use existing components internally.

The orchestrator should compose them into one flow.

---

# U11. SESSION COMPLETION

At completion show useful closure.

Example:

```text
今日の勉強
DONE

18 min

Reviewed
14

Learned
〜てもいいですか

Listening
1 Irodori dialogue

Reading
1 short passage

Strengthened
に vs で

Next review
Tomorrow

[ Finish ]
```

Do not make XP the central outcome.

---

# U12. OPTIONAL CONTINUATION AFTER SESSION

After the required session:

```text
You are done for today.
```

Then offer optional choices:

```text
Keep going

Free immersion
Conjugation burst
Read something
Fix a weakness
```

The app should explicitly permit stopping.

Avoid endless-feed guilt mechanics.

---

# U13. PRACTICE PAGE — SIMPLIFY INFORMATION ARCHITECTURE

The current Practice mode selector exposes too many peer-level options.

Replace the top-level taxonomy with four primary intentions:

```text
QUICK PRACTICE

FOCUS

FIX WEAKNESSES

TEST YOURSELF
```

---

# U14. QUICK PRACTICE

Purpose:

> Kizashi chooses useful practice for the learner.

Support:

```text
2 min
5 min
10 min
20 min
```

Possible contents:

```text
SRS
grammar
kanji
conjugation
dictation
listening
reading
micro-skills
```

based on learner need.

---

# U15. FOCUS

Inside Focus expose skill categories.

Example:

```text
Vocabulary

Kanji

Grammar

Conjugation

Dictation

Numbers & Time

Reading

Listening

Pronunciation

Output
```

Do not put all of these permanently in the top page header.

The learner first chooses:

```text
FOCUS
```

then chooses a skill.

---

# U16. FIX WEAKNESSES

Replace a vague Mistakes destination with actionable repairs.

Example:

```text
WEAKNESSES

に vs で
Recurring confusion · 4 misses

[ Fix · 3 min ]

────────

て-form
Slow recall

[ Conjugation burst · 2 min ]

────────

八日
Listening misses

[ Dates & numbers · 2 min ]

────────

食べる
Read correctly
Missed in audio twice

[ Listening repair · 2 min ]
```

---

# U17. WEAKNESS TYPES

Distinguish at least conceptually:

```text
does not know

confuses with another concept

slow recall

can read but cannot hear

can recognize but cannot produce

conjugation error

orthography error

repeated pragmatic misunderstanding
```

Different weakness types should produce different repair sessions.

Do not simply send everything back to flashcards.

---

# U18. TEST YOURSELF

Group:

```text
Mini Test

Section Test

Full Mock

Diagnostic
```

under one Test surface.

If full-mock quality gates from the content milestone are not satisfied, do not display Full Mock as ready.

Show:

```text
Full Mock
Locked until enough unique material is ready
```

or the established sampler language.

---

# U19. REMOVE MODE TAB OVERLOAD

Do not render 12 horizontally scrolling Practice tabs as the main interaction.

The internal modes may remain.

The user-facing hierarchy should be:

```text
Quick
Focus
Weaknesses
Test
```

Then drill down.

---

# U20. LEARN PAGE SHOULD OPEN THE ACTUAL LESSON

Current behavior places navigation/index material before the core lesson.

Reverse that hierarchy.

When the learner clicks:

```text
Continue · Ordering Food
```

they should immediately enter:

```text
Ordering Food
食事を注文する

3 / 8 steps
```

and continue where they left off.

Do not make them pass:

```text
Study Index
Lesson Index
```

first.

---

# U21. MOVE LESSON SELECTION OUT OF THE WAY

Provide something compact like:

```text
All lessons ▾
```

or:

```text
Lesson 4 of 18
Change lesson
```

The full lesson index may live:

```text
behind a drawer
behind a dropdown
on Journey
```

Do not duplicate Journey's navigation inside Learn.

---

# U22. REMOVE STUDY-INDEX DUPLICATION

Content-type browsing such as:

```text
Vocabulary
Kanji
Grammar
Reading
Listening
Weak
```

belongs primarily in:

```text
Library
Practice
```

not as a large preamble above every lesson.

Keep contextual links when useful.

---

# U23. LESSONS SHOULD FEEL LIKE SEQUENCES

Use a coherent lesson progression.

Example:

```text
INTRO
↓
VOCAB IN CONTEXT
↓
GRAMMAR
↓
GUIDED PRACTICE
↓
KANJI / READING
↓
REAL JAPANESE
↓
CHECKPOINT
```

Not every lesson must use every stage.

The content determines the sequence.

---

# U24. ONE ACTIVE LESSON STEP AT A TIME

Avoid rendering an enormous vertical lesson document.

Prefer:

```text
3 of 8

〜てもいいですか

[ content ]

← Back                Continue →
```

Allow jumping through a compact lesson outline if desired.

The default should preserve momentum.

---

# U25. LESSON PROGRESS

Display progress clearly:

```text
●──●──●──○──○──○
3 / 6
```

or an equivalent polished implementation.

Progress should represent meaningful learning stages, not arbitrary React cards.

---

# U26. LESSON COMPLETION UX

Example:

```text
LESSON COMPLETE

You learned

4 words
2 kanji
1 grammar pattern

You struggled with

に vs で

Next review
Tomorrow

────────

TRY IT IN REAL JAPANESE

Irodori
At the station
3 min

[ Listen ]

────────

[ Finish for today ]
```

Make lesson closure satisfying but restrained.

---

# U27. CONTEXTUAL IMMERSION AFTER LESSONS

Use the new source mappings.

After relevant concepts:

```text
You learned
〜てください

Try it in real Japanese

Irodori
Restaurant interaction

[ Listen ]
```

Or:

```text
Read it in context

JFS Reading Activity
Café menu

[ Read ]
```

This is preferable to generic:

```text
Next steps
```

---

# U28. JOURNEY SHOULD BECOME LESS DASHBOARD-LIKE

Journey currently mixes:

```text
hero
daily session
countdown
map
current lesson
module shape
topic coverage
```

Audit whether all of those deserve primary visual emphasis.

The Journey should primarily answer:

```text
Where am I?

What comes next?

How far have I traveled?
```

Secondary analytics should not compete with the route.

---

# U29. STRENGTHEN THE SPATIAL JOURNEY

The route metaphor should become structurally visible.

Example:

```text
START

町の入口
   │
   ● Meeting people
   │
   ╰──── house / street
          │
          ● Daily life
          │
          ╰──── station
                 │
                 ● Getting around
                 │
                 ╰──── shopping street
                        │
                        ● Food & shopping
```

Do not literally implement this ASCII.

Use the existing Journey visual system.

---

# U30. N5 → N4 VISUAL PROGRESSION

When N4 becomes available, avoid making it simply another dropdown option.

Visually extend the route.

Conceptually:

```text
N5 district
     ↓
bridge / milestone
     ↓
N4 district
```

The learner should feel progression.

Do not lock N4 browsing if the content architecture permits exploration.

---

# U31. DO NOT TURN JOURNEY INTO A GAME MAP PARODY

Avoid:

```text
cartoon treasure chests

fake currencies

loot systems

daily punishment

energy meters

random RPG statistics
```

Keep the existing restrained Japanese editorial/RPG influence.

Progression should feel meaningful rather than childish.

---

# U32. IMMERSION MUST BE REFACTORED BEFORE PROVIDER EXPANSION BECOMES UNMANAGEABLE

The current `ImmersionSurface` is already responsible for many different experiences.

The content milestones add:

```text
Irodori
Erin
Tadoku
Aozora
Marugoto
JFS
KC Yom Yom
Hirogaru
Shun
Teppei
Tatoeba
Commons
```

Do not keep appending sections to one giant component.

Refactor.

---

# U33. IMMERSION DEFAULT = RECOMMENDATION FEED

The default surface should become approximately:

```text
IMMERSION

FOR YOU

┌─────────────────────────────┐
│ Irodori                     │
│ レストランで               │
│ Listening · 2:48            │
│ Comfortable · 92% known     │
│                             │
│ [ Listen ]                  │
└─────────────────────────────┘

CONTINUE LISTENING

Teppei · Episode ...

QUICK READ

JFS · Café menu

SOMETHING INTERESTING

Hirogaru · Anime & Manga
```

---

# U34. IMMERSION FILTERS

Primary activity filters:

```text
Listen

Read

Shadow

Explore
```

Optional secondary filters:

```text
N5 / N4

Comfortable / Stretch / Challenge

Provider

Duration
```

Do not expose all filters permanently on mobile.

---

# U35. IMMERSION FEED → ACTIVITY PLAYER

Clicking an activity should open a dedicated activity experience.

Examples:

```text
/listen/[id]
```

or a shared:

```text
/immersion/[id]
```

depending on current routing conventions.

Do not require separate routes if a modal/sheet architecture is cleaner, but isolate state.

The core requirement:

> Feed discovery and activity playback must no longer be one giant component.

---

# U36. ACTIVITY PLAYER

A listening activity should focus on:

```text
title
context
provider
audio
question if applicable
transcript controls
shadowing
concepts encountered
progress
```

A reading activity should focus on:

```text
text/source
reading support
known vocabulary
furigana
question if applicable
lookup
progress
```

Do not render unrelated source shelves inside the active player.

---

# U37. UNIVERSAL CONTINUE STATE

Implement a robust:

```text
Continue where you left off
```

system.

Track meaningful resumable state such as:

```text
lesson
lesson stage

practice session
question position

reading
scroll/segment position

listening activity

shadowing phrase

Irodori activity

Tadoku resource

Teppei episode

Shun video metadata if available

Aozora work
```

Use existing session/local-state architecture.

---

# U38. GLOBAL CONTINUE CTA

The app header/Today surface should be capable of showing:

```text
Continue

Ordering Food
Lesson · Step 4/8
```

or:

```text
Continue

Irodori
Restaurant dialogue
1:24 remaining
```

depending on the most recent meaningful activity.

Do not always redirect `/learn`.

---

# U39. RESUME PRIORITY

Distinguish:

```text
unfinished intentional activity
```

from:

```text
random resource opened once
```

A resource should not hijack Continue merely because the learner clicked it.

Track meaningful engagement thresholds.

---

# U40. SEARCH / COMMAND PALETTE SHOULD BECOME JAPANESE-AWARE

The current command palette is primarily command navigation.

Expand it to unified Japanese search.

Support queries such as:

```text
食べる

たべる

eat

〜ている

permission

に vs で

restaurant
```

---

# U41. SEARCH RESULT GROUPS

Group results:

```text
Vocabulary

Grammar

Kanji

Contrasts

Lessons

Reading

Immersion

Reference
```

Example:

```text
食べる
Vocabulary
たべる · eat

〜ている
Grammar
progressive / state

Food & Restaurants
Lesson

Irodori · Restaurant
Immersion
```

---

# U42. SEARCH ACTIONS

Result-level actions may include:

```text
Open

Review

Hear

Practice

Find in Immersion

Add note
```

Do not expose all actions if they make the search result cluttered.

Primary click opens.

Secondary actions may be contextual.

---

# U43. KEYBOARD UX

Preserve:

```text
Ctrl/Cmd K
```

for command/search.

Potentially support concise keyboard actions where useful:

```text
R
review

P
practice

I
immersion
```

Only if they do not conflict with text inputs or accessibility.

Do not create an obscure shortcut maze.

---

# U44. MISTAKE NOTEBOOK → REPAIR CENTER

The current Mistakes system should feel actionable.

Default view:

```text
WHAT NEEDS REPAIR

Recurring confusion

Slow recall

Listening misses

Conjugation problems

Recent mistakes
```

Do not merely show an archive of failures.

---

# U45. MISTAKE ITEM UX

Example:

```text
に vs で

4 recent confusions

Mostly:
location of action

[ Fix this · 3 min ]

[ Review explanation ]

[ Hear examples ]
```

---

# U46. MODALITY-SPECIFIC REPAIR

Examples:

```text
Read correctly
but missed in listening
→ micro-listening

Slow conjugation
→ conjugation burst

Particle confusion
→ contrast drill

Wrong kanji form
→ orthography drill

Date listening miss
→ numbers/date drill
```

This is one of the highest-value uses of the new content systems.

---

# U47. PROGRESS PAGE — LEAD WITH INSIGHT, NOT METRICS

The current Progress screen has useful detailed analytics.

Keep them.

But the top should answer:

> What changed?

Example:

```text
THIS WEEK

Listening improved
62% → 78%

Grammar
31 → 39 strong

Biggest weakness
Particles · に vs で

Newly strong
食べる
行く
〜たい
時

Next priority
N5 reading
```

Then:

```text
Detailed stats ↓
```

---

# U48. PROGRESS SHOULD SHOW CHANGE OVER TIME

Where enough historical data exists, show:

```text
improving

stable

declining / rusty

newly strong
```

Do not manufacture trends from tiny sample sizes.

If insufficient evidence:

```text
Not enough evidence yet.
```

---

# U49. PROGRESS SHOULD BE MODALITY-AWARE

Eventually report separately:

```text
Vocabulary recall

Kanji recognition

Grammar

Conjugation

Reading

Listening

Dictation

Pronunciation discrimination
```

Speaking/writing can remain qualitative initially.

Do not distort JLPT readiness with non-exam modalities.

---

# U50. READINESS SHOULD STAY SECONDARY TO LEARNING SIGNALS

Keep the existing caution that Kizashi readiness is not an official JLPT score.

The visual hierarchy should prioritize:

```text
skill development
weaknesses
recent change
```

before:

```text
pseudo-score
```

---

# U51. XP SHOULD BE FLAVOR, NOT THE PRIMARY PROGRESS SYSTEM

Keep existing:

```text
XP
levels
achievements
rhythm
```

if enjoyable.

But demote them beneath meaningful learning outcomes.

A message like:

```text
You can now understand 91% of this Irodori activity.
```

should feel more important than:

```text
+20 XP
```

---

# U52. PROFILE IDENTITY SHOULD REFLECT ACTUAL JOURNEY

Where practical, evolve Study Portrait / identity based on meaningful dimensions such as:

```text
route progression

N5/N4 stage

topics strengthened

immersion exposure

study rhythm
```

not only:

```text
XP / 100
```

Do not create complicated role-playing stats.

---

# U53. ADAPTIVE SCAFFOLDING — TRAINING WHEELS SHOULD FADE

This is a key product feature.

As learner confidence increases, Kizashi should gradually reduce assistance.

---

# U54. VOCABULARY SCAFFOLDING

Early:

```text
食べました
たべました
ate
```

Later:

```text
食べました
たべました
```

Later:

```text
食べました
```

depending on exercise purpose.

---

# U55. FURIGANA SCAFFOLDING

Progress:

```text
furigana always

↓

furigana for unknown kanji

↓

tap/hover to reveal

↓

hidden by default
```

Respect explicit user preference if they override automatic behavior.

---

# U56. LISTENING SCAFFOLDING

Progress:

```text
audio + transcript

↓

audio first
transcript on request

↓

audio only during task
transcript after answer
```

Exam mode remains governed by its own stricter rules.

---

# U57. GRAMMAR SCAFFOLDING

Early:

```text
visible formation hint
```

Later:

```text
hint button
```

Later:

```text
no hint
```

Do not remove explanations from the reference view.

Only change active learning assistance.

---

# U58. PRODUCTION SCAFFOLDING

Early:

```text
word bank

target grammar

model fragment
```

Later:

```text
target grammar only
```

Later:

```text
situation only
```

Do not force free production too early.

---

# U59. SCAFFOLDING SHOULD BE EXPLAINABLE

If the learner asks for help, support:

```text
Show furigana

Show hint

Show translation

Slow audio

Reveal first word
```

Avoid invisible adaptation that feels arbitrary.

---

# U60. CONTEXTUAL ACTIONS

Every important learning item should expose relevant next actions without requiring navigation hunting.

---

# U61. VOCABULARY CONTEXTUAL ACTIONS

Example:

```text
食べる

Hear

Review

Examples

Common chunks

Related kanji

Find in reading

Find in Immersion

Add note
```

Do not display every action simultaneously if cluttered.

Use an action menu where appropriate.

---

# U62. GRAMMAR CONTEXTUAL ACTIONS

Example:

```text
〜てもいい

Learn

Practice

Contrast

Hear in context

Find in reading

Find in Immersion

Alternative explanation

Add note
```

---

# U63. KANJI CONTEXTUAL ACTIONS

Example:

```text
食

Useful words

Hear words

Practice

Related/confusable kanji

Find in sentences

Add note
```

---

# U64. WRONG-ANSWER ACTIONS

After a listening miss:

```text
Replay

Show transcript

Explain

Study unknown words

Practice target grammar

Try similar clip
```

After grammar miss:

```text
Why?

Contrast with X

Try another

Review concept
```

Do not force the learner to leave the current flow to find repair material.

---

# U65. VISUAL DESIGN — REDUCE CARD SOUP

Audit the UI for excessive use of:

```text
rounded-xl
border
background panel
padding
```

Cards should represent discrete interactive objects.

Do not put every group of text inside another bordered rectangle.

---

# U66. VISUAL HIERARCHY

Increase variation through:

```text
whitespace

typography

section rhythm

full-width moments

borderless lists

subtle separators

large Japanese text

spatial maps

editorial composition
```

Use fewer nested card containers.

---

# U67. JAPANESE TEXT SHOULD HAVE VISUAL AUTHORITY

On Learn/Immersion/Reading screens, Japanese should often be the visual focal point.

Example:

```text
〜てもいいですか
```

should not be visually subordinate to labels like:

```text
GRAMMAR ITEM
```

The interface should feel like Japanese is the product.

---

# U68. PRESERVE THE EXISTING AESTHETIC

Keep:

```text
dark-first

Japanese editorial restraint

vermilion

warm gold

navy/slate

subtle RPG journey cues

Japanese typography
```

Avoid turning this UX redesign into generic SaaS dashboard styling.

---

# U69. USE MOTION WITH PURPOSE

Useful animation:

```text
lesson-step transition

journey progress

completion

expand/collapse

player state

newly mastered item
```

Avoid:

```text
constant floating objects

excess parallax

slow decorative transitions

animation blocking study
```

Respect reduced-motion preference.

---

# U70. IMMERSION SHOULD FEEL VISUALLY DIFFERENT FROM PRACTICE

Practice:

```text
controlled
focused
test-like
```

Immersion:

```text
open
media-rich
exploratory
```

Do not make both surfaces look like identical question cards.

---

# U71. READING UX

Reading should prioritize:

```text
comfortable line length

large Japanese typography

adjustable size

furigana policy

tap lookup

scroll/resume

minimal chrome
```

Questions should not visually dominate the passage before reading.

---

# U72. LISTENING UX

Prioritize:

```text
large play button

replay

speed

progress

clear transcript state

speaker indication where relevant
```

Do not bury playback inside tiny controls.

---

# U73. PHONE-FIRST PRACTICE

Practice interactions should work one-handed where feasible.

Requirements:

```text
large answer targets

primary controls near thumb reach

minimal horizontal scrolling

no tiny mode tabs

safe keyboard behavior for typed answers
```

---

# U74. PHONE-FIRST LESSONS

One lesson step per screen is particularly important on mobile.

Do not create huge nested sidebars/cards collapsing into a 5,000px vertical page.

---

# U75. PROFILE / SETTINGS

Move infrequently used configuration away from primary learning surfaces.

Examples:

```text
exam date

target JLPT level

daily pace

furigana preferences

audio preferences

sync/backup

interest preferences
```

Profile is appropriate.

---

# U76. TARGET LEVEL SWITCHING

Changing N5/N4 should be available but not constantly visible everywhere.

A compact Journey/Profile control is sufficient.

The whole UI should update contextually.

Example:

```text
Target
N5 ▾
```

Do not put:

```text
N5 | N4
```

tabs on every screen.

---

# U77. INTEREST PREFERENCES

If implemented from the content addendum, use interest preferences to improve:

```text
Hirogaru

Shun

Teppei

free reading/listening
```

recommendations.

Do not distort core JLPT study around entertainment preferences.

---

# U78. EMPTY STATES

Every new system needs useful empty states.

Examples:

```text
No reviews due

You're clear for now.
Try a short listening session.

[ Ear warm-up ]
```

```text
No severe weaknesses

Nothing is repeatedly failing right now.

[ Mixed practice ]
```

Do not show:

```text
No data.
```

---

# U79. ERROR STATES

External-provider errors should be calm and actionable.

Example:

```text
This audio couldn't load here.

[ Open at source ]
[ Try browser voice ]
```

Do not expose implementation details.

---

# U80. LOADING STATES

Prefer:

```text
stable skeleton geometry
```

over layout shifts.

Especially:

```text
Today
Journey
Immersion feed
Practice session
```

---

# U81. OFFLINE UX

When offline:

```text
Today
local lesson
reviews
generated/local practice
saved reading
```

should continue where supported.

Remote Immersion items may show:

```text
Online connection required
```

without breaking the page.

---

# U82. COMMAND PALETTE AS POWER-USER LAYER

Because Kizashi is a private single-user app, the command palette can expose advanced functions without bloating primary navigation.

Include:

```text
Review now

Quick practice

Open current lesson

Ear warm-up

Conjugation burst

Dictation

Search Japanese

Open Progress

Open Profile

Open Studio
```

Admin commands remain admin-only.

---

# U83. TODAY + COMMAND PALETTE SHOULD COVER MOST WORKFLOWS

A good outcome is:

```text
new/normal user
→ Today

power user
→ Cmd-K
```

This lets primary navigation remain simple without hiding capabilities.

---

# U84. DO NOT DELETE POWER FEATURES

Simplifying UX does NOT mean removing:

```text
focused practice

manual lesson choice

raw Library access

progress analytics

source information

advanced practice modes

Studio
```

Move them to appropriate secondary surfaces.

---

# U85. AVOID DUPLICATE DESTINATIONS

Audit for overlapping functions.

Examples:

```text
Review page
vs Practice quick review

Mistakes page
vs Weak Areas

Books
vs Library

Reference
vs Library

Progress
vs Journey analytics
```

Define one primary home for each workflow.

Keep redirects/deep links where useful.

---

# U86. URL COMPATIBILITY

Where old routes are removed from primary navigation:

preserve existing URLs where possible.

They may render:

```text
the same underlying component
```

or redirect to the new canonical surface.

Do not unnecessarily break bookmarks.

---

# U87. STATE OWNERSHIP

Do not scatter state across unrelated pages.

Create clear ownership for:

```text
current activity

today session

resume state

target level

scaffolding preference

immersion progress
```

Reuse existing local/session infrastructure.

---

# U88. EVENT NAMES

The repo currently uses events such as:

```text
michi-review-updated
michi-profile-updated
...
```

Do not casually rewrite all event infrastructure.

But if new session/resume state needs events, centralize constants if appropriate.

Avoid uncontrolled proliferation of string event names.

---

# U89. DESIGN TOKENS

Current components contain many repeated literal colors.

Do not perform a risky total CSS rewrite solely for cleanliness.

However, when touching a large number of new/refactored components, prefer existing design tokens/classes or introduce restrained semantic tokens for repeated surface states.

Avoid creating five slightly different golds and seven dark panel backgrounds.

---

# U90. ACCESSIBILITY

Preserve or improve:

```text
keyboard navigation

focus states

ARIA labels

screen-reader status

reduced motion

sufficient contrast

large touch targets
```

Audio-only tasks require appropriate accessible alternatives without compromising exam behavior.

---

# U91. DO NOT MAKE EVERYTHING PERSONALIZED

Adaptive UX should serve actual learning.

Do not create:

```text
AI-generated greeting paragraphs

fake personality summaries

overly chatty recommendation copy

daily motivational essays
```

Keep recommendations concise and useful.

---

# U92. COPY STYLE

Kizashi copy should remain:

```text
calm
concise
slightly poetic
Japanese-learning focused
```

Avoid:

```text
corporate dashboard terminology

Duolingo-style guilt

excess gamification

fake urgency
```

Example good:

```text
One short review is enough today.
```

Not:

```text
You're about to lose your 14-day streak!
```

---

# U93. USER CONTROL

Automation should never prevent manual choice.

Always retain ways to:

```text
choose another lesson

choose another activity

change study duration

browse Library

practice a specific skill

ignore recommendation
```

Today is the default path, not a cage.

---

# U94. TODAY SHOULD LEARN FROM INTERRUPTIONS

If the learner stops after:

```text
review
+
lesson
```

but before reading:

the next visit should not restart the whole session.

Resume:

```text
2 of 4 complete

Continue with listening
```

---

# U95. DO NOT OVERLOAD TODAY

A 20-minute plan should not contain:

```text
14 tiny disconnected widgets
```

Prefer 3–5 meaningful blocks.

Example:

```text
Review

Learn

Listen

Read
```

---

# U96. SESSION TRANSITIONS

Between modalities, use brief transitions.

Example:

```text
Grammar done.

Now hear it in context.
```

Then:

```text
Irodori · Restaurant
```

This makes the learning sequence feel intentional.

---

# U97. SMART CROSS-MODAL TRANSITIONS

Examples:

```text
learn grammar
→ contextual practice

practice grammar
→ immersion

miss listening vocab
→ micro review

finish reading
→ save unknown words

conjugation error
→ conjugation burst
```

Use existing content mappings.

---

# U98. SAVING FROM IMMERSION

When a learner taps an unknown word in reading/listening:

show:

```text
食堂
しょくどう
cafeteria

[ Study later ]
```

Avoid interrupting the activity with a full Library navigation.

---

# U99. STUDY LATER

Maintain a lightweight:

```text
Study later
```

queue.

This is different from immediately inserting everything into SRS.

At session end:

```text
You saved 3 items.

[ Review now ]
[ Add to study queue ]
```

---

# U100. PROGRESSIVE DISCLOSURE

Advanced controls should appear when needed.

Examples:

Practice:

```text
Quick
Focus
Weaknesses
Test
```

then deeper options.

Immersion:

```text
Listen
Read
Shadow
Explore
```

then provider/level filters.

Library:

```text
Search
```

then filters.

Do not show everything simultaneously.

---

# U101. LIBRARY SHOULD BECOME THE KNOWLEDGE HOME

Consolidate:

```text
Vocabulary

Kanji

Grammar

Chunks

Sentences

Notes

Reading

Reference

Books
```

under Library where practical.

Do not necessarily put all categories on one initial screen.

Use search + category tabs/filters.

---

# U102. BOOKS SHOULD BECOME A LIBRARY SUBAREA

If `/books` handles user books/PDFs:

keep the functionality but surface it from:

```text
Library → Books
```

rather than primary navigation.

Preserve route compatibility.

---

# U103. REFERENCE SHOULD BECOME A LIBRARY SUBAREA

Kana/kanji/reference charts belong conceptually under:

```text
Library → Reference
```

again preserving deep links.

---

# U104. NOTES

Notes should be accessible contextually from learning items and Library.

Do not require navigating to a separate notebook to write:

```text
"この is used before a noun"
```

---

# U105. CONTENT SOURCE DETAILS

Source/license/provenance information should remain available but not dominate normal learning.

Typical UI:

```text
Irodori · Japan Foundation
ⓘ
```

Detailed source information behind info.

---

# U106. ADMIN VS LEARNER EXPERIENCE

Studio should feel completely separate from the learner's normal path.

Admin users may access it through:

```text
Cmd-K

profile menu

direct URL
```

Do not let:

```text
Content Studio
```

compete visually with:

```text
Learn Japanese
```

---

# U107. JOURNEY HERO COPY

Audit hardcoded:

```text
N5 Foundations
```

language in:

```text
header
Practice
Learn
sidebar
Progress
command palette
```

The N4 content milestone generalizes target level.

UX copy must follow the current active target.

Do not leave stale N5-only copy across the app.

---

# U108. TIME-OF-DAY GREETING

The Journey currently appears to contain hardcoded greeting language.

If keeping greeting copy, make it time-appropriate based on local device time.

Or use neutral:

```text
こんにちは
```

Do not display:

```text
こんばんは
```

at breakfast.

This is small but visible.

---

# U109. PROGRESSIVE JAPANESE UI

As the learner progresses, carefully allow more Japanese labels to become primary.

Early:

```text
Practice · 練習
```

Later potentially:

```text
練習
Practice
```

Do not make navigation incomprehensible for beginners.

Treat this as cosmetic enrichment, not mandatory complexity.

---

# U110. ACTIVITY DIFFICULTY LANGUAGE

Prefer:

```text
Comfortable

Stretch

Challenge
```

over opaque numerical difficulty when recommending immersion.

Underlying numbers may remain.

---

# U111. RECOMMENDATION REASONS

When useful, show one short reason:

```text
Uses grammar you learned today.
```

or:

```text
You know 92% of the vocabulary.
```

or:

```text
Repairs your recent に / で mistakes.
```

Do not display the entire scoring formula.

---

# U112. NO FAKE PRECISION

Do not show:

```text
93.728% ready
```

or:

```text
Difficulty 6.42
```

Use human-readable tiers unless detailed analytics are explicitly opened.

---

# U113. ONBOARDING / FIRST RUN

Because this is a private single-user app, onboarding should be tiny.

If profile state is missing:

```text
What are you studying toward?

N5
N4

How much time most days?

5
10
20
30 min

Optional exam date
```

Then start.

Do not build a 12-screen onboarding funnel.

---

# U114. RETURNING USER EXPERIENCE

Returning user:

```text
open Kizashi
↓
Today
↓
Continue
```

No splash dashboard requiring several choices.

---

# U115. NEW CONTENT DISCOVERY

When new content/source integrations appear, surface them subtly.

Example:

```text
New

Hirogaru
Learn through interests
```

Do not create blocking tours.

---

# U116. LEARNER TRUST

If Kizashi recommends something because of inferred weakness, explain briefly.

Example:

```text
Recommended because you missed two date-listening questions this week.
```

This makes adaptation understandable.

---

# U117. SENSITIVE ADAPTATION

Do not infer psychological/personality labels from study behavior.

Use task-level descriptions only.

Good:

```text
Listening has been slower this week.
```

Bad:

```text
You are an auditory learner.
```

---

# U118. IMPLEMENTATION ORDER

Follow approximately this order.

Do not start with decorative animation.

## Phase 1 — UX audit

Report:

```text
current primary routes

desktop nav count

mobile nav count

Practice modes

Learn hierarchy

Immersion responsibilities

duplicate destinations

hardcoded N5 copy

current resume-state support
```

## Phase 2 — Navigation simplification

Implement:

```text
primary navigation
secondary destinations
admin isolation
mobile nav
```

Preserve route compatibility.

## Phase 3 — Today/session orchestrator

Implement:

```text
daily plan
duration
continue
resume
completion
```

## Phase 4 — Practice IA

Replace mode overload with:

```text
Quick
Focus
Weaknesses
Test
```

## Phase 5 — Learn simplification

Implement:

```text
lesson-first
step progression
lesson selector
lesson completion
```

## Phase 6 — Immersion refactor

Implement:

```text
feed
filters
activity player
resume
```

before provider count grows further.

## Phase 7 — Universal continue/resume

Persist cross-surface state.

## Phase 8 — Repair Center

Convert Mistakes into actionable modality-specific repair.

## Phase 9 — Unified Japanese search

Extend Cmd-K and Library search.

## Phase 10 — Adaptive scaffolding

Implement:

```text
furigana fading
hint fading
transcript fading
production support fading
```

## Phase 11 — Progress narrative

Add:

```text
what changed
priority
recent strengths
```

above detailed analytics.

## Phase 12 — Journey visual hierarchy

Reduce dashboard density and strengthen path metaphor.

## Phase 13 — contextual actions

Wire:

```text
item → practice
item → immersion
mistake → repair
etc.
```

## Phase 14 — visual refinement

Reduce card soup and improve typography/spacing.

## Phase 15 — mobile/accessibility/performance

Audit all affected surfaces.

## Phase 16 — tests/build

Run complete suite.

---

# U119. DO NOT DO

Do NOT:

```text
replace the content milestones

delete useful power-user features

remove deep links unnecessarily

build a chatbot homepage

make AI choose everything without override

build another recommendation engine

build another session state system if existing one can extend

build another mastery model

add currencies

add lives

add energy

add streak-loss warnings

turn Journey into a childish game map

make XP the primary measure of progress

keep 12 Practice modes as equal top-level tabs

keep every feature in primary navigation

keep adding provider sections into one giant Immersion component

make Learn start with two navigation indexes

force the learner to manually build daily study sessions

make every section a rounded card

hide adaptation logic completely

show fake precision

break offline local study

break existing N5 functionality

leave hardcoded N5 language after N4 support ships
```

---

# U120. REQUIRED LEARNER EXPERIENCE — OPENING THE APP

Target experience:

```text
TODAY
N5 · Wednesday

18 min

Review
14 due

Learn
Ordering Food · step 3/8

Listen
Irodori · restaurant

Read
N5 short passage

[ Continue Today ]
```

The learner should not need to decide which subsystem to open.

---

# U121. REQUIRED LEARNER EXPERIENCE — QUICK PRACTICE

```text
PRACTICE

What do you need?

QUICK
Kizashi chooses · 5 min

FOCUS
Choose a skill

WEAKNESSES
Repair recurring misses

TEST
Mini · Section · Mock
```

---

# U122. REQUIRED LEARNER EXPERIENCE — LEARN

```text
Ordering Food
食事を注文する

3 / 8

●──●──●──○──○──○──○──○


〜てもいいですか

[ lesson content ]


← Back                Continue →
```

Lesson index should not dominate the page.

---

# U123. REQUIRED LEARNER EXPERIENCE — LESSON COMPLETE

```text
LESSON COMPLETE

You learned

4 words
2 kanji
1 grammar pattern

Needs another look

に vs で


NEXT REVIEW
Tomorrow


REAL JAPANESE

Irodori
Restaurant dialogue
3 min

[ Listen ]

[ Finish for today ]
```

---

# U124. REQUIRED LEARNER EXPERIENCE — IMMERSION

```text
IMMERSION

FOR YOU

Irodori
At the restaurant
Listening · 2:48
Comfortable · 92% known

[ Listen ]


CONTINUE

Teppei
Episode ...


QUICK READ

JFS
Café menu


EXPLORE

Hirogaru
Anime & Manga
```

Filters:

```text
Listen
Read
Shadow
Explore
```

---

# U125. REQUIRED LEARNER EXPERIENCE — WEAKNESS REPAIR

```text
WEAKNESSES

に vs で

4 recent misses
Mostly location-of-action contexts.

[ Fix · 3 min ]

────────

て-form

Accurate but slow.

[ Conjugation burst · 2 min ]

────────

八日

Missed twice in listening.

[ Date listening · 2 min ]
```

---

# U126. REQUIRED LEARNER EXPERIENCE — PROGRESS

```text
THIS WEEK

Listening
Improving

Grammar
31 → 39 strong

Newly strong
食べる · 行く · 〜たい

Needs attention
に vs で

NEXT PRIORITY
N5 reading

[ Start practice ]

────────

Detailed stats
```

---

# U127. REQUIRED LEARNER EXPERIENCE — SEARCH

User opens:

```text
Cmd-K
```

and types:

```text
permission
```

Results:

```text
GRAMMAR

〜てもいい
Permission

〜てはいけない
Prohibition


LESSONS

Rules & Permission


IMMERSION

Irodori · Asking permission
```

---

# U128. REQUIRED LEARNER EXPERIENCE — ADAPTIVE SUPPORT

Early learner reading:

```text
昨日、友達と映画を見ました。
きのう、ともだちとえいがをみました。
```

Later:

```text
昨日、友達と映画を見ました。
```

Unknown kanji still reveal furigana on demand.

---

# U129. TESTS — NAVIGATION

Test:

```text
primary routes

desktop nav

mobile nav

secondary navigation

admin Studio isolation

old deep-link compatibility

active nav states
```

---

# U130. TESTS — TODAY

Test:

```text
daily plan composition

duration changes

resume

completed block exclusion

overdue review priority

weakness priority

active lesson continuation

N5/N4 target respect

offline behavior

empty due-review state
```

---

# U131. TESTS — PRACTICE

Test:

```text
Quick

Focus

Weaknesses

Test

existing underlying modes still reachable

URL parameters

N5/N4 behavior

mock gating
```

---

# U132. TESTS — LEARN

Test:

```text
lesson opens directly

resume stage

next/back

lesson change

completion

real-Japanese recommendation

no duplicated progress

mobile layout
```

---

# U133. TESTS — IMMERSION

Test:

```text
feed rendering

filtering

activity opening

activity resume

provider failure

listening player

reading player

shadowing

external source progress

mobile behavior
```

---

# U134. TESTS — RESUME

Test:

```text
lesson resume

practice resume

reading resume

listening resume

shadowing resume

intentional-engagement threshold

continue CTA selection
```

---

# U135. TESTS — SCAFFOLDING

Test:

```text
furigana policy

manual override

transcript visibility

grammar hints

production supports

mastery threshold behavior

exam-mode exceptions
```

---

# U136. TESTS — SEARCH

Test:

```text
Japanese written form

kana reading

English meaning

grammar pattern

topic

contrast

lesson

immersion resource

keyboard behavior
```

---

# U137. PERFORMANCE TESTS

Verify that simplifying UI does not create giant client payloads.

Especially:

```text
Today recommendation data

Immersion feed

Library search

Journey

Practice
```

Do not send the full 7k+ source package to the browser to render five cards.

---

# U138. FINAL REPORT

At completion report:

## Navigation

```text
old primary nav count
new primary nav count

desktop destinations
mobile destinations
secondary destinations
```

## Today

```text
supported block types
duration modes
resume behavior
recommendation inputs
```

## Practice

```text
top-level learner choices
underlying focus skills
test modes
```

## Learn

```text
lesson-stage model
resume behavior
completion behavior
contextual immersion behavior
```

## Immersion

```text
feed architecture
activity-player architecture
filtering
resume support
```

## Repair

```text
weakness categories
repair modes
```

## Scaffolding

```text
furigana
grammar hints
transcripts
production support
```

## Search

```text
searchable entity types
available result actions
```

## Progress

Describe the new learner-facing progress summary.

## Visual

Summarize:

```text
card-soup reductions
hierarchy changes
Journey changes
mobile changes
```

## Tests

Report every command run and result.

---

# U139. DEFINITION OF DONE

This UX milestone is complete only when:

* the learner has a clear default action on opening Kizashi;
* Today automatically builds a useful study plan;
* Today can resume partially completed sessions;
* primary navigation is substantially simpler;
* mobile navigation is not overcrowded;
* Review/Mistakes/Books/Reference/Progress do not all compete as equal primary destinations;
* Practice no longer exposes approximately a dozen peer-level modes at once;
* Practice is organized around Quick / Focus / Weaknesses / Test;
* Learn opens directly into the active lesson;
* lessons behave like coherent sequences;
* lesson progress is obvious;
* lesson completion provides meaningful closure;
* relevant real-Japanese reinforcement appears contextually;
* Journey emphasizes route/progression rather than dashboard analytics;
* N5 → N4 feels like journey progression;
* Immersion is a feed plus focused activity player rather than one ever-growing mega-component;
* Irodori/Erin/Tadoku/Shun/Teppei/etc. do not become separate primary-navigation silos;
* universal resume/continue works across major activity types;
* Mistakes has become an actionable repair experience;
* weakness repair is modality-specific;
* Cmd-K can search Japanese content as well as commands;
* Progress leads with useful change/priority insights;
* XP remains secondary to actual learning;
* scaffolding fades as competence improves;
* the learner can manually restore support at any time;
* contextual actions connect learning items to practice/immersion/notes;
* Library becomes the knowledge/reference home;
* card density is reduced;
* Japanese text has stronger visual priority;
* mobile Learn/Practice/Immersion are genuinely usable;
* existing routes remain compatible where practical;
* N4 support does not leave stale N5-only UI copy;
* local-first behavior still works;
* provider failures degrade gracefully;
* accessibility is preserved or improved;
* tests and production build pass.

The final UX test is:

```text
When I open Kizashi,
do I immediately know what to do?

Can I begin studying in one click?

Does the app remember where I was?

Can I focus on Japanese rather than navigating the app?

When I make a mistake,
does Kizashi know what kind of repair would help?

When I learn something,
can I immediately encounter it in context?

When I improve,
does the app remove unnecessary help?

Can I still manually explore anything when I want to?

Does Kizashi feel like one coherent learning system,
rather than a collection of features?
```

If those answers are yes, the UX milestone is complete.
# ADDENDUM — RESTORE THE “PATH THROUGH JAPAN” EXPERIENCE

This is an ADDENDUM to:

`ADDENDUM — KIZASHI UX, INFORMATION ARCHITECTURE, AND DAILY LEARNING FLOW`

It does NOT supersede or weaken any previous requirements.

The purpose of this addendum is to restore a core product idea that has become diluted during implementation:

> Kizashi should feel like the learner is gradually traveling through Japan as their Japanese ability grows.

The Journey metaphor must not be reduced to:

```text
lesson 1
↓
lesson 2
↓
lesson 3
```

with Japanese-colored cards around it.

The feeling of moving through Japan should be visible across:

```text
Journey
Today
lessons
Immersion
completion
progression
visual design
```

This should become one of the strongest elements of Kizashi's identity.

---

# J1. CORE PRODUCT FANTASY

The learner should feel:

```text
I started knowing almost nothing.

I entered a Japanese town.

I learned to greet people.

I learned to buy things.

I learned to use the station.

I learned to understand notices.

I learned to order food.

I learned to talk about my plans.

I gradually became able to move through more of Japan.
```

The journey is both:

```text
language progression
+
visual/spatial progression
```

These should reinforce each other.

---

# J2. JOURNEY SHOULD BE A PLACE, NOT A COURSE LIST

The Journey page should feel like a navigable illustrated route.

Conceptually:

```text
                山

                ●
            countryside
                 │
                 │
             ● 温泉町
                 │
              train
                 │
         ●────────────●
      駅前          商店街
       │               │
       │               ●
       │             café
       │
       ●
     neighborhood
       │
       ●
      START
```

Do not literally implement this ASCII.

The route should visually suggest movement through environments.

---

# J3. BUILD A VISUAL WORLD MODEL

Create a lightweight world/progression model.

Conceptually:

```typescript
JourneyArea {
  id
  title
  japaneseTitle
  environment
  locationTheme
  lessonIds
  milestone
  visualAsset
  season?
  ambientDetails?
}
```

Do not over-engineer it into a game engine.

Its purpose is to connect curriculum progression to visual environments.

---

# J4. N5 SHOULD FEEL LIKE LEARNING TO LIVE IN A JAPANESE TOWN

N5 progression should primarily use everyday environments.

Possible progression:

```text
1. Arrival
   はじまり

2. Neighborhood
   町

3. Home
   家

4. Classroom / campus
   学校

5. Convenience store
   コンビニ

6. Shopping street
   商店街

7. Café / restaurant
   喫茶店 / レストラン

8. Station
   駅

9. Train
   電車

10. Park / meeting place
    公園

11. Library
    図書館

12. Everyday town life
    日常
```

These are thematic environments.

Do not falsely claim the learner is literally traveling through a specific real city unless the route is intentionally based on one.

---

# J5. N4 SHOULD EXPAND THE WORLD

Moving from N5 to N4 should visibly open Japan outward.

Conceptually:

```text
N5
one familiar town
daily survival
basic interactions

        ↓

N4
larger city
regional travel
longer conversations
events
work/study
trips
different environments
```

Possible N4 environments:

```text
larger station
city center
university area
workplace
museum
festival
day trip
ryokan / hotel
coastal town
mountain town
local train journey
regional shopping district
```

The visual scale of the world should increase with ability.

---

# J6. N5 → N4 TRANSITION MUST FEEL SPECIAL

Do not implement N4 as:

```text
Target Level:
N5 ▼
```

and suddenly change some database rows.

Create a visible journey milestone.

Example concept:

```text
N5 route completed

────────────

新しい道
A NEW ROAD

You can now move beyond the familiar town.

N4 route unlocked.

[ Cross the bridge ]
```

Possible visual transition:

```text
town
↓
station
↓
train journey
↓
new district / region
```

Keep it restrained rather than theatrical.

---

# J7. USE IMAGES / ILLUSTRATION INTENTIONALLY

YES: use visual imagery substantially more than the current interface.

The site should not rely entirely on:

```text
dark rectangles
text
icons
borders
```

Use images to establish:

```text
place
season
weather
time of day
movement
atmosphere
```

---

# J8. IMAGE TYPES

Good visual assets include:

```text
Japanese streets

stations

shopping streets

cafés

convenience stores

libraries

parks

neighborhoods

train interiors

platforms

local trains

city streets

quiet residential areas

coastal towns

mountains

festivals

small restaurants

bookshops

school/campus environments

rainy streets

evening neighborhoods
```

Use images that feel lived-in.

Avoid making Japan look like a tourist brochure.

---

# J9. DO NOT DEFAULT TO STEREOTYPE JAPAN

Avoid excessive reliance on:

```text
torii gates

Mount Fuji

sakura

geisha imagery

neon Shibuya

anime characters

samurai

temples on every screen
```

These can appear where contextually appropriate.

They must not become the entire visual identity.

Kizashi should primarily depict:

> ordinary Japan that the learner is learning to navigate.

A neighborhood street or train platform can be more valuable than another Fuji wallpaper.

---

# J10. PREFER REAL JAPANESE ENVIRONMENTS

Whenever possible, visual inspiration should come from:

```text
actual station architecture

shotengai

residential streets

Japanese signage

convenience stores

school environments

local cafés

public libraries

trains

urban parks

suburban environments
```

The visual world should make studying everyday Japanese feel connected to an actual environment.

---

# J11. IMAGE SOURCING

Where external imagery is used, use sources with clear reuse terms or appropriate remote/provider-hosted behavior.

Maintain:

```text
source URL
creator
license
attribution
```

where required.

Do not blindly scrape Google Images.

Do not hotlink random copyrighted photography.

Use appropriate sources such as:

```text
Wikimedia Commons
appropriately licensed image providers
public-domain/open government tourism assets where suitable
Kizashi-generated visual artwork where appropriate
```

If generated imagery is used:

* keep visual consistency,
* do not imitate a living artist,
* avoid fake documentary claims,
* treat generated imagery as atmospheric illustration.

---

# J12. VISUAL STYLE

The preferred imagery should feel closer to:

```text
editorial travel photography
Japanese slice-of-life environments
quiet cinematic backgrounds
restrained illustrated landscapes
train-window imagery
street-level photography
```

rather than:

```text
stock-photo website
anime wallpaper
mobile gacha game
tourism advertisement
```

---

# J13. IMAGE TREATMENT

Images should integrate with the existing dark visual language.

Possible treatment:

```text
dark gradient overlays

soft desaturation

subtle grain

cropped cinematic framing

text layered carefully

warm evening tones where source allows

low-contrast backgrounds behind Japanese typography
```

Do not place every image inside another rounded card.

Use some:

```text
full-bleed moments

wide editorial banners

background scenes

edge-to-edge mobile imagery

journey panoramas
```

---

# J14. JOURNEY MAP SHOULD USE VISUAL LANDMARKS

Each major route section should have a landmark/environment.

Example:

```text
START
町の入口

↓ greeting lessons

RESIDENTIAL STREET
住宅街

↓ home/daily routine

CONVENIENCE STORE
コンビニ

↓ numbers/prices/counters

SHOPPING STREET
商店街

↓ shopping/adjectives

STATION
駅

↓ time/travel/directions

RESTAURANT
食堂

↓ food/orders/requests
```

The learner should visually recognize:

> I am at the station part of my journey.

---

# J15. LESSON THEMES SHOULD ALIGN WITH PLACE

Where pedagogically reasonable, lessons should connect naturally to environments.

Example:

```text
STATION

Vocabulary
駅
電車
切符
入口
出口

Grammar
〜に行きます
〜から〜まで
前に

Micro-skills
time
platform numbers

Listening
station dialogue

Reading
train schedule

Immersion
Irodori station activity
```

This produces a coherent episode rather than unrelated records.

Do not force grammar into a location when the connection is artificial.

---

# J16. TODAY SHOULD SHOW WHERE TODAY'S STUDY TAKES PLACE

Example:

```text
TODAY

駅前
AT THE STATION

18 min

Review
8 items

Learn
〜前に

Listen
Irodori · station

Read
train information

[ Continue Today ]
```

Use an atmospheric station image or illustration as part of the Today header.

This gives the session narrative cohesion.

---

# J17. LESSON OPENING SHOULD ESTABLISH PLACE

Instead of immediately showing a grammar card:

```text
駅
AT THE STATION

You are meeting a friend before taking a train.

Today you will learn to:
• talk about time
• say where you are going
• understand basic station information

[ Begin ]
```

Then transition into the learning sequence.

---

# J18. USE MICRO-SCENARIOS

Lessons should occasionally introduce short situational framing.

Example:

```text
You're at a convenience store.

The cashier asks:

袋はいりますか。

You have heard:
袋
いる

What do you think they are asking?
```

This makes language feel embedded in place.

Do not turn every flashcard into roleplay.

Use scenarios at important transitions.

---

# J19. LOCATION-BASED COMPLETION MOMENTS

Finishing a group of lessons should visibly advance the route.

Example:

```text
商店街
COMPLETE

You can now:

✓ ask prices
✓ understand basic quantities
✓ say what you want
✓ understand simple shop interactions

New route opened:

駅
THE STATION

[ Continue the journey ]
```

This is much stronger than:

```text
Chapter 3 complete.
```

---

# J20. JOURNEY SHOULD CHANGE VISUALLY AS THE USER ADVANCES

Examples:

```text
locked route
→ distant / muted

available route
→ visible

current area
→ visually emphasized

completed area
→ settled / illuminated

newly unlocked path
→ subtle transition
```

Avoid padlocks everywhere.

The world itself can communicate progression.

---

# J21. USE SEASONAL EVOLUTION

Japan's seasonal identity is a powerful visual tool.

Use it subtly.

Possible progression:

```text
spring
→ early summer
→ rainy season
→ summer
→ autumn
→ winter
```

This does NOT need to correspond literally to study duration.

It can track major route progression or optionally actual date.

Use restrained seasonal cues:

```text
rain
hydrangeas
summer evening
autumn leaves
winter light
```

not:

```text
SAKURA ON EVERY PAGE
```

---

# J22. TIME-OF-DAY VARIATION

Where low-cost, Journey/Today imagery may respond to local time:

```text
morning
day
evening
night
```

Examples:

```text
station in morning light

shopping street during afternoon

neighborhood at dusk
```

Do not require four duplicate image libraries for every location.

Use where practical.

---

# J23. WEATHER AS ATMOSPHERE — OPTIONAL

If technically cheap and visually coherent, atmospheric states may include:

```text
clear
rainy
snowy
cloudy
```

This is purely visual.

Do NOT couple core UX to a weather API.

Do NOT block study because weather data fails.

---

# J24. TRAIN MOTIF

Trains are a particularly strong metaphor for Kizashi.

Use subtly throughout the route.

Examples:

```text
stations = curriculum milestones

lines = learning paths

next station = next lesson cluster

transfer = N5 → N4

platform signs = section headers

route map = Journey
```

This matches actual Japanese visual culture while remaining functional.

Do not make every button look like railway signage.

---

# J25. STATION SIGNAGE DESIGN LANGUAGE

Possible visual inspiration:

```text
station numbering

platform indicators

route lines

departure boards

wayfinding signs
```

Use these as structural cues.

Example:

```text
N5-04

駅
STATION

4 / 12
```

instead of:

```text
MODULE CARD #4
```

---

# J26. JOURNEY MAP MOTION

When completing a milestone:

```text
current point
↓
route animates forward
↓
new environment reveals
```

Keep animation short.

Respect reduced motion.

Do not turn it into a cutscene.

---

# J27. USE VISUAL TRANSITIONS BETWEEN ENVIRONMENTS

Example:

```text
shopping street
↓
walking transition
↓
station exterior
```

or:

```text
station
↓
train window
↓
new district
```

These may be:

```text
brief illustrated transition panels
background crossfades
single cinematic images
```

Use sparingly.

---

# J28. IMMERSION SHOULD FEEL LIKE EXPLORING JAPAN

The Immersion feed should not feel like:

```text
provider list
```

It should feel like:

```text
things you can experience in Japanese
```

Example:

```text
EXPLORE JAPAN

At a café
Irodori · Listening

On the train
Erin · Dialogue

Books & Libraries
Hirogaru · Video

Everyday conversation
Teppei · Podcast

Shopping
JFS · Practical reading
```

Provider remains visible but secondary.

---

# J29. IMMERSION CARDS CAN USE IMAGERY

Use relevant thumbnails/visuals where legitimately available.

Example:

```text
[ station image ]

駅で
AT THE STATION

Irodori
Listening · 3 min

You know 91%

[ Listen ]
```

For YouTube/Hirogaru/etc., provider-hosted thumbnails may already exist.

Do not generate fake source thumbnails for external resources.

---

# J30. DISCOVERY BY PLACE

In addition to:

```text
Listen
Read
Shadow
Explore
```

support an optional exploratory view such as:

```text
PLACES

Station
Food
Shopping
Home
School
Travel
Nature
Culture
```

This can be especially useful for Immersion.

It should remain secondary to personalized recommendations.

---

# J31. LIBRARY CAN HAVE A MAP-LIKE CONNECTION

When browsing a word/concept, optionally show where it has appeared.

Example:

```text
切符
きっぷ
ticket

Seen in:

駅
Station lesson

Irodori
Train activity

Reading
Timetable

[ Visit context ]
```

This reinforces the sense that vocabulary belongs to experiences.

---

# J32. PROGRESS SHOULD SHOW THE WORLD OPENING

Instead of only:

```text
38% grammar
```

also show:

```text
PLACES YOU CAN HANDLE

Neighborhood
Strong

Shopping
Strong

Station
Developing

Restaurant
Developing

Travel
Not yet introduced
```

This is an interpretation layer over skill data.

Do not replace detailed analytics.

---

# J33. PROFILE PORTRAIT SHOULD REFLECT THE JOURNEY

The existing Study Portrait can incorporate:

```text
current environment

route progress

season

major milestones
```

rather than only XP level.

Example:

early:

```text
quiet neighborhood
```

later:

```text
station / city
```

later:

```text
train / regional landscape
```

Do not create an anime avatar system unless explicitly requested later.

The portrait can remain environmental.

---

# J34. IMAGE PERFORMANCE

Do not ruin app performance with giant backgrounds.

Use:

```text
Next/Image

responsive sizes

modern formats

lazy loading

low-quality placeholders where useful

appropriate caching
```

Hero/active-route images may be eager when necessary.

Offscreen Journey/Immersion images should lazy load.

---

# J35. IMAGE FALLBACKS

Every image-backed surface must still work without the image.

If image fails:

```text
gradient
pattern
typography
```

should preserve usability.

Never put critical Japanese learning information only inside an image.

---

# J36. ACCESSIBILITY

All content-bearing images require meaningful alt text.

Pure atmosphere:

```text
alt=""
```

where appropriate.

Do not produce verbose decorative screen-reader noise.

Text contrast over photography must remain accessible.

---

# J37. DO NOT OVERLOAD EVERY SCREEN WITH PHOTOS

The target is NOT:

```text
every card has an image
```

Use imagery strategically.

Best candidates:

```text
Today hero

Journey environments

lesson openings

major milestones

Immersion discovery

N5 → N4 transition

Profile journey portrait
```

Normal drills should remain clean and focused.

---

# J38. LESSON PRACTICE SHOULD BECOME VISUALLY QUIETER

After a cinematic/environmental lesson opening:

the actual drill should remove distraction.

Pattern:

```text
PLACE / CONTEXT
visual

↓ transition

FOCUSED LEARNING
clean

↓ completion

PLACE / CONTEXT
visual reinforcement
```

This contrast prevents imagery from hurting concentration.

---

# J39. REAL JAPANESE SIGNS — USEFUL VISUAL CONTENT

Where original or appropriately licensed material is available, include visual reading tasks involving realistic Japanese signage.

Examples:

```text
入口
出口
営業中
休み
禁煙
駅
改札
注意
```

Also original Kizashi-designed:

```text
menus
posters
timetables
shop notices
station signs
```

These should look plausibly Japanese rather than like plain text inside Bootstrap cards.

---

# J40. INFORMATION-RETRIEVAL ASSETS SHOULD LOOK REAL

For Kizashi-original JLPT reading:

instead of:

```text
[ bordered paragraph ]
```

create realistic-but-original:

```text
menu layouts

train schedules

store posters

event flyers

library notices

school schedules

maps

signage
```

Do not copy real copyrighted designs.

Create original layouts inspired by real information structures.

This substantially improves both learning and visual identity.

---

# J41. TYPOGRAPHY AS ENVIRONMENT

Use Japanese typography as part of the visual world.

Examples:

```text
駅

商店街

図書館

喫茶店
```

can appear as large environmental labels.

English translation remains subordinate:

```text
STATION
SHOPPING STREET
LIBRARY
CAFÉ
```

This reinforces passive Japanese familiarity.

---

# J42. AMBIENT MICROCOPY

Small pieces of Japanese can make the environment feel alive.

Examples:

```text
次の駅
Next stop

まもなく
Coming up

今日の道
Today's path

寄り道
Detour

もう少し
A little further

到着
Arrived
```

Use sparingly and accurately.

Do not stuff Japanese words decoratively where they make no sense.

---

# J43. OPTIONAL DETOURS

One excellent use of the travel metaphor:

```text
寄り道
DETOUR
```

These are optional activities.

Examples:

```text
Teppei episode

Hirogaru article

Tadoku story

Japanese with Shun video

Aozora challenge
```

Core route:

```text
curriculum
```

Detours:

```text
immersion / interests
```

This makes optional study feel thematically coherent.

---

# J44. DETOURS MUST NOT BLOCK PROGRESSION

A learner should never be required to complete:

```text
podcast
YouTube
external article
```

to advance through the core Journey.

They are optional explorations.

---

# J45. MILESTONES SHOULD BE PLACES

Instead of generic:

```text
Milestone 3
```

prefer:

```text
駅前
STATION DISTRICT

You can now:
...
```

or another environment tied to the curriculum.

---

# J46. ACHIEVEMENTS CAN ALSO REFERENCE THE JOURNEY

Keep achievements restrained.

Examples:

```text
はじめの一歩
First step

町を歩く
Around town

初めての電車
First train

道が広がる
The road opens
```

Avoid random badge spam.

---

# J47. ROUTE SUMMARY

Journey should be able to show:

```text
YOUR PATH

町の入口
✓

住宅街
✓

商店街
✓

駅前
● current

レストラン
○ next

町の外
locked / distant
```

Use environmental illustration rather than a plain checklist.

---

# J48. REAL GEOGRAPHY — OPTIONAL AND CAREFUL

Kizashi may eventually use actual regions/cities as visual inspiration.

However:

Do not claim:

```text
Lesson 3 = Kyoto
Lesson 4 = Osaka
```

arbitrarily.

If real geography is used:

* use accurate locations,
* avoid stereotypes,
* distinguish thematic curriculum route from literal travel itinerary.

For now, a fictionalized-but-authentically-Japanese learning town may be cleaner.

---

# J49. PREFERRED WORLD STRUCTURE

A good initial implementation is:

```text
N5
FAMILIAR TOWN

         ↓

N5/N4 BRIDGE
TRAIN JOURNEY

         ↓

N4
WIDER JAPAN
```

This provides enough environmental progression without requiring a full geographical simulation.

---

# J50. REQUIRED JOURNEY EXPERIENCE

Target:

```text
TODAY

[wide atmospheric station image]

駅前
AT THE STATION

N5 · Stop 7

Today · 16 min

Review
8 due

Learn
〜前に

Listen
Irodori · 駅で

Read
Train information

[ Continue Today's Path ]
```

---

# J51. REQUIRED JOURNEY MAP EXPERIENCE

Target:

```text
YOUR JOURNEY

[ illustrated route ]

町の入口
✓

住宅街
✓

商店街
✓

駅前
●

レストラン
○

図書館
○

町の外
…
```

Current location must be visually obvious.

---

# J52. REQUIRED LESSON OPENING

Target:

```text
[station environment]

駅
AT THE STATION

You're meeting a friend before catching a train.

Today:

• say when something happens
• understand basic times
• talk about going somewhere

10 min

[ Begin ]
```

Then the image recedes and focused learning begins.

---

# J53. REQUIRED AREA COMPLETION

Target:

```text
到着
ARRIVED

駅前

You can now:

✓ understand common station words
✓ talk about time
✓ say where you're going
✓ read a simple timetable

The road continues.

Next:

レストラン
Food & ordering

[ Continue ]
```

---

# J54. REQUIRED N5 → N4 MOMENT

Target:

```text
[train / landscape visual]

新しい道
A NEW ROAD

You have crossed the N5 foundations.

The familiar town is behind you.

N4 opens a wider Japan:

longer conversations
longer reading
more natural speech
more independence

[ Board the train ]
```

Do not make the copy excessively dramatic.

Keep it elegant.

---

# J55. REQUIRED IMMERSION EXPERIENCE

Target:

```text
寄り道
DETOURS

EXPLORE JAPAN

[ café image ]

喫茶店で
At a café

Irodori
Listening · 3 min
Comfortable

[ Listen ]


[ bookstore image ]

本と図書館
Books & libraries

Hirogaru
Video

[ Explore ]


[ walking image ]

町を歩く
Walking around town

Japanese with Shun
Video · 11 min

[ Watch ]
```

---

# J56. VISUAL ASSET AUDIT

Before implementation, audit:

```text
current Journey images

existing decorative assets

existing image pipeline

public/

remote image configuration

Next/Image setup

external thumbnails

current background patterns

Study Portrait assets
```

Report what can be reused.

Do not unnecessarily regenerate everything.

---

# J57. CREATE A JOURNEY VISUAL MANIFEST

Centralize route visuals.

Example concept:

```typescript
{
  areaId: "station",
  title: "駅前",
  subtitle: "At the station",
  image: "...",
  imageSource: "...",
  attribution: "...",
  environment: "station",
  season: "...",
  lessonIds: [...]
}
```

Do not hardcode background URLs across ten React files.

---

# J58. RESPONSIVE CROPPING

Journey imagery must be composed for:

```text
desktop landscape

tablet

mobile portrait
```

Important visual subjects must not disappear because `object-cover` crops badly.

Use position metadata where necessary.

---

# J59. VISUAL CONSISTENCY

Do not combine:

```text
photo-real street photography

flat anime illustration

watercolor

cyberpunk renders

3D game art
```

randomly.

Choose one or two compatible visual modes.

Recommended:

```text
real/licensed photography
+
restrained editorial/generated environmental illustration
```

Provider thumbnails remain provider-native.

---

# J60. COLOR SYSTEM MAY RESPOND SUBTLY TO ENVIRONMENT

Do not abandon the main Kizashi palette.

But route environments can introduce restrained accent variations.

Examples:

```text
station
cool steel blue

shopping street
warm amber

park
muted green

evening café
warm brown/red

rain
blue-grey
```

Vermilion/gold remain brand anchors.

Do not create a new theme per lesson.

---

# J61. AUDIO ATMOSPHERE — OPTIONAL, LOW PRIORITY

Do NOT automatically autoplay ambient sound.

If eventually added, environmental ambience must be:

```text
off by default

optional

quiet

separately controllable
```

This is NOT part of the required milestone.

Do not spend implementation time here before core UX is complete.

---

# J62. THE WORLD SHOULD REFLECT MASTERY, NOT JUST COMPLETION

If possible:

```text
completed
```

and:

```text
held/mastered
```

should look different.

Example:

```text
visited area
→ route opened

strong area
→ route visually settled/bright

weak area
→ subtle marker suggesting return
```

Do not make weak areas look like failure.

---

# J63. RETURN TRIPS

Mistake repair can use the journey metaphor:

```text
戻る
RETURN TRIP

Station
You have a few time-expression mistakes to repair.

[ Revisit · 3 min ]
```

This is optional copy/UI framing.

Underlying repair logic remains the same.

---

# J64. TODAY'S SESSION IS A SHORT JOURNEY

Use transitions such as:

```text
復習
Review what you carry

↓

新しい道
Learn something new

↓

実際に聞く
Hear it in Japan

↓

読む
Read the world

↓

到着
Done
```

Keep this subtle.

Do not slow study with unnecessary interstitial screens.

---

# J65. DO NOT LOSE USABILITY TO THE METAPHOR

The travel metaphor must improve orientation.

It must NEVER make simple actions harder to find.

Always prioritize:

```text
clear CTA

clear progress

clear navigation

clear content
```

over thematic cleverness.

---

# J66. DO NOT DO

Do NOT:

```text
turn Journey into a generic dashboard again

treat Japan imagery as decorative wallpaper only

use random tourist photos

use unlicensed images

hotlink arbitrary photography

put Mount Fuji on everything

put sakura on everything

use anime characters as navigation

create fake real-world geography

make the route visually confusing

require Immersion detours

use huge images that destroy mobile performance

put text inside inaccessible images

create a different visual style for every lesson

make actual learning screens visually noisy

autoplay ambience

turn Kizashi into a tourism app

turn Kizashi into a childish RPG
```

---

# J67. IMPLEMENTATION PRIORITY

Implement this addendum approximately in this order:

## 1

Audit current Journey visual implementation.

## 2

Define Journey areas/environment model.

## 3

Create visual asset manifest.

## 4

Redesign Journey map around environments/places.

## 5

Add environmental Today hero.

## 6

Add lesson-opening environment.

## 7

Add area-completion transitions.

## 8

Create strong N5 → N4 visual transition.

## 9

Integrate imagery into Immersion discovery feed.

## 10

Add optional Detour framing for Immersion.

## 11

Tie Progress to places/areas where useful.

## 12

Tie Study Portrait to journey progression.

## 13

Improve original reading/signage visual assets.

## 14

Mobile/performance/accessibility audit.

Do NOT delay core UX work merely to perfect imagery.

---

# J68. FINAL REPORT

At completion report:

```text
Journey areas implemented

lessons mapped to each area

N5 route structure

N4 route structure

visual assets used

image sources/licenses

generated assets if any

Today visual integration

lesson-opening integration

area completion integration

Immersion image integration

Detour support

N5 → N4 transition

mobile image behavior

performance impact
```

Also include screenshots or a concise description of each major learner flow if the repository workflow supports screenshots.

---

# J69. DEFINITION OF DONE

This addendum is complete when:

* Kizashi visibly feels like a path through Japan;
* Journey is spatial/environmental rather than primarily a course list;
* N5 feels like learning to navigate a familiar Japanese town;
* N4 visibly expands the learner's world;
* the N5 → N4 transition feels like a meaningful journey milestone;
* major curriculum areas correspond to coherent Japanese environments where pedagogically appropriate;
* Today establishes a place/context;
* lesson openings establish situational context;
* area completion visibly advances the route;
* Journey uses real visual landmarks/environment imagery;
* imagery is sourced responsibly;
* imagery does not devolve into tourist stereotypes;
* ordinary Japanese environments dominate over cliché imagery;
* Japanese typography is used as part of the environmental design;
* train/route/station motifs reinforce navigation subtly;
* Immersion feels like exploring Japanese experiences rather than browsing providers;
* optional Immersion can be framed as detours;
* original reading information-retrieval tasks look plausibly real;
* visuals remain performant on mobile;
* learning screens remain focused;
* the travel metaphor never obscures usability.

The final emotional/product test is:

```text
When I open Kizashi,
does it feel like I am somewhere?

When I complete a lesson,
does it feel like I moved forward?

When I become better at Japanese,
does more of the world seem to open?

Does the Japanese I learn feel connected
to places where I would actually encounter it?

Does Immersion feel like leaving the textbook
and wandering into Japan for a while?

If all the labels and progress bars disappeared,
would the product still visibly communicate:

"You are on a path through Japan"?
```

If the answer to the last question is no, the visual identity is still too generic.
