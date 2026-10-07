# AI Scenario Trainer (MVP prototype)

A mobile-first web prototype of a scenario-based trainer. A trainee practises decisions in a scenario built from a study guide, explains each decision, and gets error analysis with links to the source section of the guide.

AI behavior is simulated for this prototype. All feedback comes from prepared data in `content/scenario-building-evacuation.json` and the sample guide `content/sample-evacuation-guide.md`. There are no live AI calls.

The content is educational only: civil-protection and first-aid situations (evacuation, first aid, coordination, communication in a crisis).

## Run it

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app is designed for a 390 by 844 phone screen. On a wide screen it shows as a centred column about 430px wide.

Other scripts:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

In development, `/screens` shows every planned screen side by side at phone width for design review. It returns 404 in production.

## Environment variables

None. No secrets are needed, and the app deploys to Vercel without configuration.

## Scope

Scope comes from `docs/mvp-matrix-and-ia.md`; see `CLAUDE.md` for the full list. Must and Should features are in, Could and Won't are out (live AI, real PDF parsing, chat, audio, instructor panel, gamification, accounts, dark theme).

## Status

The learning cycle can be clicked from start to finish:
Materials → material page → Session setup (Short 3 or Full 6 decisions) → decision step (option, confidence, one-sentence explanation) → feedback (verdict, error type, sources, consequence, key points, "Ask about this step" on the smoke step) → results (score, error types, how the situation ended, error analysis, weak topics) → repeat the weak steps.

The session is saved in the browser on this device, so a page reload keeps your place.

Not built yet: Home, Progress, Profile and Onboarding (they show a "Coming next" screen), and the upload flow. Build order: `docs/build-plan.md`.

## Known limits

- AI behavior is simulated. The follow-up question and the key points are shown, but a trainee's explanation is never graded automatically.
- Upload is not available yet. Only the sample guide is used.
- Only one session is kept at a time; history arrives with the Progress screen.

## Project files

- `CLAUDE.md`: project rules. `DESIGN.md`: design system.
- `app/`: routes. `components/`: UI components. `lib/`: helpers. `content/`: sample material. `docs/`: notes and screenshots.
