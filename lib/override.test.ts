import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { questionSheet, stepSheet } from "@/lib/answer-sheet";
import { scoreSession } from "@/lib/progress";
import { getQuestion } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import { explanationMissedReason, totalScore, weakItems } from "@/lib/scoring";
import { answerSource, saveSession, setMarkedCorrect } from "@/lib/session";
import type { Answer, QuizAnswer, QuizSession, ScenarioSession } from "@/lib/session";
import { createStore } from "@/lib/store";

const GOOD = "The alarm is real, so we take the stairs now.";
const GIBBERISH = "лбтдлюью";

/** s1: option b is right, d is wrong. Typed answers carry their saved check, as the app saves them. */
function answer(optionId: "b" | "d", typed: string | null, confidence: 2 | 3 = 3): Answer {
  if (typed === null) {
    return {
      stepId: "s1",
      optionId,
      confidence,
      explanation: "",
      skipped: true,
      answerSource: "dont_know",
      explanationCheck: "skipped",
    };
  }
  return { stepId: "s1", optionId, confidence, explanation: typed, answerSource: "typed" };
}

const scenario = (answers: Answer[]): ScenarioSession => ({
  mode: "short",
  stepIds: ["s1", "s2", "s3"],
  index: 0,
  phase: "feedback",
  answers,
  finished: false,
});

const sheet = (a: Answer) => stepSheet(getStep("s1"), a);

describe("the scenario answer sheet decision table", () => {
  it("right option + matching explanation: no Better explanation, no button", () => {
    const s = sheet(answer("b", GOOD));
    expect(s.open.verdict).toBe("matched");
    expect(s.better).toBeNull();
    expect(s.override).toBe("none");
    expect(s.errorType).toBe("secure");
  });

  it("right option + gibberish: Doesn't match yet, Better explanation, button, a Guess to repeat", () => {
    const a = answer("b", GIBBERISH);
    const s = sheet(a);
    expect(s.open).toEqual({ label: "Your explanation", text: GIBBERISH, verdict: "not_matched" });
    expect(s.better?.lines).toEqual([getStep("s1").referenceExplanation]);
    expect(s.override).toBe("available");
    const [item] = scoreSession(scenario([a]));
    expect(item).toMatchObject({ score: 1, correct: true, errorType: "guess" });
    expect(item.reason).toBe(explanationMissedReason);
    expect(weakItems([item])).toHaveLength(1);
  });

  it("right option + I don't know: the muted line, Better explanation, no button", () => {
    const s = sheet(answer("b", null));
    expect(s.open).toEqual({ label: "Your explanation", text: null, verdict: null });
    expect(s.better).not.toBeNull();
    expect(s.override).toBe("none");
    expect(s.errorType).toBe("secure");
  });

  it("wrong option + matching explanation: Better explanation, no button, error type by confidence", () => {
    const s = sheet(answer("d", GOOD, 2));
    expect(s.open.verdict).toBe("matched");
    expect(s.better).not.toBeNull();
    expect(s.override).toBe("none");
    expect(s.errorType).toBe("knowledge_gap");
    expect(sheet(answer("d", GOOD, 3)).errorType).toBe("misconception");
  });

  it("wrong option + typed wrong: Better explanation, no button", () => {
    const s = sheet(answer("d", GIBBERISH));
    expect(s.open.verdict).toBe("not_matched");
    expect(s.better).not.toBeNull();
    expect(s.override).toBe("none");
  });

  it("never shows the old Better choice box", () => {
    expect(JSON.stringify(sheet(answer("d", GIBBERISH)))).not.toContain("Better choice");
  });
});

describe("My explanation is still correct", () => {
  it("treats the explanation as matched: verdict, error type and repeat list; the score stays", () => {
    const sure = setMarkedCorrect(scenario([answer("b", GIBBERISH, 3)]), "s1", true);
    const s = sheet(sure.answers[0]);
    expect(s.open.verdict).toBe("marked");
    expect(s.override).toBe("marked");
    expect(s.better).not.toBeNull();
    const [item] = scoreSession(sure);
    expect(item).toMatchObject({ score: 1, errorType: "secure", markedByYou: true });
    expect(item.reason).toBeUndefined();
    expect(weakItems([item])).toHaveLength(0);
    // Not sure: still a Guess by confidence, so it stays in the repeat list.
    const unsure = setMarkedCorrect(scenario([answer("b", GIBBERISH, 2)]), "s1", true);
    expect(weakItems(scoreSession(unsure))).toHaveLength(1);
    expect(totalScore(scoreSession(sure))).toBe(1);
  });

  it("is undone completely by Undo", () => {
    const before = scenario([answer("b", GIBBERISH)]);
    const undone = setMarkedCorrect(setMarkedCorrect(before, "s1", true), "s1", false);
    expect(scoreSession(undone)).toEqual(scoreSession(before));
    expect(sheet(undone.answers[0])).toEqual(sheet(before.answers[0]));
  });

  it("works out the source for answers saved before it was stored", () => {
    expect(answerSource({ stepId: "s1", optionId: "b", confidence: 3, explanation: "x y z" })).toBe(
      "typed",
    );
    expect(
      answerSource({ stepId: "s1", optionId: "b", confidence: 3, explanation: "", skipped: true }),
    ).toBe("dont_know");
  });
});

describe("quiz questions", () => {
  const quiz = (answers: QuizAnswer[]): QuizSession => ({
    kind: "quiz",
    mode: "quiz",
    sections: ["S1", "S2"],
    questionIds: answers.map((a) => a.questionId),
    index: 0,
    phase: "feedback",
    answers,
    finished: false,
  });
  const question = (a: QuizAnswer) => questionSheet(getQuestion(a.questionId), a);
  const rejected: QuizAnswer = {
    questionId: "q-s2-1",
    response: { type: "text", text: "With my knuckles" },
    confidence: 2,
    answerSource: "typed",
  };

  it("short text typed and rejected: My answer is still correct, counting it as right", () => {
    expect(question(rejected).override).toBe("available");
    const after = setMarkedCorrect(quiz([rejected]), "q-s2-1", true);
    expect(scoreSession(after)[0]).toMatchObject({ score: 1, correct: true, markedByYou: true });
    expect(question(after.answers[0] as QuizAnswer).better?.label).toBe("Better answer");
  });

  it("short text I don't know: no button", () => {
    const dontKnow: QuizAnswer = {
      questionId: "q-s2-1",
      response: { type: "text", text: "" },
      confidence: null,
      dontKnow: true,
      answerSource: "dont_know",
    };
    expect(question(dontKnow).override).toBe("none");
  });

  it("choice questions are unchanged and never show the button", () => {
    const choices: QuizAnswer[] = [
      { questionId: "q-s1-1", response: { type: "single", optionId: "a" }, confidence: 3 },
      {
        questionId: "q-s1-3",
        response: { type: "multiple", optionIds: ["a", "b"] },
        confidence: null,
      },
      {
        questionId: "q-s2-3",
        response: { type: "ordering", order: ["d", "c", "b", "a"] },
        confidence: 3,
      },
      { questionId: "q-s1-2", response: { type: "truefalse", value: true }, confidence: 3 },
    ];
    choices.forEach((a) => {
      const s = question({ ...a, answerSource: "choice" });
      expect(s.override).toBe("none");
      expect(s.open).toBeNull();
      expect(s.boxes.map((box) => box.label)).toContain("Your answer");
    });
  });
});

describe("saving and focus", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the explanation check and the mark after a reload", () => {
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
    const marked = setMarkedCorrect(
      scenario([{ ...answer("b", GIBBERISH), explanationCheck: "not_matched" }]),
      "s1",
      true,
    );
    saveSession(marked);
    const reloaded = createStore<ScenarioSession>("ast.session.v1").read()!;
    expect(reloaded.answers[0]).toMatchObject({
      explanationCheck: "not_matched",
      markedCorrect: true,
    });
    expect(sheet(reloaded.answers[0]).override).toBe("marked");
  });

  it("never draws a focus outline on the sheet container or its hidden title", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toMatch(
      /dialog:focus-visible,\s*\[tabindex="-1"\]:focus-visible \{\s*outline: none;/,
    );
  });
});
