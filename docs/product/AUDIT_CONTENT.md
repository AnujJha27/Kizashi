# ADDENDUM — JLPT N5/N4 CONTENT COMPLETENESS AND QUALITY PASS

This is an ADDENDUM to all existing Kizashi milestones.

It does NOT supersede, weaken, replace, or postpone any previous requirements.

This addendum specifically addresses the remaining CONTENT gaps after the current implementation.

The current repository already has substantial raw content volume.

Current evidence at the time of this addendum includes approximately:

```text
Vocabulary source records      ~7,328
Kanji source records              630
Grammar source records            413

Reading items                     121
Listening items                   166

Original assessment reading:
N5 60
N4 55

Original assessment listening:
N5 80
N4 80
```

However:

```text
RAW RECORD COUNT
≠
CURRICULUM COMPLETENESS
≠
JLPT QUALITY
```

The remaining job is therefore NOT:

> collect thousands more generic records.

It is:

```text
complete grammar coverage

verify vocabulary completeness

verify kanji completeness

improve grammar assessment depth

audit reading quality

audit listening naturalness

add visual listening tasks

complete pronunciation

deepen dictation

populate output/pragmatics/chunks

finish remaining useful immersion providers
```

This is an IMPLEMENTATION task.

Do not stop at audits or recommendations.

Where a gap is found, implement it.

---

# C1. PRIORITY ORDER

Execute this milestone in the following priority order:

```text
1. COMPLETE N5 + N4 GRAMMAR
2. COMPLETE N5 + N4 VOCABULARY COVERAGE
3. COMPLETE N5 + N4 KANJI COVERAGE
4. GRAMMAR ASSESSMENT DEPTH
5. LISTENING NATURALNESS + VISUAL QUESTIONS
6. READING QUALITY + TEMPLATE DIVERSITY
7. PRONUNCIATION CURRICULUM
8. DICTATION DEPTH
9. PRAGMATICS / CHUNKS / OUTPUT BANKS
10. REMAINING IMMERSION SOURCE DEPTH
```

Do NOT spend this milestone adding another massive generic vocabulary or kanji dataset.

---

# C2. COMPLETE N5 + N4 GRAMMAR

## Current implementation status (2026-09-04)

- [x] `scripts/build_grammar_coverage_registry.mjs` builds `data/grammar-coverage-union.json` from cached OpenJLPT grammar lists, staged Irodori sentence patterns, existing canonical grammar, and mapped Tae Kim/Wikibooks references; `components/content/grammar-coverage.tsx` exposes the report in Content Studio.
- [~] The current registry reports N5 224 raw patterns / 46 canonical concepts (16 complete, 24 partial, 6 missing, 105 unresolved) and N4 188 raw patterns / 70 canonical concepts (3 complete, 58 partial, 9 missing, 86 unresolved). Sixty-five N4 concepts are authored in the dedicated expansion lessons, five additional N4 bridge concepts remain in the life module, and six N5 concepts are authored from exact OpenJLPT evidence; fourteen explicit contrast clusters now connect direction, benefit perspective, inference/appearance, conditionals, potential ability, passive/potential, causative forms, change/habit/decision forms, modality/inference forms, quotation/thought forms, nominalization/capability forms, contrast/conjunction forms, time/aspect forms, and ease/difficulty forms. The registry still keeps source-level disagreements and unresolved rows visible. It now includes 111 reviewed Irodori mapping references plus 21 curated OpenJLPT alias references and marks mapped source records resolved; level disagreements remain visible (N5 4, N4 7, including the Starter-level basic giving/receiving evidence, Elementary 1 quotation/thought and nominalization mappings, and related Elementary 1 けど patterns). This is an honest coverage baseline, not a claim of grammar completeness.

This is the highest-priority content issue.

At the initial audit, bundled canonical grammar was approximately:

```text
N5: 40 concepts
N4: 5 concepts
```

The current registry above now exposes 70 N4 canonical concepts, with 65
dedicated expansion concepts and five life-module bridge concepts authored;
the remaining
coverage still review-visible against the source union. The staged package
still contains hundreds of source rows.

This is not acceptable as a final N5/N4 curriculum.

---

# C3. BUILD A COMPLETE GRAMMAR COVERAGE UNION

The authored reading/listening quality audit is now implemented in `lib/content-quality-core.js` and exposed in Content Studio. It reports normalized template uniqueness, near-duplicate clusters, question-family distribution, and listening source type; the current generated banks report 115/115 unique reading passage templates with 143 questions across 11 families and 160/160 unique listening templates, all with zero near-duplicate clusters, but it remains a review signal, not a substitute for native-speaker judgment.

The first offline union is implemented and deliberately review-only. It currently uses OpenJLPT, Irodori sentence patterns plus the 111 reviewed Irodori mapping references, the existing Kizashi canonical package, and mapped Tae Kim/Wikibooks references; official JLPT remains blueprint evidence, while Bunpro/JLPT Sensei-style lesson prose is not mirrored. Remaining source acquisition and canonical review work stays visible in the registry's full unresolved queue, which Content Studio renders as a bounded scrollable review list.

Create a grammar inventory from multiple independent sources.

Use at minimum:

```text
Official JLPT
OpenJLPT
existing Kizashi grammar
Irodori
Marugoto
Tae Kim
Wikibooks
JLPT Sensei
Bunpro
other already-reviewed JLPT-oriented sources
```

The purpose of unofficial sources such as JLPT Sensei and Bunpro is:

```text
COVERAGE EVIDENCE
```

not:

```text
copy their lesson prose
```

---

# C4. SCRAPE / INGEST COVERAGE METADATA

Create a source-ingestion pipeline for grammar inventory evidence.

Suggested scripts:

```text
scripts/fetch_grammar_coverage_sources.py

scripts/build_grammar_coverage_registry.py

scripts/audit_grammar_coverage.py
```

Adapt names if existing architecture suggests better ones.

Collect where technically and legally appropriate:

```text
pattern

candidate level

source URL

source label

source grouping

alias / variant information

source order/category

short factual metadata
```

Do not mirror whole copyrighted lesson pages from restricted providers.

---

# C5. USE DEEPER CONTENT ONLY FROM SOURCES THAT SUPPORT IT

For sources with appropriate reuse permissions, richer extraction may be used.

Examples include already approved source classes such as:

```text
Tae Kim

Wikibooks

existing reusable/open structured sources

Irodori fields within the existing source boundary
```

Preserve:

```text
source ID
license
attribution
field provenance
```

---

# C6. GRAMMAR COVERAGE REGISTRY

Build or extend a registry equivalent to:

```typescript
type GrammarCoverageRecord = {
  canonicalId: string;

  pattern: string;
  aliases: string[];

  sourceClaims: {
    sourceId: string;
    level?: "N5" | "N4";
    sourcePattern?: string;
    sourceUrl?: string;
  }[];

  kizashiLevel: "N5" | "N4";

  band:
    | "core"
    | "extended"
    | "bridge";

  confidence:
    | "high"
    | "medium"
    | "low";

  coverageStatus:
    | "complete"
    | "partial"
    | "missing";

  inclusionReason: string;
};
```

Reuse existing types where practical.

Do not duplicate provenance architecture.

---

# C7. DEFINITION OF COMPLETE GRAMMAR

Do NOT target an arbitrary count.

The rule is:

> the reviewed multi-source N5/N4 union must contain no unexplained gaps.

Counts are outputs.

Not goals.

It is acceptable if the final canonical curriculum ends up around:

```text
N5 ~70–100 canonical concepts

N4 ~90–140 canonical concepts
```

or another sensible result after canonicalization.

Do not stop because a previous prompt suggested 60–80 or 80–120.

Those were approximate planning ranges, not ceilings.

---

# C8. CANONICALIZE VARIANTS

Do not create separate lessons for superficial variants.

Example:

```text
ないといけない

なくてはいけない

なければならない
```

may form one obligation family with multiple variants.

But semantically distinct patterns must remain distinct.

Example:

```text
そうだ
appearance

vs

そうだ
hearsay
```

These need distinct semantic treatment even though the surface form matches.

---

# C9. N5 MINIMUM GRAMMAR SANITY CHECK

The final N5 inventory must explicitly audit the following areas.

This is not the exhaustive inventory.

It is a minimum sanity list.

## Copula / noun predicates

```text
です

だ

じゃない

ではない

ではありません

でした

だった

じゃなかった

ではありませんでした
```

---

## Core particles

```text
は

が

を

に

へ

で

と

の

も

から

まで

や
```

Teach multiple functions where relevant.

Do NOT reduce particles to one English gloss.

---

## Demonstratives / questions

```text
これ
それ
あれ

この
その
あの

ここ
そこ
あそこ

どこ
だれ
なに
いつ
どう
どうして
どうやって
どんな
```

---

## Sentence-final functions

```text
よ

ね
```

and other reviewed N5 forms where justified.

---

## Verb morphology

```text
polite non-past

polite negative

polite past

polite past negative

dictionary form

ない form

て form

た form

plain positive/negative
```

---

## Adjectives

```text
い-adjective
な-adjective

present
negative
past
past negative
noun modification
adverbial use where appropriate
```

---

## Existence

```text
ある
いる
```

with:

```text
に
が
```

contrasts.

---

## Preference / desire

```text
好き
嫌い
欲しい
たい
```

---

## Requests / permission / prohibition

```text
ください

てください

ないでください

てもいい

てはいけない

なくてもいい
```

---

## Obligation

```text
ないといけない

なくてはいけない
```

plus reviewed related variants.

---

## Invitation / suggestion

```text
ませんか

ましょう

ましょうか
```

---

## Experience / representative actions

```text
たことがある

たり〜たりする
```

---

## Time / sequence

```text
前に

あとで

てから

とき
```

---

## Intention

```text
つもり
```

---

## Advice

```text
ほうがいい
```

---

## Reason / connection

```text
から

ので

けど
けれど
けれども

でも

そして

それから
```

---

## Comparison

```text
より

ほうが

一番

どちら

の中で〜が一番
```

---

## Degree / limitation

```text
だけ

とても

あまり〜ない

もう

まだ

まだ〜ていない

すぎる
```

where supported.

---

## Purpose / movement

```text
V stem + に行く

V stem + に来る
```

---

## Method

```text
方
```

---

## Explanation

```text
んです

のです
```

where supported by the reviewed inventory.

## Current implementation status (2026-09-04)

- [x] An ease/difficulty lesson now teaches やすい, にくい, and づらい with four examples, two common mistakes, and two authored drills per concept, plus a two-question contrast cluster. やすい and にくい carry exact reviewed Irodori mapping references; づらい remains explicitly authored with its source boundary visible.

---

# C10. N4 MUST BECOME A REAL FULL CURRICULUM

The existing handful of canonical N4 concepts is only a bridge.

Build the full reviewed N4 inventory.

At minimum audit these major systems.

---

# C11. CONDITIONALS

## Current implementation status (2026-09-04)

- [x] A reviewed four-pattern conditional cluster now teaches と, たら, ば, and なら in a dedicated N4 lesson, with formation, semantic conditions, restrictions, four natural examples, two common mistakes, two contrast-oriented sentence-completion drills per pattern, one contrast card, and four Irodori provenance mappings. Broader N4 coverage and native review remain open.

Teach and contrast:

```text
と

たら

ば

なら
```

Include:

```text
formation

common semantic conditions

natural context

restrictions

contrast questions
```

This should become one major grammar cluster.

---

# C12. POTENTIAL

## Current implementation status (2026-09-04)

- [x] A reviewed potential-ability cluster now teaches godan potential forms, ichidan られる, and ことができる in a dedicated N4 lesson, with formation, object/ability usage, passive-confusion restrictions, four examples, two common mistakes, two comparison drills per pattern, one contrast card, and three Irodori provenance mappings. Passive, causative, and broader N4 coverage remain open.

Support:

```text
potential verb forms

れる

られる

ことができる
```

Include relation/differences.

---

# C13. PASSIVE

## Current implementation status (2026-09-04)

- [x] A reviewed passive pair now teaches godan and ichidan passive formation in a dedicated N4 lesson, with basic affected-person/agent structure, four examples, two common mistakes, two context drills per pattern, one passive-vs-potential contrast card, and two Irodori provenance mappings. Broader passive and indirect-passive coverage remains open.

Support:

```text
れる

られる
```

with basic N4 sentence structure.

Do not confuse passive with potential.

---

# C14. CAUSATIVE

## Current implementation status (2026-09-04)

- [x] A reviewed causative pair now teaches godan せる and ichidan させる in a dedicated N4 lesson, with basic make/let function, causee marking, four examples, two common mistakes, two context drills per pattern, one causative contrast card, and two Irodori provenance mappings. Causative-passive and broader N4 coverage remain open.

Support reviewed N4 causative patterns such as:

```text
せる

させる
```

with clear formation and basic function.

---

# C15. VOLITIONAL

## Current implementation status (2026-09-04)

- [x] A reviewed volitional lesson now teaches よう／おう formation and planning/intention use with と思います／と思っています, four examples, two common mistakes, two authored drills, and one Irodori provenance mapping. Broader N4 coverage remains open.

Support:

```text
よう

おう
```

and related planning/intention use.

---

# C16. GIVING / RECEIVING

## Current implementation status (2026-09-04)

- [x] A compact N4 perspective lesson now teaches basic あげる／くれる／もらう and links them to the existing てあげる／てくれる／てもらう contrast card, with four examples, two perspective mistakes, two authored drills, and three Irodori mappings. Starter-level source evidence for the basic forms remains visible as an N4 level disagreement; broader politeness and benefactive nuance remain open.

Teach as one coherent perspective system:

```text
あげる

くれる

もらう

てあげる

てくれる

てもらう
```

Use visual perspective explanations where useful.

---

# C17. て-FORM EXTENSIONS

## Current implementation status (2026-09-04)

- [x] The listed て-form family is now complete in the authored N4 expansion: existing てみる／ておく／てしまう／ていく／てくる plus new てある and ていた, each with four examples, two common mistakes, and two authored drills; てある and ていた have two Irodori mappings. Broader reviewed N4 extensions remain open.

Audit/include:

```text
てみる

ておく

てしまう

ていく

てくる

てある

ていた
```

and any additional reviewed N4 patterns.

---

# C18. CHANGE / HABIT / DECISION

## Current implementation status (2026-09-04)

- [x] A change/habit/decision lesson now contrasts ようになる, ようにする, ことになる, ことにする, 予定だ, and つもり with four examples, two common mistakes, and two authored drills per authored concept. ようになる, ようにする, and ことになる carry five exact Irodori mapping references; 予定だ is explicitly authored with no direct cached source mapping yet.

Audit/include:

```text
ようになる

ようにする

ことになる

ことにする

予定だ
```

Teach in contrast.

---

# C19. MODALITY / INFERENCE

## Current implementation status (2026-09-04)

- [x] A modality/inference lesson now contrasts appearance and hearsay そうだ with ようだ, みたい, らしい, かもしれない, はず, に違いない, and に決まっている. The four new concepts have four examples, two common mistakes, and two authored drills each; seven exact Irodori mappings now cover the appearance/hearsay and inference family, and two independent cluster questions test source and certainty strength.

Audit/include families such as:

```text
そうだ
appearance

そうだ
hearsay

ようだ

みたい

らしい

かもしれない

はず
```

This needs strong contrast testing.

---

# C20. QUOTATION / THOUGHT

## Current implementation status (2026-09-04)

- [x] A quotation/thought lesson now teaches と思う, と言う, と聞く, and という with four examples, two common mistakes, and two authored drills per concept, plus a two-question contrast cluster. Exact Irodori mappings cover each concept; the 思う and 言う records visibly retain their Elementary 1 source-level disagreement with the authored N4 placement.

Audit/include:

```text
と思う

と言う

と聞く

という
```

---

# C21. NOMINALIZATION / CAPABILITY

## Current implementation status (2026-09-04)

- [x] A nominalization/capability lesson now contrasts こと and の as action nouns with ことができる for ability and dictionary form + ことがある for occasional events. The three new concepts have four examples, two common mistakes, and two authored drills each; four exact Irodori mappings were added, with Elementary 1 source-level disagreements kept visible.

Audit/include:

```text
こと

の

ことができる

ことがある
```

---

# C22. CONTRAST / CONJUNCTION

Audit/include:

```text
のに

ても

し

それに

それでも

けれども
```

and other reviewed N4 connectors.

## Current implementation status (2026-09-04)

- [x] A time/aspect lesson now teaches 間, 間に, ところ, ているところ, たところ, and たばかり with four examples, two common mistakes, and two authored drills per concept, plus a two-question contrast cluster. Four concepts carry four exact reviewed Irodori mapping references; the remaining two are explicitly authored while their source evidence stays review-visible.

## Current implementation status (2026-09-04)

- [x] A contrast/conjunction lesson now teaches のに, ても, し, それに, それでも, and けれども／けど with four examples, two common mistakes, and two authored drills per concept, plus a two-question contrast cluster. Five concepts carry eight reviewed Irodori mapping references; それでも remains explicitly authored with no direct cached source mapping yet.

---

# C23. TIME / ASPECT

Audit/include:

```text
間

間に

ところ

ているところ

たところ

たばかり
```

---

# C24. EASE / DIFFICULTY

Audit/include:

```text
やすい

にくい

づらい
```

where supported by the reviewed inventory.

---

# C25. TRANSITIVE / INTRANSITIVE

Create a coherent learning cluster around:

```text
自動詞

他動詞
```

using useful lexical pairs.

Do not teach only abstract labels.

Example:

```text
ドアが開く

ドアを開ける
```

## Current implementation status (2026-09-04)

- [x] A learner-facing transitivity lesson now pairs 開く／開ける, 閉まる／閉める, 始まる／始める, and 止まる／止める with natural examples, particles, and explicit 自動詞／他動詞 notes. The cluster uses eight authored N4 vocabulary records so the distinction is taught through useful lexical pairs rather than abstract labels.

---

# C26. FULL GRAMMAR LESSON CONTRACT

Every learner-ready canonical grammar item must contain:

```text
pattern

core idea

meaning

formation

plain-language intuition

usage conditions

4–8 examples

common mistakes

prerequisites

aliases / variants

contrast relationships

mini dialogue/context

reading appearances where available

listening appearances where available

practice contexts

assessment contexts
```

Major/high-frequency concepts should receive more examples.

## Current implementation status (2026-09-04)

- [x] `lib/content-completeness-core.js` now audits the full grammar contract alongside the existing depth gate, while `lib/content-validation.ts` warns on missing aliases and dedicated mini-contexts. Content Studio exposes aliases and mini dialogue/context fields in both the editor and review modal, plus a direct Grammar contract queue for the missing records. The current 116-item learner package has 116/116 records with persisted aliases and mini-contexts, 116/116 with two linked assessment contexts, 23 reading appearances, and 5 listening appearances, so all 116 are contract-ready. `data/grammar-contract-fields.json` carries explicit authored fields for all 116 grammar records, and the five N4 bridge records now have context-bearing assessment metadata.

---

# C27. ORIGINAL KIZASHI GRAMMAR CONTENT

Kizashi teaching prose should be internally consistent.

Do not produce a Frankenstein lesson containing:

```text
one site's meaning
another site's example
another site's terminology
another site's explanation style
```

Use external sources as evidence/reference.

Author coherent Kizashi explanations.

---

## Current implementation status (2026-09-04)

- [x] The grammar consistency audit checks all 116 authored grammar records for empty examples, duplicate Japanese examples within one item, and conflicting translations for the same Japanese example. The authored baseline now has 0 duplicate-example items / 0 duplicate rows, 0 translation collisions, and 0 empty examples after the repeated N5 prose was rewritten; shared examples across different concepts remain valid reuse rather than being silently altered.

# C28. GRAMMAR CLUSTERS

Implement explicit grammar families/contrast groups.

At minimum:

```text
PARTICLES
は / が / に / で / を / へ

PERMISSION / OBLIGATION
てもいい
てはいけない
なくてもいい
ないといけない
なくてはいけない

TIME
前に
あとで
てから
とき
間
間に

COMPARISON
より
ほうが
一番

REASON
から
ので
て / で where causal

CONDITIONALS
と
たら
ば
なら

INFERENCE
そう
よう
みたい
らしい
かもしれない
はず

GIVING / RECEIVING
あげる
くれる
もらう

CHANGE / DECISION
ようになる
ようにする
ことになる
ことにする
```

Add more where the final inventory warrants them.

---

# C29. JLPT GRAMMAR QUESTION FAMILIES

Grammar assessment must cover all relevant official item families.

At minimum:

```text
GRAMMAR FORM SELECTION

SENTENCE COMPOSITION / ORDERING

TEXT GRAMMAR
```

Do not equate grammar practice with:

```text
What does X mean?
```

---

# C30. FORM-SELECTION BANK

For each major grammar concept create multiple independent contexts.

Aim approximately:

```text
4+ form-selection contexts
```

for major concepts.

Use plausible distractors from relevant contrast families.

Example:

```text
雨が降った___、出かけませんでした。

ので
のに
ながら
まで
```

The distractors should test grammatical judgment.

Not random words.

---

# C31. SENTENCE-COMPOSITION BANK

Create real sentence-ordering items.

Avoid trivial 2-piece questions.

Where appropriate use:

```text
4–6 segments
```

with:

```text
particle placement

modifier placement

time expression placement

embedded clauses

grammar pattern structure
```

Ensure exactly one natural intended order.

---

# C32. TEXT GRAMMAR BANK

This is currently severely underdeveloped.

## Current implementation status (2026-09-04)

- [x] `validatePracticeQuestions` now requires text-grammar questions to persist a context ID and passage, contain a visible blank, and provide at least four choices as a quality target; connected-passage shape is reported as a warning. The built-in fallback carries the same context metadata.
- [~] The 125 authored text-grammar drafts remain review-only until each passage, distractor set, and answer key receives human linguistic review; `validatePracticeQuestions` now also blocks locally generated draft questions from activation unless approved reviewer and timestamp metadata are present.

Build a dedicated text-grammar corpus.

A text-grammar asset contains:

```text
short connected passage

2–5 grammar blanks where appropriate

discourse context

one defensible answer per blank
```

Example structure:

```text
昨日、友達と買い物に行きました。
新しいかばんがほしかったです。
＿＿＿、いいかばんは高かったです。
何も買いませんでした。
```

The learner must choose based on the flow of the text.

Not merely the nearest noun.

---

# C33. TEXT GRAMMAR TARGETS

Initial target:

```text
N5:
at least 50 independent text-grammar passages

N4:
at least 75 independent text-grammar passages
```

Each passage must be an independent context.

Multiple blanks in one passage do NOT count as multiple independent contexts.

Quality overrides count.

---

# C34. GRAMMAR UNIQUE-CONTEXT METRIC

Content Studio now reports the persisted authored grammar assessment bank separately: it currently has 92 approved N5 grammar questions across 92 normalized contexts and 55 approved N4 grammar questions across 55 normalized contexts (147 form-selection, 5 sentence-ordering, and 0 text-grammar contexts), including 6 contrast-cluster questions and 125 text-grammar drafts pending review in `data/n5-grammar-assessment-drafts.json` (50 N5 / 75 N4), each with persisted context IDs/text for review. The context metric prefers explicit `contextSetId`/`contextText` values, so variants of one passage can be collapsed instead of counted as new contexts; the aggregate and per-family counts use the same deduplication. Generated fallback drills and unreviewed drafts are not counted as learner-ready assessment coverage. The metric prevents question quantity from being mistaken for contextual depth; the documented N5/N4 text-grammar targets remain unapproved until review.

The validator now enforces the persisted context contract for text-grammar questions before they can enter the validated practice path; it does not approve linguistic quality automatically.

Content Studio must report:

```text
grammar questions

unique grammar assessment contexts

form-selection contexts

sentence-ordering contexts

text-grammar contexts
```

Do not count:

```text
same sentence with noun swapped
```

as a new context.

---

# C35. VOCABULARY — COMPLETE COVERAGE AUDIT

## Current implementation status (2026-09-04)

- [x] `scripts/build_lexical_coverage_registry.mjs` builds `data/lexical-coverage-union.json` from cached OpenJLPT, Irodori, Marugoto, released Kizashi modules, and the staged package; Content Studio exposes the resulting review surface.
- [~] The current registry reports N5 1,704 union records (153 covered, 534 partial, 1,017 missing) and N4 1,850 union records (8 covered, 625 partial, 1,217 missing). Status is level-specific; level disagreements and ambiguous forms remain visible. These counts are evidence, not a completeness claim.

Vocabulary quantity is already large.

The new task is CURATED COMPLETENESS.

Build:

```text
N5 vocabulary coverage registry

N4 vocabulary coverage registry
```

from multiple sources.

Use:

```text
OpenJLPT

JMdict

existing Kizashi

Irodori

Marugoto

JLPT-oriented coverage lists

frequency evidence where available
```

Do not treat one list as official.

---

# C36. VOCABULARY COVERAGE STATUS

Each canonical word should have:

```text
canonical ID

written form

reading

meanings

part of speech

N5/N4 evidence

source claims

frequency/commonness

coverage status

teaching status
```

Audit:

```text
covered

partial

missing

duplicate

ambiguous
```

---

# C37. N4 VOCABULARY NEEDS USAGE CONTENT

## Current implementation status (2026-09-04)

- [x] The sixteen authored N4 vocabulary bridge items now carry one explicit natural-usage assessment each: a complete Japanese sentence plus three authored distractors. `lib/questions.ts` emits these as `usage` questions; the broader staged N4 vocabulary reservoir still needs the same reviewed treatment.

N4 vocabulary assessment should include:

```text
contextual meaning

paraphrase

usage in a sentence

orthography

reading
```

Especially add true usage questions.

Example:

```text
Which sentence uses 約束 naturally?
```

Then four complete Japanese sentences.

Do not make all N4 vocab practice translation MCQ.

---

# C38. VOCABULARY CONTEXT CONTRACT

## Current implementation status (2026-09-04)

- [~] `lib/content-completeness-core.js` now reports the vocabulary context contract by level, and `lib/content-validation.ts` warns when high-frequency (`commonness >= 5`) records have fewer than two examples. The current 169-record package has 169 records with two examples (153/153 N5 and 16/16 N4), 169 with collocations and related words, 0 with persisted audio, 0 approved contextual/paraphrase assessment links, 169 contextual and 169 paraphrase drafts staged for review in `data/vocabulary-assessment-drafts.json`, 16 N4 usage assessments, and 0 records meeting the full audit contract; generated drafts remain excluded from learner-ready coverage, and draft-generated questions cannot become active without explicit review metadata. Content Studio's pending question queue now filters these drafts by question family. The current package leaves 0 high-frequency records for that warning queue.

Important words should ideally have:

```text
2+ sentence examples

common collocations

related words

confusable words where relevant

audio

contextual assessment

paraphrase assessment

usage assessment for N4
```

High-frequency words deserve more.

---

# C39. COLLOCATION QUALITY

## Current implementation status (2026-09-04)

- [~] Content Studio now exposes a structural collocation audit: the current 169-record package has 169 populated records, 169 with at least two entries, 0 duplicate rows, and 0 headword-only entries. This catches isolated or repeated values; CEJC/BCCWJ/JMdict/Irodori/Marugoto source quality and native naturalness still require source-backed human review.

Use the already available:

```text
CEJC

BCCWJ

JMdict expressions

Irodori

Marugoto
```

to prioritize useful combinations.

Examples:

```text
写真を撮る

電車に乗る

薬を飲む

時間がかかる

気をつける

予約をする

約束を守る
```

Do not teach words as isolated translation pairs only.

---

# C40. KANJI — COMPLETE COVERAGE AUDIT

## Current implementation status (2026-09-04)

- [x] The same lexical union reports N5 125 kanji records (80 covered, 45 partial, 0 missing) and N4 166 records (2 covered, 159 partial, 5 missing), with multi-source, ambiguity, level-disagreement, and useful-word depth fields.
- [~] The authored package now gives all 81 N5 kanji a 3-word useful-word teaching set; the two N4 bridge kanji in the N5 package also meet that depth. The registry's 3+ metric is review-visible, while native-speaker review of those examples and the full N4 path remain open.

Do not acquire another giant kanji source.

Build:

```text
N5 canonical kanji inventory

N4 canonical kanji inventory
```

using multiple JLPT-oriented lists and existing evidence.

Audit:

```text
covered

partial

missing

level disagreement

duplicate
```

---

# C41. TEACH KANJI THROUGH WORDS

## Current implementation status (2026-09-04)

- [x] Authored kanji records carry useful words with readings and meanings; Learn/Library and Content Studio render those word-centered teaching sets, and the question generator derives word-to-reading, word-to-kanji, reading-in-context, and kanji-in-context prompts from them. Source-union depth and native example review remain open.

Shift emphasis away from isolated abstract readings.

A core kanji item should prioritize:

```text
meaning

3–6 useful words

reading inside each word

context sentence

confusable characters

component/radical if useful
```

Do not require learners to memorize every possible reading.

---

# C42. KANJI QUESTION MIX

## Current implementation status (2026-09-04)

- [x] The existing question generator includes kanji reading, kana recall, kanji meaning, orthography, word-to-kanji recall, reading-in-context, and kanji-in-context families; isolated reading prompts remain one part of the mix rather than the only interaction.

Use:

```text
word → reading

reading → written form

kanji in context

word selection

orthography

confusable-kanji discrimination
```

Use isolated:

```text
What is one reading of 生?
```

only as reinforcement.

Not as the main model.

---

# C43. READING — QUANTITY IS CURRENTLY ENOUGH

Do NOT immediately generate another giant reading bank.

The current:

```text
N5 60
N4 55
```

is sufficient for an initial bank.

The next task is QUALITY.

---

# C44. READING QUALITY AUDIT

## Current implementation status (2026-09-04)

- [~] `lib/content-quality-core.js` now audits authored reading passages for normalized template uniqueness, near-duplicate clusters, question-family distribution, answer-choice presence/uniqueness/index validity, linked vocabulary/grammar/kanji load ranges, structural distractor signals, source type, and N5/N4 breakdown. The current 115-passage bank provides 143 questions across 11 families, including at least three each of reason, reference, simple inference, and appropriate action, is 115/115 unique with 0 near-duplicate clusters and 0 structural answer-choice failures; topic, grammar/vocabulary calibration, distractor plausibility, and native review remain open.

Audit all original reading assets for:

```text
template similarity

topic diversity

sentence-pattern diversity

answer uniqueness

distractor plausibility

length calibration

target-level grammar

target-level vocabulary

kanji load

question-type diversity

information-retrieval realism
```

---

# C45. READING NEAR-DUPLICATE AUDIT

## Current implementation status (2026-09-04)

- [x] The quality core normalizes punctuation and numeric variation, compares compact character-bigram similarity, and exposes near-duplicate clusters globally and by level. The current reading bank reports 0 clusters; this remains a review signal rather than an automatic rejection.

Flag assets differing only through:

```text
names

numbers

dates

shops

nouns

answer order
```

Compute:

```text
near-duplicate clusters

unique structural templates

topic counts
```

Do not weaken the threshold simply to retain target counts.

---

# C46. READING QUESTION DIVERSITY

## Current implementation status (2026-09-04)

- [~] The authored reading bank now has 143 questions across 115 passages, adding main-idea, sequence, reason, reference, simple-inference, condition-detail, task-based-response, and appropriate-action prompts to the existing short-detail, mid-length, and information-retrieval families. Structural answer-choice checks pass; broader family coverage, distractor plausibility, level calibration, and native review remain open.

Ensure substantial coverage of:

```text
specific detail

main point

reason

sequence

reference

appropriate action

simple inference

information retrieval
```

Do not let:

```text
literal detail extraction
```

dominate.

---

# C47. INFORMATION-RETRIEVAL MATERIAL SHOULD LOOK REAL

## Current implementation status (2026-09-04)

- [~] The 27 authored information-retrieval readings now carry explicit visual formats and render generated WebP scene support plus Kizashi-owned accessible HTML reading aids for notices, menus, timetables, schedules, posters, directions, and other practical formats in `components/learning/reading-panel.tsx`. Japanese remains real text below the image/layout; generated images contain no learner-facing text, intrinsic dimensions avoid layout shift, and source-backed realism, broader layout variety, and native review remain open.

Create original visual assets for assessment reading.

Examples:

```text
train timetable

bus timetable

menu

store poster

opening-hours notice

library notice

event flyer

class schedule

appointment sheet

simple map

coupon

school notice

clinic hours

museum information
```

These should look plausibly Japanese.

Do NOT merely put plain text into a bordered paragraph.

---

# C48. ORIGINAL VISUAL ASSETS

## Current implementation status (2026-09-04)

- [~] The shared `ReadingPanel` now renders eight generated WebP scene assets reused by format plus Kizashi-original HTML layouts for the 27 practical reading assets, using declared format metadata, compact notice cards, menu/sale grids, timetable/schedule tables, Japanese typography, and structured rows while keeping the accessible text passage intact. `lib/learning-visual-assets.ts` centralizes the generated-raster source/license/attribution metadata and both learner surfaces consume it. Images are atmospheric/no-text support, lazy-loaded with intrinsic dimensions; Japanese stays in HTML for accuracy and accessibility. Broader layout variety and native review remain open.

Create Kizashi-original layouts.

Do not copy existing commercial posters or timetables.

Use:

```text
realistic information structure

Japanese typography

simple iconography

station/notice visual language

authentic spacing
```

This should also reinforce the Path Through Japan aesthetic.

---

# C49. LISTENING — QUANTITY IS CURRENTLY ENOUGH

The current:

```text
N5 80

N4 80
```

is sufficient for initial volume.

The next task is NATURALNESS AND DIVERSITY.

---

# C50. LISTENING NATURALNESS AUDIT

Audit all original scenarios for:

```text
repeated script structure

same conversation skeleton

noun substitution

unnaturally textbook speech

repetitive politeness

same speaker relationship

same situations

weak distractors

obvious answers

unnatural discourse markers

N4 that merely feels like longer N5
```

---

# C51. LISTENING CONTEXT DIVERSITY

## Current implementation status (2026-09-04)

- [~] The quality report and Content Studio now count listening context tags separately from question families and expose deterministic dialogue-structure signals; the current 160-item authored bank covers 20 contexts, with all 160 records assigned a context tag, split into 80 three-turn `A-B-A` and 80 four-turn `A-B-A-B` profiles, with 92/160 correct answers repeating transcript wording. These are review signals for repeated structure and answer leakage, not automatic quality verdicts; situation balance, speaker relationships, distractor plausibility, and native naturalness review remain open.

Ensure substantial variety:

```text
station

home

school

university

store

restaurant

café

workplace

library

phone call

appointment

travel

weather

meeting

shopping

clinic

event

friend conversation

teacher/student

customer/staff
```

Use more as appropriate.

---

# C52. N4 LISTENING MUST FEEL QUALITATIVELY HARDER

## Current implementation status (2026-09-04)

- [~] The authored listening generator now gives N4 a distinct four-turn dialogue path with schedule/condition/sequence dependency cues, while N5 retains the shorter three-turn path. The current audit measures N5 at 3.0 lines / 44 characters on average and N4 at 4.0 lines / 94 characters, with cue markers in 80/80 N4 items; this is a structural difficulty signal, not a substitute for level calibration or native review.

N4 difficulty should include more:

```text
implicit references

longer dependency

speaker intention

contrast

schedule changes

multiple relevant facts

reasoning from context

natural filler

short reformulation

less direct answer wording
```

Not merely:

```text
N5 dialogue + 3 extra sentences.
```

---

# C53. HUMAN SOURCE NATURALNESS REFERENCE

Use:

```text
Irodori

Erin

Japanese with Shun

Nihongo con Teppei

Marugoto
```

as NATURALNESS REFERENCES.

Do not copy their scripts into original Kizashi assessment material unless the source boundary explicitly permits that use.

---

# C54. ADD VISUAL VERBAL-EXPRESSION QUESTIONS

## Current implementation status (2026-09-04)

- [x] The authored listening generator adds scene metadata to all verbal-expression items; Lesson and Practice render four generated raster situation assets with accessible descriptions, while the audio/transcript remains the primary listening task.
- [x] Pronunciation now has a learner-visible Immersion activity with 20 authored lessons (15 N5 foundation, 5 N4 reinforcement) and 60 discrimination exercises covering mora timing, long vowels, small っ, ん, contracted sounds, devoicing awareness, rhythm, segmentation, intonation, and pitch awareness; browser audio fallback and optional OJAD exploration are used without making pitch a JLPT gate.
- [x] Dictation now derives 155 explicit activities from the authored listening bank: N5 has 15 word, 15 phrase, 30 sentence, 8 dialogue-gap, and 7 key-information tasks; N4 has 25 phrase, 35 sentence, 10 dialogue-gap, and 10 key-information tasks. It reuses audio, kana/formatting-tolerant normalization, mistake recording, and answer-difference feedback.
- [x] Output now derives 80 speaking situations (40 N5 / 40 N4), 60 writing prompts (25 N5 / 35 N4), 119 pragmatic contexts, and 296 vocabulary collocations from the released package through `lib/output-core.js` and the Real life lane. It preserves source evidence, target levels, frequency fields, and self-check/model behavior; automatic open-response grading and inferred canonical grammar mappings remain out of scope.

The JLPT listening blueprint includes verbal-expression tasks using visual context.

Add Kizashi-original situational images/illustrations.

Example:

```text
[person arrives late]

What should they say?

すみません、遅れました。
いただきます。
いってきます。
お大事に。
```

---

# C55. VISUAL LISTENING ASSET TYPES

Create original images for:

```text
meeting someone

entering a room

asking directions

paying at a shop

dropping something

offering a seat

arriving late

leaving home

returning home

ordering food

passing an object

asking for help

waiting at a station

using an elevator

school/class situations
```

Ensure visual ambiguity does not create multiple correct answers.

---

# C56. VISUAL ASSET STYLE

Use the same Kizashi visual language as the Path Through Japan addendum.

Preferred:

```text
restrained illustrated situational scenes

Japanese environmental context

clean composition

no speech text inside the image unless the task requires signage
```

Do not make them anime reaction images.

---

# C57. PRONUNCIATION CURRICULUM IS STILL REQUIRED

Build a real pronunciation learning sequence.

At minimum:

```text
mora timing

long vowels

small っ

ん

contracted sounds

vowel devoicing awareness

Japanese rhythm

basic intonation

pitch-accent awareness
```

Do not make pitch accent mandatory for N5/N4 completion.

---

# C58. PRONUNCIATION LESSON BANK

Create a real bank rather than one demonstration page.

Suggested initial structure:

```text
N5 foundation:
10–15 pronunciation lessons

N4 reinforcement:
5–10 additional lessons
```

Each lesson should include:

```text
explanation

hearing examples

discrimination exercises

listen-repeat activity

words

short phrases

sentence examples
```

---

# C59. PRONUNCIATION DISCRIMINATION BANK

Create at least:

```text
50+ discrimination items
```

covering:

```text
long vowel

small っ

mora count

contracted sound

ん

rhythm
```

Quality > count.

---

# C60. DICTATION — EXPAND CONTENT DEPTH

## Current implementation status (2026-09-04)

- [x] `lib/dictation-core.js` derives 155 current activities from authored listening material: 75 N5 and 80 N4 across word, phrase, sentence, dialogue-gap, and key-information modes. Immersion exposes the lanes with existing audio fallback, normalization, mistake recording, and answer-difference feedback.

The existing dictation feature is currently mostly:

```text
existing listening transcript
→ hear
→ type full transcript
```

Keep that mode but expand.

---

# C61. DICTATION LEVELS

Implement:

```text
WORD

PHRASE

SHORT SENTENCE

FULL SENTENCE

DIALOGUE GAP-FILL

KEY-INFORMATION RECONSTRUCTION
```

---

# C62. DICTATION PROGRESSION

N5:

```text
word
→ phrase
→ short sentence
```

N4:

```text
longer sentence
→ dialogue gap
→ key-information reconstruction
```

---

# C63. DICTATION BANK TARGETS

Initial target:

```text
N5:
30 word/phrase
30 sentence
15 gap/reconstruction

N4:
25 phrase/sentence
35 sentence
20 gap/reconstruction
```

Do not create fake variety with number substitution.

---

# C64. OUTPUT CONTENT IS CURRENTLY TOO SMALL

## Current implementation status (2026-09-04)

- [x] The guided output lane now derives 80 speaking situations (40 N5 / 40 N4), 60 writing prompts (25 N5 / 35 N4), 119 pragmatic contexts, and 296 vocabulary collocations from released listening, reading, and vocabulary records.
- [~] This first expansion preserves source IDs, target levels, frequency fields, model reveal/audio, and non-JLPT scoring. Self-ratings now reuse the shared review scheduler under namespaced output IDs without polluting canonical mistake queues. Canonical grammar mapping for chunks and human-source pragmatics review remain follow-up quality work.

---

# C65. SPEAKING BANK

Target initially:

```text
N5
30–50 situations

N4
30–50 situations
```

Examples:

```text
introduce yourself

order food

ask a price

ask permission

ask where something is

invite someone

decline politely

describe yesterday

talk about plans

explain a reason

compare two things

give simple advice
```

---

# C66. WRITING BANK

Target:

```text
N5
20–30 prompts

N4
30–40 prompts
```

Examples:

```text
self-introduction

daily routine

message

meeting arrangement

short diary

invitation

reply

trip description

reason/explanation

comparison

short email

event description
```

---

# C67. PRAGMATICS BANK

Create a substantial situational pragmatics bank.

Initial target:

```text
50–100 contexts
```

Teach functions such as:

```text
soft refusal

requesting repetition

showing agreement

hesitation

offering

accepting

declining

apologizing

asking permission

responding to thanks

responding to invitations

softening statements
```

Use human source evidence where possible.

---

# C68. CHUNK / COLLOCATION BANK

Build several hundred high-value chunks progressively from existing vocabulary.

Start with:

```text
200–400 reviewed high-value chunks
```

rather than thousands.

Examples:

```text
写真を撮る

電車に乗る

薬を飲む

宿題をする

予約をする

時間がかかる

気をつける

約束を守る

道に迷う

電気をつける
```

---

# C69. CHUNK LEVEL MAPPING

Each chunk should record:

```text
target level

head vocabulary

grammar used

spoken/written relevance

frequency evidence

source evidence
```

Do not label every common phrase N5 merely because the words are simple.

---

# C70. REMAINING IMMERSION PROVIDERS

## Current implementation status (2026-09-04)

- [x] Marugoto Plus, JFS Reading Activities, KC Yom Yom, Hirogaru, and OJAD have learner-visible provider-hosted registry entries and Immersion detour coverage.
- [x] Japanese with Shun has a validated official YouTube channel-feed catalog with selectable provider-hosted video URLs and an official channel fallback; Kizashi stores no media.
- [x] Nihongo con Teppei has a validated official-site RSS catalog with selectable provider-hosted audio URLs and an official-site episode fallback; Kizashi stores no audio.
- [~] The shared provider manifest now exposes bounded activity maps for Marugoto Plus (Can-do conversation/listening/pronunciation), JFS Reading Activities (menus/notices/prices), KC Yom Yom (graded-reader topics, audio/length/progress fields), Hirogaru (interest topics), and OJAD (optional prosody references), with source-level, JLPT-relevance, target, and provenance fields kept separate. Broader provider catalogs, validated per-activity source audits, and deeper provider-specific activities remain partial.

Verify whether the following content-source integrations actually landed.

Do not assume because they appear in planning docs.

Audit:

```text
Marugoto Plus

JFS Reading Activities

KC Yom Yom

Hirogaru

OJAD
```

---

# C71. MARUGOTO

If incomplete, implement learner-visible metadata/provider integration for:

```text
conversation

pronunciation

Can-do

listening

situational Japanese
```

Do not reduce it to vocabulary imports.

---

# C72. JFS READING

If incomplete, index learner-visible practical reading activities such as:

```text
menus

notices

opening hours

advertisements

emails

shop information
```

Map to:

```text
N5/N4 relevance

reading skill

grammar overlap

vocabulary overlap
```

---

# C73. KC YOM YOM

If incomplete, index:

```text
title

source level

topic

audio availability

length

progress

source URL
```

as extensive reading.

---

# C74. HIROGARU

If incomplete, add an interest-driven Immersion lane using its actual topic metadata.

Use for:

```text
reading

video

culture

interest-based exploration
```

Do not turn it into exam material.

---

# C75. OJAD

If incomplete, add optional pronunciation/prosody reference links.

Do not make it required for N5/N4 progression.

---

# C76. CONTENT STUDIO — FINAL COMPLETENESS DASHBOARD

## Current implementation status (2026-09-04)

- [x] `components/content/completeness-dashboard.tsx` and `lib/content-completeness-core.js` expose live package metrics for quantity, N5/N4 counts, Journey lesson assignment, required learner-field completeness, review workflow status, unique reading/listening contexts, N5/N4 reading/listening question families and duplicate clusters, reading answer-choice integrity, grammar assessment families/contexts, grammar prose consistency findings, vocabulary context-contract findings including pending contextual/paraphrase draft counts, structural collocation quality, and a grammar-depth gate (4 examples, 2 mistakes, and 2 reviewed practice links); the completeness core also computes the grammar lesson-contract audit. Visual listening-question count, the separate pronunciation bank (20 lessons / 60 discrimination items / 10 topics), derived dictation lanes/counts, and output-bank counts remain visible.
- [~] The dashboard is an audit surface, not a substitute for linguistic review: source union coverage now includes exact mapped grammar source-pattern labels alongside naturalness, near-duplicate detection, and the remaining grammar/vocabulary/kanji quality work, which still require the deeper audits below.

Extend Content Studio to report:

```text
JLPT CONTENT COMPLETENESS
```

---

# C77. GRAMMAR PANEL

Show:

```text
N5 union candidates

N5 canonical concepts

N5 complete

N5 partial

N5 missing


N4 union candidates

N4 canonical concepts

N4 complete

N4 partial

N4 missing
```

---

# C78. VOCABULARY PANEL

Show:

```text
N5 canonical vocabulary

covered

partial

missing

N4 canonical vocabulary

covered

partial

missing
```

---

# C79. KANJI PANEL

Show:

```text
N5 canonical kanji

covered

partial

missing

N4 canonical kanji

covered

partial

missing
```

---

# C80. GRAMMAR ASSESSMENT PANEL

The dashboard now reports form-selection, sentence-ordering, text-grammar, contrast-cluster, and unique-context counts, including N5/N4 question totals, plus a separate grammar-depth gate that only counts reviewed practice links. All 116 learner-ready N5/N4 grammar items now meet the 4-example, 2-mistake, and 2-practice-link gate, while the broader lesson-contract audit remains partial and text-grammar remains pending review.

Show:

```text
form selection

sentence ordering

text grammar

unique contexts

contrast-cluster questions
```

by level.

---

# C81. READING QUALITY PANEL

Show:

```text
short

mid

information retrieval

unique templates

near-duplicate clusters

question-family distribution
```

by level.

---

# C82. LISTENING QUALITY PANEL

Show:

```text
task-based

key point

verbal expression

quick response

visual verbal-expression items

unique scenarios

near-duplicate clusters
```

by level.

---

# C83. NON-JLPT CONTENT PANEL

Show:

```text
pronunciation lessons

pronunciation discrimination items

dictation items

speaking prompts

writing prompts

pragmatics contexts

chunks
```

---

# C84. NO FAKE COMPLETENESS

Do not display:

```text
100% grammar complete
```

simply because every item in the current local dataset is covered.

Completeness must be measured against the coverage registry.

Same for:

```text
vocabulary

kanji
```

---

# C85. COVERAGE DISAGREEMENT UI

Content Studio should be able to show:

```text
前に

Kizashi:
N5 extended

Source A:
N5

Source B:
N4

Source C:
A2

Confidence:
medium

Reason:
common N5 inventory presence; retained as N4 prerequisite
```

This prevents level claims from becoming mysterious.

- [x] Grammar disagreements expose canonical evidence/source IDs and level conflicts, while the lexical coverage panel now shows a bounded queue of per-source N5/N4 claims for records with disagreements; aggregate counts remain visible for the full review queue.

---

# C86. QUALITY GATE — GRAMMAR

A grammar concept is COMPLETE only if:

```text
coverage evidence exists

canonical classification reviewed

meaning exists

formation exists

intuition exists

usage conditions exist

>=4 examples

common mistakes exist

practice exists

assessment exists

relevant contrasts exist
```

---

# C87. QUALITY GATE — VOCABULARY

An important canonical vocabulary item is COMPLETE only if it has:

```text
written form

reading

meaning

part of speech

source evidence

example sentence

context assessment

orthography/reading assessment

collocation or useful phrase where applicable
```

---

# C88. QUALITY GATE — KANJI

A core kanji item is COMPLETE only if:

```text
meaning

useful words

word readings

level evidence

context use

orthography/reading practice
```

---

# C89. QUALITY GATE — READING

A reading counts toward the assessment bank only if:

```text
level validated

length sane

grammar/vocab sane

one defensible answer

distractors plausible

not near-duplicate

appropriate question family
```

---

# C90. QUALITY GATE — LISTENING

A listening scenario counts only if:

```text
level validated

natural script

one defensible answer

family valid

not near-duplicate

context distinct

speech synthesis works

transcript review works
```

---

# C91. IMPLEMENTATION ORDER

Follow this order approximately.

## 1

Audit current exact content state.

## 2

Build grammar coverage source acquisition.

## 3

Build grammar union/canonical registry.

## 4

Complete N5 grammar inventory.

## 5

Complete N4 grammar inventory.

## 6

Enrich all incomplete canonical grammar lessons.

## 7

Build grammar clusters.

## 8

Expand grammar form-selection bank.

## 9

Expand sentence-ordering bank.

## 10

Build dedicated N5/N4 text-grammar bank.

## 11

Build vocabulary coverage registry.

## 12

Resolve N5 vocab gaps.

## 13

Resolve N4 vocab gaps.

## 14

Build kanji coverage registry.

## 15

Resolve N5 kanji gaps.

## 16

Resolve N4 kanji gaps.

## 17

Audit reading quality.

## 18

Replace/rewrite weak or near-duplicate reading assets.

## 19

Improve information-retrieval visual assets.

## 20

Audit listening naturalness.

## 21

Rewrite weak/repetitive listening scenarios.

## 22

Add visual verbal-expression questions.

## 23

Build pronunciation curriculum.

## 24

Expand dictation bank.

## 25

Expand speaking/writing/pragmatics/chunks.

## 26

Verify remaining provider integrations.

## 27

Extend Content Studio completeness dashboards.

## 28

Run QA/tests/build.

---

# C92. DO NOT DO

Do NOT:

```text
add another giant vocab source just for counts

add another giant kanji source just for counts

treat 413 grammar rows as complete grammar

copy whole JLPT Sensei lessons

copy whole Bunpro lessons

copy official JLPT questions

copy third-party assessment content

blindly accept one provider's level labels

target arbitrary concept counts

stop N5 grammar at 40 concepts

stop N4 grammar at 5 concepts

call source-only grammar a learner-ready lesson

generate 100 more reading passages before auditing the current bank

generate 100 more listening scripts before auditing the current bank

count noun-swapped templates as new content

make N4 merely longer N5

use random grammar distractors

ignore text grammar

ignore vocabulary usage questions

overemphasize isolated kanji readings

turn pronunciation into pitch-accent memorization

make speaking/writing affect JLPT readiness
```

---

# C93. REQUIRED FINAL REPORT — GRAMMAR

Report:

```text
N5 grammar union raw patterns

N5 canonical concepts

N5 complete

N5 partial

N5 missing


N4 grammar union raw patterns

N4 canonical concepts

N4 complete

N4 partial

N4 missing


aliases mapped

duplicate families collapsed

level disagreements

high-confidence unresolved gaps
```

---

# C94. REQUIRED FINAL REPORT — GRAMMAR ASSESSMENT

Report:

```text
N5:
form-selection questions
sentence-ordering questions
text-grammar passages
unique grammar contexts

N4:
form-selection questions
sentence-ordering questions
text-grammar passages
unique grammar contexts
```

---

# C95. REQUIRED FINAL REPORT — VOCABULARY

Report:

```text
N5 canonical vocab
covered
partial
missing

N4 canonical vocab
covered
partial
missing

usage questions
context questions
paraphrase questions
orthography questions
```

---

# C96. REQUIRED FINAL REPORT — KANJI

Report:

```text
N5 canonical kanji
covered
partial
missing

N4 canonical kanji
covered
partial
missing

kanji-with-useful-words
context questions
orthography questions
reading-in-word questions
```

---

# C97. REQUIRED FINAL REPORT — READING

Report:

```text
N5 short
N5 mid
N5 information retrieval

N4 short
N4 mid
N4 information retrieval

near-duplicate clusters found
assets rewritten/rejected
unique template count
question-family distribution
```

---

# C98. REQUIRED FINAL REPORT — LISTENING

Report:

```text
N5 task
N5 key point
N5 verbal expression
N5 quick response

N4 task
N4 key point
N4 verbal expression
N4 quick response

visual verbal-expression items

near-duplicate clusters

scripts rewritten

unique scenario count
```

---

# C99. REQUIRED FINAL REPORT — GENERAL JAPANESE CONTENT

Report:

```text
pronunciation lessons

pronunciation discrimination items

dictation:
word
phrase
sentence
gap
reconstruction

speaking prompts

writing prompts

pragmatics contexts

chunks/collocations
```

---

# C100. REQUIRED FINAL REPORT — PROVIDERS

Report implementation status for:

```text
Irodori

Erin

Marugoto

JFS Reading

KC Yom Yom

Tadoku

Hirogaru

Japanese with Shun

Nihongo con Teppei

Tatoeba

Commons / Lingua Libre

OJAD

Aozora
```

Use:

```text
fully implemented

partial

metadata-only

not implemented
```

and explain any partial status.

---

# C101. DEFINITION OF DONE

This addendum is complete only when:

* N5 grammar is comprehensive according to a reviewed multi-source coverage union;
* N4 grammar is comprehensive according to a reviewed multi-source coverage union;
* grammar variants are canonicalized intelligently;
* grammar families/clusters exist;
* no high-confidence N5/N4 grammar gap remains unexplained;
* N5/N4 vocabulary coverage has been audited against a multi-source union;
* N5/N4 kanji coverage has been audited against a multi-source union;
* important vocabulary has contextual/usage depth;
* core kanji are taught primarily through useful words;
* grammar-form selection is deeply represented;
* sentence composition is deeply represented;
* text grammar is deeply represented;
* reading quantity is no longer confused with reading quality;
* near-duplicate reading material is detected and repaired;
* information-retrieval assets look like real Japanese information structures;
* listening naturalness has been audited;
* repeated listening templates have been repaired;
* N4 listening is qualitatively harder than N5;
* visual verbal-expression questions exist;
* pronunciation has a real curriculum;
* dictation has multiple difficulty modes;
* speaking/writing/pragmatics/chunks contain real banks rather than demo examples;
* remaining useful provider integrations are either complete or explicitly reported as partial;
* Content Studio can distinguish:

  * quantity,
  * completeness,
  * quality,
  * unique contexts;
* tests pass;
* production build passes.

The final content test is:

```text
If a learner studies only Kizashi from beginner level
through N5 and then N4:

Would they encounter essentially every grammar family
they are reasonably expected to know?

Would they have the core vocabulary and kanji coverage
expected for those levels?

Would they have practiced grammar in the same TYPES
of contexts the JLPT actually uses?

Would they have seen enough genuinely different reading
and listening contexts that unfamiliar material does not
feel like a completely different skill?

Would N4 feel like a meaningful increase in Japanese
complexity, rather than simply "more N5"?

Would the app teach Japanese,
rather than merely store Japanese data?
```

If any answer is no, the content milestone is not complete.
