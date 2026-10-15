import type { Item } from "@/lib/items";

/** A fair shuffle (Fisher-Yates): every order is possible, none repeats an item. */
export function shuffled<T>(list: T[], random: () => number = Math.random): T[] {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

/** Draws `count` different questions at random from the pool, in a random order. */
export function drawQuestions(
  pool: Item[],
  count: number,
  random: () => number = Math.random,
): string[] {
  return shuffled(pool, random)
    .slice(0, count)
    .map((question) => question.id);
}

/** "N questions", or "1 question". */
export function questionCountLabel(count: number): string {
  return `${count} ${count === 1 ? "question" : "questions"}`;
}
