import { describe, expect, it } from "vitest";
import { explanationLabel } from "@/components/DecisionStep/DecisionStep";
import { simulatedFeedback } from "@/lib/feedback";
import { getStep, scenario, scenarios } from "@/lib/scenario";

describe("simulatedFeedback", () => {
  it("brings the step's sources into the feedback", () => {
    const feedback = simulatedFeedback.evaluate(getStep("s1"), { optionId: "b", confidence: 3 });
    expect(feedback.sources).toEqual(["S1"]);
  });

  it("returns the chosen and the better option for a wrong answer", () => {
    const feedback = simulatedFeedback.evaluate(getStep("s2"), { optionId: "b", confidence: 3 });
    expect(feedback.correct).toBe(false);
    expect(feedback.chosen.id).toBe("b");
    expect(feedback.best.id).toBe("c");
    expect(feedback.errorType).toBe("misconception");
  });

  it("offers the not-covered question only on the smoke step", () => {
    const withQuestion = scenario.steps.filter((step) => step.suggestedQuestion);
    expect(withQuestion.map((step) => step.id)).toEqual(["s3"]);
  });
});

describe("explanation prompt", () => {
  it("is neutral and the only question: no step has an AI follow-up question", () => {
    expect(explanationLabel).toBe("Explain your choice in your own words (optional)");
    scenarios
      .flatMap((def) => def.steps)
      .forEach((step) => expect(step).not.toHaveProperty("followUp"));
  });
});
