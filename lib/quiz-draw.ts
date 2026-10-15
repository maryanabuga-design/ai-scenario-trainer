import type { Item } from "@/lib/items";
import { inGuideOrder } from "@/lib/items";
import { questionsFor } from "@/lib/quiz";

/** A quiz draws at random: shuffled within each section, then taken in turns from each section. */
export function pickQuizItems(
  sections: string[],
  length: number,
  random: () => number = Math.random,
): string[] {
  const shuffle = <T>(list: T[]) =>
    list
      .map((item) => ({ item, key: random() }))
      .sort((a, b) => a.key - b.key)
      .map(({ item }) => item);
  const bySection = inGuideOrder(sections).map((section) => shuffle(questionsFor([section])));
  const picked: Item[] = [];
  for (
    let round = 0;
    picked.length < length && bySection.some((list) => list.length > round);
    round++
  ) {
    for (const list of bySection) {
      if (list[round] && picked.length < length) picked.push(list[round]);
    }
  }
  return picked.map((question) => question.id);
}

/** "N questions", or "1 question". */
export function questionCountLabel(count: number): string {
  return `${count} ${count === 1 ? "question" : "questions"}`;
}
