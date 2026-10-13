import { afterEach, describe, expect, it, vi } from "vitest";
import { questionSheet, stepSheet } from "@/lib/answer-sheet";
import { scoreSession } from "@/lib/progress";
import { getQuestion } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import { totalScore, weakItems } from "@/lib/scoring";
import { saveSession, setMarkedCorrect } from "@/lib/session";
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
  it("offers it after a wrong scenario step, never after a right one", () => {
    expect(stepSheet(getStep("s1"), wrongStep).override).toBe("available");
    expect(stepSheet(getStep("s1"), rightStep).override).toBe("none");
  });

  it("offers it after a wrong, partly right or rejected quiz answer", () => {
    expect(questionSheet(getQuestion("q-s1-1"), wrongSingle).override).toBe("available");
    expect(questionSheet(getQuestion("q-s1-3"), partlyMultiple).override).toBe("available");
    expect(questionSheet(getQuestion("q-s2-1"), rejectedText).override).toBe("available");
  });

  it("does not offer it after a right answer or after I don't know", () => {
    const right: QuizAnswer = { ...wrongSingle, response: { type: "single", optionId: "b" } };
    expect(questionSheet(getQuestion("q-s1-1"), right).override).toBe("none");
    const dontKnow: QuizAnswer = {
      questionId: "q-s2-1",
      response: { type: "text", text: "" },
      confidence: null,
      dontKnow: true,
    };
    expect(questionSheet(getQuestion("q-s2-1"), dontKnow).override).toBe("none");
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

  it("works for every quiz type and keeps the correct answer visible", () => {
    const after = setMarkedCorrect(quiz([wrongSingle, partlyMultiple]), "q-s1-3", true);
    const items = scoreSession(after);
    expect(items[1]).toMatchObject({ score: 1, correct: true, errorType: "secure" });
    expect(items[0].correct).toBe(false);
    const sheet = questionSheet(getQuestion("q-s1-3"), after.answers[1] as QuizAnswer);
    expect(sheet.override).toBe("marked");
    expect(sheet.boxes.map((box) => box.label)).toEqual(["Your answer", "Correct answer"]);
  });

  it("is undone completely by Undo", () => {
    const before = quiz([wrongSingle]);
    const undone = setMarkedCorrect(setMarkedCorrect(before, "q-s1-1", true), "q-s1-1", false);
    expect(scoreSession(undone)).toEqual(scoreSession(before));
    expect(questionSheet(getQuestion("q-s1-1"), undone.answers[0] as QuizAnswer)).toEqual(
      questionSheet(getQuestion("q-s1-1"), wrongSingle),
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
