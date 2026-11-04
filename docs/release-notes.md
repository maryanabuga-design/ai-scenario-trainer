# Release notes: the responsive instructor

What changed since the version that is live now (build `205c4b5`; it includes everything up to the earlier release `07e1f60`). Written in plain words, for a designer.

## In one paragraph
The student side is the same phone app it was. The instructor now has two layouts: the phone layout below 1024 px, exactly as before, and a real desktop layout from 1024 px with a side navigation, tables, card grids and centred form cards. The desktop layer was built so that no phone screen changed (a pixel comparison of 45 screens proves it), and it was checked for accessibility with an automatic audit and a keyboard-only walkthrough. The web framework also got a security patch.

## Student side
- No visible change on any student screen. The student keeps the narrow phone column at every window width.
- Under the surface: the step strip centres the current number again when its width changes (needed for the framed preview), and page titles now carry the name of the page ("Materials · AI Scenario Trainer") for every role.
- The Next.js security patch (16.4.0 to 16.4.4) fixes three serious problems in the framework: two ways to run code on the server and one way to crash it. This prototype is barely exposed (no logins, no secrets, no uploads to a server), but the patch is small and safe.

## Instructor on the phone (below 1024 px)
- A student with no practice yet has one calm card, "No practice yet" ("Practice results will appear here once the student starts."), instead of ten identical "Not practised yet" rows. This is the one deliberate change to a phone screen.
- Small changes you cannot see: the student's name card and the closed exam's title card are plain text, not headings (so each page has one main heading); every confirmation dialog has its own id; the instructor's question screen has one main heading.

## The new desktop layout (instructor, from 1024 px)
- Shell: a white side navigation (Overview, Exams, Students, Content, your profile), a skip link, a content column of at most 1200 px, and no bottom bar.
- Page header: no coloured band. Back, title, subtitle and the page actions at the right (the pinned buttons of the phone move there), with a divider.
- Overview: a wide readiness card, "Needs your action" and "Exams" side by side (5/12 and 7/12), and the weakest topic below.
- Exams: a grid of exam cards (2 or 3 columns). Exam detail: a sticky info card on the left and the students as a table on the right.
- Students: a real table (Student, Status, Readiness, To review, Weak topic, Last active) with sorting, search and a status menu under the filter button, plus a Topics grid, a topic students table and a two-column student detail.
- Content: a topic card grid, import and analysing as centred cards with a footer, the topic screen with tabs and tables for Steps and Questions, narrow edit forms, the question-set review as a table, and Preview as student in a framed phone that holds its own bottom bar and sheets.
- Forms: Assign exam (sticky footer with a live summary such as "3 topics · 20 questions"), Extend deadline and Invite students are one centred card with the actions in its footer. The draft-review walk-through is a centred card with "1 of 10". Profile is one column of at most 720 px.
- Hover and focus: cards, rows, tabs, the side navigation and buttons all have a hover look; every control has the same visible focus ring; nothing works on hover only.

## Accessibility
- An automatic audit (axe) found no serious or critical problems on any instructor screen at desktop and phone width, nor in the open menus, dialogs and the preview.
- One banner, one navigation (labelled), one main area, a skip link first in the tab order, the current page marked, unique ids, and a real page title on every screen.
- A keyboard-only walkthrough of the main flows: logical order, no trap, a ring of at least 3:1 contrast on every stop, Escape closes menus and dialogs and returns focus.
- Reduced motion is respected; text enlargement and browser zoom do not break the layout.

## Tests and safety
- A pixel comparison of 45 screens at 360 and 430 px (zero differing pixels) guards every phone screen.
- A no-sideways-scroll check at twelve widths for every instructor route.
- Unit tests: 1664. Full end-to-end suite, accessibility audit, keyboard checks and a check with 200 students and very long names.
- Local and versioned storage only, no environment variables, no keys, no live AI; the content stays strictly educational.
- The repository now ignores the `.claude` folder in lint, unit tests and type checks, and the visual baseline no longer depends on the port the server runs on.

## What this means for a case study
- One rule made the whole thing safe: phone classes are never edited for desktop; every desktop rule is a separate class behind one switch at 1024 px.
- Every desktop screen reuses the same few building blocks: the table, the tab bar, the centred form card and the header actions.
