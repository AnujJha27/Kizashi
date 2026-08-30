# PRD — Personal Japanese Learning Platform

## 1. Product Overview

### Working name

**Kizashi**.

“Kizashi” suggests a sign of what is beginning to emerge, which fits the product philosophy: the app should visually and structurally make steady progress feel visible rather than like navigating a collection of disconnected study tools.

### Product type

Single-user Japanese learning web application.

### Primary user

One authenticated user only.

### Core goal

Create an engaging, visually polished Japanese learning environment that provides:

* A clear learning path
* Daily study sessions
* Vocabulary learning
* Grammar learning
* Kanji learning
* Sentence practice
* Reading practice
* Listening practice
* Spaced repetition
* Progress tracking
* Lightweight gamification
* Personal notes
* Content tied to Genki/JLPT progression

The application should feel closer to a **beautiful personal learning RPG/dashboard** than a conventional educational SaaS product.

---

# 2. Product Philosophy

The app should follow five principles.

## 2.1 One obvious next action

At any point the user should know:

> “What should I study next?”

The homepage should therefore not primarily be a dashboard full of statistics.

It should lead with:

**Continue Your Journey**

followed by the next recommended learning activity.

---

## 2.2 Progress should feel spatial

Progress should be represented as a path.

Example:

```text
Hiragana
   ↓
Katakana
   ↓
Genki I
   ├── Lesson 1
   ├── Lesson 2
   ├── Lesson 3
   └── ...
   ↓
JLPT N5
   ↓
Genki II
   ↓
JLPT N4
```

Each lesson is represented as a node on a visual journey map.

Nodes visually transition between:

* Locked
* Available
* In progress
* Learned
* Mastered

---

## 2.3 Active recall over passive reading

Almost every concept should eventually produce a task.

Examples:

Grammar:

> これは本です。

Prompt:

> Why is は used here instead of が?

Vocabulary:

> 食べる

Prompt:

> Type the English meaning.

Kanji:

> 日

Prompt:

> Give one reading.

Sentence construction:

> I eat sushi every Friday.

User constructs:

> 毎週金曜日に寿司を食べます。

---

## 2.4 The app should understand weakness

The learning engine should track performance by:

* vocabulary item
* kanji
* grammar point
* lesson
* question type
* JLPT category

Weak material should naturally reappear.

The system should therefore distinguish:

**Completed**

from

**Actually learned**

---

## 2.5 The UI should make studying pleasurable

Avoid:

* sterile LMS design
* enterprise dashboards
* giant tables
* generic Bootstrap cards
* childish Duolingo visuals
* excessive anime clichés
* neon cyberpunk Japanese stereotypes

Aim instead for:

**Japanese editorial minimalism + game progression + modern product UI.**

---

# 3. Visual Direction

## Overall aesthetic

Dark-first interface.

Visual references:

* Japanese book/editorial design
* Persona UI restraint
* Linear
* Arc Browser
* Raycast
* modern RPG progression systems
* high-end language-learning apps
* subtle traditional Japanese visual motifs

Not literal copies.

---

# 4. Visual Language

## Base palette

Background:

```text
#0B0B0D
#111216
```

Surface:

```text
#17181D
#1E2026
```

Primary accent:

Japanese vermilion / torii red

```text
#E34A3F
```

Secondary accent:

Warm gold

```text
#E5B85C
```

Success:

```text
#6FB98F
```

Muted text:

```text
#8F949E
```

Primary text:

```text
#F5F5F2
```

Do not overuse the red.

---

# 5. Typography

Japanese text should be visually prominent.

Recommended pairing:

English/UI:

* Geist
* Inter
* Manrope

Japanese:

* Noto Sans JP
* Noto Serif JP where appropriate

Large Japanese characters can occasionally use serif typography for visual personality.

Example lesson header:

```text
旅はここから始まる

Lesson 4
Daily Life
```

---

# 6. Authentication

Because this is a private single-user app, avoid building a full consumer authentication system.

## Requirements

Use Supabase Auth.

Preferred login:

**Magic Link / OTP**

No signup interface.

No public registration.

### Allowed-user model

Environment variable:

```text
ALLOWED_EMAIL=<personal-email>
```

After authentication:

```typescript
if (session.user.email !== process.env.ALLOWED_EMAIL) {
   signOut()
   redirect("/unauthorized")
}
```

Also enforce equivalent authorization server-side.

Do not rely solely on UI hiding.

---

# 7. Main Navigation

Desktop navigation:

```text
Journey
Learn
Review
Library
Progress
Profile
```

Mobile:

bottom navigation with 4 primary items:

```text
Journey
Learn
Review
Library
```

Profile accessible through avatar.

---

# 8. Home / Journey Page

This is the heart of the product.

It should not look like a conventional dashboard.

The page should resemble a **learning journey map**.

## Hero

Example:

```text
こんばんは、Anuj。

Ready for today's Japanese?
```

Below:

```text
DAY 18

12 min remaining
🔥 7 day rhythm
```

Primary button:

**Continue Journey**

---

# 9. Journey Map

Vertical or gently winding map.

Example:

```text
○ Hiragana
│
● Katakana
│
◆ Genki I
│
● Lesson 1
│
● Lesson 2
│
◉ Lesson 3 ← current
│
○ Lesson 4
│
🔒 Lesson 5
```

The map can contain themed regions.

Example:

### Region 1

**はじめまして**

Basics

### Region 2

**町へ行こう**

Daily life

### Region 3

**日本の生活**

Intermediate beginner

Each region has a subtle visual scene.

Not full illustrations.

Use things like:

* mountain silhouettes
* torii outlines
* clouds
* lantern light
* train lines
* city silhouettes

---

# 10. Lesson Structure

Each lesson follows a predictable loop.

```text
INTRO
↓
VOCAB
↓
GRAMMAR
↓
KANJI
↓
PRACTICE
↓
READING
↓
CHECKPOINT
```

Not every lesson needs every module.

---

# 11. Lesson Intro

Show:

```text
GENKI I — LESSON 4

Daily Activities

You will learn:

• telling time
• describing routines
• past tense
• common daily verbs
```

Estimated time:

```text
35 min
```

Allow:

**Start lesson**

or individual module selection.

---

# 12. Vocabulary Module

Each word stores:

```typescript
{
 japanese: string
 kana: string
 romaji?: string
 meaning: string
 partOfSpeech: string
 lessonId: string
 jlptLevel?: string
 tags: string[]
 exampleSentences: []
}
```

Example card:

```text
食べる

たべる

to eat

Verb
```

Reveal example:

```text
毎朝パンを食べます。
I eat bread every morning.
```

---

# 13. Vocabulary Practice Types

Rotate between:

### Recognition

```text
食べる

What does this mean?

A. drink
B. eat
C. sleep
D. buy
```

### Recall

```text
to eat

Japanese:
[____________]
```

### Kana recall

```text
食べる

Reading:
[____________]
```

### Sentence context

```text
毎朝パンを ___ 。

食べます
飲みます
行きます
見ます
```

### Audio recognition

Play:

```text
たべる
```

Ask user to identify meaning.

---

# 14. Grammar Module

Each grammar concept should have a dedicated page.

Structure:

## Pattern

```text
A は B です
```

## Meaning

“A is B.”

## Intuition

Explain what the grammar is doing conceptually.

## Examples

```text
私は学生です。
I am a student.
```

## Contrast

```text
は vs が
```

## Common mistake

```text
❌ 私が学生です
```

when introducing oneself in ordinary neutral context.

## Practice

Generate targeted questions.

---

# 15. Grammar Visualization

Where useful, visually decompose sentences.

Example:

```text
私は    日本語を    勉強します
────   ────────    ─────────
topic   object       verb
```

Clicking parts should reveal explanations.

---

# 16. Kanji Module

Kanji card:

```text
日

Meaning
sun / day

On:
ニチ
ジツ

Kun:
ひ
か
```

Associated words:

```text
日本
毎日
日曜日
```

---

# 17. Kanji Learning UX

Each kanji has:

* meaning
* readings
* radicals
* components
* vocabulary
* mnemonics
* stroke order
* learned strength

Optional later feature:

canvas-based handwriting practice.

---

# 18. Review System

The app uses spaced repetition.

Do not expose complex SRS internals unnecessarily.

Review page:

```text
REVIEWS DUE

Vocabulary     14
Kanji           6
Grammar         4

Total          24
```

Primary CTA:

**Start Review**

---

# 19. SRS Model

Start with FSRS if practical.

Otherwise implement simplified SM-2.

Each review item stores:

```typescript
{
 itemId
 itemType

 stability
 difficulty

 dueAt
 lastReviewedAt

 correctCount
 incorrectCount

 reviewCount
}
```

Response choices:

```text
Again
Hard
Good
Easy
```

Keyboard shortcuts:

```text
1 2 3 4
```

---

# 20. Daily Study Session

The app automatically creates a suggested daily session.

Example:

```text
TODAY'S JOURNEY

5 vocabulary reviews
3 kanji reviews
1 grammar review

Learn:
Lesson 6 vocabulary

Practice:
2 sentence exercises

~18 minutes
```

User can choose:

```text
Quick — 5 min
Normal — 15 min
Deep — 30 min
```

The content adapts accordingly.

---

# 21. Learn Page

Alternative structured view for directly accessing content.

Sections:

```text
Vocabulary
Grammar
Kanji
Lessons
JLPT
```

Filters:

```text
Genki I
Genki II
N5
N4
Learned
Weak
New
```

---

# 22. Library

The Library is the personal Japanese reference system.

Contains:

* vocabulary
* kanji
* grammar
* example sentences
* saved readings
* notes

Global search should understand Japanese.

Example:

Search:

```text
食
```

Results:

```text
食べる
食堂
食事

Kanji:
食
```

---

# 23. Reading Mode

Create small graded Japanese passages.

Example:

```text
昨日、友達とレストランに行きました。
```

Unknown words can be clicked.

Popover:

```text
昨日
きのう

yesterday
```

Important:

Do not immediately show furigana everywhere.

Support toggle:

```text
Furigana OFF / Hover / ON
```

Default:

**Hover**

---

# 24. Sentence Mining

Any example sentence can be saved.

Saved sentences enter a personal sentence bank.

Possible actions:

```text
Save
Add note
Add to review
Mark useful
```

---

# 25. Personal Notes

Every:

* vocabulary item
* grammar point
* kanji
* lesson

supports private notes.

Example:

```text
I always confuse で and に here.
```

Notes are searchable.

---

# 26. Mistake Notebook

Automatically maintain a page called:

**Mistakes**

Store repeated failures.

Example:

```text
Particle confusion
に vs で

Mistakes: 7
Last mistake: today
```

Clicking opens examples and targeted drills.

This should become one of the most useful parts of the app.

---

# 27. Progress Page

Avoid meaningless vanity metrics.

Useful metrics:

### Vocabulary

```text
Known      312
Learning    84
Weak        21
```

### Kanji

```text
Recognized 98
Strong     61
```

### Grammar

```text
Mastered 26 / 55
```

### JLPT N5 readiness

```text
Vocabulary  ███████░░
Grammar     ██████░░░
Kanji       ████████░
Reading     █████░░░░
```

Do not claim that this predicts actual exam score.

Label it:

**Coverage estimate**

---

# 28. Knowledge Map

Optional high-value feature.

Show relationships:

```text
食べる
   ↓
食
   ↓
食事

ます form
   ↓
食べます
   ↓
ました
   ↓
食べました
```

This graph should help concepts feel connected.

---

# 29. Gamification

Use restrained gamification.

Good:

* journey progress
* levels
* XP
* streak/rhythm
* mastery animations
* achievements
* milestones

Avoid:

* fake currencies
* aggressive streak guilt
* endless loot systems
* childish mascots

---

# 30. XP System

Example:

```text
Review correct       +2 XP
Learn new word       +5 XP
Grammar mastery     +15 XP
Complete lesson     +50 XP
Reading session     +25 XP
```

XP contributes to levels.

Example:

```text
Level 7

言葉の旅人
Kotoba Traveler
```

---

# 31. Achievements

Examples:

```text
はじめの一歩
Learn your first 50 words

漢字見習い
Learn 25 kanji

七日間
Study seven days

本の虫
Complete 10 readings

復習の鬼
Complete 500 reviews
```

Achievements should have elegant badges.

---

# 32. Rhythm Instead of Punishing Streak

Track both:

```text
Current rhythm
7 days

Best rhythm
18 days
```

Missing one day should not visually destroy everything.

A calendar heatmap can show consistency.

---

# 33. Profile Page

Profile should feel like a game character screen.

Example:

```text
ANUJ

LEVEL 8

日本語の旅人

JLPT Path
N5 → N4

Vocabulary
398

Kanji
102

Grammar
31

Study time
41h
```

Include achievement grid.

---

# 34. Visual Portrait Feature

Create an optional evolving visual scene representing progress.

Example:

At beginning:

minimal path toward Mt. Fuji silhouette.

As progress increases:

* lanterns appear
* town fills out
* trains move
* torii gates appear
* seasons subtly evolve

This should be decorative and generated from deterministic progress state.

Do not make it depend on external AI generation.

---

# 35. Content Organization

Hierarchy:

```text
Course
 └── Chapter
      └── Lesson
           ├── Vocabulary
           ├── Grammar
           ├── Kanji
           ├── Exercises
           └── Readings
```

Example:

```text
Genki I
 └── Lesson 4
      ├── Vocabulary
      ├── Past tense
      ├── も
      ├── 〜時間
      └── Practice
```

---

# 36. Content Source Philosophy

Do not hard-code the application around Genki.

Use generic structures so content can later include:

```text
Genki I
Genki II
JLPT N5
JLPT N4
Tae Kim
Custom
Immersion vocabulary
```

User-generated content should also be supported.

---

# 37. Database Schema

Supabase PostgreSQL.

Core tables:

```text
profiles

courses
chapters
lessons

vocabulary
grammar_points
kanji

sentences
readings

lesson_vocabulary
lesson_grammar
lesson_kanji

user_item_progress

reviews
review_history

mistakes

notes

achievements
user_achievements

study_sessions

study_events
```

---

# 38. user_item_progress

Generic progress table.

```typescript
{
 id

 user_id

 item_type:
   "vocabulary"
   | "grammar"
   | "kanji"
   | "lesson"
   | "reading"

 item_id

 status:
   "new"
   | "learning"
   | "learned"
   | "mastered"

 mastery_score

 first_seen_at
 last_seen_at
}
```

---

# 39. Study Event Tracking

Record meaningful actions.

```typescript
{
 user_id

 event_type

 item_type
 item_id

 correct?: boolean

 duration_ms?: number

 created_at
}
```

Allows analytics without premature complexity.

---

# 40. Recommendation Engine

Daily recommendation priority:

```text
1. overdue reviews
2. weak concepts
3. active lesson
4. next lesson
5. reading practice
```

Pseudo logic:

```typescript
recommendedItems = [
  ...overdueReviews,
  ...weakItems,
  ...currentLessonItems,
  ...nextLessonItems
]
```

Cap based on desired study duration.

---

# 41. Session Flow

Example 15-minute session:

```text
START
  ↓
5 vocab reviews
  ↓
2 kanji reviews
  ↓
1 grammar question
  ↓
Learn 4 words
  ↓
Sentence exercise
  ↓
SESSION COMPLETE
```

End screen:

```text
Session Complete

12 min

+64 XP

8 reviews
4 new words
1 grammar point strengthened
```

Avoid noisy confetti everywhere.

A subtle visual transition is enough.

---

# 42. Command Palette

Desktop shortcut:

```text
CMD + K
```

Actions:

```text
Study now
Search vocabulary
Search grammar
Add word
Add sentence
Start review
Open mistakes
Go to lesson
```

This makes the application feel fast and personal.

---

# 43. Quick Add

Global shortcut:

```text
A
```

Opens:

```text
Add Japanese
```

Input:

```text
言葉
```

Possible fields:

```text
reading
meaning
sentence
source
tags
```

Uencountered elsewhere.

---

# 44. Dashboard Intelligence

Instead of generic stats, surface insights.

Examples:

```text
You keep missing:
に vs で
```

```text
食べる is due again today.
```

```text
Your N5 verbs are significantly stronger than adjectives.
```

```text
You haven't practiced reading in 6 days.
```

---

# 45. AI Features — Later

Do not make AI critical to the core app.

Optional future features:

### Explain sentence

User pastes Japanese:

```text
昨日友達と映画を見に行きました。
```

AI provides:

* segmentation
* grammar
* vocabulary
* literal translation
* natural translation

### Generate drills

Based on weak concepts.

### Conversation mode

Roleplay:

```text
Convenience store
Restaurant
Train station
University
```

### Writing correction

User writes Japanese.

AI highlights mistakes and explains corrections.

All AI features should be modular.

---

# 46. Tech Stack

Recommended:

### Frontend

```text
Next.js
React
TypeScript
```

### Styling

```text
Tailwind CSS
```

### Components

```text
shadcn/ui
Radix primitives
```

Use shadcn as a foundation, not as the finished visual design.

### Animation

```text
Motion / Framer Motion
```

### Backend

```text
Supabase
```

Use:

* PostgreSQL
* Auth
* Row Level Security
* Storage if needed

### Validation

```text
Zod
```

### Forms

```text
React Hook Form
```

### Charts

```text
Recharts
```

Only for genuinely useful analytics.

---

# 47. Architecture

Recommended structure:

```text
app/

  (auth)/
    login/

  (main)/
    journey/
    learn/
    review/
    library/
    progress/
    profile/

  lesson/[lessonId]/

  vocabulary/[id]/
  grammar/[id]/
  kanji/[id]/
  reading/[id]/

components/

  journey/
  lesson/
  study/
  review/
  library/
  progress/
  ui/

lib/

  auth/
  srs/
  recommendations/
  progress/
  supabase/

data/

types/
```

---

# 48. Security

Even though this is a personal application, implement security correctly.

Use Supabase RLS.

All personal tables require:

```sql
auth.uid() = user_id
```

Content tables can be globally readable by authenticated users.

No client-side service-role keys.

---

# 49. Responsive Behavior

Desktop should provide the richest experience.

Tablet should remain fully functional.

Mobile should emphasize:

```text
Daily session
Reviews
Quick learning
Library lookup
```

Journey visualization may simplify on mobile.

---

# 50. Interaction Design

Use motion sparingly.

Good:

* map node activation
* card reveals
* XP increase
* lesson completion
* smooth route transitions
* hover pronunciation
* progress transitions

Avoid:

* constant floating objects
* excessive parallax
* animated gradients
* slow page entrances
* transitions longer than ~300 ms for routine interactions

The app should feel **fast first, beautiful second**.

---

# 51. Empty States

Empty states should feel intentional.

Example:

Mistakes page:

```text
Nothing troublesome yet.

Your recurring mistakes will appear here as you study.
```

Notes:

```text
No notes yet.

Add explanations that make Japanese click for you.
```

---

# 52. Core Screens for MVP

Build these first:

1. Login
2. Journey
3. Lesson page
4. Vocabulary learning
5. Grammar learning
6. Kanji learning
7. Review session
8. Library
9. Progress
10. Profile

---

# 53. Phase 1 — Foundation

Implement:

* Supabase
* single-user authentication
* database schema
* app shell
* navigation
* design system
* journey map
* course/lesson structures

Use seeded demo content.

---

# 54. Phase 2 — Learning Engine

Implement:

* vocabulary cards
* grammar pages
* kanji cards
* quizzes
* answer evaluation
* progress tracking
* review queues
* SRS

---

# 55. Phase 3 — Daily Learning

Implement:

* daily study recommendations
* session builder
* session completion
* XP
* levels
* rhythm tracking

---

# 56. Phase 4 — Knowledge System

Implement:

* library
* search
* notes
* saved sentences
* mistake notebook
* weak-concept detection

---

# 57. Phase 5 — Advanced Learning

Implement:

* readings
* audio
* listening exercises
* handwriting
* knowledge graph
* custom content import

---

# 58. Phase 6 — AI Layer

Optional:

* grammar explanations
* drill generation
* writing correction
* conversational Japanese
* sentence analysis

Do this only after the deterministic learning system works properly.

---

# 59. First Seed Content

The initial database should include representative demo content from early beginner Japanese.

Do NOT copy copyrighted textbook exercises or passages.

Create original examples corresponding approximately to:

```text
Hiragana
Katakana

Greetings
X は Y です
Questions
Particles
Numbers
Time
Daily activities
Present/past verbs
Adjectives
Existence
Locations
```

This is enough to develop the product before importing full study material.

---

# 60. UX Requirement: No Dead Pages

Every major page should offer an obvious meaningful action.

Examples:

Journey:

```text
Continue lesson
```

Vocabulary:

```text
Practice weak words
```

Grammar:

```text
Review weak grammar
```

Kanji:

```text
Practice today's kanji
```

Progress:

```text
Strengthen weakest area
```

---

# 61. Home Page Example

Desktop structure:

```text
┌──────────────────────────────────────────────┐
│ KIZASHI                                ◉ AJ │
├─────────────┬────────────────────────────────┤
│ Journey     │                                │
│ Learn       │  こんばんは。                  │
│ Review      │                                │
│ Library     │  Continue your journey         │
│ Progress    │                                │
│             │  Genki I · Lesson 4            │
│             │  ███████████░░ 72%             │
│             │                                │
│             │  [ Continue → ]                 │
│             │                                │
│             │  ───── Journey ─────            │
│             │                                │
│             │        ● Lesson 2              │
│             │        │                       │
│             │        ● Lesson 3              │
│             │       ╱                        │
│             │     ◉ Lesson 4                 │
│             │       ╲                        │
│             │        ○ Lesson 5              │
│             │                                │
└─────────────┴────────────────────────────────┘
```

---

# 62. Review Screen Example

```text
REVIEW

12 / 24

        食べる

        たべる

Meaning?

[________________]

          Check

────────────────────

Again   Hard   Good   Easy
  1       2      3      4
```

The screen should be extremely distraction-free.

---

# 63. Product Personality

The application should communicate calmly.

Avoid:

```text
AMAZING!!!
YOU'RE ON FIRE 🔥🔥🔥
```

Prefer:

```text
Nice work.

食べる is getting stronger.
```

or:

```text
Lesson complete.

You learned 11 new words.
```

Occasional Japanese phrases are welcome.

---

# 64. Performance Requirements

Target:

* instant-feeling navigation
* optimistic UI where safe
* minimal loading screens
* skeleton states where needed
* lazy-load large visualization modules
* cache static learning content

Avoid unnecessary server round-trips.

---

# 65. Accessibility

Must support:

* keyboard study sessions
* visible focus states
* WCAG-conscious contrast
* reduced-motion mode
* screen-reader labels
* scalable Japanese typography

---

# 66. Development Rules for Codex

When implementing:

1. Keep features modular.
2. Never tightly couple study UI to specific Genki content.
3. Keep learning content separate from UI logic.
4. Use typed database models.
5. Centralize progress calculation.
6. Centralize SRS logic.
7. Centralize recommendation logic.
8. Avoid giant React components.
9. Avoid unnecessary global state.
10. Prefer server components where appropriate.
11. Use client components only for interaction-heavy sections.
12. Keep authentication checks server-side.
13. Enforce database authorization with RLS.
14. Seed representative development data.
15. Every route needs polished loading/error/empty states.

---

# 67. MVP Definition of Done

The MVP is successful when the user can:

1. Login securely.
2. See their learning journey.
3. Continue the current lesson.
4. Learn vocabulary.
5. Learn grammar.
6. Learn kanji.
7. Answer practice questions.
8. Have progress recorded.
9. Receive spaced-repetition reviews.
10. Complete a daily study session.
11. Search learned material.
12. View meaningful progress.
13. Return the next day and seamlessly continue.

The app should already feel enjoyable at this stage.

---

# 68. North-Star Experience

The ideal recurring experience is:

```text
Open app

↓

See exactly what to do

↓

Study for 10–20 minutes

↓

Feel visible progress

↓

Encounter something difficult

↓

App remembers the weakness

↓

Weakness reappears later

↓

Eventually master it

↓

Journey visibly advances
```

That loop is the core product.

Everything else is secondary.
seful for words


One feature I think could make this actually distinctive is turning the Journey page into a slowly evolving Japanese landscape rather than drawing a literal game map. Your study path runs through it—quiet city → train line → shrine → mountains → denser reading-focused areas—and the environment gains detail as you progress. Subtle enough to remain premium, but now your Japanese progress has a place. That’s much cooler than watching an XP rectangle get 3 pixels longer.
