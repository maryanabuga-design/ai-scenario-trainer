import { describe, expect, it } from "vitest";
import { questionsFor } from "@/lib/quiz";
import {
  amountOptions,
  availableLine,
  availableQuestions,
  customCap,
  fitAmount,
  questionCountLabel,
  quizAmount,
} from "@/lib/quiz-setup";

const one = questionsFor(["S1"]).length;
const two = questionsFor(["S1", "S2"]).length;

describe("question totals", () => {
  it("adds up the questions of the chosen sections", () => {
    expect(availableQuestions([])).toBe(0);
    expect(availableQuestions(["S1"])).toBe(one);
    expect(availableQuestions(["S1", "S2"])).toBe(two);
    expect(two).toBeGreaterThan(one);
  });

  it("labels the counts and the live line", () => {
    expect(questionCountLabel(1)).toBe("1 question");
    expect(questionCountLabel(4)).toBe("4 questions");
    expect(availableLine(["S1"])).toBe(`${one} questions available in the selected sections`);
    expect(availableLine([])).toBe("0 questions available in the selected sections");
  });
});

describe("amounts", () => {
  it("disables the amounts larger than the total", () => {
    expect(amountOptions(7)).toEqual([
      { count: 5, disabled: false },
      { count: 10, disabled: true },
      { count: 15, disabled: true },
    ]);
    expect(amountOptions(0).every((option) => option.disabled)).toBe(true);
    expect(amountOptions(30).some((option) => option.disabled)).toBe(false);
  });

  it("caps the Custom stepper at the total", () => {
    expect(customCap(7)).toBe(7);
    expect(customCap(0)).toBe(1);
    expect(fitAmount({ countChoice: "custom", customCount: 12 }, 7)).toEqual({
      countChoice: "custom",
      customCount: 7,
    });
  });

  it("defaults to the smaller of 5 and the total", () => {
    expect(fitAmount({ countChoice: 5, customCount: 8 }, 3)).toEqual({
      countChoice: "custom",
      customCount: 3,
    });
    expect(fitAmount({ countChoice: 5, customCount: 8 }, 12)).toEqual({
      countChoice: 5,
      customCount: 8,
    });
    expect(fitAmount({ countChoice: 10, customCount: 8 }, 7).customCount).toBe(7);
    expect(quizAmount({ countChoice: 5, customCount: 8 }, 3)).toBe(3);
  });

  it("leaves the amount alone while no section is chosen", () => {
    expect(fitAmount({ countChoice: 5, customCount: 8 }, 0)).toEqual({
      countChoice: 5,
      customCount: 8,
    });
  });
});
