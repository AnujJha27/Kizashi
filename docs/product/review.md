# ADDENDUM — COVERAGE EXPANSION WITH ENCOUNTER-DRIVEN REVIEW

Repository:

`AnujJha27/Kizashi`

This is an ADDENDUM to all existing Kizashi content, UX, Journey, Kanji, and completeness milestones.

It does NOT supersede prior requirements.

This addendum changes one important assumption:

> UNREVIEWED DOES NOT MEAN HIDDEN.

Kizashi is a private learning app used by its owner.

The owner explicitly prefers to review content naturally while encountering and learning it rather than sitting in Content Studio and batch-reviewing thousands of items first.

Therefore the system should optimize for:

```text
coverage first
+
provenance preserved
+
confidence visible
+
review during study
```

rather than:

```text
review everything first
+
release later
```

---

# R1. CORE POLICY

Use three distinct concepts:

```text
AVAILABILITY

REVIEW STATUS

CONTENT QUALITY
```

Do NOT conflate them.

A content item may be:

```text
available = yes

reviewStatus = provisional

qualityConfidence = medium
```

and still appear in normal learning flows.

---

# R2. LEARNER STATUS MODEL

Use or adapt the existing status architecture to support approximately:

```text
PROVISIONAL
usable in learner flow
not personally reviewed yet

REVIEWED
owner has accepted or edited it

FLAGGED
needs attention

REJECTED
excluded from learner flow
```

Do not create duplicate status systems if equivalents already exist.

---

# R3. PROVISIONAL CONTENT MUST PARTICIPATE

Unless explicitly rejected or technically invalid, provisional content may participate in:

```text
Journey lessons

Learn

Library

Practice

Today

Review

Mistake repair

Immersion linking

Kanji learning

Vocabulary learning
```

Do NOT gate it behind Content Studio approval.

---

# R4. DO NOT CALL PROVISIONAL CONTENT VERIFIED

Although provisional items are learner-visible, analytics must remain honest.

Do NOT count:

```text
provisional
```

as:

```text
reviewed
verified
human-approved
native-reviewed
```

Coverage dashboards should distinguish:

```text
available
reviewed
provisional
flagged
rejected
```

This is critical.

---

# R5. PRIMARY MILESTONE GOAL

Expand the actual learner-facing N5/N4 curriculum substantially from the staged reservoir.

Current staged package already contains approximately:

```text
7,328 vocabulary
630 kanji
413 grammar source rows
```

Do NOT spend this milestone hunting for another giant content dump.

Instead:

```text
existing source reservoir
        ↓
canonicalize
        ↓
classify
        ↓
enrich where possible
        ↓
wire into learner flow
        ↓
review naturally on encounter
```

---

# R6. PRIORITY ORDER

Execute approximately:

```text
1. N5 vocabulary coverage expansion
2. N4 vocabulary coverage expansion
3. N5 kanji coverage expansion
4. N4 kanji coverage expansion
5. grammar unresolved-gap closure
6. encounter-driven review UX
7. learner-flow promotion
8. assessment/question expansion
9. Content Studio synchronization
```

---

# R7. VOCABULARY — STOP THINKING IN TERMS OF THE CURRENT 169 ENRICHED ITEMS

The current richly authored learner vocabulary set is much smaller than the staged source reservoir.

Expand aggressively.

Use the existing lexical coverage union to identify:

```text
high-confidence N5 vocabulary

high-confidence N4 vocabulary

multi-source items

high-frequency items

Journey-relevant items

common everyday vocabulary

items already linked to readings/listening
```

Promote these into usable learner-facing items.

---

# R8. VOCABULARY PROMOTION DOES NOT REQUIRE PERFECT ENRICHMENT

A vocabulary item does NOT need every deluxe field completed before it can appear.

Minimum provisional learner contract:

```text
written form

reading

meaning

part of speech where available

source/provenance

target level/evidence

at least one usable context or source example where available
```

Preferred:

```text
2 examples

collocations

related words

audio

context question

orthography question
```

But do not hold back thousands of useful words because one enrichment field is missing.

---

# R9. VOCABULARY ENRICHMENT PRIORITY

For promoted vocabulary, enrich in this order:

```text
1. correct reading
2. useful meaning
3. part of speech
4. common usage context
5. collocation
6. example sentence
7. audio
8. contextual assessment
9. related/confusable words
```

This order matters more than decorative metadata.

---

# R10. N5 VOCABULARY

Promote a broad canonical N5 core.

Use multiple evidence sources already integrated such as:

```text
OpenJLPT

Irodori

Marugoto

JMdict

existing Kizashi

frequency evidence where available
```

Do not pretend there is an official exhaustive JLPT word list.

Store source claims instead.

---

# R11. N4 VOCABULARY

N4 is currently especially thin at the enriched authored layer.

Promote substantially more N4 vocabulary.

Do not limit N4 to the current small bridge set.

Prioritize words useful for:

```text
longer conversations

daily life

travel

school/university

work

appointments

plans

reasons

comparison

health

transport

events

description

relationships

time/scheduling
```

---

# R12. N4 USAGE QUESTIONS

Where appropriate, generate provisional N4 usage questions.

Example:

```text
約束
```

Then:

```text
Which sentence uses 約束 naturally?
```

with four complete Japanese sentences.

These may initially be:

```text
provisional
```

and should become reviewable during study.

Do not require batch approval before they appear.

---

# R13. CONTEXTUAL VOCABULARY QUESTIONS

Generate more:

```text
context meaning

paraphrase

orthography

reading

usage
```

questions.

But mark generated content correctly.

For example:

```text
source-backed fact
+
Kizashi-generated assessment
+
provisional
```

Do not call generated questions externally sourced.

---

# R14. QUESTION CONFIDENCE

Use confidence metadata.

Conceptually:

```text
high
deterministic / directly source-supported

medium
simple generated transformation

low
generated distractor judgment
```

Low-confidence questions may still appear but should be especially easy to flag.

---

# R15. KANJI — PROMOTE THE ACTUAL N5/N4 CORE

Use the lexical coverage union and staged 630-kanji reservoir.

Build/promote canonical N5/N4 kanji coverage.

Prioritize characters with:

```text
multiple source claims

high-frequency learner words

Journey relevance

reading/listening overlap

useful everyday compounds
```

---

# R16. KANJI LEARNER CONTRACT

A provisional kanji item should ideally contain:

```text
character

core meaning

useful words

reading inside those words

source evidence

level evidence
```

Preferred:

```text
3–6 useful words

confusable kanji

component information

stroke count

KanjiVG stroke data

Jisho reference
```

Do not delay availability because advanced enrichment is incomplete.

---

# R17. CONNECT TO THE KANJI WRITING ADDENDUM

For promoted canonical kanji:

if KanjiVG data exists, automatically expose:

```text
Watch

Trace

Write
```

Do not manually curate stroke data per kanji.

The stroke-order system should expand automatically as canonical kanji coverage expands.

---

# R18. JISHO REFERENCE

Each promoted kanji should expose the integrated Jisho reference panel where available.

Do not require the item to be reviewed first.

Jisho is useful precisely during encounter-driven review.

---

# R19. USEFUL WORDS FOR KANJI

For each kanji, derive useful learner words from the actual active vocabulary corpus.

Prefer:

```text
level-appropriate

frequent

already taught

Journey-relevant
```

words.

Example:

```text
学

学生
学校
大学
学ぶ
```

Do not populate with obscure dictionary compounds just to reach a quota.

---

# R20. KANJI CONFUSABLES

Where useful, derive provisional visual comparison groups.

Examples:

```text
未 / 末

土 / 士

日 / 目

人 / 入
```

Allow the owner to approve/remove these naturally.

---

# R21. GRAMMAR — CLOSE UNRESOLVED COVERAGE GAPS

Do not massively rebuild the already-improved grammar curriculum.

Instead use the existing grammar coverage registry.

For every unresolved high-confidence N5/N4 source pattern, classify it as one of:

```text
existing alias

existing semantic family

new canonical concept

bridge concept

out of scope

source artifact / malformed

duplicate
```

Do not leave high-confidence unresolved rows indefinitely.

---

# R22. NEW GRAMMAR CONCEPTS MAY ENTER PROVISIONALLY

If an unresolved pattern clearly represents a useful missing N5/N4 concept:

create a provisional learner item.

Minimum contract:

```text
pattern

meaning

formation

one clear explanation

2+ examples

source evidence

level evidence
```

It may enter the learning flow before full contract completion.

Mark it provisional.

Later enrichment can raise it to full reviewed status.

---

# R23. TEXT GRAMMAR

The existing text-grammar drafts should be wired into learner practice progressively.

Do not require one giant batch-review session.

Use:

```text
provisional text grammar
```

with:

```text
source passage
question
choices
answer
review state
```

Allow owner review in context.

---

# R24. ENCOUNTER-DRIVEN REVIEW UX

Every provisional content type should support small review controls.

Use a subtle reusable control.

Example:

```text
◌ provisional

[ Looks good ]
[ Edit ]
[ Flag ]
```

Do not show a giant warning panel.

Do not interrupt learning unnecessarily.

---

# R25. REVIEW CONTROLS SHOULD BE CONTEXTUAL

For vocabulary:

```text
Looks good

Edit meaning/example

Flag usage
```

For kanji:

```text
Looks good

Edit metadata

Flag word mapping
```

For grammar:

```text
Looks good

Edit explanation/example

Flag pattern
```

For questions:

```text
Correct

Ambiguous

Wrong answer

Bad distractor
```

Use existing review/edit infrastructure where possible.

---

# R26. ONE-CLICK APPROVAL

`Looks good` should:

```text
set reviewed status

record timestamp

record review origin = learner-flow
```

Optionally preserve:

```text
previous provisional state
```

Do not navigate away.

Do not reload the entire page.

---

# R27. EDIT-IN-PLACE

When possible, allow lightweight editing in the current context.

Examples:

```text
meaning

translation

example

reading

grammar note

question choice
```

Do not force Studio navigation for every typo.

More complex metadata may still open Studio.

---

# R28. FLAGGING

`Flag` should support lightweight reasons such as:

```text
meaning looks wrong

reading looks wrong

unnatural Japanese

bad level

duplicate

bad question

ambiguous answer

source mismatch

other
```

Do not require a written explanation every time.

---

# R29. REVIEW MUST NOT BREAK STUDY FLOW

After review action:

```text
stay on same card/activity
```

Do NOT:

```text
redirect to Studio

reset lesson

lose quiz progress

lose drawing state

lose Today stage
```

---

# R30. REVIEW QUEUE SHOULD DRAIN ORGANICALLY

When the owner marks an item reviewed from Learn/Practice/Library:

Content Studio must immediately reflect it.

The system should not maintain separate incompatible review states.

---

# R31. REVIEW SOURCE

Track review origin where useful:

```text
studio

learn

practice

library

mistake-repair
```

This is useful for debugging.

Do not build a large analytics subsystem just for this.

---

# R32. OPTIONAL "REVIEW AS I LEARN" SETTING

Because this is the intended workflow, consider a user preference:

```text
Show provisional review controls
ON
```

Default ON for the owner.

If OFF:

content remains visible

but review affordances become quieter/hidden.

Do not make provisional content disappear.

---

# R33. PROVISIONAL BADGE DESIGN

Keep the status subtle.

Good:

```text
◌ provisional
```

Bad:

```text
⚠️ WARNING: UNVERIFIED CONTENT
```

This app is for one informed user.

Do not make every lesson look dangerous.

---

# R34. GENERATED QUESTION REVIEW

For generated assessments, review UI should be slightly stronger.

Example after answering:

```text
Was this question good?

[ Yes ]
[ Ambiguous ]
[ Wrong ]
```

If flagged:

remove or deprioritize it from future queues until fixed.

---

# R35. FLAGGED CONTENT BEHAVIOR

Flagged factual learner items may:

```text
remain viewable
```

but should be deprioritized for introduction until corrected.

Flagged questions should normally be excluded from active assessment queues.

Do not continue repeatedly serving a known bad question.

---

# R36. REJECTED CONTENT

Rejected content should be excluded from normal learner flows.

Keep provenance/audit history if existing architecture supports it.

Do not hard-delete automatically.

---

# R37. COVERAGE DASHBOARD

Update Content Studio to show for vocabulary/kanji/grammar:

```text
AVAILABLE

REVIEWED

PROVISIONAL

FLAGGED

REJECTED

MISSING FROM CANONICAL COVERAGE
```

This makes the real state understandable.

---

# R38. DISTINGUISH COVERAGE FROM REVIEW

Show metrics like:

```text
N5 vocabulary coverage:
92% available
31% personally reviewed

N4 vocabulary coverage:
85% available
12% personally reviewed
```

This is much more useful than:

```text
12% complete
```

which makes usable learner coverage look worse than it is.

---

# R39. COVERAGE GOAL

For high-confidence N5/N4 lexical items:

target:

```text
available learner coverage
→ essentially complete

personal review
→ grows organically over time
```

Do NOT block the first goal on the second.

---

# R40. PROVISIONAL INTRODUCTION PRIORITY

When selecting new learner items, prioritize:

```text
1. reviewed high-value item
2. provisional high-confidence multi-source item
3. provisional high-frequency source-backed item
4. lower-confidence provisional item
```

Do not blindly introduce the least trustworthy source-only rows first.

---

# R41. SOURCE CONFIDENCE

Build or reuse confidence from:

```text
number of independent source claims

frequency evidence

source type

existing reading/listening appearances

canonical match confidence

ambiguity
```

Avoid arbitrary confidence values.

---

# R42. JOURNEY INTEGRATION

As more vocabulary/kanji/grammar become available:

expand Journey lesson inventories.

Do NOT cram hundreds of items into existing lessons.

Instead:

```text
rebalance lesson contents

introduce manageable subsets

push remaining items into review/reinforcement
```

The learner path must remain usable.

---

# R43. LESSON CONTENT LOAD

Target reasonable new-item loads.

Do not create:

```text
Lesson 12
87 new words
31 kanji
18 grammar
```

simply because coverage expanded.

Use:

```text
core lesson introductions
+
distributed review
+
Practice exposure
+
Immersion reinforcement
```

---

# R44. N4 PATH EXPANSION

N4 currently needs more learner-facing depth.

Use the increased N4 vocabulary/kanji/grammar coverage to expand N4 Journey lessons.

This should align with the separate N4 world expansion milestone.

Examples:

```text
larger station

city

university/work

events

travel

coast

mountain town
```

Do not leave hundreds of N4 items hanging under one generic N4 lesson cluster.

---

# R45. LEARN FLOW

When a provisional item appears in Learn:

show normal teaching first.

Status is secondary.

Example:

```text
約束
やくそく

promise

約束を守る
keep a promise

[ audio ]

◌ provisional · OpenJLPT / Irodori
[ Looks good ] [ Edit ] [ Flag ]
```

Learning content should dominate.

---

# R46. LIBRARY

Library should expose:

```text
reviewed
provisional
flagged
```

filters.

Useful filter:

```text
Not reviewed yet
```

But this is optional discovery.

The user should not have to review everything there.

---

# R47. PRACTICE

Provisional questions may be included.

If the learner answers them:

provide a lightweight quality-review affordance after answer reveal.

Do not ask after every single question forever.

Use reasonable sampling or only show until question is reviewed.

---

# R48. REVIEW SAMPLING

To avoid annoying review prompts:

prioritize asking for review when:

```text
first encounter

first successful answer

answer was surprising

question low confidence

item appears flagged by automated QA
```

Once reviewed, stop asking.

---

# R49. AUTOMATED QA

Continue automated structural validation for provisional content.

Examples:

```text
duplicate choices

missing answer

reading mismatch

empty meaning

broken source ID

impossible level value

duplicate record

invalid kanji

question answer appears multiple times
```

Automated QA should prevent obviously broken items from entering learner flow.

---

# R50. STRUCTURAL FAILURE VS HUMAN REVIEW

Important distinction:

```text
STRUCTURALLY INVALID
→ do not show

LINGUISTICALLY UNREVIEWED
→ show provisionally
```

Do not confuse these.

---

# R51. AUDIO

If no human audio exists:

use the existing browser TTS/fallback system.

Do not block vocabulary promotion on audio availability.

Mark audio provenance honestly.

---

# R52. READING / LISTENING INTEGRATION

Use expanded lexical/grammar coverage to improve linking.

For each reading/listening asset:

resolve:

```text
vocabulary

kanji

grammar
```

to the expanded active curriculum.

This makes real-context reinforcement much stronger.

---

# R53. NEW CONTENT FROM ENCOUNTERS

When a reading contains a provisional word:

allow:

```text
Study later

Open word

Approve/flag
```

in the same reading flow.

Do not require separate review beforehand.

---

# R54. MISTAKE CENTER

If the learner gets a provisional item wrong:

do not assume the learner is the problem.

Expose:

```text
Review item
```

and optionally:

```text
Flag content
```

especially for generated questions.

---

# R55. OWNER CORRECTIONS TAKE PRECEDENCE

If the owner edits an item:

store that as a Kizashi-authored override.

Do not overwrite it later when rebuilding source ingestion.

Source refreshes should preserve explicit owner corrections.

---

# R56. SOURCE REFRESH MERGE POLICY

On re-ingestion:

```text
source fields update

owner-reviewed overrides persist

review status persists

flags persist

rejected status persists
```

Do not erase human work.

---

# R57. PROVENANCE PER FIELD

Where practical preserve:

```text
source-derived

licensed source

Kizashi generated

owner edited
```

This is especially useful when reviewing questionable content.

---

# R58. VOCABULARY COVERAGE IMPLEMENTATION TARGET

Do not use one arbitrary final word count.

Instead:

```text
build multi-source union
↓
canonicalize
↓
promote high-confidence N5/N4 items
↓
explain remaining gaps
```

Counts are outputs.

However, the learner-ready vocabulary set should become much larger than the current 169 enriched records.

If implementation finishes and the meaningful learner set is still near 169:

the milestone failed.

---

# R59. KANJI COVERAGE IMPLEMENTATION TARGET

Same principle.

Do not target “100 kanji because a blog says so.”

Use:

```text
multi-source N5/N4 union
+
useful lexical support
```

and promote the actual core characters.

---

# R60. GRAMMAR TARGET

Do not inflate grammar artificially.

The goal is:

```text
no meaningful unexplained high-confidence N5/N4 gaps
```

not:

```text
largest grammar count possible
```

---

# R61. CONTENT STUDIO SHOULD BECOME THE CONTROL PLANE

Studio remains useful for:

```text
bulk review

search

flags

coverage disagreements

source inspection

quality audits
```

But it is NOT the mandatory gateway for learner content.

---

# R62. DO NOT DO

Do NOT:

```text
hide all unreviewed content

require Studio approval before learner visibility

mark provisional items reviewed automatically

call generated content verified

mass-approve thousands of records

promote structurally invalid records

create another huge source dump

force the owner to batch-review everything

interrupt lessons with giant review modals

ask for review after every exposure forever

overwrite owner edits during ingestion

count rejected/flagged content as healthy coverage

make N4 remain a tiny bridge while thousands of source records exist
```

---

# R63. IMPLEMENTATION ORDER

Follow approximately:

## 1

Audit current availability/review-state logic.

## 2

Separate availability from review status.

## 3

Expand vocabulary canonical coverage from the staged reservoir.

## 4

Promote high-confidence N5 vocabulary.

## 5

Promote high-confidence N4 vocabulary.

## 6

Expand kanji canonical coverage.

## 7

Promote N5/N4 kanji.

## 8

Automatically wire promoted kanji into KanjiVG/Jisho writing/reference infrastructure.

## 9

Classify unresolved grammar patterns.

## 10

Promote clear missing grammar concepts provisionally.

## 11

Wire provisional text-grammar questions into learner practice.

## 12

Implement reusable encounter-review controls.

## 13

Integrate review into Learn.

## 14

Integrate review into Library.

## 15

Integrate review into Practice.

## 16

Integrate review into reading/lookup where appropriate.

## 17

Synchronize learner review actions with Studio.

## 18

Expand N4 lesson distribution.

## 19

Run structural QA/tests/build.

---

# R64. REQUIRED FINAL REPORT

Report:

```text
VOCABULARY

N5 available
N5 reviewed
N5 provisional
N5 flagged
N5 missing

N4 available
N4 reviewed
N4 provisional
N4 flagged
N4 missing
```

---

# R65. KANJI REPORT

Report:

```text
N5 available
N5 reviewed
N5 provisional
N5 with useful words
N5 with stroke data

N4 available
N4 reviewed
N4 provisional
N4 with useful words
N4 with stroke data
```

---

# R66. GRAMMAR REPORT

Report:

```text
canonical concepts

reviewed

provisional

flagged

unresolved high-confidence patterns

aliases collapsed

new concepts added

text-grammar questions available
```

---

# R67. REVIEW UX REPORT

Report:

```text
review controls implemented in:

Learn
Library
Practice
Reading
Kanji writing

one-click approval behavior

edit behavior

flag behavior

state persistence

Studio synchronization
```

---

# R68. COVERAGE REPORT

Show both:

```text
AVAILABLE COVERAGE
```

and:

```text
PERSONALLY REVIEWED COVERAGE
```

Do not merge the two numbers.

---

# R69. DEFINITION OF DONE

This addendum is complete when:

* substantially more staged N5/N4 vocabulary is actually usable in learner flows;
* N4 vocabulary is no longer represented by only a tiny authored bridge;
* substantially more canonical N5/N4 kanji are learner-visible;
* promoted kanji connect naturally to useful words;
* stroke-order infrastructure expands with promoted kanji;
* Jisho references are available during encounter;
* unresolved grammar coverage has been actively classified;
* clear missing grammar concepts can enter provisionally;
* provisional text grammar can appear in practice;
* provisional content is learner-visible;
* provisional status remains visible and honest;
* the owner can approve/edit/flag content while learning;
* those actions do not interrupt study;
* review status synchronizes with Studio;
* rejected/broken content is excluded;
* structurally invalid content never enters the learner flow;
* owner edits survive source refresh;
* availability and review coverage are reported separately;
* expanded coverage does not make lessons absurdly overloaded;
* all builds/tests pass.

The final workflow test is:

```text
I encounter a new word, kanji, grammar point, or question.

Can I learn from it immediately?

Can I see where it came from?

Can I check Jisho/source context if I want?

Can I approve it in one click if it looks good?

Can I edit or flag it immediately if something looks wrong?

Can I continue studying without being kicked into an admin workflow?
```

If any of those answers are no, encounter-driven review is not properly implemented.

The final product principle is:

> Kizashi should get more useful as the owner studies it.

Studying and reviewing the curriculum should be the same organic process, not two separate jobs.
## Current implementation checkpoint · 2026-09-06

Implemented in the learner flow: provisional encounter controls are mounted in Learn, Library, Practice feedback, Reading word inspection, and Kanji writing. Item controls provide `Looks good`, reasoned flags, and an `Edit in Studio` handoff; answered questions provide `Correct`, `Ambiguous`, `Wrong answer`, and `Bad distractor`. Actions remain on the current card, persist in the existing synced `michi.content-flags` collection with origin and timestamp, and are visible in Content Studio's learner-review summary.

Still open from this report: final review of the expanded reservoir. The owner can now hide provisional review controls from Profile while provisional content stays learner-visible. Vocabulary/kanji meanings, grammar explanations, and answered question choices can be corrected in the encounter; those owner edits persist in the existing synced review record and are reapplied by the learner module, while complex metadata still opens Studio. Studio now reports available, personally reviewed, provisional, flagged, and rejected counts from the live package; the N5/N4 lexical and grammar union panels also show canonical missing counts, live availability, review state, Kanji useful-word/stroke coverage, and active text-grammar counts. Rejected records remain excluded by the learner release gate and provisional records remain learner-visible and visibly labeled.
