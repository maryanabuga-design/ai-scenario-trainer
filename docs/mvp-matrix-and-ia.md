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
| 2 | Explain your decision + AI follow-up questions | Must | High / Medium | Scripted follow-up question per step from the JSON; the explanation is never graded automatically |
| 3 | Error analysis: what, why (knowledge / logic / carelessness), what to repeat | Must | High / Medium | Error type from correctness + confidence; misconception text from the JSON |
| 4 | Own material (PDF) as the base of the scenario | Must | High / Medium | Upload flow works as a screen sequence: choose a file, show processing, open the prepared scenario for the sample guide. Say clearly that this prototype uses a prepared scenario |
| 5 | Source link + honest "this is not in the material" | Must | High / Low | Source sheet with section ids (S1 to S10); include one "not covered by the material" state |
| 6 | Session setup: number of decisions and estimated time | Must | High / Low | Selector for the number of decisions with an estimated time |
| 7 | Progress and history: weak topics, return without a new prompt | Must | High / Medium | Store sessions in the browser on this device; show weak topics and session history |
| 8 | Repeat weak topics (from results and from progress) | Must | High / Low | Replay the steps that were wrong or guessed |
| 9 | Short onboarding + a ready example scenario | Must | Medium / Low | Three screens: choose direction, how it works, example scenario |
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
| 24 | Quiz question types | Should (added by the user on 8 Oct 2026) | High / Medium | Single choice, multiple choice (with how many to select), ordering (buttons and drag), short text (simulated keyword and phrase check), true or false. Feedback with the correct answer, why and sources; partial credit for multiple choice and ordering. Results feed the same error types, weak topics, Progress and Home. Confidence is optional in a quiz |
| 21 | Ask AI about the current step (scripted chat in a bottom sheet) | Should (added by the user on 8 Oct 2026; not on the board) | High / Medium | Prepared question and answer pairs per step in the JSON, suggested question chips and keyword matching for free questions, an honest "not covered by the material" fallback, source chips on every answer. Before feedback it never reveals or hints at the correct option. This is not feature 13: it lives inside a scenario step, not outside the scenario |

## Information architecture
Assumption to confirm with the user: four sections live in the bottom navigation (Home, Materials, Progress, Profile). Onboarding, Scenario session and Session results are opened from other screens and have no navigation item.

- Onboarding (Онбординг): Choose direction · How it works · Example scenario
- Home (Головна): Continue session · Weak topics · New scenario
- Materials (Матеріали): Materials list (items with Ready, Processing and Failed states) · Upload sheet (simulated) · Material page (details, sections and excerpts)
- Progress (Прогрес): Weak topics · Session history
- Profile (Профіль): Direction · Settings
- Scenario session (Сесія сценарію): Session setup (mode Scenario or Quiz; scenario length; quiz sections and question count) · Quiz question (five types) and quiz feedback · Situation and decision · Confidence check (Should) · Explanation and AI follow-up · Source sheet (Should) · Ask AI sheet (feature 21; a bottom sheet, not a navigation item)
- Session results (Результати сесії): Summary · Error analysis · Repeat weak topics

## Main flow (the learning cycle)
Home → Material (PDF) → Session setup → Situation → Decision → Confidence check → Explanation → AI follow-up → Consequence → another fork?
- Yes: next fork (back to Situation).
- No: Summary → Error analysis with sources → Repeat weak topics → a new round on the weak topics.
Progress is saved after each session.

## Build notes
- No live AI calls. Every AI behaviour is simulated from the prepared scenario. The footer note "AI behavior is simulated for this prototype" stays on every screen.
- Mobile-first, following DESIGN.md.
- Keep to the Must and Should features. Do not build the Could and Won't features.
