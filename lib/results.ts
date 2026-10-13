import type { ScoredItem } from "@/lib/scoring";
import { countErrorTypes } from "@/lib/scoring";

/** Which answers the Error analysis screen shows. */
export type AnalysisFilter = "all" | "correct" | "incorrect";

export function parseFilter(value: string | null): AnalysisFilter {
  return value === "correct" || value === "incorrect" ? value : "all";
}

/** Correct answers, or the rest (wrong and partly right), or all. */
export function filterItems(items: ScoredItem[], filter: AnalysisFilter): ScoredItem[] {
  if (filter === "all") return items;
  return items.filter((item) => (filter === "correct" ? item.correct : !item.correct));
}

export const analysisTitles: Record<AnalysisFilter, string> = {
  all: "Error analysis",
  correct: "Correct answers",
  incorrect: "Incorrect answers",
};

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
