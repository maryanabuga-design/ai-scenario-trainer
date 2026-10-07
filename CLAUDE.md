# CLAUDE.md — AI Scenario Trainer (MVP)

## What this is
A mobile-first clickable web prototype (designed for a 390 by 844 phone screen) of an AI-powered scenario-based trainer for the Trainee persona. The Trainee practises decisions in a scenario built from a study guide, explains each decision, and receives error analysis with links to the source passage. AI behavior is simulated from prepared data; there are no live AI calls.

This is a learning prototype. Keep scope small and the repo tidy.

## Hard constraints
- Strictly educational. Never generate content that teaches weapon use, causes harm, or supports combat operations. Scenarios stay in civil-protection and first-aid style situations (evacuation, first aid, coordination, communication in a crisis).
- All feedback comes from the source guide and links to a source section (S1 to S10). The prototype never invents content.
- Never commit secrets or `.env*` files. No secrets are needed in this version.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS.
- No live AI calls in this version. The AI behavior is simulated from `content/scenario-building-evacuation.json` (options, explanations, consequences, follow-up questions, key beats). Say so in the UI footer and the README ("AI behavior is simulated for this prototype").
- Keep the feedback logic behind a small interface in `lib/feedback.ts` so a real AI provider could be added later. Do not implement it now.
- Deploy: Vercel. No environment variables are required.

## Design
Mobile-first: single column, a four-section bottom navigation (Home, Materials, Progress, Profile), a fixed bottom action bar and a bottom sheet for sources. Style: warm off-white page, white cards with 24px radius, black pill primary button, serif titles with sans UI, small uppercase pastel tags; soft gradients only where `DESIGN.md` allows them. No desktop layout; on wide screens the app is a centred column about 430px wide. Follow `DESIGN.md` exactly: tokens, typography, components, tone. If a needed token or component is missing, add it to `DESIGN.md` first, then use it. Use CSS variables from the tokens; no hard-coded colors in components.

## MVP scope
Source of truth: `docs/mvp-matrix-and-ia.md` (from the FigJam board). Must and Should features are in scope; Could and Won't are out. Ask before changing scope.

The learning cycle: Home → Material → Session setup → Situation → Decision → Confidence check → Explanation → AI follow-up → Consequence → next step or Results → Error analysis with sources → Repeat weak topics.

Navigation: four sections in the bottom navigation (Home, Materials, Progress, Profile). Onboarding, Session setup, the scenario session and Session results are opened from other screens and have no navigation item.

In:
1. Onboarding: choose direction (only "Building evacuation and first aid" is available; "Road incident first aid", "Flood preparedness" and "Crisis communication" are shown as not available), how it works, example scenario.
2. Home: continue session, weak topics, new scenario.
3. Materials: list, material page, and an upload flow as a screen sequence (choose a file, processing, then the prepared sample guide). The file is never read or sent; the UI says the prototype uses a prepared scenario.
4. Session setup: Short (3 decisions, steps 1 to 3, about 5 min) or Full (6 decisions, about 10 min). Times are estimates and labelled as such.
5. Scenario session from the JSON: choose an option, rate confidence, write a one-sentence explanation, see the scripted AI follow-up and the consequence. The source sheet is available throughout.
6. Feedback: your answer vs correct, why, error type (knowledge gap / misconception / guess / secure, derived from correctness + confidence), source link. Under the smoke step, a tappable suggested question ("Ask about this step") shows the honest "This is not covered by the material." answer with the closest guide sections. The AI never asks it on its own.
7. Session results: summary, error analysis with sources, repeat weak topics (replays the wrong or guessed steps).
8. Progress: weak topics and session history, saved in the browser on this device (`localStorage`).
9. Profile: change direction, reset progress.

Out (do not build): live AI calls, real PDF parsing, question about a highlighted fragment, free chat with the tutor, process visualisation, several study formats, audio, other sources (YouTube, topic), instructor panel, real-time voice, gamification, accounts and auth, dark theme.

Build order and status: `docs/build-plan.md`.

## Repo structure
```
app/            routes
components/     UI components (one folder per component)
lib/            scoring and feedback helpers
content/        sample material (public-domain evacuation / first-aid text)
docs/           research notes and decisions
public/
```

## Git and quality rules
- Small commits with conventional messages (`feat:`, `fix:`, `docs:`, `chore:`).
- Run `npm run lint` and `npm run typecheck` before each commit.
- Keep `README.md` current: what it is, how to run, env variables, scope, known limits.
- No dead code, no stray `console.log`, no TODOs without an issue or note in `docs/`.

## Working style
- Propose a short plan before large changes. Build one screen at a time and check it against `DESIGN.md`.
- Ask when a product decision is unclear instead of guessing.
