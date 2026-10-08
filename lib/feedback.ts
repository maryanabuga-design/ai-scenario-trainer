import { errorType } from "@/lib/scoring";
import type { ErrorType } from "@/lib/scoring";
import type { Confidence, Option, Step } from "@/lib/scenario";

export type Feedback = {
  correct: boolean;
  chosen: Option;
  best: Option;
  errorType: ErrorType;
  sources: string[];
  followUp: string;
  keyBeats: string[];
};

/** The seam for a real AI provider later. This prototype only has the simulated one. */
export interface FeedbackProvider {
  evaluate(step: Step, answer: { optionId: string; confidence: Confidence }): Feedback;
}

/** Simulated AI: every word comes from the prepared scenario, which is built from the guide. */
export const simulatedFeedback: FeedbackProvider = {
  evaluate(step, answer) {
    const chosen = step.options.find((option) => option.id === answer.optionId);
    const best = step.options.find((option) => option.correct);
    if (!chosen || !best) throw new Error(`Step ${step.id} is missing an option`);
    return {
      correct: chosen.correct,
      chosen,
      best,
      errorType: errorType(chosen.correct, answer.confidence),
      sources: step.sources,
      followUp: step.followUp,
      keyBeats: step.explanationKeyBeats,
    };
  },
};
