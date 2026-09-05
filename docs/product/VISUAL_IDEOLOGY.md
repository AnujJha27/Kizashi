# ADDENDUM — DYNAMIC JOURNEY WORLD, EVOLVING BACKGROUNDS, AND “PATH THROUGH JAPAN” IMPLEMENTATION

Repository:

`AnujJha27/Kizashi`

This is an ADDENDUM to all existing Kizashi implementation prompts, especially:

1. `KIZASHI — N5/N4 CONTENT DEPTH, EXAM BANK, AND IMMERSION MASTER MILESTONE`
2. `ADDENDUM — CONTENT COMPLETENESS, OUTPUT SKILLS, AND ADDITIONAL IMMERSION SOURCES`
3. `ADDENDUM — KIZASHI UX, INFORMATION ARCHITECTURE, AND DAILY LEARNING FLOW`
4. `ADDENDUM — RESTORE THE “PATH THROUGH JAPAN” EXPERIENCE`
5. `ADDENDUM — JLPT N5/N4 CONTENT COMPLETENESS AND QUALITY PASS`

It does NOT supersede, weaken, replace, or postpone any earlier requirement.

This addendum addresses a very specific product failure:

> Kizashi’s original “path through Japan” vision is only partially expressed in the current implementation.

The repository still reflects the original intention that the learner experience should feel like a **slowly evolving Japanese landscape** and a **journey through Japan**.

However, the current implementation still appears to rely largely on static atmosphere assets such as:

```text
/site-atmosphere.png
/journey-hero.png
/daily-journey.png
```

plus a more generic Journey landscape treatment.

That is not sufficient.

The new requirement is:

> the app’s visual world must evolve as the learner progresses.

This is an IMPLEMENTATION task.

Do not stop at:

* concepts,
* notes,
* static mockups,
* comments,
* asset suggestions,
* unfinished manifests,
* placeholder background switching.

Inspect the repository, preserve working behavior, implement the world system end-to-end, and run validation/build/tests.

---

# W1. CORE GOAL

## Code-backed implementation status (2026-09-04)

- [x] `lib/journey-world-core.js` centralizes the current area manifest, lesson/region mapping, N5/N4 area identity, and arrival/lived-in/settled progression stages.
- [x] `components/shell/app-shell.tsx`, `components/journey/journey-overview.tsx`, `components/journey/daily-session.tsx`, and `components/journey/journey-map.tsx` consume the resolved world state for shell atmosphere, Today, the Journey hero, and the route map.
- [x] Shun provider immersion now uses a validated rotating catalog from `/api/immersion/shun`; this remains provider-hosted and stores no media.
- [~] Practical reading material pairs eight generated no-text raster scene assets with Kizashi-owned format-aware HTML visual aids for authored notices, menus, schedules, posters, and directions while preserving Japanese as accessible text; generated learning images hide on load failure so the HTML aid remains usable, `lib/learning-visual-assets.ts` centralizes generated-asset provenance, and richer format variety and screenshot review remain open.
- [~] The manifest now points the Journey hero, Today, and Learn lesson opening/tracker at different generated-raster WebP scenes: eight area-specific scenes for the route/shell, `/world/today.webp` for the morning Today surface, and `/world/lesson-wide.webp` for the focused lesson opening. Each role records source type, creator, license, attribution, focal point, and mood metadata. The route landscape and profile portrait use the area scenes plus restrained CSS overlays for arrival/lived-in/settled cues; area-completion “Arrived / Next stop” handoffs, the N5→N4 “new road” transition, profile scenery, and deliberate desktop/mobile focal points are wired. Practical reading also uses restrained HTML visual aids for authored notices, menus, schedules, and posters. Screenshot review and the final mobile/device visual audit remain.

Kizashi should feel like:

```text
I am moving through Japan as my Japanese improves.
```

This must become visible through:

```text
Journey
Today
app shell atmosphere
lesson openings
milestone completions
Immersion discovery
profile portrait / identity
N5 → N4 transition
```

The learner should not merely read about progress.

They should FEEL that the world around them is changing.

---

# W2. CURRENT PROBLEM TO FIX

The current issue is NOT simply “the UI needs prettier images.”

The actual problem is:

```text
progress
does not yet drive environment
```

Current implementation likely still behaves approximately as:

```text
same site atmosphere
same Journey hero
same Today image
same generic landscape
```

regardless of whether the learner is at the beginning of N5, in the station/shopping area, or transitioning into N4.

This breaks the product fantasy.

---

# W3. REQUIRED PRODUCT SHIFT

Move from:

```text
static Japanese-themed visuals
```

to:

```text
progress-driven world state
```

In other words:

```text
learner progress
        ↓
current journey area
        ↓
environmental visuals
        ↓
background / hero / map / mood / context
```

This logic must be first-class.

Do not implement it as a cosmetic afterthought.

---

# W4. DEFINE A JOURNEY WORLD MODEL

Create or extend a reusable world model.

Conceptually:

```typescript
type JourneyArea = {
  id: string;

  level: "N5" | "N4";

  title: string;
  japaneseTitle: string;

  environment:
    | "arrival"
    | "neighborhood"
    | "home"
    | "shopping-street"
    | "convenience-store"
    | "station"
    | "train"
    | "cafe"
    | "restaurant"
    | "school"
    | "library"
    | "city"
    | "festival"
    | "coast"
    | "mountain-town"
    | "workplace"
    | "museum"
    | "travel";

  lessonIds: string[];

  milestoneLabel?: string;
  description?: string;

  visualAssets: {
    shell: string;
    hero: string;
    lesson: string;
    immersion?: string;
    portrait?: string;
    mobile?: string;
  };

  accents?: {
    primary?: string;
    secondary?: string;
    atmosphere?: string;
  };

  progressionStages?: {
    id: string;
    label: string;
    threshold: number;
    assetOverrides?: Partial<JourneyArea["visualAssets"]>;
  }[];
};
```

Do not over-engineer this into a game engine.

Do not create unrelated complexity.

The purpose is to make curriculum progress produce a world state.

Reuse existing curriculum/journey structures where possible.

---

# W5. COMPUTE CURRENT JOURNEY AREA

Create logic equivalent to:

```typescript
getCurrentJourneyArea(...)
```

This should derive the current area from real learner progress.

Use the best available inputs from the existing architecture, for example:

```text
active target level
active lesson
lesson completion
journey progress
module completion
current route position
```

Do NOT make the journey area a manual theme selector.

The environment must be a consequence of learning progress.

Manual override can exist for debugging/admin, but not as the normal learner pathway.

---

# W6. AREA GRANULARITY

Do NOT change the background every lesson.

That will feel chaotic and unserious.

Instead:

```text
multiple lessons
        ↓
one area
```

Each area should contain enough lessons to build a sense of place.

Example:

```text
Shopping Street
→ 4–6 lessons

Station
→ 4–6 lessons

Restaurant
→ 3–5 lessons
```

Exact mapping depends on current curriculum structure.

The learner should feel they are spending meaningful time in one part of the world before moving on.

---

# W7. N5 WORLD STRUCTURE

Implement N5 as a coherent familiar Japanese town.

A good structure is:

```text
1. 町の入口
   Arrival / first steps

2. 住宅街
   Neighborhood / daily life

3. 家
   Home / routine

4. コンビニ
   Everyday practical Japanese

5. 商店街
   Shopping / quantities / preferences

6. 駅前
   Station district / time / directions / movement

7. 喫茶店・食堂
   Food / requests / interaction

8. 学校・図書館
   study / reading / schedules / notices

9. 町の外
   edge of town / transition forward
```

You may adjust names and grouping to better match the actual curriculum.

But N5 should feel like:

> I am learning to function in a familiar Japanese town.

---

# W8. N4 WORLD STRUCTURE

Implement N4 as an expansion beyond the familiar town.

A good structure is:

```text
N5 familiar town
        ↓
train / bridge / departure transition
        ↓
N4 wider Japan
```

Possible N4 areas:

```text
1. 大きな駅
   larger station / more complex travel

2. 都市の通り
   city district / denser real-life language

3. 大学・仕事
   university/workplace

4. 祭り・イベント
   events / plans / social context

5. 旅館・旅行
   travel / booking / explanations

6. 海辺の町
   coastal town

7. 山の町
   mountain town

8. 町をこえて
   broader movement / independence
```

Again, adapt to the actual curriculum rather than forcing exact names.

N4 should feel like:

> the world got bigger because my Japanese got better.

---

# W9. N5 → N4 MUST BE A VISUAL MILESTONE

This is one of the most important emotional moments in the product.

Do NOT implement N4 as merely:

```text
Target level: N4
```

Instead create a meaningful transition such as:

```text
新しい道
A NEW ROAD

The familiar town is behind you.
A wider Japan has opened.

[ Continue ]
```

Visual motifs can include:

```text
station
platform
train departure
bridge crossing
moving landscape
new district revealed
```

Keep it elegant.

Do not make it melodramatic or game-like.

---

# W10. APP-WIDE WORLD STATE

The current journey area must influence more than one page.

At minimum, use the world state in:

```text
App shell atmosphere
Journey hero / route
Today hero
lesson opening / prelude
Immersion discovery
profile portrait / study identity
major completions
N5 → N4 transition
```

The whole app should feel coherent.

Do NOT limit this system to the Journey page only.

---

# W11. APP SHELL ATMOSPHERE

The overall application shell should respond subtly to the current area.

Examples:

```text
background image / texture
subtle gradient
accent tint
ambient motif
route-line styling
hero overlay tone
```

This should be SUBTLE.

Practice and reading screens must remain usable.

The app shell should not become a noisy photo collage.

Think:

```text
subtle atmospheric continuity
```

not:

```text
wallpaper app
```

---

# W12. TODAY PAGE / SESSION HERO

Today must strongly express the current place.

Example:

```text
[ atmospheric station image ]

駅前
AT THE STATION

N5 · Stop 6

Today · 18 min

Review
8 items

Learn
〜前に

Listen
Irodori · station dialogue

Read
train notice

[ Continue Today ]
```

The Today session should feel like:

> today’s study happens somewhere.

Use the current area to provide that narrative coherence.

---

# W13. JOURNEY PAGE

Journey must become the strongest expression of the world model.

It should answer:

```text
Where am I?
What comes next?
How far have I come?
```

The current location must be visually obvious.

Completed areas, current area, and future areas should be distinguishable.

Use place/environment identity, not merely text labels.

---

# W14. JOURNEY MAP

Strengthen or refactor the existing map / landscape system so that it can visually reflect the current route.

The map should not remain a generic mountain/path illustration regardless of area.

Instead, it should be environment-aware.

Examples:

```text
Neighborhood
houses / narrow street / utility poles / bikes

Shopping Street
storefront silhouettes / awnings / signs

Station
platform / rails / station canopy / city edge

Restaurant
shopfront / noren / warm evening lights

Library / school
institutional quiet / books / notice boards

Train transition
rails / carriage / passing landscape
```

This can be achieved through:

```text
image assets
SVG overlays
scene variants
environment layers
```

Do not rebuild the entire route UI from scratch unless necessary.

But the final result must clearly feel area-specific.

---

# W15. BACKGROUND CHANGES MUST BE PROGRESSION-DRIVEN

This is mandatory.

The background / atmosphere must evolve based on learner progress.

The logic should resemble:

```text
beginning of area
→ arrival version

mid area
→ enriched version

strong / completed area
→ fully revealed / settled version
```

This is extremely important.

Do not reduce the world system to a single image per area if progression stages are feasible.

The original product idea included:

> details revealing as learning progress grows.

Honor that.

---

# W16. PROGRESSION STAGES INSIDE AN AREA

Each area should ideally support 2–3 visual progression stages.

Example:

## Station area

```text
Stage 1
station exterior, quiet, few details

Stage 2
platform visible, more signage, route line brighter

Stage 3
train visible, world feels alive, next destination hinted
```

Example:

## Shopping street

```text
Stage 1
entry street

Stage 2
storefronts emerge, more signs, more life

Stage 3
street feels active, route continues onward
```

Do not make stage changes too flashy.

Subtle evolution is better.

---

# W17. LESSON OPENING SCENE

Each lesson should have the option of opening with an environmental prelude tied to its area.

Example:

```text
駅
AT THE STATION

You are meeting a friend before taking a train.

Today you will:
• talk about time
• say where you are going
• understand station language

[ Begin ]
```

This scene should use area imagery or area styling.

Then the actual lesson UI should transition into a cleaner focused learning mode.

Do not keep large imagery throughout dense study steps.

---

# W18. LESSON FLOW RHYTHM

Use this general rhythm:

```text
ENTER PLACE
visual / environmental

↓
FOCUSED STUDY
clean / quiet / legible

↓
COMPLETION
return to place / show progress
```

This is much better than leaving large visual distractions behind every grammar exercise.

The world should frame learning, not interfere with it.

---

# W19. AREA COMPLETION

Completing a lesson cluster / area should visibly advance the route.

Example:

```text
到着
ARRIVED

商店街
SHOPPING STREET

You can now:
✓ ask prices
✓ understand quantities
✓ describe what you want

Next:
駅前
AT THE STATION

[ Continue ]
```

Do not let area completion feel like generic:

```text
Chapter complete
```

Use the world system to make progress feel spatial.

---

# W20. IMMERSION DISCOVERY SHOULD USE THE WORLD

Immersion must feel like exploring Japan, not browsing provider silos.

The current area or thematic world should influence immersion presentation.

Examples:

```text
At the station
Irodori · Listening

Walking in town
Japanese with Shun · Video

Books & libraries
Hirogaru / reading source

At a café
Erin / situational dialogue
```

Provider names remain visible but secondary.

The learner should feel:

> I am taking a small detour in the world.

---

# W21. DETOUR FRAMING

Optional Immersion can be framed as:

```text
寄り道
DETOUR
```

This should become a coherent motif.

Examples:

```text
short podcast
video
graded reader
cultural content
source-based reading
```

Detours should feel like stepping off the main route for a while.

Do not make them required for core progression.

---

# W22. PROFILE / STUDY PORTRAIT

If the existing Study Portrait / profile identity system permits it, tie it to the current journey world.

Examples:

```text
current environment
season
route progress
milestone reached
```

Early user:

```text
quiet neighborhood / first steps
```

Later:

```text
station / urban district / wider travel context
```

Do not build a separate avatar game.

Environmental identity is enough.

---

# W23. IMAGE USAGE

Yes: use images much more intentionally than the current implementation.

Good places to use them:

```text
Today hero
Journey hero
Journey map scene / transitions
lesson opening
area completion
N5 → N4 transition
Immersion discovery cards
profile portrait / identity
```

Do NOT put giant images behind every exercise screen.

Do NOT attach photos to every small UI card.

Use imagery for atmosphere and orientation.

---

# W24. VISUAL SUBJECT MATTER

Use mostly ordinary lived-in Japan.

Preferred image subjects:

```text
residential streets
small neighborhoods
utility poles
local stations
platforms
shotengai
convenience stores
small cafés
restaurants
bookshops
libraries
school/campus spaces
parks
train interiors
local trains
urban side streets
coastal towns
mountain towns
rainy streets
evening neighborhoods
```

Avoid cliché-dominant imagery.

---

# W25. DO NOT DEFAULT TO JAPAN STEREOTYPES

Avoid overuse of:

```text
Mount Fuji
torii gates
cherry blossom wallpaper
geisha
samurai
neon Shibuya
anime mascots
tourism brochure imagery
```

These can appear rarely if contextually justified.

But the dominant visual identity should be:

> ordinary Japan that the learner is learning to navigate.

---

# W26. IMAGE STYLE

Choose one or two compatible modes.

Recommended:

```text
licensed / appropriate Japanese environmental photography
+
restrained editorial / generated environmental illustration
```

Provider-hosted thumbnails may remain provider-native.

Do not mix random:

```text
flat illustration
anime
watercolor
3D render
stock photo
real photo
```

all together without coherence.

---

# W27. IMAGE SOURCING / LICENSING

All visual assets must be sourced responsibly.

Possible sources include:

```text
existing project assets
appropriately licensed imagery
Wikimedia Commons where suitable
provider-hosted thumbnails where permitted
Kizashi-generated environmental artwork where useful
```

Do NOT hotlink arbitrary copyrighted photography.

Do NOT scrape random images from the web without clear rights or explicit provider use.

Preserve metadata where needed:

```text
source
license
attribution
credit
```

If generated assets are used, keep them stylistically consistent and clearly atmospheric.

---

# W28. JOURNEY VISUAL MANIFEST

Create a centralized visual manifest.

For example:

```typescript
type JourneyVisualManifest = {
  [areaId: string]: {
    title: string;
    japaneseTitle: string;
    level: "N5" | "N4";

    shellImage: string;
    heroImage: string;
    lessonImage: string;
    immersionImage?: string;
    portraitImage?: string;

    mobileImage?: string;

    attribution?: {
      source: string;
      license?: string;
      url?: string;
    };

    progressionStages?: ...
  };
};
```

Do NOT scatter background URLs across many components.

Centralize the world configuration.

---

# W29. SHELL BACKGROUND BEHAVIOR

Implement the app shell so that background changes can occur cleanly and predictably.

The system should support:

```text
crossfade between areas
responsive image variants
mobile-safe cropping
reduced-motion fallback
low-contrast overlay for readability
```

Do not cause layout instability.

Do not make the whole app re-render awkwardly on minor progress changes.

---

# W30. TRANSITIONS

When the current area changes, use restrained transition behavior.

Preferred:

```text
brief fade
crossfade
gentle overlay shift
route-line animation
```

Avoid:

```text
dramatic slides
slow parallax
cutscene-style blocking transitions
```

The point is elegance, not spectacle.

Respect reduced-motion preferences.

---

# W31. RESPONSIVE DESIGN

All area imagery and environment scenes must work on:

```text
desktop
tablet
mobile portrait
```

Do not let important environmental subjects disappear because of bad `object-cover` cropping.

If needed, allow per-area focal metadata.

Example:

```typescript
focalPoint: {
  desktop: "center 40%",
  mobile: "center 30%"
}
```

or another equivalent approach.

---

# W32. PERFORMANCE

Do not destroy performance with giant background assets.

Use:

```text
Next/Image where appropriate
modern formats
responsive sizes
lazy loading
preloading for immediately relevant hero assets
small optimized variants
cached manifests
```

Large offscreen world assets should not block interaction.

The final app should remain snappy.

---

# W33. IMAGE FAILURE FALLBACK

If a background or world image fails to load, the app must remain elegant and usable.

Fallbacks may include:

```text
gradient
pattern
illustrated layer
tinted background
typographic hero
```

Never place essential information only inside an image.

The app must remain fully usable without successful image loading.

---

# W34. ACCESSIBILITY

All world imagery must remain accessible.

Requirements:

```text
sufficient text contrast
meaningful alt text for content-bearing scenes
empty alt text for decorative atmosphere when appropriate
reduced motion support
no readability loss due to imagery
```

Do not create light-text-over-busy-photo disasters.

---

# W35. COLOR / ATMOSPHERE SYSTEM

The core Kizashi palette should remain.

However, areas may have subtle atmosphere shifts.

Examples:

```text
Neighborhood
warm muted neutrals

Shopping Street
amber / warm tones

Station
cool steel blue

Restaurant
warm evening red/brown

Library
quiet slate / muted green

Train transition
blue-grey / twilight travel feel

Coast
cool open tones

Mountain town
earthy / misty tones
```

These should be restrained accents, not entirely separate themes.

---

# W36. TRAIN / ROUTE MOTIF

Use the train / route metaphor structurally.

Possible concepts:

```text
station = milestone
next station = next area
route line = journey path
transfer = N5 → N4
detour = immersion
arrival = completion
departure = transition
```

Use this language meaningfully.

Do not turn every UI element into novelty signage.

---

# W37. MICROCOPY

Support small accurate thematic copy such as:

```text
今日の道
Today’s path

次の駅
Next stop

寄り道
Detour

到着
Arrived

もう少し
A little further

新しい道
A new road
```

Use sparingly.

Do not plaster decorative Japanese everywhere just because it looks cool.

---

# W38. PROGRESS TIED TO PLACES

Where useful, interpret progress through place mastery.

Examples:

```text
Places you can handle

Neighborhood
Strong

Shopping Street
Strong

Station
Developing

Restaurant
Next
```

This is especially useful in Journey / Progress / Today.

It should complement, not replace, detailed skill analytics.

---

# W39. WORLD DATA MUST NOT BREAK LEARNING

The Journey world is a framing and orientation system.

It must not obstruct:

```text
review
practice
reading
listening
lesson flow
offline local study
performance
```

Core learning always takes precedence over visual flourish.

---

# W40. IMPLEMENTATION SURFACES TO AUDIT

At minimum inspect and update the actual surfaces that currently appear related:

```text
components/journey/*
components/shell/*
app/(main)/journey/*
app/(main)/page.tsx
Today/session surfaces
Lesson opening / lesson player
Immersion discovery / surface
Profile / portrait / identity
global atmosphere styling
image pipeline / public assets / Next/Image config
```

Inspect any newer files that supersede these.

Do not blindly create duplicate visual systems.

---

# W41. REUSE EXISTING VISUAL WORK WHERE POSSIBLE

Audit what can be preserved or adapted from:

```text
/site-atmosphere.png
/journey-hero.png
/daily-journey.png
existing Journey landscape
existing portrait / decorative motifs
existing app shell
```

Do not throw away usable work unnecessarily.

But do not keep static-image assumptions if they block the world system.

---

# W42. REQUIRED LEARNER EXPERIENCE — TODAY

Target experience:

```text
[ atmospheric image matching current area ]

駅前
AT THE STATION

N5 · Stop 6
18 min

Review
8 due

Learn
〜前に

Listen
Irodori · station dialogue

Read
train information

[ Continue Today ]
```

If the user advances to another area later, the Today scene should change accordingly.

---

# W43. REQUIRED LEARNER EXPERIENCE — JOURNEY

Target experience:

```text
YOUR JOURNEY

[ area-based visual route ]

町の入口
✓

住宅街
✓

商店街
✓

駅前
● current

食堂
○ next

図書館
○ later
```

The current area must be visually obvious.

---

# W44. REQUIRED LEARNER EXPERIENCE — LESSON OPENING

Target experience:

```text
[ environment visual ]

駅
AT THE STATION

You are meeting a friend before catching a train.

Today you will:
• talk about time
• say where you are going
• understand station language

[ Begin ]
```

Then the lesson moves into a clean focused learning UI.

---

# W45. REQUIRED LEARNER EXPERIENCE — AREA COMPLETION

Target experience:

```text
到着
ARRIVED

商店街

You can now:
✓ ask prices
✓ understand quantities
✓ say what you want

Next stop:
駅前
AT THE STATION

[ Continue ]
```

This should feel like actual forward movement.

---

# W46. REQUIRED LEARNER EXPERIENCE — N5 TO N4

Target experience:

```text
[ train / transition environment ]

新しい道
A NEW ROAD

The familiar town is behind you.

N4 opens a wider Japan:
• longer conversations
• denser reading
• more natural listening
• greater independence

[ Continue ]
```

Do not make this feel cheesy.

Make it feel earned.

---

# W47. REQUIRED LEARNER EXPERIENCE — IMMERSION

Target experience:

```text
寄り道
DETOURS

[ scene card ]

喫茶店で
At a café

Irodori
Listening · 3 min
Comfortable

[ Listen ]

────────

[ scene card ]

町を歩く
Walking around town

Japanese with Shun
Video · 11 min

[ Watch ]

────────

[ scene card ]

本と図書館
Books & libraries

Reading / culture

[ Explore ]
```

Immersion should feel like exploring the world, not clicking a provider database.

---

# W48. TESTS — WORLD MODEL

Test:

```text
journey area resolution
lesson → area mapping
N5/N4 route separation
progress-driven area change
stage progression
fallback for missing area
```

---

# W49. TESTS — VISUAL INTEGRATION

Test:

```text
app shell background changes
Today hero updates
Journey map updates
lesson opening uses area
completion uses next area
profile portrait integration if implemented
```

---

# W50. TESTS — RESPONSIVENESS / ACCESSIBILITY

Test:

```text
desktop
mobile
image cropping
reduced motion
contrast
image failure fallback
alt behavior
```

---

# W51. TESTS — PERFORMANCE

Test:

```text
initial page load
Today load
Journey load
Immersion load
background transitions
bundle impact
image weight
lazy loading behavior
```

Do not ship a heavy cinematic concept that makes the app slower and worse.

---

# W52. IMPLEMENTATION ORDER

Follow approximately this order:

## 1

Audit current static-asset assumptions and related components.

## 2

Define Journey world / area model.

## 3

Create centralized visual manifest.

## 4

Implement current-area resolution from learner progress.

## 5

Implement app shell atmospheric background support.

## 6

Implement Today hero tied to current area.

## 7

Refactor Journey route/map to become area-aware.

## 8

Add area progression stages.

## 9

Add lesson opening scene support.

## 10

Add area completion transitions.

## 11

Implement N5 → N4 world transition.

## 12

Integrate Immersion discovery with detour/world framing.

## 13

Integrate profile / portrait world context if appropriate.

## 14

Tune responsive behavior, performance, and accessibility.

## 15

Run tests/build/validation.

Do not start by perfecting art direction before the area/state logic exists.

---

# W53. DO NOT DO

Do NOT:

```text
keep one static global atmosphere forever

treat the world as a manual wallpaper picker

change backgrounds every lesson

limit the world system only to the Journey page

use giant images behind dense practice screens

use random unlicensed web photos

overuse Mount Fuji / sakura / neon cliché imagery

make the route visually confusing

mix five unrelated visual styles

add performance-heavy gimmicks

block core study when images fail

autoplay ambient sound

turn Kizashi into a tourism brochure

turn Kizashi into a childish RPG

make the world prettier but not progression-driven
```

---

# W54. FINAL REPORT

At completion report:

## World architecture

```text
Journey areas implemented
lessons mapped per area
N5 route structure
N4 route structure
progression stage model
```

## Visual system

```text
app shell background behavior
Today hero behavior
Journey map behavior
lesson opening behavior
completion behavior
Immersion integration
profile/portrait integration
```

## Assets

```text
visual manifest summary
which existing assets were reused
which new assets were added
source / license / attribution status
generated assets if any
```

## UX

```text
how current area is derived
how transitions work
how N5 → N4 works
how detours work
```

## Quality

```text
mobile behavior
fallback behavior
performance impact
accessibility notes
```

## Tests

Report every command run and whether it passed.

Do not hide failed checks.

---

# W55. DEFINITION OF DONE

This addendum is complete only when:

* the learner’s current progress determines a current journey area;
* the app shell atmosphere reflects that area;
* Today visually reflects that area;
* Journey visually reflects that area;
* multiple lessons belong to one meaningful place;
* the place evolves as the learner advances through it;
* area completion visibly advances the route;
* N5 feels like life inside a familiar Japanese town;
* N4 feels like a wider Japan opening outward;
* the N5 → N4 transition feels meaningful;
* lesson openings establish a place/context;
* the route no longer feels like a static dashboard;
* Immersion feels like exploring the world through detours;
* imagery is used intentionally and responsibly;
* imagery does not devolve into tourist cliché;
* focused learning screens remain focused and readable;
* mobile performance remains good;
* image failure does not break the UX;
* accessibility remains solid;
* the app feels more like a journey through Japan and less like a static Japanese-themed interface.

The final product test is:

```text
When I open Kizashi,
can I tell where I am in the world?

When I study for a while,
does the place around me feel stable enough to matter?

When I finish a cluster of lessons,
does it feel like I moved somewhere new?

When I get stronger,
does the world visibly open up?

If all progress percentages were removed,
would the interface still communicate:
“You are on a path through Japan”?
```

If the answer to the last question is no, the world system is still too weak.
