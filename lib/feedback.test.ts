import { describe, expect, it } from "vitest";
import { simulatedFeedback } from "@/lib/feedback";
import { getStep, scenario } from "@/lib/scenario";

describe("simulatedFeedback", () => {
  it("brings the item's guide sections into the feedback", () => {
    expect(simulatedFeedback.evaluate(getStep("s3"), "a").sources).toEqual(["S2", "S3"]);
  });

  it("returns the chosen and the correct option, and whether they are the same", () => {
    const wrong = simulatedFeedback.evaluate(getStep("s1"), "d");
    expect(wrong.correct).toBe(false);
    expect(wrong.chosen.id).toBe("d");
    expect(wrong.best.id).toBe("b");
    expect(simulatedFeedback.evaluate(getStep("s1"), "b").correct).toBe(true);
  });

  it("refuses an option the item does not have", () => {
    expect(() => simulatedFeedback.evaluate(getStep("s1"), "z")).toThrow();
  });

  it("offers the not-covered question only on the smoke step", () => {
    const withQuestion = scenario.steps.filter((step) => step.suggestedQuestion);
    expect(withQuestion.map((step) => step.id)).toEqual(["s3"]);
  });
});
