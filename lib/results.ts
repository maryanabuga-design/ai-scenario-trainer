import { PASS_MARK } from "@/lib/config";
import { correctCount } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";

/**
 * The percentage the Results screen shows: whole percent, rounded half up. 0% only when nothing was
 * right and 100% only when everything was (a share that would round to them shows 1% or 99%). It is
 * for display only: whether a result passes never depends on it (`isPassed`).
 */
export function displayPercent(items: ScoredItem[]): number {
  const total = items.length;
  if (total === 0) return 0;
  const correct = correctCount(items);
  if (correct === 0) return 0;
  if (correct === total) return 100;
  return Math.min(99, Math.max(1, Math.floor((correct * 100) / total + 0.5)));
}

/** The share of correct answers as a whole percent, rounded down so 79.6% is never a pass. */
export function resultPercent(items: ScoredItem[]): number {
  if (items.length === 0) return 0;
  return Math.floor((correctCount(items) / items.length) * 100 + 1e-9);
}

/** The fewest correct answers that pass: "8 of 10" at the 80% pass mark. */
export function passCount(total: number): number {
  return Math.max(0, Math.ceil((total * PASS_MARK) / 100 - 1e-9));
}

/** Passed when the real share of correct answers reaches the pass mark (no rounding involved). */
export function isPassed(items: ScoredItem[]): boolean {
  return items.length > 0 && correctCount(items) * 100 >= PASS_MARK * items.length;
}

/** One conclusion sentence for the Results screen. */
export function conclusion(items: ScoredItem[]): string {
  const wrong = items.length - correctCount(items);
  if (wrong === 0) return "Every answer was right.";
  return wrong === 1
    ? "1 answer needs another look in the guide."
    : `${wrong} answers need another look in the guide.`;
}
