import type { ContentImage, Item } from "@/lib/items";

/** One answered step or question, ready for results, weak topics and history. Only right or wrong. */
export type ScoredItem = {
  kind: "step" | "question";
  id: string;
  /** A short name: the step's title, or the question itself. */
  title: string;
  /** The situation (steps) and the question, in full. */
  prompt: string;
  image?: ContentImage;
  section: string;
  guideRef: string[];
  correct: boolean;
  chosenOptionId: string;
  correctOptionId: string;
};

/** Binary grading: the chosen option is the correct one, or it is not. */
export function scoreItem(item: Item, optionId: string): ScoredItem {
  return {
    kind: item.kind,
    id: item.id,
    title: item.title ?? item.question,
    prompt: item.situation ? `${item.situation} ${item.question}` : item.question,
    ...(item.image && { image: item.image }),
    section: item.section,
    guideRef: item.guideRef,
    correct: optionId === item.correctOptionId,
    chosenOptionId: optionId,
    correctOptionId: item.correctOptionId,
  };
}

export function correctCount(items: ScoredItem[]) {
  return items.filter((item) => item.correct).length;
}

/** Items to repeat: every answer that was wrong. */
export function weakItems(items: ScoredItem[]): ScoredItem[] {
  return items.filter((item) => !item.correct);
}

/** Guide sections with at least one wrong answer, without duplicates, in order of appearance. */
export function weakSections(items: ScoredItem[]): string[] {
  return [...new Set(weakItems(items).map((item) => item.section))];
}

/**
 * Weak items across the whole history: for each step or question the most recent answer counts,
 * so a later right answer clears it. Items must be in the order they were answered.
 */
export function currentWeakItems(items: ScoredItem[]): ScoredItem[] {
  const latest = new Map<string, ScoredItem>();
  items.forEach((item) => {
    latest.delete(item.id);
    latest.set(item.id, item);
  });
  return weakItems([...latest.values()]);
}
