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

- Welcome, Create account or Sign in, and Verify (simulated: no email is sent, the demo code is shown on the screen), then an onboarding of three slides once per account. "How the app works" in the Profile screen shows it again. To see it as a new user, create a new account.
- Home (student view): a greeting "Hi, Maryana" (one demo user, also on Profile) with one sentence about where you are, the profile button, the hero card ("Training materials", the subtitle, the 3D slot and one Primary button "Choose a topic" that opens the Training screen), four tiles (Exam, Steps, Weak topics, Saved questions; Materials is only in the bottom navigation) and the "Mini-quiz" row. Resuming an unfinished session is done on the Training screen. The replay of the onboarding is the "How the app works" row in Profile. Pictures for the hero tile and the Mini-quiz row are optional (`docs/scenario-image-prompts.md`); placeholders show until they exist.
- Weak topics page: topics grouped by misconception, knowledge gap and guess, each with a checkbox, and "Repeat selected". A repeat round mixes the weak steps and questions of the chosen topics.
- Materials: tabs Ready, Processing and Failed over the sample guide plus sample "uploaded" items in every state (ready, processing, failed with a reason and "Try another file"), a simulated upload (choose a file, progress, Ready or Failed; only the file's name and size are used, nothing is read), and a material page with details, sections and excerpts. Only the sample guide has a prepared scenario.
- Create training: upload a sample file (the evacuation guide, the flood preparedness guide, a one-page quick card, or a photo that fails), then "Create training" on a ready material or "New scenario" on Home. Choose Scenario and Quiz and the sections to keep, watch a simulated four-step generation (with Cancel), review every situation and question with its sources, and "Start training". The quick card is too short for a scenario and makes a quiz only. Created trainings show as Scenario and Quiz tags and are saved in this browser.
- Training: the stats of the mode (questions answered, accuracy), a Scenario/Quiz switch (the last mode is remembered), in Quiz mode a Mini-quiz card, and a card per guide section with its parts of 5 questions. A row starts that part at once; there are no settings. Each part has a ring with its last result (a check at the pass mark), and the next part of a topic has a Start or Continue pill. Back from Results of a part returns to Training.
- Question screen (scenario and quiz are one pattern; a scenario question has 3 options, a quiz question 3 or 4, true-false 2): the white Back, "Question 3 of 10" and Exit on top, a step strip (tap a square to jump), a card with the optional image, the situation (scenario only), the question and lettered options, a bookmark on the question, and at the bottom the primary Next (Finish on the last) with a lightbulb hint button on its left. The hint opens a card under the options (a reminder and a Guide chip, never the answer) and closes on the next question; saved questions are listed under Saved questions (a tile on Home), where one can be opened or repeated. Nothing says whether an answer is right during the session; Back and the strip show your choice and let you change it, and everything is saved so you can continue from Home.
- Answer review (after Finish): the situation and question with every option: the right one marked "Correct answer" in green, your wrong choice marked "Your answer" in rose, then Why and Guide chips. The result of a question is only right or wrong.
- Mini-quiz: the only place where a session is configured (quiz questions only): pick guide topics (all selected at first) and 5, 10 or 15 questions (limited by the questions in the selected topics; "All N" below 5), then "Start mini-quiz". The questions are drawn at random, without repeats, in a random order. It counts toward the Training stats and the readiness but not toward part rings, and Back from its Results returns to Home or Training, wherever it was started.
- Exam: an assigned exam with a deadline, opened from the Exam tile on Home or from Training: it shows Readiness (the share of the exam's topics whose latest answers are correct) against the pass mark, "Repeat weak topics" and "Start exam" (always startable). A full timed check: 20 questions from all topics (a random mix of scenario and quiz questions), 20 minutes, no hints, pass mark 80% (named constants in `lib/config.ts`). A countdown shows under the top row and turns rose in the last 2 minutes; at 0:00 the exam finishes by itself (unanswered count as incorrect), and a refresh keeps the timer. Leaving asks first and saves nothing. Finished exams are kept in the history (date, percent, questions, time used); the intro shows the last and best result. An exam counts toward the Training stats and readiness, not part rings.
- Ask AI (tab, 23 Oct 2026): a history of conversations, suggested questions, a pinned input, thread screens with source pills, quick actions (example, simple explanation, the guide) and the line "Prototype answer: a prepared example, not a live AI". A row "Ask AI about this question" on the review and Saved question screens opens one thread per question. Everything is prepared content (`content/ask-ai.json` and the question data); threads are kept in this browser (30 at most).
- Quiz: 43 original single-choice questions in `content/quiz-bank.json` and `content/question-bank-flood.json` (3 or 4 options, two for true or false). Quiz and scenario share one data shape and one screen.
- Results: Back and the title, a hero slot, "Passed" or "Not passed yet" against the pass mark (80% by default, one constant in `lib/config.ts`), the percentage on a bar with the pass mark marked, one conclusion sentence, a Weak topics card (guide sections with a wrong answer), and the buttons "Review answers" (opens the Answer review on question 1, with a strip showing right and wrong) and "Repeat weak topics" (in one row when both fit, otherwise stacked). The Back arrow goes Home.
- Error analysis: a separate screen (`/session/results/analysis`, also `?show=correct` or `?show=incorrect`) grouped Misconception, Knowledge gap, Guess, Secure, with the Result and Error type rows, your choice and the better one, the why with sources, what happened and Ask AI per answer. Back returns to Results where you left it, and the page works after a reload.
- Progress: the same repeat summary and topic row, and session history from scenarios, quizzes and repeat rounds, with an empty state.
- Profile: direction, and "Reset progress" behind a confirmation.

Sessions, history and the profile are saved in this browser on this device (`localStorage`). A page reload keeps your place.

Build order and decisions: `docs/build-plan.md`.

## Known limitations

- Exam assignment is a single-browser simulation of an instructor feature; there is no server. The one assigned exam is demo data seeded on first load (S1 to S4, due in 7 days). The Student/Instructor switch on Profile is a demo; the Instructor "Assign exam" screen is not built yet (Instructor Home is a stub).
- Notifications are demo data (four messages from `content/notifications.json`) and in-app events (a finished exam, the daily goal), kept in this browser. There is no backend, no push, no permission prompt and no network request.
- Accounts are simulated on this device: registration, verification (the demo code is shown on the screen), sign in, edit profile, sign out and delete account all work in the browser. No email is sent, there is no server and no real authentication; accounts, the session and each account's progress stay in this browser's local storage. The Student/Instructor switch is a demo; the Instructor "Assign exam" tool is not built yet.

- AI behavior is simulated. Every answer, chat reply and reference explanation comes from the prepared scenario. The check of a typed explanation is a simple keyword match (at least 3 words and one keyword of a key beat), so a good sentence in other words can be marked "Doesn't match the guide yet"; the trainee can then press "My explanation is still correct". Free questions in Ask AI are matched by keywords too, so rephrasing can change which prepared answer comes back.
- The flood scenario has 3 decisions only (Full and Extended are not available for it) and no prepared Ask AI answers, so Ask AI is not offered on its steps. Its results show time lost and water level.
- Upload and generation are simulated. Upload offers sample files; generation shows prepared content. Only the guide has a prepared scenario and question bank, so the quick card's quiz uses the guide's S1 and S2 questions.
- Short text answers are checked by matching accepted words and phrases, so an unusual but correct wording can be marked wrong. The trainee can then mark it correct, which the prototype trusts.
- Progress lives in one browser on one device. There are no accounts.
- Ordering questions are reordered by dragging the handles (mouse, touch, or the keyboard drag mode with screen reader announcements). There is no tap-to-move alternative to dragging yet, so WCAG 2.2 success criterion 2.5.7 (Dragging Movements) is not met.
- Ask AI (a tab with conversation history and threads) is simulated: every answer is a prepared example composed from the guides and the question data, not a live AI, and may be inaccurate for a question that is not prepared. No network and no keys are used. Highlights in the reading screen are stored only in this browser.

## Project files

- `CLAUDE.md`: project rules. `DESIGN.md`: design system.
- `app/`: routes. `components/`: UI components. `lib/`: helpers. `content/`: sample material. `docs/`: notes and screenshots.

## Phone-size checks

`npm run test:e2e` runs Playwright against a production build (WebKit as iPhone 13, iPhone SE and two small in-app-browser sizes, and Chromium as Pixel 7) and checks the session flow: Next waits for an answer, the step strip, Back and jump with the choice filled in, the Exit confirmation, Finish into Results, the Answer review, Weak topics and the repeat round, an old saved session being ignored, and the Training screen. Install the browsers once with `npx playwright install webkit chromium`.

## Saved data and content changes

Progress lives in the browser. Each saved value carries a schema version and a content fingerprint; when the content changes, ids of removed questions are dropped silently when the data is read, valid answers stay, and corrupted data reads as an empty state. See `docs/content-and-saved-data.md`.

## Materials

The Materials tab lists every topic of the training guides (10 evacuation topics and 7 flood topics) with a reading time. A topic opens its reading screen, which ends with an action block (at the bottom of the screen when the text is short, after the text when it is long): Practise this topic (starts or resumes a practice session of the topic), Steps for this topic; a sticky header shows the topic's place in its guide with previous and next arrows, and on long topics a quick-actions bar (Steps, Practise this topic) appears when the reader scrolls up. Reading changes no progress. The earlier upload flow is no longer reachable from the tab.
