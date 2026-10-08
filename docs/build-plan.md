# Build plan

One commit per screen group, in this order. Steps 1 to 10 are built; the upload sequence in Materials (step 2) is still to come. Steps 2 to 6 were first built as a thin clickable path through the whole cycle. Each commit runs `npm run lint`, `npm run typecheck` and `npm run build`, and saves a screenshot in `docs/screens/`.

1. Foundation refresh: tokens, pill buttons, cards, tags, gradient helper, four-item bottom navigation, storage helper. (A temporary "Coming next" screen stood in for unbuilt sections and is now removed.)
2. Materials: list, material page, upload sequence.
3. Session setup: Short or Full. Confirm the Short story (steps 1 to 3) with the user before building.
4. Decision step: options, confidence, explanation, source sheet.
5. Feedback: verdict, error type, sources, consequence, key points, suggested question with the not-covered answer.
6. Results and repeat: summary, error analysis, weak topics, repeat; `scoring.ts`, `feedback.ts`, unit tests.
7. Home.
8. Progress.
9. Onboarding.
10. Profile.
11. README and final pass.

## Screen review page
`/screens` is a development-only page (404 in production, not linked from the navigation) that shows every planned screen at 390 by 844. Screens that are not built are dashed frames. Each screen commit replaces its frame with the real screen using sample data.
