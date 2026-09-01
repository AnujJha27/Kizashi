> Implementation status (2026-08-31): current behavior is tracked in
> [`HANDOFF.md`](../../HANDOFF.md), [`TODO.md`](../../TODO.md), and the
> [content-source register](./CONTENT-SOURCES.md). The private learner route
> may release non-rejected staged records with `humanReviewed: false`; the
> source-review/SQL publication gate remains explicit.

That concern is valid, because **there is no official modern “JLPT N5 vocabulary/grammar/kanji list” you can simply import**. The JLPT explicitly stopped publishing those content-specification lists after the 2010 revision; instead, it publishes competency descriptions, question formats, sample questions, and official practice workbooks. ([JLPT][1])

So I would not make the app’s content strategy “scrape an N5 list from some random website.” I’d make it a **multi-source curriculum pipeline** with different sources serving different purposes.

The source hierarchy should be:

* **Official JLPT = exam blueprint.** Use the official question categories, timings, competency descriptions, sample questions and practice-workbook structure to determine *what you need to be able to do*. For N5, for example, the official categories include kanji reading, orthography, contextual vocabulary, paraphrases, several grammar formats, short/mid-length reading, information retrieval, and four different listening task types. ([JLPT][2])
* **JMdict = vocabulary truth layer.** Use it for spellings, readings, senses, parts of speech, etc., rather than letting an LLM invent dictionary entries. JMdict is maintained by EDRDG and is designed as a reusable Japanese dictionary dataset. ([JMdict][3])
* **KANJIDIC2 = kanji truth layer.** Use it for kanji readings, meanings and metadata. Its project data is available under CC BY-SA 4.0. ([Erdg][4])
* **Curated JLPT curriculum = what gets taught.** Maintain your own N5/N4 curriculum mapping based on consensus across reputable prep resources rather than pretending one unofficial list is canonical.
* **Original generated content = exercises.** Generate fresh sentences, dialogues, readings, distractors and drills against the curated curriculum, then validate them before serving them.
* **Official JLPT material = calibration/reference only.** The official site provides sample questions and the two official practice workbooks contain questions selected from real post-2010 tests. Those are excellent for checking whether your generated questions actually resemble the exam, but you should not dump copyrighted official questions into your database. ([JLPT][1])

And there's an important strategic point: **you don't need to merely scrape “everything labelled N5.”** Passing comfortably is a different objective from barely matching some word list.

For your app, I'd build a **Pass N5 mode** with a deliberately conservative syllabus. If multiple credible N5 curricula disagree about whether a common word or grammar point is N5/N4, bias toward learning it. Being slightly overprepared costs you a few reviews; being underprepared costs you the exam.

Also, the actual N5 pass requirement is **80/180 overall**, but you also need at least **38/120 in Language Knowledge + Reading and 19/60 in Listening**. So the system cannot let you farm vocab points while ignoring listening. ([JLPT][5])

I'd add this directly to the Codex spec:

# ADDENDUM — Content Sourcing and JLPT Pass-Oriented Curriculum

The primary objective of this product is not merely general Japanese learning.

The application should be capable of preparing the user to pass the JLPT comfortably.

Content architecture must therefore distinguish between:

1. authoritative linguistic data,
2. JLPT curriculum classification,
3. exam-format calibration,
4. generated learning content,
5. user-specific mastery.

Do not treat any single unofficial JLPT vocabulary list as authoritative.

---

## 1. Source Hierarchy

Use a layered source model.

### Layer A — Official JLPT Specification

The official JLPT website is the authoritative source for:

* levels
* competency descriptions
* test sections
* question types
* timings
* scoring structure
* official sample questions
* official practice-workbook structure

Store this as:

```typescript
JLPTSpecification {
  level
  section
  questionType
  testedSkill
  approximateFormat
  source
}
```

This determines what abilities the app must train.

Do not use official JLPT materials as a bulk content database.

---

## 2. Vocabulary Source

Use JMdict or another high-quality licensed lexical dataset as the canonical lexical layer.

Each vocabulary item should derive factual fields such as:

```typescript
VocabularyEntry {
  id

  writtenForms[]
  readings[]

  senses[]

  partsOfSpeech[]

  commonnessMetadata?

  sourceIds[]
}
```

Do not have an LLM invent:

* readings
* dictionary meanings
* parts of speech
* transitivity
* conjugation class

when structured lexical data is available.

LLMs may generate:

* explanations
* mnemonics
* example contexts
* exercises

but those are derived content, not canonical lexical facts.

---

## 3. Kanji Source

Use KANJIDIC2 or equivalent licensed structured data for:

```text
character
meanings
on readings
kun readings
stroke count
reference metadata
```

Kanji learning should then connect these records to useful vocabulary from the vocabulary database.

---

## 4. JLPT Classification Is Separate From Dictionary Data

JMdict and KANJIDIC do not define the modern official JLPT syllabus.

Create a separate classification layer:

```typescript
CurriculumClassification {
  itemType
  itemId

  level:
    "N5"
    | "N4"
    | "N3"
    | "N2"
    | "N1"

  confidence:
    "high"
    | "medium"
    | "low"

  evidenceSources[]

  inclusionReason

  reviewedAt
}
```

Do not pretend JLPT classifications are official where they are not.

---

## 5. Consensus Curriculum

Create the actual learning syllabus using consensus from multiple reputable JLPT preparation datasets/resources.

For each candidate word, kanji or grammar point:

```text
source A says N5
source B says N5
source C says N4
```

then compute an internal confidence rating.

For exam preparation, err modestly on the side of overcoverage.

The goal is:

```text
comfortable pass coverage
```

rather than:

```text
smallest theoretically possible N5 list
```

---

## 6. Curriculum Bands

Internally classify content into three bands.

### CORE

Very high-confidence target-level content.

Must be mastered.

### EXTENDED

Common material plausibly appearing at the target level or required for comfortable comprehension.

Should be learned before the exam.

### BRIDGE

Useful content slightly above the nominal level.

Learn after core mastery or when needed for reading/listening comprehension.

Example UI:

```text
N5 Core        91%
N5 Extended    74%
N4 Bridge      18%
```

This is better than pretending there is one exact official N5 word list.

---

## 7. Grammar Curriculum

Grammar requires stronger curation than vocabulary.

Do not automatically infer JLPT grammar levels from raw dictionary data.

Maintain reviewed grammar records:

```typescript
GrammarPoint {
  id

  canonicalName
  forms[]

  meaning
  formation
  usageConditions

  prerequisites[]

  contrasts[]

  jlptClassification

  sources[]

  examples[]

  reviewed
}
```

Each grammar point should initially require manual or high-confidence curated approval before being marked production-ready.

---

## 8. Generated Learning Content

Exercises may be generated programmatically or with an LLM.

However, every generated object must reference the curriculum items it is intended to test.

Example:

```typescript
Exercise {
  id

  targetItems[]

  testedSkill

  jlptLevel

  questionType

  prompt
  options[]
  correctAnswer

  explanation

  validationStatus

  generatedBy?
  reviewedBy?
}
```

Do not generate arbitrary Japanese trivia.

Every exercise must have an explicit pedagogical target.

---

## 9. Content Validation Pipeline

Generated content should pass validation before entering the active pool.

Pipeline:

```text
GENERATE
↓
STRUCTURAL VALIDATION
↓
LEXICAL VALIDATION
↓
GRAMMAR VALIDATION
↓
ANSWER UNIQUENESS CHECK
↓
DIFFICULTY CHECK
↓
APPROVE
```

Reject exercises with:

* unnatural Japanese
* multiple defensible answers
* vocabulary far above the selected level without reason
* incorrect readings
* ambiguous grammar
* trivial distractors
* English-dependent tricks unrelated to Japanese

---

## 10. Question Bank

Do not generate every question live.

Maintain a persistent question bank.

Questions receive quality metadata:

```typescript
QuestionStats {
  attempts
  correctRate
  averageResponseTime

  ambiguityReports

  qualityScore
}
```

Bad questions should automatically lose priority.

Good questions should remain reusable with spaced exposure.

---

## 11. Official JLPT Calibration

Use official JLPT:

* sample questions
* published composition of test items
* official practice workbooks available to the user

as calibration references.

Generated mock questions should imitate:

```text
skill tested
difficulty
length
decision required
time pressure
```

not copy wording or questions.

---

## 12. N5 Exam Blueprint

Ensure the N5 curriculum trains all official task families.

### Vocabulary

* kanji reading
* orthography
* contextual vocabulary
* paraphrases

### Grammar

* selecting grammatical forms
* sentence composition
* text grammar

### Reading

* short passage comprehension
* medium passage comprehension
* information retrieval

### Listening

* task-based comprehension
* comprehension of key points
* verbal expressions
* quick response

Track competence separately for each task family.

---

## 13. Pass-Oriented Mastery

Introduce:

```typescript
ExamSkillMastery {
  level
  skillType

  coverage

  recentAccuracy

  timedAccuracy

  retention

  sampleSize

  status
}
```

Possible status:

```text
Untested
Weak
Developing
Exam-ready
Strong
```

Do not call something exam-ready from only two questions.

Require a meaningful recent sample.

---

## 14. Conservative Exam Readiness

The application should optimize for a comfortable pass, not merely crossing the official cutoff.

Do not tell the user:

```text
You should pass because predicted score = 81.
```

Instead use safety margins.

Example:

```text
N5 Readiness

Vocabulary          Strong
Grammar             Strong
Reading             Developing
Listening           Weak

Overall:
Not yet exam-ready

Priority:
Listening → quick response
```

Only label the user:

```text
Exam-ready
```

when recent performance is consistently above conservative internal thresholds across all required scoring areas.

---

## 15. Never Hide Weak Sections

Because JLPT requires sectional minimum performance, one strong area must not hide another weak area.

For example:

```text
Vocabulary: 94%
Reading: 90%
Listening: 36%
```

must produce:

```text
NOT READY
```

and prioritize listening.

---

## 16. Diagnostic Tests

Add a diagnostic system.

The user can take:

```text
N5 Diagnostic
N4 Diagnostic
```

The diagnostic samples every major exam skill.

After completion:

```text
Your N5 profile

Vocabulary       Strong
Kanji reading    Strong
Grammar          Developing
Reading speed    Weak
Listening        Weak

Recommended path:
Listening Foundations → Grammar Review → Timed Reading
```

The Journey should adapt using these results.

---

## 17. Pass N5 Mode

Create a dedicated goal:

```text
PASS JLPT N5
```

When enabled, recommendations prioritize exam ROI.

Daily queue:

```text
1. overdue memory reviews
2. weakest required JLPT skill
3. incomplete N5 Core curriculum
4. reading/listening exposure
5. N5 Extended curriculum
```

Decorative or enrichment content should not displace essential exam content.

---

## 18. Exam Countdown

Allow an optional target exam date.

Use it to change strategy.

### Far from exam

Prioritize:

```text
learning
retention
broad coverage
```

### 6–8 weeks before

Increase:

```text
mixed JLPT exercises
reading
listening
timed work
```

### Final 2–3 weeks

Prioritize:

```text
weakness repair
section tests
timing
mock examinations
retention
```

Do not simply increase daily workload indefinitely.

---

## 19. Content Provenance

Every imported or curated item should preserve provenance.

Example:

```typescript
ContentSource {
  id

  name

  type:
    "official"
    | "dictionary"
    | "curriculum"
    | "frequency"
    | "examples"
    | "generated"
    | "user"

  url?

  license?

  retrievedAt?

  notes?

  sha256?

  localFilename?
}
```

This lets the system distinguish:

```text
dictionary fact
```

from:

```text
unofficial JLPT classification
```

from:

```text
AI-generated example
```

---

## 20. Source Quality UI

The normal learner interface should remain clean.

But the private admin interface may show:

```text
決める

Dictionary:
JMdict

JLPT classification:
N4 — high confidence

Classification evidence:
3 curriculum sources

Examples:
generated + validated
```

This makes content auditable.

---

## 21. Japanese Aesthetic

The frontend should have a recognizably Japanese identity without becoming a stereotype.

Use visual motifs inspired by:

* Japanese editorial layouts
* train maps and station signage
* ink and paper
* vermilion seals
* subtle washi textures
* vertical Japanese typography where appropriate
* seasonal imagery
* traditional pattern geometry
* understated landscape illustration

Avoid:

* anime wallpaper
* random cherry blossoms everywhere
* neon Tokyo clichés
* excessive torii gates
* fake brush fonts for body text

Japanese text itself should be one of the primary visual elements.

---

## 22. Journey Visual Concept

The Journey should visually resemble travel through Japan.

Example progression:

```text
はじまり
Foundations
↓
町
N5 vocabulary + grammar
↓
駅
reading / practical Japanese
↓
山道
advanced N5
↓
合格への道
exam preparation
```

These should remain curriculum regions underneath the visual metaphor.

Do not allow aesthetics to obscure learning state.

---

## 23. Core Product Principle

The product should combine:

```text
credible linguistic data
+
conservative JLPT curriculum coverage
+
high-quality original exercises
+
spaced repetition
+
adaptive weakness detection
+
official-format calibration
+
excellent mobile UX
+
Japanese visual identity
```

The product fails if any of the following is true:

* beautiful but educationally shallow
* full of vocabulary but weak in listening
* full of generated content with uncertain correctness
* good at teaching but unrelated to JLPT question types
* good JLPT database but unpleasant enough that the user stops using it

Build around all of these constraints simultaneously.

### The bit I think really solves your worry

I wouldn't have Codex statically ship “the N5 dataset” and call it done. I'd build an **ingestion + provenance system**.

Conceptually:

```text
               OFFICIAL JLPT
                    │
          Defines what is tested
                    │
                    ▼
JMdict ───────► CURRICULUM ◄────── JLPT prep consensus
KANJIDIC2 ───►   ENGINE
                    │
          N5 Core / Extended
                    │
                    ▼
             CONTENT FACTORY
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
    Lessons      Drills       Readings
                                  │
                               Listening
                    │
                    ▼
              VALIDATION
                    │
                    ▼
               YOUR APP
```

That's much more robust than “import an N5.csv from GitHub.”

And crucially, **the official exam itself tells us what the app should optimize for**. N5 reading isn't just “can you translate Japanese?” Officially it includes roughly 80-character short passages, ~250-character mid-size texts, and retrieving information from notices/materials around that length. Listening separately tests task completion, key-point comprehension, verbal expressions and quick responses. ([JLPT][6]) So those become explicit training buckets rather than generic “Reading XP” and “Listening XP.”

I'd even make your home screen eventually say something like:

```text
JLPT N5 · December 2026

CORE COVERAGE                         73%

言語知識
Vocabulary        █████████░  Strong
Grammar           ███████░░░  Developing

読解
Short texts       ████████░░  Strong
Information       ██████░░░░  Developing

聴解
Task response     ███████░░░  Developing
Quick response    █████░░░░░  Weak

─────────────────────────────────
TODAY'S PRIORITY

Quick-response listening
8 minutes

[ 始める ]
```

Now the Japanese aesthetic isn't decoration pasted onto a quiz site. The **whole metaphor becomes “合格への道” — your path toward passing**.

One more useful reality check: since the official JLPT does **not** publish exhaustive contemporary vocabulary/kanji/grammar lists, anyone selling you a supposedly exact “complete official N5 list” is overselling certainty. ([JLPT][1]) Your app can actually handle that uncertainty better than most sites by having **Core / Extended / Bridge** content and deliberately aiming above the minimum. That's how I'd build it if the actual KPI is “I want to walk into N5 and not be sweating bullets.”

[1]: https://www.jlpt.jp/e/faq/?utm_source=chatgpt.com "FAQ |JLPT Japanese-Language Proficiency Test"
[2]: https://www.jlpt.jp/e/guideline/pdf/n5_e_revised.pdf?mode=pc&utm_source=chatgpt.com "N5 Purposes of test items"
[3]: https://www.jmdict.org/?utm_source=chatgpt.com "Electronic Dictionary Research and Development Group"
[4]: https://www.edrdg.org/wiki/KANJIDIC_Project.html?utm_source=chatgpt.com "KANJIDIC Project - EDRDG Wiki"
[5]: https://www.jlpt.jp/reference/pdf/guide_2026.pdf?utm_source=chatgpt.com "ol_JLPTパンフレットA3.indd"
[6]: https://jlpt.jp/e/guideline/pdf/n5_e_revised.pdf?utm_source=chatgpt.com "N5　Purposes of test items"

## 24. Beginner Kanji Support and Topic Coverage

The initial learner should not be blocked by unfamiliar kanji.

### Furigana default

When a Japanese word or kanji is introduced in a learning surface, show its hiragana reading above the kanji by default:

```text
がくせい
学生
```

This applies to:

* lesson prompts
* kanji and vocabulary cards
* useful-word examples
* reading passages in Guided mode
* tappable linked vocabulary

Furigana should remain visually subordinate to the Japanese text. Reading practice may hide it in Normal or Challenge mode so support can fade as confidence grows.

### Kanji drill coverage

Kanji practice must train more than recognition of a single reading. Each kanji should be eligible for:

1. reading recognition
2. meaning recognition
3. kanji-to-word mapping
4. reading in useful vocabulary
5. typed recall where appropriate

Questions must use the kanji's linked vocabulary and readings as the factual source. Do not create random kanji questions with invented readings or disconnected words.

### Topic coverage

The N5 foundation should grow through practical topic bands rather than a flat word list:

```text
people and family
school and university
numbers, time, and days
food and home
transport and places
weather and daily routines
shopping and requests
common adjectives and verbs
```

Every vocabulary item should retain topic tags and connect to at least one example, lesson, or reading context. New topics should be added with authored, validated records and useful kanji links; raw record count is not a substitute for coverage.

### Expansion rule

Prefer a smaller set of well-supported beginner records over filler. A new topic is ready for the active learning pool only when it has:

* representative vocabulary
* relevant kanji where applicable
* at least one grammar or usage connection
* original example context
* practice questions with plausible distractors
* a lesson or reading route through the Journey

## 25. Textbook-Level Beginner Coverage Without Copying Textbooks

Kizashi should feel as structurally useful as a strong beginner course and JLPT preparation guide, while keeping its own original content.

Use common beginner outcomes from established courses and preparation books as alignment references only. Do not reproduce their lesson prose, dialogues, exercises, answer keys, illustrations, or page structure.

The N5 foundation should progressively cover:

```text
introductions and identity
particles and polite copula
questions and answers
time, dates, numbers, and counters
places, movement, and daily routines
present, negative, and past polite forms
adjectives and descriptions
likes, wants, and simple reasons
requests, permission, and practical transactions
existence and location
```

Each topic band should connect:

```text
grammar prerequisites
+ vocabulary
+ contextual kanji
+ original examples
+ short reading
+ listening situation
+ targeted practice
+ spaced review
```

### Beginner content quality bar

Before a topic is marked production-ready, it should have enough material to teach and reuse the concept rather than merely name it:

* at least one clear explanation and formation rule
* at least two natural original examples
* a common mistake or contrast where relevant
* vocabulary with readings and useful collocations
* kanji connected to actual words rather than isolated character trivia
* at least one recognition or recall drill
* at least one contextual, reading, or listening application
* a prerequisite path and a Journey lesson assignment

### Preparation modes

Learning mode may show furigana, translations, explanations, and retry feedback. Preparation mode should mix vocabulary, kanji, grammar, reading, and listening in the approximate decision patterns of the target level, with conservative coverage thresholds and sectional weakness visible.

Do not claim that a small bank is equivalent to a complete textbook or official exam. Show the current coverage, source provenance, and remaining topic gaps honestly while the curriculum is still expanding.

## 26. AI Content Generation TODO

Add an OpenRouter-backed content generation pipeline for expanding the curriculum and question bank.

AI generation must remain downstream from authoritative and curated data. The model may generate original:

* example sentences and dialogues
* short readings and listening scripts
* distractors and explanations
* vocabulary, kanji, grammar, reading, and listening exercises

The model must not be treated as the source of truth for readings, meanings, parts of speech, conjugation, JLPT classification, or answer keys when those facts can be resolved from structured curriculum data.

Generation flow:

```text
CURRICULUM TARGET
↓
OPENROUTER GENERATION
↓
STRUCTURED JSON PARSE
↓
SCHEMA + LEXICAL + GRAMMAR VALIDATION
↓
ANSWER UNIQUENESS + LEVEL CHECK
↓
USER REVIEW
↓
ACTIVE CONTENT POOL
```

Every generated record must preserve:

```typescript
GeneratedContentReview {
  status: "draft" | "approved" | "rejected"
  generatedBy: string
  model: string
  targetItemIds: string[]
  validationIssues: string[]
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}
```

The first reviewer is the product owner and current sole user. The application should provide a private review queue where the owner can inspect, edit, approve, or reject generated content. Automated validation is mandatory, but it does not replace human approval for production content.

AI API keys must remain server-side. Generation should be an explicit admin action with rate limits, retries, and a visible draft state; it must never silently publish model output.

## 27. Kana Progression and External Source Research TODO

Keep kana practice answer-only and teach it in small batches rather than exposing the entire chart beneath each question.

The kana curriculum should include:

* basic gojūon rows
* dakuten and handakuten, including ぎ, づ, and ぱ
* yōon/blended rows such as きゃ, しゃ, ちゃ, and じゃ
* recognition and typed-recall practice with configurable batch sizes
* a separate Reference page for full kana charts and curriculum kanji lookup

Evaluate Renshuu as a product and pedagogy reference only. Do not scrape, copy, or redistribute its lessons, sentences, audio, explanations, or proprietary metadata without explicit permission or a compatible license. Prefer original Kizashi content built from licensed/open linguistic sources; revisit a partnership, public API, or permission request if a legitimate integration becomes important.

## 28. Licensed Source Roadmap TODO

Use a small number of reliable, appropriately licensed sources instead of
crawling learning sites. Keep every import in staging with its source record,
license, retrieval date, checksum where available, and review status. Imported
facts must enrich Kizashi's curriculum; they must not silently replace the
curated lesson sequence or publish unreviewed exercises.

### Phase 1 — content foundation

Prioritize these sources first:

* **JMdict** — dictionary spellings, readings, meanings, parts of speech, and
  usage metadata.
* **KANJIDIC2** — kanji readings, meanings, stroke counts, grades, and related
  metadata.
* **BCCWJ** — written frequency and register signals.
* **Irodori** — communicative sequencing, vocabulary, grammar, and exercise
  patterns.
* **Marugoto** — vocabulary, phrases, kanji progression, and can-do sequence.
* **JMdict-linked examples / Tatoeba** — reviewed Japanese-English examples.
* **OpenJLPT** — optional community JLPT level spine, always marked as
  unofficial and review-required.

### Phase 2 — lookup and analysis

Add **JMnedict** for proper names, then **UniDic** and **SudachiDict** for
tokenization, lemmas, conjugation, and sentence-to-dictionary linking.

### Phase 3 — spoken-language enrichment

Evaluate **CEJC** and **CSJ** for licensed frequency and listening/conversation
work once the N5/N4 curriculum and audio workflow are stable. These are
analysis and realism sources, not a reason to inflate the beginner syllabus.

The first implementation is `scripts/build_phase1_staging.py`, which runs the
cache-first acquisition flow without publishing. It delegates to
`scripts/ingest_openjlpt.py` for local JMdict, linked JMdict examples,
KANJIDIC2, BCCWJ frequency enrichment, and capped Tatoeba sentence
candidates. `scripts/merge_openjlpt_staging.py` turns that package plus the
Irodori vocabulary, grammar-pattern, and kanji normalizers into an importable
source-review module. When the cached Marugoto PDFs and `pdftotext` are
available, `scripts/ingest_marugoto_vocab.py` adds conservative vocabulary
candidates while preserving each source line for review. Then
`scripts/render_supabase_content_sql.py` renders all non-rejected source-review
records into local, idempotent SQL while preserving pending/approved status. Migration
`0008_content_source_provenance.sql` keeps each artifact checksum and local
filename in `content_sources`. Imported records also carry a per-record
`reviewStatus`: pending means learner-active but not human reviewed. Both the
private learner route and SQL export include non-rejected records; rejected
records remain excluded. Provenance, source terms, and real-lesson placement
remain required, and generated questions retain draft provenance. Migration
`0010_content_review_status.sql` stores the gate in Supabase, and
`0011_content_source_types.sql` preserves frequency/example roles in the source
registry.
