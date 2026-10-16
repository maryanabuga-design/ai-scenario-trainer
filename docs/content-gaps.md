# Content gaps

The content model asks for 30 questions per topic and mode (never fewer than 20) where the source
guide supports it. Every fact must come from the guide text, so a topic whose guide section holds
only a few facts cannot reach 20 distinct questions without padding. This file lists those topics.
`lib/content-model.test.ts` reads the lines below: a topic that is `limited` or `pending` may have
fewer than 20 questions; any other topic fails the test below 20, and a `limited` count must match
the real count.

Line format: `- limited <topic> <mode>: <number of questions written>` (the guide cannot support 20)
or `- pending <topic> <mode>: <number>` (not expanded yet).

## Source of the limit

`content/sample-evacuation-guide.md` has 10 sections of 2 to 4 short bullet sentences each (about
30 sentences in all). The sentences are the only source of facts. Each one supports a few honest
questions (what to do, what not to do, a true or false check, one scenario decision); beyond that
the questions would repeat the same fact in other words, which the content rules forbid.

## S1 Responding to an alarm (piloted 17 Oct 2026)

The section has 4 bullets and 7 distinct statements: treat the alarm as real until officially
confirmed otherwise; stop non-essential tasks; take only what you can carry in a few seconds;
never delay your exit to collect belongings; no elevators during a fire, use the stairs; help
people who need assistance only if it is safe; otherwise report their location to responders.

- limited S1 scenario: 8
- limited S1 quiz: 9

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
