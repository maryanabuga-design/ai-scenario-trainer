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

`/screens` shows every planned screen side by side at phone width for design review (fake demo data only). It is open in production too.

## Environment variables

None. No secrets are needed, and the app deploys to Vercel without configuration.

## Scope

Scope comes from `docs/mvp-matrix-and-ia.md`; see `CLAUDE.md` for the full list. Must and Should features are in, Could and Won't are out (live AI, real PDF parsing, chat, audio, instructor panel, gamification, accounts, dark theme).

## Status

All four sections and the whole learning cycle can be clicked through:

- Welcome, Create account or Sign in, and Verify (simulated: no email is sent, the demo code is shown on the screen), then an onboarding of three slides once per account. "How the app works" in the Profile screen shows it again. To see it as a new user, create a new account.
- Home (student view): a greeting "Hi, Maryana" (one demo user, also on Profile) with one sentence about where you are, the profile button, the hero card ("Training materials", the subtitle, the 3D slot and one Primary button "Choose a topic" that opens the Training screen), a 2 by 2 grid of tiles (Exam, Mini-quiz, Weak topics, Saved questions; Materials is only in the bottom navigation). Resuming an unfinished session is done on the Training screen. The replay of the onboarding is the "How the app works" row in Profile. Pictures for the hero tile and the Mini-quiz row are optional (`docs/scenario-image-prompts.md`); placeholders show until they exist.
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

- Invitations and reminders to the invented students are simulated: no email is sent and nothing leaves the browser (a reminder to a local student account appears in that account's Notifications). Word and PDF files are not parsed.

- Field of work (Student) is stored only in this browser and only tunes the prepared examples of the simulated Ask AI. In a real product it would be sensitive and optional.

- Document analysis is simulated in the prototype: the Instructor imports ONE Excel document (`.xlsx`, up to 10 MB, read on this device, nothing is uploaded) and an Analysing screen shows the stages while the template is read; there is no live AI, and Word and PDF documents are not read. A person always reviews the draft before it is published. Parts with a whole-part problem (section numbers that are not consecutive, more than ten steps) have no edit screen: they keep "Replace document".

- Content import (Instructor, question sets): only CSV files are read (locally, nothing is uploaded). Word files are not parsed in this prototype and a prepared sample result is shown instead; a live product would parse Word and always ask a person to review before publishing. Imported sets stay in this browser, and publishing is a human decision. Published sets appear in Training only and never change readiness or the exam.

- The Instructor demo uses simulated group data: two demo groups, Rescue team (14 invented students) and Military training (12), in `content/demo-cohort.json`, plus the accounts of this browser (they join Rescue team). Groups are demo data: they cannot be created, renamed or changed (next steps). Exams, results and notices are kept in this browser only; there is no server, no real group and no real people.

- Exams (Instructor and Student) are simulated in this browser: attempts, results and notifications are kept on this device only. Draft and scheduled exams, exam templates and result export are not in the prototype.

- Invitations are simulated: no email is sent; the join link only works in this browser. Moving or removing students and messaging are not in the prototype.

- Content package import is a demonstration: it reads one Excel workbook (`.xlsx`, sheets Topic, Guide, Steps, Scenario, Questions) plus optional images, on this device. Document analysis is simulated in the prototype. A real product would also read Word and PDF documents, use stable ids to update existing content, and offer AI-assisted conversion of a raw document into the template, with every item shown next to its source passage and always reviewed by a person before publishing. Demo topics are isolated from the rest of the app: they are not part of readiness, Progress, exams or Ask AI. The template is `public/templates/guide-template.xlsx` and the sample is `public/templates/sample-document.xlsx`.

The five CSV formats (the sample package is the reference example; headers are matched case-insensitively):

| File | Columns |
|---|---|
| topic | topic_title, topic_summary, scenario_title |
| guide | section, title, text, image_file, alt_text |
| steps (a step guide; the first column is the step guide title) | checklist_title, step, action, detail, guide_reference, image_file, alt_text |
| scenario | step, situation, question, option_a, option_b, option_c, option_d, correct, why, guide_reference, image_file, alt_text |
| questions | question_id, question, option_a, option_b, option_c, option_d, correct, explanation, guide_reference, image_file, alt_text |

- Certificates are simulated: a prototype certificate is made on this device when an exam is passed. It is not an official document and nothing is verified or sent.

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

- Step guides (3 built-in guides, 17 steps) live in Materials (the selector "Topics | Step guides") and behind the button "Step guide for this topic" on the topics that have one (S1, S7, S8). They are a read-only reference aid with no done state, so they never change Progress, readiness, Weak topics or exams.
- Target model, not built: an exam can draw from quiz questions, scenario steps and "put the steps in order" questions of a topic. Imported content is practice-only here and exams use built-in topics only. Every step, scenario step and question must point to a guide section (a blocking check in the import).
- Guided review of a content package: item cards show one small pill (Must fix or Please confirm) and a pencil; the pinned "Review N items" walks through the flagged items in the edit screens (Save and next stays disabled with one plain sentence until the item is resolvable; Mark as OK, Skip) and ends on a summary screen: All items checked with Publish, or the items still needing attention with Review remaining N. Edit screens exist for guide sections, steps, scenario steps and questions, with Add image and the image description. "Please confirm" and Mark as OK exist as a state, but the importer never guesses a guide section, so nothing starts as Please confirm in this prototype.
