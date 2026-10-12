import { questionsFor, quizCounts } from "@/lib/quiz";

export type QuizAmount = {
  countChoice: (typeof quizCounts)[number] | "custom";
  customCount: number;
};

/** "1 question", "4 questions". */
export function questionCountLabel(count: number): string {
  return `${count} ${count === 1 ? "question" : "questions"}`;
}

/** How many questions the chosen guide sections hold together. */
export function availableQuestions(sections: string[]): number {
  return questionsFor(sections).length;
}

/** The live line under the section list. */
export function availableLine(sections: string[]): string {
  return `${questionCountLabel(availableQuestions(sections))} available in the selected sections`;
}

/** The fixed amounts; those larger than the available total are disabled. */
export function amountOptions(available: number) {
  return quizCounts.map((count) => ({ count, disabled: count > available }));
}

/** The Custom stepper never goes past the total (and never below 1). */
export function customCap(available: number): number {
  return Math.max(1, available);
}

/**
 * Keeps the chosen amount within the total: the smaller of the chosen amount and the total.
 * A fixed amount that no longer fits becomes a custom amount equal to the total, so the default
 * of 5 becomes the smaller of 5 and the total.
 */
export function fitAmount<T extends QuizAmount>(value: T, available: number): T {
  if (available === 0) return value;
  if (value.countChoice === "custom") {
    return { ...value, customCount: Math.min(Math.max(1, value.customCount), available) };
  }
  if (value.countChoice > available)
    return { ...value, countChoice: "custom", customCount: available };
  return value;
}

/** How many questions the quiz will have. */
export function quizAmount(value: QuizAmount, available: number): number {
  const wanted = value.countChoice === "custom" ? value.customCount : value.countChoice;
  return Math.min(wanted, available);
}

/** The amount that stands for a saved quiz size: a fixed amount when it is one, else custom. */
export function amountForSize(size: number): QuizAmount {
  const fixed = quizCounts.find((count) => count === size);
  return fixed
    ? { countChoice: fixed, customCount: size }
    : { countChoice: "custom", customCount: size };
}

/** The questions a quiz can draw on: the sections' questions, capped by a saved quiz size. */
export function availableWithCap(sections: string[], cap?: number): number {
  const available = availableQuestions(sections);
  return cap === undefined ? available : Math.min(available, cap);
}
