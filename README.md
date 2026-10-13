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

- Onboarding on the first visit: three short steps (practise a decision; explain it, then check it; see what to repeat) and "Ready to start?". It can be skipped, and "How it works" at the bottom of Home shows it again. To see it as a new user, clear this site's data in the browser (or delete the `ast.profile.v1` key in localStorage). The direction is chosen in Profile.
- Home: the direction, the headline "Practise a decision. Explain it, then check it against the guide." and a "Next up" card that continues an unfinished session, repeats weak topics (with a breakdown by error type and a link to the Weak topics page) or starts the first or a new scenario. With weak topics, a "Topics" row of up to five cards that snap as you swipe (each starts or resumes the repeat for that topic, showing "N TO REPEAT" or "N OF M REPEATED"), with position dots and "See all". "New scenario" shows one card per material with a prepared scenario and opens Session setup.
- Weak topics page: topics grouped by misconception, knowledge gap and guess, each with a checkbox, and "Repeat selected". A repeat round mixes the weak steps and questions of the chosen topics.
- Materials: tabs Ready, Processing and Failed over the sample guide plus sample "uploaded" items in every state (ready, processing, failed with a reason and "Try another file"), a simulated upload (choose a file, progress, Ready or Failed; only the file's name and size are used, nothing is read), and a material page with details, sections and excerpts. Only the sample guide has a prepared scenario.
- Create training: upload a sample file (the evacuation guide, the flood preparedness guide, a one-page quick card, or a photo that fails), then "Create training" on a ready material or "New scenario" on Home. Choose Scenario and Quiz and the sections to keep, watch a simulated four-step generation (with Cancel), review every situation and question with its sources, and "Start training". The quick card is too short for a scenario and makes a quiz only. Created trainings show as Scenario and Quiz tags and are saved in this browser.
- Session setup: Scenario (Short 3, Full 6 or Extended 10 decisions) or Quiz (one or more guide sections, 5, 10, 15 or a custom number of questions, capped at what the bank holds).
- Decision step: an action and how sure you are, then "Continue".
- Explain screen: your choice as a quote (no verdict yet) and one question in large type: "In one sentence, why did you choose this?" You type in an input docked above the keyboard, with "I don't know" and a round send button. There is no AI follow-up question.
- Answer sheet (in the style of Quizlet's written answers): after every step and every quiz question, a bottom sheet rises with two status rows, "Result" (Correct, Incorrect or Partly correct) and "Error type" (only with a confidence rating), your choice and the better one, your own explanation (left out after "I don't know") as a reflection next to the short why with sources and, for a scenario step, what happened. Only "Continue" closes it. Nothing about the explanation is checked or scored.
- Ask AI: a button on the decision step, and an "Ask AI about this step" link on each step in the results analysis, open a chat sheet about the step, with suggested questions and a text field. Answers are prepared in the scenario JSON and matched by keywords; unmatched questions get "This is not covered by the material" with the closest guide sections (on the smoke step one suggested question is such a question). Before you answer, it never says which action is right.
- Quiz: 33 original questions in `content/quiz-bank.json`, in five types (single choice, multiple choice, ordering by dragging the handles (with a keyboard drag mode), short text in the docked input with "I don't know", true or false). Every type uses the same answer sheet after "Check"; multiple choice and ordering show how many are right, with partial credit; confidence is optional. When the keyword check rejects a short answer, the sheet says "Doesn't match our answer. Yours might still be right." and "My answer is still correct" marks it correct, which counts in the score.
- Results: a soft light header (circular back button to Home, the mode, a two-tone headline), a progress card (ring "N/M correct", one conclusion sentence, and Correct and Incorrect rows that open the analysis filtered), the Error types card ("Details" opens the analysis), an Outcome card with plain-language states such as "Smoke on the route: Moderate (up from Light)" and a Step by step card (scenarios only), weak topics and "Marked correct by you: N". Green and red rows are used only for Correct and Incorrect.
- Error analysis: a separate screen (`/session/results/analysis`, also `?show=correct` or `?show=incorrect`) grouped Misconception, Knowledge gap, Guess, Secure, with the Result and Error type rows, your choice and the better one, the why with sources, what happened and Ask AI per answer. Back returns to Results where you left it, and the page works after a reload.
- Progress: the same repeat summary and topic row, and session history from scenarios, quizzes and repeat rounds, with an empty state.
- Profile: direction, and "Reset progress" behind a confirmation.

Sessions, history and the profile are saved in this browser on this device (`localStorage`). A page reload keeps your place.

Build order and decisions: `docs/build-plan.md`.

## Known limitations

- AI behavior is simulated. Every answer, chat reply and key point comes from the prepared scenario, and a trainee's explanation is a reflection: it is shown next to the why and never checked or scored. Free questions in Ask AI are matched by keywords, so rephrasing can change which prepared answer comes back.
- The flood scenario has 3 decisions only (Full and Extended are not available for it) and no prepared Ask AI answers, so Ask AI is not offered on its steps. Its results show time lost and water level.
- Upload and generation are simulated. Upload offers sample files; generation shows prepared content. Only the guide has a prepared scenario and question bank, so the quick card's quiz uses the guide's S1 and S2 questions.
- Short text answers are checked by matching accepted words and phrases, so an unusual but correct wording can be marked wrong. The trainee can then mark it correct, which the prototype trusts.
- Progress lives in one browser on one device. There are no accounts.
- Ordering questions are reordered by dragging the handles (mouse, touch, or the keyboard drag mode with screen reader announcements). There is no tap-to-move alternative to dragging yet, so WCAG 2.2 success criterion 2.5.7 (Dragging Movements) is not met.

## Project files

- `CLAUDE.md`: project rules. `DESIGN.md`: design system.
- `app/`: routes. `components/`: UI components. `lib/`: helpers. `content/`: sample material. `docs/`: notes and screenshots.
