# ADDENDUM — KANJI STROKE ORDER, WRITING PRACTICE, AND VISUAL KANJI LEARNING

Repository:

`AnujJha27/Kizashi`

This is an ADDENDUM to all existing Kizashi content, UX, Journey, and visual-world milestones.

It does NOT supersede or weaken any previous requirement.

This addendum adds a first-class:

```text
漢字を書く
KANJI WRITING
```

learning layer.

The goal is NOT merely to display stroke-order GIFs.

The goal is:

> make kanji substantially easier to remember by letting the learner see, trace, write, and revisit each character in the correct stroke order.

This should integrate with:

```text
Learn
Library
Practice
Review
Journey lessons
Kanji detail
Mistake repair
mobile study
```

---

# K1. CORE REQUIREMENT

Every canonical N5/N4 kanji should have access to a dedicated stroke-order learning experience where source data is available.

The experience should support:

```text
WATCH

STEP THROUGH

TRACE

WRITE FROM MEMORY

REVEAL

RETRY
```

Do NOT make stroke order merely an external-link feature.

External sites are secondary references.

Kizashi itself should provide the main learning interaction.

---

# K2. PRIMARY STROKE DATA SOURCE — KANJIVG

Use KanjiVG as the preferred structured stroke-order source.

KanjiVG provides:

```text
one SVG per character

ordered stroke paths

stroke numbers

stroke direction/shape information

component/radical grouping
```

This makes it suitable for native Kizashi rendering and animation.

Preserve required:

```text
source
license
attribution
```

metadata.

Do not manually redraw hundreds of kanji.

---

# K3. DO NOT SCRAPE STROKE GIFS WHEN STRUCTURED DATA EXISTS

Prefer:

```text
KanjiVG structured SVG paths
        ↓
native renderer
        ↓
animation / tracing
```

over:

```text
scrape image
↓
display image
```

Structured paths give Kizashi much better control over:

```text
animation

stroke highlighting

stroke numbering

practice

tracing

responsive scaling

dark-mode integration
```

---

# K4. EXTERNAL REFERENCE SOURCES

Also provide optional reference links where useful:

```text
Jisho.org

Tanoshii Japanese
```

Example learner actions:

```text
Open in Jisho ↗

View alternate stroke reference ↗
```

These are supplementary.

Do NOT depend on them for core functionality.

---

# K5. IFRAME POLICY

Iframe embedding may be attempted ONLY when the provider actually permits framing and it works reliably.

Do NOT:

```text
remove frame-security headers

proxy the page solely to bypass framing rules

build the learning experience around a fragile iframe
```

Preferred fallback:

```text
[ Open source ↗ ]
```

rather than broken iframe chrome.

---

# K6. KANJI WRITING ROUTE / SURFACE

Add an appropriate learner-facing surface.

Possible route:

```text
/practice?mode=kanji-writing
```

or:

```text
/kanji/[id]/write
```

Prefer integration into existing Practice/Library architecture rather than inventing unnecessary top-level navigation.

The existing simplified navigation should remain intact.

---

# K7. KANJI DETAIL PAGE

Each kanji detail should gain a writing section.

Example:

```text
日

ひ · ニチ / ジツ
sun · day

4 strokes


[ ▶ Watch ]

[ Trace ]

[ Write ]

[ Words ]
```

Then:

```text
Stroke order

1 → 2 → 3 → 4
```

with the actual visual diagram.

---

# K8. WATCH MODE

Implement animated stroke-order playback.

Required controls:

```text
Play

Pause

Restart

Previous stroke

Next stroke

Show numbers
```

Optional:

```text
0.5×
1×
1.5×
```

The current stroke should be visually emphasized.

Completed strokes should remain visible but quieter.

Upcoming strokes should remain faint or hidden depending on mode.

---

# K9. STROKE ANIMATION

Animate the actual SVG paths.

A suitable technique may use:

```text
stroke-dasharray
stroke-dashoffset
```

or another clean SVG animation mechanism.

Do not generate a video for each kanji.

Respect:

```text
prefers-reduced-motion
```

Reduced-motion mode should show stepwise stroke states without animated drawing.

---

# K10. GRID

Writing surfaces should use a Japanese practice grid.

Support something visually similar to:

```text
┌─────────────┐
│      │      │
│ ─────┼───── │
│      │      │
└─────────────┘
```

Optionally support diagonal guides.

Keep the grid subtle.

Do not let it compete visually with the kanji.

---

# K11. TRACE MODE

Trace mode should show:

```text
faint kanji guide

current stroke guide

starting point cue

stroke number
```

The learner draws each stroke with:

```text
mouse
touch
stylus
```

This must work especially well on phones and tablets.

---

# K12. POINTER INPUT

Use Pointer Events so the same implementation handles:

```text
mouse

finger

stylus
```

Requirements:

```text
large drawing area

prevent accidental page scrolling while actively drawing

clear/reset

undo last stroke

responsive canvas/SVG

high-DPI rendering
```

Do not require a mouse.

---

# K13. TRACE FEEDBACK

Initial grading should be useful but NOT pretend to be handwriting-recognition magic.

For each stroke, evaluate approximately:

```text
correct stroke number/order

start region

end region

direction

rough path overlap / proximity
```

Return forgiving feedback such as:

```text
Good

Right stroke, start a little higher

Try the direction again

This should be stroke 3
```

Do NOT produce fake:

```text
97.34% handwriting accuracy
```

---

# K14. TOLERANCE

This is educational handwriting practice.

Do not reject natural variation aggressively.

Allow reasonable differences in:

```text
curvature

length

position

handwriting style
```

The strongest checks should be:

```text
stroke order

general direction

approximate placement
```

rather than pixel-perfect reproduction.

---

# K15. WRITE MODE

After tracing, offer:

```text
WRITE FROM MEMORY
```

The grid appears mostly blank.

Possible progression:

```text
Level 1
full ghost

Level 2
starting points only

Level 3
stroke numbers only

Level 4
blank grid
```

This can integrate naturally with Kizashi's existing adaptive-scaffolding philosophy.

---

# K16. REVEAL FLOW

For memory writing:

```text
Write
↓
Compare
↓
Reveal canonical form
↓
Overlay your strokes
↓
Retry
```

Allow the learner to toggle between:

```text
mine

canonical

overlay
```

where technically practical.

---

# K17. DO NOT REQUIRE AUTOMATIC GRADING

A useful first version may use:

```text
self-check
+
stroke-order validation
```

rather than sophisticated shape scoring.

The implementation should be architected so grading can improve later.

Do NOT postpone the entire feature because perfect handwriting recognition is unavailable.

---

# K18. STROKE-BY-STROKE MODE

Provide a very simple learning mode:

```text
Stroke 1

[ visual ]

Tap Next

Stroke 2

[ visual ]
```

This is useful on very small phones.

---

# K19. NEXT-STROKE QUIZ

Add optional recognition questions such as:

```text
What comes next?
```

Show the partially written character and 3–4 candidate stroke overlays.

This can provide stroke-order learning even when the learner does not want to physically draw.

---

# K20. FIRST-STROKE / COMPONENT QUESTIONS

Where useful, support:

```text
Which part is written first?

Which stroke comes next?

How many strokes?

Which component is on the left?
```

Do not let trivia dominate.

Actual writing remains the primary mode.

---

# K21. COMPONENT-AWARE LEARNING

KanjiVG component metadata may be used to help explain structure.

Example:

```text
休

亻 + 木
person + tree
```

Then show how components correspond to strokes.

This can make complex kanji easier to remember.

Do not invent questionable mnemonic etymologies.

Component structure is not automatically historical etymology.

Keep those concepts separate.

---

# K22. RADICAL / COMPONENT VISUALIZATION

Optionally allow:

```text
[ Show components ]
```

Then subtly differentiate component groups.

Do not make the normal stroke-order animation multicolored/confusing.

Default should remain clean.

---

# K23. USEFUL WORD CONTEXT

Never isolate writing completely from actual Japanese.

Below every kanji, show useful words already in the Kizashi curriculum.

Example:

```text
学

学生
がくせい

学校
がっこう

大学
だいがく
```

Learner actions:

```text
Hear

Review word

Open word

Write kanji
```

---

# K24. WORD WRITING

After individual kanji practice, optionally support writing an actual word.

Example:

```text
学校

Write:
学 → 校
```

or:

```text
友達
```

This is particularly useful after learning each component kanji individually.

Do not require word writing for every review.

---

# K25. PRACTICE IA

Under:

```text
Practice
→ Focus
```

add:

```text
Kanji Writing
漢字を書く
```

alongside existing:

```text
Vocabulary
Kanji
Grammar
Conjugation
Micro skills
...
```

Do not add another primary-nav item.

---

# K26. QUICK KANJI WRITING SESSION

Support short sessions:

```text
2 min

5 min

10 min
```

Select a bounded set based on:

```text
current Journey area

recently learned kanji

weak kanji

due review

frequent mistakes

not-yet-written kanji
```

---

# K27. REVIEW INTEGRATION

Kanji writing should have its own learning signal.

Do NOT overwrite recognition mastery.

Example conceptual dimensions:

```text
recognitionMastery

readingMastery

writingFamiliarity
```

Reuse existing state architecture where possible.

Do not necessarily add exactly these fields if the existing mastery model has a cleaner extension point.

---

# K28. JLPT READINESS

Important:

The JLPT does NOT directly test handwritten kanji production.

Therefore:

```text
writing progress
```

must NOT artificially increase:

```text
JLPT readiness score
```

Writing should improve memory and general Japanese ability, while JLPT readiness continues to come from tested modalities.

---

# K29. WRITING STATES

A lightweight writing progression may be:

```text
not introduced

watched

traced

written with support

written from memory

comfortable
```

Avoid pretending these are scientifically precise mastery states.

---

# K30. JOURNEY INTEGRATION

Kanji writing can appear naturally inside area lessons.

Example:

```text
駅前
Station

New kanji:
駅
時
間

[ Learn strokes ]
```

A short writing step can be included after recognizing the words in context.

Do NOT derail every lesson into a twenty-minute calligraphy session.

---

# K31. TODAY INTEGRATION

Occasionally Today may recommend:

```text
漢字を書く
3 min

Practice 3 recently learned kanji
```

Only when useful.

Do not put writing practice into every daily session.

---

# K32. MISTAKE REPAIR

Examples:

```text
You keep confusing:
土 / 士

[ Compare shapes ]
[ Write both ]
```

or:

```text
You recognize 駅 but haven't written it yet.

[ Trace once ]
```

Use writing as one repair modality.

---

# K33. VISUAL DIFFERENTIATION / CONFUSABLE KANJI

Create comparison activities for visually similar kanji where appropriate.

Examples may include reviewed pairs such as:

```text
土 / 士

未 / 末

人 / 入

日 / 目

右 / 左
```

Do not assume every visually similar pair belongs at the same JLPT level.

Use current curriculum availability.

---

# K34. KANJI NOTEBOOK

Optionally add a personal:

```text
漢字帳
KANJI NOTEBOOK
```

inside Library rather than primary navigation.

Possible filters:

```text
Current Journey area

N5

N4

Writing due

Weak

Recently learned

Not written yet
```

---

# K35. KANJI CARD

A compact Library card may show:

```text
駅

14 strokes

えき

station

Writing:
Traced

[ Write ]
```

Do not clutter the normal card with every reading.

---

# K36. SOURCE REFERENCES

Each stroke-order view should expose a small:

```text
ⓘ Stroke source
```

area.

Example:

```text
KanjiVG
CC BY-SA 3.0

External references:
Jisho
Tanoshii Japanese
```

Keep this secondary.

Do not make provenance dominate learning.

---

# K37. TANOSHII JAPANESE

Tanoshii Japanese may be used as an external stroke-order reference.

For example:

```text
View on Tanoshii Japanese ↗
```

Word-based entries are useful because they can show stroke diagrams for kanji occurring in an actual word.

Do not make Kizashi depend on Tanoshii Japanese page structure for core rendering if KanjiVG data can provide the needed stroke order directly.

---

# K38. JISHO

Add:

```text
Open in Jisho ↗
```

on kanji detail where useful.

Do not make an iframe the primary implementation.

If framing fails due to provider headers, use the external link gracefully.

---

# K39. OFFLINE SUPPORT

Because KanjiVG assets are small SVG/vector data, core stroke-order practice for curriculum kanji should ideally work offline after the relevant assets are cached.

This fits Kizashi's local-first study model.

Do not require loading a third-party dictionary page every time the learner practices a stroke.

---

# K40. ASSET STRATEGY

Do not load the entire KanjiVG corpus into the client bundle if unnecessary.

Possible strategy:

```text
build-time extraction
        ↓
only canonical N5/N4 kanji
        ↓
optimized local stroke dataset
```

or lazy per-character assets.

Choose based on current architecture/performance.

---

# K41. BUILD SCRIPT

Create something equivalent to:

```text
scripts/import_kanjivg.py
```

or a TypeScript build script if more appropriate.

Responsibilities:

```text
fetch/read KanjiVG source

select canonical N5/N4 kanji

validate Unicode mapping

extract ordered stroke paths

retain component metadata where useful

retain source/license metadata

produce deterministic local assets
```

Do not manually paste SVGs into components.

---

# K42. DATA MODEL

Extend kanji data minimally.

Conceptually:

```typescript
strokeOrder?: {
  sourceId: "kanjivg";

  strokeCount: number;

  assetPath?: string;

  strokes?: {
    path: string;
    type?: string;
  }[];

  components?: ...;
}
```

Do not duplicate the entire kanji record.

Reuse existing `strokeCount` or similar fields if already present.

---

# K43. VALIDATION

Validate:

```text
stroke count matches source

all strokes have ordering

asset exists

Unicode character matches record

no empty paths

no duplicate stroke IDs
```

Report discrepancies.

Do not silently discard characters with malformed data.

---

# K44. DARK KIZASHI STYLE

The writing trainer should visually fit the app.

Suggested feel:

```text
dark quiet canvas

warm off-white kanji strokes

subtle practice-grid lines

vermilion current-stroke cue

gold stroke numbers / controls
```

Do not introduce a white classroom worksheet unless the user explicitly chooses a light writing surface.

---

# K45. OPTIONAL PAPER MODE

A learner preference may allow:

```text
Dark ink mode

Paper mode
```

Paper mode can resemble Japanese practice paper.

This is OPTIONAL.

Do not delay core implementation for it.

---

# K46. MOBILE EXPERIENCE

This feature is especially valuable on mobile.

Requirements:

```text
large square writing canvas

thumb-accessible reset / undo

full-width Watch / Trace / Write switch

no tiny stroke controls

drawing does not scroll the page

portrait-friendly
```

Test on narrow viewport.

---

# K47. TABLET / STYLUS

Ensure Pointer Events do not reject stylus input.

If pressure information is available, it may optionally affect visual stroke width.

Do NOT make pressure required for correctness.

---

# K48. NO FAKE CALLIGRAPHY GRADING

Do not claim:

```text
beautiful handwriting

calligraphy grade

native handwriting score
```

The feature teaches:

```text
stroke order
shape familiarity
motor memory
recognition reinforcement
```

It is not a calligraphy judge.

---

# K49. COMPLETION FLOW

Example:

```text
駅

14 strokes

✓ Watched
✓ Traced
✓ Written once

Nice.

Useful words:
駅
駅前
駅員

[ Try again ]
[ Next kanji → ]
```

Keep copy concise.

---

# K50. FIRST RELEASE SCOPE

Do NOT try to perfect the entire system across 630 source kanji immediately.

First release:

```text
all canonical N5 kanji
+
all canonical N4 kanji currently in the reviewed learner inventory
```

Then automatically expand as the canonical coverage audit adds missing N5/N4 kanji.

---

# K51. FIRST IMPLEMENTATION TEST SET

Before scaling, implement and verify a representative set:

```text
一

日

人

学

本

友

駅

語

時

間
```

Include:

```text
very simple
medium
many-stroke
multi-component
```

characters.

Once the interaction works well, expand deterministically.

---

# K52. TESTS

Add tests for:

```text
Unicode → KanjiVG asset lookup

stroke ordering

stroke count

next/previous stroke

animation reset

trace state

write state

review state

external reference URL generation

missing asset fallback

N5/N4 filtering
```

---

# K53. DRAWING INPUT TESTS

Test:

```text
pointer down

pointer move

pointer up

undo

clear

next stroke

incorrect order

correct order
```

Where browser-level drawing tests are impractical, isolate geometry/state logic into testable pure functions.

---

# K54. FALLBACK

If a kanji has no local stroke data:

show:

```text
Stroke-order data unavailable

[ Open Tanoshii Japanese ↗ ]

[ Open Jisho ↗ ]
```

Do NOT show a fabricated stroke sequence.

---

# K55. CONTENT STUDIO

Add kanji-writing audit information.

Show:

```text
canonical kanji

with stroke data

without stroke data

stroke-count mismatch

writing practice enabled
```

by:

```text
N5
N4
```

---

# K56. FINAL REPORT

Report:

```text
KanjiVG version/source used

license metadata

N5 kanji with stroke order

N4 kanji with stroke order

missing characters

Watch mode

Trace mode

Memory-write mode

stroke-order validation

mobile behavior

offline behavior

Jisho integration

Tanoshii Japanese integration

tests
```

---

# K57. DEFINITION OF DONE

This addendum is complete when:

* canonical N5/N4 kanji have structured stroke-order data wherever KanjiVG supports them;
* the learner can watch strokes animate;
* the learner can step through strokes manually;
* stroke numbers can be shown;
* the learner can trace the kanji;
* the learner can write from memory;
* touch/mouse/stylus work;
* the learner can clear/undo/retry;
* useful vocabulary remains connected to the kanji;
* writing state is separate from recognition/JLPT mastery;
* Practice exposes Kanji Writing under Focus;
* Library/Kanji detail exposes writing;
* writing can be suggested as a mistake-repair modality;
* Jisho/Tanoshii Japanese exist as optional references rather than fragile dependencies;
* missing stroke data fails gracefully;
* the feature fits Kizashi visually;
* mobile use is genuinely good;
* all relevant tests/builds pass.

The final learner test is:

```text
When I meet a new kanji,
can I understand what it means,
see it in useful words,
watch how it is written,
trace it,
then try writing it myself
without leaving Kizashi?
```

If the answer is no, kanji writing is not complete.

## Current implementation status (2026-09-06)

- [~] Kanji Entry pages now mount a native pointer-event Watch/Trace/Write trainer with Japanese practice-grid guides, visible per-stroke number markers, step controls, reset/undo/clear actions, reduced-motion-safe current-stroke emphasis, forgiving stroke-order feedback, and writing kept separate from JLPT readiness. Kanji and orthography misses now suggest targeted Writing repair with the missed item selected in Practice Focus. The shared source viewer provides a lazy Jisho iframe attempt plus direct Jisho/Tanoshii fallbacks, and the private frame-unlocker allowlists Jisho alongside existing provider frames.
- [~] `lib/kanji-writing-core.js` centralizes pinned KanjiVG `r20260714` code-point URLs, the KanjiVG repository source link, Jisho/Tanoshii reference URLs, Unicode-matching stroke-record validation, and basic order feedback. `scripts/import_kanjivg.py` reads the canonical N5/N4 inventory and deterministically imports ordered KanjiVG paths plus source/license attribution metadata into `data/kanjivg-strokes.json`; Content Studio exposes that exact repository link.
- [~] The checked-in `data/kanjivg-strokes.json` now contains 254 ordered KanjiVG records for the canonical N5/N4 union (125 N5 claims, 166 N4 claims, with 37 characters shared across levels), with source/license metadata and zero missing or unordered paths; the `kanjivg` source is registered in the app and deployable seed manifests. Practice Focus routing reuses the same bounded trainer, local writing-familiarity state is backed up/snapshot-ready with account-sync events, and Content Studio reports the pinned release/license plus N5/N4 local stroke-path, writing-enabled, missing-path, and stroke-count-mismatch coverage. Deployed sync verification and real mobile drawing verification remain open; the trainer still shows a source fallback for characters outside this canonical union.
# PATCH — FIRST-CLASS JISHO EMBED FOR KANJI LEARNING

This PATCH modifies the Jisho-related requirements in:

`ADDENDUM — KANJI STROKE ORDER, WRITING PRACTICE, AND VISUAL KANJI LEARNING`

The application is private and the owner's primary laptop already has a local frame-modifier browser extension used with Kizashi.

Therefore:

> Jisho should be integrated directly into the Kanji learning experience as an embedded reference where the local browser permits framing.

Do NOT restrict Jisho to an external-link-only integration.

---

# JI1. JISHO IS A FIRST-CLASS REFERENCE

For every kanji detail page, provide:

```text
KIZASHI NATIVE LEARNING
├─ meaning
├─ useful words
├─ readings
├─ stroke animation
├─ trace
└─ write

REFERENCE
└─ Jisho
```

Jisho complements Kizashi.

It does not replace the native KanjiVG writing trainer.

---

# JI2. EMBED JISHO

Add an embedded Jisho panel to Kanji detail.

Conceptually:

```text
┌─────────────────────────────────────────────┐
│ 駅                                           │
│ station · えき                              │
│                                             │
│ [Learn] [Write] [Words] [Jisho]             │
├─────────────────────────────────────────────┤
│                                             │
│          embedded Jisho kanji page          │
│                                             │
└─────────────────────────────────────────────┘
```

The `Jisho` tab/panel should lazy-load an iframe only when opened.

Do not load Jisho for every kanji card in the Library.

---

# JI3. USE THE OWNER'S FRAME MODIFIER

The owner's laptop uses the existing Kizashi frame-modifier browser extension to permit selected external sources to render inside frames.

The application should therefore:

```text
attempt normal iframe
        ↓
local extension permits frame
        ↓
Jisho renders normally
```

Do NOT implement a new server proxy solely for Jisho.

Do NOT duplicate the browser-extension functionality in the app.

Use the existing local-browser capability.

---

# JI4. DO NOT ASSUME THE EXTENSION EXISTS EVERYWHERE

The app may later be opened from:

```text
phone
tablet
another browser
another computer
PWA
```

where the frame-modifier extension does not exist.

Therefore Jisho integration must have two states:

```text
EMBED AVAILABLE
→ show Jisho inside Kizashi

EMBED UNAVAILABLE
→ show graceful source card
→ "Open in Jisho ↗"
```

Core kanji learning must work either way.

---

# JI5. JISHO URL RESOLUTION

Create one centralized helper equivalent to:

```typescript
getJishoKanjiUrl(character)
```

Do not manually hardcode Jisho URLs across components.

Verify the currently working Jisho kanji/search URL structure before implementation.

The helper should accept:

```text
駅
学
日
語
```

and resolve the correct Jisho kanji page/search.

Use proper URL encoding.

---

# JI6. REUSABLE EXTERNAL FRAME COMPONENT

If Kizashi already has:

```text
ExternalSourceViewer
ExternalSourceLauncher
```

or equivalent iframe/fallback abstractions, extend/reuse them.

Do NOT build a one-off iframe implementation just for Jisho if the existing source viewer can support it cleanly.

Desired behavior:

```typescript
<ExternalSourceViewer
  source={jishoSource}
  preferredMode="frame"
  fallbackMode="external"
/>
```

Exact API may differ.

Reuse the actual architecture.

---

# JI7. JISHO TAB

Kanji detail should have something approximately like:

```text
OVERVIEW
概要

WORDS
ことば

WRITE
書く

JISHO
辞書
```

The exact labels may fit existing Kizashi IA better.

The Jisho iframe should not dominate the primary learning flow by default.

Native Kizashi content remains the first thing shown.

---

# JI8. JISHO REFERENCE CARD

Before or above the frame, show a tiny Kizashi header:

```text
Jisho.org

External dictionary reference for:
駅

[ Open separately ↗ ]
```

This gives the learner an escape hatch even when the embed works.

Do not bury the original-source link.

---

# JI9. LOADING

When Jisho is selected:

```text
loading
↓
stable frame skeleton
↓
iframe
```

Avoid a giant blank white rectangle appearing abruptly.

Keep the frame dimensions stable.

---

# JI10. DARK MODE

Jisho itself may not match Kizashi's dark UI.

Do NOT attempt fragile DOM injection or CSS rewriting of Jisho content from Kizashi.

Instead place the frame inside an intentional source-reader container.

Example:

```text
┌ Jisho reference ─────────────────────────┐
│                                         │
│     externally rendered source page     │
│                                         │
└─────────────────────────────────────────┘
```

Its different styling is acceptable because it is clearly an external reference.

---

# JI11. FRAME SIZE

Desktop:

```text
large readable panel
approximately 700–900 px high where appropriate
```

Mobile:

prefer either:

```text
full-width embedded view
```

if framing works well,

or:

```text
Open in Jisho ↗
```

if the embedded desktop page is unusable at narrow widths.

Do not force a miserable 300 px wide desktop website into a tiny mobile viewport just because framing technically succeeds.

---

# JI12. LAZY LOADING

Jisho iframe must not load until explicitly requested.

Reason:

```text
Kanji Library
→ potentially hundreds of characters
```

We do not want:

```text
hundreds of Jisho network requests
```

Only load:

```text
current kanji
+
only after learner opens Jisho
```

---

# JI13. FRAME PROGRESS / STATE

Opening Jisho should not count as:

```text
kanji mastered
stroke learned
review completed
JLPT progress
```

It is reference usage only.

You may record lightweight local activity such as:

```text
jishoReferenceOpenedAt
```

only if existing source-progress infrastructure makes this useful.

Do not create another analytics subsystem.

---

# JI14. JISHO + KANJIVG WORK TOGETHER

Preferred learner flow:

```text
駅

Meaning:
station

Useful words:
駅
駅前
駅員

[ Hear ]

────────────

Stroke order
14 strokes

[ Watch ]
[ Trace ]
[ Write ]

────────────

Need more detail?

[ Jisho ]
```

Jisho may provide extra:

```text
readings
words
definitions
stroke reference
search context
```

while Kizashi owns the learning experience.

---

# JI15. JISHO FROM VOCABULARY

Also consider a lightweight Jisho reference action on vocabulary detail.

Example:

```text
病院
びょういん
hospital

⋯
Open in Jisho
```

For vocabulary, an external link may be enough initially.

The FIRST-CLASS EMBED requirement applies primarily to Kanji detail.

Avoid iframe proliferation across the app.

---

# JI16. JISHO FROM KANJI WRITING

Inside the Writing trainer, add a secondary:

```text
Reference
```

action.

Example:

```text
駅 · 14 strokes

[ Watch ] [ Trace ] [ Write ]

ⓘ More reference
[ Jisho ]
[ Tanoshii Japanese ]
```

Selecting Jisho may open the embedded panel without losing current writing state.

Do not reset the learner's canvas merely because they checked a reference.

---

# JI17. TANOSHII JAPANESE

Keep Tanoshii Japanese as a second stroke-order reference.

Preferred hierarchy:

```text
KANJIVG
→ native stroke data / trainer

JISHO
→ embedded general kanji reference

TANOSHII JAPANESE
→ alternate external stroke-order reference
```

If Tanoshii also works through the owner's local frame modifier, the existing external-source component may support embedding it too.

But Jisho gets higher product priority.

---

# JI18. SOURCE REGISTRY

Register Jisho properly in the existing external-source registry if one exists.

Metadata approximately:

```typescript
{
  id: "jisho",
  name: "Jisho.org",
  provider: "Jisho",
  resourceType: "dictionary",
  skills: [
    "kanji-reference",
    "vocabulary-reference"
  ],
  preferredPresentation: "frame",
  fallbackPresentation: "external"
}
```

Adapt this to the actual source model.

Do not create parallel provider metadata.

---

# JI19. COMMAND PALETTE

If the Japanese-aware Cmd-K/search system is being upgraded as planned, a selected kanji may expose:

```text
駅

Open
Write
Practice
Hear
Jisho
```

This would be useful but is lower priority than Kanji detail.

---

# JI20. FAILURE DETECTION

Iframe failure can be difficult to detect perfectly cross-origin.

Use the existing external-frame strategy rather than creating elaborate brittle detection.

Provide an always-visible fallback control:

```text
Not loading?

Open in Jisho ↗
```

Do not leave the learner trapped in an empty frame.

---

# JI21. FRAME MODIFIER IS DEVICE-SPECIFIC

Document this clearly in the implementation notes:

```text
Jisho embedding is enhanced on the owner's configured laptop
through the existing private frame-modifier browser extension.

Other devices may fall back to opening Jisho externally.
```

Do not present the extension as an application requirement.

---

# JI22. SECURITY / PRIVACY BOUNDARY

Keep Jisho isolated as an external iframe.

Do not send:

```text
learner progress
mistake history
Supabase credentials
private notes
account state
```

to Jisho.

Only the requested kanji/search URL should be loaded.

---

# JI23. DO NOT DO

Do NOT:

```text
remove Jisho integration because framing normally fails

replace Jisho entirely with a simple hyperlink on the configured laptop

proxy Jisho through Kizashi unnecessarily

mirror Jisho's database

scrape Jisho's entire site into Supabase

load Jisho for every kanji simultaneously

make Jisho the core stroke-order engine

make the Kanji trainer depend on network access

lose drawing state when opening Jisho

assume the owner's browser extension exists on every device
```

---

# JI24. REQUIRED DESKTOP EXPERIENCE

On the owner's configured laptop:

```text
Library
↓
Kanji
↓
駅
↓
Jisho
↓

Jisho loads directly inside Kizashi
```

without leaving the application.

This is a required learner experience.

---

# JI25. REQUIRED FALLBACK EXPERIENCE

On a device where framing is unavailable:

```text
Jisho reference

This source can't be displayed inside Kizashi here.

[ Open in Jisho ↗ ]
```

No broken-looking surface.

---

# JI26. TESTS

Test:

```text
Jisho URL generation

Jisho tab lazy loading

iframe source changes with kanji

writing state survives Jisho opening/closing

external fallback exists

source registry entry

mobile behavior

frame-disabled behavior

frame-enabled behavior where testable
```

---

# JI27. FINAL REQUIREMENT

Jisho should feel like an integrated dictionary/reference desk inside Kizashi on the owner's configured laptop.

The architecture should be:

```text
KIZASHI
native teaching

KANJIVG
native writing/stroke engine

JISHO
embedded rich reference

TANOSHII JAPANESE
secondary stroke reference
```

Do not force the learner to leave Kizashi for normal kanji lookup when the configured browser is already capable of embedding Jisho.
## Implementation checkpoint · 2026-09-06

Kanji writing now exposes the same provisional encounter review controls as Library and Learn, with the encountered meaning prefilled for correction. The local KanjiVG trainer now covers the 254-character canonical N5/N4 union, while Jisho iframe/fallback remains intact. Kanji misses route directly to the writing repair target and each practice card resets its trainer state. Deployed sync verification and real mobile drawing verification remain open.
