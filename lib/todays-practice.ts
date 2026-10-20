import { findItem } from "@/lib/items";
import type { Item } from "@/lib/items";
import { shuffled } from "@/lib/quiz-draw";
import type { FinishedSession } from "@/lib/session";

/** The length of today's practice (DESIGN.md: Today's practice). */
export const TODAY_COUNT = 5;
/** At most this many questions of one guide topic, while that still leaves enough questions. */
export const PER_TOPIC = 2;

/** The option chosen the last time each question was answered (the latest session wins). */
function latestChoices(history: FinishedSession[] | null): Map<string, string> {
  const latest = new Map<string, string>();
  for (const entry of [...(history ?? [])].sort((a, b) => a.finishedAt - b.finishedAt)) {
    for (const answer of entry.answers) latest.set(answer.itemId, answer.optionId);
  }
  return latest;
}

/**
 * The questions of today's practice: first those whose latest answer was wrong, then those never
 * answered, then the rest (each group in random order), at most PER_TOPIC from one topic while there
 * are enough other questions (a second pass without the limit fills any gap), and never the same
 * question twice. Pure: the random source is a parameter.
 */
export function pickTodays(
  pool: Item[],
  history: FinishedSession[] | null,
  random: () => number = Math.random,
  count: number = TODAY_COUNT,
): string[] {
  const latest = latestChoices(history);
  const wrong: Item[] = [];
  const fresh: Item[] = [];
  const rest: Item[] = [];
  for (const item of pool) {
    const choice = latest.get(item.id);
    if (choice === undefined) fresh.push(item);
    else if (choice !== item.correctOptionId) wrong.push(item);
    else rest.push(item);
  }
  const ordered = [
    ...shuffled(wrong, random),
    ...shuffled(fresh, random),
    ...shuffled(rest, random),
  ];
  const picked: Item[] = [];
  const perTopic = new Map<string, number>();
  for (const item of ordered) {
    if (picked.length >= count) break;
    if ((perTopic.get(item.section) ?? 0) >= PER_TOPIC) continue;
    picked.push(item);
    perTopic.set(item.section, (perTopic.get(item.section) ?? 0) + 1);
  }
  for (const item of ordered) {
    if (picked.length >= count) break;
    if (!picked.includes(item)) picked.push(item);
  }
  return picked.map((item) => item.id);
}

const sameLocalDay = (a: number, b: number) => {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
};

/**
 * Today's result: the latest finished "today" session of the device's local day, as a count, or null
 * (the card is in its start state). The next calendar day it is null again.
 */
export function todaysResult(
  history: FinishedSession[] | null,
  now: number,
): { correct: number; total: number } | null {
  const done = (history ?? [])
    .filter((entry) => entry.mode === "today" && sameLocalDay(entry.finishedAt, now))
    .sort((a, b) => b.finishedAt - a.finishedAt)[0];
  if (!done) return null;
  const correct = done.answers.filter(
    (answer) => findItem(answer.itemId)?.correctOptionId === answer.optionId,
  ).length;
  return { correct, total: done.itemIds.length };
}
