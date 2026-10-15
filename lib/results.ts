import { PASS_MARK } from "@/lib/config";
import type { ScoredItem } from "@/lib/scoring";
import { countErrorTypes, totalScore } from "@/lib/scoring";

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/** One conclusion for the progress card: the first rule that matches. */
export function conclusion(items: ScoredItem[]): string {
  const counts = countErrorTypes(items);
  const { misconception, knowledge_gap: gap, guess } = counts;
  if (misconception > 0) {
    return `You were sure, but ${misconception} ${plural(misconception, "answer", "answers")} did not match the guide.`;
  }
  if (gap > 0) {
    return `${gap} ${plural(gap, "answer needs", "answers need")} another look in the guide.`;
  }
  if (guess > 0) {
    return guess === 1
      ? "1 right answer was a guess. Repeat it to be sure."
      : `${guess} right answers were guesses. Repeat them to be sure.`;
  }
  return "Every answer was right and confident.";
}

/** The points scored as a whole percent, rounded down so 79.6% is never shown as a pass. */
export function resultPercent(items: ScoredItem[]): number {
  if (items.length === 0) return 0;
  return Math.floor((totalScore(items) / items.length) * 100 + 1e-9);
}

/** Passed at the pass mark or above. */
export function isPassed(items: ScoredItem[]): boolean {
  return resultPercent(items) >= PASS_MARK;
}
