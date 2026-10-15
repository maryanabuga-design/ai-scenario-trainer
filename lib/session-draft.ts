import { simulatedFeedback } from "@/lib/feedback";
import type { Question, Response } from "@/lib/quiz";
import type { Confidence, Step } from "@/lib/scenario";
import type { Answer, QuizAnswer } from "@/lib/session";

/** What is on a scenario step's screen: the choice, the confidence and the optional explanation. */
export type StepDraft = {
  optionId: string | null;
  confidence: Confidence | null;
  /** The person's own words; optional, empty means skipped. */
  explanation: string;
};

export const emptyStepDraft: StepDraft = {
  optionId: null,
  confidence: null,
  explanation: "",
};

/** A step can be left once an option and a confidence are chosen. The explanation never blocks. */
export function isStepComplete(draft: StepDraft) {
  return draft.optionId !== null && draft.confidence !== null;
}

/** The saved answer back on screen, for Back and the step strip. */
export function stepDraftFrom(answer?: Answer): StepDraft {
  if (!answer) return emptyStepDraft;
  return {
    optionId: answer.optionId,
    confidence: answer.confidence,
    explanation: answer.explanation,
  };
}

/**
 * The answer to save for a complete draft. The explanation is checked against the step's key
 * beats here, so every answer carries its verdict; it is only shown after Finish.
 */
export function stepAnswerFrom(step: Step, draft: StepDraft): Answer | null {
  if (!draft.optionId || !draft.confidence) return null;
  const explanation = draft.explanation.trim();
  return {
    stepId: step.id,
    optionId: draft.optionId,
    confidence: draft.confidence,
    explanation,
    ...(explanation ? {} : { skipped: true }),
    answerSource: explanation ? "typed" : "dont_know",
    explanationCheck: simulatedFeedback.checkExplanation(step, explanation),
  };
}

/** What is on a quiz question's screen. */
export type QuizDraft = {
  response: Response | null;
  confidence: Confidence | null;
  /** "I don't know" on a short text question: an empty answer that still counts as answered. */
  dontKnow?: boolean;
};

/** The starting draft: ordering questions start from the order they are listed in. */
export function emptyQuizDraft(question: Question): QuizDraft {
  return {
    response:
      question.type === "ordering"
        ? { type: "ordering", order: question.items.map((item) => item.id) }
        : null,
    confidence: null,
  };
}

/** A question can be left once it has an answer (an untouched ordering counts as its listed order). */
export function isQuizComplete(draft: QuizDraft) {
  const { response } = draft;
  if (draft.dontKnow) return true;
  if (!response) return false;
  if (response.type === "multiple") return response.optionIds.length > 0;
  if (response.type === "text") return response.text.trim().length > 0;
  return true;
}

export function quizDraftFrom(question: Question, answer?: QuizAnswer): QuizDraft {
  if (!answer) return emptyQuizDraft(question);
  return {
    response: answer.response,
    confidence: answer.confidence,
    ...(answer.dontKnow && { dontKnow: true }),
  };
}

export function quizAnswerFrom(question: Question, draft: QuizDraft): QuizAnswer | null {
  if (!isQuizComplete(draft)) return null;
  if (draft.dontKnow) {
    return {
      questionId: question.id,
      response: { type: "text", text: "" },
      confidence: null,
      dontKnow: true,
      answerSource: "dont_know",
    };
  }
  if (!draft.response) return null;
  return {
    questionId: question.id,
    response: draft.response,
    confidence: draft.confidence,
    answerSource: draft.response.type === "text" ? "typed" : "choice",
  };
}
