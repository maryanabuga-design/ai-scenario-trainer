import type { Item } from "@/lib/items";

/** Which of the two ways the questions are asked: the training modes give feedback, the exam never does. */
export type QuestionMode = "training" | "exam";

/**
 * How one answer option looks: `idle`, `selected` (before Check, and always in the exam), `correct`
 * (the chosen right option), `wrong` (the chosen wrong option) or `revealed-correct` (the right
 * option shown after a wrong choice).
 */
export type OptionState = "idle" | "selected" | "correct" | "wrong" | "revealed-correct";

/** The state of an option from the mode, the choice, whether the answer was checked and the item. */
export function optionState({
  mode,
  optionId,
  choice,
  checked,
  correctOptionId,
}: {
  mode: QuestionMode;
  optionId: string;
  choice: string | null;
  checked: boolean;
  correctOptionId: string;
}): OptionState {
  const chosen = choice === optionId;
  // The exam never reveals anything, and nothing is revealed before Check.
  if (mode === "exam" || !checked) return chosen ? "selected" : "idle";
  if (chosen) return optionId === correctOptionId ? "correct" : "wrong";
  return optionId === correctOptionId ? "revealed-correct" : "idle";
}

/** The binary result of Check: right when the chosen option is the correct one. */
export function checkResult(
  item: Item,
  choice: string,
): { correct: boolean; correctOptionId: string } {
  return { correct: choice === item.correctOptionId, correctOptionId: item.correctOptionId };
}

/** The text a screen reader hears after Check. */
export function checkAnnouncement(item: Item, choice: string): string {
  if (choice === item.correctOptionId) return "Correct";
  const right = item.options.find((option) => option.id === item.correctOptionId)?.text ?? "";
  return `Not quite. The correct answer is: ${right}`;
}
