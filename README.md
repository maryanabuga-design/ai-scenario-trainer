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
- Session setup: Scenario (Short 3, Full 6 or Extended 10 decisions) or Quiz (one or more guide sections, 5 questions by default or 10 as Extended, capped at what the bank holds).
- Session screen: one step or question at a time, with Exit, "Step 3 of 6", a step strip (tap a square to jump) and a bottom bar with a circular Back and Next (Finish on the last). A scenario step is: choose an option, say how sure you are, explain in your own words (optional). Nothing says whether an answer is right during the session; Back and the strip show your answers filled in and editable, and everything is saved so you can continue later from Home.
- Answer review (after Finish): for each step, the situation, "Your choice" with a check or a cross, "Your explanation" with a verdict ("Matches the guide" or "Doesn't match the guide yet", from a simulated keyword check against the step's key beats), a "Better explanation" (hidden only when the choice was right and the explanation matched), the why with guide chips and what happened. A right choice with a non-matching explanation counts as a Guess; "My explanation is still correct" lets the trainee overrule that, with Undo. Short-text quiz questions work the same way with "Your answer" and "Better answer". The score depends only on the chosen option.
- Ask AI: an "Ask AI about this step" link on each step in the Answer review (not during a session) opens a chat sheet about the step, with suggested questions and a text field. Answers are prepared in the scenario JSON and matched by keywords; unmatched questions get "This is not covered by the material" with the closest guide sections (on the smoke step one suggested question is such a question).
- Quiz: 33 original questions in `content/quiz-bank.json`, in five types (single choice, multiple choice, ordering by dragging the handles (with a keyboard drag mode), short text in a text field with "I don't know", true or false). Every type has an Answer review after Finish; multiple choice and ordering show how many are right, with partial credit; confidence is optional. When the keyword check rejects a short answer, the review says "Doesn't match our answer. Yours might still be right." and "My answer is still correct" marks it correct, which counts in the score.
- Results: a hero slot (a light circle with an icon until a picture is added), "Passed" or "Not passed yet" against the pass mark (80% by default, one constant in `lib/config.ts`), the percentage on a bar with a marker, one conclusion sentence, the Error types card ("Details" lists the answers by error type with plain labels such as "Sure, but wrong"), "Your answers" (one row per step or question, each opening its Answer review) and "Repeat weak topics" or "Start a new session".
- Error analysis: a separate screen (`/session/results/analysis`, also `?show=correct` or `?show=incorrect`) grouped Misconception, Knowledge gap, Guess, Secure, with the Result and Error type rows, your choice and the better one, the why with sources, what happened and Ask AI per answer. Back returns to Results where you left it, and the page works after a reload.
- Progress: the same repeat summary and topic row, and session history from scenarios, quizzes and repeat rounds, with an empty state.
- Profile: direction, and "Reset progress" behind a confirmation.

Sessions, history and the profile are saved in this browser on this device (`localStorage`). A page reload keeps your place.

Build order and decisions: `docs/build-plan.md`.

## Known limitations

- AI behavior is simulated. Every answer, chat reply and reference explanation comes from the prepared scenario. The check of a typed explanation is a simple keyword match (at least 3 words and one keyword of a key beat), so a good sentence in other words can be marked "Doesn't match the guide yet"; the trainee can then press "My explanation is still correct". Free questions in Ask AI are matched by keywords too, so rephrasing can change which prepared answer comes back.
- The flood scenario has 3 decisions only (Full and Extended are not available for it) and no prepared Ask AI answers, so Ask AI is not offered on its steps. Its results show time lost and water level.
- Upload and generation are simulated. Upload offers sample files; generation shows prepared content. Only the guide has a prepared scenario and question bank, so the quick card's quiz uses the guide's S1 and S2 questions.
- Short text answers are checked by matching accepted words and phrases, so an unusual but correct wording can be marked wrong. The trainee can then mark it correct, which the prototype trusts.
- Progress lives in one browser on one device. There are no accounts.
- Ordering questions are reordered by dragging the handles (mouse, touch, or the keyboard drag mode with screen reader announcements). There is no tap-to-move alternative to dragging yet, so WCAG 2.2 success criterion 2.5.7 (Dragging Movements) is not met.

## Project files

- `CLAUDE.md`: project rules. `DESIGN.md`: design system.
- `app/`: routes. `components/`: UI components. `lib/`: helpers. `content/`: sample material. `docs/`: notes and screenshots.

## Phone-size checks

`npm run test:e2e` runs Playwright against a production build (WebKit as iPhone 13, iPhone SE and two small in-app-browser sizes, and Chromium as Pixel 7) and checks the session flow: Next waits for an answer, the step strip, Back and jump with answers filled in, the Exit confirmation, Finish into Results and the Answer review. Install the browsers once with `npx playwright install webkit chromium`.
