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
Mobile-first: single column, bottom navigation, a fixed bottom action bar and a bottom sheet for sources. No desktop layout; on wide screens the app is a centred column about 430px wide. Follow `DESIGN.md` exactly: tokens, typography, components, tone. If a needed token or component is missing, add it to `DESIGN.md` first, then use it. Use CSS variables from the tokens; no hard-coded colors in components.

## MVP scope
In:
1. Start screen shows the sample guide as the loaded material. The upload dropzone is a design state only and is not functional.
2. Play the prepared scenario (six decision steps) from the JSON file.
3. At each step: choose an option, rate confidence, write a one-sentence explanation.
4. Feedback: your answer vs correct, why, error type (knowledge gap / misconception / guess, derived from correctness + confidence), source link.
5. Session summary with weak topics and a "practise again" action.

Out (do not build): live AI calls, real PDF parsing, instructor panel, accounts and auth, audio, YouTube import, gamification, dark theme.

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
