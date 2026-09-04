# MICRO-ADDENDUM — KIZASHI ART DIRECTION, IMAGE SOURCING, AND VISUAL CONSISTENCY

This is a MICRO-ADDENDUM to:

`ADDENDUM — DYNAMIC JOURNEY WORLD, EVOLVING BACKGROUNDS, AND “PATH THROUGH JAPAN” IMPLEMENTATION`

It does NOT supersede any previous requirement.

Its purpose is to constrain the visual execution of the Journey world so Kizashi does NOT become:

```text
random Japanese wallpapers
+
dark gradients
+
inconsistent stock photography
```

The target is a coherent visual world.

---

# A1. ART-DIRECTION PRINCIPLE

## Code-backed implementation status (2026-09-04)

- [x] The existing shell, Today, and Journey image URLs are now centralized in the Journey visual manifest instead of being repeated in Journey components.
- [x] Area identity and progression are expressed through restrained environment labels, color washes, route styling, and arrival/lived-in/settled stages; the learner remains the protagonist and focused drills remain image-light.
- [~] Lesson openings, area-completion next-stop handoffs, profile scenery, and restrained native route/portrait landmarks now use the shared visual manifest; its deliberate desktop/mobile focal points are wired through the shell, Today, Journey, and Learn surfaces. Eight dedicated repo-owned SVG area variants now carry role-level provenance metadata in `lib/journey-world-core.js`, while the portrait adds environment and progression-stage motifs. Authored practical reading assets now pair generated no-text raster scene support with HTML visual layouts carrying accurate Japanese text; screenshot review and the final mobile crop/performance audit remain before this art direction can be marked complete.

Kizashi should visually communicate:

> ordinary Japan becoming increasingly accessible as the learner’s Japanese improves.

The visual identity should feel:

```text
quiet
cinematic
lived-in
editorial
Japanese
slightly atmospheric
restrained
```

rather than:

```text
tourism advertising
anime game UI
cyberpunk Tokyo
generic SaaS
stock-photo language app
```

---

# A2. PRIMARY VISUAL SUBJECT

Prioritize ordinary environments.

Use:

```text
residential streets
narrow neighborhood roads
utility poles
bicycles
local stations
platforms
train crossings
small trains
shotengai
convenience stores
small cafés
ramen / family restaurants
bookshops
libraries
schools
campus paths
parks
bus stops
river paths
rainy streets
evening streets
small coastal towns
mountain towns
local shopping districts
```

These environments are much more useful to Kizashi than constant landmark imagery.

---

# A3. AVOID JAPAN-CLICHÉ SATURATION

Do NOT make the main visual vocabulary:

```text
Mount Fuji
sakura
torii
geisha
samurai
kimono
neon Shibuya
anime girls
temples
lantern festivals
```

These can appear when contextually appropriate.

They should NOT define every Journey area.

A mundane station platform is often more useful than Fuji.

---

# A4. PREFERRED VISUAL STYLE

Use one coherent family.

Preferred direction:

```text
cinematic editorial photography
+
subtle environmental illustration
```

Photography should feel:

```text
observational
street-level
calm
natural
not heavily staged
```

Illustration should feel:

```text
minimal
atmospheric
architectural/environmental
restrained
```

Do NOT use character-heavy anime illustration unless explicitly requested later.

---

# A5. IF GENERATED IMAGERY IS USED

Generated imagery may be used for environment scenes when appropriate.

Requirements:

```text
consistent art direction
no imitation of a named living artist
no fake documentary framing
no text baked into the image unless specifically required
no distorted Japanese signage
no obvious AI artifacts
no random people staring at camera
```

Prefer scenes containing:

```text
architecture
streets
transport
shops
weather
landscape
```

over detailed human faces.

---

# A6. GENERATED IMAGE STYLE BRIEF

If generating environmental illustrations, use a consistent brief approximately like:

```text
quiet Japanese everyday environment,
street-level perspective,
restrained cinematic composition,
subtle natural lighting,
slightly muted palette,
editorial travel illustration,
architecturally believable,
ordinary lived-in Japan,
no anime characters,
no exaggerated tourism imagery,
no visible English text,
no fake Japanese text,
no cyberpunk styling,
no oversaturated colors
```

Adjust subject/location per Journey area.

Do not copy this exact text blindly if another formulation produces more consistent results.

---

# A7. REAL PHOTOGRAPHY

When using photography, prioritize images with:

```text
clear reuse rights
good resolution
low visual clutter
useful negative space
strong environment identity
natural perspective
```

Potential sources include appropriately licensed collections such as:

```text
Wikimedia Commons
other clearly reusable image repositories
open/public-domain institutional collections
existing project assets with known provenance
```

Do NOT scrape random Google Images.

Do NOT hotlink arbitrary image-search results.

---

# A8. PROVIDER IMAGERY

For external providers such as:

```text
YouTube
Hirogaru
Irodori
other hosted sources
```

prefer provider-hosted thumbnails/visuals when the existing provider integration supports them appropriately.

Do not replace authentic provider artwork with fake generated thumbnails.

---

# A9. IMAGE MANIFEST METADATA

Every owned/locally stored Journey image should have metadata equivalent to:

```typescript
{
  id,
  areaId,
  role,
  path,
  sourceType,
  sourceUrl?,
  creator?,
  license?,
  attribution?,
  focalPoint?,
  dominantMood?
}
```

Roles may include:

```text
shell
hero
lesson
transition
portrait
immersion
```

Do not scatter provenance across components.

---

# A10. VISUAL ROLE SEPARATION

Different image roles should behave differently.

## Shell

```text
subtle
low contrast
mostly atmosphere
```

## Today hero

```text
strong environment identity
room for text
```

## Journey

```text
strongest world-building
route / place identity
```

## Lesson opening

```text
focused context
temporary
```

## Immersion

```text
discovery-oriented
content-specific
```

## Profile portrait

```text
reflective / identity-oriented
```

Do not reuse the exact same crop everywhere.

---

# A11. COMPOSITION REQUIREMENTS

Prefer images with usable negative space.

For example:

```text
subject/environment concentrated on one side
open wall/sky/street area on the other
```

This makes overlays safer.

Do not place text over:

```text
dense signage
faces
bright windows
complex crowds
```

unless overlay treatment makes it clearly readable.

---

# A12. TYPOGRAPHY OVER IMAGERY

Japanese place name should usually dominate.

Example:

```text
駅前

AT THE STATION
```

Preferred hierarchy:

```text
Japanese
largest

English
smaller

route/status metadata
smallest
```

Do not let labels such as:

```text
CURRENT MODULE
```

visually overpower:

```text
駅前
```

---

# A13. IMAGE OVERLAY SYSTEM

Use a small consistent set of overlay treatments.

For example:

```text
dark left-to-right gradient
dark bottom gradient
soft vignette
subtle desaturation
```

Do not independently invent overlay recipes per component.

Create reusable classes/components.

---

# A14. GRAIN / TEXTURE

A tiny amount of texture can help unify photography and illustration.

If used:

```text
subtle
low-opacity
static
```

Do not add animated noise.

Do not make the app look like a film-camera preset pack.

---

# A15. COLOR GRADING

Different locations can have subtle mood differences while remaining recognizably Kizashi.

Suggested tendencies:

```text
Neighborhood
warm morning neutrals

Home
soft warm interior tones

Convenience store
cool-white + restrained color

Shopping street
warm amber

Station
steel / slate / blue-grey

Café
warm brown / vermilion accents

Library
quiet slate / muted green

Train journey
cool twilight

City
denser blue / warm light balance

Coast
cool open blue-grey

Mountain town
earth / mist / deep green-grey
```

Do not create separate full themes.

The Kizashi base palette remains dominant.

---

# A16. SEASONAL CUES

Season may appear through:

```text
lighting
vegetation
rain
clothing silhouettes
sky
street atmosphere
```

Keep it subtle.

Avoid:

```text
giant sakura particles
falling leaves animation everywhere
snow overlays across the whole UI
```

---

# A17. PEOPLE IN IMAGERY

People may appear but should not dominate the visual identity.

Prefer:

```text
distant pedestrians
commuters
silhouettes
people naturally using the environment
```

Avoid:

```text
posed models
close-up faces
stock-photo smiles
anime protagonists
```

The learner is the protagonist.

---

# A18. SIGNAGE

Realistic Japanese signage is useful.

However:

Do NOT generate prominent nonsense kanji.

For generated environment artwork:

```text
keep signs distant
abstract
unreadable
or intentionally simple
```

For readable learning material:

```text
render actual Japanese as HTML/SVG
```

rather than relying on generated pixels.

---

# A19. ORIGINAL JLPT VISUAL MATERIAL

For:

```text
menus
posters
timetables
station signs
notices
maps
```

prefer programmatically designed:

```text
HTML
SVG
CSS
```

or carefully constructed Kizashi assets.

Do NOT use AI-generated text-heavy images.

Japanese text must be accurate.

---

# A20. IMAGE DENSITY

Not every surface needs imagery.

Strong imagery:

```text
Today
Journey
lesson opening
area completion
N5 → N4
Immersion discovery
Profile
```

Little/no imagery:

```text
flashcards
grammar drill
conjugation
dictation input
mock exam
dense reference pages
```

Visual silence is part of the design.

---

# A21. AREA VISUAL UNIQUENESS

Each area should be identifiable without reading its title.

If the following backgrounds all look like:

```text
dark Japanese street at night
```

the implementation has failed.

The learner should be able to distinguish:

```text
Neighborhood
Shopping Street
Station
Restaurant
Library
Train
Coast
Mountain Town
```

from composition and environment.

---

# A22. DO NOT MAKE EVERYTHING NIGHTTIME

Dark UI does NOT mean all Journey imagery should depict nighttime.

Use:

```text
morning
daytime
rainy afternoon
golden hour
evening
night
```

The app overlay can maintain visual compatibility.

A journey made entirely of moody Tokyo nights becomes monotonous.

---

# A23. MOBILE ART DIRECTION

Some landscape images will crop badly vertically.

For important areas either provide:

```text
mobile-specific image
```

or deliberate crop/focal metadata.

The mobile experience must not show:

```text
half a train
empty pavement
cropped landmark
```

because desktop composition was reused blindly.

---

# A24. ASSET BUDGET

Do not generate/store hundreds of large images.

Initial target should be approximately:

```text
N5
8–10 area identities

N4
8–10 area identities

plus
a few transition/milestone assets
```

Each area can reuse one strong environment across:

```text
shell
Today
Journey
```

with different crops/overlays where appropriate.

Generate additional variants only when they materially improve the experience.

---

# A25. PROGRESSION VARIANTS

Do not necessarily create three entirely separate images for every area.

Prefer:

```text
base scene
+
SVG/CSS environmental overlays
+
lighting/accent changes
```

where practical.

Examples:

```text
route lights appear
train enters scene
shops illuminate
new path appears
background district becomes visible
```

This keeps asset count manageable and makes progress feel deterministic.

---

# A26. N5 ART DIRECTION

N5 should visually feel:

```text
small-scale
local
familiar
human
everyday
walkable
```

The learner is gaining confidence inside one town.

Avoid enormous metropolitan imagery too early.

---

# A27. N4 ART DIRECTION

N4 should visibly widen scale.

Use more:

```text
larger stations
longer train journeys
denser city environments
regional movement
larger institutions
travel environments
coast
mountain landscape
```

The visual widening should reinforce increased linguistic independence.

---

# A28. N5 → N4 TRANSITION ART

This should be one of the strongest assets in the app.

Preferred concept:

```text
train departure
train window
town receding
wider landscape ahead
```

Avoid:

```text
giant glowing gate
fantasy portal
RPG level-up explosion
```

The emotion should be:

```text
quietly earned expansion
```

---

# A29. VISUAL REFERENCES

When researching visual direction, prioritize references for:

```text
Japanese local railways
shotengai
suburban Japanese streets
station architecture
Japanese public wayfinding
editorial Japanese travel photography
Japanese book/magazine layout
quiet cinematic urban photography
```

Do not copy a specific commercial design system wholesale.

Use references to understand composition and atmosphere.

---

# A30. SCREENSHOT AUDIT

After implementation, inspect screenshots for:

```text
Today desktop
Today mobile

Journey desktop
Journey mobile

lesson opening

area completion

N5 → N4 transition

Immersion

Profile
```

Ask:

```text
Does this look like one visual world?

Can I identify the place?

Is Japanese still visually primary?

Is readability strong?

Is the image actually helping?
```

If not, revise.

---

# A31. VISUAL CONSISTENCY AUDIT

Explicitly flag:

```text
different illustration styles
different photo grading
random border radii
inconsistent overlays
bad crops
generic stock imagery
tourist clichés
AI-text artifacts
duplicate-looking environments
```

Do not accept “technically implemented” as sufficient.

---

# A32. DO NOT DO

Do NOT:

```text
download random image-search results

use Pinterest images

hotlink arbitrary photography

use one Tokyo-night photo for every area

put sakura everywhere

generate readable Japanese text inside AI images

make all images anime-style

use character mascots

use giant hero imagery inside practice questions

create hundreds of assets without need

make every route area visually interchangeable

sacrifice loading speed for cinematic backgrounds

allow visual style to drift between areas
```

---

# A33. FINAL ART-DIRECTION TEST

The visual system is successful if:

```text
Neighborhood feels different from Station.

Station feels different from Shopping Street.

N5 feels smaller and more familiar than N4.

The world feels Japanese without becoming cliché.

The user feels like the person moving through the world.

Images create atmosphere without interfering with study.

Japanese text remains central.

The app looks like one authored visual world,
not a folder of Japanese wallpapers.
```

If the last statement is false, revise the asset system before calling the visual milestone complete.
