# Final pass: width, keyboard and contrast

Checked on 8 October 2026 against `DESIGN.md` (WCAG AA, 44px targets, visible focus, 360px minimum width).

## 360px width
Every screen was loaded at 360px wide with saved sample data: onboarding, Home, Materials, the material page, Session setup, the decision step with all three parts open, feedback, results, Progress and Profile. No element extends past the screen edge and nothing scrolls sideways. Screenshots: `screens/13-width-360-*.png`.

## Keyboard
- Every control is reachable with Tab and shows the 2px indigo focus ring with a 2px offset, including the option cards and confidence pills (their radio inputs are visually hidden, so the ring is drawn on the card).
- Arrow keys move between options inside a group.
- The source sheet opens from a chip with Enter, moves focus inside, closes with Escape, and returns focus to the chip. The reset confirmation behaves the same way.

## Contrast
All text pairs used on the screens pass AA. Lowest values: `--correct` on `--correct-bg` 4.7:1, `--caution` on `--caution-bg` 5.2:1, secondary text on `--surface-muted` 5.8:1, secondary text on the peach gradient 4.4:1 (only used for headlines of 28px and larger, which need 3:1).

Fixed in this pass: the explanation field's only visible edge was `--border` (about 1.2:1). It now uses a new `--border-strong` token (3.6:1 on white, 3.2:1 on the page). Option cards and pills keep the light border because their radio circle or text label identifies them.
