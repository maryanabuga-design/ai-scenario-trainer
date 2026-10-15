# MVP scope and information architecture

Source: the FigJam board sections "Матриця MVP" (feature matrix) and "Інформаційна архітектура MVP" (information architecture). If this file and the board disagree, the board wins. Ask the user before changing scope.

## MVP criterion
One complete learning cycle: upload material → configure the session → answer scenario or quiz questions → see the result and the answers with sources → return to weak topics.
If the cycle cannot work without a feature, it is Must.

## Feature matrix
Columns: value and complexity come from the board. "Prototype approach" is a proposal for this version, where AI behaviour is simulated from `content/scenario-building-evacuation.json`.

| # | Feature | Priority | Value / complexity | Prototype approach |
|---|---------|----------|--------------------|--------------------|
| 1 | Scenario that changes depending on decisions | Must | High / High | Prepared path with consequences and effects from the JSON; each decision shows its consequence |
| 4 | Own material (PDF) as the base of the scenario | Must | High / Medium | Upload flow works as a screen sequence: choose a file, show processing, open the prepared scenario for the sample guide. Say clearly that this prototype uses a prepared scenario |
| 5 | Source link + honest "this is not in the material" | Must | High / Low | Source sheet with section ids (S1 to S10); include one "not covered by the material" state |
| 6 | Session setup: number of decisions and estimated time | Must | High / Low | Selector for the number of decisions with an estimated time |
| 7 | Progress and history: weak topics, return without a new prompt | Must | High / Medium | Store sessions in the browser on this device. Home shows what to do now (weak topics and the repeat action); Progress shows how you are doing over time (summary, result by session, error types, guide sections, session history) and only links to Weak topics (reworked 14 Oct 2026) |
| 8 | Repeat weak topics (from results and from progress) | Must | High / Low | Replay the steps that were wrong or guessed |
| 9 | Short onboarding | Must | Medium / Low | First-run introduction, replaced on 13 Oct 2026: three short steps (Practise a decision; Explain it, then check it; See what to repeat) and a final "Ready to start?" screen with "Get started". Skip on every step; shown once; "How it works" on Home replays it. The direction is chosen in Profile (one direction is available) |
| 11 | Document always nearby (source in a sheet) | Should | Medium / Low | Same bottom sheet as feature 5 |
| 12 | Question about a highlighted fragment | Could | Medium / High | Not in this version (hard on mobile) |
| 13 | Free chat with the AI tutor outside the scenario | Could | Medium / Medium | Not in this version; the tutor lives inside the scenario |
| 14 | Process visualisation (scheme of steps) | Could | Medium / Medium | Not in this version |
| 15 | Several study formats (cards, podcast, notes) | Won't now | | Out of scope: scatters focus |
| 16 | Audio mode | Won't now | | Out of scope: test the hypothesis first |
| 17 | Other sources (YouTube, topic) | Won't now | | Out of scope |
| 18 | Instructor panel, group analytics | Won't now | | Out of scope: the MVP focuses on the Trainee |
| 19 | Real-time voice dialogue | Won't now | | Out of scope |
| 20 | Gamification | Won't now | | Out of scope; only minimal progress |
| 22 | Uploaded materials with states (simulated) | Must (extends 4; added by the user on 8 Oct 2026) | High / Medium | The Materials list shows sample "uploaded" items in different states: the evacuation guide (ready, the only one with a prepared scenario), a Word document of notes (ready), a link to an article (processing) and a scanned file that failed with a reason and "Try another file". Upload runs a simulated flow (choose a file, progress, Ready or Failed); nothing is read. The material page shows name, type, size, date added, sections and excerpts |
| 23 | Session length and topic: Extended scenario and Quiz mode | Must (extends 6; added by the user on 8 Oct 2026) | High / Medium | Scenario lengths are the number of situations (see row 31). Superseded by row 31: lengths of 10, 20 or 30 questions for both modes |
| 26 | Create training from a material (simulated) | Must (added by the user on 8 Oct 2026; the core of feature 4) | High / Medium | Upload offers sample files (the guide, a one-page quick card with sections S1 and S2, a photo that fails). From a Ready material or Home "New scenario": Create training (Scenario and Quiz, sections to keep), a simulated four-step generation with Cancel, and a Review of every situation and question with sources, then Start training. Too-short material gets "Not enough material for a scenario. A quiz is available." Only the guide's prepared scenario and question bank exist, so the quick card makes a quiz from the bank's S1 and S2 questions. Created trainings are saved in the browser and shown as Scenario and Quiz tags |
| 27 | Second sample material: flood preparedness | Should (added by the user on 8 Oct 2026) | High / Low | `content/sample-flood-guide.md` (sections F1 to F7) with its own prepared scenario (`scenario-flood-preparedness.json`, 3 decisions, outcome: time lost and water level, no casualty) and quiz (`question-bank-flood.json`, 10 questions). Offered as the second sample file in the upload flow and turned into training like the guide. Only the 3-decision length exists for it. Its steps have no prepared Ask AI answers, so Ask AI is not offered there |
| 28 | Weak topics redesign and repeat round | Must (refines 7 and 8; added by the user on 9 Oct 2026) | High / Medium | Home shows one repeat summary card (the Next up card) (topics to repeat, error-type counts, "Repeat weak topics") and a sideways row of up to 5 topic cards by priority (misconception, knowledge gap, guess); a card repeats one topic. "See all" opens a Weak topics page grouped by error type with checkboxes and "Repeat selected". A repeat round mixes the weak steps and questions of the chosen topics |
| 2 | Explain your decision | Removed on 16 Oct 2026 (was a Must) | | Removed with confidence and the free-text explanation: the result of a question is only correct or incorrect. The reason is given as "Why" in the Answer review, from the guide |
| 3 | Error analysis with sources and what to repeat | Must (simplified on 16 Oct 2026) | High / Medium | Binary result per question; no error types. Results show the percentage against the pass mark, the weak topics (guide sections with a wrong answer) and every answer; the Answer review shows all options, the correct one, the person's choice, "Why" and Guide chips |
| 10 | Confidence check "are you sure?" | Removed on 16 Oct 2026 (was a Should) | | Not built: it only fed the error types, which are removed |
| 24 | One question pattern | Must (replaces the five quiz question types and the scenario decision step; changed 16 Oct 2026) | High / Low | A scenario step and a quiz question share one data shape (`id, section, situation?, question, options, correctOptionId, why, guideRef, image?`) and one screen: 3 or 4 options (two for true or false), one correct, Next or Finish, no feedback during the session. Questions that were multiple choice, ordering or short text were rewritten as single choice, keeping their ids |
| 25 | Explanation match, "still correct" override | Removed (12 and 16 Oct 2026) | | Not built |
| 29 | Session screen layout | Must (16 Oct 2026) | Medium / Low | Top row (Back, "Question 3 of 10", Exit), a step strip that jumps between questions, a content card with an optional media slot, the situation (scenario only), the question and lettered options, and only the primary Next or Finish at the bottom. Back and the strip show the stored choice filled in. Exit asks Stay or Leave; progress is saved |
| 30 | Results, weak topics and answer review sequence | Must (16 Oct 2026) | High / Medium | Finish → Results (hero, Passed or Not passed yet against an 80% pass mark, percentage and bar, a Weak topics card, then Review answers and Repeat weak topics) → (A) Weak topics → choose topics → Repeat selected → repeat round → Results; (B) Review answers → Answer review from question 1, with a strip showing right and wrong (Previous, Next or the strip) → Back to results. There is no answers list on Results and no Back to Home: the Back arrow goes Home |
| 31 | Session setup (v3) | Must (changed 16 Oct 2026; extends 6 and 23) | High / Medium | Hero, guide title, Scenario or Quiz, "Your answers" counts for the guide, a settings card with Length 10, 20 or 30 questions (limited to what the selected sections hold; "All N" when fewer than 10), "Shuffle questions" (quiz only), "Only topics to repeat" and a Guide sections screen. A scenario takes the first k situations per section in story order; a quiz draws randomly |
| 32 | 3D placeholders | Should (16 Oct 2026) | Low / Low | One Media3D component (hero, step, icon). Dashed olive placeholder with "3D" until a picture is supplied; used on Session setup, Results and above questions that have an `image` |
| 21 | Ask AI about the current step (scripted chat in a bottom sheet) | Should (added by the user on 8 Oct 2026; not on the board) | High / Medium | Prepared question and answer pairs per step in the JSON, suggested question chips and keyword matching for free questions, an honest "not covered by the material" fallback, source chips on every answer. Changed on 15 Oct 2026: there is no Ask AI on the decision step or anywhere during a session; each step in the Answer review (after Finish) has an "Ask AI about this step" link, where it may explain why the other options are worse. This is not feature 13: it lives inside a scenario step, not outside the scenario |

## Information architecture
Assumption to confirm with the user: four sections live in the bottom navigation (Home, Materials, Progress, Profile). Onboarding, Scenario session and Session results are opened from other screens and have no navigation item.

- Onboarding (Онбординг): Practise a decision · Explain it, then check it · See what to repeat · Ready to start? (replayed from "How it works" on Home)
- Home (Головна): How it works (replays onboarding) · Continue session · Repeat summary and topic row · New scenario · Weak topics page (from See all)
- Materials (Матеріали): Materials list with tabs Ready, Processing and Failed · Upload sheet (sample files) · Material page · Create training · Generating · Review training · Upload sheet (simulated) · Material page (details, sections and excerpts)
- Progress (Прогрес): Summary · Result by session · Guide sections · Session history. Rule: Home = what to do now (Next up, topics to repeat, new scenario); Progress = how you are doing over time, with no duplicated actions (it only links to the Weak topics page)
- Profile (Профіль): Direction · Settings
- Question session (Сесія): Session setup (mode Scenario or Quiz; length 10, 20 or 30; shuffle; only topics to repeat; guide sections) · one question screen with the step strip and Next or Finish · Exit confirmation · Source sheet (Should). There is no feedback, confidence, explanation or Ask AI during the session
- Session results (Результати сесії): Results (hero, Passed or Not passed yet, percentage and pass mark, conclusion, Weak topics card, Review answers and Repeat weak topics) · Weak topics · Answer review (one per question, with Ask AI about this step for scenario steps) · Repeat round

## Main flow (the learning cycle)
Home → Material (PDF) → Session setup → Question (choose an option) → Next, for every question (Back and the step strip move between questions and keep the answers) → Finish.
- Finish: Results (Passed or Not passed yet, percentage, Weak topics) → (A) Weak topics → choose topics → Repeat selected → a repeat round of the questions answered wrong → Results; (B) Review answers → Answer review from the first question (a strip marks right and wrong; all options, the correct one, your choice, Why, Guide chips; Previous and Next) → Back to results. Progress is saved after each session.
Progress is saved after each session.

## Build notes
- No live AI calls. Every AI behaviour is simulated from the prepared scenario. The footer note "AI behavior is simulated for this prototype" is shown on Profile only (and in the README under known limitations); session screens never mention AI or a bot.
- Mobile-first, following DESIGN.md.
- Keep to the Must and Should features. Do not build the Could and Won't features.
