You are building a private single-user Japanese learning web application based on the attached PRD.

Do not attempt to implement the entire product in one pass.

For the first implementation milestone, build only the product foundation.

## Milestone 1

Implement:

* Next.js + TypeScript application structure
* Tailwind styling
* polished dark-first design system
* responsive desktop/mobile application shell
* Supabase integration
* magic-link authentication
* strict single-email allowlist authorization
* server-side authentication checks
* Supabase RLS foundations
* typed data models
* core database schema
* seeded development content
* desktop sidebar
* mobile navigation
* Journey route
* placeholder Learn, Review, Library, Progress and Profile routes
* reusable Journey map components
* course/chapter/lesson hierarchy
* current lesson state
* polished loading/error/empty states

Do NOT yet implement:

* AI
* listening
* handwriting
* complicated analytics
* full SRS
* knowledge graphs
* large animation systems

## Design priority

This must not look like a generic SaaS dashboard.

It should feel like a premium personal Japanese-learning application combining:

* Japanese editorial minimalism
* modern dark UI
* subtle game progression
* spatial journey design

Avoid:

* generic shadcn appearance
* excessive cards
* gradients everywhere
* neon cyberpunk design
* anime clichés
* cartoonish Duolingo styling

Use shadcn/Radix as primitives only and customize them substantially.

## Architecture requirement

Learning content must not be coupled to Genki.

Use generic abstractions:

Course
→ Chapter
→ Lesson
→ Learning items

so future content can include Genki, JLPT, custom material and immersion vocabulary.

Before changing code:

1. inspect the repository,
2. summarize the existing architecture,
3. identify what can be reused,
4. propose the exact files/database migrations you intend to change.

Then implement Milestone 1 cleanly.

Do not start Milestone 2 automatically.
