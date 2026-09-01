# KIZASHI SOURCE-INTEGRATION MILESTONE

Work in the existing repository:

`AnujJha27/Kizashi`

The repository already contains a significant source/content architecture.

DO NOT build a second parallel source system.

Before changing anything, inspect at minimum:

* `README.md`
* `HANDOFF.md`
* `docs/product/CONTENT-SOURCES.md`
* `docs/product/SOURCE-EVALUATION.md`
* `lib/types.ts`
* `lib/audio.ts`
* `lib/immersion-core.js`
* `components/learning/immersion-surface.tsx`
* `components/learning/external-source-launcher.tsx`
* `components/learning/external-source-viewer.tsx`
* `lib/content-validation.ts`
* `lib/dictionary-import.ts`
* `scripts/build_phase1_staging.py`
* the existing `scripts/ingest_irodori_*` scripts
* the current Supabase provenance/audio migrations
* relevant tests

First summarize the existing architecture and identify which existing abstractions can be extended.

Then implement the following sources as first-class Kizashi integrations:

1. Tae Kim's Guide to Japanese
2. Wikibooks Japanese
3. Wikimedia Commons / Lingua Libre Japanese pronunciation
4. Aozora Bunko
5. Free Tadoku Books
6. Irodori

The objective is NOT “add six external links.”

Each source should have a specific pedagogical role inside Kizashi.

The learner should encounter the source naturally while:

* learning grammar,
* hearing vocabulary,
* studying a lesson,
* reading Japanese,
* doing immersion,
* or looking for an alternative explanation.

---

# 1. PRODUCT PRINCIPLE

Kizashi should feel like one learning system.

The user should not have to think:

> Now I am using Kizashi.
> Now I am using Tae Kim.
> Now I am using Irodori.
> Now I am using Tadoku.

Instead Kizashi should surface the right external resource at the right learning moment.

Example:

```text
〜てもいい

Kizashi explanation
Formation
Examples
Mistakes
Practice

────────────────────

別の見方
Another explanation

Tae Kim
A more structural explanation of this pattern.

[ Read explanation ↗ ]

Wikibooks
Reference treatment and related grammar.

[ Open reference ↗ ]
```

Similarly:

```text
食べ物
たべもの

food

[ ▶ Human pronunciation ]

Lingua Libre · human recording
```

The external-source layer should complement the Kizashi curriculum.

It must NOT replace:

* reviewed JLPT classification,
* JMdict lexical truth,
* KANJIDIC2 kanji truth,
* Kizashi mastery,
* Kizashi questions,
* Kizashi SRS.

---

# 2. DO NOT DUPLICATE EXISTING ARCHITECTURE

The repository already has:

* `BrowserSpeechProvider`
* `RemoteAudioProvider`
* reserved `ServerTTSProvider`
* `AudioMetadata`
* source provenance
* `fieldSourceIds`
* `learning_item_sources`
* Content Studio review status
* an Immersion page
* external-source launch/frame components
* Irodori ingestion scripts
* local source-cache/staging workflow

Extend these.

Do NOT introduce unrelated frameworks or another content database.

---

# 3. CENTRALIZE EXTERNAL RESOURCES

The current Immersion source shelf is partly hard-coded in:

`components/learning/immersion-surface.tsx`

Refactor external learning resources into one typed registry.

Suggested location:

```text
lib/external-resources.ts
```

or an equivalent clean module.

Create a reusable model roughly like:

```typescript
type ExternalResourceMode =
  | "reference"
  | "remote-media"
  | "frame-or-link"
  | "link-only"
  | "dynamic"
  | "import";

interface ExternalResource {
  id: string;

  sourceId: string;
  name: string;

  title?: string;
  description?: string;

  resourceType:
    | "grammar-reference"
    | "pronunciation"
    | "graded-reader"
    | "native-reading"
    | "lesson"
    | "listening"
    | "reference";

  level?: string;

  url: string;

  deliveryMode: ExternalResourceMode;

  targetItemIds?: string[];
  targetSkills?: string[];
  tags?: string[];

  license?: string;
  attribution?: string;

  transformAllowed?: boolean;

  metadata?: Record<string, unknown>;
}
```

Do not force this exact type if existing types suggest a cleaner solution.

The important requirement is that source metadata no longer lives scattered across UI components.

---

# 4. SOURCE 1 — TAE KIM

## Role

Tae Kim should be an:

**alternative grammar intuition / structural explanation source**

It is NOT the canonical JLPT syllabus.

It should never overwrite Kizashi's primary grammar explanation automatically.

---

## Integration

For grammar points, support:

```text
別の見方
Alternative explanations
```

Example:

```text
は vs が

Kizashi explanation
...

────────────

Tae Kim
Japanese-first structural explanation

[ Read ]
```

Map relevant Kizashi grammar points to specific Tae Kim sections.

Do not merely link every grammar page to the Tae Kim homepage.

Create specific deep links.

---

## Source mapping

Add a source mapping mechanism such as:

```text
data/source-maps/tae-kim.json
```

Example:

```json
{
  "grammar-wa": {
    "sectionTitle": "Topic particle",
    "url": "...",
    "relationship": "alternative-explanation"
  }
}
```

Only map concepts when the relationship is meaningful.

---

## Optional source ingestion

A local source-cache importer may retrieve selected Tae Kim material for review.

If implemented:

```text
scripts/ingest_tae_kim.py
```

must:

* cache source material under ignored `data/source-cache/`
* preserve URL
* preserve retrieval date
* preserve license
* preserve section title
* emit review-only candidates
* never silently replace authored Kizashi explanations

Source-derived explanations must remain distinguishable from Kizashi-authored explanations.

---

# 5. SOURCE 2 — WIKIBOOKS JAPANESE

## Role

Wikibooks should serve as:

* supplementary grammar reference
* particle reference
* counters reference
* conjugation reference
* pronunciation reference
* pitch-accent overview where relevant
* deeper lookup for concepts that do not deserve a full Kizashi lesson

---

## Prefer the MediaWiki API

Do not scrape rendered HTML unnecessarily.

Build a small server-side adapter around the MediaWiki API.

Possible structure:

```text
lib/sources/wikibooks.ts
app/api/reference/wikibooks/route.ts
```

The adapter should support:

```typescript
getWikibooksSection({
  page,
  section?
})
```

Return sanitized structured data.

Cache responses appropriately.

Do NOT write Wikibooks content into Supabase merely because it was fetched.

---

## Grammar UI

Grammar detail should be able to show:

```text
参考
REFERENCE

Wikibooks · Japanese

Particles
→ は
→ が
→ を

[ Open reference ]
```

If a useful small excerpt is shown in-app:

* retain attribution
* retain license
* retain source URL
* keep it visually distinct from Kizashi-authored text

---

# 6. SOURCE 3 — WIKIMEDIA COMMONS / LINGUA LIBRE

This should be the most technically integrated new source.

## Role

Use Commons/Lingua Libre as a:

**dynamic human-pronunciation resolver**

Do NOT download the audio library.

Do NOT upload it to Supabase.

Resolve and stream recordings only when requested.

---

# 7. COMMONS AUDIO RESOLVER

Create something like:

```text
lib/sources/commons-audio.ts
app/api/audio/commons/route.ts
```

Flow:

```text
Japanese word / phrase
        ↓
existing explicit human audio?
        ↓ no
query Wikimedia Commons
        ↓
exact compatible Japanese recording?
        ↓ yes
RemoteAudioProvider
        ↓ no
BrowserSpeechProvider
```

---

## Search priority

When resolving:

```text
食べ物
```

prefer, in order:

1. exact Japanese label match
2. exact reading/word match
3. Lingua Libre Japanese pronunciation category
4. other clearly Japanese pronunciation recordings
5. fallback to Browser Speech

Do NOT fuzzy-match unrelated words just because filenames look similar.

False pronunciation is worse than TTS.

---

## Commons API

Use Wikimedia/MediaWiki APIs.

Do not screen-scrape Commons pages.

Request only the metadata needed.

Use `imageinfo` / `extmetadata` to retrieve things such as:

* remote audio URL
* file page URL
* mime/media type
* creator / artist
* attribution
* license short name
* license URL
* usage terms
* source

Only accept actual audio files.

---

## License-aware resolver

Do not assume every Wikimedia file has the same license.

Inspect each file's metadata.

Return:

```typescript
{
  url,
  filePage,
  label,
  speaker,
  license,
  licenseUrl,
  attribution,
  source: "wikimedia-commons",
  collection: "lingua-libre"
}
```

The audio player can show a subtle info control:

```text
▶ 食べ物

Human recording · Lingua Libre
ⓘ
```

The attribution should be available without cluttering the study card.

---

# 8. AUDIO FALLBACK

Integrate this into the EXISTING audio flow.

Do not replace `lib/audio.ts`.

Conceptually:

```text
explicit external recording
        ↓
Commons resolver
        ↓
browser Japanese speech
```

Do not add a Commons recording to Supabase Storage.

Optional metadata caching is allowed, but audio blobs are not.

---

## Cache

Use lightweight caching.

Good options:

* Next server fetch caching
* browser/local cache of successful resolutions
* short metadata cache

Do NOT create a giant persistent audio table unless there is a demonstrated need.

Cache misses too so repeatedly looking up nonexistent recordings does not hammer Commons.

---

# 9. SOURCE 4 — AOZORA BUNKO

## Role

Aozora becomes:

**native reading / long-term immersion**

This is primarily N3+ and enrichment content.

It should not clutter the user's current N5 Journey.

---

# 10. AOZORA CATALOG

Create:

```text
scripts/fetch_aozora_catalog.py
```

Use Aozora's published UTF-8 bibliographic CSV rather than scraping author pages one-by-one.

Cache it under:

```text
data/source-cache/
```

Do NOT commit the entire downloaded catalog if the project source-cache convention excludes it.

Store/review metadata such as:

```typescript
{
  workId,
  personId,
  title,
  author,
  cardUrl,
  textUrl?,
  orthography?,
  copyrightStatus,
  source
}
```

Only automatically offer in-app text for works whose metadata indicates that copyright has expired / is reusable under Aozora's applicable handling rules.

Do not automatically ingest still-protected works.

---

# 11. AOZORA READING EXPERIENCE

Add an Aozora section to the reading/immersion library.

Example:

```text
青空文庫
NATIVE READING

羅生門
芥川龍之介

Native difficulty · ★★★★☆
Known vocabulary · 72%
Length · 5,100 characters

[ Read ]
```

Difficulty should NOT be a fake JLPT certification.

Calculate an estimate from signals such as:

* vocabulary coverage against Kizashi/JMdict
* kanji coverage
* text length
* sentence length
* known-item coverage

Label it clearly as an estimated reading difficulty.

---

## Dynamic reading

Do not dump the Aozora corpus into Supabase.

For selected reusable works:

```text
Aozora metadata
      ↓
user presses Read
      ↓
fetch public source text
      ↓
normalize
      ↓
render in Kizashi reader
```

Use server-side fetching where browser CORS makes direct loading unreliable.

Cache responsibly.

---

## Reader integration

Reuse Kizashi's existing:

* Japanese text handling
* known vocabulary
* kanji knowledge
* furigana policies
* study-later behavior

Unknown words should link back to Kizashi/JMdict.

Example:

```text
羅生門

ある日の暮方の事である。

        ↓ tap 暮方

暮方
くれがた
evening / dusk

[ Study later ]
```

Do not modify Aozora source text to create fake "simplified Aozora."

---

# 12. SOURCE 5 — FREE TADOKU BOOKS

## Role

Tadoku becomes the:

**graded extensive-reading shelf**

Unlike Aozora, this is useful immediately at beginner level.

---

# 13. TADOKU DELIVERY BOUNDARY

Tadoku Free Books are derivative-restricted.

Therefore:

DO NOT:

* extract a Tadoku book and rewrite it
* generate questions from its text
* alter its illustrations
* create Kizashi translations from the book
* sentence-mine the entire work automatically into published Kizashi content

Instead:

* preserve the original work
* link/frame where technically permitted
* use provider-hosted content
* track that the user opened/read the resource

---

# 14. TADOKU READING SHELF

Add a polished Reading Shelf.

Example:

```text
多読
TADOKU

Start
─────────────────

どうぞどうも

Level · Start
Audio · available
Length · short

[ Read original ↗ ]

────────

Level 1
...
```

Support:

* Tadoku level
* genre
* audio availability
* approximate length where published
* reading progress marker
* opened/read status

Do not copy book pages simply to make cards look prettier.

If framing is allowed:

use the existing ExternalSourceViewer.

If framing is blocked:

fall back cleanly to the original source page.

---

# 15. SOURCE 6 — IRODORI

IMPORTANT:

Kizashi ALREADY contains:

```text
scripts/ingest_irodori_wordlist.py
scripts/ingest_irodori_sentence_patterns.py
scripts/ingest_irodori_kanji.py
```

DO NOT recreate this ingestion pipeline.

Extend it.

---

# 16. IRODORI'S ROLE

Irodori should provide:

* practical beginner vocabulary
* communicative sentence patterns
* useful beginner kanji
* Can-do goals
* natural situational dialogue
* listening material
* practical Japanese contexts

Its material should enrich the N5 curriculum without pretending Irodori levels are JLPT classifications.

---

# 17. IRODORI LESSON MAPPING

Introduce mappings like:

```text
Irodori
初級1 · Lesson X

Can-do:
Order food politely

maps to:

Kizashi:
grammar-kudasai
grammar-wo
vocab-gohan
...
```

Store source mapping separately from JLPT classification.

Irodori is communicative evidence, not JLPT truth.

---

# 18. IRODORI RESOURCE MANIFEST

Add an importer/manifest generator for resource metadata if needed:

```text
scripts/ingest_irodori_resources.py
```

It should capture:

* course
* lesson
* Can-do
* official source URL
* available resource types
* listening/audio availability
* relevant target items
* source terms/provenance

Do not store large Irodori audio files in Supabase.

---

# 19. IRODORI AUDIO

Where an official provider-hosted audio URL is suitable for direct playback:

```text
Irodori remote MP3
      ↓
RemoteAudioProvider
```

Otherwise:

```text
Irodori lesson
      ↓
ExternalSourceViewer / launcher
```

Never require copying audio into Kizashi just to support playback.

---

# 20. IRODORI IN LEARN / JOURNEY

When a Kizashi lesson overlaps strongly with an Irodori Can-do, surface it naturally:

```text
TODAY

Ordering food
Kizashi · N5 Core

...

REAL-WORLD PRACTICE

Irodori · 初級1
Order something at a restaurant

[ Practice with Irodori ↗ ]
```

That is much more useful than hiding Irodori inside a source administration page.

---

# 21. REFERENCE UX

Create a reusable source-reference component.

Possible component:

```text
components/learning/source-reference-panel.tsx
```

It should support:

```text
Alternative explanation
Reference
Human pronunciation
Graded reader
Real-world practice
Native reading
```

Do not make source provenance look like a legal form.

Normal learner UI:

```text
別の見方

Tae Kim
Why this particle works this way

[ Read ]
```

Detailed attribution/license information can live behind:

```text
ⓘ Source
```

---

# 22. IMMERSION PAGE REORGANIZATION

The current Immersion page mixes listening exercises and a general source shelf.

Refine it into useful learner sections.

Suggested structure:

```text
聞く
LISTEN

Ear warm-up
Natural listening
Shadowing

──────────────

読む
READ

Tadoku
Beginner graded reading

Aozora
Native reading

──────────────

実際の日本語
REAL JAPANESE

Irodori
Situational practice

Erin's Challenge
Situational dialogue

──────────────

参考
REFERENCE

Tae Kim
Wikibooks
```

Do not necessarily create four routes.

Use judgment based on current navigation.

The important point is that the source shelf should be organized by **what the learner wants to do**, not by publisher.

---

# 23. MOBILE UX

All source integrations must work well on mobile.

Requirements:

### Audio

One-tap playback.

Large play target.

Show human vs synthetic source subtly.

No tiny attribution text blocking the main interface.

### Reading

Tadoku/Aozora cards must be thumb-friendly.

Aozora reader:

* comfortable Japanese typography
* no horizontal scrolling
* adjustable font size
* furigana behavior consistent with the rest of Kizashi
* resume position locally

### Reference

Alternative grammar explanations should use collapsible cards/drawers rather than navigating through several pages.

---

# 24. PROVENANCE

Use the existing provenance system.

Every source-derived field must remain attributable.

Do not invent a second provenance representation unless existing structures cannot express the requirement.

Where appropriate preserve:

```text
sourceId
source URL
license
retrievedAt
fieldSourceIds
attribution
source-specific item/page URL
```

Distinguish:

```text
Kizashi authored
source-derived
source reference
external hosted content
```

---

# 25. SOURCE-SPECIFIC RIGHTS BEHAVIOR

Treat source terms as engineering constraints.

Do not insert generic moral commentary into the app or documentation.

Use the existing source evaluation pattern.

For each new source:

1. record current first-party terms,
2. record exact integration behavior,
3. implement that behavior,
4. move on.

Update:

```text
docs/product/CONTENT-SOURCES.md
docs/product/SOURCE-EVALUATION.md
```

with these six integrations.

---

# 26. TAE KIM HANDLING

Record:

```text
CC BY-NC-SA
```

Keep attribution and ShareAlike metadata attached to source-derived/adapted material.

Do not silently relabel adapted Tae Kim prose as Kizashi-authored content.

---

# 27. WIKIBOOKS HANDLING

Record the relevant Wikibooks CC BY-SA / GFDL handling.

For reused/adapted text:

* attribution must remain available
* source page must remain identifiable
* source-derived material must remain separable from Kizashi-authored content

Prefer API-backed reference loading over copying huge sections.

---

# 28. COMMONS / LINGUA LIBRE HANDLING

Do not assume a global recording license.

Read each file's actual metadata.

Accept compatible files only.

Persist or expose the relevant:

```text
file page
creator
license
license URL
attribution
```

Do not infer speaker identity beyond source-provided metadata.

---

# 29. AOZORA HANDLING

The bibliographic catalog can be used as source metadata.

Only automatically ingest/render source text when its rights status qualifies under the current Aozora handling rules.

Keep protected works out of automatic content import.

---

# 30. TADOKU HANDLING

Treat free Tadoku material as unchanged hosted reading material.

It should remain:

```text
read/listen at source
```

rather than:

```text
copy → modify → quiz generator
```

---

# 31. IRODORI HANDLING

The app is a private single-user learning system.

Use Irodori within its current personal/educational use boundary.

Keep:

* attribution
* source relation
* source-specific resource metadata

Do not dump its entire media library into Supabase.

---

# 32. STORAGE REQUIREMENT

This milestone should result in almost no meaningful increase in Supabase Storage usage.

Specifically:

```text
Commons audio       → remote
Lingua Libre audio  → remote
Irodori audio       → remote/provider-hosted
Tadoku              → provider-hosted
Tae Kim             → text/reference metadata
Wikibooks           → API/reference
Aozora              → dynamic public source fetching
```

Supabase Storage remains for genuinely private/persistent assets such as the user's books.

Do not create an audio mirror.

---

# 33. CONTENT STUDIO

Add useful source visibility to Content Studio.

For a grammar item:

```text
Sources

✓ Kizashi authored
✓ Tae Kim reference mapped
✓ Wikibooks reference mapped
✓ Irodori sentence pattern
```

For vocab:

```text
JMdict
BCCWJ
Irodori
Human audio: Lingua Libre
```

Allow reviewers to inspect provenance without manually reading JSON.

---

# 34. SOURCE COVERAGE

Create lightweight source coverage diagnostics.

Example admin summary:

```text
SOURCE COVERAGE · N5

Grammar
Tae Kim mappings         38 / 61
Wikibooks mappings       45 / 61

Vocabulary
Lingua Libre audio       214 / 620

Irodori overlap          287 items

Reading
Tadoku                    42 resources

Native reading
Aozora                    enabled
```

These numbers must come from actual data/resolution results.

Do not fake coverage percentages.

---

# 35. FAILURE BEHAVIOR

Every external integration needs graceful degradation.

### Commons unavailable

Use BrowserSpeechProvider.

### Wikibooks API unavailable

Show the normal Kizashi explanation and source launcher.

### Tae Kim unavailable

Kizashi grammar remains fully usable.

### Tadoku blocks iframe

Open original page.

### Aozora unavailable

Show saved catalog metadata and retry/open source.

### Irodori media unavailable

Keep Kizashi lesson functional and expose original lesson link.

No core lesson should fail because an external source is offline.

---

# 36. TESTS

Add tests for at least:

### Commons resolver

* exact Japanese match
* non-audio result rejected
* incompatible/missing license rejected
* attribution retained
* fallback requested when no recording exists
* cache behavior

### Aozora

* catalog parsing
* copyright-status filtering
* URL/card mapping
* text normalization
* protected work rejection

### Grammar mappings

* Tae Kim mappings resolve
* Wikibooks mappings resolve
* missing external source never breaks grammar page

### Irodori

* existing ingestors still pass
* lesson-resource mapping
* Can-do mapping does not become JLPT classification

### Tadoku

* source entries remain non-transformable
* link fallback remains available

### General

* source provenance survives serialization
* external failure never blocks learner content

Run:

```text
node tests
TypeScript check
Next production build
git diff --check
```

using the repository's established commands.

---

# 37. DO NOT DO THESE THINGS

Do NOT:

* create six unrelated pages with external links
* upload external audio to Supabase
* replace BrowserSpeechProvider
* create another curriculum engine
* treat Irodori/Tae Kim/Wikibooks as official JLPT classifications
* generate quizzes from Tadoku books
* automatically simplify Aozora works and call the result the original
* overwrite Kizashi explanations with imported prose
* copy huge external datasets into Git
* hard-code hundreds of source links inside React components
* make the UI look like a resource directory
* expose giant license warnings during normal study
* remove the existing review/provenance gates

---

# 38. DESIRED LEARNER EXPERIENCE

After this milestone, the following should work.

## Vocabulary

User opens:

```text
食べ物
```

Kizashi shows:

```text
食べ物
たべもの

food

▶ Human voice
Lingua Libre

Examples
Collocations
JLPT metadata
```

If no human recording exists:

```text
▶ Browser Japanese voice
```

without the learner having to care about the fallback.

---

## Grammar

User opens:

```text
〜ている
```

Kizashi teaches it normally.

Below:

```text
別の見方

Tae Kim
Structural explanation

Wikibooks
Reference + related forms
```

---

## Practical reinforcement

A lesson on ordering food can show:

```text
実際に使う

Irodori
Restaurant interaction

[ Practice ]
```

---

## Beginner reading

Immersion shows:

```text
多読

Start
Level 0
Level 1
```

with original Tadoku readers.

---

## Native reading

Later:

```text
青空文庫

羅生門

Known vocabulary · 72%
Native difficulty · High

[ Read ]
```

---

# 39. IMPLEMENTATION PRIORITY

Implement in this order:

1. central external-resource registry/refactor
2. Commons/Lingua Libre dynamic audio resolver
3. grammar-reference framework
4. Tae Kim mappings
5. Wikibooks API/reference adapter
6. Irodori lesson/Can-do/audio enrichment
7. Tadoku reading shelf
8. Aozora catalog + reader
9. Content Studio source diagnostics
10. documentation + tests

Do not start by importing large amounts of content.

First prove every adapter with a small, useful set of real examples.

Then expand systematically.

---

# 40. DEFINITION OF DONE

This milestone is complete when:

* the six sources appear where pedagogically relevant,
* existing Kizashi curriculum remains the backbone,
* grammar pages can surface source-specific alternative references,
* compatible Lingua Libre/Commons pronunciation resolves dynamically,
* browser TTS automatically remains the fallback,
* no external audio is mirrored into Supabase,
* Irodori is integrated beyond raw staging records,
* Tadoku functions as a real beginner reading shelf,
* Aozora functions as a native-reading source,
* all source provenance is preserved,
* mobile behavior is polished,
* external-source failures degrade gracefully,
* existing tests remain green,
* new source tests are added,
* `CONTENT-SOURCES.md` and `SOURCE-EVALUATION.md` accurately document the resulting architecture.

Do not stop at scaffolding.

Implement at least one end-to-end learner-visible example for every source.

