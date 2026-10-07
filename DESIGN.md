# DESIGN.md — AI Scenario Trainer (MVP)

Status: draft v0. Values marked (proposal) are open for change. Update this file first, then the code.

## Product and audience
- Product: AI-powered scenario-based training. The Trainee uploads their own material and practises decisions in scenarios, then gets feedback and error analysis.
- Context: educational only. Emergency-response and civil-protection training. No weapons, harm or combat content.
- Platform (assumption): desktop-first web app, responsive down to 360px. On narrow screens the side panels collapse.

## Principles
1. Calm, serious, utilitarian minimalism. Trust matters more than delight.
2. Hierarchy comes from type, spacing and contrast, not from color.
3. One accent color. Semantic colors only for status, always paired with an icon and a text label.
4. No gradients, glows, mascots, emoji, 3D icons or decorative illustration.
5. AI shows itself through behavior (a follow-up question, a source citation, stated uncertainty), not through sparkles or orbs.
6. Readable under stress: large targets, short copy, one primary action per screen.

## Color tokens (proposal)
```css
:root {
  --bg: #F7F5F0;            /* warm off-white page background */
  --surface: #FFFFFF;       /* cards, inputs */
  --surface-muted: #EFECE5; /* secondary areas, dropzone */
  --border: #E2DED5;
  --text: #1A1A1A;
  --text-secondary: #5C5A55; /* 6.4:1 on --bg */
  --primary: #1A1A1A;        /* primary buttons, white text */
  --primary-text: #FFFFFF;
  --accent: #3D3A8C;         /* links, focus, selected state, 9:1 on white */
  --correct: #1F7A4D;        /* 5.3:1 on white */
  --wrong: #B3261E;          /* 6.5:1 on white */
  --caution: #8A5A00;        /* 5.9:1 on white */
  --correct-bg: #E8F3EC;
  --wrong-bg: #FBEAE8;
  --caution-bg: #F8EFD9;
}
```
Rules:
- Accent must not be green or red (those carry meaning).
- Status = icon + label + color. Never color alone.
- Dark theme is out of scope for the MVP.

## Typography (proposal)
- UI: Inter, system sans fallback.
- Reading text and page titles: a serif (for example Source Serif 4) for scenario narrative and headings. This gives the editorial calm of a document.
- Scale: 12 (minimum, labels only) / 14 (secondary) / 16 (body) / 18 (lead) / 22 / 28 (headings). Body line-height 1.6.
- Use tabular numerals for scores and progress.

## Spacing, shape, depth
- Spacing scale (4px base): 4, 8, 12, 16, 24, 32, 48.
- Radius: 8px controls, 12px cards. Borders 1px `--border`.
- No shadows except a subtle one on overlays (popovers, dialogs).

## Layout
- Desktop: left navigation (narrow), central work area (scenario or document), right panel (tutor and sources). Right panel collapses to a drawer below 1024px.
- The MVP navigation has two items: Library and Practice. Mistakes and Progress are out of scope.
- Content width for reading: 680px maximum.

## Components and states
Every component needs: default, hover, focus-visible, active, disabled. Inputs also need error.
- Button: primary (dark), secondary (outline), text. Minimum height 44px.
- Option (answer choice): default, selected, locked after submit, correct, wrong.
- Confidence selector: three labelled levels (not very / somewhat / very confident), one accent, no traffic-light colors.
- Practice step (progressive reveal): options first. After an option is chosen, show the confidence selector. After a confidence level is chosen, show the explanation field. Submit is enabled only when all three are filled. Once submitted, everything locks.
- Feedback block: verdict (icon + label) → your answer vs the correct answer → why → error type (knowledge gap / misconception / guess / secure) → source link.
  - Primary block: verdict, your answer vs correct, why and error type. Body size, with the verdict as a 22 heading.
  - Secondary blocks below, separated by 32px spacing and a 1px `--border` rule: consequence, then "Points a strong answer covers" next to the user's own sentence. Secondary blocks use the 14 secondary scale in `--text-secondary`. Hierarchy comes from type and spacing, not colour.
  - The user's explanation is never graded. Show it unchanged next to the key beats and label the key beats as a reference list, not a score.
- Explanation field: multi-line text input, 3 rows, label is the step's follow-up question, optional counter in 14 `--text-secondary`. States: default, hover, focus-visible, disabled (locked after submit), error. Error: 1px `--wrong` border, an icon and a text message below (for example "Write one sentence before you submit."). Never colour alone.
- Status badge: icon + label + colour, used for the error type. Labels in sentence case.
  - Secure: check icon, `--correct` on `--correct-bg`.
  - Guess: question-mark icon, `--caution` on `--caution-bg`.
  - Knowledge gap: minus icon, `--caution` on `--caution-bg`.
  - Misconception: cross icon, `--wrong` on `--wrong-bg`.
  - Shape: 8px radius, 12 label size, 4px 8px padding. Each type has a one-line description beside it, for example "Wrong answer, high confidence".
- Source chip: shows "Guide · S2" (document name + section id; the guide has no page numbers). Opens that section in the side panel.
- Footer note: one line on every screen in 14 `--text-secondary`: "AI behavior is simulated for this prototype. All feedback comes from the source guide."
- Session summary: single column, 680px maximum. Order: score ("4 of 6 correct", tabular numerals) → error-type breakdown (four rows, badge + count) → situation outcome (time lost, smoke level, casualty stability as plain label/value rows, no charts) → weak topics (each a source chip with the section title, listed for wrong or guessed steps) → primary action "Practise again". Situation outcome is shown here only, not during play.
- Tutor message: plain text, source chips inline, no avatar character.
- Progress: simple bar or segmented dots with numeric label. No hatched or decorative bars.
- Dropzone: dashed border on `--surface-muted`, one line of instruction, alternative actions below.

## Content and tone
- Calm, direct, sentence case. No emoji, no exclamation marks, no jokes.
- Short labels. Say what happened and what to do next.
- AI states uncertainty plainly and always points to the source passage.

## Accessibility
- WCAG AA: 4.5:1 text, 3:1 for large text and UI boundaries.
- Visible focus ring: 2px `--accent`, 2px offset.
- Everything operable by keyboard. Respect `prefers-reduced-motion`.
- Minimum touch target 44×44px.

## Do / Don't
- Do: use whitespace and type size to create hierarchy.
- Do: show the source next to every AI claim.
- Don't: use identical cards without hierarchy, random gradients or decorative icons.
- Don't: celebrate with confetti or mascots; use a neutral confirmation instead.
