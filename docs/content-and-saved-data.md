# Content changes and saved data

Progress is saved in the browser (`localStorage`, see DESIGN.md "Storage"). When the content changes
(questions replaced, removed or renumbered), saved data may refer to ids that no longer exist. This
note says what the app does about it and what to do when the content is changed again.

## What happens to old saved data

- Every saved value carries `schema` and a content fingerprint, a hash of the ids of all scenario
  steps and quiz questions. When the fingerprint differs from the current one, or is missing (data
  saved before schema 6), the value is cleaned as it is read.
- Cleaning drops unknown ids and keeps everything else: valid answers for ids that still exist stay.
  - Unfinished or finished session: dropped if any of its questions is unknown or none is left, so
    Home and Training never show a broken "Continue".
  - History (finished sessions, exams): unknown answers are removed; an entry with no valid answer
    left is dropped.
  - Part results: unknown ids are removed from the lists; a result with no known id is ignored.
  - Saved (bookmarked) questions: unknown ids are removed.
  - Exam in progress or last finished: dropped if any question is unknown.
- Lookups used for saved data (`findItem`, `scoreSession`) return nothing for an unknown id and never
  throw. The strict lookups (`getItem`, `getStep`, `getQuestion`) are for content that must exist.
- Data that cannot be read or cleaned (not JSON, the wrong shape, an unknown schema) reads as an
  empty state, so the app opens instead of crashing.

## When you change the content

- Keep the ids of questions that stay valid. A removed or renamed id simply disappears from saved
  progress; nothing needs to be migrated by hand.
- Part results are keyed by part id (`quiz:S1:2`). If a topic's questions change, a result whose
  questions are all gone is ignored and the part counts as not started.
- No version number has to be bumped for a content change: the fingerprint follows the ids.

## S1 pilot (17 Oct 2026)

The S1 steps and questions were replaced by 20 + 20 new ones (ids `q-scn-s01-*` and
`q-quiz-s01-*`). Browsers that still hold progress with the earlier ids (`s1`, `s7`, `q-s1-1` to
`q-s1-4` and the pilot items) are cleaned automatically.

20 questions per mode is the accepted size for S1 for now; 30 stays an optional stretch.
