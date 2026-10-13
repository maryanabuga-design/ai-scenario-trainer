import { errorType } from "@/lib/scoring";
import type { ErrorType } from "@/lib/scoring";
import type { Confidence, Option, Step } from "@/lib/scenario";
import type { Answer } from "@/lib/session";

export type Feedback = {
  correct: boolean;
  chosen: Option;
  best: Option;
  errorType: ErrorType;
  sources: string[];
};

/** How a typed explanation compares with the guide: saved with the answer. */
export type ExplanationCheck = "matched" | "not_matched" | "skipped";

/** The seam for a real AI provider later. This prototype only has the simulated one. */
export interface FeedbackProvider {
  evaluate(step: Step, answer: { optionId: string; confidence: Confidence }): Feedback;
  /** Does the typed explanation of the open question match the guide? */
  checkExplanation(step: Step, text: string): ExplanationCheck;
}

/** Lowercase words without punctuation; apostrophes are dropped, so "don't" is "dont". */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/** At least 3 words and one word starting with a keyword of at least one key beat. */
function matchesKeyBeats(step: Step, text: string): boolean {
  const typed = words(text);
  if (typed.length < 3) return false;
  const padded = ` ${typed.join(" ")}`;
  return step.explanationKeywords.some((entry) =>
    entry.keywords.some((keyword) => padded.includes(` ${words(keyword).join(" ")}`)),
  );
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
    };
  },
  checkExplanation(step, text) {
    if (words(text).length === 0) return "skipped";
    return matchesKeyBeats(step, text) ? "matched" : "not_matched";
  },
};

/** The saved outcome, or for answers saved before it existed, the check run again. */
export function explanationOutcome(step: Step, answer: Answer): ExplanationCheck {
  if (answer.explanationCheck) return answer.explanationCheck;
  if (answer.skipped) return "skipped";
  return simulatedFeedback.checkExplanation(step, answer.explanation);
}
