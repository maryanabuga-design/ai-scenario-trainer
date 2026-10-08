import type { Confidence, Effects, Step } from "@/lib/scenario";

export type ErrorType = "secure" | "guess" | "knowledge_gap" | "misconception";

export const errorTypes: ErrorType[] = ["secure", "guess", "knowledge_gap", "misconception"];

/**
 * From the scenario's errorTypeRule: high confidence means level 3.
 * Confidence is optional in a quiz: without it, a right answer counts as secure and a wrong
 * or partly right one as a knowledge gap (a misconception needs stated high confidence).
 */
export function errorType(correct: boolean, confidence: Confidence | null): ErrorType {
  if (confidence === null) return correct ? "secure" : "knowledge_gap";
  const high = confidence === 3;
  if (correct) return high ? "secure" : "guess";
  return high ? "misconception" : "knowledge_gap";
}

/** One answered scenario step or quiz question, ready for results, weak topics and history. */
export type ScoredItem = {
  kind: "step" | "question";
  id: string;
  title: string;
  sources: string[];
  /** 0 to 1. Multiple choice and ordering can be partly right. */
  score: number;
  correct: boolean;
  errorType: ErrorType;
  effects: Effects;
  yourAnswer: string;
  correctAnswer: string;
};

export function scoreStep(step: Step, optionId: string, confidence: Confidence): ScoredItem {
  const option = step.options.find((candidate) => candidate.id === optionId);
  const best = step.options.find((candidate) => candidate.correct);
  if (!option || !best) throw new Error(`Step ${step.id} has no option ${optionId}`);
  return {
    kind: "step",
    id: step.id,
    title: step.title,
    sources: step.sources,
    score: option.correct ? 1 : 0,
    correct: option.correct,
    errorType: errorType(option.correct, confidence),
    effects: option.effects ?? {},
    yourAnswer: option.text,
    correctAnswer: best.text,
  };
}

/** Adds every chosen option's effects to the scenario's starting state, key by key. */
export function sumEffects(initial: Effects, items: ScoredItem[]): Effects {
  return items.reduce(
    (total, item) =>
      Object.fromEntries(
        Object.entries(total).map(([key, value]) => [key, value + (item.effects[key] ?? 0)]),
      ),
    initial,
  );
}

export function totalScore(items: ScoredItem[]) {
  return items.reduce((total, item) => total + item.score, 0);
}

export function countErrorTypes(items: ScoredItem[]): Record<ErrorType, number> {
  const counts: Record<ErrorType, number> = {
    secure: 0,
    guess: 0,
    knowledge_gap: 0,
    misconception: 0,
  };
  items.forEach((item) => counts[item.errorType]++);
  return counts;
}

/** Items to repeat: every answer that was wrong, partly right or guessed. */
export function weakItems(items: ScoredItem[]): ScoredItem[] {
  return items.filter((item) => item.errorType !== "secure");
}

/** Guide sections behind the weak items, without duplicates, in order of appearance. */
export function weakSections(items: ScoredItem[]): string[] {
  return [...new Set(weakItems(items).flatMap((item) => item.sources))];
}

/**
 * Weak items across the whole history: for each step or question the most recent answer counts,
 * so a later right-and-sure answer clears it. Items must be in the order they were answered.
 */
export function currentWeakItems(items: ScoredItem[]): ScoredItem[] {
  const latest = new Map<string, ScoredItem>();
  items.forEach((item) => {
    latest.delete(item.id);
    latest.set(item.id, item);
  });
  return weakItems([...latest.values()]);
}
