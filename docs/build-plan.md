# Build plan

One commit per screen group, in this order. Steps 1 to 21 are built. Steps 2 to 6 were first built as a thin clickable path through the whole cycle. Each commit runs `npm run lint`, `npm run typecheck` and `npm run build`, and saves a screenshot in `docs/screens/`.

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
12. Ask AI chat (docs, data and matching with tests, sheet UI).
13. Materials with states and a simulated upload: content in `content/materials.json`, list states, upload sheet, material page details.
14. Session setup with mode, length and topic: Extended scenario (four new steps), Quiz mode with sections and question count.
15. Quiz: question bank in `content/quiz-bank.json`, scoring for five question types with tests, question and feedback screens, quiz results, and quiz answers in weak topics, Progress and Home.
16. Create training from a material: sample-file upload, Create training, simulated generation, Review, Scenario and Quiz tags, Start training into Session setup, reset in Profile. Built after the five screenshot fixes and before any extra quiz question types.
17. Second sample material (flood preparedness): load its guide, scenario and question bank through adapters (namespaced step and question ids, ordering items shuffled in a fixed way, keyword-count text answers), offer it in the upload flow, limit lengths to what each scenario has, and show each scenario's own situation outcome.
18. Weak topics redesign: repeat summary card and topic row on Home and Progress, a Weak topics page grouped by error type, and a repeat round that mixes steps and questions.
19. Cards and icons: no hover on cards (pressed state, focus ring and a chevron on tappable cards), Lucide outline icons everywhere, topic icon tiles coloured by material, and icons on the empty states.
20. The user is the judge: a separate Explain screen after the decision with a self-check of the key points (pre-checked by a keyword match, "You decide", or Skip), "N of M points" instead of a percentage, and short quiz answers shown next to the reference answer with "My answer is still correct".
21. Answer sheet: the feedback screens are replaced by a bottom sheet after every scenario step and quiz question (verdict, the right answer, a short why with sources, what happened, the self-check), the explanation and short answers are typed in an input docked above the keyboard with "I don't know", the AI follow-up question is gone, and the error type, the full why and the consequence timeline move to the final analysis on results.

## Screen review page
`/screens` is a development-only page (404 in production, not linked from the navigation) that shows every planned screen at 390 by 844. Screens that are not built are dashed frames. Each screen commit replaces its frame with the real screen using sample data.
