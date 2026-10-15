import type { Item, Option } from "@/lib/items";

export type Feedback = {
  correct: boolean;
  chosen: Option;
  best: Option;
  sources: string[];
};

/** The seam for a real provider later. This prototype only has the simulated one. */
export interface FeedbackProvider {
  evaluate(item: Item, optionId: string): Feedback;
}

/** Simulated: every word comes from the prepared content, which is built from the guide. */
export const simulatedFeedback: FeedbackProvider = {
  evaluate(item, optionId) {
    const chosen = item.options.find((option) => option.id === optionId);
    const best = item.options.find((option) => option.id === item.correctOptionId);
    if (!chosen || !best) throw new Error(`Item ${item.id} is missing an option`);
    return { correct: chosen.id === best.id, chosen, best, sources: item.guideRef };
  },
};
