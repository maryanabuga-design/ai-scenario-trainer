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
2. Home: continue session, a repeat summary card (topics to repeat, error-type counts, "Repeat weak topics") with a sideways row of up to 5 topic cards by priority and "See all" to a Weak topics page grouped by error type with "Repeat selected"; new scenario as a tappable card (opens Create training for the sample guide). A repeat round mixes the weak steps and questions of the chosen topics.
3. Materials and training: upload offers sample files ("Upload is simulated for this prototype. Choose a sample file."): the evacuation guide, the flood preparedness guide (`content/sample-flood-guide.md`, F1 to F7, with its own 3-decision scenario and 10-question quiz), a one-page quick card (S1 and S2 only) and a photo that fails. A Ready material with guide content gets "Create training": Scenario and Quiz (both on), the detected sections to keep, "Generate"; a simulated four-step generation (about 4 s, Cancel, "Generation is simulated for this prototype. Prepared content is shown."); a Review of every situation and question with sources, then "Start training" into Session setup. Too short: "Not enough material for a scenario. A quiz is available." Created trainings are saved in the browser, shown as Scenario and Quiz tags, and cleared by Reset progress. Materials: tabs Ready, Processing and Failed over a list of sample "uploaded" items in different states (the evacuation guide ready with the only prepared scenario, a Word document of notes ready, an article link processing, a scanned file failed with a reason and "Try another file"), a simulated upload sheet (choose a file, progress, Ready or Failed; nothing is read or sent; "Upload is simulated for this prototype"), and a material page with name, type, size, date added, sections and excerpts. Materials without a prepared scenario explain: "In this prototype a scenario is prepared for one material only".
4. Session setup: mode Scenario or Quiz. Scenario lengths are what the material's scenario supports: for the evacuation guide Short (3 decisions, about 5 min), Full (6, about 10 min) or Extended (10, about 16 min, four extra steps in the same story); for the flood guide only 3 decisions. Each scenario has its own situation outcome (evacuation: time lost, smoke level, and the injured colleague in Full and Extended; flood: time lost and water level). Quiz: one or more guide sections (S1 to S10) and 5, 10, 15 or a custom number of questions (stepper), never more than the question bank holds for those sections. Times are estimates and labelled as such.
5. Scenario session from the JSON: choose an option and rate confidence ("Continue"), then a separate Explain screen: the chosen option as a quote with no verdict, the neutral prompt "In one sentence, why did you choose this?", "Check my explanation" or "Skip". After checking, the user ticks which key points their answer covers ("My answer covers this", pre-checked by a keyword match, "You decide"), then "See feedback" with the consequence and the scripted AI follow-up question. The source sheet is available throughout.
6. Ask AI (feature 21 in the matrix): an "Ask AI" button on the decision step and the feedback screen opens a scripted chat in a bottom sheet about the current step. Suggested question chips and a text field; answers come from prepared question and answer pairs in the JSON, free questions are matched by keywords, and anything unmatched gets "This is not covered by the material" with the closest guide sections. Every answer has source chips. Before feedback the chat never says or hints which option is correct; after feedback it may explain why the other options are worse. It is a bottom sheet, not a navigation item.
7. Feedback: your answer vs correct, why, error type (knowledge gap / misconception / guess / secure, derived from correctness + confidence), source link. One line "Your explanation: N of M points" (or "Skipped") from the user's own self-check; no percentage anywhere. The self-check never changes the score, error types, weak topics or repeat rounds; results show "Explained in your own words: N of M points (self-checked)". Under the smoke step, a tappable suggested question ("Ask about this step") opens the Ask AI sheet with that question already answered: "This is not covered by the material." with the closest guide sections. The AI never asks it on its own.
8. Session results: summary, error analysis with sources, repeat weak topics (replays the wrong or guessed steps).
9. Quiz (from `content/quiz-bank.json`, 30+ original questions, each with a section and a misconception type): single choice, multiple choice (with how many to select), ordering (move up and down buttons and drag), short text (simulated check against accepted keywords and phrases, shown next to the reference answer as "Looks correct" or "Doesn't match our answer"; when rejected, "My answer is still correct" marks it correct, counts in the score and shows "Marked correct by you") and true or false. Each question gets feedback with the correct answer, why and source chips; multiple choice and ordering get partial credit. Confidence is optional. Quiz answers feed the same error types, weak topics, Progress and Home.
10. Progress: weak topics and session history, saved in the browser on this device (`localStorage`).
11. Profile: change direction, reset progress (sessions, history, weak topics and created trainings).

Out (do not build): live AI calls, real PDF parsing, question about a highlighted fragment, free chat with the tutor outside a scenario step, process visualisation, several study formats, audio, other sources (YouTube, topic), instructor panel, real-time voice, gamification, accounts and auth, dark theme.

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
