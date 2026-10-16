import { describe, expect, it } from "vitest";
import { getItem } from "@/lib/items";
import { checkAnnouncement, checkResult, optionState } from "@/lib/option-state";
import type { OptionState, QuestionMode } from "@/lib/option-state";

const states = (mode: QuestionMode, choice: string | null, checked: boolean): OptionState[] =>
  ["a", "b", "c"].map((optionId) =>
    optionState({ mode, optionId, choice, checked, correctOptionId: "b" }),
  );

describe("the state of an answer option", () => {
  it("is idle everywhere when nothing is chosen", () => {
    expect(states("training", null, false)).toEqual(["idle", "idle", "idle"]);
    expect(states("exam", null, false)).toEqual(["idle", "idle", "idle"]);
  });

  it("shows only the chosen option as selected before Check, whatever its correctness", () => {
    expect(states("training", "a", false)).toEqual(["selected", "idle", "idle"]);
    expect(states("training", "b", false)).toEqual(["idle", "selected", "idle"]);
  });

  it("marks a right choice correct after Check and leaves the others idle", () => {
    expect(states("training", "b", true)).toEqual(["idle", "correct", "idle"]);
  });

  it("marks a wrong choice wrong after Check and reveals the right option", () => {
    expect(states("training", "a", true)).toEqual(["wrong", "revealed-correct", "idle"]);
    expect(states("training", "c", true)).toEqual(["idle", "revealed-correct", "wrong"]);
  });

  it("never reveals anything in the exam, checked or not", () => {
    for (const checked of [false, true]) {
      expect(states("exam", "a", checked)).toEqual(["selected", "idle", "idle"]);
      expect(states("exam", "b", checked)).toEqual(["idle", "selected", "idle"]);
    }
  });

  it("works for a true or false question with two options", () => {
    const item = getItem("q-quiz-s01-002");
    expect(item.options).toHaveLength(2);
    const state = (choice: string) =>
      item.options.map((option) =>
        optionState({
          mode: "training",
          optionId: option.id,
          choice,
          checked: true,
          correctOptionId: item.correctOptionId,
        }),
      );
    expect(state(item.correctOptionId)).toContain("correct");
    expect(state(item.options.find((o) => o.id !== item.correctOptionId)!.id)).toEqual(
      item.options.map((o) => (o.id === item.correctOptionId ? "revealed-correct" : "wrong")),
    );
  });
});

describe("scoring at Check", () => {
  const item = getItem("q-scn-s01-001");

  it("is binary: right only for the correct option", () => {
    for (const option of item.options) {
      expect(checkResult(item, option.id)).toEqual({
        correct: option.id === item.correctOptionId,
        correctOptionId: item.correctOptionId,
      });
    }
  });

  it("is announced to a screen reader: Correct, or Not quite with the right answer", () => {
    expect(checkAnnouncement(item, item.correctOptionId)).toBe("Correct");
    const wrong = item.options.find((option) => option.id !== item.correctOptionId)!;
    const right = item.options.find((option) => option.id === item.correctOptionId)!;
    expect(checkAnnouncement(item, wrong.id)).toBe(
      `Not quite. The correct answer is: ${right.text}`,
    );
  });
});
