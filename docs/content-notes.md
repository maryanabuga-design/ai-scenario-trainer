# Content notes

Where content comes from and what was changed by hand. Counts live in `docs/content-gaps.md`.

## S1 demo extension (17 Oct 2026)

The evacuation guide section S1 ("Responding to an alarm") was extended with the demo material in
`s01-guide-extension.md` (provided by the product owner). It is added to
`content/sample-evacuation-guide.md` as `###` subsections under the existing S1 text, which is
unchanged and comes first:

1. Why every alarm is treated as real
2. The first seconds
3. What to take and what to leave
4. Stairs, not elevators
5. Helping other people
6. Instructions and announcements
7. Common mistakes

It is "demo training material based on widely accepted, general public safety practice" and not an
official procedure. The guide loader reads `###` lines as subsections (`GuideSection.subsections`)
and the source sheet shows them under the section's own lines.

Scenario steps and quiz questions of S1 were replaced by the owner's 20 steps (`q-scn-s01-001` to
`q-scn-s01-020`, four scenes) and 20 questions (`q-quiz-s01-001` to `q-quiz-s01-020`). The earlier
S1 items and the pilot items were dropped. Six of the steps have a one-sentence situation although
the content rules ask for two to four; they are listed as exceptions in
`lib/content-model.test.ts` and left unchanged. The steps came without prepared Ask AI answers; the
generic ones (what is happening, which part of the guide, why the other options are worse) were
generated from each step's own text.

## Steps details (18 Oct 2026)
`content/checklists.json` now gives every step a stable id, a short title and `details`. The titles
and the details of all 17 steps are "expanded from guide, to be replaced by authored step details":
each detail is a sentence of the corresponding guide topic (S1 to S8 and S10), copied or lightly
shortened, with no new facts, numbers or links. The guide has no source URLs, so no topic has a
`source` and the Source row stays hidden.

