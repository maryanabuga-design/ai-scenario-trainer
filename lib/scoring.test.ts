import { describe, expect, it } from "vitest";
import { getStep, scenario } from "@/lib/scenario";
import {
  countErrorTypes,
  errorType,
  scoreAnswer,
  sumEffects,
  weakSections,
  weakStepIds,
} from "@/lib/scoring";

describe("errorType", () => {
  it("is secure when correct with high confidence", () => {
    expect(errorType(true, 3)).toBe("secure");
  });

  it("is a guess when correct without high confidence", () => {
    expect(errorType(true, 1)).toBe("guess");
    expect(errorType(true, 2)).toBe("guess");
  });

  it("is a misconception when wrong with high confidence", () => {
    expect(errorType(false, 3)).toBe("misconception");
  });

  it("is a knowledge gap when wrong without high confidence", () => {
    expect(errorType(false, 1)).toBe("knowledge_gap");
    expect(errorType(false, 2)).toBe("knowledge_gap");
  });
});

describe("sumEffects", () => {
  it("returns the starting state when every answer is correct", () => {
    const answers = [scoreAnswer(getStep("s1"), "b", 3), scoreAnswer(getStep("s4"), "d", 3)];
    expect(sumEffects(scenario.initialState, answers)).toEqual(scenario.initialState);
  });

  it("adds the effects of wrong answers to the starting state", () => {
    const answers = [
      scoreAnswer(getStep("s1"), "d", 1), // 90 s lost, smoke +1
      scoreAnswer(getStep("s2"), "d", 2), // 30 s lost, smoke +2
      scoreAnswer(getStep("s4"), "a", 3), // casualty -1
    ];
    expect(sumEffects(scenario.initialState, answers)).toEqual({
      timeLostSeconds: 120,
      smokeLevel: 4,
      casualtyStability: -1,
    });
  });
});

describe("weak topics", () => {
  const answers = [
    scoreAnswer(getStep("s1"), "b", 3), // secure
    scoreAnswer(getStep("s2"), "c", 2), // guess, S2
    scoreAnswer(getStep("s3"), "b", 3), // misconception, S2 and S3
    scoreAnswer(getStep("s5"), "a", 1), // knowledge gap, S5
  ];

  it("repeats every wrong or guessed step", () => {
    expect(weakStepIds(answers)).toEqual(["s2", "s3", "s5"]);
  });

  it("lists each weak section once, in order", () => {
    expect(weakSections(answers)).toEqual(["S2", "S3", "S5"]);
  });

  it("counts each error type", () => {
    expect(countErrorTypes(answers)).toEqual({
      secure: 1,
      guess: 1,
      knowledge_gap: 1,
      misconception: 1,
    });
  });

  it("has no weak topics when everything is secure", () => {
    const secure = [scoreAnswer(getStep("s1"), "b", 3)];
    expect(weakStepIds(secure)).toEqual([]);
    expect(weakSections(secure)).toEqual([]);
  });
});
