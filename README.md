# AI Scenario Trainer (MVP prototype)

A mobile-first web prototype of a scenario-based trainer. A trainee practises decisions in a scenario built from a study guide, explains each decision, and gets error analysis with links to the source section of the guide.

AI behavior is simulated for this prototype. All feedback comes from prepared data in `content/scenario-building-evacuation.json` and the sample guide `content/sample-evacuation-guide.md`. There are no live AI calls.

The content is educational only: civil-protection and first-aid situations (evacuation, first aid, coordination, communication in a crisis).

## Run it

Requires Node.js 20.19 or newer (developed on Node 24).

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

To try it on a phone, connect the phone to the same Wi-Fi and open the "Network" address that `npm run dev` prints (for example `http://192.168.0.101:3000`). The app works there; only live reload is blocked for other devices, which Next.js does by default.

In development, `/screens` shows every planned screen side by side at phone width for design review. It returns 404 in production.

## Environment variables

None. No secrets are needed, and the app deploys to Vercel without configuration.

## Scope

Scope comes from `docs/mvp-matrix-and-ia.md`; see `CLAUDE.md` for the full list. Must and Should features are in, Could and Won't are out (live AI, real PDF parsing, chat, audio, instructor panel, gamification, accounts, dark theme).

## Status

All four sections and the whole learning cycle can be clicked through:

- Onboarding on the first visit: choose a direction (one available, three marked "Not available in this prototype"), how it works, an example scenario. It can be skipped.
- Home: continue an unfinished session, weak topics from your saved sessions, start a new scenario.
- Materials: the sample guide, its sections in a bottom sheet, and "Start scenario".
- Session setup: Short (3 decisions, about 5 min) or Full (6 decisions, about 10 min).
- Decision step: an action, how sure you are, and one sentence on why you chose it.
- Feedback: verdict, your answer vs the better one, why, error type, sources, what happened, the AI follow-up question with points a strong answer covers, and "Ask about this step" on the smoke step.
- Results: score, error types, how the situation ended, error analysis with sources, weak topics, and "Repeat weak topics".
- Progress: weak topics and session history, with an empty state.
- Profile: direction, and "Reset progress" behind a confirmation.

Sessions, history and the profile are saved in this browser on this device (`localStorage`). A page reload keeps your place.

Not built yet: the upload flow in Materials (choose a file, processing). Build order: `docs/build-plan.md`.

## Known limits

- AI behavior is simulated. Every answer, follow-up question and key point comes from the prepared scenario, and a trainee's explanation is never graded automatically.
- Upload is not available yet. Only the sample guide is used.
- Progress lives in one browser on one device. There are no accounts.

## Project files

- `CLAUDE.md`: project rules. `DESIGN.md`: design system.
- `app/`: routes. `components/`: UI components. `lib/`: helpers. `content/`: sample material. `docs/`: notes and screenshots.
