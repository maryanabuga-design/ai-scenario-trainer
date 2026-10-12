# DESIGN.md — AI Scenario Trainer (MVP)

Status: draft v1. Values marked (proposal) are open for change. Update this file first, then the code.

## Product and audience
- Product: AI-powered scenario-based training. The Trainee uploads their own material and practises decisions in scenarios, then gets feedback and error analysis.
- Context: educational only. Emergency-response and civil-protection training. No weapons, harm or combat content.
- Platform: mobile-first web app, designed for a 390 by 844 phone screen and usable from 360px wide. On wide screens the app is shown as a centred column about 430px wide on a neutral background (`--surface-muted`). There is no separate desktop layout.
- Scope and screens: see `docs/mvp-matrix-and-ia.md` and the screen map below.

## Principles
1. Calm, warm and focused. Trust matters more than delight.
2. Hierarchy comes from type, spacing and contrast, not from color.
3. Black is the action colour. One accent (indigo) for focus and links. Semantic colours only for status, always paired with an icon and a text label.
4. Soft blurred gradients only in the places listed under "Gradients". Never on the decision and feedback screens, never behind body text. No glows, mascots, emoji, 3D icons or decorative illustration.
5. AI shows itself through behavior (a source citation, stated uncertainty, an honest "not covered"), not through sparkles or orbs.
6. Readable under stress: large targets, short copy, one primary action per screen.

## Color tokens (proposal)
```css
:root {
  --bg: #F4F1EC;            /* warm off-white page background */
  --surface: #FFFFFF;       /* cards, inputs, sheets */
  --surface-muted: #EFECE5; /* inner panels, dropzone, current nav item */
  --border: #E2DED5;
  --border-strong: #8A867E; /* edge of text inputs, 3.6:1 on white, 3.2:1 on --bg */
  --text: #1A1A1A;
  --text-secondary: #5C5A55; /* 6.1:1 on --bg, 6.9:1 on white */
  --primary: #1A1A1A;        /* pill buttons, selected option */
  --primary-text: #FFFFFF;
  --accent: #3D3A8C;         /* focus ring and links only, 9:1 on white */
  --correct: #1F7A4D;        /* 5.3:1 on white */
  --wrong: #B3261E;          /* 6.5:1 on white */
  --caution: #8A5A00;        /* 5.9:1 on white */
  --correct-bg: #E8F3EC;
  --wrong-bg: #FBEAE8;
  --caution-bg: #F8EFD9;

  /* Category tags: pastel background, always --text on top (12:1 or more) */
  --tag-yellow: #F6EFA6;
  --tag-peach: #FAD6C2;
  --tag-blue: #D4E8F0;
  --tag-lilac: #E6DDF5;

  /* Gradient colours, used only inside the gradient zones below */
  --glow-yellow: #F2DE6E;
  --glow-peach: #F4B497;
  --glow-lilac: #D6C6F0;
  --glow-blue: #BCD9EA;
}
```
Rules:
- Accent must not be green or red (those carry meaning).
- Status = icon + label + color. Never color alone.
- Tags are categories, never status. Pastel green and pink are not tag colours, so tags cannot be read as correct or wrong.
- Dark theme is out of scope for the MVP.

## Typography (proposal)
- UI: Inter, system sans fallback.
- Titles: a serif (Source Serif 4) for page titles, material and scenario titles and the scenario narrative. Everything else is sans.
- Scale: 12 (minimum, labels and tags only) / 14 (secondary) / 16 (body) / 18 (lead) / 22 / 28 / 34 (results and onboarding headline). Body line-height 1.6, headings 1.2.
- Two-tone headline on results and feedback: one heading split into two parts, the first in `--text`, the second in `--text-secondary` (sans, 28 or 34). The first part says what happened, the second what to do next. Example: "Session complete." + "Review the three topics below." It stays one heading element for screen readers.
- Use tabular numerals for scores, counts and progress.

## Spacing, shape, depth
- Spacing scale (4px base): 4, 8, 12, 16, 24, 32, 48.
- Radius: 24px cards and sheet top corners, 16px inner panels, options and inputs, full pill for buttons, tags and the current nav item. Borders 1px `--border` where a card sits on `--surface`.
- Cards are white on the warm page with no border; inner panels are `--surface-muted` inside a white card.
- No shadows except a subtle one on overlays (sheet, dialogs).

## Gradients
- Allowed only in: onboarding screens, the top area of Home, material covers, and the header of Session results.
- One smooth mesh: a gradual blend of warm yellow, lavender and peach (cool variant: blue, lavender, peach). Built from a three-colour linear blend plus two round colour fields, blurred by about 70px and mixed with `--bg` so the contrast stays low. No separate visible blobs, edges or stripes. The blur layer is clipped by the card's rounded corners.
- Never on Session setup, the decision step or feedback. Never behind body text, form controls or status badges. Titles and tags may sit on a gradient zone only if they keep 4.5:1 against its lightest and darkest point (3:1 for text 24px and larger). `--text-secondary` on a gradient is allowed only at 24px and larger.
- Material cover: a 56px or larger rounded square (16px radius) filled with a gradient. Each material gets a fixed combination, not random.
- Static. No animation.

## Layout
- Single column with 16px side padding. Content width is the screen width, 430px maximum.
- Safe areas: respect the top and bottom safe areas (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) on every fixed element.
- Bottom navigation: four sections, Home, Materials, Progress and Profile. It is shown only on these four sections.
- Onboarding, Session setup, the scenario session and Session results are opened from other screens. They have no navigation item and no bottom navigation; they show a "Back" text button at the top left (or "Exit" during a session). Exit needs no confirmation: the session stays saved and Home offers to continue it.
- Primary action: a fixed bar at the bottom of the screen with one black pill button. On the four sections it sits above the bottom navigation; elsewhere it sits at the bottom. Scrolling content gets bottom padding so nothing hides behind the bar.
- During a session: a top bar with "Exit" (to Home, which offers to continue), the scenario title and the step count ("2 of 6") with progress dots.
- Sources: the source panel is a bottom sheet opened from a source chip.

## Screen map
From `docs/mvp-matrix-and-ia.md`.
- Onboarding (first visit only, can be skipped): Choose direction → How it works → Example scenario. Opening Home before onboarding is done or skipped leads to onboarding. A "Skip" text action at the top right of every onboarding step marks it done and opens Home. Progress dots show the step (1 of 3). Gradient zone at the top of each step, with the step title on it.
  - Choose direction: "Building evacuation and first aid" is the only selectable direction. "Road incident first aid", "Flood preparedness" and "Crisis communication" are listed as disabled with "Not available in this prototype".
  - How it works: four numbered points (choose an action, say how sure you are, explain in one sentence, get feedback from the guide with the error type and source) and a line that AI behaviour is simulated in this prototype.
  - Example scenario: a preview of the sample scenario (its first situation, decision count and time) with "Try it", which opens Session setup, and a text action "Go to Home".
- Home: a gradient top with a two-tone headline and the current direction as a tag → "Continue session" card (only when a session is unfinished; the whole card is the link: scenario, mode, "Step 3 of 6") → the repeat summary card and the topic row → "New scenario" card (the whole card is the link to Create training for the sample guide). Home has no action bar: the summary card's "Repeat weak topics" is its one primary action, and no fixed button covers the cards. The content keeps bottom padding above the floating navigation so no card text is hidden.
- Weak topics (Home, Progress and the Weak topics page) come from the saved session history, scenario steps and quiz questions alike: for each step or question, the most recent answer counts, and it is weak when that answer was wrong, partly right or guessed. A topic is a guide section behind weak answers (S2 "Checking the route", F5 "The dangers of floodwater"). Its error type is the most serious among its weak answers, in priority order misconception, knowledge gap, guess; topics are ordered by that priority, then by how many answers are weak. Repeating topics starts a repeat round with their weak steps and questions together.
- Repeat summary card (Home, Progress): a white card with "N topics to repeat" (lead, medium), one line of error-type counts in 14 `--text-secondary` ("1 misconception, 2 knowledge gaps"), and the primary button "Repeat weak topics" (black pill, full width). With nothing weak: "No weak topics yet. They appear here after a session or a quiz." and no button.
- Topic card: a white card (24px radius, 16px padding) in a row that scrolls sideways, about 40% of the screen wide so about two and a half show and the cut card signals more. Top row: the topic icon in a soft rounded square tile (40px, 12px radius) on the left and the chevron on the right. Then a soft pastel tag with how much it repeats ("2 to repeat"), the human topic name (the section title, 16 medium, up to three lines), a small grey source line with the material and section ("Evacuation guide · S2", 12 `--text-secondary`), and the error-type status badge (icon + label). The whole card is one button that repeats only that topic, labelled for screen readers ("Repeat Checking the route"). No hover change; pressed and focus as for every tappable card. At most 5 cards, by priority. Above the row: "Topics" (14 medium) and a "See all" text link; no dots.
- Weak topics page (from "See all"): back link to Home, title "Weak topics", then groups with headers in priority order ("Misconceptions", "Knowledge gaps", "Guesses", each with its status icon and a count). Each topic is a checkbox card with its name and source line; all are selected at first. A primary "Repeat selected (N)" sits in the action bar, disabled with a reason when nothing is selected. Empty state: one line ("No weak topics yet. Finish a scenario or a quiz and they appear here.") and a secondary "Start a scenario".
- Repeat round: a session that mixes steps and questions from the chosen topics, in topic order; each item uses its own screen (decision step or quiz question) and feedback. The top bar reads "Item 2 of 5". Results show correct and incorrect counts without a situation outcome, headed "Repeat complete."
- Materials: Materials list · Upload sheet · Material page.
  - Materials list: one row per material (cover, name, type, size and date added, status badge): your uploads first, newest first, then the sample materials with the guide on top. An "Upload a file" secondary button sits next to the page title. Below the title, underline tabs "Ready", "Processing (N)" and "Failed (N)" filter the list (counts on the last two); Ready is open by default, and starting a simulated upload switches to Processing, where the new file shows with its progress until it is Ready or Failed; then the list follows it to that tab. Each tab has a one-line empty state. The evacuation guide uses the warm gradient cover; other materials use a plain `--surface-muted` square with the file type in 12 uppercase. A Processing row adds a thin progress bar; a Failed row adds its reason in 14 `--text-secondary` and a "Try another file" secondary button that opens the upload sheet.
  - Material status badge (icon + label + colour): Ready (check, `--correct` on `--correct-bg`), Processing (clock, neutral outlined like Guess), Failed (cross, `--wrong` on `--wrong-bg`).
  - Upload sheet: a bottom sheet like the source sheet, with the line "Upload is simulated for this prototype. Choose a sample file." Three states: choose (a list of sample files as option rows: file cover, name, type and size, and one line on what it contains), progress (file name, a progress bar with percent, "Checking the file"; the file also appears under the Processing tab), result (Ready: status badge, "Create training" primary and "Open material" text action; Failed: reason and "Try another file"). Sample files: the full evacuation guide, the flood preparedness guide (F1 to F7, with its own scenario and quiz), a one-page "Evacuation quick card" (guide sections S1 and S2 only, too short for a scenario) and a photo of a notice (fails: no readable text). Uploaded items stay in this browser.
  - Material page: name (serif), type tag, a details card with label/value rows (Type, Size, Added, Status), the scenario card, then sections with a one-line excerpt each (tap opens the source sheet for the guide). Materials without sections say why ("This prototype does not read uploaded files, so there are no sections to show."). Once training has been created, small tags "Scenario" and "Quiz" (pastel, uppercase) show under the name, on the material page and on its row in the list. The action bar's primary button is "Start training" when training exists (with a text action "Create again"), otherwise "Create training" when the material holds guide content. For a material without guide content it is disabled with the line above it: "In this prototype, training can be created from the sample guide and its quick card only." and a text action "Open the sample guide".
- Progress: the repeat summary card and topic row (as on Home) · Session history (newest first: date, mode tag, "4 of 6 correct", and how many steps were weak). Empty state for a first visit: one line and a "Start a scenario" secondary button. Sessions are saved when they finish.
- Create training (from a Ready material's "Create training" and from Home "New scenario"): back link to the material, title "Create training", the material name. Then "What to create" as two checkbox cards, both on by default: Scenario ("N decisions, one story through the guide") and Quiz ("N questions from the sections below"). Then "Sections found" as compact checkbox cards for the detected guide sections, all ticked; at least one must stay (the last one cannot be unticked, with the line "Keep at least one section."). One line explains that the scenario is one prepared story and the ticks shape the quiz. Primary "Generate" in the action bar, disabled with a reason when nothing can be created. If the material is too short for a scenario: the Scenario card is disabled and a neutral notice reads "Not enough material for a scenario. A quiz is available."; quiz only.
- Generating: no navigation, a calm full screen: title "Creating your training", the line "Generation is simulated for this prototype. Prepared content is shown." in 14 `--text-secondary`, then four steps as a list: "Reading the material", "Finding key sections", "Writing situations", "Writing questions" (situations is skipped and marked "Not needed" when there is no scenario). Each step shows a state with icon and label: waiting (empty circle, "Waiting"), working (clock, "Working"), done (check, "Done"). A thin overall progress bar with percent, about 4 seconds in total, announced politely. Text button "Cancel" returns to Create training without saving. When done, it opens Review.
- Review training: title "Your training is ready", the material name, then two cards: "Scenario: N decisions" and "Quiz: N questions", each with a disclosure button ("Show all decisions" / "Show all questions", `aria-expanded`). Expanded, the scenario lists every situation (title, the question asked, source chips) and the quiz lists every question (type tag, question, source chip). Primary "Start training" (opens Session setup for this material), secondary "Back to material".
- Session setup for a material's training: the mode control shows only what was created; the quiz sections start from the ones chosen in Create training and can be narrowed further.
- Profile: Direction (the four directions as option cards; only "Building evacuation and first aid" can be selected, the others are disabled with "Not available in this prototype") · Settings: "Reset progress" (secondary button) opens a confirmation dialog. Reset deletes the saved sessions, history, weak topics and created trainings on this device; the direction, onboarding and uploaded files stay. Afterwards a neutral line confirms it.
- Session setup: when a session is unfinished, one line above the start button says that starting replaces it. First a mode choice as a full-width segmented control: Scenario or Quiz.
  - Scenario: length cards Short (3 decisions, about 5 min, steps 1 to 3), Full (6, about 10 min) and Extended (10, about 16 min: the full story with four extra steps). Times are always labelled as estimates ("about"). Lengths the material's scenario does not have are shown disabled with "Not available for this material" (the flood guide has only 3 decisions, so it starts there).
  - Quiz: guide sections as compact checkbox rows (section id, title, number of questions in the bank), with "Select all"; then the number of questions as pills 5, 10, 15 and Custom. Custom shows a stepper: a "−" and a "+" icon button of 44px around the number, the number announced politely. Counts above what the chosen sections hold are disabled, with the line "These sections have N questions." At least one section must be chosen; the start button explains what is missing.
- Scenario session: Decision (situation, options, confidence, "Continue") → Explain (the chosen option as a quote and one question: "In one sentence, why did you choose this?") → the answer sheet rises over the Explain screen → "Continue" → next step. There is no separate feedback screen and no AI follow-up question. The progress dots count steps, not screens. Source sheet available throughout.
- Session results (the final analysis): summary → error types → the consequence timeline → error analysis per step or question (error type, the full why, sources) → weak topics → self-check and "Marked correct by you" counts → repeat action. Everything that is not in the answer sheet lives here.

## Components and states
Every component needs: default, hover, focus-visible, active, disabled. Inputs also need error.
- Button hierarchy. Three levels of action plus references, applied everywhere:
  - Primary: filled black pill, white text, minimum 48px high. The one main action of a screen, usually in the action bar: Start session, Start quiz, Continue, Check, Continue in the answer sheet, See results, Repeat weak topics on the results screen. Focus: 2px `--accent` ring, 2px offset. White on black is 17:1.
  - Secondary: white pill with a 1px `--text` (dark) outline, `--text` label, minimum 44px: Upload a file, Try another file, Repeat weak steps and Repeat weak questions on Home and Progress, Ask AI, Start a new scenario. Hover fills `--surface-muted`. The outline is 15:1 against the page, so the button edge is clear.
  - Text: no fill, `--text`, always underlined with a 4px offset so it reads as an action; the underline thickens on hover. Exit, Back, Close, Cancel, Clear all.
  - References, not actions: source chips (see Source chip). They must never look like a button.
  - Ask AI uses the secondary style with a small sparkle icon before the label ("Ask AI about this step"). The icon is decorative and hidden from screen readers.
  - Suggested questions (Ask AI and "Ask about this step") are white pills with a 1px `--border`, 14 text: a lighter secondary that sends a question.
  - Disabled (all variants): a filled light-grey pill, `--text-secondary` on `--surface-muted`, no border, `cursor: not-allowed`. Text buttons have no disabled state; hide them instead.
- Card: white, 24px radius, 16 or 24px padding, no border on the page background.
- Tappable cards (topic cards, material rows, the Continue session and New scenario cards, option and checkbox cards, section rows): no hover effect at all; a card never changes when the mouse passes over it. Pressed (while tapped or clicked): the background darkens slightly to `--surface-muted` (white cards) or `--border` (cards already on `--surface-muted`). Keyboard focus: the 2px `--accent` ring with a 2px offset. A card that opens something or starts something shows a chevron (`ChevronRight`, 20px, `--text-secondary`) on its right. Option and checkbox cards select instead, so they show their radio or check box, not a chevron. Buttons, chips and pills keep their own hover and pressed states.
- Icons: one outline set, Lucide (`lucide-react`), stroke width 2, sizes 16 (inline, badges), 20 (chevrons, controls), 22 (navigation), 24 (topic tiles) and 40 (empty states). No emoji, no mascots, no filled or 3D icons, nothing hand-drawn next to them. Icons are decorative: always `aria-hidden`, always next to text that says the same thing. Not in the Home gradient header.
  - Topic icon tile: a 40px soft rounded square (12px radius) on a pastel tile with a dark (`--text`) 24px icon. The tile colour comes from the material, never from the error type: `--tag-yellow` for the evacuation guide, `--tag-blue` for the flood guide (peach and lilac stay free for later materials; no green or pink). Contrast of the icon on its tile: 14.8:1 on yellow, 13.8:1 on blue.
  - Topic icons (in the topic data, with a default of `BookOpen`): S1 alarm `BellRing`, S2 checking the route `DoorOpen`, S3 smoke `Wind`, S4 assembly point `MapPin`, S5 calling for help `Phone`, S6 assessing an injured person `HeartPulse`, S7 bleeding and S8 burns `Bandage`, S9 unresponsive person `HeartPulse`, S10 handover `ClipboardList`, every flood section `Droplet`.
  - Empty states (no weak topics, no materials in a tab, no history): a large 40px icon in `--text-secondary` on a 72px `--surface-muted` circle, centred above one line of text (and the empty state's button, if it has one). Icon on the circle: 5.8:1. Weak topics `ListChecks`, materials `FileText`, history `History`.
- Tag: small uppercase label, 12, letter-spacing 0.04em, medium weight, `--text` on a `--tag-*` pastel, pill shape, 4px 10px padding. For categories such as "SCENARIO", "MATERIAL", "SHORT", "S2". Never for status.
- Option (answer choice): white, 16px radius, 1px `--border`, a radio circle on the right. Selected: 2px `--primary` border and a filled black radio. Locked after submit: unselected options fade to `--text-secondary`. Correct and wrong: status badge with icon and label, plus the matching status border. Never colour alone. Disabled (an option that cannot be chosen, such as a direction not available in this prototype): `--surface-muted` background, no border, text in `--text-secondary`, a dashed radio circle, and a line saying why ("Not available in this prototype").
- Confidence selector: three labelled pills (not very / somewhat / very confident). Selected is the black pill. No traffic-light colors.
- Practice step (progressive reveal): options first. After an option is chosen, show the confidence selector. The primary button "Continue" is enabled once both are chosen and opens the Explain screen. The decision is saved and locked at that point.
- Explain screen: the same top bar (Exit, progress dots on the same step). "Your choice" (label in 12 uppercase `--text-secondary`) above the chosen option as a quote (a `--surface-muted` panel, 16px radius, 2px `--border-strong` bar on the left), with no verdict. Then the prompt "In one sentence, why did you choose this?" in large type (serif 24). The answer is typed in the answer dock (below). After sending, the sentence shows under the prompt as a right-aligned bubble (`--surface-muted`, 16px radius), or "Skipped" in 14 `--text-secondary`, and the answer sheet rises.
- Answer dock (Explain screen and short-text quiz questions): docked at the bottom in place of the action bar, and above the on-screen keyboard when it is open (it follows the visible area of the screen, also at 360px). A white field with a 1px `--border-strong` edge and 24px radius that grows from one line to four, 16px text, the prompt as its accessible label and a placeholder ("Your answer in one sentence" or the question's placeholder). Two controls sit inside the field on the right: a text button "I don't know" (14, underlined, at least 44px) and a round send button (44px circle, arrow-up icon, labelled "Send"). The send button is light grey (`--surface-muted` with a `--text-secondary` icon) and disabled while the field is empty, black with a white icon once there is text. Enter sends; Shift+Enter adds a line. "I don't know" sends nothing and counts as skipped.
- Answer sheet (replaces the feedback screen for scenario steps and every quiz question type): a bottom sheet that slides up over the screen just answered (200ms; no motion with reduced motion), 24px top radius, a 4px by 36px `--border-strong` grab handle (decorative), `--surface`, the scrim behind it. At most 75% of the screen high, so the question stays visible above it. On open, focus moves to the sheet title and the verdict is announced politely. It does not close with the scrim, Escape or a swipe: only its "Continue" button closes it and goes on. The content scrolls inside the sheet; the bottom area stays put. From top to bottom:
  - Verdict row, which is the sheet title: icon + label in 20 medium. Scenario: "Right call" (check, `--correct`) or "Not the best action" (cross, `--wrong`). Quiz: "Correct", "Partly right" (half icon, `--text-secondary`), "Not correct", for short text "Looks correct" or "Doesn't match our answer. Yours might still be right." (cross, `--wrong`), "Marked correct by you" (user-check, `--text-secondary`) and "You said you don't know" (minus, `--text-secondary`).
  - Answer boxes (16px radius, 16px padding, each with an icon and a 12 uppercase label, never colour alone). Wrong: "Your choice" in a box with a 1px `--wrong` outline and a cross icon, then "Better choice" in a box with a 1px dashed `--correct` outline and a check icon. Right: one "Your choice" box with a 1px `--correct` outline and a check icon. Quiz labels: "Your answer" and "Correct answer" ("Reference answer" for short text). Multiple choice and ordering add one line on how many are right ("2 of 3 correct options chosen", "2 of 4 in the right place") and show the full correct answer, ordering as a numbered list. Partly right uses a neutral 1px `--border-strong` outline with the half icon.
  - Why: one or two lines in 16, then the source chips ("Guide · S2").
  - What happened (scenario only): one line with the consequence, then the state change in 14 `--text-secondary` ("Time lost +30 s · Smoke level +1").
  - Points a strong answer covers (scenario only): one checkbox card per key point, labelled "My answer covers this", pre-checked by the keyword match. The count "N of M points" under the heading, announced politely. When any point is unchecked: the line "Your explanation may still be right. Check the points you covered." in 14 `--text-secondary` and a secondary button "My answer covers all points". After "I don't know", the points are a plain list as a hint, without checkboxes, under the word "Skipped". The checkbox state is saved with the step as it changes.
  - Short text that does not match: a secondary button "My answer is still correct" under the boxes. It marks the answer correct (the verdict becomes "Marked correct by you") and changes the quiz score and error type. Focus moves to the new verdict.
  - Bottom area (sticky inside the sheet, `--surface`, 1px `--border` on top): "Ask AI about this step" as a small secondary pill (scenario steps with prepared answers only), then the primary "Continue" ("See results" on the last item).
  - Never in the sheet: the error type, a percentage, points or any score. They are in the final analysis.
- The user's explanation is never graded by the app: the user ticks the points it covers. The self-check never changes the score, error types, weak topics or repeat rounds.
- The honest "not covered" answer: on the smoke step, the guide-not-covered question is one of the Ask AI suggested questions. The answer says "This is not covered by the material." and then "Closest sections in the guide:" with source chips. Neutral style, no warning colour.
- Status badge: icon + label + colour, used for the error type and the verdict. Labels in sentence case.
  - Secure: check icon, `--correct` on `--correct-bg`.
  - Guess: question-mark icon, neutral outlined badge: `--text-secondary` on `--surface-muted`, 1px `--border`.
  - Knowledge gap: minus icon, `--caution` on `--caution-bg` (the only badge that uses amber).
  - Misconception: cross icon, `--wrong` on `--wrong-bg`.
  - Shape: pill, 12 label size, 4px 10px padding. Each type has a one-line description beside it, for example "Wrong answer, high confidence".
- Result row (results summary): an inner panel with an icon box (check or cross in a 40px rounded square with the status colour), a label such as "4 correct" and a count. Icon + label + colour.
- Source chip: shows "Guide · S2" (document name + section id; the guide has no page numbers) after a small document icon. Smaller than a button: 32px visible height, 12px horizontal padding, 14 text, `--text` on a soft `--surface-muted` fill, no border. The tap area still reaches 44px (an invisible extension above and below). It reads as a reference, not an action. Opens that section in the bottom sheet. Focus: the same 2px `--accent` ring. Text on the fill is 14:1.
- Material cover: gradient square, see "Gradients".
- Bottom navigation: a floating rounded bar, not attached to the screen edge. White pill-shaped bar, 1px `--border`, a very subtle shadow (it floats over content), 16px space at the sides and at least 12px below it (plus the safe area), on a flat `--bg` strip. Four items (Home, Materials, Progress, Profile), each with a simple line icon and a visible label, at least 44px high. Current item: a soft yellow pill (`--tag-yellow`) behind icon and label, text in `--text` medium, `aria-current="page"`. Others in `--text-secondary`.
- Action bar: fixed at the bottom, `--bg` with a 1px `--border` on top, 16px padding, safe-area padding when it is the lowest element. Holds one primary pill button, full width. A disabled button explains why in one line above it (for example "Choose an answer to continue").
- Bottom sheet: opens from the bottom, up to 80% of the screen height, content scrolls inside. 24px radius on the top corners, `--surface` background, a scrim behind it. Has a title (section id and name), a close button of at least 44px, closes with the scrim, the Escape key and the close button. Traps focus while open and returns focus to the source chip on close. Opening animates briefly and not at all with reduced motion.
- Segmented length selector (Session setup): three large option cards, Short, Full and Extended, with decision count and estimated time. Selected uses the option selected style.
- Explanation self-check: see Answer sheet. The keyword match only pre-checks boxes; the user's checkboxes are what counts, shown as "N of M points" (never a percentage).
- Segmented control: a full-width soft grey track (`--surface-muted`, pill, 4px padding) with equal options of at least 44px. The selected option is a black pill with white text, a small check icon and medium weight, so the state does not rely on colour alone. Built from native radio buttons, so arrow keys move the selection and Tab enters and leaves the group. Focus: 2px `--accent` ring on the focused option.
- Tabs: underline tabs, a row of text labels at least 44px high on a 1px `--border` baseline. The selected tab has a 2px `--text` underline, medium weight and `--text`; the others `--text-secondary`. Optional count after the label in tabular numerals ("Failed (1)"). Arrow keys move between tabs, Home and End jump to the ends; the selected tab is the only one in the Tab order (`role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`).
- Checkbox card: like the option card, with a square check box (4px radius) instead of the radio circle; used for multiple choice and quiz sections.
- Stepper: "−" and "+" icon buttons (44px, white pill with 1px `--border`) around a tabular number; buttons disable at the limits.
- Quiz question (top bar "Question 3 of 10" with dots, a section tag, the question in 18 medium; no narrative):
  - Single choice: option cards (radio).
  - Multiple choice: checkbox cards and the hint "Select all that apply (2 are correct)."
  - Ordering: a numbered list of white rows, each with a drag handle on the left (drag with mouse or touch) and "Move up" and "Move down" icon buttons (44px, labelled for screen readers) on the right. The moved row keeps focus. Hint: "Put the steps in order. Use the arrows or drag."
  - Short text: the answer dock (with "I don't know") instead of a field in the page, and the hint "A few words are enough."
  - True or false: two option cards side by side, True and False.
  - Then the optional confidence selector, labelled "How sure are you? (optional)". A primary "Check" in the action bar is enabled once there is an answer (short text sends with the dock instead). The answer sheet then rises over the question.
- Quiz results: the same final analysis as session results without the situation outcome and timeline: points ("7.5 of 10 points"), correct and incorrect rows, error types, analysis per question (error type, the full why, sources; partial credit as "0.5 of 1 point"; a short answer the user marked correct shows the "Marked correct by you" badge), "Marked correct by you: N", weak topics, and "Repeat weak questions".
- Ask AI button: only for steps with prepared answers (the flood scenario has none, so it is not shown there). Secondary pill with a sparkle icon, "Ask AI about this step", shown on the decision step under the source chips and in the answer sheet above "Continue" (a smaller 40px pill there, still with a 44px tap area). Opens the Ask AI sheet over the answer sheet; closing it returns to the answer sheet.
- Ask AI sheet: a bottom sheet like the source sheet (24px top corners, `--surface`, scrim, subtle overlay shadow, Escape and Close dismiss it, focus is trapped and returns to the button), 85% of the screen height so the conversation has room. From top to bottom:
  - Header: "Ask AI" (serif 22), the step title in 14 `--text-secondary`, a Close button of at least 44px.
  - A visible line in 14 `--text-secondary`: "Answers are simulated for this prototype."
  - The conversation, scrolling inside the sheet and kept to its end. Trainee messages are right-aligned bubbles: `--surface-muted`, 16px radius, 16 `--text`. AI messages use the tutor message style: plain left-aligned text in 16 `--text`, no bubble or avatar, with source chips ("Guide · S2") under every answer. The not-covered answer reads "This is not covered by the material." then "Closest sections in the guide:" and chips. Before feedback, a question that would reveal the answer gets "I can explain this after you check your answer, so the choice stays yours." with the step's source chips.
  - Typing indicator before each answer: three small `--text-secondary` dots that pulse, with the visually hidden text "AI is typing" announced politely; static dots with reduced motion. About 0.7 seconds.
  - Suggested question chips for the step (3 or 4, white pills like the suggested question). Before anything is asked, they fill the empty conversation area, stacked and wrapped in full so nothing is cut off, under a one-line intro. Once the trainee has sent a question, the remaining ones move to a single row that scrolls sideways above the text field, so the conversation gets the space (important with the on-screen keyboard open). A chip disappears once asked.
  - Input row: a text field (full pill, 1px `--border-strong` edge, 16px text so phones do not zoom, placeholder "Ask about this step") and a black pill "Send" button, both at least 44px high. Send is disabled while the field is empty or an answer is typing.
  - With the on-screen keyboard open the sheet shrinks to the visible area so the input row stays above the keyboard.
- The conversation is kept per step while the session is open, and it continues from the decision step into that step's answer sheet.
- Footer note: one line at the end of the content on every screen, above the bottom navigation or action bar, in 14 `--text-secondary`: "AI behavior is simulated for this prototype. All feedback comes from the source guide."
- Session results (final analysis): two-tone headline on a gradient header → result rows (correct, wrong) → error-type breakdown (four rows, badge + count) → situation outcome (each scenario's own rows as plain label/value rows, no charts: evacuation shows time lost, smoke level and, in Full and Extended, the injured colleague; flood shows time lost and water level) → "What happened": the consequence timeline, a numbered list with each step's title, consequence and state change → error analysis per step or question (title, error type badge, your choice and the better one, the full why, source chips) → weak topics → summary rows: "Explained in your own words: N of M points (self-checked)" over the steps that were explained ("Skipped" when every step was skipped; no row for a quiz) and "Marked correct by you: N" (only when the session had questions) → primary action "Repeat weak topics" with the number of items it replays in one line above it, text action "Back to Home".
- Tutor message: plain text, source chips inline, no avatar character. Used for AI answers in the Ask AI sheet.
- Progress: segmented dots or a thin bar with a numeric label. No hatched or decorative bars.
- Dropzone: dashed border on `--surface-muted`, 16px radius, one line of instruction, a "Choose a PDF" secondary button.
- Confirmation dialog (Exit session, Reset progress): white card, 24px radius, title, one sentence, a black pill confirm and a text cancel.

## Content and tone
- Calm, direct, sentence case. No emoji, no exclamation marks, no jokes.
- Short labels. Say what happened and what to do next.
- AI states uncertainty plainly and always points to the source passage, or says the material does not cover it.

## Accessibility
- WCAG AA: 4.5:1 text, 3:1 for large text and UI boundaries.
- Visible focus ring: 2px `--accent`, 2px offset.
- Everything operable by keyboard. Respect `prefers-reduced-motion`.
- Minimum touch target 44×44px.

## Do / Don't
- Do: use whitespace and type size to create hierarchy.
- Do: show the source next to every AI claim.
- Do: keep gradients to the four allowed zones.
- Don't: use identical cards without hierarchy, random gradients or decorative icons.
- Don't: celebrate with confetti or mascots; use a neutral confirmation instead.
