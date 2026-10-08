import { describe, expect, it } from "vitest";
import { defaultStory, getScenario, getStep, scenarios } from "@/lib/scenario";
import { scoreStep, sumEffects } from "@/lib/scoring";

const flood = getScenario("flood-preparedness-001");

describe("scenarios", () => {
  it("has the evacuation and the flood scenario, with unique step ids", () => {
    expect(scenarios.map((def) => def.id)).toEqual([
      "building-evacuation-001",
      "flood-preparedness-001",
    ]);
    const ids = scenarios.flatMap((def) => def.steps.map((step) => step.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("falls back to the evacuation scenario for sessions saved without one", () => {
    expect(getScenario(undefined).id).toBe("building-evacuation-001");
  });

  it("gives the flood scenario 3 namespaced steps and only the 3-decision length", () => {
    expect(defaultStory(flood).map((step) => step.id)).toEqual([
      "flood-s1",
      "flood-s2",
      "flood-s3",
    ]);
    expect(Object.keys(flood.lengths)).toEqual(["short"]);
    expect(getStep("flood-s1").title).toBe("A flood warning");
  });

  it("brings the flood keywords in, in the order of the key points", () => {
    const step = getStep("flood-s1");
    expect(step.keyBeatKeywords).toHaveLength(step.explanationKeyBeats.length);
    expect(step.keyBeatKeywords[1]).toContain("support");
    expect(step.chat).toEqual([]);
  });

  it("shows time lost and water level for the flood scenario, and no casualty", () => {
    expect(flood.outcome.map((metric) => metric.key)).toEqual(["timeLostSeconds", "waterLevel"]);
  });

  it("adds up water level like any other effect", () => {
    const items = [scoreStep(getStep("flood-s1"), "a", 2), scoreStep(getStep("flood-s2"), "b", 3)];
    expect(sumEffects(flood.initialState, items)).toEqual({ waterLevel: 4, timeLostSeconds: 240 });
  });
});
