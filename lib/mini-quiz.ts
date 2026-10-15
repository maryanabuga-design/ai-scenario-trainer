import type { Item } from "@/lib/items";
import { modeItems, trainingSections } from "@/lib/parts";
import { drawQuestions } from "@/lib/quiz-draw";

/** The amounts the mini-quiz offers. */
export const MINI_QUIZ_AMOUNTS = [5, 10, 15] as const;

export type AmountOption = { value: number; label: string };

/** The guide sections the mini-quiz can draw from, in guide order. */
export const miniQuizSections = trainingSections;

/** The quiz questions of the selected topics: the pool a mini-quiz draws from. */
export function miniQuizPool(sections: string[]): Item[] {
  return modeItems("quiz").filter((question) => sections.includes(question.section));
}

/**
 * The amounts on offer for a pool: only 5, 10 and 15 that are not larger than the pool; below 5
 * there is one option, "All N"; a pool that is not exactly an amount gets no extra option; an empty
 * pool has none.
 */
export function amountOptions(pool: number): AmountOption[] {
  if (pool <= 0) return [];
  if (pool < MINI_QUIZ_AMOUNTS[0]) return [{ value: pool, label: `All ${pool}` }];
  return MINI_QUIZ_AMOUNTS.filter((amount) => amount <= pool).map((amount) => ({
    value: amount,
    label: String(amount),
  }));
}

/** Keeps the current amount while it is still offered, otherwise the largest one on offer. */
export function fitAmount(current: number | null, pool: number): number | null {
  const options = amountOptions(pool);
  if (options.length === 0) return null;
  if (current !== null && options.some((option) => option.value === current)) return current;
  return options[options.length - 1].value;
}

/** The questions of one mini-quiz: `count` different questions of the topics, in random order. */
export function drawMiniQuiz(
  sections: string[],
  count: number,
  random: () => number = Math.random,
): string[] {
  return drawQuestions(miniQuizPool(sections), count, random);
}
