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
- No live AI calls in this version. The AI behavior is simulated from `content/scenario-building-evacuation.json` (options, explanations, consequences, key beats, prepared Ask AI answers). Say so on Profile and in the README ("AI behavior is simulated for this prototype"); session screens never mention AI.
- Keep the feedback logic behind a small interface in `lib/feedback.ts` so a real AI provider could be added later. Do not implement it now.
- Deploy: Vercel. No environment variables are required.

## Design
Mobile-first: single column, a four-section bottom navigation (Home, Materials, Progress, Profile), a fixed bottom action bar and a bottom sheet for sources. Style: soft warm greige page, warm near-white cards with 24px radius and a very soft shadow, deep olive pill primary button, one sans family (DM Sans) for titles and UI with the named text styles in `DESIGN.md` only (no one-off sizes or weights), small uppercase pastel tags; no gradients (the only decoration is the SoftShape on two Home cards, see `DESIGN.md`). No desktop layout; on wide screens the app is a centred column about 430px wide. Follow `DESIGN.md` exactly: tokens, typography, components, tone. If a needed token or component is missing, add it to `DESIGN.md` first, then use it. Use CSS variables from the tokens; no hard-coded colors in components.

## MVP scope
Source of truth: `docs/mvp-matrix-and-ia.md` (from the FigJam board). Must and Should features are in scope; Could and Won't are out. Ask before changing scope.

The learning cycle: Home → Material → Session setup → Question → Next (Finish on the last) → Results (pass mark, weak topics, your answers) → (A) Weak topics → Repeat selected → repeat round, or (B) Answer review per question → Results.

Navigation: four sections in the bottom navigation (Home, Materials, Progress, Profile). Onboarding, Session setup, the scenario session and Session results are opened from other screens and have no navigation item.

In:
1. Onboarding (first visit only, replayed from "How it works" on Home): three short steps, "Practise a decision", "Answer, then check it" and "See what to repeat", then "Ready to start?" with "Get started". Skip on every step. The direction is chosen in Profile (only "Building evacuation and first aid" is available).
2. Home: eyebrow with the direction, the headline "Practise a decision. Check it against the guide." and "Small steps. Real progress."; a "Next up" card that continues an unfinished session, or repeats weak topics (with a breakdown by error type and a link to the Weak topics page), or starts the first or a new scenario; when there are weak topics a "Topics" row of up to 5 topic cards (85% wide, scroll-snap, "N TO REPEAT" or "N OF M REPEATED", decorative pagination dots) with "See all"; "New scenario" cards, one per material with a prepared scenario, opening Session setup. A repeat round mixes the weak steps and questions of the chosen topics. No gradient or graphics at the top.
3. Materials and training: upload offers sample files ("Upload is simulated for this prototype. Choose a sample file."): the evacuation guide, the flood preparedness guide (`content/sample-flood-guide.md`, F1 to F7, with its own 3-decision scenario and 10-question quiz), a one-page quick card (S1 and S2 only) and a photo that fails. A Ready material with guide content gets "Create training": Scenario and Quiz (both on), the detected sections to keep, "Generate"; a simulated four-step generation (about 4 s, Cancel, "Generation is simulated for this prototype. Prepared content is shown."); a Review of every situation and question with sources, then "Start training" into Session setup. Too short: "Not enough material for a scenario. A quiz is available." Created trainings are saved in the browser, shown as Scenario and Quiz tags, and cleared by Reset progress. Materials: tabs Ready, Processing and Failed over a list of sample "uploaded" items in different states (the evacuation guide ready with the only prepared scenario, a Word document of notes ready, an article link processing, a scanned file failed with a reason and "Try another file"), a simulated upload sheet (choose a file, progress, Ready or Failed; nothing is read or sent; "Upload is simulated for this prototype"), and a material page with name, type, size, date added, sections and excerpts. Materials without a prepared scenario explain: "In this prototype a scenario is prepared for one material only".
4. Session setup: mode Scenario or Quiz. Scenario lengths are what the material's scenario supports: for the evacuation guide Short (3 decisions, about 5 min), Full (6, about 10 min) or Extended (10, about 16 min, four extra steps in the same story); for the flood guide only 3 decisions. Each scenario has its own situation outcome (evacuation: time lost, smoke level, and the injured colleague in Full and Extended; flood: time lost and water level). Quiz: one or more guide sections (S1 to S10) and 5 (default) or 10 (Extended) questions, never more than the question bank holds for those sections. Times are estimates and labelled as such.
5. Question session (changed 16 Oct 2026): scenario steps and quiz questions are one pattern (3 or 4 options, one correct, binary result). One screen with Back, "Question 3 of 10", Exit, a step strip and only Next or Finish at the bottom; no feedback, confidence, explanation or Ask AI during the session. Answers are saved on every change. At Finish the result is calculated from the final answers. Session screens never mention AI or a bot.
6. Ask AI (feature 21 in the matrix): a "Ask AI about this step" text link on each step in the Answer review (after Finish, not during a session) opens a scripted chat in a bottom sheet about the step. Suggested question chips and a text field; answers come from prepared question and answer pairs in the JSON, free questions are matched by keywords, and anything unmatched gets "This is not covered by the material" with the closest guide sections. On the smoke step one suggested question is one the guide does not cover, so the honest "This is not covered by the material." answer is one tap away. Every answer has source chips. It may explain why the other options are worse. It is a bottom sheet, not a navigation item.
7. (Removed 16 Oct 2026: the typed explanation, its keyword check and "My explanation is still correct". There are no error types.)
8. Session results (16 Oct 2026): hero, "Passed" or "Not passed yet" against the pass mark (80%, `lib/config.ts`), percentage bar, one conclusion, a Weak topics card, then "Review answers" and "Repeat weak topics" (one row when both fit, otherwise stacked). The Back arrow goes Home; there is no "Your answers" list and no "Back to Home" button. The Answer review lists every option with the right one and the person's choice marked, then Why and Guide chips. The Weak topics page is a flat list of guide sections with a wrong answer.
9. Quiz (from `content/quiz-bank.json` and the flood bank, all single choice): the same question screen and data shape as a scenario step. Session setup offers lengths of 10, 20 or 30 questions for both modes.
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
