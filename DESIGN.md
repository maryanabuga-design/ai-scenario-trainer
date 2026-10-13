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
4. No gradients. The only decoration is the abstract SoftShape in two Home cards (see "Decorative shapes"). No glows, mascots, emoji, 3D icons or decorative illustration.
5. AI shows itself through behavior (a source citation, stated uncertainty, an honest "not covered"), not through sparkles or orbs.
6. Readable under stress: large targets, short copy, one primary action per screen.

## Color tokens (proposal)
```css
:root {
  --bg: #F3EEE9;            /* soft warm greige page background (measured from the Home target) */
  --surface: #FFFFFF;       /* inputs, option cards, sheets, the navigation bar */
  --card: #FAF7F3;          /* warm near-white card fill, with --card-shadow */
  --card-shadow: 0 1px 2px rgb(60 45 30 / 0.04), 0 8px 24px rgb(60 45 30 / 0.05);
  --secondary-sand: #F0ECE6;          /* Secondary = sand: inactive states and tonal backgrounds (see "Colour system") */
  --secondary-sand-pressed: #E2DED5;  /* pressed sand, the 1px stroke around sand shapes, and inactive dots and segments */
  --surface-muted: #E2DED5;          /* neutral panels: status chips, empty-state circles, chat bubbles, thin progress tracks */
  --border: #E2DED5;
  --border-strong: #8A867E; /* edge of text inputs, 3.6:1 on white, 3.2:1 on --bg */
  --text: #1A1A1A;
  --text-secondary: #5C5A55; /* 6.1:1 on --bg, 6.9:1 on white */
  --primary: #3F4638;        /* deep olive green: primary buttons, secondary outlines, selected states; white on it 9.8:1 */
  --primary-pressed: color-mix(in srgb, var(--primary) 70%, var(--text)); /* #34392F, pressed primary; white on it 11.85:1 */
  --primary-text: #FFFFFF;
  --accent: #3D3A8C;         /* focus ring and links only, 9:1 on white */
  --correct: #1F7A4D;        /* 5.3:1 on white */
  --wrong: #B3261E;          /* 6.5:1 on white */
  --caution: #8A5A00;        /* 5.9:1 on white */
  --correct-bg: #E8F3EC;     /* reserved: Correct only */
  --wrong-bg: #FBEAE8;       /* reserved: Incorrect only */
  --caution-bg: #F8EFD9;
  --secure: #3D5A43;         /* Secure error type (sage), 6.1:1 on --secure-bg */
  --secure-bg: #E2E7DD;
  --misconception: #7A3049;  /* Misconception error type (rose), 6.9:1 on --misconception-bg */
  --misconception-bg: #F5DCE0;

  /* Category tags: pastel background, always --text on top (12:1 or more) */
  --tag-sage: #DFE5D8;       /* muted sage: the TRAINING tag and the sage topic tile (the same value as --secondary-sand); --text on it 13.5:1 */
  --stroke-neutral: #D3CDC2; /* 1px stroke of an unselected option card */
  --stroke-sage: #A9B5A0;    /* 1.5px darker sage-grey stroke of a selected option card */
  /* Section code circles: the topic tile tints at 70% on white, assigned by section like the tiles; --text on each 14:1 or more */
  --code-yellow: #F9F4C1;
  --code-blue: #E1EFF4;
  --code-lilac: #EEE7F8;
  --code-sage: #E9EDE4;
  --code-peach: #FCE2D4;
  --secondary-pressed: #E3E8DC; /* light sage tint of a pressed secondary pill; --primary label on it 7.9:1 */
  --nav-active: #F9EDC8;     /* the soft yellow pill behind the current navigation item */
  --next-card: #F2F3EE;      /* the sage "Next up" card */
  --next-tile: #D4DBCD;      /* its round tile, --text icon on it 12.3:1 */
  --tag-yellow: #F6EFA6;
  --tag-peach: #FAD6C2;
  --tag-blue: #D4E8F0;
  --tag-lilac: #E6DDF5;

  --mesh-moss: #7A8450;      /* moss sage: only the SoftShape curves (see "Decorative shapes") */
  --material-tile: var(--next-tile); /* #D4DBCD, the one material tile fill for PDF, DOCX and LINK */
}
```
Rules:
- Accent must not be green or red (those carry meaning).
- The saturated status green and red are reserved for the answer result: `--correct` / `--correct-bg` mean "Correct" and `--wrong` / `--wrong-bg` mean "Incorrect". Error types use their own muted tints (sage, warm grey, soft amber, soft rose), always with their own icon and name, so a type is never read from its colour. Material status uses neutral and amber. The status green stays clearly apart from the olive of the gradient.
- Status = icon + label + color. Never color alone.
- Tags are categories, never status. A material's type is not a tag: it is the icon and plain label on its material tile (see "Material types"). Every tag ("SCENARIO", "QUIZ" and the rest) uses the one neutral surface. The status green (`--correct` #1F7A4D on `--correct-bg`, always with a check icon and the word "Correct") is far more saturated than the grey-green sage, so a file tag never reads as a result. Status green, bright green and pink are not tag colours, so tags cannot be read as correct or wrong; the sage tag is grey-green and muted.
- Dark theme is out of scope for the MVP.

## Typography
- One sans family for everything: DM Sans (Google Fonts via `next/font`), weights 400, 500 and 600, chosen against Figtree, Plus Jakarta Sans and Instrument Sans as the closest to the friendly geometric sans of the Home target. No serif anywhere. Letter-spacing is normal except for uppercase labels.
- Text styles, locked from the Results screen of 12 Oct 2026 (values read from the computed styles there). Every screen uses only these styles, as the `type-*` utilities in `globals.css`; no component sets its own font size, weight, line height or letter-spacing. Colour is separate (a style can be `--text`, `--text-secondary` or a tint's ink).

| Style | Utility | Size / line height | Weight | Extra | Used for |
|---|---|---|---|---|---|
| Display headline | `type-display` | 28 / 35 (1.25) | 600 | | Results headline, Home headline, onboarding step headlines |
| Display sub-line | `type-display-sub` | 18 / 28 | 400 | `--text-secondary` or `--header-subline` | the grey second line of a display headline on Results |
| Page title | `type-page-title` | 28 / 35 (1.25) | 600 | | the h1 of every other screen (Materials, Progress, Session setup, Error analysis…) |
| Card title | `type-card-title` | 22 / 27.5 (1.25) | 600 | | card and sheet titles, the progress card title, the ring numeral |
| Item title | `type-item-title` | 18 / 24.75 (1.375) | 600 | | titles inside cards and lists (answer cards, topic cards, scenario cards, Next up), section headings, question text |
| Body | `type-body` | 16 / 25.6 (1.6) | 400 | | running text, option text, text buttons and links |
| Body strong | `type-body-strong` | 16 / 25.6 (1.6) | 600 | | names in rows (error types, step titles), values (Outcome), legends, the selected tab |
| Grey secondary text | `type-small` + `--text-secondary` | 14 / 20 | 400 | | descriptions, sub-lines, hints, captions under titles, the footer note; the same size in `--text` for small controls (source chips, chat chips, confidence pills) |
| Uppercase label | `type-label` | 12 / 16 | 500 | uppercase, letter-spacing 0.06em | overlines, field labels ("YOUR CHOICE"), tags, the "N TO REPEAT" pill, "CORRECT" / "INCORRECT" |
| Large numeral | `type-numeral` | 28 / 37 (1.33) | 400 | tabular numerals | the counts in the Correct and Incorrect rows |
| Button label | `type-button` | 16 / 24 (1.5) | 500 | | primary and secondary pill buttons |
| Small caption | `type-caption` | 12 / 16 | 500 | | status chips, count badges, numbered circles, navigation labels |

Where this file writes "14 `--text-secondary`" it means grey secondary text, "12 uppercase" the uppercase label, and "16" body.

- Use tabular numerals for scores, counts and progress.

## Spacing, shape, depth
- Spacing scale (4px base): 4, 8, 12, 16, 24, 32, 48.
- Radius: 24px cards and sheet top corners, 16px inner panels, options and inputs, full pill for buttons, tags and the current nav item. Borders 1px `--border` where a card sits on `--surface`.
- Cards are white on the warm page with no border; inner panels are `--surface-muted` inside a white card.
- No shadows except a subtle one on overlays (sheet, dialogs).

## Colour system (locked 13 Oct 2026)
Primary = deep green. Secondary = sand.
- Primary `--primary` #3F4638 (deep olive-green): filled primary buttons and selected controls. Pressed: `--primary-pressed` (#34392F, the same green mixed 30% towards `--text`); white on it 11.85:1.
- Secondary `--secondary-sand` #F0ECE6 (a warm sandy beige, measured from the earlier Your choice fill; replaces the sage `--secondary-olive` #DFE5D8 of the previous step): inactive states and tonal backgrounds. Pressed, strokes and inactive dots: `--secondary-sand-pressed` #E2DED5 (the same warm hue about 6 points darker in lightness; the existing tone of `--border`).
- Surroundings measured from the tokens: page `--bg` #F3EEE9, cards `--card` #FAF7F3, the answer sheet `--surface` #FFFFFF.
- Sand against them: 1.02:1 on the page, 1.10:1 on cards, 1.18:1 on the white sheet, so a sand shape is nearly invisible on its own. Wherever sand sits on the page or a card (the segmented control track, Guide chips, the Your choice block, disabled buttons, arrow circles), it gets a 1px `--secondary-sand-pressed` stroke; inactive progress segments, dots and the empty part of the progress ring are filled with `--secondary-sand-pressed` (1.16:1 on the page, 1.26:1 on cards, 1.34:1 on white). Meaning is always carried by a label or the active state, never by the colour alone.
- Contrast on `--secondary-sand`: `--text` 14.79:1, `--text-secondary` (muted labels) 5.85:1, `--primary` 8.32:1, the focus ring 8.18:1, the red cross 5.55:1, the green check 4.52:1. On `--secondary-sand-pressed`: `--text` 12.96:1, `--text-secondary` 5.13:1.
- Used for: Guide chips; the Your choice block (with its 3px dark green line); inactive step segments, carousel and onboarding dots, thin progress tracks and the empty part of the progress ring (pressed tone); the segmented control track; disabled button and option backgrounds with a muted label; tonal icon buttons (the arrow circle on a card); the pressed state of outline buttons, option chips and text buttons.
- Not used for (unchanged on purpose): the coloured tags (SCENARIO yellow, QUIZ blue, SHORT peach, FULL lilac, EXTENDED blue, TRAINING sage, Progress mode tags, the direction chip), the icon backgrounds (topic tiles, section code circles, What to create tiles, the Next up tile, material tiles), error-type chips and rows, selected cards (the sage tint `--next-card` with the `--stroke-sage` stroke, pressed `--secondary-pressed`: their own tokens), the white circular back button and the white arrow circle on the Next up card, primary buttons, neutral status chips (Ready, Processing, Marked correct by you) and neutral panels such as empty-state circles and chat bubbles, which use `--surface-muted`.

## Buttons (locked 13 Oct 2026)
One shared Button component (and ButtonLink for navigation) with exactly three variants. Every action button and text action in the app uses it; nothing else may draw its own button.
1. Filled (primary): `--primary` deep green fill, white label (9.79:1) in the button label style, pill, 48px high (44px minimum tap area everywhere), full width in the action bar. Pressed: `--primary-pressed` (darker green; white on it 11.85:1). Disabled: `--secondary-sand` fill with a 1px `--secondary-sand-pressed` stroke and a muted `--text-secondary` label (5.85:1). One per screen, the main action.
2. Outline (secondary): transparent fill, a 1.5px `--primary` stroke, `--primary` label (8.5:1 on the page, 9.2:1 on cards, 9.8:1 on white), pill, at least 44px. Pressed: `--secondary-sand` fill (label 8.32:1). Disabled: a 1.5px `--secondary-sand-pressed` stroke and a muted `--text-secondary` label, no fill.
3. Text (tertiary): no fill, `--primary` label, underlined with a 4px offset, an optional icon before it (the sparkle for AI actions) or an arrow after it ("Details"), at least 44px tap area. Pressed: a `--secondary-sand` rounded background behind the label. Disabled: muted `--text-secondary` label, no underline.
- For all three: no hover state anywhere; the keyboard focus ring only (`:focus-visible`, see Focus); the visible label is the accessible name; icons are decorative (`aria-hidden`); leaving actions (Exit, Back to Home, Cancel, Close, Skip) are text buttons. A disabled button is always the native disabled state with `cursor: not-allowed`, and where it blocks progress a line nearby says why, so colour is never the only sign.
- Not buttons of these types (they keep their own documented styles): the circular back button, the arrow circles, Guide chips, option chips and cards, tabs, the segmented control, the stepper's round − and + buttons, the round send button in the answer dock, drag handles and the Ask AI suggested-question pills.
- The /screens page has a "Buttons" group with the three types in every state (default, pressed, disabled, focus), on the page and on a card.

## Gradients
- None. The app has no gradients (the evacuation guide's gradient cover was removed on 13 Oct 2026; every material uses the material tile). Home has no graphic elements at the top, and the Results header uses the soft light header (see "Results screen").

## Material tile
- One tile for every material, on the Materials list (Ready, Processing and Failed), the material page header and the upload sheet's sample files: a 64px rounded square, 20px radius, filled with `--material-tile` (#D4DBCD, the soft sage of the Home Next up tile), the same for PDF, DOCX and LINK. The type is told by the icon and the plain label (see "Material tile content"), never by the colour. Static, decorative (`aria-hidden`), no gradient, no shapes.
- Contrast: the dark green icon and label (`--primary`) on the tile 6.91:1 (AA for the 12px label). The tile against the near-white card is a 1.33:1 step in lightness, the most visible of the existing pastels (sage `--tag-sage` 1.20, peach 1.27, lilac 1.23); it is a decorative fill, so the 3:1 rule for meaningful graphics does not apply, and the icon on it carries the information at 6.91:1 against the tile and 9.17:1 against the card around it.

## Decorative shapes
- One shared component, SoftShape: two or three overlapping soft organic curves rising from the bottom-right corner of a card along part of its lower edge, clipped by the card's rounded corners and drawn behind all content. Abstract only: no leaves, trees, mountains or any recognisable object. Inline SVG, static (no animation), `aria-hidden`, no pointer events.
- Colour: the moss sage `--mesh-moss` at low opacity, tone on tone with the card.
  - "strong" (the Home "Next up" card): layers at 6%, 8% and 14%; where all three overlap the card reads #D3D7C6 (about 26% moss on `--next-card`).
  - "faint" (the Home "New scenario" cards): layers at 3%, 3% and 4%; at most about 10% moss on `--card` (#EEECE3), barely noticeable.
- Contrast at the darkest overlap: strong `--text` 11.9:1, `--text-secondary` 4.69:1, `--primary` 6.67:1; faint `--text` 14.7:1, `--text-secondary` 5.82:1. The primary button and the white arrow circle are opaque, so their contrast is unchanged (white on `--primary` 9.79:1).
- These two Home cards are the only place decorative shapes are allowed. Every other screen and card stays flat.

## Layout
- Single column with 16px side padding. Content width is the screen width, 430px maximum.
- Safe areas: respect the top and bottom safe areas (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) on every fixed element.
- Bottom navigation: four sections, Home, Materials, Progress and Profile. It is shown only on these four sections.
- Onboarding, Session setup, the scenario session and Session results are opened from other screens. They have no navigation item and no bottom navigation. Screens below another screen show the circular back button at the top left (see Circular back button); a running session shows "Exit" in its top bar instead. Exit needs no confirmation: the session stays saved and Home offers to continue it.
- Primary action: a fixed bar at the bottom of the screen with one olive pill button. On the four sections it sits above the bottom navigation; elsewhere it sits at the bottom. Scrolling content gets bottom padding so nothing hides behind the bar.
- During a session: a top bar with "Exit" (to Home, which offers to continue), the scenario title and the step count ("2 of 6") with progress dots.
- Sources: the source panel is a bottom sheet opened from a source chip.

## Screen map
From `docs/mvp-matrix-and-ia.md`.
- Onboarding (replaced 13 Oct 2026; there is only this one): a first-run introduction that explains the app in under 20 seconds. Three short steps and a final screen, moved through with buttons (a horizontal swipe also works). See "Onboarding screen" below.
- Home: see "Home screen" below.
- Weak topics (Home, Progress and the Weak topics page) come from the saved session history, scenario steps and quiz questions alike: for each step or question, the most recent answer counts, and it is weak when that answer was wrong, partly right or guessed. A right choice whose typed explanation did not match the guide counts as a Guess (right answer without the right reasoning), whatever the confidence, unless the person marked the explanation correct. A topic is a guide section behind weak answers (S2 "Checking the route", F5 "The dangers of floodwater"). Its error type is the most serious among its weak answers, in priority order misconception, knowledge gap, guess; topics are ordered by that priority, then by how many answers are weak. Repeating topics starts a repeat round with their weak steps and questions together.
- Repeat summary card (Progress): a card with "N topics to repeat" (item title), one line of error-type counts in 14 `--text-secondary` ("1 misconception, 2 knowledge gaps"), and the primary button "Repeat weak topics" (full width). With nothing weak: "No weak topics yet. They appear here after a session or a quiz." and no button. On Home this job is done by the "Next up" card.
- Topic card: see "Home screen" below (the same card and row on Progress).
- Weak topics page (from "See all"): the circular back button (to Home), title "Weak topics", then groups with headers in priority order ("Misconceptions", "Knowledge gaps", "Guesses", each with its status icon and a count). Each topic is a checkbox card with its name and source line; all are selected at first. A primary "Repeat selected (N)" sits in the action bar, disabled with a reason when nothing is selected. Empty state: one line ("No weak topics yet. Finish a scenario or a quiz and they appear here.") and a secondary "Start a scenario".
- Repeat round: a session that mixes steps and questions from the chosen topics, in topic order; each item uses its own screen (decision step or quiz question) and feedback. The top bar reads "Item 2 of 5". Results show correct and incorrect counts without a situation outcome, headed "Repeat complete."
- Materials: Materials list · Upload sheet · Material page.
  - Material types: three, PDF, DOCX and LINK (other uploads such as TXT or JPG show the document icon with their own label). The meta line under the name reads "PDF · 1.2 MB · 7 Oct 2026" for a file and "Web page · example.org · 7 Oct 2026" for a LINK (the site's address, no file size). On the material page a LINK shows Type "Web page" and Address (the full address) instead of Size.
  - Material tile content: a 24px Lucide outline icon, stroke 2, in `--primary` (dark green): `FileText` for PDF and DOCX (and any other file), `Link2` for LINK. Directly under it, 2px apart, the type label (PDF, DOCX, LINK) as plain text in the small uppercase label style, `--primary`, with no pill and no background of its own. The tile is decorative (`aria-hidden`): the type is also in the meta line.
  - Materials list: one row per material (tile, name, the meta line, status badge): your uploads first, newest first, then the sample materials with the guide on top. An "Upload a file" secondary button sits next to the page title. Under the title row a one-line subtitle "Guides you can turn into scenarios and quizzes." in 14 `--text-secondary` (the grey sub-line style, as on Home), 4px below it at full width, so it stays on one line at 360px. Below the header (24px), underline tabs "Ready", "Processing (N)" and "Failed (N)" filter the list (counts on the last two); Ready is open by default, and starting a simulated upload switches to Processing, where the new file shows with its progress until it is Ready or Failed; then the list follows it to that tab. Each tab has a one-line empty state. Every row has its material tile (see Material tile content). A Processing row adds a thin progress bar; a Failed row adds its reason in 14 `--text-secondary` and a "Try another file" secondary button that opens the upload sheet.
  - Material status badge (icon + label + colour): Ready (check, neutral outlined like Guess), Processing (clock, neutral outlined), Failed (cross, `--caution` on `--caution-bg`). Green and red stay reserved for answers.
  - Upload sheet: a bottom sheet like the source sheet, with the line "Upload is simulated for this prototype. Choose a sample file." Three states: choose (a list of sample files as option rows: material tile, name, type and size, and one line on what it contains), progress (file name, a progress bar with percent, "Checking the file"; the file also appears under the Processing tab), result (Ready: status badge, "Create training" primary and "Open material" text action; Failed: reason and "Try another file"). Sample files: the full evacuation guide, the flood preparedness guide (F1 to F7, with its own scenario and quiz), a one-page "Evacuation quick card" (guide sections S1 and S2 only, too short for a scenario) and a photo of a notice (fails: no readable text). Uploaded items stay in this browser.
  - Material page: the circular back button (to Materials), the material tile, name (page title), a details card with label/value rows (Type, Size, Added, Status), the scenario card, then sections with a one-line excerpt each (tap opens the source sheet for the guide). Materials without sections say why ("This prototype does not read uploaded files, so there are no sections to show."). Once training has been created, small tags "Scenario" and "Quiz" (pastel, uppercase) show under the name, on the material page and on its row in the list. The action bar's primary button is "Start training" when training exists (with a text action "Create again"), otherwise "Create training" when the material holds guide content. For a material without guide content it is disabled with the line above it: "In this prototype, training can be created from the sample guide and its quick card only." and a text action "Open the sample guide".
- Progress: the repeat summary card and topic row (as on Home) · Session history (newest first: date, mode tag, "4 of 6 correct", and how many steps were weak). Empty state for a first visit: one line and a "Start a scenario" secondary button. Sessions are saved when they finish.
- Create training (from a Ready material's "Create training" and from Home "New scenario"). Flat page background, no graphics:
  - The circular back button (to the material), a small "TRAINING" tag (muted sage), the title "Create training" (page title) and the material name in grey below it.
  - "What to create" (item title): two option cards, Scenario ("6 decisions, one story through the guide.") and Quiz (the live count "N questions from the sections below."). Each card: a 40px round `--next-tile` sage tile with a 20px outline icon on the left (a document for Scenario, a document with a question mark for Quiz), the title in body strong, grey text, and a 20px dark green check box on the right (filled `--primary` with a white check when selected). Unselected: a standard card (`--card` with `--card-shadow`) with a 1px `--stroke-neutral` stroke; selected: the soft sage tint `--next-card` with a 1.5px `--stroke-sage` stroke. 24px radius, 16px padding. Both are selected by default; at least one must stay selected (the last one cannot be cleared, with the line "Choose a scenario, a quiz or both."). Too short for a scenario: the Scenario card is disabled and the neutral notice reads "Not enough material for a scenario. A quiz is available."
  - "Sections found" (item title) with one underlined text toggle on the right: "Deselect all" when every section is selected (it clears them all), "Select all" in any other state (it selects them all). Every section is selected by default. Then the helper text "The scenario is one prepared story through the guide. The sections you keep shape the quiz." and the section list (see Section list).
  - When Quiz is selected, "How many questions?" under the sections: option chips 5, 10, 15 and Custom (a stepper). Amounts larger than the available total are disabled with the hint "Not enough questions for these sections"; Custom is capped at the total; the default is the smaller of 10 and the total; a live line "N questions available in the selected sections". Hidden when Quiz is off.
  - A sticky full-width primary button "Generate" with a small arrow-right icon after the label. Disabled while no section is selected, with the hint "Keep at least one section."
  - The chosen quiz size is saved with the training. Review shows "Quiz: N questions"; Session setup in quiz mode offers only amounts up to N and starts on N.
- Generating: no navigation, a calm full screen with the circular back button at the top left ("Back to Create training", the same as Cancel): title "Creating your training", the line "Generation is simulated for this prototype. Prepared content is shown." in 14 `--text-secondary`, then four steps as a list: "Reading the material", "Finding key sections", "Writing situations", "Writing questions" (situations is skipped and marked "Not needed" when there is no scenario). Each step shows a state with icon and label: waiting (empty circle, "Waiting"), working (clock, "Working"), done (check, "Done"). A thin overall progress bar with percent, about 4 seconds in total, announced politely. Text button "Cancel" returns to Create training without saving. When done, it opens Review.
- Review training: the circular back button (to the material), title "Your training is ready", the material name, then two cards: "Scenario: N decisions" and "Quiz: N questions", each with a disclosure button ("Show all decisions" / "Show all questions", `aria-expanded`). Expanded, the scenario lists every situation (title, the question asked, source chips) and the quiz lists every question (type tag, question, source chip). Primary "Start training" (opens Session setup for this material), secondary "Back to material".
- Session setup for a material's training: the mode control shows only what was created; the quiz sections start from the ones chosen in Create training and can be narrowed further.
- Profile: Direction (the four directions as option cards; only "Building evacuation and first aid" can be selected, the others are disabled with "Not available in this prototype") · Settings: "Reset progress" (secondary button) opens a confirmation dialog. Reset deletes the saved sessions, history, weak topics and created trainings on this device; the direction, onboarding and uploaded files stay. Afterwards a neutral line confirms it.
- Session setup: when a session is unfinished, one line above the start button says that starting replaces it. First a mode choice as a full-width segmented control: Scenario or Quiz.
  - Scenario: length cards Short (3 decisions, about 5 min, steps 1 to 3), Full (6, about 10 min) and Extended (10, about 16 min: the full story with four extra steps). Times are always labelled as estimates ("about"). Lengths the material's scenario does not have are shown disabled with "Not available for this material" (the flood guide has only 3 decisions, so it starts there).
  - Quiz: "Guide sections" with the same Select all / Deselect all toggle on the right (every section selected by default), then the section list (the same component as Create training) with a grey "N questions" on the right of each row. Under the list one live line (announced politely): "N questions available in the selected sections". Then the number of questions as pills 5, 10, 15 and Custom. Amounts larger than the available total are disabled, with the hint "Not enough questions for these sections"; the Custom stepper is capped at the total. When the sections change, the amount becomes the smaller of the chosen amount and the total (so the default is the smaller of 5 and the total). "Start quiz" stays disabled until at least one section is chosen, with the hint "Keep at least one section." With a saved training the amounts go up to the saved quiz size N, and the amount starts on N.
- Scenario session: Decision (situation, options, confidence, "Continue") → Explain (the chosen option as a quote and one question: "In one sentence, why did you choose this?") → the answer sheet rises over the Explain screen → "Continue" → next step. There is no separate feedback screen and no AI follow-up question. The progress dots count steps, not screens. Source sheet available throughout.
- Session results (the final analysis): soft light header → progress card → Error types card → Outcome card → Step by step card → weak topics → "Marked correct by you" count; the Error analysis is a separate screen (from "Details" and from the Correct and Incorrect rows). See "Results screen (soft surface)".

## Components and states
Every component needs: default, hover, focus-visible, active, disabled. Inputs also need error.
- Button hierarchy. Three levels of action plus references, applied everywhere:
  - Primary, Secondary (outline) and Text: see "Buttons" (locked). Primary: the one main action of a screen, usually in the action bar: Start session, Start quiz, Continue, Check, Continue in the answer sheet, See results, Repeat weak topics. Secondary: Upload a file, Try another file, Repeat, Start a new scenario, Reset progress and every other secondary action. Text: Exit, Back, Close, Cancel, Skip, Clear all, Details, How it works.
  - Option chips (the amount of questions, the confidence level): unselected = transparent with a 1px `--border-strong` neutral outline and `--text` label; selected = `--primary` fill with a white label and a small check; disabled = `--secondary-sand` with `--text-secondary` and no outline. No hover; pressed `--secondary-pressed`.
  - References, not actions: source chips (see Source chip). They must never look like a button.
  - AI text button: the Text button with the sparkle icon before its label ("Ask AI about this step" on the decision step and in the Error analysis cards).
  - Suggested questions (Ask AI and "Ask about this step") are white pills with a 1px `--border`, 14 text: a lighter secondary that sends a question.
  - Disabled (all variants): see "Buttons". Filled: `--secondary-sand` fill with a 1px `--secondary-sand-pressed` stroke and a muted `--text-secondary` label (5.85:1); outline: a 1.5px `--secondary-sand-pressed` stroke and a muted label; text: a muted label without underline. Always `cursor: not-allowed` and the native disabled state, and a disabled action is explained by a line nearby where it applies ("Choose an action to continue."), so colour is never the only sign.
- Card: warm near-white `--card` with the very soft `--card-shadow`, 24px radius, 16 or 20px padding, no border on the page background. Inputs, option cards, sheets and the navigation bar stay white (`--surface`).
- ArrowCircle (one shared component, a tonal icon button look): an 18px `--text` arrow (14.79:1) in a 36px `--secondary-sand` circle with a 1px `--secondary-sand-pressed` stroke and the very soft `--card-shadow`, so the circle stays visible on the near-white card, inside a 44px area at the top right. The same on topic cards and New scenario cards. Decorative (`aria-hidden`): the whole card is the button.
- Tappable cards (topic cards, material rows, the Continue session and New scenario cards, option and checkbox cards, section rows): no hover effect at all; a card never changes when the mouse passes over it. Pressed (while tapped or clicked): the background darkens slightly to `--surface-muted` (white cards) or `--border` (cards already on `--surface-muted`). Keyboard focus: the 2px `--accent` ring with a 2px offset. A card that opens something or starts something shows a chevron (`ChevronRight`, 20px, `--text-secondary`) on its right. Option and checkbox cards select instead, so they show their radio or check box, not a chevron. Chips (source chips, chat question chips, status chips, tags) never change on hover either; they keep their pressed state and focus ring. Only buttons and text links keep a hover state.
- Icons: one outline set, Lucide (`lucide-react`), stroke width 2, sizes 16 (inline, badges), 20 (chevrons, controls), 22 (navigation), 24 (topic tiles) and 40 (empty states). No emoji, no mascots, no filled or 3D icons, nothing hand-drawn next to them. Icons are decorative: always `aria-hidden`, always next to text that says the same thing. Not in the Home gradient header.
  - Topic icon tile: a 48px round pastel tile with a dark (`--text`) 24px icon. The tile colour comes from the guide section, never from the error type or the material: the section number picks one tint from the cycle yellow, blue, lilac, sage, peach (`--tag-yellow`, `--tag-blue`, `--tag-lilac`, `--tag-sage`, `--tag-peach`), so S1 and F1 are yellow, S2 and F2 blue, S6 yellow again. A topic keeps the same tile everywhere: Home cards, Progress and the Weak topics page. Icon contrast 12.8:1 or more on every tint.
  - Topic icons (in the topic data, with a default of `BookOpen`): S1 alarm `BellRing`, S2 checking the route `DoorOpen`, S3 smoke `Wind`, S4 assembly point `MapPin`, S5 calling for help `Phone`, S6 assessing an injured person `HeartPulse`, S7 bleeding and S8 burns `Bandage`, S9 unresponsive person `HeartPulse`, S10 handover `ClipboardList`, every flood section `Droplet`.
  - Empty states (no weak topics, no materials in a tab, no history): a large 40px icon in `--text-secondary` on a 72px `--surface-muted` circle, centred above one line of text (and the empty state's button, if it has one). Icon on the circle: 5.8:1. Weak topics `ListChecks`, materials `FileText`, history `History`.
- Tag: small uppercase label, 12, letter-spacing 0.04em, medium weight, `--text` on a `--tag-*` pastel, pill shape, 4px 10px padding. For categories such as "SCENARIO" (yellow), "QUIZ" (blue), "SHORT" (peach), "FULL" (lilac), "EXTENDED" (blue), "TRAINING" (sage), the Progress mode tags and the direction chip (yellow). Never for status, and never in the secondary sand.
- Option (answer choice): white, 16px radius, 1px `--border`, a radio circle on the right. Selected: 2px `--primary` border and a filled olive (`--primary`) radio. Locked after submit: unselected options fade to `--text-secondary`. Correct and wrong: status badge with icon and label, plus the matching status border. Never colour alone. Disabled (an option that cannot be chosen, such as a direction not available in this prototype): `--secondary-sand` background, no border, text in `--text-secondary`, a dashed radio circle, and a line saying why ("Not available in this prototype").
- Confidence selector: three labelled pills (not very / somewhat / very confident). Selected is the olive pill (`--primary`). No traffic-light colors.
- Practice step (progressive reveal): options first. After an option is chosen, show the confidence selector. The primary button "Continue" is enabled once both are chosen and opens the Explain screen. The decision is saved and locked at that point.
- Explain screen: the same top bar (Exit, progress dots on the same step). "Your choice" (uppercase label, `--text-secondary`) above the chosen option as a quote block (see "Your choice block"), with no verdict. Then the prompt "In one sentence, why did you choose this?" in the page title style. The answer is typed in the answer dock (below). After sending, the sentence shows under the prompt as a right-aligned bubble (`--surface-muted`, 16px radius), or "Skipped" in 14 `--text-secondary`, and the answer sheet rises.
- Answer dock (Explain screen and short-text quiz questions): docked at the bottom in place of the action bar, and above the on-screen keyboard when it is open (it follows the visible area of the screen, also at 360px). A white field with a 1px `--border-strong` edge and 24px radius that grows from one line to four, 16px text, the prompt as its accessible label and a short placeholder ("Your answer", or the question's placeholder) that fits on one line at 360px. Two controls sit inside the field on the right: a text button "I don't know" (14, underlined, at least 44px) and a round send button (44px circle, arrow-up icon, labelled "Send"). The send button is light grey (`--secondary-sand` with a `--text-secondary` icon) and disabled while the field is empty, olive (`--primary`) with a white icon once there is text. Enter sends; Shift+Enter adds a line. "I don't know" sends nothing and counts as skipped.
- Your choice block (one style for every "Your choice" and "Your answer" quote: the Explain screen and the answer sheet): `--secondary-sand` fill (the same as the Guide chips) with a 1px `--secondary-sand-pressed` stroke, 16px radius, 16px padding, a 3px `--primary` (dark green) line on the left, `--text` text and label. In the answer sheet it keeps its icon (cross, check or half) and label. Contrast: `--text` on it 14.79:1; icons on it: cross 5.55:1, check 4.52:1, half 5.85:1. The fill is only 1.02:1 against the page and 1.18:1 against the white sheet, so its stroke and the dark green line (8.5:1 against the page, 9.8:1 against the sheet) keep the block clearly set apart.
- Answer sheet (replaces the feedback screen for scenario steps and every quiz question type): a bottom sheet that slides up over the screen just answered (200ms; no motion with reduced motion), 24px top radius, a 4px by 36px `--border-strong` grab handle (decorative), `--surface`, the scrim behind it. At most 65% of the screen high, so the question (or the explanation prompt) stays visible above it. On open, focus moves to the sheet title, a visually hidden verdict ("Correct.", "Incorrect." or "Partly correct."), which is also announced politely. The sheet container and its visually hidden title never show a focus outline, also when the sheet opens; only interactive elements show the keyboard focus ring. It does not close with the scrim, Escape or a swipe: only its "Continue" button closes it and goes on. The content scrolls inside the sheet; the bottom area stays put. From top to bottom:
  - No Result or Error type rows in the sheet (the error type stays in the Error analysis cards, which keep both rows). For multiple choice and ordering, one short visible line at the top in 14 `--text-secondary`: "N of M right".
  - Order of blocks (final spec, 13 Oct 2026). Scenario step: "Your choice" (the Your choice block with a check or a cross for the closed question) → "Your explanation" (the typed sentence and one verdict line) → "Better explanation" (when shown) → "Why" with the Guide chips → "What happened". Short-text quiz question: "Your answer" (the typed text and one verdict line) → "Better answer" (when shown) → "Why". Single, multiple, ordering and true-or-false questions keep "Your answer" and "Correct answer" boxes as before.
  - Answer boxes (16px radius, 16px padding, each with an icon and an uppercase label, never colour alone). "Your choice" / "Your answer" is the Your choice block with a red cross (wrong), a green check (right) or the half icon (partly right). "Better explanation" (scenario), "Better answer" (short text) and "Correct answer" (choice questions) use the dashed `--correct` outline with a check icon. There is no "Better choice" box in scenario sheets any more: the better explanation names the right action. Multiple choice and ordering show the full correct answer, ordering as a numbered list.
  - Override (one shared component; rule of 13 Oct 2026, replacing "only behind a right option"). Scenario: "My explanation is still correct", shown whenever the person typed their own explanation and it did not match the guide, whether the chosen option was right or wrong (the check is a simple keyword match, and a right explanation can be worded differently). Short-text quiz: "My answer is still correct", shown when the person typed an answer and the check rejected it. Never after "I don't know" or an empty explanation, a matched explanation, or a choice question. It sits below "Continue", 12px apart, in the outline style. Pressing it: the verdict becomes a check icon and "Marked correct by you"; the "Better explanation" / "Better answer" box stays visible; a line "Marked as correct by you" with an underlined "Undo" replaces the button (focus moves to Undo, and back to the button after Undo); Undo restores everything; the state is saved with the session. Effects in a scenario: with a right option the error type is worked out again as if the explanation matched (Secure or Guess by confidence) and the step leaves the repeat list unless it is still a Guess; with a wrong option only the explanation label changes, so the choice stays wrong and the score, the error type (Misconception or Knowledge gap) and the repeat list stay as they were, and Results (Step by step) and the Error analysis show the small neutral note "Explanation marked correct by you". The score never changes in a scenario. In a short-text quiz pressing it counts the answer as right, as before. The bottom area is part of the sheet's layout, never laid over the content, also at 360px and with large text.
  - Checking the typed text (simulated, from the step's key beats): lowercase, punctuation ignored; the text "matches the guide" when it has at least 3 words AND one of them starts with a keyword of at least one key beat (`explanationKeywords` in the scenario JSON; a short-text question uses its accepted keywords and phrases). One word, random letters or another language never match. The outcome is saved with the answer: "matched", "not_matched" (typed, no match) or "skipped" ("I don't know" or empty).
  - Verdict line under the typed text, in 14 `--text`, icon and words together: matched → a check icon in `--correct` and "Matches the guide"; not_matched → a minus icon in `--caution` (amber) and "Doesn't match the guide yet"; marked by the user → the person-check icon and "Marked correct by you". No percentage, no points. After "I don't know" the block shows the muted line "You pressed I don't know." in `--text-secondary` and no verdict.
  - "Better explanation" (scenario) shows the step's `referenceExplanation`, one sentence that names the right action and then the reason. Shown when the explanation did not match, was skipped, or the chosen option was wrong (even with a matching explanation); hidden only when the option was right and the explanation matched. It stays visible after "My explanation is still correct". "Better answer" (short text) shows the reference answer whenever the answer was not accepted.
  - Why: one or two lines in 16, then the source chips ("Guide · S2").
  - What happened (scenario only): one line with the consequence, then the state change in 14 `--text-secondary` ("Time lost +30 s · Smoke level +1").
  - Bottom area (sticky inside the sheet, `--surface`, 1px `--border` on top): the primary "Continue" ("See results" on the last item) first, also first in the Tab order, then the override below it when it applies (see above). Without the override, "Continue" alone stays in the same place and size. No Ask AI in the sheet.
  - Never in the sheet: a percentage, points or any score.
- The user's explanation is a reflection, never graded or checked by the app: no keyword match, no counts.
- The honest "not covered" answer: on the smoke step, the guide-not-covered question is one of the Ask AI suggested questions. The answer says "This is not covered by the material." and then "Closest sections in the guide:" with source chips. Neutral style, no warning colour.
- Status badge: icon + label + colour, used for the result and the error type. Labels in sentence case.
  - Result: Correct (check, `--correct` on `--correct-bg`), Incorrect (cross, `--wrong` on `--wrong-bg`), Partly correct (half icon, neutral outlined like Guess).
  - Secure: check icon, `--secure` on `--secure-bg`.
  - Guess: question-mark icon, neutral outlined badge: `--text-secondary` on `--surface-muted`, 1px `--border`.
  - Knowledge gap: minus icon, `--caution` on `--caution-bg` (amber is shared only with the Failed material status, which has a cross icon and its own label).
  - Misconception: cross icon, `--misconception` on `--misconception-bg`.
  - Shape: pill, 12 label size, 4px 10px padding. No description next to the chip; the Error types card on the results screen explains each type ("Wrong answer, high confidence").
- Status rows (every answer card in the Error analysis): two key-value rows, the label on the left in 14 `--text-secondary`, the chip on the right: "Result" with the result chip, then "Error type" with the error-type chip. Never a chip floating at the top of a card, never sticky. Without a confidence rating (a quiz question answered without one, or "I don't know") only the "Result" row is shown. The answer sheet has no status rows.
- Results screen components (soft light header, progress card, Error types card with type summary rows, Outcome card, Step by step card, circular back button): see "Results screen (soft surface)".
- GuideChip (one shared component, the only way a guide section is shown as a chip): shows "Guide · S2" (document name + section id; the guide has no page numbers) after a small 14px document icon. Used on the decision step, above quiz questions, in the answer sheet, the Error analysis cards, Results (weak topics), Ask AI answers and Review training. Token: `--secondary-sand` (#F0ECE6) fill with a 1px `--secondary-sand-pressed` stroke so it reads on the page, on cards and on the white sheet, `--text` text (14.79:1), the icon in `--text-secondary` (5.85:1), no border; with a section title ("Guide · S2 · Checking the route") the title is `--text` too. No screen may set its own chip background, outline or tint, and a guide section is never a category Tag. Smaller than a button: 36px visible height, 12px horizontal padding, small text; an invisible extension above and below makes the tap area 44px. It reads as a reference, not an action, and opens that section in the source sheet. No hover change. Pressed: `--secondary-sand-pressed` (#E2DED5; text on it 12.96:1). Focus: the app focus ring, keyboard only (see Focus).
  - Audit of 13 Oct 2026, the chip background before this change: decision step, answer sheet, Error analysis, Results weak topics, Ask AI answers and Review training all used `--surface-muted` #EFECE5, which is only 1.02:1 against the page #F3EEE9, so on the decision step (on the page itself) the chip looked as if it had no background; above quiz questions a blue category Tag #D4E8F0 "Guide S1" was used until earlier the same day (still so on the last deployed version). The Explain screen, Step by step card, Create training and topic cards show no Guide chip (topic cards show the plain text "Evacuation guide · S2"; Create training shows section code circles, not chips).
- Material tile: see "Material tile".
- Bottom navigation: a floating rounded bar, not attached to the screen edge. White pill-shaped bar, 1px `--border`, a very subtle shadow (it floats over content), 16px space at the sides and at least 12px below it (plus the safe area), on a flat `--bg` strip. Four items (Home, Materials, Progress, Profile), each with a simple line icon and a visible label, at least 44px high. Current item: a soft yellow pill (`--nav-active`) behind icon and label, text in `--text` medium, `aria-current="page"`. Others in `--text-secondary`.
- Action bar: fixed at the bottom, `--bg` with a 1px `--border` on top, 16px padding, safe-area padding when it is the lowest element. Holds one primary pill button, full width. A disabled button explains why in one line above it (for example "Choose an answer to continue").
- Bottom sheet: opens from the bottom, up to 80% of the screen height, content scrolls inside. 24px radius on the top corners, `--surface` background, a scrim behind it. Has a title (section id and name), a close button of at least 44px, closes with the scrim, the Escape key and the close button. Traps focus while open and returns focus to the source chip on close. Opening animates briefly and not at all with reduced motion.
- Segmented length selector (Session setup): three large option cards, Short, Full and Extended, with decision count and estimated time. Selected uses the option selected style.
- Segmented control: a full-width sand track (`--secondary-sand` with a 1px `--secondary-sand-pressed` stroke so it reads on the page, pill, 4px padding) with equal options of at least 44px. The selected option is an olive (`--primary`) pill with white text, a small check icon and medium weight, so the state does not rely on colour alone. Built from native radio buttons, so arrow keys move the selection and Tab enters and leaves the group. Focus: 2px `--accent` ring on the focused option.
- Tabs: underline tabs, a row of text labels at least 44px high on a 1px `--border` baseline. The selected tab has a 2px `--text` underline, medium weight and `--text`; the others `--text-secondary`. Optional count after the label in tabular numerals ("Failed (1)"). Arrow keys move between tabs, Home and End jump to the ends; the selected tab is the only one in the Tab order (`role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`).
- Checkbox card: like the option card, with a square check box (4px radius) instead of the radio circle; used for multiple choice and quiz sections.
- Section list (Create training and Session setup in quiz mode, one shared component): no outer container and no dividers. Each section is its own row card: the standard card (`--card` with `--card-shadow`, the same as the material details card), 20px radius, 8px between rows, at least 56px high, 12px 16px padding. In a row: a 36px round code circle with the code ("S1", small caption, `--text`) in the section's pastel tint (`--code-*`, the same cycle as the topic tiles: yellow, blue, lilac, sage, peach), the section title in body, optionally a grey "N questions" on the right, and a 20px dark green check box. The whole row toggles the section; pressed `--surface-muted`, focus ring inside the row.
- Stepper: "−" and "+" icon buttons (44px, white pill with 1px `--border`) around a tabular number; buttons disable at the limits.
- Quiz question (top bar "Question 3 of 10" with dots, a section tag, the question in the item title style; no narrative):
  - Single choice: option cards (radio).
  - Multiple choice: checkbox cards and the hint "Select all that apply (2 are correct)."
  - Ordering: a numbered list of white rows, each with a drag handle on the left: a 44px button with a grip icon, labelled "Reorder: <item>", touch-friendly (no scrolling while dragging). Drag with mouse or touch. Keyboard drag mode on the handle: Space or Enter picks the row up, the arrow keys move it, Space or Enter drops it, Escape puts it back; each step is announced politely ("Picked up … position 2 of 4", "… moved to position 3 of 4", "Dropped … at position 3 of 4"). The picked-up row has a 2px `--primary` border. No up and down arrow buttons. Hint: "Drag the handles to reorder".
  - Short text: the answer dock (with "I don't know") instead of a field in the page, and the hint "A few words are enough."
  - True or false: two option cards side by side, True and False.
  - Then the optional confidence selector, labelled "How sure are you? (optional)". A primary "Check" in the action bar is enabled once there is an answer (short text sends with the dock instead). The answer sheet then rises over the question.
- Quiz results: the same Results screen without the Outcome and Step by step cards: the progress card shows the points under the title ("7.5 of 10 points"); the Error analysis marks an answer the user marked correct with "Marked correct by you" and still shows the correct answer; the summary card shows "Marked correct by you: N" (also for a scenario once a step is marked); the action is "Repeat weak questions".
- Ask AI entry points: only for steps with prepared answers (the flood scenario has none, so none is shown there): on the decision step under the source chips, and in each step card of the Error analysis. Both use the AI text button and open the Ask AI sheet.
- Ask AI sheet: a bottom sheet like the source sheet (24px top corners, `--surface`, scrim, subtle overlay shadow, Escape and Close dismiss it, focus is trapped and returns to the button), 85% of the screen height so the conversation has room. From top to bottom:
  - Header: "Ask AI" (card title), the step title in 14 `--text-secondary`, a Close button of at least 44px.
  - A visible line in 14 `--text-secondary`: "Answers are simulated for this prototype."
  - The conversation, scrolling inside the sheet and kept to its end. Trainee messages are right-aligned bubbles: `--surface-muted`, 16px radius, 16 `--text`. AI messages use the tutor message style: plain left-aligned text in 16 `--text`, no bubble or avatar, with source chips ("Guide · S2") under every answer. The not-covered answer reads "This is not covered by the material." then "Closest sections in the guide:" and chips. Before feedback, a question that would reveal the answer gets "I can explain this after you check your answer, so the choice stays yours." with the step's source chips.
  - Typing indicator before each answer: three small `--text-secondary` dots that pulse, with the visually hidden text "AI is typing" announced politely; static dots with reduced motion. About 0.7 seconds.
  - Suggested question chips for the step (3 or 4, white pills like the suggested question). Before anything is asked, they fill the empty conversation area, stacked and wrapped in full so nothing is cut off, under a one-line intro. Once the trainee has sent a question, the remaining ones move to a single row that scrolls sideways above the text field, so the conversation gets the space (important with the on-screen keyboard open). A chip disappears once asked.
  - Input row: a text field (full pill, 1px `--border-strong` edge, 16px text so phones do not zoom, placeholder "Ask about this step") and an olive pill "Send" button, both at least 44px high. Send is disabled while the field is empty or an answer is typing.
  - With the on-screen keyboard open the sheet shrinks to the visible area so the input row stays above the keyboard.
- The conversation is kept per step while the session is open.
- Footer note: one line at the end of the content on every screen, above the bottom navigation or action bar, in 14 `--text-secondary`: "AI behavior is simulated for this prototype. All feedback comes from the source guide."
- Session results: see "Results screen (soft surface)" below.
- Tutor message: plain text, source chips inline, no avatar character. Used for AI answers in the Ask AI sheet.
- Progress: segmented dots or a thin bar with a numeric label. No hatched or decorative bars.
- Dropzone: dashed border on `--surface-muted`, 16px radius, one line of instruction, a "Choose a PDF" secondary button.
- Confirmation dialog (Exit session, Reset progress): white card, 24px radius, title, one sentence, an olive pill confirm and a text cancel.

## Content and tone
- Calm, direct, sentence case. No emoji, no exclamation marks, no jokes.
- Short labels. Say what happened and what to do next.
- AI states uncertainty plainly and always points to the source passage, or says the material does not cover it.

## Accessibility
- WCAG AA: 4.5:1 text, 3:1 for large text and UI boundaries.
- Focus: one app focus ring, 2px `--accent` (#3D3A8C), 2px offset, shown only for keyboard focus (`:focus-visible`), never after a mouse click or a tap. The app remembers how the person last interacted: a pointer press (mouse, finger, pen) switches rings off, and a navigation key (Tab, the arrow keys, Home, End, Page Up, Page Down, Escape) switches them back on, so a ring never appears on a chip, button, card or link after a tap, even when focus is moved by the app (for example back to a Guide chip when the source sheet closes). This replaces every browser default outline. Keyboard focus stays clearly visible: the ring is 8.35:1 against the page, 9.01:1 on cards, 9.62:1 on white, 6.09:1 on the Guide chip and 8.63:1 on the Next up card.
- Everything operable by keyboard. Respect `prefers-reduced-motion`.
- Minimum touch target 44×44px.

## Do / Don't
- Do: use whitespace and type size to create hierarchy.
- Do: show the source next to every AI claim.
- Do: keep the screens flat; the only decoration is the SoftShape on two Home cards.
- Don't: use identical cards without hierarchy, random gradients or decorative icons.
- Don't: celebrate with confetti or mascots; use a neutral confirmation instead.

## Results screen (soft surface)
Built 1:1 from the two reference screens (target images from 12 Oct 2026). Colours were measured from them; the ones marked "darkened" were adjusted to reach 4.5:1.

Tokens (only on Results and Error analysis):
```css
:root {
  --soft-page: #F4F1EC;      /* = --bg; measured #F2EEEB, the difference is not visible */
  --soft-card: #FBF9F6;      /* warm near-white card fill */
  --soft-divider: #EAE8E7;   /* thin row dividers inside cards */
  --soft-shadow: 0 1px 2px rgba(60, 45, 30, 0.04), 0 8px 24px rgba(60, 45, 30, 0.05);
  --soft-text-secondary: #5C5A55; /* grey descriptions, 6.1:1 or more on every tint below */

  --header-bg: #E8E0D4;      /* flat soft warm beige Results header; --text on it 13.3:1 */
  --header-overline: #5F5A54; /* 5.2:1 on --header-bg */
  --header-subline: #524C45;  /* 6.5:1 on --header-bg */

  --ring: #417851;           /* ring arc and its check, 5:1 on --soft-card */
  --ring-track: #E9E6E0;


  --secure-row: #F3F4EF;   /* tile and badge: --secure-bg, icon --secure */
  --guess-row: #F5F1EE;    --guess-tile: #E8E2DB;    --guess-ink: #4B433D;   /* 7.5:1 on the tile */
  --gap-row: #F8F4EE;      /* tile and badge: --caution-bg, icon --caution */
  --misconception-row: #F8F1EF; /* tile and badge: --misconception-bg, icon --misconception */
}
```

Surface rules:
- Page `--soft-page`; cards `--soft-card`, 24px radius, 20px padding, `--soft-shadow`, no border; 16px between cards. Card titles use the card title style. Card subtitles 14 `--soft-text-secondary`.
- Small uppercase labels: 12, medium, letter-spacing 0.06em; on a tint they use that tint's ink.
- Circular back button (one shared component): a 44px white (`--surface`) circle with a very soft shadow and a 20px dark arrow-left icon, at the top left, no visible text. Its accessible name names the destination: "Back to materials" (material page), "Back to material" (Create training, Review, Session setup), "Back to Create training" (Generating, same as Cancel), "Back to results" (Error analysis), "Back to Home" (Weak topics, Results). It replaces every underlined "Back to …" text link. "Exit" in the session top bar and "Back to Home" at the bottom of Results stay. Focus: the usual 2px `--accent` ring.

Flat light header (Results only):
- About 180px high at 390 wide, full bleed: one flat soft warm beige band (`--header-bg`). No image, no shadow, no lines or other graphics. The progress card overlaps its bottom edge by 16px.
- Contents, 16px from the left: the circular back button (to Home; the session is already saved); 16px below it an uppercase label overline in `--header-overline` with the mode ("SHORT SESSION", "FULL SESSION", "EXTENDED SESSION", "QUIZ", "QUIZ REPEAT", "REPEAT ROUND"); the headline in the display style, `--text` (for example "You reached the south stairwell."); below it the display sub-line in `--header-subline` ("Nothing to repeat this time." or "2 topics to repeat."). One heading element for screen readers. `--text` is 13.3:1 on the header.

Progress card (overlaps the bottom of the header by 16px):
- Top: a ring on the left (88px, 6px stroke, `--ring` arc on `--ring-track`, round caps). Inside: a 32px check in `--ring` when every answer is correct, otherwise the number correct in the card title style with tabular numerals. The ring is an image with the text "N of M correct". Beside it the title "N/M correct" (card title) and one sentence in 14 `--soft-text-secondary`:
  - Short session: the scenario's "continues" sentence ("The full session continues to an injured colleague, the call for help and the assembly point.").
  - Otherwise the first matching rule: misconceptions "You were sure, but N answer(s) did not match the guide."; knowledge gaps "N answer(s) need another look in the guide."; guesses "N right answer(s) were guesses. Repeat them to be sure."; else "Every answer was right and confident." (singular forms when N is 1).
  - Quiz: points under the sentence in 14 `--soft-text-secondary` ("7.5 of 10 points").
- Nothing else: no Correct or Incorrect rows (removed 13 Oct 2026). The Error analysis screen opens from the Error types card → Details.

Error types card:
- Title "Error types", subtitle "See what kind of mistakes you made", and on the right "Details" with an arrow (underlined text button, at least 44px) that opens the Error analysis screen.
- Type summary rows, always all four in this order: Secure, Guess, Knowledge gap, Misconception. Each row on its own tint (`--secure-row`, `--guess-row`, `--gap-row`, `--misconception-row`), no outline, 20px radius, 12px padding, 10px apart. Left: a 40px round tile in the type's tint with its outline icon, 20px (check; question mark in a circle; minus; cross). Middle: the name in body strong, `--text` and the description in 14 `--soft-text-secondary` ("Right answer, high confidence", "Right answer, but not sure", "Wrong answer, not sure", "Wrong answer, high confidence"). Right: the count in a 28px round badge in the tile's tint, small caption, `--text`. Zero rows look the same as the others (not muted). Each row reads as one accessible name ("Secure, right answer, high confidence: 2"). Rows are not buttons. Reusable for Progress.

Outcome card (scenario sessions only, not quizzes):
- Title "Outcome". Rows: label in body on the left, value in body strong on the right, thin `--soft-divider` lines between rows, at least 48px each. "Time lost" ("1 min 30 s", "0 s"); "Smoke on the route" with the state label and the start ("Moderate (up from Light)", "Light (unchanged)"); in Full and Extended "Colleague's condition" ("Stable" or "Worsened"). Short shows time lost and smoke only. The flood scenario shows "Time lost" and "Water level" ("Rising (up from Low)"). The labels for every state value live in each scenario JSON (`stateLabels`).

Step by step card (scenario sessions only):
- Title "Step by step", subtitle "How each choice played out". A numbered list: a 32px soft circle (`--soft-page`) with the number in small caption, `--soft-text-secondary`, then the step title in body strong `--text`, the "Marked correct by you" badge when the user marked that step correct, and the consequence in 14 `--soft-text-secondary`, 16px between items. Marking a step correct does not change what happened in the story (the outcome and consequences stay).

Error analysis screen (`/session/results/analysis`, opened from Error types → Details; there are no filtered views):
- Same page and card style. The circular back button (to Results, back at the same scroll position), then the title "Error analysis" in the page title style. It works after a reload: the finished session is saved.
- Groups in this order: Misconception, Knowledge gap, Guess, Secure; empty groups are hidden. Group header: the error-type chip and "N answers" in 14 `--soft-text-secondary`.
- Each answer is a soft card: the step or question title in the item title style; the status rows (Result, Error type); "You chose" (and "Better choice" when wrong; "Your answer" and "Correct answer" for a question); for a right choice whose explanation did not match the guide, the reason line "Right choice, but your explanation didn't match the guide." in 14 `--text-secondary`; "Why" with source chips; "What happened" with the state change (scenario only); the "Ask AI about this step" text link (scenario steps with prepared answers).
- A sticky primary "Repeat weak topics" (or "Repeat weak questions") only when there are weak answers.

Results actions: the sticky action bar keeps "Repeat weak topics" (when there is something to repeat) and the text action "Back to Home". The footer note stays at the end of the content.

## Onboarding screen
A first-run introduction, shown only on the first visit to Home. Strictly educational: no weapons, harm or combat language.

- Steps (the copy is fixed):
  1. Target icon. "Practise a decision". "You get a realistic situation and choose what to do."
  2. Document-with-check icon. "Explain it, then check it". "Say how confident you are and explain your choice in your own words. Every answer is checked against your source guide."
  3. Repeat icon (two arrows in a circle). "See what to repeat". "You see which mistakes were guesses, gaps or misconceptions, and repeat only those topics."
  - Final screen: "Ready to start?", the line "Upload a guide or try the sample materials." and the note "AI behavior is simulated for this prototype. All feedback comes from the source guide." Primary button "Get started" (opens Home). On onboarding the global footer note is not shown again under the content; the final screen carries it.
- Layout: the warm greige page (`--bg`), no bottom navigation. A top row 44px high: the circular back button on the left (steps 2 and 3 and the final screen; accessible name "Previous step"), and on the right on steps 1 to 3 an underlined "Skip" text button (44px tap area). Below it one content block centred vertically in the space above the action bar, text left-aligned:
  - an 88px round icon tile in the Home "Next up" tile style (`--next-tile`, a 40px outline icon in `--text`, 12.3:1), decorative;
  - 24px below, the overline "STEP 1 OF 3" in the label style, `--text-secondary`;
  - the headline in the display headline style, `--text`; it is the screen's one `h1`;
  - the body in the body style, `--text-secondary` (4.9:1 on `--bg`), at most two short sentences.
  The final screen has no icon tile and no overline; its note is in 14 `--text-secondary`.
- Action bar: on steps 1 to 3, the position dots centred above the button: three 8px dots 8px apart, the current one `--primary`, the others `--border-strong` (3.2:1 against the page); they are `aria-hidden` and a visually hidden "Step 2 of 3" stands for them. Then the full-width primary button: "Next" on steps 1 and 2, "Continue" on step 3, "Get started" on the final screen.
- No images, illustrations, leaves, mountains or gradients; no shadow other than the card shadow token on the back button.
- Motion: switching steps is instant (no slide), so it also respects reduced motion. Focus moves to the new headline when the step changes.
- Behaviour: Home opens onboarding until it has been finished or skipped once; "Skip" and "Get started" mark it done (the `onboarded` flag in the saved profile, `ast.profile.v1`) and open Home. Direct links to any other page are never redirected. When the browser cannot save, onboarding is shown again on the next visit and nothing breaks. "How it works" at the bottom of Home replays it; a replay changes no saved data.

## Home screen
Built from the Home target image of 12 Oct 2026; colours measured from it. Single column, 16px side padding, 32px between sections, on `--bg`. No gradient, no leaf shadow, no mountains or other graphics; the only decoration is the abstract SoftShape inside the Next up and New scenario cards (see "Decorative shapes"). Home has no action bar; the content keeps bottom padding above the floating navigation so nothing is hidden behind it.

- Eyebrow chip: the current direction name ("Building evacuation and first aid") as a chip in the same token and text style as the "SCENARIO" tag (`--tag-yellow`, the tag label style, `--text`, pill, 4px 10px padding) but in sentence case as written; no line under it. It is a label, not a control: no pressed state, no focus ring, not in the Tab order. `--text` on `--tag-yellow` 14.8:1.
- Headline: "Practise a decision. Explain it, then check it against the guide." in the display headline style (the same semibold style as the Results headline), `--text`. Under it the sub-line "Small steps. Real progress." in 14 `--text-secondary`. One heading element.
- "Next up" card: `--next-card`, 28px radius, 16px padding, `--card-shadow`, with the "strong" SoftShape in its bottom-right corner behind the content. Top row: a 48px round `--next-tile` tile with a target icon (24px, `--text`), then an uppercase label "NEXT UP" in `--text-secondary` (darkened from the image's 2.3:1 grey), the title in the item title style and a sub-line in 14 `--text-secondary`; on the right an arrow in a 40px white circle. Below, a full-width primary button. One state, the first that applies:
  - Unfinished session or repeat round: title "Continue your <session>" ("Continue your repeat round", "Continue your full session", "Continue your quiz"), sub-line "Item 1 of 2" ("Step 3 of 6", "Question 2 of 10"), button "Continue" (opens the session). No arrow.
  - Weak topics: "N topics to repeat", the breakdown by error type ("1 knowledge gap"), button "Repeat weak topics" (starts the repeat round). The top row (tile, text and arrow) is one link to the Weak topics page.
  - No sessions yet: "Start your first scenario", sub-line "A short scenario takes about 5 minutes.", button "Start a scenario". No arrow.
  - Sessions but nothing weak: "Ready for a new scenario", "Nothing to repeat right now.", button "Start a scenario". No arrow.
  "Start a scenario" opens Session setup for the evacuation guide. There is no separate "Continue session" card.
- Topics (only when there are weak topics): only the heading "Topics" in the same section-title style as "New scenario" (item title, `--text`); no "See all". The Weak topics page stays one tap away through the arrow on the Next up card (weak topics state) and "See all" on Progress. Below, a horizontal scroll-snap row of topic cards, each 85% of the row width so the next one peeks in, 12px apart, at most 5.
  - Moving the row: touch swipe and trackpad scroll with scroll snap; mouse drag on desktop (it snaps to the nearest card when released); Left and Right arrow keys on a focused card move focus to the previous or next card and bring it into view. A swipe or drag never counts as a tap. With reduced motion the row jumps to a card instead of scrolling smoothly.
  - Topic card: `--card`, 24px radius, 20px padding, `--card-shadow`; the whole card is one button that starts the repeat for that topic only, or resumes it when that topic's repeat round is under way. Top row: the 48px round topic icon tile (tint from the section, see Icons) and the ArrowCircle at the top right. No count pill and no progress bar: each card is one topic. Then the human topic name in the item title style, the source "Evacuation guide · S2" in 14 `--text-secondary`, and the error-type chip at the bottom (icon + label on one line, never wrapping).
- Pagination dots, centred 12px below the row: one 8px dot per card, 8px apart, the current one `--primary`, the others `--primary` at 25% opacity. The current dot follows the card in view (the last dot once the row is scrolled to its end). They only show position: not controls, `aria-hidden`, with a visually hidden "Card 2 of 3" that updates politely as the row scrolls. No dots for a single topic. The cards themselves are in the Tab order.
- New scenario: "New scenario" (item title), then one card per material with a prepared scenario (the evacuation guide; the flood guide once uploaded): `--card`, 24px radius, 20px padding, `--card-shadow`; a "SCENARIO" tag on `--tag-yellow`, the scenario title in the item title style, the ArrowCircle top right, and one line in 14 `--text-secondary` built from the scenario's Short length: "Short: 3 decisions, about 5 min." The "faint" SoftShape sits in the bottom-right corner, barely noticeable; no other graphics. The whole card opens Session setup for that material (Create training first, for an uploaded material whose training has not been created).
- "How it works": an underlined text button (44px tap area) at the end of Home's content that replays the onboarding.
- The floating bottom navigation stays, with the current item on the `--nav-active` pill.
