import { PASS_MARK } from "@/lib/config";
import { correctCount } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";

/** The share of correct answers as a whole percent, rounded down so 79.6% is never a pass. */
export function resultPercent(items: ScoredItem[]): number {
  if (items.length === 0) return 0;
  return Math.floor((correctCount(items) / items.length) * 100 + 1e-9);
}

/** Passed at the pass mark or above. */
export function isPassed(items: ScoredItem[]): boolean {
  return resultPercent(items) >= PASS_MARK;
}

/** One conclusion sentence for the Results screen. */
export function conclusion(items: ScoredItem[]): string {
  const wrong = items.length - correctCount(items);
  if (wrong === 0) return "Every answer was right.";
  return wrong === 1
    ? "1 answer needs another look in the guide."
    : `${wrong} answers need another look in the guide.`;
}
