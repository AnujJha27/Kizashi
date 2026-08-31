# ADDENDUM — JLPT Content System + Mobile Learning Experience

> Current implementation status (2026-08-31) is tracked in
> [`HANDOFF.md`](../../HANDOFF.md), [`TODO.md`](../../TODO.md), and the
> [content-source register](./CONTENT-SOURCES.md). This file remains the
> requirements addendum; the current private learner-release and source
> delivery boundaries are documented there.

Extend the existing Japanese-learning product PRD with the following requirements.

The application must not become a beautiful shell with shallow learning content.

Its primary purpose is to be a genuinely useful Japanese-learning system that can support structured preparation for the JLPT while also building practical Japanese ability.

Treat **content quality, curriculum coverage, review quality, and mobile study experience as first-class product requirements**.

---

# 1. Core Learning Goal

The application should support progression through:

```text
Beginner foundations
↓
JLPT N5
↓
JLPT N4
↓
JLPT N3
↓
eventually N2 / N1
```

The architecture must support all levels even if initial seeded content focuses on beginner Japanese and N5/N4.

Do not build the content system specifically around one textbook.

Textbooks may be used as a personal study sequence, but the application's internal curriculum model should be JLPT-aware and generic.

---

# 2. JLPT Curriculum Model

Create a structured curriculum taxonomy.

Each learning item should be classifiable by:

```typescript
{
  jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1" | null

  category:
    | "vocabulary"
    | "kanji"
    | "grammar"
    | "reading"
    | "listening"

  subcategory?: string

  difficulty: number

  prerequisiteIds: string[]

  tags: string[]
}
```

The system should understand prerequisites.

Example:

```text
です
↓
でした
↓
ではありません
↓
ではありませんでした
```

or:

```text
dictionary form
↓
て-form
↓
〜ている
↓
〜てもいい
↓
〜てはいけない
```

This allows the Journey system to follow actual language dependencies instead of an arbitrary list of lessons.

---

# 3. JLPT Skill Areas

The product should explicitly support the real broad skill areas tested by the JLPT:

### Vocabulary

* word meanings
* readings
* contextual usage
* synonyms / nearby meanings where appropriate
* word formation
* common collocations

### Kanji

* recognition
* readings in vocabulary
* meaning
* kanji-to-word mapping
* word-to-kanji recall where useful

### Grammar

* meaning
* formation
* usage conditions
* contrast with similar grammar
* sentence completion
* sentence ordering
* contextual interpretation

### Reading

* short notices
* messages
* simple narratives
* informational passages
* longer passages at higher levels
* locating specific information
* understanding main idea
* understanding implication

### Listening

* short exchanges
* practical situations
* identifying intent
* selecting appropriate responses
* extracting key information
* understanding conversational context

Do not treat JLPT study as vocabulary flashcards plus grammar notes.

---

# 4. Content Quality Requirements

Every grammar point must contain:

```text
1. Core meaning
2. Formation
3. Intuitive explanation
4. Usage conditions
5. Several original example sentences
6. Common mistakes
7. Similar grammar comparison
8. Practice questions
9. Links to prerequisites
10. JLPT level / curriculum metadata
```

Example:

```text
〜ながら

Meaning:
while doing X

Formation:
verb stem + ながら

Example:
音楽を聞きながら勉強します。

Contrast:
〜ながら vs 〜間

Common mistake:
using dictionary form before ながら
```

Explanations should prioritize understanding over linguistic jargon.

---

# 5. Vocabulary Quality

Vocabulary entries should contain more than translations.

Example schema:

```typescript
{
  writtenForm: "決める",
  reading: "きめる",
  meanings: ["to decide"],
  partOfSpeech: "ichidan verb",

  jlptLevel: "N4",

  commonness?: number,

  exampleSentences: [],

  collocations: [],

  relatedWords: [],

  antonyms: [],

  notes?: string,

  audioUrl?: string
}
```

The app should teach words in context.

For example, instead of merely:

```text
予約 = reservation
```

show:

```text
予約する
ホテルを予約する
席を予約する
```

This is substantially more useful for retention.

---

# 6. Kanji Should Be Vocabulary-Driven

Do not teach kanji primarily as isolated lists of readings.

For example, instead of:

```text
生
セイ
ショウ
い
う
なま
```

teach the kanji through useful words:

```text
学生
先生
生活
生まれる
生ビール
```

The individual readings can still be displayed as reference material.

But practice should focus on recognizing readings inside actual vocabulary.

---

# 7. Grammar Contrast System

A major feature should be explicit comparison between confusing grammar.

Examples:

```text
は vs が

に vs で

に vs へ

から vs ので

〜たい vs 〜ほしい

〜ている vs simple present

〜と思う vs 〜そうだ
```

Create a data structure:

```typescript
GrammarContrast {
  id
  grammarPointIds[]
  explanation
  examples[]
  exercises[]
}
```

These comparisons should automatically become more visible when the user repeatedly confuses the relevant concepts.

---

# 8. JLPT Question Modes

Implement question types inspired by JLPT-style reasoning without copying copyrighted exam questions.

All questions must be newly created.

## Vocabulary

### Reading

```text
旅行

A. りょこう
B. りょうこう
C. りょこ
D. りょうこ
```

### Context

```text
駅で電車を ______。

A. 待ちます
B. 作ります
C. 洗います
D. 開けます
```

---

## Grammar

### Sentence completion

```text
日本へ行ったこと ___ あります。

A. を
B. が
C. に
D. で
```

### Sentence ordering

Provide chunks:

```text
① 本を
② 昨日
③ 買いました
④ 三冊
```

User arranges the sentence.

---

## Reading

Show a short passage followed by:

* main idea
* detail question
* inference
* reference resolution
* practical information extraction

---

## Listening

Play audio.

Then ask:

```text
男の人は次に何をしますか。
```

Answers should require understanding rather than transcription alone.

---

# 9. JLPT Practice Mode

Create a dedicated:

```text
JLPT Practice
```

area.

Sections:

```text
Quick Drill
Vocabulary
Grammar
Reading
Listening
Mixed Practice
Mock Test
Weak Areas
```

---

# 10. Quick Drill

Designed for short study moments.

User selects:

```text
3 minutes
5 minutes
10 minutes
```

The system builds a compact adaptive drill.

Example five-minute session:

```text
2 vocabulary
1 kanji reading
2 grammar
1 sentence ordering
1 short reading
```

---

# 11. Mock Tests

Eventually support mock JLPT sessions.

Do NOT copy official exams.

Generate original exercises following similar categories and approximate difficulty.

Support:

```text
Mini test
Section test
Full mock test
```

Store:

```typescript
{
  attemptId
  level
  section

  questionsAttempted
  correct
  duration

  categoryBreakdown

  weakTopics[]
}
```

---

# 12. JLPT Readiness Dashboard

Progress should show actual curriculum coverage.

Example:

```text
JLPT N5

Vocabulary
542 / target set
████████░░

Kanji
87 / target set
█████████░

Grammar
61 / 72
████████░░

Reading
Developing

Listening
Needs practice
```

Do not present fake exact probabilities like:

```text
You have a 93% chance of passing.
```

Prefer:

```text
Coverage
Mastery
Recent performance
```

---

# 13. Mastery Model

Completion is not mastery.

Each item should have separate measurements such as:

```typescript
{
  seen: boolean,

  exposureCount: number,

  recallStrength: number,

  recognitionStrength: number,

  contextStrength: number,

  lastReviewedAt,

  mistakeRate,

  masteryState:
    | "unseen"
    | "introduced"
    | "learning"
    | "stable"
    | "strong"
}
```

A word that the user recognizes in multiple choice but cannot recall should not be considered mastered.

---

# 14. Adaptive Practice

Question difficulty should evolve.

For vocabulary:

### Stage 1

Japanese → English multiple choice

### Stage 2

Japanese → English recall

### Stage 3

English → Japanese recall

### Stage 4

Sentence completion

### Stage 5

Reading/listening recognition in natural context

This should happen gradually based on performance.

---

# 15. Mistake Intelligence

The existing Mistake Notebook should be expanded significantly.

Detect patterns such as:

```text
Repeatedly confusing:
に / で

Weak at:
past negative adjective forms

Recognition strong:
食べる

Production weak:
食べる

Kanji reading confusion:
生 → セイ / しょう
```

Generate targeted remediation sessions.

Example:

```text
Fix に vs で
6-minute drill
```

---

# 16. Mobile-First Study Requirement

The application must work extremely well on phones.

Do not merely shrink the desktop interface.

Design a dedicated mobile experience.

Primary mobile use cases:

```text
Walking between classes
Commute
Waiting in line
Short breaks
Bedtime review
Quick vocabulary lookup
```

Most actions should require one thumb.

---

# 17. Mobile Home

Mobile homepage:

```text
こんばんは

12 reviews due

[ Continue Study ]

──────────────

TODAY

Review vocabulary      8
Review grammar         3
New kanji              2

──────────────

5 min quick session
```

The primary CTA should occupy an obvious thumb-friendly region.

---

# 18. Mobile Navigation

Bottom navigation:

```text
Journey
Study
Review
Library
```

Profile/settings accessible from the header.

Avoid desktop sidebars on mobile.

---

# 19. Mobile Study Screen

The study interface should nearly fill the screen.

Example:

```text
──────────────
Review · 8 / 14
──────────────


        食べる

        たべる


What does this mean?


[ Type answer ]


        Check
──────────────
```

No unnecessary navigation or statistics while answering.

---

# 20. Swipe Gestures

Support optional gestures where they improve speed.

Example after revealing an answer:

```text
Swipe left     → Again
Swipe down     → Hard
Swipe up       → Good
Swipe right    → Easy
```

However buttons must remain available.

Do not require gestures for core functionality.

---

# 21. Mobile Review Speed

Review sessions should require minimal taps.

Target:

```text
see question
↓
answer
↓
rate
↓
next card
```

The next item should appear instantly.

Prefetch upcoming content.

---

# 22. Mobile Audio

Audio must be easy to replay.

Large button:

```text
🔊
```

Support:

```text
tap → play once
double tap → slower playback
```

Optional setting:

```text
Auto-play audio
```

---

# 23. Offline / Poor Connection Support

Since mobile study may happen with poor connectivity, architecture should support offline-friendly behavior.

At minimum:

* cache current lesson
* cache due reviews
* cache text content
* cache small audio where practical
* queue progress updates locally
* sync when connection returns

Prefer PWA capabilities.

The site should be installable to the phone home screen.

---

# 24. PWA

Configure:

```text
Web app manifest
icons
theme colors
service worker
offline fallback
```

The installed app should feel close to a native mobile application.

---

# 25. Quick Mobile Actions

Long press or quick actions could include:

```text
Start review
Quick 5 min
Add vocabulary
Search Japanese
```

---

# 26. Japanese Input UX

Do not require perfect typing unnecessarily.

For typed Japanese answers:

* normalize whitespace
* normalize equivalent kana forms where sensible
* allow configurable leniency
* distinguish meaningful errors from input formatting errors

Where multiple correct expressions exist, support alternative valid answers.

---

# 27. Furigana Policy

Avoid furigana dependency.

Support:

```text
Always show
Show on tap
Show for unknown kanji
Hide
```

Recommended default:

```text
Show for unknown kanji
```

As kanji become mastered, furigana should disappear automatically.

This allows reading difficulty to naturally increase.

---

# 28. Reading Experience

Create graded reading material tied to learned concepts.

A passage should have metadata:

```typescript
{
  jlptLevel
  vocabularyIds[]
  grammarIds[]
  kanjiIds[]
  estimatedDifficulty
}
```

Before opening:

```text
You know approximately 91% of the words in this passage.
```

Unknown words can be tapped.

But translations should not automatically cover the screen.

---

# 29. Reading Modes

Support:

```text
Guided
Normal
Challenge
```

### Guided

More furigana and word help.

### Normal

Help on tap.

### Challenge

Minimal assistance.

---

# 30. Listening Curriculum

Listening should not just be text-to-speech flashcards.

Create listening exercises around situations.

Examples:

```text
Ordering food

Train announcements

Making plans

University conversation

Shopping

Phone conversation

Asking directions
```

Questions should target meaning and intent.

---

# 31. Audio Architecture

Keep audio source modular.

Allow entries to reference:

```typescript
{
  audioUrl
  voice
  speed
  sourceType
}
```

The app may later use:

* recorded audio
* generated TTS
* imported audio

without changing the learning schema.

---

# 32. Content Authoring System

Build a private admin/content editor because this is a single-user product.

It should support creating/editing:

```text
Vocabulary
Grammar
Kanji
Lessons
Readings
Listening exercises
Question sets
Grammar comparisons
```

Do not require manually editing SQL.

---

# 33. Import System

Later support structured imports such as:

```text
CSV vocabulary lists
JSON course packages
personal vocabulary
sentence lists
```

Validate all imported content before inserting it.

---

# 34. Content Sources and Copyright

Do not scrape or reproduce copyrighted textbook pages, exercise sets, answer keys, proprietary JLPT prep books, or official JLPT exams.

The application's own learning content should consist of:

* original explanations
* original example sentences
* original exercises
* publicly available factual JLPT metadata where legally usable
* user-authored personal notes/content

The app can follow approximately the same topic sequence as a textbook without copying textbook prose or exercises.

---

# 35. Content Seeding Strategy

Do not seed the database with only ten toy words.

Create a meaningful initial curriculum.

Initial target:

```text
JLPT N5 foundation
```

Include substantial representative content covering:

### Grammar

* copula
* particles
* demonstratives
* adjective forms
* present/past tense
* negatives
* verb classes
* ます form
* dictionary form
* て-form
* existence
* counters
* comparisons
* requests
* permissions/prohibitions
* likes/dislikes
* wants
* basic reasons
* basic conjunctions

### Vocabulary

Organize by practical domains:

```text
people
family
university
numbers
time
days
food
home
transport
places
weather
daily actions
shopping
adjectives
common verbs
```

### Kanji

Prioritize high-frequency beginner kanji and their useful vocabulary.

### Reading

Create multiple short original beginner passages.

### Listening

Seed several simple dialogue structures.

---

# 36. Do Not Fake Content Depth

If full N5 content cannot be implemented correctly in one milestone:

do not generate hundreds of low-quality filler records.

Instead:

1. build the complete content schema,
2. add one high-quality representative module,
3. add reliable content import tools,
4. expand content systematically.

Quality is more important than raw record count.

---

# 37. Content QA

Every seeded learning item should be checked for:

```text
correct Japanese
natural phrasing
correct reading
correct grammar explanation
reasonable JLPT difficulty
unambiguous answer
appropriate distractors
```

Question distractors should be plausible.

Avoid obviously stupid options that make multiple choice useless.

Bad:

```text
犬 means:

A. dog
B. nuclear reactor
C. democracy
D. refrigerator
```

Good distractors should test nearby knowledge.

---

# 38. Session Variety

Daily study should deliberately mix modalities.

Avoid:

```text
30 vocabulary cards
```

Prefer:

```text
6 vocab reviews
3 kanji readings
3 grammar questions
1 sentence ordering
1 short reading
2 listening questions
```

The exact mix should depend on due material and study duration.

---

# 39. Focus Mode

Allow:

```text
Focus on:
Vocabulary
Grammar
Kanji
Reading
Listening
Mistakes
JLPT Mixed
```

Useful when preparing for a particular weakness.

---

# 40. Mobile Micro-Learning

Create micro-session presets:

```text
2 minutes
5 minutes
10 minutes
```

Example 2-minute session:

```text
3 overdue reviews
1 weak grammar question
```

The application should make it worthwhile to open even for two minutes.

---

# 41. Resume Exactly Where You Left Off

On mobile, interruption is normal.

If the app closes halfway through:

```text
Reading 2 / 4
```

returning should restore:

```text
Reading 2 / 4
```

not restart the session.

Persist session state.

---

# 42. Study Queue

The user should be able to save content for later.

Example:

```text
Study later
```

Creates a personal queue.

Useful when encountering:

* interesting vocabulary
* grammar confusion
* difficult kanji
* reading passages

---

# 43. Daily Goal

Allow lightweight configurable goals:

```text
5 min
10 min
20 min
30 min
```

Do not punish the user for missing them.

Show progress such as:

```text
12 / 20 min today
```

---

# 44. Exam Mode vs Learning Mode

Separate two concepts.

## Learning Mode

Optimizes understanding and retention.

Shows:

* explanations
* hints
* furigana
* feedback

## Exam Mode

Optimizes JLPT simulation.

Disables:

* hints
* instant corrections
* dictionary lookup
* explanatory popovers

Feedback appears after finishing the section.

---

# 45. Question Review

After a practice set:

```text
14 / 18 correct
```

Show:

```text
Wrong
Uncertain
Slow
```

Allow reviewing all three.

A correct answer that took unusually long can still indicate weak knowledge.

---

# 46. Confidence Input

Optionally allow:

```text
Guess
Unsure
Confident
```

before revealing an answer.

Use this as another learning signal.

Example:

```text
Correct + Guess
```

should not strengthen mastery as much as:

```text
Correct + Confident
```

---

# 47. Progress Should Drive Content

The application should answer questions like:

```text
What have I not covered?

What have I forgotten?

What am I consistently getting wrong?

Which JLPT area is lagging?

What should I do today?

What can I realistically study in five minutes?
```

If the system cannot answer these, the learning engine is incomplete.

---

# 48. Updated Product Priority

The priority order is:

```text
1. Correct and useful learning content
2. Strong review/adaptive system
3. Excellent mobile experience
4. Clear learning progression
5. Fast interaction
6. Great visual design
7. Gamification
8. AI extras
```

UI polish should enhance studying rather than compensate for shallow content.

---

# 49. Updated Next Implementation Milestone

Before adding major decorative features, implement a vertical slice that proves the learning experience.

Build:

```text
One complete N5 module
```tice
→ make mistakes
→ review
→ improve
→ progress
```

That loop matters more than adding more screens.


containing:

* 20–30 vocabulary items
* 5–8 kanji
* 3–5 grammar concepts
* grammar contrasts
* original example sentences
* adaptive exercises
* one short reading
* one listening exercise structure
* spaced reviews
* mistake tracking
* desktop UX
* mobile UX
* progress tracking

The user should be able to complete this module across several study sessions and feel that the application actually taught the material.

Do not move to broad content expansion until this vertical slice feels excellent.

---

# 50. Codex Implementation Instruction

Inspect the current application and original PRD first.

Do not rewrite working foundations unnecessarily.

Update:

* schema where required
* content types
* learning engine types
* mobile layouts
* responsive behavior
* session architecture
* JLPT metadata
* PWA foundations

Then implement the smallest complete vertical slice that demonstrates:

```text
learn
→ prac
