import type { Confidence, Effects, Step } from "@/lib/scenario";

export type ErrorType = "secure" | "guess" | "knowledge_gap" | "misconception";

export const errorTypes: ErrorType[] = ["secure", "guess", "knowledge_gap", "misconception"];

/** From the scenario's errorTypeRule: high confidence means level 3. */
export function errorType(correct: boolean, confidence: Confidence): ErrorType {
  const high = confidence === 3;
  if (correct) return high ? "secure" : "guess";
  return high ? "misconception" : "knowledge_gap";
}

export type ScoredAnswer = {
  step: Step;
  optionId: string;
  correct: boolean;
  errorType: ErrorType;
  effects: Effects;
};

export function scoreAnswer(step: Step, optionId: string, confidence: Confidence): ScoredAnswer {
  const option = step.options.find((candidate) => candidate.id === optionId);
  if (!option) throw new Error(`Step ${step.id} has no option ${optionId}`);
  return {
    step,
    optionId,
    correct: option.correct,
    errorType: errorType(option.correct, confidence),
    effects: option.effects ?? {},
  };
}

/** Adds every chosen option's effects to the scenario's starting state. */
export function sumEffects(initial: Required<Effects>, answers: ScoredAnswer[]): Required<Effects> {
  return answers.reduce(
    (total, answer) => ({
      timeLostSeconds: total.timeLostSeconds + (answer.effects.timeLostSeconds ?? 0),
      smokeLevel: total.smokeLevel + (answer.effects.smokeLevel ?? 0),
      casualtyStability: total.casualtyStability + (answer.effects.casualtyStability ?? 0),
    }),
    initial,
  );
}

export function countErrorTypes(answers: ScoredAnswer[]): Record<ErrorType, number> {
  const counts: Record<ErrorType, number> = {
    secure: 0,
    guess: 0,
    knowledge_gap: 0,
    misconception: 0,
  };
  answers.forEach((answer) => counts[answer.errorType]++);
  return counts;
}

/** Steps to repeat: every answer that was wrong or guessed. */
export function weakStepIds(answers: ScoredAnswer[]): string[] {
  return answers.filter((answer) => answer.errorType !== "secure").map((answer) => answer.step.id);
}

/** Guide sections behind the weak steps, without duplicates, in order of appearance. */
export function weakSections(answers: ScoredAnswer[]): string[] {
  const sections = answers
    .filter((answer) => answer.errorType !== "secure")
    .flatMap((answer) => answer.step.sources);
  return [...new Set(sections)];
}
