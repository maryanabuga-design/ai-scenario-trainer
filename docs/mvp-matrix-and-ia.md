# MVP scope and information architecture

Source: the FigJam board sections "Матриця MVP" (feature matrix) and "Інформаційна архітектура MVP" (information architecture). If this file and the board disagree, the board wins. Ask the user before changing scope.

## MVP criterion
One complete learning cycle: upload material → configure the session → play a scenario with decisions and explanations → get error analysis with sources → return to weak topics.
If the cycle cannot work without a feature, it is Must.

## Feature matrix
Columns: value and complexity come from the board. "Prototype approach" is a proposal for this version, where AI behaviour is simulated from `content/scenario-building-evacuation.json`.

| # | Feature | Priority | Value / complexity | Prototype approach |
|---|---------|----------|--------------------|--------------------|
| 1 | Scenario that changes depending on decisions | Must | High / High | Prepared path with consequences and effects from the JSON; each decision shows its consequence |
| 2 | Explain your decision + AI follow-up questions | Must | High / Medium | The explanation has its own Explain screen after the decision with one neutral question ("In one sentence, why did you choose this?"); the scripted AI follow-up question was dropped on 12 Oct 2026 at the user's request, so the neutral prompt is the only question. The answer sheet then shows the user's own sentence as "Your explanation" next to the why, as a reflection: nothing is checked or counted (changed on 12 Oct 2026) |
| 3 | Error analysis: what, why (knowledge / logic / carelessness), what to repeat | Must | High / Medium | Error type from correctness + confidence; misconception text from the JSON. Right after each answer, a bottom answer sheet (Result and Error type rows, the right answer, your explanation, short why, sources, consequence); the full why, the consequence timeline and the error-type legend are in the final analysis on the results screen |
| 4 | Own material (PDF) as the base of the scenario | Must | High / Medium | Upload flow works as a screen sequence: choose a file, show processing, open the prepared scenario for the sample guide. Say clearly that this prototype uses a prepared scenario |
| 5 | Source link + honest "this is not in the material" | Must | High / Low | Source sheet with section ids (S1 to S10); include one "not covered by the material" state |
| 6 | Session setup: number of decisions and estimated time | Must | High / Low | Selector for the number of decisions with an estimated time |
| 7 | Progress and history: weak topics, return without a new prompt | Must | High / Medium | Store sessions in the browser on this device; show weak topics and session history |
| 8 | Repeat weak topics (from results and from progress) | Must | High / Low | Replay the steps that were wrong or guessed |
| 9 | Short onboarding | Must | Medium / Low | First-run introduction, replaced on 13 Oct 2026: three short steps (Practise a decision; Explain it, then check it; See what to repeat) and a final "Ready to start?" screen with "Get started". Skip on every step; shown once; "How it works" on Home replays it. The direction is chosen in Profile (one direction is available) |
| 10 | Confidence check "are you sure?" | Should | Medium / Low | Three-level selector; gives data for error analysis |
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
| 23 | Session length and topic: Extended scenario and Quiz mode | Must (extends 6; added by the user on 8 Oct 2026) | High / Medium | Scenario lengths Short (3), Full (6), Extended (10, four extra steps). A Quiz mode picks one or more guide sections and 5, 10, 15 or a custom number of questions, limited to what the question bank holds for those sections |
| 24 | Quiz question types | Should (added by the user on 8 Oct 2026) | High / Medium | Single choice, multiple choice (with how many to select), ordering (drag handles with a keyboard drag mode), short text (simulated keyword and phrase check shown next to the reference answer; when it rejects an answer the user can mark it "My answer is still correct", which counts in the score), true or false. After "Check", every type gets the same answer sheet with the correct answer, why and sources; partial credit for multiple choice and ordering, shown as how many are right. Short text uses the docked input with "I don't know". Results feed the same error types, weak topics, Progress and Home. Confidence is optional in a quiz |
| 25 | Explanation match | Removed by the user on 12 Oct 2026 (was a Should, then a self-check) | Medium / Low | Not built any more: the explanation is a reflection shown next to the why, with no keyword match, checkboxes or counts. The `explanationKeywords` data stays in the JSON unused |
| 26 | Create training from a material (simulated) | Must (added by the user on 8 Oct 2026; the core of feature 4) | High / Medium | Upload offers sample files (the guide, a one-page quick card with sections S1 and S2, a photo that fails). From a Ready material or Home "New scenario": Create training (Scenario and Quiz, sections to keep), a simulated four-step generation with Cancel, and a Review of every situation and question with sources, then Start training. Too-short material gets "Not enough material for a scenario. A quiz is available." Only the guide's prepared scenario and question bank exist, so the quick card makes a quiz from the bank's S1 and S2 questions. Created trainings are saved in the browser and shown as Scenario and Quiz tags |
| 27 | Second sample material: flood preparedness | Should (added by the user on 8 Oct 2026) | High / Low | `content/sample-flood-guide.md` (sections F1 to F7) with its own prepared scenario (`scenario-flood-preparedness.json`, 3 decisions, outcome: time lost and water level, no casualty) and quiz (`question-bank-flood.json`, 10 questions). Offered as the second sample file in the upload flow and turned into training like the guide. Only the 3-decision length exists for it. Its steps have no prepared Ask AI answers, so Ask AI is not offered there |
| 28 | Weak topics redesign and repeat round | Must (refines 7 and 8; added by the user on 9 Oct 2026) | High / Medium | Home and Progress show one repeat summary card (topics to repeat, error-type counts, "Repeat weak topics") and a sideways row of up to 5 topic cards by priority (misconception, knowledge gap, guess); a card repeats one topic. "See all" opens a Weak topics page grouped by error type with checkboxes and "Repeat selected". A repeat round mixes the weak steps and questions of the chosen topics |
| 21 | Ask AI about the current step (scripted chat in a bottom sheet) | Should (added by the user on 8 Oct 2026; not on the board) | High / Medium | Prepared question and answer pairs per step in the JSON, suggested question chips and keyword matching for free questions, an honest "not covered by the material" fallback, source chips on every answer. On the decision step it never reveals or hints at the correct option. After the session, each step in the results analysis has an "Ask AI about this step" link. This is not feature 13: it lives inside a scenario step, not outside the scenario |

## Information architecture
Assumption to confirm with the user: four sections live in the bottom navigation (Home, Materials, Progress, Profile). Onboarding, Scenario session and Session results are opened from other screens and have no navigation item.

- Onboarding (Онбординг): Practise a decision · Explain it, then check it · See what to repeat · Ready to start? (replayed from "How it works" on Home)
- Home (Головна): How it works (replays onboarding) · Continue session · Repeat summary and topic row · New scenario · Weak topics page (from See all)
- Materials (Матеріали): Materials list with tabs Ready, Processing and Failed · Upload sheet (sample files) · Material page · Create training · Generating · Review training · Upload sheet (simulated) · Material page (details, sections and excerpts)
- Progress (Прогрес): Repeat summary and topic row · Session history
- Profile (Профіль): Direction · Settings
- Scenario session (Сесія сценарію): Session setup (mode Scenario or Quiz; scenario length; quiz sections and question count) · Quiz question (five types) with the answer sheet · Situation and decision · Confidence check (Should) · Explain screen with the docked input · Answer sheet (bottom sheet after every step and question) · Source sheet (Should) · Ask AI sheet (feature 21; a bottom sheet, not a navigation item)
- Session results (Результати сесії): Summary · Error analysis · Repeat weak topics

## Main flow (the learning cycle)
Home → Material (PDF) → Session setup → Situation → Decision → Confidence check → Explain → Answer sheet (result, error type, your explanation, why, consequence) → another fork?
- Yes: next fork (back to Situation).
- No: Summary → Final analysis (error types, the full why with sources, consequence timeline) → Repeat weak topics → a new round on the weak topics.
Progress is saved after each session.

## Build notes
- No live AI calls. Every AI behaviour is simulated from the prepared scenario. The footer note "AI behavior is simulated for this prototype" stays on every screen.
- Mobile-first, following DESIGN.md.
- Keep to the Must and Should features. Do not build the Could and Won't features.
