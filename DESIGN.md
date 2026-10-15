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
  --arrow-stroke: #E4DFD5;  /* the ArrowCircle's 1px warm stroke */
  --arrow-shadow: 0 1px 2px rgb(0 0 0 / 0.06); /* the ArrowCircle's very soft shadow */
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

  /* The one shared pastel palette (15 Oct 2026): see "Pastel palette". Chips, icon tiles and pills all use it. */
  --pastel-yellow: #F8F2CC;
  --pastel-rose: #F8E4E2;
  --pastel-blue: #DFECF0;
  --pastel-lilac: #EDE7F5;
  --pastel-green: #DDEBE3;
  --pastel-peach: #F7E1D8;
  --pastel-sand: #E5DFD4;
  --stroke-neutral: #D3CDC2; /* 1px stroke of an unselected option card */
  --stroke-sage: #A9B5A0;    /* 1.5px darker sage-grey stroke of a selected option card */
  /* One light olive tint (14 Oct 2026) for the file-type tiles on every material and the S-number circles of the guide sections. It replaces the five per-section --code-* tints and --material-tile; --text on it 12.56:1, --primary 7.07:1. Chosen as #E0E6D6 darkened by the full 4% lightness the rule allows, because #E0E6D6 was only 1.14:1 against the selected row. */
  --olive-tint: #E0E6D6;
  --olive-tint-pressed: #D6DDCB;
  --secondary-pressed: #E3E8DC; /* light sage tint of a pressed secondary pill; --primary label on it 7.9:1 */
  --next-card: #F2F3EE;      /* the sage "Next up" card */
  --selected-tint: var(--next-card);        /* SelectableCard selected fill, #F2F3EE */
  --selected-stroke: var(--stroke-sage);     /* its 1.5px stroke, #A9B5A0 */
  --selected-pressed: var(--secondary-pressed); /* pressed SelectableCard, #E3E8DC */
  --selectable-stroke: var(--stroke-neutral); /* unselected 1px stroke, #D3CDC2 */

  --mesh-moss: #7A8450;      /* moss sage: only the SoftShape curves (see "Decorative shapes") */
}
```
Rules:
- Accent must not be green or red (those carry meaning).
- The saturated status green and red are reserved for the answer result: `--correct` / `--correct-bg` mean "Correct" and `--wrong` / `--wrong-bg` mean "Incorrect". Error types use their own muted tints (sage, warm grey, soft amber, soft rose), always with their own icon and name, so a type is never read from its colour. Material status (14 Oct 2026) also uses the status green for Ready and the error red for Failed, always with its own icon and label (see StatusChip), so it never reads as an answer result. The status green stays clearly apart from the olive of the gradient.
- Status = icon + label + color. Never color alone.
- Tags are categories, never status. A material's type is not a tag: it is the icon and plain label on its material tile (see "Material types"). Every tag ("SCENARIO", "QUIZ" and the rest) uses the one neutral surface. The status green (`--correct` #1F7A4D on `--correct-bg`, always with a check icon and the word "Correct") is far more saturated than the grey-green sage, so a file tag never reads as a result. Status green, bright green and pink are not tag colours, so tags cannot be read as correct or wrong; the sage tag is grey-green and muted.
- Dark theme is out of scope for the MVP.

## Typography
- One sans family for everything: DM Sans (Google Fonts via `next/font`), weights 400, 500 and 600, chosen against Figtree, Plus Jakarta Sans and Instrument Sans as the closest to the friendly geometric sans of the Home target. No serif anywhere. Letter-spacing is normal except for uppercase labels.
- Text styles, locked from the Results screen of 12 Oct 2026 (values read from the computed styles there). Every screen uses only these styles, as the `type-*` utilities in `globals.css`; no component sets its own font size, weight, line height or letter-spacing. Colour is separate (a style can be `--text`, `--text-secondary` or a tint's ink).

| Style | Utility | Size / line height | Weight | Extra | Used for |
|---|---|---|---|---|---|
| Display headline | `type-display` | 28 / 35 (1.25) | 600 | | Results headline, Home headline, onboarding step headlines |
| Display sub-line | `type-display-sub` | 18 / 28 | 400 | `--text-secondary` | the grey second line of a display headline on Results |
| Page title | `type-page-title` | 28 / 35 (1.25) | 600 | | the h1 of every other screen (Materials, Progress, Session setup, Error analysis…) |
| Card title | `type-card-title` | 22 / 27.5 (1.25) | 600 | | card and sheet titles, the progress card title, the ring numeral |
| Item title | `type-item-title` | 18 / 24.75 (1.375) | 600 | | titles inside cards and lists (answer cards, topic cards, scenario cards, Next up), section headings, question text |
| Body | `type-body` | 16 / 25.6 (1.6) | 400 | | running text and option text |
| Body strong | `type-body-strong` | 16 / 25.6 (1.6) | 600 | | names in rows (error types, step titles), values (Outcome), legends, the selected tab |
| Grey secondary text | `type-small` + `--text-secondary` | 14 / 20 | 400 | | descriptions, sub-lines, hints, captions under titles, the footer note; the same size in `--text` for small controls (source chips, chat chips, confidence pills) |
| Uppercase label | `type-label` | 12 / 16 | 500 | uppercase, letter-spacing 0.06em | overlines, field labels ("YOUR CHOICE"), tags, the "N TO REPEAT" pill, "CORRECT" / "INCORRECT" |
| Large numeral | `type-numeral` | 28 / 37 (1.33) | 400 | tabular numerals | the counts in the Correct and Incorrect rows |
| Button label | `type-button` | 16 / 24 (1.5) | 500 | | primary and secondary pill buttons |
| Small caption | `type-caption` | 12 / 16 | 500 | | status chips, count badges, numbered circles, navigation labels |
| Small action | `type-action` | 14 / 20 | 500 | `--primary` | tertiary buttons only (underlined small actions) |

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
- Surroundings measured from the tokens: page `--bg` #F3EEE9, cards `--card` #FAF7F3, cards and dialogs `--surface` #FFFFFF.
- Sand against them: 1.02:1 on the page, 1.10:1 on cards, 1.18:1 on the white sheet, so a sand shape is nearly invisible on its own. Wherever sand sits on the page or a card (the segmented control track, Guide chips, the Your choice block, disabled buttons), it gets a 1px `--secondary-sand-pressed` stroke; inactive progress segments, dots and the empty part of the progress ring are filled with `--secondary-sand-pressed` (1.16:1 on the page, 1.26:1 on cards, 1.34:1 on white). Meaning is always carried by a label or the active state, never by the colour alone.
- Contrast on `--secondary-sand`: `--text` 14.79:1, `--text-secondary` (muted labels) 5.85:1, `--primary` 8.32:1, the focus ring 8.18:1, the red cross 5.55:1, the green check 4.52:1. On `--secondary-sand-pressed`: `--text` 12.96:1, `--text-secondary` 5.13:1.
- Used for: Guide chips; the Your choice block (with its 3px dark green line); inactive step segments, carousel and onboarding dots, thin progress tracks and the empty part of the progress ring (pressed tone); the segmented control track; disabled button and option backgrounds with a muted label; the pressed state of outline buttons, option chips and text buttons.
- Not used for (unchanged on purpose): the coloured tags (SCENARIO yellow, QUIZ blue, SHORT peach, FULL lilac, EXTENDED blue, TRAINING green, Progress mode tags, the direction chip, all without a stroke), the icon backgrounds (topic tiles, What to create tiles, the Next up tile), error-type chips and rows, selected cards (the sage tint `--next-card` with the `--stroke-sage` stroke, pressed `--secondary-pressed`: their own tokens), the white circular back button and the white arrow circle on the Next up card, primary buttons, neutral status chips (Ready, Processing, Marked correct by you) and neutral panels such as empty-state circles and chat bubbles, which use `--surface-muted`.

## Pastel palette (15 Oct 2026; replaces "Chip tones")
ONE palette of soft pastels for every multi-colour background: chips and tags, the icon tiles (topic tiles on Home and Weak topics, the "Next up", Create training and onboarding tiles, the error-type tiles on the results), the Progress chart fills and the current-item pill in the bottom navigation. No screen sets its own pastel; nothing else in the app has an older pastel or saturated value (the former `--chip-*` fills, `--tag-*`, `--pastel-green`, `--pastel-yellow`, `--secure-bg`, `--caution-bg`, `--misconception-bg` and `--guess-tile` are removed). The file-type tiles on Materials and the S1 to S10 circles keep their own `--olive-tint` #D6DEC9, and a chip inside a selected SelectableCard turns `--primary` with white text.

Chips have no stroke: a soft pastel fill, dark text or icon, nothing else. Every chip is drawn by the one shared Chip component (the Tag, the status chip and the Guide chip only choose a tone and a size). Chips keep the meaning of their hue: Ready green with a check, Failed rose with an alert icon, Processing sand with a clock, each error type in its own tone. Interactive chips (the Guide chip) have only the keyboard focus ring and no hover.

| Tone | Token | Hex | Used by | Text and icon | ΔE on page #F2EEEA / card #FAF7F4 / selected card #F2F3EF |
|---|---|---|---|---|---|
| Yellow | `--pastel-yellow` | #F8F2CC | SCENARIO, REPEAT ROUND, the direction chip, the navigation pill, topic tiles | `--text` 15.39:1; Knowledge gap `--caution` #8A5A00 5.24:1 | 17.4 / 18.0 / 17.6 |
| Rose | `--pastel-rose` | #F8E4E2 | Failed, Incorrect | `--wrong` #B3261E 5.35:1 | 6.3 / 8.2 / 8.5 |
| Blue | `--pastel-blue` | #DFECF0 | QUIZ, EXTENDED, QUIZ and QUIZ REPEAT sessions, topic tiles | `--text` 14.42:1 | 7.4 / 8.2 / 6.6 |
| Lilac | `--pastel-lilac` | #EDE7F5 | FULL, FULL and EXTENDED sessions, topic tiles | `--text` 14.38:1 | 9.5 / 10.1 / 10.1 |
| Green | `--pastel-green` | #DDEBE3 | TRAINING, Ready, Correct, the Next up, Create training and onboarding tiles, topic tiles | `--chip-ink-green` #1C7249 4.80:1; Secure `--secure` #3D5A43 6.22:1; `--text` 14.14:1 | 7.2 / 8.6 / 6.4 |
| Peach | `--pastel-peach` | #F7E1D8 | SHORT, SHORT SESSION, topic tiles | `--text` 13.85:1 | 7.9 / 10.0 / 10.0 |
| Sand (neutral) | `--pastel-sand` | #E5DFD4 | Guide chips, Processing | `--text` 13.13:1 | 6.5 / 9.4 / 8.0 |
| Primary (selected card) | `--primary` | #3F4638 | the chip inside a selected SelectableCard | `--primary-text` white 9.79:1 | dark green, far above 6 |

- The six requested values (yellow #F8F2CC, rose #F9E5E3, blue #DFECF0, lilac #EDE7F5, green #DFEDE5, peach #F7E1D8) were checked in CIE76 ΔE against the three backgrounds above and against the app's own #F3EEE9, #FAF7F3 and #F2F3EE. Yellow, blue, lilac and peach passed as given. Rose (5.99 on #F3EEE9) and green (5.78 on #F2F3EE) fell just below 6, so each was darkened by the smallest step that passes: rose to #F8E4E2 (1 per channel, lowest ΔE 6.1) and green to #DDEBE3 (2 per channel, lowest ΔE 6.2). The sand stays #E5DFD4 (it was darkened from #ECE6DB earlier because #ECE6DB was only 4.3 from the page).
- Rule: every tone is at least 6 in CIE76 ΔE from each of those six backgrounds, so a chip or tile never gets lost on the page, a card or a selected card. The tones sit within 7 points of the same lightness (L* 89 to 96) so none looks stronger than the rest.
- Text and icon contrast on every tone is at least 4.5:1 (the lowest is Ready's green on green at 4.80:1). On icon tiles the icon is always the dark `--text` colour.
- Where each tone is used (hue meaning stays as before): topic tiles cycle yellow, blue, lilac, green, peach by guide section; the Next up, Create training and onboarding tiles are green; the error-type tiles on the results are green (Secure), sand (Guess), yellow (Knowledge gap) and rose (Misconception).

## Buttons (locked 14 Oct 2026; the single source of truth)
One shared Button component (and ButtonLink for navigation) with exactly three variants. Nothing else in the app draws a button; no tonal, sand-filled, grey or link-styled variants.
1. Primary: filled `--primary` deep olive-green, white label (9.79:1) in the button label style, `--radius-button` (14px, never a pill), 52px high, full width of the content area. Pressed: `--primary-pressed`. Disabled: `--secondary-sand` #F0ECE6 fill with a muted `--text-secondary` label (and the 1px `--secondary-sand-pressed` stroke it already has; its box size stays 52px). One per screen or sheet, the main action.
2. Secondary (changed 16 Oct 2026; replaces "outline only"): FILLED with the light olive tint `--olive-tint` #E0E6D6, no stroke, label in `--primary` dark green (not an accent colour), button label style, `--radius-button` 14px, 52px high and full width, so it is exactly as wide and tall as the primary. Pressed: #D6DDCB (`--olive-tint-pressed`). Disabled: `--secondary-sand` #F0ECE6 fill with a muted `--text-secondary` label. Focus: the 2px ring with 2px offset follows the 14px radius. Always placed next to a primary: stacked, primary on top, secondary directly below, 12px apart, same width and height. One exception: the page-header action "Upload a file" on Materials is a secondary on its own, 44px high with the same 14px radius. Measured (CIE76 ΔE, all at least 6): #E0E6D6 against the page #F2EEEA 8.2, the card #FAF7F4 10.2 and the selected card #F2F3EF 8.3; the `--primary` #3F4638 label on it 7.67:1 (at least 4.5:1). `--olive-tint` is now #E0E6D6 everywhere it is used (file tiles, letter badges, answered strip squares, S-number circles, the 3D placeholder). There is no outline variant: only primary, secondary and tertiary exist. Two documented exceptions to "always below a primary": (a) the Results pair, where in ONE ROW the secondary "Review answers" is on the LEFT and the primary "Repeat weak topics" on the RIGHT (the one exception to "primary on top"), and in the stacked fallback the primary is on top again; (b) on Results with nothing to repeat, "Review answers" stands alone as a full-width secondary under the content.
3. Tertiary: text with an underline. No fill, no border, no shadow. `--primary` label in the small action style (`type-action`, 14px, medium), underlined with a 4px offset; an optional decorative icon before it (the sparkle for AI actions) or a plain arrow after it ("Details"). Its tap area is at least 44px tall through invisible padding, without a visible box. Pressed: the underline thickens. Disabled: muted `--text-secondary` label, no underline. Used for small actions, inside cards or below the main buttons: Exit, Skip, Close, Cancel, Undo, See more, How it works, Select all / Deselect all, I don't know, Try another file, Reset progress, Details.
- For all three: no hover state anywhere; the same keyboard focus ring (`:focus-visible` only, see Focus); the visible label is the accessible name; icons are decorative (`aria-hidden`). A disabled button is the native disabled state with `cursor: not-allowed`, and where it blocks progress a line nearby says why.
- Not buttons of these types (icon controls and selectable items, documented elsewhere): the white circular back button, the ArrowCircle and the plain Chevron, Guide chips, SelectableCards, tabs, the segmented control, the confidence pills, the stepper's round − and + buttons, the round send button in the answer dock, drag handles and the Ask AI suggested-question pills.
- Audit (14 Oct 2026), every button by screen and its type:
  - Onboarding: Next / Continue / Get started (primary); Skip (tertiary).
  - Home: Next up "Repeat weak topics", "Continue", "Start a scenario" (primary); How it works (tertiary).
  - Materials: Upload a file (secondary, the header exception); Try another file on a Failed card (tertiary).
  - Upload sheet: Close (tertiary); Ready: Create training (primary), Open material (tertiary); Failed: Try another file (primary).
  - Material page: Create training or Start training (primary) with Create again or Open the sample guide (tertiary); Try another file on a failed material (tertiary).
  - Create training: Select all / Deselect all (tertiary), Generate (primary). Generating: Cancel (tertiary). Review: Start training (primary) with Back to material (secondary) below it; Show all decisions / questions (tertiary).
  - Session setup: Select all / Deselect all (tertiary), Start session / Start quiz (primary).
  - Scenario and quiz: Exit (tertiary), Next / Finish (primary), the circular Back (a 48px white icon button, not one of the three types), I don't know (tertiary, short text only). Exit dialog: Stay (primary), Leave (tertiary).
  - Answer review: Back to results (primary), Previous question and Next question (tertiary); Ask AI about this step (tertiary).
  - Results: Review answers (secondary, left) and Repeat weak topics (primary, right) in one row when both fit, otherwise Repeat weak topics on top and Review answers below; Review answers alone (secondary, full width) when there is nothing to repeat. No Back to Home: the white Back goes Home. Weak topics: Repeat selected (primary). Session setup: Start session (primary); Guide sections screen: Done (primary), Deselect all / Select all (tertiary).
  - Ask AI and source sheets: Close (tertiary); Send (primary, beside the field).
  - Answer review: Back to results (primary), Previous question and Next question (tertiary).
  - Progress: the "N topics to repeat · Weak topics" link and See more (tertiary); empty state: Start a scenario (primary, to Home).
  - Weak topics: Repeat selected (primary); empty state: Create training (primary).
  - Profile: Reset progress (tertiary); the confirmation dialog: Reset (primary) with Cancel (tertiary).
  - Not found screens (material, session, results): Go to Materials (primary).
- The /screens page has a "Buttons" group with the three types in their default, pressed, disabled and focus states, on the page and on a card.

## Gradients
- None. The app has no gradients (the evacuation guide's gradient cover was removed on 13 Oct 2026; every material uses the material tile (olive tint)). Home has no graphic elements at the top, and the Results header uses the soft light header (see "Results screen").

## Material tile
- One tile for every material, on the Materials list (Ready, Processing and Failed), the material page header and the upload sheet's sample files: a 64px rounded square, 20px radius, filled with `--olive-tint` (#D6DEC9), the same for PDF, DOCX, LINK and every other file type. The type is told by the icon and the plain label (see "Material tile content"), never by the colour. Static, decorative (`aria-hidden`), no gradient, no shapes.
- Contrast: the dark green icon and label (`--primary`) on the tile 7.07:1 (AA for the 12px label), `--text` 12.56:1. The tile against the near-white card (#FAF7F3) is a 1.30:1 step in lightness; it is a decorative fill, so the 3:1 rule for meaningful graphics does not apply, and the icon on it carries the information.

## Decorative shapes
- One shared component, SoftShape: two or three overlapping soft organic curves rising from the bottom-right corner of a card along part of its lower edge, clipped by the card's rounded corners and drawn behind all content. Abstract only: no leaves, trees, mountains or any recognisable object. Inline SVG, static (no animation), `aria-hidden`, no pointer events.
- Colour: the moss sage `--mesh-moss` at low opacity, tone on tone with the card.
  - "strong" (the Home "Next up" card): layers at 6%, 8% and 14%; where all three overlap the card reads #D3D7C6 (about 26% moss on `--next-card`).
  - "faint" (the Home "New scenario" cards): layers at 3%, 3% and 4%; at most about 10% moss on `--card` (#EEECE3), barely noticeable.
- Contrast at the darkest overlap: strong `--text` 11.9:1, `--text-secondary` 4.69:1, `--primary` 6.67:1; faint `--text` 14.7:1, `--text-secondary` 5.82:1. The primary button and the white arrow circle are opaque, so their contrast is unchanged (white on `--primary` 9.79:1).
- These two Home cards are the only place decorative shapes are allowed. Every other screen and card stays flat.

## Layout
- Header with an action (one shared component, HeaderRow): a row with the title on the left and the button on the right, vertically centred, 12px apart; the button never wraps its label and never shrinks, the title takes the rest and may wrap. The subtitle is always a separate line below the whole row, 12px under it, never beside or under the button, and may wrap. 24px from the header to what follows (tabs, list). Used by the Materials page, the upload sheet, the Ask AI sheet, the source sheet and the soft cards with an action (Error types → Details).
- Single column with 16px side padding. Content width is the screen width, 430px maximum.
- Safe areas: respect the top and bottom safe areas (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) on every fixed element.
- Bottom navigation: four sections, Home, Materials, Progress and Profile. It is shown only on these four sections.
- Onboarding, Session setup, the scenario session and Session results are opened from other screens. They have no navigation item and no bottom navigation. Screens below another screen show the circular back button at the top left (see Circular back button); a running session shows "Exit" in its top bar instead. Exit asks for confirmation (Stay or Leave); the session stays saved and Home offers to continue it.
- Primary action: a fixed bar at the bottom of the screen with one olive pill button. On the four sections it sits above the bottom navigation; elsewhere it sits at the bottom. Scrolling content gets bottom padding so nothing hides behind the bar.
- During a session: see "Session screens (v2)": Exit, the position, the step strip and the bottom bar with Back and Next or Finish.
- Sources: the source panel is a bottom sheet opened from a source chip.

## Screen map
From `docs/mvp-matrix-and-ia.md`.
- Onboarding (replaced 13 Oct 2026; there is only this one): a first-run introduction that explains the app in under 20 seconds. Three short steps and a final screen, moved through with buttons (a horizontal swipe also works). See "Onboarding screen" below.
- Home: see "Home screen" below.
- Weak topics (Home, Progress and the Weak topics page) are guide sections where at least one answer was wrong: for each step or question, the most recent answer counts, so a later right answer clears it. A topic reads "n to repeat" (the number of wrong answers in it). There are no error types.
- Repeat summary: on Home the Next up card carries "N topics to repeat" and the primary "Repeat weak topics"; Progress only links to the Weak topics page (see Progress).
- Topic card: see "Home screen" below (Home only).
- Weak topics page: see "Results screen (v3)" (flat list of sections with checkboxes and a sticky "Repeat selected (N)"; no groups by error type).
- Repeat round: a session made of the questions answered wrong in the chosen sections, in section order, on the same session screen. The top row reads "Question 2 of 5". Results are the same as for any session, headed "Repeat complete." is not used; the overline reads REPEAT ROUND.
- Materials: Materials list · Upload sheet · Material page.
  - Material types: three, PDF, DOCX and LINK (other uploads such as TXT or JPG show the document icon with their own label). The meta line under the name reads "PDF · 1.2 MB · 7 Oct 2026" for a file and "Web page · example.org · 7 Oct 2026" for a LINK (the site's address, no file size). On the material page a LINK shows Type "Web page" and Address (the full address) instead of Size.
  - Material tile content: a 24px Lucide outline icon, stroke 2, in `--primary` (dark green): `FileText` for PDF and DOCX (and any other file), `Link2` for LINK. Directly under it, 2px apart, the type label (PDF, DOCX, LINK) as plain text in the small uppercase label style, `--primary`, with no pill and no background of its own. The tile is decorative (`aria-hidden`): the type is also in the meta line.
  - Materials list: one row per material (tile, name, the meta line, status badge): your uploads first, newest first, then the sample materials with the guide on top. An "Upload a file" secondary button sits next to the page title (see "Header with an action"). Under the title row, 12px below it at full width, the subtitle "Guides you can turn into scenarios / and quizzes." on two lines (a line break before "and quizzes.") in 14 `--text-secondary` (the grey sub-line style, as on Home). Below the header (24px), underline tabs "Ready", "Processing (N)" and "Failed (N)" filter the list (counts on the last two); Ready is open by default, and starting a simulated upload switches to Processing, where the new file shows with its progress until it is Ready or Failed; then the list follows it to that tab. Each tab has a one-line empty state. Every row has its material tile (see Material tile content). A Processing row adds a thin progress bar; a Failed row adds its reason in 14 `--text-secondary` and a "Try another file" secondary button that opens the upload sheet.
  - Material status: the shared StatusChip, drawn by the Chip (icon + label + colour, never colour alone; no stroke), the same on the Materials cards, the material page and the upload sheet. Ready: check icon, `--chip-ink-green` on `--pastel-green` (4.90:1). Processing: clock icon, `--text` on `--pastel-sand` (13.13:1); its progress bar stays neutral. Failed: alert icon (a circle with an exclamation mark), `--wrong` on `--pastel-rose` (5.11:1). See Pastel palette.
  - Upload sheet: a bottom sheet like the source sheet, with the line "Upload is simulated for this prototype. Choose a sample file." Three states: choose (a list of sample files as option rows: material tile, name, type and size, and one line on what it contains), progress (file name, a progress bar with percent, "Checking the file"; the file also appears under the Processing tab), result (Ready: status badge, "Create training" primary and "Open material" text action; Failed: reason and "Try another file"). Sample files: the full evacuation guide, the flood preparedness guide (F1 to F7, with its own scenario and quiz), a one-page "Evacuation quick card" (guide sections S1 and S2 only, too short for a scenario) and a photo of a notice (fails: no readable text). Uploaded items stay in this browser.
  - Material page: the circular back button (to Materials), the material tile, name (page title), a details card with label/value rows (Type, Size, Added, Status), the scenario card, then sections with a one-line excerpt each (tap opens the source sheet for the guide). Materials without sections say why ("This prototype does not read uploaded files, so there are no sections to show."). Once training has been created, small tags "Scenario" and "Quiz" (pastel, uppercase) show under the name, on the material page and on its row in the list. The action bar's primary button is "Start training" when training exists (with a text action "Create again"), otherwise "Create training" when the material holds guide content. For a material without guide content it is disabled with the line above it: "In this prototype, training can be created from the sample guide and its quick card only." and a text action "Open the sample guide".
- Progress (reworked 14 Oct 2026; rule: Home = what to do now, Progress = how you are doing over time, with no duplicated actions): the title "Progress" with the grey subtitle "How you are doing over time." (HeaderRow, 12px, then 24px to the first card), then five cards 24px apart, in this order. Everything is computed from the sessions stored in this browser; nothing is invented.
  - Summary card: three numbers in one row, big (the numeral style) over a short grey label: "Sessions" (how many), "Average result" (the mean of each session's percent correct) and "Correct answers" (the share of all answers that were correct).
  - "Result by session" card: simple bars for the last 6 sessions, oldest on the left, newest on the right; bar height is the percent correct, the value ("83%") above each bar and the date ("7 Oct") under it; the older bars in `--pastel-green`, the latest in `--primary`; chart area 120px high. Not interactive (no hover). The numbers are always text; the chart is hidden from screen readers and a visually hidden table gives the same dates and results. With fewer than 2 sessions the card shows "Complete two sessions to see your trend." instead of the chart. A repeat round counts as a session like any other.
  - "Guide sections" card: a compact list S1 to S10 (a flood section F1 to F7 appears too once it has been practised): the S-number circle in `--olive-tint`, the section name, a thin progress bar (`--pastel-green` track fill on `--secondary-sand`) and the text "4 of 6 correct" or "Not practised yet". A step counts for each section it cites. Not tappable, no arrows.
  - Session history: as before (the 5 newest, then the underlined "See more" for 5 more each time).
  - Not on Progress any more: the "N topics to repeat" card with Repeat weak topics and the Topics row. They live on Home only.
  - No data at all: one empty state, "No sessions yet. Start a scenario to see your progress.", with the primary "Start a scenario" that goes to Home.
  - The floating bottom navigation never covers the last card (the page keeps its bottom padding).
- Create training (from a Ready material's "Create training" and from Home "New scenario"). Flat page background, no graphics:
  - The circular back button (to the material), a small "TRAINING" tag (muted sage), the title "Create training" (page title) and the material name in grey below it.
  - "What to create" (item title): two option cards, Scenario ("6 decisions, one story through the guide.") and Quiz (the live count "N questions from the sections below."). Each is a SelectableCard (card size, check box): a 40px round `--pastel-green` sage tile with a 20px outline icon on the left (a document for Scenario, a document with a question mark for Quiz), the title in body strong and grey text. Both are selected by default; at least one must stay selected (the last one cannot be cleared, with the line "Choose a scenario, a quiz or both."). Too short for a scenario: the Scenario card is disabled and the neutral notice reads "Not enough material for a scenario. A quiz is available."
  - "Sections found" (item title) with one underlined text toggle on the right: "Deselect all" when every section is selected (it clears them all), "Select all" in any other state (it selects them all). Every section is selected by default. Then the helper text "The scenario is one prepared story through the guide. The sections you keep shape the quiz." and the section list (see Section list).
  - When Quiz is selected, "How many questions?" under the sections: two option cards, 5 (Default) and 10 (Extended). An amount larger than the available total is disabled with the hint "Not enough questions for these sections"; the default is 5 (or every question when the sections hold fewer); a live line "N questions available in the selected sections". Hidden when Quiz is off.
  - A sticky full-width primary button "Generate" with a small arrow-right icon after the label. Disabled while no section is selected, with the hint "Keep at least one section."
  - The chosen quiz size is saved with the training. Review shows "Quiz: N questions"; Session setup in quiz mode offers only amounts up to N and starts on N.
- Generating: no navigation, a calm full screen with the circular back button at the top left ("Back to Create training", the same as Cancel): title "Creating your training", the line "Generation is simulated for this prototype. Prepared content is shown." in 14 `--text-secondary`, then four steps as a list: "Reading the material", "Finding key sections", "Writing situations", "Writing questions" (situations is skipped and marked "Not needed" when there is no scenario). Each step shows a state with icon and label: waiting (empty circle, "Waiting"), working (clock, "Working"), done (check, "Done"). A thin overall progress bar with percent, about 4 seconds in total, announced politely. Tertiary button "Cancel" returns to Create training without saving. When done, it opens Review.
- Review training: the circular back button (to the material), title "Your training is ready", the material name, then two cards: "Scenario: N decisions" and "Quiz: N questions", each with a disclosure button ("Show all decisions" / "Show all questions", `aria-expanded`). Expanded, the scenario lists every situation (title, the question asked, source chips) and the quiz lists every question (type tag, question, source chip). Primary "Start training" (opens Session setup for this material), secondary "Back to material".
- Session setup for a material's training: the mode control shows only what was created; the quiz sections start from the ones chosen in Create training and can be narrowed further.
- Profile: Direction (the four directions as option cards; only "Building evacuation and first aid" can be selected, the others are disabled with "Not available in this prototype") · Settings: "Reset progress" (secondary button) opens a confirmation dialog. Reset deletes the saved sessions, history, weak topics and created trainings on this device; the direction, onboarding and uploaded files stay. Afterwards a neutral line confirms it.
- Session setup: when a session is unfinished, one line above the start button says that starting replaces it. First a mode choice as a full-width segmented control: Scenario or Quiz.
  - Scenario: length cards Short (3 decisions, about 5 min, steps 1 to 3), Full (6, about 10 min) and Extended (10, about 16 min: the full story with four extra steps). Times are always labelled as estimates ("about"). Lengths the material's scenario does not have are shown disabled with "Not available for this material" (the flood guide has only 3 decisions, so it starts there).
  - Quiz: "Guide sections" with the same Select all / Deselect all toggle on the right (every section selected by default), then the section list (the same component as Create training) with a grey "N questions" on the right of each row. Under the list one live line (announced politely): "N questions available in the selected sections". Then the number of questions as two cards, 5 (Default) and 10 (Extended). An amount larger than the available total is disabled, with the hint "Not enough questions for these sections". When the sections change, an amount that no longer fits drops to the largest one that does, or to every question there is when fewer than 5 are left. A hero slot (see HeroSlot) sits above the title. "Start quiz" stays disabled until at least one section is chosen, with the hint "Keep at least one section." With a saved training the amounts go up to the saved quiz size N, and the amount starts on N.
- Scenario and quiz session (v3): one question screen with Back and Exit, the step strip and Next or Finish; no feedback on the way. See "Question model and session (v3)".
- Session results (v3): see "Results screen (v3)". The sequence is Finish → Results → (A) Weak topics → Repeat selected → repeat round → Results, or (B) Review answers → Answer review (Previous, Next) → Results.

## Components and states
Every component needs: default, hover, focus-visible, active, disabled. Inputs also need error.
- Button hierarchy. Three levels of action plus references, applied everywhere:
  - Primary, Secondary and Tertiary: see "Buttons" (locked, with the full audit by screen).
  - Session length cards (10, 20, 30) are SelectableCards (card size, radio). Confidence levels no longer exist.
  - References, not actions: source chips (see Source chip). They must never look like a button.
  - AI text button: the Tertiary button with the sparkle icon before its label ("Ask AI about this step" on the decision step and in the Error analysis cards).
  - Suggested questions (Ask AI and "Ask about this step") are white pills with a 1px `--border`, 14 text: a lighter secondary that sends a question.
  - Disabled (all variants): see "Buttons". Filled: `--secondary-sand` fill with a 1px `--secondary-sand-pressed` stroke and a muted `--text-secondary` label (5.85:1); outline: a 1.5px `--secondary-sand-pressed` stroke and a muted label; text: a muted label without underline. Always `cursor: not-allowed` and the native disabled state, and a disabled action is explained by a line nearby where it applies ("Choose an action to continue."), so colour is never the only sign.
- Card: warm near-white `--card` with the very soft `--card-shadow`, 24px radius, 16 or 20px padding, no border on the page background. Inputs, option cards, sheets and the navigation bar stay white (`--surface`).
- ArrowCircle (14 Oct 2026; the one arrow for every card or row that opens something): a white (`--surface` #FFFFFF) circle with a 1px `--arrow-stroke` (#E4DFD5, warm) and the very soft `--arrow-shadow` (0 1px 2px rgba(0,0,0,0.06)), always white, also on the sage Next up card and on cards with the SoftShape. The arrow (`ArrowRight`) in `--primary`, 2px line weight. Two sizes only: 40px circle with a 20px arrow everywhere; 32px with a 16px arrow in compact rows (the upload sheet's sample files). Position (14 Oct 2026): ArrowCircle: top-right corner. Plain chevron: vertically centred on the right. The circle is placed by the shared component itself, absolutely in the card's top-right corner with equal top and right offsets (16px; 12px for the small size in compact rows), so every card behaves the same; the card is `relative`. The title and text block beside it keeps a right padding of at least the circle width + 12px (56px; 44px for the small size), so long titles wrap before the circle and never run under it, also at 360px. No hover. It is decorative (`aria-hidden`) because the whole card (or row, or the "Details" link) is the link or button, which carries the focus ring. Tinted or grey circles are not used. Materials list cards and the material page's section rows use the plain Chevron without a circle; all other card arrows use ArrowCircle (white circle).
  - Where it is used (audit of 14 Oct 2026): Home, the Next up card (when it links to Weak topics), the topic cards (Home and Progress) and the New scenario cards; Progress, the "N topics to repeat" card; the upload sheet, the sample-file rows (small); all in the top-right corner. The Weak topics rows (check boxes) and "Details" (a plain arrow after the label) do not use it. "Details" on the Error types card has a plain arrow without a circle after its underlined label (see Buttons, Text). Not used, because they do not open anything: session history rows on Progress, the Weak topics rows (check boxes) and every SelectableCard. The arrow inside the "Generate" button is a button icon, not a card arrow.
  - Chevron (one shared component): a plain chevron (`ChevronRight`, 20px, 2px line, rounded caps) in `--primary`, no circle, background, stroke or shadow, in a 44px invisible area; decorative (`aria-hidden`). Used on the material page's section rows that open the source sheet (vertically centred on the right of the row) and on the Materials list cards.
  - Materials list cards (Ready, Processing and Failed tabs, one shared card): the Chevron, vertically centred on the right of the whole card (title, meta line and status row), with the card's right padding. The whole card is the link (the link stretches over the card); the chevron is decorative (`aria-hidden`); the keyboard focus ring and the pressed tint are drawn on the whole card. A button inside the card ("Try another file" on a Failed card) stays its own control above the link.
- Tappable cards (topic cards, material rows, the Continue session and New scenario cards, option and checkbox cards, section rows): no hover effect at all; a card never changes when the mouse passes over it. Pressed (while tapped or clicked): the background darkens slightly to `--surface-muted` (white cards) or `--border` (cards already on `--surface-muted`). Keyboard focus: the 2px `--accent` ring with a 2px offset. A card that opens something or starts something shows the ArrowCircle on its right (Materials list cards and material page section rows: the plain Chevron, see ArrowCircle). Option and checkbox cards select instead, so they show their radio or check box, not an arrow. Chips (source chips, chat question chips, status chips, tags) never change on hover either; they keep their pressed state and focus ring. Only buttons and text links keep a hover state.
- Icons: one outline set, Lucide (`lucide-react`), stroke width 2, sizes 16 (inline, badges), 20 (the ArrowCircle arrow, controls), 22 (navigation), 24 (topic tiles) and 40 (empty states). No emoji, no mascots, no filled or 3D icons, nothing hand-drawn next to them. Icons are decorative: always `aria-hidden`, always next to text that says the same thing. Not in the Home gradient header.
  - Topic icon tile (the shared TopicTile, two sizes): the default is a 48px round pastel tile with a dark (`--text`) 24px icon. The tile colour comes from the guide section, never from the error type or the material: the section number picks one tone from the cycle yellow, blue, lilac, green, peach (`--pastel-*`, see Pastel palette), so S1 and F1 are yellow, S2 and F2 blue, S6 yellow again. A topic keeps the same tone everywhere. The "compact" variant (36px circle, 18px icon, stroke 1.75) is used on the Weak topics page only; Home topic cards keep the default size. Icon contrast 12.8:1 or more on every tint.
  - Topic icons (in the topic data, with a default of `BookOpen`): S1 alarm `BellRing`, S2 checking the route `DoorOpen`, S3 smoke `Wind`, S4 assembly point `MapPin`, S5 calling for help `Phone`, S6 assessing an injured person `HeartPulse`, S7 bleeding and S8 burns `Bandage`, S9 unresponsive person `HeartPulse`, S10 handover `ClipboardList`, every flood section `Droplet`.
  - Empty states (no weak topics, no materials in a tab, no history): a large 40px icon in `--text-secondary` on a 72px `--surface-muted` circle, centred above one line of text (and the empty state's button, if it has one). Icon on the circle: 5.8:1. Weak topics `ListChecks`, materials `FileText`, history `History`.
- Tag: small uppercase label, 12, letter-spacing 0.04em, medium weight, `--text` on a `--pastel-*` tone without a stroke (see Pastel palette), pill shape, 4px 10px padding, drawn by the shared Chip. For categories such as "SCENARIO" (yellow), "QUIZ" (blue), "SHORT" (peach), "FULL" (lilac), "EXTENDED" (blue), "TRAINING" (green), the Progress mode tags and the direction chip (yellow). Never for status, and never in the sand (that is for Guide chips and Processing).
- SelectableCard (14 Oct 2026; one shared component for every choice in the app, replacing three earlier styles). One set of states:
  - Unselected: `--card` fill, a 1px `--selectable-stroke` (#D3CDC2, the neutral stroke) and an empty control.
  - Selected: the `--selected-tint` fill (#F2F3EE, the soft sage) with a 1.5px `--selected-stroke` (#A9B5A0, the darker sage) and a filled control (`--primary`, white check or dot).
  - Pressed: `--selected-pressed` (#E3E8DC, a slightly stronger sage); no hover; the keyboard focus ring (focus-visible only) around the whole card; at least 44px tap area.
  - Disabled: `--secondary-sand` with a 1px `--secondary-sand-pressed` stroke, the label in `--text-secondary`, a dashed control and `cursor: not-allowed`, with a line nearby saying why where it applies.
  - Control on the right: a radio circle for a single choice, a check box for several. The whole card is the label of the native input, so the selected state is announced.
  - Two sizes of the same component. "card": 24px radius, 16px padding, at least 56px high, for a title, a description and an optional tag (answer options, What to create, session lengths, question counts, directions). "row": 20px radius, 8px 16px padding, at least 48px high, 8px between rows (section rows S1 to S10 with their olive S-number circles, Weak topics rows).
  - Chips inside a SelectableCard (14 Oct 2026): when its card is selected, the chip switches to the primary look: `--primary` fill, `--primary-text` white text (9.79:1), no stroke. Unselected cards keep the chip's own pastel; moving the selection swaps the two at once. Built once: SelectableCard tells the chips inside it that they are selected (the Tag reads it), so no screen styles this itself. The change is instant (no animation, so also fine with reduced motion) and decorative: the radio or check box already announces the selected state.
  - Text on the selected tint: `--text` 15.61:1, `--text-secondary` 6.18:1; pressed: 13.96:1 and 5.52:1. The colours of tags and S-number circles inside a card do not change.
  - After Next the option keeps its selected look and can be changed by going back; correct and wrong are shown only in the answer review after Finish, never by colour alone.
- Status badge: icon + label + colour, used for material status (Ready, Processing, Failed) and the answer result in lists. Labels in sentence case. Error types no longer exist.
  - Result: Correct (check, `--correct` on `--correct-bg`) and Incorrect (cross, `--wrong` on `--wrong-bg`); there is no partly correct.
  - Shape: pill, 12 label size, 4px 10px padding.
- Results screen components (hero, pass mark bar, Weak topics card, button pair, circular back button): see "Results screen (v3)".
- GuideChip (one shared component, the only way a guide section is shown as a chip): shows "Guide · S2" (document name + section id; the guide has no page numbers) after a small 14px document icon. Used on the decision step, above quiz questions, in the answer sheet, the Error analysis cards, Results (weak topics), Ask AI answers and Review training. Tone: the sand chip (`--pastel-sand` #E5DFD4, no stroke; ΔE of at least 6.2 from the page, cards and selected cards, see Pastel palette), `--text` text (13.13:1), the icon in `--text-secondary` (5.19:1); with a section title ("Guide · S2 · Checking the route") the title is `--text` too. No screen may set its own chip background, outline or tint, and a guide section is never a category Tag. Smaller than a button: 36px visible height, 12px horizontal padding, small text; an invisible extension above and below makes the tap area 44px. It reads as a reference, not an action, and opens that section in the source sheet. No hover change. Pressed: the chip darkens by 5% (a brightness step, still above 4.5:1 for the text). Focus: the app focus ring, keyboard only (see Focus).
  - Audit of 13 Oct 2026, the chip background before this change: decision step, answer sheet, Error analysis, Results weak topics, Ask AI answers and Review training all used `--surface-muted` #EFECE5, which is only 1.02:1 against the page #F3EEE9, so on the decision step (on the page itself) the chip looked as if it had no background; above quiz questions a blue category Tag #D4E8F0 "Guide S1" was used until earlier the same day (still so on the last deployed version). The Explain screen, Step by step card, Create training and topic cards show no Guide chip (topic cards show the plain text "Evacuation guide · S2"; Create training shows section code circles, not chips).
- Material tile: see "Material tile".
- Bottom navigation: a floating rounded bar, not attached to the screen edge. White pill-shaped bar, 1px `--border`, a very subtle shadow (it floats over content), 16px space at the sides and at least 12px below it (plus the safe area), on a flat `--bg` strip. Four items (Home, Materials, Progress, Profile), each with a simple line icon and a visible label, at least 44px high. Current item: a soft yellow pill (`--pastel-yellow`) behind icon and label, text in `--text` medium, `aria-current="page"`. Others in `--text-secondary`.
- Action bar: fixed at the bottom, `--bg` with a 1px `--border` on top, 16px padding, safe-area padding when it is the lowest element. Holds one primary pill button, full width. A disabled button explains why in one line above it (for example "Choose an answer to continue").
- Bottom sheet: opens from the bottom, up to 80% of the screen height, content scrolls inside. 24px radius on the top corners, `--surface` background, a scrim behind it. Has a title (section id and name), a close button of at least 44px, closes with the scrim, the Escape key and the close button. Traps focus while open and returns focus to the source chip on close. Opening animates briefly and not at all with reduced motion.
- Session lengths (Session setup): three SelectableCards (card size, radio), Short, Full and Extended, each with its coloured tag, decision count and estimated time.
- Segmented control: a full-width sand track (`--secondary-sand` with a 1px `--secondary-sand-pressed` stroke so it reads on the page, pill, 4px padding) with equal options of at least 44px. The selected option is an olive (`--primary`) pill with white text and medium weight, without any icon: selection is shown by the fill and by the native radio state (announced as checked), so the state does not rely on colour alone. Built from native radio buttons, so arrow keys move the selection and Tab enters and leaves the group. Focus: 2px `--accent` ring on the focused option.
- Tabs: underline tabs, a row of text labels at least 44px high on a 1px `--border` baseline. The selected tab has a 2px `--text` underline, medium weight and `--text`; the others `--text-secondary`. Optional count after the label in tabular numerals ("Failed (1)"). Arrow keys move between tabs, Home and End jump to the ends; the selected tab is the only one in the Tab order (`role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`).
- Checkbox card: like the option card, with a square check box (4px radius) instead of the radio circle; used for multiple choice and quiz sections.
- Section list (Create training and Session setup in quiz mode, one shared component): no outer container and no dividers. Each section is a SelectableCard (row size, check box), 8px between rows: a 36px round circle with the section number ("S1", small caption, `--text`, 12.56:1) in the one `--olive-tint` for every section (no per-section colours). The circle against the unselected row (`--card` #FAF7F3) is 1.30:1 and against the selected row (`--selected-tint` #F2F3EE with its darker stroke) 1.24:1: it is a quiet marker, and the number carries the meaning. the section title in body, optionally a grey "N questions" on the right, and the check box. The whole row toggles the section. All sections start selected, so the whole list shows the selected tint at first; the Select all / Deselect all toggle above it is unchanged.
- Quiz question: the same screen and data shape as a scenario step (see "Question model and session (v3)"): 3 or 4 options, one correct, no situation text. There are no multiple choice, ordering, short text or true-or-false screens.
- Quiz results: the same Results screen as a scenario.
- Ask AI entry points: only in the Answer review of a scenario step with prepared answers (the flood scenario has none): the "Ask AI about this step" text button, below Why. There is no Ask AI in a running session.
- Ask AI sheet: a bottom sheet like the source sheet (24px top corners, `--surface`, scrim, subtle overlay shadow, Escape and Close dismiss it, focus is trapped and returns to the button), 85% of the screen height so the conversation has room. From top to bottom:
  - Header: "Ask AI" (card title), the step title in 14 `--text-secondary`, a Close button of at least 44px.
  - A visible line in 14 `--text-secondary`: "Answers are simulated for this prototype."
  - The conversation, scrolling inside the sheet and kept to its end. Trainee messages are right-aligned bubbles: `--surface-muted`, 16px radius, 16 `--text`. AI messages use the tutor message style: plain left-aligned text in 16 `--text`, no bubble or avatar, with source chips ("Guide · S2") under every answer. The not-covered answer reads "This is not covered by the material." then "Closest sections in the guide:" and chips. Before feedback, a question that would reveal the answer gets "I can explain this after you check your answer, so the choice stays yours." with the step's source chips.
  - Typing indicator before each answer: three small `--text-secondary` dots that pulse, with the visually hidden text "AI is typing" announced politely; static dots with reduced motion. About 0.7 seconds.
  - Suggested question chips for the step (3 or 4, white pills like the suggested question). Before anything is asked, they fill the empty conversation area, stacked and wrapped in full so nothing is cut off, under a one-line intro. Once the trainee has sent a question, the remaining ones move to a single row that scrolls sideways above the text field, so the conversation gets the space (important with the on-screen keyboard open). A chip disappears once asked.
  - Input row: a text field (full pill, 1px `--border-strong` edge, 16px text so phones do not zoom, placeholder "Ask about this step") and an olive pill "Send" button, both at least 44px high. Send is disabled while the field is empty or an answer is typing.
  - With the on-screen keyboard open the sheet shrinks to the visible area so the input row stays above the keyboard.
- The conversation is kept per step while the session is open.
- Footer note: one line at the end of the Profile content only, in 14 `--text-secondary`: "AI behavior is simulated for this prototype. All feedback comes from the source guide." It is not shown on any other screen (also see "Session screens (v2)").
- Session results: see "Results screen (soft surface)" below.
- Tutor message: plain text, source chips inline, no avatar character. Used for AI answers in the Ask AI sheet.
- Progress: segmented dots or a thin bar with a numeric label. No hatched or decorative bars.
- Dropzone: dashed border on `--surface-muted`, 16px radius, one line of instruction, a "Choose a PDF" secondary button.
- Confirmation dialog (Exit session: Stay primary and Leave tertiary; Reset progress: confirm primary and Cancel tertiary): white card, 24px radius, title, one sentence, the buttons stacked and centred.

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

## Question model and session (v3, 16 Oct 2026; replaces Session screens v2, error types, confidence, explanations and the answer sheet)
Serious, institutional tone. Scenario and quiz are ONE pattern: a question with 3 or 4 options (two for true or false), one correct answer. The person either knows it or not, so the result of a question is only correct or incorrect. During a session nothing says which; all feedback is in Results and the Answer review.

Removed completely: the answer bottom sheet, the confidence question, the free-text explanation and its keyword check and verdicts, "Better explanation", "My explanation (or answer) is still correct" with Undo, the error types (Secure, Guess, Misconception, Knowledge gap), their chips, the Error types card, the Error types details and Error analysis pages, multiple choice, ordering and short text questions, and the content fields `explanationKeyBeats`, `explanationKeywords` and `referenceExplanation`. Any question that was not single choice is single choice now (ids kept). Where wording mentioned error types it is plain: "6 topics to repeat".

Shared data shape (scenario steps and quiz questions): `{ id, section, situation?, question, options[], correctOptionId, why, guideRef, image? }`. `section` is the guide section the item counts for (a step's first source); `guideRef` is the list of guide sections shown as Guide chips; `situation` exists on scenario steps only and `image` is `{ src, alt }`. A scenario step also keeps a short `title` for lists. One shared screen component draws both.

Flow. Choose an option, then Next (Finish on the last), disabled until an option is chosen. Answers are saved as they are given. At Finish the result is calculated from the final answers (the last choice for each question) and Results open.

Weak topics. A weak topic is a guide section where at least one answer was wrong, counted from the latest answer to each question. A repeat round brings back the questions answered wrong in the chosen sections.

Storage. Saved data is versioned (`schema` 2). A saved value of another version, or one that does not parse, is ignored: it reads as nothing and never crashes. Unfinished sessions (answers and the current step) are saved for the Home "continue" block.

Session screen (reference test layout, our colours). One shared QuestionScreen.
- Top row: the white circular Back (40px) on the left, "Question 3 of 10" centred (14, `--text-secondary`; "Step 3 of 6" for a scenario), the tertiary "Exit" on the right. Back goes to the previous question; on the first question it opens the Exit confirmation, like Exit.
- Step strip under it: a horizontal row of rounded squares, 32px with a 10px radius, holding the numbers, each in a 44px tap area. Current = `--primary` fill with a white number; answered = `--olive-tint` fill with a `--text` number; unanswered = a 1.5px `--secondary-sand-pressed` outline. It scrolls sideways without a visible scrollbar and keeps the current item in view. Every square jumps to its question; its accessible name is "Question 3, answered" ("not answered", "current"; "Step" for a scenario). Never a check or a cross.
- Content card (`--card`, 24px radius, 16px padding, card shadow): the media slot on top when the item has an `image` (4:3, see Media3D), the situation text (scenario only), the question in the item title style, "Choose one answer" in 14 `--text-secondary`, then the option rows: SelectableCard (row size) with a letter badge on the left (24px circle, `--olive-tint`, `--text` letter A, B, C, D) and the radio on the right. Selected = the existing green tint with the darker 1.5px stroke.
- Bottom: only the primary, full-width "Next" or "Finish", sticky above the bottom safe area, on `--bg` with a 1px `--border` top line. There is no Back button beside it.
- Back and jump show the stored choice filled in and editable; later questions keep their answers. Results use the final answers. Finish is disabled while another question is unanswered, with the hint "Answer question 2 to finish."
- Exit confirmation: title "Leave this session?", the line "Your answers are saved. You can continue from Home.", primary "Stay", tertiary "Leave". The same dialog opens from Back on the first question.
- The white circular Back (44px elsewhere) is also at the top left of every onboarding step (the first replay step leads to Home) and every sub-screen.

Media3D (one component, variants `hero`, `step` and `icon`; optional `src` and `alt`). Hero: 180 to 200px square, 28px radius, used on Session setup and Results. Step: full width, 4:3, 16px radius, used above a question whose JSON has an `image` field; with no `image` field nothing is drawn. Icon: the existing icon tile size; its fallback is the current flat icon on `--olive-tint`, unchanged. Placeholder (no `src`) for hero and step: `--olive-tint` #E0E6D6 fill, a 1.5px dashed #B9C4AC stroke, a centred outline image icon (28px, `--primary`) and the tiny caption "3D" (11px, `--text-secondary`). With `src`: hero uses `object-contain` on a transparent background, step uses `object-cover`; `alt` comes from the JSON (decorative placeholders are hidden from screen readers). Files live in `public/heroes/` (hero-passed.webp, hero-not-passed.webp, hero-setup.webp) and `public/scenarios/`. The /screens page has a "3D placeholders" section with every variant and state.

Toggle (shared). A switch: `role="switch"` with `aria-checked`, a 52 by 32px track (full radius, the one place a shape is fully round), a 24px white knob. On = `--primary` track; off = `--secondary-sand-pressed` track with a 1px `--border-strong` edge; disabled = `--secondary-sand` with a muted label. Label on the left, 44px tap area, focus ring on the track.

Session setup (v3, like the reference). Top row: the white circular Back (to the material), the centred title "Session setup" with the guide name under it in 14 `--text-secondary`, and a small ring badge on the right (40px, 3px stroke) with the share of the guide practised (the share of its questions answered at least once, e.g. "32%"; accessible name "32% of the guide practised"). Then the hero Media3D, the guide title centred in the page title style, the Scenario / Quiz segmented switch (radius 14px outer, 10px inner), the block "YOUR ANSWERS" (small uppercase label) with three columns, big numeral over a grey label: Questions, Correct, Incorrect (all answers to this guide's questions in the saved sessions; zeros when there are none). Then one settings card: "Length" as three SelectableCards 10 / 20 / 30 questions (the same for Scenario and Quiz); the toggle "Shuffle questions" (Quiz only; a scenario keeps the story order); the toggle "Only topics to repeat" (disabled with the hint "Nothing to repeat yet." when there are no weak topics; on, it limits the questions to the wrong answers' sections); and a chevron row "Guide sections · 10 selected" that opens the selection as its own screen (Back, "Deselect all" / "Select all", the section list, primary "Done"). Sticky primary "Start session".
- Length rules. Lengths offered are 10, 20 and 30 and are limited to what the selected sections hold: with fewer than 30 available the 30 option is hidden, with fewer than 20 the 20 option is hidden. Exception (documented): with fewer than 10 available there is ONE option, "All N". A scenario takes the first k situations of each section in story order (10 gives 1 per section, 20 gives 2, 30 gives 3; with fewer situations than sections it goes round the sections until the length is filled, and the chosen situations stay in story order); a quiz draws randomly from the selected sections, spread over them. "Only topics to repeat" first limits the sections to the weak ones.

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



}
```

Surface rules:
- Page `--soft-page`; cards `--soft-card`, 24px radius, 20px padding, `--soft-shadow`, no border; 16px between cards. Card titles use the card title style. Card subtitles 14 `--soft-text-secondary`.
- Small uppercase labels: 12, medium, letter-spacing 0.06em; on a tint they use that tint's ink.
- Circular back button (one shared component): a 44px white (`--surface`) circle with a very soft shadow and a 20px dark arrow-left icon, at the top left, no visible text. Its accessible name names the destination: "Back to materials" (material page), "Back to material" (Create training, Review, Session setup), "Back to Create training" (Generating, same as Cancel), "Back to results" (Error analysis), "Back to Home" (Weak topics, Results). It replaces every underlined "Back to …" text link. "Exit" in the session top bar and "Back to Home" at the bottom of Results stay. Focus: the usual 2px `--accent` ring.

Results screen (v3, 16 Oct 2026; no Outcome card, no Error types card, no Error types details). Single column on `--bg`, 16px side padding, 16px between blocks.
1. Top row: the white circular Back (to Home) and the centred title "Results".
2. Hero Media3D (passed and not-passed variants; the placeholder until the pictures exist).
3. Headline in the display style, centred: "Passed" or "Not passed yet". The pass mark is the one constant `PASS_MARK` in `lib/config.ts` (80). The result is the share of correct answers, rounded down: 79% is "Not passed yet", 80% is "Passed".
4. The percentage in the numeral style, large, centred.
5. A progress bar (12px, `--secondary-sand-pressed` track, `--primary` fill) with a 2px marker at the pass mark; under it the labels "0" on the left, "100" on the right and "PASS MARK: 80%" (small uppercase label) under the marker. Accessible name "Result 80%, pass mark 80%".
6. One conclusion sentence in body, `--text-secondary`: "Every answer was right." or "N answers need another look in the guide."
7. "Weak topics" card (`--card`, ArrowCircle in the top-right corner): the count ("3 topics to repeat"), the section tags (S3 · S6 as Guide-style chips) and the card opens the Weak topics page. Hidden when nothing is weak.
8. Bottom (sticky action bar), no "Your answers" list and no "Back to Home": the pair "Review answers" (secondary, opens the Answer review on the first question, also when the person passed) and "Repeat weak topics" (primary, shown only when there is something to repeat). The pair is a wrap-reverse flex row of two equal wrappers (`flex: 1 1 11.5rem`, 12px gap, both buttons with 16px side padding, 52px high, 14px radius, labels `white-space: nowrap`). When both fit on one line (container at least 380px, so a phone viewport of about 412px or wider) they sit in one row: Review answers on the left, Repeat weak topics on the right, equal width. Otherwise the row wraps by itself (CSS only, no measuring script) and the stacked fallback shows Repeat weak topics on top and Review answers below, both full width. Labels are never shortened and the font is never made smaller. At 360px the fallback applies: the two labels need 118px and 148px of text plus 32px padding each, 380px in all, against the 326px a 360px phone leaves after the 16px page padding and the 1px frame lines. When there is nothing to repeat, "Review answers" is a full-width secondary on its own (the documented exception).
9. The only way out of Results is the white circular Back at the top left, which goes Home.

Weak topics page (`/weak-topics`): the circular Back, the title "Weak topics", then ONE flat list of guide sections (no groups or headings by error type). Each row is a SelectableCard (row size, check box): the topic icon in the Media3D icon variant (36px, the existing flat icon fallback), the section name with its S-number, "n to repeat" in 14 `--text-secondary`. Sticky primary "Repeat selected (N)", disabled with N = 0. Empty state: "Nothing to repeat." A repeat round of the selected sections starts, and its Results come back to the same Results screen.

Answer review (`/session/results/review/[n]`, 1-based): the circular Back (to Results), "Question n of N" in 14 `--text-secondary`, then the review strip (the step strip with the squares marked: a correct question is a `--correct-bg` square with a small check, an incorrect one a `--wrong-bg` square with a small cross, both with the number; the current one has a 2px `--primary` outline; each square opens that question; accessible names "Question 3, correct" and "Question 3, incorrect"; this is the only place a verdict shows in a strip), the media slot, the situation (scenario only) and the question, then ALL options as rows with a letter badge: the correct option in `--correct-bg` tint with a check and the tag "Correct answer"; when the person chose a wrong option, that option in `--wrong-bg` tint with a cross and the tag "Your answer"; when the person was right, the correct option carries "Your answer" and a check; every other option neutral. Then "Why" (the guide text from the item) and the Guide chips, and for a scenario step the "Ask AI about this step" text button. No verdict line. Bottom: the primary "Back to results", the tertiary "Previous question" and "Next question" (hidden at the ends). It always opens on the first question from "Review answers", also when the person passed.

Sequence: Finish → Results → (A) Weak topics → choose topics → "Repeat selected" → repeat round → Results; (B) "Review answers" → Answer review from question 1 (Previous, Next or the strip) → Back to results.

## Onboarding screen
A first-run introduction, shown only on the first visit to Home. Strictly educational: no weapons, harm or combat language.

- Steps (the copy is fixed):
  1. Target icon. "Practise a decision". "You get a realistic situation and choose what to do."
  2. Document-with-check icon. "Answer, then check it". "Choose an answer for each question. At the end you check every answer against your source guide."
  3. Repeat icon (two arrows in a circle). "See what to repeat". "You see which topics had wrong answers, and repeat only those."
  - Final screen: "Ready to start?", the line "Upload a guide or try the sample materials." Primary button "Get started" (opens Home). On onboarding the global footer note is not shown again under the content; the final screen carries it.
- Layout: the warm greige page (`--bg`), no bottom navigation. A top row 44px high: the circular back button on the left (steps 2 and 3 and the final screen; accessible name "Previous step"), and on the right on steps 1 to 3 an underlined "Skip" text button (44px tap area). Below it one content block centred vertically in the space above the action bar, text left-aligned:
  - an 88px round icon tile in the Home "Next up" tile style (`--pastel-green`, a 40px outline icon in `--text`, 12.3:1), decorative;
  - 24px below, the overline "STEP 1 OF 3" in the label style, `--text-secondary`;
  - the headline in the display headline style, `--text`; it is the screen's one `h1`;
  - the body in the body style, `--text-secondary` (4.9:1 on `--bg`), at most two short sentences.
  The final screen has no icon tile and no overline.
- Action bar: on steps 1 to 3, the position dots centred above the button: three 8px dots 8px apart, the current one `--primary`, the others `--border-strong` (3.2:1 against the page); they are `aria-hidden` and a visually hidden "Step 2 of 3" stands for them. Then the full-width primary button: "Next" on steps 1 and 2, "Continue" on step 3, "Get started" on the final screen.
- No images, illustrations, leaves, mountains or gradients; no shadow other than the card shadow token on the back button.
- Motion: switching steps is instant (no slide), so it also respects reduced motion. Focus moves to the new headline when the step changes.
- Behaviour: Home opens onboarding until it has been finished or skipped once; "Skip" and "Get started" mark it done (the `onboarded` flag in the saved profile, `ast.profile.v1`) and open Home. Direct links to any other page are never redirected. When the browser cannot save, onboarding is shown again on the next visit and nothing breaks. "How it works" at the bottom of Home replays it; a replay changes no saved data.

## Home screen
Built from the Home target image of 12 Oct 2026; colours measured from it. Single column, 16px side padding, 32px between sections, on `--bg`. No gradient, no leaf shadow, no mountains or other graphics; the only decoration is the abstract SoftShape inside the Next up and New scenario cards (see "Decorative shapes"). Home has no action bar; the content keeps bottom padding above the floating navigation so nothing is hidden behind it.

- Eyebrow chip: the current direction name ("Building evacuation and first aid") as a chip in the same token and text style as the "SCENARIO" tag (`--pastel-yellow`, the tag label style, `--text`, pill, 4px 10px padding) but in sentence case as written; no line under it. It is a label, not a control: no pressed state, no focus ring, not in the Tab order. `--text` on `--pastel-yellow` 14.8:1.
- Headline: "Practise a decision. Check it against the guide." in the display headline style (the same semibold style as the Results headline), `--text`. Under it the sub-line "Small steps. Real progress." in 14 `--text-secondary`. One heading element.
- "Next up" card: `--next-card`, 28px radius, 16px padding, `--card-shadow`, with the "strong" SoftShape in its bottom-right corner behind the content. Top row: a 48px round `--pastel-green` tile with a target icon (24px, `--text`), then an uppercase label "NEXT UP" in `--text-secondary` (darkened from the image's 2.3:1 grey), the title in the item title style and a sub-line in 14 `--text-secondary`; the ArrowCircle (white, also on the sage card) in the card's top-right corner. Below, a full-width primary button. One state, the first that applies:
  - Unfinished session or repeat round: title "Continue your <session>" ("Continue your repeat round", "Continue your full session", "Continue your quiz"), sub-line "Item 1 of 2" ("Step 3 of 6", "Question 2 of 10"), button "Continue" (opens the session). No arrow.
  - Weak topics: "N topics to repeat" with the sub-line "Wrong answers in N guide sections.", button "Repeat weak topics" (starts the repeat round). The top row (tile, text and arrow) is one link to the Weak topics page.
  - No sessions yet: "Start your first scenario", sub-line "A short scenario takes about 5 minutes.", button "Start a scenario". No arrow.
  - Sessions but nothing weak: "Ready for a new scenario", "Nothing to repeat right now.", button "Start a scenario". No arrow.
  "Start a scenario" opens Session setup for the evacuation guide. There is no separate "Continue session" card.
- Topics (only when there are weak topics): only the heading "Topics" in the same section-title style as "New scenario" (item title, `--text`); no "See all". The Weak topics page stays one tap away through the arrow on the Next up card (weak topics state) and "See all" on Progress. Below, a horizontal scroll-snap row of topic cards, each 85% of the row width so the next one peeks in, 12px apart, at most 5.
  - Moving the row: touch swipe and trackpad scroll with scroll snap; mouse drag on desktop (it snaps to the nearest card when released); Left and Right arrow keys on a focused card move focus to the previous or next card and bring it into view. A swipe or drag never counts as a tap. With reduced motion the row jumps to a card instead of scrolling smoothly.
  - Topic card: `--card`, 24px radius, 20px padding, `--card-shadow`; the whole card is one button that starts the repeat for that topic only, or resumes it when that topic's repeat round is under way. Top row: the 48px round topic icon tile (tint from the section, see Icons) and the ArrowCircle in the card's top-right corner. No count pill and no progress bar: each card is one topic. Then the human topic name in the item title style, the source "Evacuation guide · S2" in 14 `--text-secondary`, and the error-type chip at the bottom (icon + label on one line, never wrapping).
- Pagination dots, centred 12px below the row: one 8px dot per card, 8px apart, the current one `--primary`, the others `--primary` at 25% opacity. The current dot follows the card in view (the last dot once the row is scrolled to its end). They only show position: not controls, `aria-hidden`, with a visually hidden "Card 2 of 3" that updates politely as the row scrolls. No dots for a single topic. The cards themselves are in the Tab order.
- New scenario: "New scenario" (item title), then one card per material with a prepared scenario (the evacuation guide; the flood guide once uploaded): `--card`, 24px radius, 20px padding, `--card-shadow`; a "SCENARIO" tag on `--pastel-yellow`, the scenario title in the item title style, the ArrowCircle in the top-right corner, and one line in 14 `--text-secondary` built from the scenario's Short length: "Short: 3 decisions, about 5 min." The "faint" SoftShape sits in the bottom-right corner, barely noticeable; no other graphics. The whole card opens Session setup for that material (Create training first, for an uploaded material whose training has not been created).
- "How it works": an underlined Tertiary button (44px tap area) at the end of Home's content that replays the onboarding.
- The floating bottom navigation stays, with the current item on the `--pastel-yellow` pill.
