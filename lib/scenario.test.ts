import { describe, expect, it } from "vitest";
import scenarioData from "@/content/scenario-building-evacuation.json";
import floodData from "@/content/scenario-flood-preparedness.json";
import { getScenario, getStep, scenario, scenarios } from "@/lib/scenario";

describe("scenarios", () => {
  it("has the evacuation and the flood scenario, with unique step ids", () => {
    expect(scenarios.map((def) => def.id)).toEqual([scenarioData.id, "flood-preparedness-001"]);
    const ids = scenarios.flatMap((def) => def.steps.map((step) => step.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("falls back to the evacuation scenario for sessions saved without one", () => {
    expect(getScenario(undefined).id).toBe(scenario.id);
    expect(getScenario("unknown").id).toBe(scenario.id);
  });

  it("gives the flood scenario 3 prefixed steps and no prepared Ask AI answers", () => {
    const flood = getScenario("flood-preparedness-001");
    expect(flood.steps.map((step) => step.id)).toEqual(["flood-s1", "flood-s2", "flood-s3"]);
    flood.steps.forEach((step) => expect(step.chat ?? []).toEqual([]));
    expect(getStep("flood-s2").section).toBe("F4");
  });
});

describe("scenario steps use the shared shape", () => {
  scenarios.forEach((def) =>
    def.steps.forEach((step) => {
      it(`${step.id}: a situation, a question, exactly 3 options and one correct answer`, () => {
        expect(step.kind).toBe("step");
        expect(step.situation?.length).toBeGreaterThan(0);
        expect(step.title?.length).toBeGreaterThan(0);
        expect(step.question).toMatch(/\?$/);
        expect(step.options).toHaveLength(3);
        expect(step.type ?? "single").toBe("single");
        expect(step.options.filter((option) => option.id === step.correctOptionId)).toHaveLength(1);
        expect(step.section).toBe(step.guideRef[0]);
        expect(step.why.length).toBeGreaterThan(0);
      });
    }),
  );

  it("has none of the removed content fields, in the files or in the steps", () => {
    const removed = [
      "explanationKeyBeats",
      "explanationKeywords",
      "referenceExplanation",
      "confidenceScale",
      "errorTypeRule",
      "narrative",
    ];
    for (const file of [scenarioData, floodData]) {
      const text = JSON.stringify(file);
      removed.forEach((field) => expect(text).not.toContain(`"${field}"`));
      file.steps.forEach((step) => {
        expect(step).not.toHaveProperty("sources");
        step.options.forEach((option) =>
          expect(Object.keys(option).sort()).toEqual(["id", "text"]),
        );
      });
    }
  });
});
