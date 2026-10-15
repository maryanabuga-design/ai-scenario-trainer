import type { FinishedSession } from "@/lib/session";

/** Questions to answer per local day. */
export const DAILY_GOAL = 5;

/** The current time, as a function so tests can pass a fake date instead. */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * The questions answered today: every answer of a finished session that ended on the same local
 * day as `now`. An unfinished session counts for nothing, and the count starts again at local midnight.
 */
export function questionsToday(history: FinishedSession[] | null, now: Date): number {
  return (history ?? [])
    .filter((session) => sameLocalDay(new Date(session.finishedAt), now))
    .reduce((sum, session) => sum + session.answers.length, 0);
}
