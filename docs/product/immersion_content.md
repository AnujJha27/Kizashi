# PATCH — EXPAND IMMERSION WITH MOSHI MOSHI YUSUKE, NATURAL JAPANESE, AND CURE DOLLY

Repository:

`AnujJha27/Kizashi`

This PATCH extends the existing Kizashi Immersion / `寄り道` provider system.

Do NOT create a second immersion architecture.

Reuse the existing:

```text
provider registry
Immersion discovery feed
Immersion player
YouTube/provider metadata handling
local opened/progress state
level/relevance ranking
Journey-area context
```

already used for providers such as:

```text
Japanese with Shun
Nihongo con Teppei
Irodori
Erin
Hirogaru
Marugoto
```

Add:

```text
もしもしゆうすけ
Moshi Moshi Yusuke

Natural Japanese
NIJ

Organic Japanese with Cure Dolly
```

---

# IM1. THESE ARE NOT THREE IDENTICAL PROVIDERS

Do not dump them into one generic:

```text
More YouTube
```

section.

They serve different learning purposes.

Use approximately:

```text
Moshi Moshi Yusuke
→ real-life Japanese

Natural Japanese
→ comprehensible input

Cure Dolly
→ structural understanding
```

Preserve those distinctions in ranking and presentation.

---

# IM2. MOSHI MOSHI YUSUKE

Canonical identity:

```text
もしもしゆうすけ
Moshi Moshi Yusuke
```

Verify the current official YouTube channel/handle before implementing.

Historically/currently it is associated with:

```text
@moshimoshi.yusuke
```

Do not rely on the handle without verifying it during implementation.

---

# IM3. WHY YUSUKE BELONGS IN KIZASHI

Yusuke is highly aligned with Kizashi because the videos frequently involve ordinary Japanese life:

```text
stations

convenience stores

restaurants

shopping

walking around town

public transport

everyday conversations

native interactions
```

This is almost exactly the real-world layer behind the Journey-world concept.

Treat it as a premium Immersion source.

---

# IM4. YUSUKE CONTENT TYPES

Where metadata allows, classify content approximately as:

```text
Real life

Monologue

Conversation

Walk / town

Practical interaction
```

Do not invent classifications from titles when confidence is low.

Fallback:

```text
Real-life Japanese
```

---

# IM5. JOURNEY MATCHING — YUSUKE

Yusuke videos should receive especially strong Journey-context matches.

Examples:

```text
駅前
Station
→ train / Suica / station videos

商店街
Shopping street
→ shopping / stores

コンビニ
Convenience store
→ konbini interaction

喫茶店・食堂
Café / restaurant
→ ordering / restaurant content

住宅街
Neighborhood
→ walking / daily-life monologue
```

This makes Kizashi feel like:

```text
learn place
↓
visit that kind of place through real Japanese
```

rather than randomly recommending YouTube.

---

# IM6. YUSUKE PRESENTATION

Example card:

```text
寄り道 · REAL JAPANESE

駅で
At the station

もしもしゆうすけ

Real-life Japanese · 8 min
Natural speech
Japanese subtitles

[ Watch ]
```

If English/Japanese subtitles are reliably known from provider metadata, show them.

Otherwise do not make unsupported subtitle claims per video.

---

# IM7. NATURAL JAPANESE

Add:

```text
Natural Japanese
NIJ
```

Verify the current official provider identity and public content endpoints.

Natural Japanese is the current branding associated with the former Comprehensible Japanese / CIJ platform.

Do not create duplicate providers for:

```text
Comprehensible Japanese
CIJ
Natural Japanese
NIJ
```

when they refer to the same continuing resource.

Normalize historical aliases into one provider record.

---

# IM8. NATURAL JAPANESE ROLE

Primary category:

```text
COMPREHENSIBLE INPUT
```

This provider is especially useful for:

```text
beginner listening

visual context

controlled speech

stories

everyday scenarios

dialogues

supported native input
```

It should rank strongly for N5/N4 users.

---

# IM9. NATURAL JAPANESE PUBLIC CONTENT

Integrate freely accessible/public provider content where available.

Prefer:

```text
official public YouTube videos
official provider URLs
provider-hosted thumbnails
```

Do not mirror video files.

Do not copy a paid/private catalog into Kizashi.

If the provider site contains additional material requiring its own account/subscription:

show:

```text
Open in Natural Japanese ↗
```

rather than pretending Kizashi has access.

---

# IM10. NATURAL JAPANESE LEVEL MODEL

Do NOT blindly convert provider levels into JLPT levels.

Maintain:

```text
providerLevel
```

separately from:

```text
kizashiRecommendedLevel
```

Kizashi may infer approximately:

```text
comfortable
stretch
future
```

based on actual vocabulary/grammar overlap.

Do not claim:

```text
Natural Japanese Beginner = JLPT N5
```

unless the provider explicitly says so.

---

# IM11. COMPREHENSION ESTIMATION

Where transcript/subtitle metadata is legally and technically available, optionally estimate compatibility using the learner's known Kizashi vocabulary.

Conceptually:

```text
video known vocabulary
        ↓
compare with learner record
        ↓
Comfortable / Stretch / Challenging
```

Do NOT delay provider integration for this.

Basic metadata integration comes first.

---

# IM12. CURE DOLLY

Add:

```text
Organic Japanese with Cure Dolly
```

Verify the current official YouTube channel and playlist structure before implementation.

This is an archived/inactive educational resource with a substantial existing video catalog.

It should remain available as a stable reference source.

---

# IM13. CURE DOLLY IS NOT NATIVE-LISTENING IMMERSION

Do NOT classify Cure Dolly as:

```text
natural native listening
```

or use it for:

```text
pronunciation model
native-speed listening
shadowing model
```

Its purpose in Kizashi should be:

```text
structural explanation

grammar intuition

Japanese sentence structure

alternative conceptual explanations
```

This distinction is important.

---

# IM14. ADD A GUIDED-UNDERSTANDING LANE

Immersion currently includes real Japanese / listening / reading / detours.

Add or reuse a suitable secondary lane such as:

```text
しくみ
UNDERSTAND JAPANESE
```

or:

```text
考え方
HOW JAPANESE WORKS
```

Use whichever fits current Kizashi UX more naturally.

This lane can contain:

```text
Cure Dolly
selected Tae Kim material
selected grammar/reference detours
```

without mixing them with raw listening exposure.

Do NOT add another primary-navigation page.

It remains inside Immersion.

---

# IM15. CURE DOLLY CURRICULUM MATCHING

Map videos to Kizashi grammar concepts where confidence is high.

Examples may include:

```text
は / が

zero pronouns

Japanese sentence structure

だ

adjectives

verb structure

て-form

relative clauses

particles

conjugation

transitivity
```

Do not automatically map from title substrings only.

Use conservative mapping.

---

# IM16. GRAMMAR-DETAIL INTEGRATION

When a Kizashi grammar item has a mapped Cure Dolly explanation, optionally show:

```text
Another explanation

Organic Japanese with Cure Dolly
12 min

[ Watch ]
```

This should be secondary.

Kizashi's authored grammar explanation remains canonical for the app.

---

# IM17. CURE DOLLY PRESENTATION

Example:

```text
しくみ
HOW JAPANESE WORKS

は and が

Organic Japanese with Cure Dolly

Alternative structural explanation
12 min

Relevant to:
は · が · topic/subject

[ Watch ]
```

Do not frame it as authoritative truth.

Call it:

```text
alternative explanation
structural explanation
another perspective
```

where appropriate.

---

# IM18. PROVIDER MODEL

Extend the existing provider registry rather than inventing separate hard-coded cards.

Conceptually:

```typescript
{
  id: "moshi-moshi-yusuke",
  name: "もしもしゆうすけ",
  englishName: "Moshi Moshi Yusuke",
  type: "youtube",
  immersionRole: "real-life",
  modalities: ["listening", "reading"],
  nativeInput: true
}
```

```typescript
{
  id: "natural-japanese",
  name: "Natural Japanese",
  shortName: "NIJ",
  aliases: [
    "Comprehensible Japanese",
    "CIJ"
  ],
  immersionRole: "comprehensible-input"
}
```

```typescript
{
  id: "cure-dolly",
  name: "Organic Japanese with Cure Dolly",
  type: "youtube",
  immersionRole: "guided-understanding",
  nativeInput: false
}
```

Adapt to the actual provider schema.

Do not duplicate provider infrastructure.

---

# IM19. PUBLIC YOUTUBE CATALOGS

For all applicable providers, prefer dynamic public metadata retrieval over manually hardcoding five videos.

Reuse the current strategy already used for Japanese with Shun where appropriate.

Potential sources:

```text
official YouTube channel feed

official playlist feeds

YouTube metadata already supported by Kizashi
```

Cache conservatively.

---

# IM20. DO NOT SCRAPE YOUTUBE VIDEO FILES

Kizashi should store:

```text
video ID

title

thumbnail URL

provider

duration if available

published date

source URL

local learner state

Kizashi relevance metadata
```

Do NOT store:

```text
video binary

copied YouTube audio

copied subtitles without appropriate source support
```

Use provider-hosted playback.

---

# IM21. YOUTUBE PLAYER

Reuse the existing YouTube/player abstraction if one exists.

Do not create:

```text
YusukePlayer
NaturalJapanesePlayer
CureDollyPlayer
```

as three unrelated components.

Use:

```text
shared provider player
```

with provider-specific metadata/ranking.

---

# IM22. IMMERSION DISCOVERY TAXONOMY

The discovery feed should understand at least:

```text
LISTEN
natural listening

REAL LIFE
real-world interaction

COMPREHENSIBLE
supported learner input

UNDERSTAND
structural explanation

READ
reading

DETOUR
broader exploration
```

Do not necessarily expose all of these as giant tab bars.

They can be ranking/filter metadata.

---

# IM23. CURRENT STACK AFTER THIS PATCH

Kizashi should roughly understand:

```text
Japanese with Shun
→ learner-friendly natural Japanese

Nihongo con Teppei
→ podcast listening

Moshi Moshi Yusuke
→ unscripted everyday Japan

Natural Japanese
→ comprehensible visual input

Irodori
→ practical structured Japanese

Erin
→ situational Japanese

Hirogaru
→ thematic/cultural exploration

Marugoto
→ structured real-life Can-do activities

Cure Dolly
→ structural/grammar understanding
```

That is a genuinely useful ecosystem.

---

# IM24. RECOMMENDATION ENGINE

Do not recommend purely by provider.

Rank based on:

```text
target level

current Journey area

current lesson

weak vocabulary

weak grammar

learner interests

recent providers

content difficulty

content type

duration
```

Provider should be only one signal.

---

# IM25. AVOID PROVIDER MONOCULTURE

Do not let 20 Yusuke videos dominate the entire Immersion feed merely because they all rank similarly.

Apply diversity constraints.

Example:

```text
recommended 6

1 Yusuke
1 Natural Japanese
1 Shun/Teppei
1 structured real-life source
1 reading
1 wildcard/detour
```

Exact strategy may differ.

---

# IM26. IMMERSION FILTERS

If current UI permits compact filtering, useful filters could include:

```text
For me

Real life

Easy input

Listening

Reading

Understand

Short
```

Do NOT create a giant provider selector as the default experience.

Provider selection can remain under:

```text
All sources
```

---

# IM27. "FOR ME" SHOULD REMAIN DEFAULT

The primary experience should still be:

```text
Immersion
寄り道

Recommended for where you are now
```

not:

```text
Choose from 14 content providers
```

Kizashi should make the decision.

---

# IM28. JOURNEY-AREA RECOMMENDATIONS

Example:

```text
駅前
AT THE STATION

Try some real Japanese

────────────

もしもしゆうすけ

Using a train station in Japan
Real life · Stretch

[ Watch ]

────────────

Natural Japanese

Getting on a train
Comprehensible · Comfortable

[ Watch ]
```

This is the ideal relationship between Journey and Immersion.

---

# IM29. CURRENT-LESSON DETOUR

After relevant lesson completion, optionally offer:

```text
寄り道

Hear this in the real world?
```

Then one tightly matched piece of immersion.

Do not automatically launch it.

Do not make it required for progression.

---

# IM30. TRACKING

For external/provider immersion retain lightweight local state:

```text
unopened

opened

started

completed / self-completed

saved
```

Reuse current provider tracking.

Do NOT pretend YouTube playback completion is known if Kizashi does not actually receive that signal.

---

# IM31. SAVE FOR LATER

All three providers should support:

```text
Save
あとで
```

through existing saved-content infrastructure if available.

---

# IM32. SOURCE DETAILS

Allow:

```text
Source info
```

to expose:

```text
provider

original URL

type

why Kizashi recommended it
```

For example:

```text
Recommended because:
駅前 · travel vocabulary · N5 stretch
```

This would be genuinely useful.

---

# IM33. NATURAL JAPANESE HISTORICAL ALIASES

Search/indexing should recognize:

```text
Natural Japanese

NIJ

Comprehensible Japanese

CIJ
```

as the same provider lineage where applicable.

If older stored records use CIJ IDs, migrate/alias them without losing learner state.

---

# IM34. MOSHI MOSHI SEARCH ALIASES

Recognize:

```text
Moshi Moshi Yusuke

Moshimoshi Yusuke

もしもしゆうすけ

Yusuke
```

Do not create duplicate provider records because romanization varies.

---

# IM35. CURE DOLLY SEARCH ALIASES

Recognize:

```text
Cure Dolly

Organic Japanese

Organic Japanese with Cure Dolly
```

---

# IM36. COMMAND PALETTE

If the global search architecture permits, searches such as:

```text
station immersion

Yusuke

Cure Dolly は が

Natural Japanese beginner
```

should surface relevant provider content.

This is useful but lower priority than Immersion integration.

---

# IM37. MOBILE

YouTube/provider playback must remain comfortable on mobile.

Requirements:

```text
responsive player

no horizontal overflow

metadata below player

easy return to feed

save control

next recommendation
```

Do not nest a tiny desktop YouTube page inside an iframe.

Use normal video embeds/provider links.

---

# IM38. EXTERNAL PROVIDER FAILURE

If feed/catalog lookup fails:

retain:

```text
provider card
official channel/source link
```

and any safely cached metadata.

Do not let a provider outage break Immersion.

---

# IM39. CONTENT STUDIO

Add provider diagnostics:

```text
Moshi Moshi Yusuke

catalog reachable
videos indexed
Journey mappings
level mappings
metadata freshness

Natural Japanese

catalog reachable
public videos indexed
historical aliases migrated
level metadata

Cure Dolly

catalog reachable
videos indexed
grammar mappings
```

---

# IM40. DO NOT DO

Do NOT:

```text
mirror provider videos

dump every video into one huge feed

call Cure Dolly native listening

map every Cure Dolly title automatically to grammar

claim NIJ levels equal JLPT levels

make the user choose providers before seeing recommendations

hardcode only 3 random videos forever

create separate players for every YouTube channel

lose Journey context

make external provider content mandatory

copy paid Natural Japanese content

create duplicate CIJ / NIJ providers
```

---

# IM41. IMPLEMENTATION ORDER

1. Audit existing provider registry and Shun/Teppei YouTube/RSS architecture.

2. Verify official current sources for all three providers.

3. Register Moshi Moshi Yusuke.

4. Add dynamic public catalog retrieval/caching.

5. Add Journey-context mappings.

6. Register Natural Japanese with CIJ aliases.

7. Add public catalog retrieval and level/relevance metadata.

8. Register Cure Dolly.

9. Add guided-understanding role.

10. Add conservative grammar mappings.

11. Update recommendation ranking/diversity.

12. Update Immersion discovery UI.

13. Add source/search aliases.

14. Add Studio diagnostics.

15. Test mobile/provider-failure behavior.

16. Run full build/tests.

---

# IM42. DEFINITION OF DONE

This patch is complete when:

* Moshi Moshi Yusuke appears as a first-class real-life Japanese source;
* its public catalog is discoverable beyond a tiny hardcoded sample;
* relevant videos can align with Journey places;
* Natural Japanese appears as a first-class comprehensible-input source;
* historical CIJ naming does not create duplicates;
* public NIJ content is usable without mirroring protected/private content;
* Cure Dolly is available as a structural-understanding resource;
* Cure Dolly is NOT presented as native-listening material;
* Cure Dolly videos can be conservatively connected to relevant grammar;
* all three participate in Kizashi recommendation ranking;
* provider diversity prevents feed domination;
* content plays/opens cleanly on desktop and mobile;
* original provider URLs remain accessible;
* local saved/opened state works;
* external-source failure degrades gracefully;
* Studio can report provider health;
* existing Shun/Teppei/Irodori/etc. integration remains intact.

The desired end state is:

```text
IMMERSION · 寄り道

Your Japanese world

REAL LIFE
もしもしゆうすけ

COMPREHENSIBLE
Natural Japanese

LISTEN
Japanese with Shun
Nihongo con Teppei

REAL-WORLD LESSONS
Irodori
Erin
Marugoto

EXPLORE
Hirogaru

UNDERSTAND
Organic Japanese with Cure Dolly
```

The feed should feel like one intelligently curated Japanese environment, not a bookmarks folder with a prettier background.

## Implementation checkpoint · 2026-09-07

- [x] The shared registry now includes verified Yusuke, Natural Japanese/NIJ, and Cure Dolly identities with distinct roles, aliases, provider-level metadata, separate Kizashi recommendation levels, and Journey-context tags.
- [x] One shared YouTube parser and `/api/immersion/youtube/[provider]` route provide bounded provider-hosted catalogs; the existing player, opened state, interest ranking, channel fallback, and original-source boundary are reused.
- [x] Immersion includes the `しくみ · Understand Japanese` lane for Cure Dolly and Tae Kim. Yusuke titles receive conservative series labels only when an explicit series marker is present.
- [x] Provider video cards now support self-reported `Clear` / `Shaky` / `Missed` comprehension reviews, stored locally by video ID with a timestamp and included in opt-in account sync when enabled; they remain separate from source approval and JLPT readiness. Content Studio reports cached health for the bounded YouTube feeds and preserves the official-channel fallback when a feed is unavailable.
- [~] One conservative, metadata-only Cure Dolly mapping is now reviewed and learner-visible for verb forms, the stem system, and て-form / た-form; it appears both in Immersion and on matching grammar entries through the shared provider-hosted viewer, while the live provider feed is merged with that official video entry without storing media. Broader grammar-to-video coverage remains open until additional provider metadata or reviewed mappings exist.
