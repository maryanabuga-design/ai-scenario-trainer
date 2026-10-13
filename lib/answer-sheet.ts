import { simulatedFeedback } from "@/lib/feedback";
import { describeEffects } from "@/lib/outcome";
import { describeAnswer, describeResponse, scoreQuestion, scoreResponse } from "@/lib/quiz";
import type { Choice, Question, Response } from "@/lib/quiz";
import type { Step } from "@/lib/scenario";
import { errorType } from "@/lib/scoring";
import type { ErrorType } from "@/lib/scoring";
import { answerSource } from "@/lib/session";
import type { Answer, QuizAnswer } from "@/lib/session";

/**
 * What the answer sheet shows right after an answer: the result and error type as status rows,
 * the answers, the why and, for a step, what happened. Never a percentage, points or a score.
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

export type SheetResult = "correct" | "wrong" | "partial";

/**
 * "My answer is still correct": available after a wrong, partly right or rejected answer,
 * marked once pressed (with Undo), none after a right answer or "I don't know".
 */
export type Override = "none" | "available" | "marked";

export type StepSheet = {
  kind: "step";
  verdict: "right" | "wrong";
  result: SheetResult;
  errorType: ErrorType;
  boxes: AnswerBox[];
  why: string[];
  sources: string[];
  /** The user's own sentence, shown as a reflection next to the why; null after "I don't know". */
  explanation: string | null;
  whatHappened: string;
  stateChange: string[];
  override: Override;
};

export type QuestionVerdict = "right" | "partial" | "wrong" | "noMatch" | "marked" | "dontKnow";

export type QuestionSheet = {
  kind: "question";
  verdict: QuestionVerdict;
  result: SheetResult;
  /** Null without a confidence rating: then only the Result row is shown. */
  errorType: ErrorType | null;
  /** Short text only: "Doesn't match our answer. Yours might still be right." and the like. */
  note: string | null;
  boxes: AnswerBox[];
  /** How many are right, for multiple choice and ordering ("2 of 3 right"). */
  detail: string | null;
  why: string[];
  sources: string[];
  override: Override;
};

export type SheetContent = StepSheet | QuestionSheet;

const notes: Partial<Record<QuestionVerdict, string>> = {
  noMatch: "Doesn't match our answer. Yours might still be right.",
  dontKnow: "You said you don't know",
};

/** The sheet after a scenario step. */
export function stepSheet(step: Step, answer: Answer): StepSheet {
  const feedback = simulatedFeedback.evaluate(step, answer);
  const explanation = answer.skipped ? "" : answer.explanation.trim();
  const marked = !feedback.correct && answer.markedCorrect === true;
  return {
    kind: "step",
    verdict: feedback.correct || marked ? "right" : "wrong",
    result: feedback.correct || marked ? "correct" : "wrong",
    errorType: marked ? errorType(true, answer.confidence) : feedback.errorType,
    boxes: feedback.correct
      ? [{ tone: "right", label: "Your choice", lines: [feedback.chosen.text], yours: true }]
      : [
          {
            tone: marked ? "neutral" : "wrong",
            label: "Your choice",
            lines: [feedback.chosen.text],
            yours: true,
          },
          { tone: "better", label: "Better choice", lines: [feedback.best.text] },
        ],
    why: feedback.correct ? [feedback.chosen.why] : [feedback.best.why],
    sources: feedback.sources,
    explanation: explanation || null,
    whatHappened: feedback.chosen.consequence,
    stateChange: describeEffects(step.id, feedback.chosen.effects ?? {}),
    // Only typed text can be defended: never after "I don't know" or an empty explanation.
    override:
      feedback.correct || answerSource(answer) !== "typed"
        ? "none"
        : marked
          ? "marked"
          : "available",
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
export function questionSheet(question: Question, answer: QuizAnswer): QuestionSheet {
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
  const correctLabel = text ? "Reference answer" : "Correct answer";
  const yours = {
    label: "Your answer",
    lines: yourLines(question, response),
    ordered,
    yours: true,
  };
  const correct = { label: correctLabel, lines: correctLines(question), ordered };
  const boxes: AnswerBox[] =
    verdict === "right"
      ? text
        ? [
            { ...yours, tone: "right" },
            { ...correct, tone: "neutral" },
          ]
        : [{ ...yours, tone: "right" }]
      : verdict === "dontKnow"
        ? [{ ...correct, tone: "better" }]
        : verdict === "marked"
          ? [
              { ...yours, tone: "neutral" },
              { ...correct, tone: "better" },
            ]
          : [
              { ...yours, tone: verdict === "partial" ? "partial" : "wrong" },
              { ...correct, tone: "better" },
            ];
  return {
    kind: "question",
    verdict,
    result: scored.correct ? "correct" : verdict === "partial" ? "partial" : "wrong",
    errorType: scored.hasConfidence ? scored.errorType : null,
    note: notes[verdict] ?? null,
    boxes,
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
