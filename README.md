# AI Scenario Trainer (MVP prototype)

A mobile-first web prototype of a scenario-based trainer. A trainee practises decisions in a scenario built from a study guide, explains each decision, and gets error analysis with links to the source section of the guide.

AI behavior is simulated for this prototype. All feedback comes from prepared data: the evacuation guide (`content/sample-evacuation-guide.md`, scenario and quiz bank) and the flood preparedness guide (`content/sample-flood-guide.md`, `scenario-flood-preparedness.json`, `question-bank-flood.json`). There are no live AI calls.

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
- Home: continue an unfinished session (the card is the link), a repeat summary card ("N topics to repeat", error-type counts, "Repeat weak topics") with a sideways row of up to five topic cards by priority (each repeats one topic) and "See all" to the Weak topics page, and a New scenario card that opens Create training.
- Weak topics page: topics grouped by misconception, knowledge gap and guess, each with a checkbox, and "Repeat selected". A repeat round mixes the weak steps and questions of the chosen topics.
- Materials: tabs Ready, Processing and Failed over the sample guide plus sample "uploaded" items in every state (ready, processing, failed with a reason and "Try another file"), a simulated upload (choose a file, progress, Ready or Failed; only the file's name and size are used, nothing is read), and a material page with details, sections and excerpts. Only the sample guide has a prepared scenario.
- Create training: upload a sample file (the evacuation guide, the flood preparedness guide, a one-page quick card, or a photo that fails), then "Create training" on a ready material or "New scenario" on Home. Choose Scenario and Quiz and the sections to keep, watch a simulated four-step generation (with Cancel), review every situation and question with its sources, and "Start training". The quick card is too short for a scenario and makes a quiz only. Created trainings show as Scenario and Quiz tags and are saved in this browser.
- Session setup: Scenario (Short 3, Full 6 or Extended 10 decisions) or Quiz (one or more guide sections, 5, 10, 15 or a custom number of questions, capped at what the bank holds).
- Decision step: an action, how sure you are, and one sentence on why you chose it.
- Feedback: verdict, your answer vs the better one, why, error type, sources, what happened, the AI follow-up question with points a strong answer covers, and "Ask about this step" on the smoke step. Under your sentence, a simulated keyword match shows how many key points it covers ("Match with key points: 67%", covered or missing per point); it is for reference only and never changes the score.
- Ask AI: a button on the decision step and on feedback opens a chat sheet about the current step, with suggested questions and a text field. Answers are prepared in the scenario JSON and matched by keywords; unmatched questions get "This is not covered by the material" with the closest guide sections. Before you answer, it never says which action is right.
- Quiz: 33 original questions in `content/quiz-bank.json`, in five types (single choice, multiple choice, ordering with buttons or drag, short text checked against accepted phrases, true or false). Feedback shows the correct answer, why and the guide section; multiple choice and ordering get partial credit; confidence is optional.
- Results: score, error types, how the situation ended, error analysis with sources, weak topics, and "Repeat weak topics".
- Progress: the same repeat summary and topic row, and session history from scenarios, quizzes and repeat rounds, with an empty state.
- Profile: direction, and "Reset progress" behind a confirmation.

Sessions, history and the profile are saved in this browser on this device (`localStorage`). A page reload keeps your place.

Build order and decisions: `docs/build-plan.md`.

## Known limits

- AI behavior is simulated. Every answer, follow-up question, chat reply and key point comes from the prepared scenario, and a trainee's explanation is never graded automatically. Free questions in Ask AI are matched by keywords, so rephrasing can change which prepared answer comes back.
- The flood scenario has 3 decisions only (Full and Extended are not available for it) and no prepared Ask AI answers, so Ask AI is not offered on its steps. Its results show time lost and water level.
- Upload and generation are simulated. Upload offers sample files; generation shows prepared content. Only the guide has a prepared scenario and question bank, so the quick card's quiz uses the guide's S1 and S2 questions.
- Short text answers are checked by matching accepted words and phrases, so an unusual but correct wording can be marked wrong.
- Progress lives in one browser on one device. There are no accounts.

## Project files

- `CLAUDE.md`: project rules. `DESIGN.md`: design system.
- `app/`: routes. `components/`: UI components. `lib/`: helpers. `content/`: sample material. `docs/`: notes and screenshots.
