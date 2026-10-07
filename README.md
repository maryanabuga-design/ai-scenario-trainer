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
npm run build
```

## Environment variables

None. No secrets are needed, and the app deploys to Vercel without configuration.

## Scope

In the MVP:
1. Library (start) screen with the sample guide as the loaded material. The upload dropzone is a design state only.
2. A prepared scenario with six decision steps.
3. At each step: choose an option, rate confidence, write a one-sentence explanation.
4. Feedback: your answer vs the correct one, why, error type (knowledge gap, misconception, guess), and a link to the source section (S1 to S10).
5. Session summary with weak topics and a "practise again" action.

Out of scope: live AI calls, real PDF parsing, instructor panel, accounts, audio, YouTube import, gamification, dark theme.

## Status

Built so far: project setup, design tokens, mobile app shell (bottom navigation, source sheet, action bar) and the Library screen. The practice flow and the session summary are not built yet, so "Start scenario" leads to a page that does not exist.

## Known limits

- AI behavior is simulated. The follow-up question and the key points are shown, but a trainee's explanation is never graded automatically.
- Upload is not functional. Only the sample guide is available.
- The session is not saved between visits.

## Project files

- `CLAUDE.md`: project rules. `DESIGN.md`: design system.
- `app/`: routes. `components/`: UI components. `lib/`: helpers. `content/`: sample material. `docs/`: notes and screenshots.
