import { describe, expect, it } from "vitest";
import { explanationPrompt } from "@/components/DecisionStep/DecisionStep";
import { simulatedFeedback } from "@/lib/feedback";
import { getStep, scenario } from "@/lib/scenario";

describe("simulatedFeedback", () => {
  it("brings the step's follow-up question and key points into the feedback", () => {
    const step = getStep("s1");
    const feedback = simulatedFeedback.evaluate(step, { optionId: "b", confidence: 3 });
    expect(feedback.followUp).toBe(step.followUp);
    expect(feedback.keyBeats).toEqual(step.explanationKeyBeats);
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
  it("is neutral and never one of the steps' follow-up questions", () => {
    expect(explanationPrompt).toBe("In one sentence, why did you choose this?");
    scenario.steps.forEach((step) => expect(step.followUp).not.toBe(explanationPrompt));
  });
});
