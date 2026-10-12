import { describe, expect, it } from "vitest";
import { getStep, scenario } from "@/lib/scenario";
import {
  countErrorTypes,
  currentWeakItems,
  errorType,
  errorTypeSummary,
  groupByErrorType,
  scoreStep,
  sumEffects,
  totalScore,
  weakItems,
  weakSections,
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

  it("treats a missing confidence as secure when right and a knowledge gap when wrong", () => {
    expect(errorType(true, null)).toBe("secure");
    expect(errorType(false, null)).toBe("knowledge_gap");
  });

  it("is a knowledge gap when wrong without high confidence", () => {
    expect(errorType(false, 1)).toBe("knowledge_gap");
    expect(errorType(false, 2)).toBe("knowledge_gap");
  });
});

describe("sumEffects", () => {
  it("returns the starting state when every answer is correct", () => {
    const answers = [scoreStep(getStep("s1"), "b", 3), scoreStep(getStep("s4"), "d", 3)];
    expect(sumEffects(scenario.initialState, answers)).toEqual(scenario.initialState);
  });

  it("adds the effects of wrong answers to the starting state", () => {
    const answers = [
      scoreStep(getStep("s1"), "d", 1), // 90 s lost, smoke +1
      scoreStep(getStep("s2"), "d", 2), // 30 s lost, smoke +2
      scoreStep(getStep("s4"), "a", 3), // casualty -1
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
    scoreStep(getStep("s1"), "b", 3), // secure
    scoreStep(getStep("s2"), "c", 2), // guess, S2
    scoreStep(getStep("s3"), "b", 3), // misconception, S2 and S3
    scoreStep(getStep("s5"), "a", 1), // knowledge gap, S5
  ];

  it("repeats every wrong or guessed step", () => {
    expect(weakItems(answers).map((item) => item.id)).toEqual(["s2", "s3", "s5"]);
  });

  it("lists each weak section once, in order", () => {
    expect(weakSections(answers)).toEqual(["S2", "S3", "S5"]);
  });

  it("adds up the points", () => {
    expect(totalScore(answers)).toBe(2);
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
    const secure = [scoreStep(getStep("s1"), "b", 3)];
    expect(weakItems(secure)).toEqual([]);
    expect(weakSections(secure)).toEqual([]);
  });
});

describe("currentWeakItems", () => {
  it("uses the most recent answer for each step", () => {
    const history = [
      scoreStep(getStep("s2"), "b", 3), // first session: misconception
      scoreStep(getStep("s3"), "a", 2), // first session: guess
      scoreStep(getStep("s2"), "c", 3), // repeat: secure, clears s2
    ];
    expect(currentWeakItems(history).map((item) => item.id)).toEqual(["s3"]);
  });

  it("keeps a step weak when the later answer is still wrong or guessed", () => {
    const history = [scoreStep(getStep("s5"), "b", 3), scoreStep(getStep("s5"), "b", 1)];
    expect(currentWeakItems(history).map((item) => item.errorType)).toEqual(["guess"]);
  });

  it("is empty for an empty history", () => {
    expect(currentWeakItems([])).toEqual([]);
  });
});

describe("error types card", () => {
  // s1 b sure: secure; s2 c unsure: guess; s3 b sure: misconception; s5 b sure: secure.
  const items = [
    scoreStep(getStep("s1"), "b", 3),
    scoreStep(getStep("s2"), "c", 2),
    scoreStep(getStep("s3"), "b", 3),
    scoreStep(getStep("s5"), "b", 3),
  ];

  it("always shows all four types in the fixed order", () => {
    expect(errorTypeSummary(countErrorTypes([])).map((row) => row.label)).toEqual([
      "Secure",
      "Guess",
      "Knowledge gap",
      "Misconception",
    ]);
    expect(errorTypeSummary(countErrorTypes(items)).map((row) => row.type)).toEqual([
      "secure",
      "guess",
      "knowledge_gap",
      "misconception",
    ]);
  });

  it("counts each type and names each row for screen readers", () => {
    const rows = errorTypeSummary(countErrorTypes(items));
    expect(rows.map((row) => row.count)).toEqual([2, 1, 0, 1]);
    expect(rows[0].accessibleName).toBe("Secure, right answer, high confidence: 2");
    expect(rows[3].description).toBe("Wrong answer, high confidence");
  });

  it("keeps rows with a count of 0, muted", () => {
    const rows = errorTypeSummary(countErrorTypes(items));
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.muted)).toEqual([false, false, true, false]);
    expect(rows[2].accessibleName).toBe("Knowledge gap, wrong answer, not sure: 0");
    expect(errorTypeSummary(countErrorTypes([])).every((row) => row.muted)).toBe(true);
  });

  it("groups the analysis by error type in the same order, without empty groups", () => {
    const groups = groupByErrorType(items);
    expect(groups.map((group) => group.type)).toEqual(["secure", "guess", "misconception"]);
    expect(groups[0].items.map((item) => item.id)).toEqual(["s1", "s5"]);
  });
});
