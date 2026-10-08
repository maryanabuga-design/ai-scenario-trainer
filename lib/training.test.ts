import { describe, expect, it } from "vitest";
import { questionsFor } from "@/lib/quiz";
import {
  choiceProblem,
  createTraining,
  materialFromSample,
  planTraining,
  sampleFiles,
  scenarioSections,
  withTraining,
} from "@/lib/training";

const all = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];
const guide = planTraining({ sectionIds: all });
const quickCard = planTraining({ sectionIds: ["S1", "S2"] });

describe("planning training from a material", () => {
  it("lets the full guide make a scenario and a quiz", () => {
    expect(guide.canScenario).toBe(true);
    expect(guide.scenarioDecisions).toBe(6);
    expect(guide.sections).toEqual(all);
  });

  it("marks a short material as not enough for a scenario", () => {
    expect(quickCard.canScenario).toBe(false);
    expect(choiceProblem(quickCard, { scenario: true, quiz: true, sections: ["S1", "S2"] })).toBe(
      "Not enough material for a scenario.",
    );
  });

  it("still allows a quiz from a short material", () => {
    expect(choiceProblem(quickCard, { scenario: false, quiz: true, sections: ["S1", "S2"] })).toBe(
      null,
    );
    expect(questionsFor(["S1", "S2"]).length).toBeGreaterThan(0);
  });

  it("gives nothing to a material without guide content", () => {
    const notes = planTraining({});
    expect(notes.canScenario).toBe(false);
    expect(notes.sections).toEqual([]);
  });

  it("knows which sections the scenario needs", () => {
    expect(scenarioSections).toEqual(["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S10"]);
  });
});

describe("checking a choice", () => {
  it("needs at least one section", () => {
    expect(choiceProblem(guide, { scenario: true, quiz: true, sections: [] })).toBe(
      "Keep at least one section.",
    );
  });

  it("needs a scenario, a quiz or both", () => {
    expect(choiceProblem(guide, { scenario: false, quiz: false, sections: ["S1"] })).toBe(
      "Choose a scenario, a quiz or both.",
    );
  });
});

describe("generated state", () => {
  it("keeps the chosen sections in guide order", () => {
    const training = createTraining(
      "evacuation-guide",
      guide,
      { scenario: true, quiz: true, sections: ["S5", "S1"] },
      1000,
    );
    expect(training).toEqual({
      materialId: "evacuation-guide",
      scenario: true,
      quiz: true,
      sections: ["S1", "S5"],
      createdAt: 1000,
    });
  });

  it("refuses a scenario from material that is too short", () => {
    expect(() =>
      createTraining("quick", quickCard, { scenario: true, quiz: false, sections: ["S1"] }, 1),
    ).toThrow("Not enough material for a scenario.");
  });

  it("saves one training per material and replaces it when created again", () => {
    const first = createTraining("a", guide, { scenario: true, quiz: false, sections: all }, 1);
    const other = createTraining(
      "b",
      quickCard,
      { scenario: false, quiz: true, sections: ["S2"] },
      2,
    );
    const again = createTraining("a", guide, { scenario: false, quiz: true, sections: ["S3"] }, 3);
    const saved = withTraining(withTraining(withTraining(null, first), other), again);
    expect(Object.keys(saved)).toEqual(["a", "b"]);
    expect(saved.a).toEqual(again);
  });
});

describe("sample files", () => {
  it("turns the guide and the quick card into ready materials with their sections", () => {
    const now = new Date("2026-10-08T10:00:00Z");
    const [guideFile, card, photo] = sampleFiles;
    expect(materialFromSample(guideFile, now)).toMatchObject({ status: "ready", sectionIds: all });
    expect(materialFromSample(card, now)).toMatchObject({
      status: "ready",
      sectionIds: ["S1", "S2"],
    });
    expect(materialFromSample(photo, now)).toMatchObject({ status: "failed" });
  });
});
