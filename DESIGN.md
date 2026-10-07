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
5. AI shows itself through behavior (a follow-up question, a source citation, stated uncertainty), not through sparkles or orbs.
6. Readable under stress: large targets, short copy, one primary action per screen.

## Color tokens (proposal)
```css
:root {
  --bg: #F4F1EC;            /* warm off-white page background */
  --surface: #FFFFFF;       /* cards, inputs, sheets */
  --surface-muted: #EFECE5; /* inner panels, dropzone, current nav item */
  --border: #E2DED5;
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
- Onboarding, Session setup, the scenario session and Session results are opened from other screens. They have no navigation item and no bottom navigation; they show a "Back" text button at the top left (or "Exit" during a session, with a confirmation).
- Primary action: a fixed bar at the bottom of the screen with one black pill button. On the four sections it sits above the bottom navigation; elsewhere it sits at the bottom. Scrolling content gets bottom padding so nothing hides behind the bar.
- During a session: a top bar with "Exit", the scenario title and the step count ("2 of 6") with progress dots.
- Sources: the source panel is a bottom sheet opened from a source chip.

## Screen map
From `docs/mvp-matrix-and-ia.md`.
- Onboarding (first visit only, can be skipped): Choose direction → How it works → Example scenario.
  - Choose direction: "Building evacuation and first aid" is the only selectable direction. "Road incident first aid", "Flood preparedness" and "Crisis communication" are listed as disabled with "Not available in this prototype".
  - Example scenario: a preview of the sample scenario with "Try it", which opens Session setup.
- Home: Continue session (if one is unfinished) · Weak topics · New scenario.
- Materials: Materials list · Upload PDF · Material page.
  - Upload PDF is a screen sequence: choose a file (the file is not read or sent anywhere) → processing → the material page of the sample guide, with a plain note that this prototype uses a prepared scenario.
- Progress: Weak topics · Session history.
- Profile: Direction (change it) · Settings: "Reset progress" with a confirmation.
- Session setup: length selector, "Short, 3 decisions, about 5 min" (steps 1 to 3) or "Full, 6 decisions, about 10 min". Times are always labelled as estimates ("about").
- Scenario session: Situation and decision → Confidence check → Explanation and AI follow-up → Feedback with consequence → next step. Source sheet available throughout.
- Session results: Summary → Error analysis with sources → Repeat weak topics (replays the wrong or guessed steps).

## Components and states
Every component needs: default, hover, focus-visible, active, disabled. Inputs also need error.
- Button: primary (black pill, white text), secondary (white pill, 1px `--text` border), text (no fill, `--text`, underline on hover). Minimum height 48px for primary, 44px for the others.
- Card: white, 24px radius, 16 or 24px padding, no border on the page background.
- Tag: small uppercase label, 12, letter-spacing 0.04em, medium weight, `--text` on a `--tag-*` pastel, pill shape, 4px 10px padding. For categories such as "SCENARIO", "MATERIAL", "SHORT", "S2". Never for status.
- Option (answer choice): white, 16px radius, 1px `--border`, a radio circle on the right. Selected: 2px `--primary` border and a filled black radio. Locked after submit: unselected options fade to `--text-secondary`. Correct and wrong: status badge with icon and label, plus the matching status border. Never colour alone.
- Confidence selector: three labelled pills (not very / somewhat / very confident). Selected is the black pill. No traffic-light colors.
- Practice step (progressive reveal): options first. After an option is chosen, show the confidence selector. After a confidence level is chosen, show the explanation field. Submit is enabled only when all three are filled. Once submitted, everything locks.
- Feedback block: two-tone headline, then verdict (icon + label) → your answer vs the correct answer → why → error type (knowledge gap / misconception / guess / secure) → source link.
  - Primary block (white card): verdict, your answer vs correct, why and error type.
  - Secondary blocks below, separated by 32px: consequence, then "Points a strong answer covers" next to the user's own sentence, then the AI follow-up. Secondary blocks use the 14 secondary scale in `--text-secondary`. Hierarchy comes from type and spacing, not colour.
  - The user's explanation is never graded. Show it unchanged next to the key beats and label the key beats as a reference list, not a score.
  - Not covered by the material: under the smoke step's feedback, an "Ask about this step" block with one tappable suggested question that the guide does not answer. The trainee taps it; the AI never asks it on its own. The answer says "This is not covered by the material." and then "Closest sections in the guide:" with source chips. Neutral style, no warning colour.
- Explanation field: multi-line text input, 3 rows, 16px radius, label is the step's follow-up question, optional counter in 14 `--text-secondary`. States: default, hover, focus-visible, disabled (locked after submit), error. Error: 1px `--wrong` border, an icon and a text message below (for example "Write one sentence before you submit."). Never colour alone.
- Status badge: icon + label + colour, used for the error type and the verdict. Labels in sentence case.
  - Secure: check icon, `--correct` on `--correct-bg`.
  - Guess: question-mark icon, neutral outlined badge: `--text-secondary` on `--surface-muted`, 1px `--border`.
  - Knowledge gap: minus icon, `--caution` on `--caution-bg` (the only badge that uses amber).
  - Misconception: cross icon, `--wrong` on `--wrong-bg`.
  - Shape: pill, 12 label size, 4px 10px padding. Each type has a one-line description beside it, for example "Wrong answer, high confidence".
- Result row (results summary): an inner panel with an icon box (check or cross in a 40px rounded square with the status colour), a label such as "4 correct" and a count. Icon + label + colour.
- Source chip: shows "Guide · S2" (document name + section id; the guide has no page numbers). Pill, white with 1px `--border`. Opens that section in the bottom sheet.
- Material cover: gradient square, see "Gradients".
- Bottom navigation: a floating rounded bar, not attached to the screen edge. White pill-shaped bar, 1px `--border`, a very subtle shadow (it floats over content), 16px space at the sides and at least 12px below it (plus the safe area), on a flat `--bg` strip. Four items (Home, Materials, Progress, Profile), each with a simple line icon and a visible label, at least 44px high. Current item: a soft yellow pill (`--tag-yellow`) behind icon and label, text in `--text` medium, `aria-current="page"`. Others in `--text-secondary`.
- Action bar: fixed at the bottom, `--bg` with a 1px `--border` on top, 16px padding, safe-area padding when it is the lowest element. Holds one primary pill button, full width. A disabled button explains why in one line above it (for example "Choose an answer to continue").
- Bottom sheet: opens from the bottom, up to 80% of the screen height, content scrolls inside. 24px radius on the top corners, `--surface` background, a scrim behind it. Has a title (section id and name), a close button of at least 44px, closes with the scrim, the Escape key and the close button. Traps focus while open and returns focus to the source chip on close. Opening animates briefly and not at all with reduced motion.
- Segmented length selector (Session setup): two large option cards, Short and Full, with decision count and estimated time. Selected uses the option selected style.
- Suggested question: a white pill with 1px `--border`, the question text in 14 `--text`, at least 44px high. Once tapped it shows the answer below it as a tutor message and cannot be tapped again.
- Coming next: placeholder for a navigation section that is not built yet. Page title (serif), one line "This section is coming in a later version of the prototype." and a secondary button "Go to Materials". Bottom navigation stays visible. Removed section by section as the real screens land.
- Footer note: one line at the end of the content on every screen, above the bottom navigation or action bar, in 14 `--text-secondary`: "AI behavior is simulated for this prototype. All feedback comes from the source guide."
- Session results: two-tone headline on a gradient header → result rows (correct, wrong) → error-type breakdown (four rows, badge + count) → situation outcome (time lost, smoke level, casualty stability as plain label/value rows, no charts) → error analysis per step with source chips → weak topics → primary action "Repeat weak topics", secondary "Back to Home".
- Tutor message: plain text, source chips inline, no avatar character.
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
