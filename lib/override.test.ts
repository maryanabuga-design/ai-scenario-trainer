import { afterEach, describe, expect, it, vi } from "vitest";
import { questionSheet, stepSheet } from "@/lib/answer-sheet";
import { scoreSession } from "@/lib/progress";
import { getQuestion } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import { totalScore, weakItems } from "@/lib/scoring";
import { answerSource, saveSession, setMarkedCorrect } from "@/lib/session";
import type { Answer, QuizAnswer, QuizSession, ScenarioSession } from "@/lib/session";
import { createStore } from "@/lib/store";

const wrongStep: Answer = { stepId: "s1", optionId: "d", confidence: 2, explanation: "x" };
const rightStep: Answer = { stepId: "s1", optionId: "b", confidence: 3, explanation: "x" };

const scenario = (answers: Answer[]): ScenarioSession => ({
  mode: "short",
  stepIds: ["s1", "s2", "s3"],
  index: 0,
  phase: "feedback",
  answers,
  finished: false,
});

const quiz = (answers: QuizAnswer[]): QuizSession => ({
  kind: "quiz",
  mode: "quiz",
  sections: ["S1", "S2"],
  questionIds: answers.map((answer) => answer.questionId),
  index: 0,
  phase: "feedback",
  answers,
  finished: false,
});

const wrongSingle: QuizAnswer = {
  questionId: "q-s1-1",
  response: { type: "single", optionId: "a" },
  confidence: 3,
};
const partlyMultiple: QuizAnswer = {
  questionId: "q-s1-3",
  response: { type: "multiple", optionIds: ["a", "b"] },
  confidence: null,
};
const rejectedText: QuizAnswer = {
  questionId: "q-s2-1",
  response: { type: "text", text: "With my knuckles" },
  confidence: 2,
};

describe("when the override is offered", () => {
  const step = getStep("s1");
  const question = (answer: QuizAnswer) => questionSheet(getQuestion(answer.questionId), answer);

  it("typed explanation and a wrong decision: shown", () => {
    expect(stepSheet(step, { ...wrongStep, answerSource: "typed" }).override).toBe("available");
  });

  it("I don't know or an empty explanation with a wrong decision: not shown", () => {
    const dontKnow: Answer = {
      ...wrongStep,
      explanation: "",
      skipped: true,
      answerSource: "dont_know",
    };
    expect(stepSheet(step, dontKnow).override).toBe("none");
    expect(stepSheet(step, { ...wrongStep, explanation: "  " }).override).toBe("none");
  });

  it("typed explanation and a right decision: not shown", () => {
    expect(stepSheet(step, { ...rightStep, answerSource: "typed" }).override).toBe("none");
  });

  it("short text typed and rejected: shown; I don't know: not shown", () => {
    expect(question({ ...rejectedText, answerSource: "typed" }).override).toBe("available");
    const dontKnow: QuizAnswer = {
      questionId: "q-s2-1",
      response: { type: "text", text: "" },
      confidence: null,
      dontKnow: true,
      answerSource: "dont_know",
    };
    expect(question(dontKnow).override).toBe("none");
  });

  it("never on single, multiple, ordering or true or false questions", () => {
    const choices: QuizAnswer[] = [
      { ...wrongSingle, answerSource: "choice" },
      { ...partlyMultiple, answerSource: "choice" },
      {
        questionId: "q-s2-3",
        response: { type: "ordering", order: ["d", "c", "b", "a"] },
        confidence: 3,
        answerSource: "choice",
      },
      {
        questionId: "q-s1-2",
        response: { type: "truefalse", value: true },
        confidence: 3,
        answerSource: "choice",
      },
    ];
    choices.forEach((answer) => {
      expect(question(answer).result).not.toBe("correct");
      expect(question(answer).override).toBe("none");
    });
  });

  it("works out the source for answers saved before it was stored", () => {
    expect(answerSource(wrongStep)).toBe("typed");
    expect(answerSource({ ...wrongStep, explanation: "", skipped: true })).toBe("dont_know");
    expect(answerSource(rejectedText)).toBe("typed");
    expect(answerSource(wrongSingle)).toBe("choice");
  });
});

describe("pressing My answer is still correct", () => {
  it("counts a scenario step as right with the same confidence and leaves weak topics", () => {
    const before = scenario([wrongStep]);
    const after = setMarkedCorrect(before, "s1", true);
    const [item] = scoreSession(after);
    expect(totalScore(scoreSession(before))).toBe(0);
    expect(item).toMatchObject({ score: 1, correct: true, errorType: "guess", markedByYou: true });
    expect(weakItems(scoreSession(before))).toHaveLength(1);
    expect(weakItems([item])).toHaveLength(0);
  });

  it("keeps the better choice in the sheet and shows the confirmation", () => {
    const sheet = stepSheet(getStep("s1"), { ...wrongStep, markedCorrect: true });
    expect(sheet.override).toBe("marked");
    expect(sheet.result).toBe("correct");
    expect(sheet.boxes.map((box) => box.label)).toEqual(["Your choice", "Better choice"]);
    expect(sheet.boxes[0].tone).toBe("neutral");
  });

  it("counts a typed short-text answer as right and keeps the reference answer visible", () => {
    const after = setMarkedCorrect(quiz([wrongSingle, rejectedText]), "q-s2-1", true);
    const items = scoreSession(after);
    expect(items[1]).toMatchObject({ score: 1, correct: true, errorType: "guess" });
    expect(items[0].correct).toBe(false);
    expect(weakItems(items).map((item) => item.id)).toEqual(["q-s1-1"]);
    const sheet = questionSheet(getQuestion("q-s2-1"), after.answers[1] as QuizAnswer);
    expect(sheet.override).toBe("marked");
    expect(sheet.boxes.map((box) => box.label)).toEqual(["Your answer", "Reference answer"]);
  });

  it("is undone completely by Undo", () => {
    const before = scenario([wrongStep]);
    const undone = setMarkedCorrect(setMarkedCorrect(before, "s1", true), "s1", false);
    expect(scoreSession(undone)).toEqual(scoreSession(before));
    expect(stepSheet(getStep("s1"), undone.answers[0])).toEqual(
      stepSheet(getStep("s1"), wrongStep),
    );
  });
});

describe("saving the override", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("survives a reload", () => {
    const saved = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => saved.get(key) ?? null,
        setItem: (key: string, value: string) => saved.set(key, value),
        removeItem: (key: string) => saved.delete(key),
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    });
    saveSession(setMarkedCorrect(scenario([wrongStep]), "s1", true));
    // A fresh store reads the browser again, as after a reload.
    const reloaded = createStore<ScenarioSession>("ast.session.v1").read();
    expect(reloaded?.answers[0].markedCorrect).toBe(true);
    expect(scoreSession(reloaded!)[0].markedByYou).toBe(true);
  });
});
