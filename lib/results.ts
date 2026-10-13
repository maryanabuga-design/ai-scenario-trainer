import type { ScoredItem } from "@/lib/scoring";
import { countErrorTypes } from "@/lib/scoring";

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
