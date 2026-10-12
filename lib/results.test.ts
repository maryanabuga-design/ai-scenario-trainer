import { describe, expect, it } from "vitest";
import { getQuestion, scoreQuestion } from "@/lib/quiz";
import { analysisTitles, conclusion, filterItems, parseFilter } from "@/lib/results";
import { getStep } from "@/lib/scenario";
import { analysisOrder, groupByErrorType, scoreStep } from "@/lib/scoring";

// s1 b sure: secure; s2 c unsure: guess; s3 b sure: misconception; s5 a unsure: knowledge gap.
const secure = scoreStep(getStep("s1"), "b", 3);
const guess = scoreStep(getStep("s2"), "c", 2);
const misconception = scoreStep(getStep("s3"), "b", 3);
const gap = scoreStep(getStep("s5"), "a", 1);

describe("conclusion sentence", () => {
  it("names misconceptions first", () => {
    expect(conclusion([secure, guess, gap, misconception])).toBe(
      "You were sure, but 1 answer did not match the guide.",
    );
    expect(conclusion([misconception, scoreStep(getStep("s2"), "b", 3)])).toBe(
      "You were sure, but 2 answers did not match the guide.",
    );
  });

  it("then knowledge gaps", () => {
    expect(conclusion([secure, guess, gap])).toBe("1 answer needs another look in the guide.");
    expect(conclusion([gap, scoreStep(getStep("s2"), "b", 1)])).toBe(
      "2 answers need another look in the guide.",
    );
  });

  it("then guesses", () => {
    expect(conclusion([secure, guess])).toBe("1 right answer was a guess. Repeat it to be sure.");
    expect(conclusion([guess, scoreStep(getStep("s1"), "b", 1)])).toBe(
      "2 right answers were guesses. Repeat them to be sure.",
    );
  });

  it("and otherwise says every answer was right and confident", () => {
    expect(conclusion([secure])).toBe("Every answer was right and confident.");
  });
});

describe("filtered lists for the Error analysis screen", () => {
  const partly = scoreQuestion(
    getQuestion("q-s1-3"),
    { type: "multiple", optionIds: ["a", "b", "c"] },
    2,
  );
  const items = [secure, guess, misconception, gap, partly];

  it("shows correct answers, or every answer that is not fully correct", () => {
    expect(filterItems(items, "correct").map((item) => item.id)).toEqual(["s1", "s2"]);
    expect(filterItems(items, "incorrect").map((item) => item.id)).toEqual(["s3", "s5", "q-s1-3"]);
    expect(filterItems(items, "all")).toHaveLength(5);
  });

  it("reads the filter from the address and titles the screen", () => {
    expect(parseFilter("correct")).toBe("correct");
    expect(parseFilter("incorrect")).toBe("incorrect");
    expect(parseFilter(null)).toBe("all");
    expect(parseFilter("anything")).toBe("all");
    expect(analysisTitles).toEqual({
      all: "Error analysis",
      correct: "Correct answers",
      incorrect: "Incorrect answers",
    });
  });

  it("groups the analysis from the most serious type, hiding empty groups", () => {
    expect(analysisOrder).toEqual(["misconception", "knowledge_gap", "guess", "secure"]);
    expect(groupByErrorType(items, analysisOrder).map((group) => group.type)).toEqual([
      "misconception",
      "knowledge_gap",
      "guess",
      "secure",
    ]);
    expect(
      groupByErrorType(filterItems(items, "correct"), analysisOrder).map((group) => group.type),
    ).toEqual(["guess", "secure"]);
  });
});
