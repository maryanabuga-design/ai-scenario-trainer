import { describe, expect, it } from "vitest";
import { choiceProblem, planTraining } from "@/lib/training";
import { keepOneHint, selectionToggle, toggleSection } from "@/lib/sections";

const all = ["S1", "S2", "S3"];

describe("select all toggle", () => {
  it('says "Deselect all" when everything is selected, and clears everything', () => {
    expect(selectionToggle(all, all)).toEqual({ label: "Deselect all", next: [] });
  });

  it('says "Select all" in any other state, and selects everything in list order', () => {
    expect(selectionToggle(all, [])).toEqual({ label: "Select all", next: ["S1", "S2", "S3"] });
    expect(selectionToggle(all, ["S3", "S1"])).toEqual({
      label: "Select all",
      next: ["S1", "S2", "S3"],
    });
  });

  it("toggles one section and keeps the list order", () => {
    expect(toggleSection(all, ["S3"], "S1")).toEqual(["S1", "S3"]);
    expect(toggleSection(all, ["S1", "S3"], "S1")).toEqual(["S3"]);
    expect(toggleSection(all, ["S1"], "S1")).toEqual([]);
  });
});

describe("disabled primary button", () => {
  it("has the hint for no section selected", () => {
    expect(keepOneHint).toBe("Keep at least one section.");
  });

  it("blocks Generate on Create training with the same hint", () => {
    const plan = planTraining({ sectionIds: all, scenarioId: "building-evacuation-001" });
    expect(choiceProblem(plan, { scenario: false, quiz: true, sections: [] })).toBe(keepOneHint);
  });
});
