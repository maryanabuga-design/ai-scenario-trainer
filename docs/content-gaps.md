# Content gaps

The content model asks for 30 questions per topic and mode (never fewer than 20) where the source
guide supports it. Every fact must come from the guide text, so a topic whose guide section holds
only a few facts cannot reach 20 distinct questions without padding. This file lists those topics.
`lib/content-model.test.ts` reads the lines below: a topic that is `limited` or `pending` may have
fewer than 20 questions; any other topic fails the test below 20, and a `limited` count must match
the real count.

Line format: `- limited <topic> <mode>: <number of questions written>` (the guide cannot support 20),
`- pending <topic> <mode>: <number>` (not expanded yet) or `- accepted <topic> <mode>: <number>`
(20 or more written, and 20 is accepted as the size for now; the test does not warn about it).

## Source of the limit

`content/sample-evacuation-guide.md` has 10 sections of 2 to 4 short bullet sentences each (about
30 sentences in all). The sentences are the only source of facts. Each one supports a few honest
questions (what to do, what not to do, a true or false check, one scenario decision); beyond that
the questions would repeat the same fact in other words, which the content rules forbid.

## S1 Responding to an alarm (extended with the demo extension, 17 Oct 2026)

S1 is no longer limited by the guide: the original section has 4 bullets, and the demo extension
(`s01-guide-extension.md`, see `docs/content-notes.md`) adds 7 subsections of general public
safety practice under it. S1 now has 20 scenario steps and 20 quiz questions (two parts of 10 in
each mode), above the minimum of 20 and below the target of 30. It is therefore not listed as
limited. 20 per mode is accepted as the size for S1 for now; 30 stays an optional stretch and is not
warned about. The extension is demo material, not an official procedure.

- accepted S1 scenario: 20
- accepted S1 quiz: 20

## Not expanded yet

The remaining evacuation topics are written after the S1 pilot is approved. Counts are the
current ones; their final shortfall is recorded here when each batch is done.

- pending S2 scenario: 3
- pending S2 quiz: 3
- pending S3 scenario: 0
- pending S3 quiz: 4
- pending S4 scenario: 2
- pending S4 quiz: 3
- pending S5 scenario: 2
- pending S5 quiz: 3
- pending S6 scenario: 1
- pending S6 quiz: 3
- pending S7 scenario: 0
- pending S7 quiz: 4
- pending S8 scenario: 0
- pending S8 quiz: 3
- pending S9 scenario: 0
- pending S9 quiz: 3
- pending S10 scenario: 0
- pending S10 quiz: 3

The flood guide (F1 to F7) is brought to the same structure after the evacuation topics.
