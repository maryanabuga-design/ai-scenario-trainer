import { prefillSelfCheck } from "@/lib/explanation-match";
import { simulatedFeedback } from "@/lib/feedback";
import { describeEffects } from "@/lib/outcome";
import { describeAnswer, describeResponse, scoreQuestion, scoreResponse } from "@/lib/quiz";
import type { Choice, Question, Response } from "@/lib/quiz";
import type { Step } from "@/lib/scenario";
import type { Answer, QuizAnswer } from "@/lib/session";

/**
 * What the answer sheet shows right after an answer. On purpose there is no error type, no
 * percentage and no score here: those belong to the final analysis on the results screen.
 */

/** right: a check and a solid green outline; wrong: a cross; better: a check and a dashed outline. */
export type BoxTone = "right" | "wrong" | "better" | "partial" | "neutral";

export type AnswerBox = {
  tone: BoxTone;
  label: string;
  lines: string[];
  /** Ordering answers are numbered lists. */
  ordered?: boolean;
};

export type SheetPoint = { text: string; covered: boolean };

export type StepSheet = {
  kind: "step";
  verdict: "right" | "wrong";
  title: "Right call" | "Not the best action";
  boxes: AnswerBox[];
  why: string[];
  sources: string[];
  whatHappened: string;
  stateChange: string[];
  points: SheetPoint[];
  /** "I don't know": the points are a hint, without checkboxes. */
  skipped: boolean;
  allCovered: boolean;
};

export type QuestionVerdict = "right" | "partial" | "wrong" | "noMatch" | "marked" | "dontKnow";

export type QuestionSheet = {
  kind: "question";
  verdict: QuestionVerdict;
  title: string;
  boxes: AnswerBox[];
  /** How many are right, for multiple choice and ordering ("2 of 3 correct options chosen"). */
  detail: string | null;
  why: string[];
  sources: string[];
  /** A short text answer the keyword check rejected: the user may mark it correct. */
  canMarkCorrect: boolean;
};

export type SheetContent = StepSheet | QuestionSheet;

export const questionTitles: Record<QuestionVerdict, string> = {
  right: "Correct",
  partial: "Partly right",
  wrong: "Not correct",
  noMatch: "Doesn't match our answer. Yours might still be right.",
  marked: "Marked correct by you",
  dontKnow: "You said you don't know",
};

/** The sheet after a scenario step. The checkboxes are the user's own self-check. */
export function stepSheet(step: Step, answer: Answer): StepSheet {
  const feedback = simulatedFeedback.evaluate(step, answer);
  const skipped = answer.skipped === true || !answer.explanation.trim();
  const boxes = skipped
    ? step.explanationKeyBeats.map(() => false)
    : (answer.selfCheck ?? prefillSelfCheck(step, answer.explanation));
  const points = step.explanationKeyBeats.map((text, index) => ({
    text,
    covered: boxes[index] ?? false,
  }));
  return {
    kind: "step",
    verdict: feedback.correct ? "right" : "wrong",
    title: feedback.correct ? "Right call" : "Not the best action",
    boxes: feedback.correct
      ? [{ tone: "right", label: "Your choice", lines: [feedback.chosen.text] }]
      : [
          { tone: "wrong", label: "Your choice", lines: [feedback.chosen.text] },
          { tone: "better", label: "Better choice", lines: [feedback.best.text] },
        ],
    why: feedback.correct ? [feedback.chosen.why] : [feedback.best.why],
    sources: feedback.sources,
    whatHappened: feedback.chosen.consequence,
    stateChange: describeEffects(step.id, feedback.chosen.effects ?? {}),
    points,
    skipped,
    allCovered: !skipped && points.every((point) => point.covered),
  };
}

function texts(choices: Choice[], ids: string[]) {
  return ids.map((id) => choices.find((choice) => choice.id === id)?.text ?? id);
}

/** How many are right, for the types with partial credit. */
function countDetail(question: Question, response: Response): string | null {
  if (question.type === "multiple" && response.type === "multiple") {
    const right = response.optionIds.filter((id) => question.answer.includes(id)).length;
    const wrong = response.optionIds.length - right;
    const extra = wrong > 0 ? `, ${wrong} not correct` : "";
    return `${right} of ${question.answer.length} correct options chosen${extra}`;
  }
  if (question.type === "ordering" && response.type === "ordering") {
    const inPlace = question.answer.filter((id, index) => response.order[index] === id).length;
    return `${inPlace} of ${question.answer.length} in the right place`;
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
  const yours = { label: "Your answer", lines: yourLines(question, response), ordered };
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
              { ...correct, tone: "neutral" },
            ]
          : [
              { ...yours, tone: verdict === "partial" ? "partial" : "wrong" },
              { ...correct, tone: "better" },
            ];
  return {
    kind: "question",
    verdict,
    title: verdict === "right" && text ? "Looks correct" : questionTitles[verdict],
    boxes,
    detail: countDetail(question, response),
    why: [question.why],
    sources: [question.section],
    canMarkCorrect: verdict === "noMatch",
  };
}
