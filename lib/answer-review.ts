import { explanationOutcome, simulatedFeedback } from "@/lib/feedback";
import { describeEffects } from "@/lib/outcome";
import {
  describeAnswer,
  describeResponse,
  getQuestion,
  scoreQuestion,
  scoreResponse,
} from "@/lib/quiz";
import type { Choice, Question, Response } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import type { ContentImage, Step } from "@/lib/scenario";
import { scoreStep } from "@/lib/scoring";
import type { ErrorType } from "@/lib/scoring";
import { answerFor, answerSource, sessionItems } from "@/lib/session";
import type { Answer, QuizAnswer, Session } from "@/lib/session";

/**
 * What the Answer review shows for one answer after Finish: the answers, the verdict on the typed
 * text, the why and, for a step, what happened.
 */

/** right: a check and a solid green outline; wrong: a cross; better: a check and a dashed outline. */
export type BoxTone = "right" | "wrong" | "better" | "partial" | "neutral";

export type AnswerBox = {
  tone: BoxTone;
  label: string;
  lines: string[];
  /** Ordering answers are numbered lists. */
  ordered?: boolean;
  /** "Your choice" or "Your answer": drawn as the Your choice block. */
  yours?: boolean;
};

export type ReviewResult = "correct" | "wrong" | "partial";

/**
 * "My explanation is still correct" (scenario) or "My answer is still correct" (short text):
 * available for typed text that missed the guide (whatever the option, for a scenario step),
 * marked once pressed (with Undo), otherwise none.
 */
export type Override = "none" | "available" | "marked";

/** The verdict line under typed text: "Matches the guide", "Doesn't match the guide yet". */
export type OpenVerdict = "matched" | "not_matched" | "marked";

/** The answer to the open question: the typed text and its verdict, or "I don't know". */
export type OpenAnswer = {
  label: "Your explanation" | "Your answer";
  /** Null after "I don't know" (or an empty explanation). */
  text: string | null;
  verdict: OpenVerdict | null;
};

export type StepReview = {
  kind: "step";
  verdict: "right" | "wrong";
  result: ReviewResult;
  errorType: ErrorType;
  /** "Your choice": the closed question. */
  boxes: AnswerBox[];
  open: OpenAnswer;
  /** "Better explanation", unless the option was right and the explanation matched. */
  better: AnswerBox | null;
  why: string[];
  sources: string[];
  whatHappened: string;
  stateChange: string[];
  override: Override;
};

export type QuestionVerdict = "right" | "partial" | "wrong" | "noMatch" | "marked" | "dontKnow";

export type QuestionReview = {
  kind: "question";
  verdict: QuestionVerdict;
  result: ReviewResult;
  /** Null without a confidence rating: then only the Result row is shown. */
  errorType: ErrorType | null;
  /** Choice questions: "Your answer" and "Correct answer". Short text uses open and better. */
  boxes: AnswerBox[];
  /** Short text only: the typed answer and its verdict. */
  open: OpenAnswer | null;
  /** Short text only: "Better answer", whenever the answer was not accepted. */
  better: AnswerBox | null;
  /** How many are right, for multiple choice and ordering ("2 of 3 right"). */
  detail: string | null;
  why: string[];
  sources: string[];
  override: Override;
};

export type ReviewContent = StepReview | QuestionReview;

/** The sheet after a scenario step. */
export function stepReview(step: Step, answer: Answer): StepReview {
  const feedback = simulatedFeedback.evaluate(step, answer);
  const outcome = explanationOutcome(step, answer);
  const scored = scoreStep(step, answer.optionId, answer.confidence, {
    explanation: outcome,
    markedCorrect: answer.markedCorrect,
  });
  // Any typed explanation that missed the guide can be defended, whatever the option: the check is
  // a simple keyword match and a right explanation can be worded differently.
  const canDefend = outcome === "not_matched" && answerSource(answer) === "typed";
  const marked = canDefend && answer.markedCorrect === true;
  return {
    kind: "step",
    verdict: feedback.correct ? "right" : "wrong",
    result: feedback.correct ? "correct" : "wrong",
    errorType: scored.errorType,
    boxes: [
      {
        tone: feedback.correct ? "right" : "wrong",
        label: "Your choice",
        lines: [feedback.chosen.text],
        yours: true,
      },
    ],
    open: {
      label: "Your explanation",
      text: outcome === "skipped" ? null : answer.explanation.trim(),
      verdict: outcome === "skipped" ? null : marked ? "marked" : outcome,
    },
    // The guide stays the source of truth: hidden only for a right choice explained as the guide does.
    better:
      feedback.correct && outcome === "matched"
        ? null
        : {
            tone: "better",
            label: "Better explanation",
            lines: [step.referenceExplanation],
          },
    why: feedback.correct ? [feedback.chosen.why] : [feedback.best.why],
    sources: feedback.sources,
    whatHappened: feedback.chosen.consequence,
    stateChange: describeEffects(step.id, feedback.chosen.effects ?? {}),
    override: !canDefend ? "none" : marked ? "marked" : "available",
  };
}

function texts(choices: Choice[], ids: string[]) {
  return ids.map((id) => choices.find((choice) => choice.id === id)?.text ?? id);
}

/** "N of M right", for the types with partial credit (multiple choice and ordering). */
function countDetail(question: Question, response: Response): string | null {
  if (question.type === "multiple" && response.type === "multiple") {
    const right = response.optionIds.filter((id) => question.answer.includes(id)).length;
    return `${right} of ${question.answer.length} right`;
  }
  if (question.type === "ordering" && response.type === "ordering") {
    const inPlace = question.answer.filter((id, index) => response.order[index] === id).length;
    return `${inPlace} of ${question.answer.length} right`;
  }
  return null;
}

function yourLines(question: Question, response: Response): string[] {
  if (question.type === "multiple" && response.type === "multiple") {
    return texts(question.options, response.optionIds);
  }
  if (question.type === "ordering" && response.type === "ordering") {
    return texts(question.items, response.order);
  }
  return [describeResponse(question, response) || "No answer"];
}

function correctLines(question: Question): string[] {
  if (question.type === "multiple") return texts(question.options, question.answer);
  if (question.type === "ordering") return texts(question.items, question.answer);
  return [describeAnswer(question)];
}

/** The sheet after a quiz question, for every question type. */
export function questionReview(question: Question, answer: QuizAnswer): QuestionReview {
  const { response } = answer;
  const text = question.type === "text";
  const dontKnow = text && answer.dontKnow === true;
  const checked = scoreResponse(question, response);
  const scored = scoreQuestion(question, response, answer.confidence, answer.markedCorrect);
  const verdict: QuestionVerdict = dontKnow
    ? "dontKnow"
    : scored.markedByYou
      ? "marked"
      : checked === 1
        ? "right"
        : text
          ? "noMatch"
          : checked > 0
            ? "partial"
            : "wrong";
  const ordered = question.type === "ordering";
  const yours = {
    label: "Your answer",
    lines: yourLines(question, response),
    ordered,
    yours: true,
  };
  const correct = {
    label: "Correct answer",
    lines: correctLines(question),
    ordered,
  };
  const boxes: AnswerBox[] = text
    ? []
    : verdict === "right"
      ? [{ ...yours, tone: "right" }]
      : [
          { ...yours, tone: verdict === "partial" ? "partial" : "wrong" },
          { ...correct, tone: "better" },
        ];
  const open: OpenAnswer | null = text
    ? {
        label: "Your answer",
        text: dontKnow ? null : yourLines(question, response)[0],
        verdict:
          verdict === "right"
            ? "matched"
            : verdict === "marked"
              ? "marked"
              : dontKnow
                ? null
                : "not_matched",
      }
    : null;
  const better: AnswerBox | null =
    text && verdict !== "right"
      ? {
          tone: "better",
          label: "Better answer",
          lines: correctLines(question),
        }
      : null;
  return {
    kind: "question",
    verdict,
    result: scored.correct ? "correct" : verdict === "partial" ? "partial" : "wrong",
    errorType: scored.hasConfidence ? scored.errorType : null,
    boxes,
    open,
    better,
    detail: countDetail(question, response),
    why: [question.why],
    sources: [question.section],
    // Only a typed short-text answer the check rejected can be marked correct.
    override:
      verdict === "marked"
        ? "marked"
        : verdict === "noMatch" && answerSource(answer) === "typed"
          ? "available"
          : "none",
  };
}

/** Everything the Answer review page shows for one step or question of a finished session. */
export type ReviewData = {
  /** 1-based position and the number of items. */
  position: number;
  total: number;
  /** A step has a title and a narrative before its question; a quiz question only the question. */
  title?: string;
  narrative?: string;
  question: string;
  image?: ContentImage;
  content: ReviewContent;
  /** Set for a scenario step, for the Ask AI link. */
  step?: Step;
};

export function reviewAt(session: Session, position: number): ReviewData | null {
  const items = sessionItems(session);
  const item = items[position - 1];
  const saved = item && answerFor(session, item);
  if (!saved) return null;
  const base = { position, total: items.length };
  if ("stepId" in saved) {
    const step = getStep(saved.stepId);
    return {
      ...base,
      title: step.title,
      narrative: step.narrative,
      question: step.question,
      image: step.image,
      content: stepReview(step, saved),
      step,
    };
  }
  const question = getQuestion(saved.questionId);
  return {
    ...base,
    question: question.question,
    image: question.image,
    content: questionReview(question, saved),
  };
}
