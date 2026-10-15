import { describe, expect, it } from "vitest";
import { checklists, getChecklist, stepCountLabel } from "@/lib/checklists";
import { loadAllSections } from "@/lib/guide";

describe("quick checklists", () => {
  it("has 3 checklists of 5 or 6 steps each, with unique ids", () => {
    expect(checklists).toHaveLength(3);
    checklists.forEach((checklist) => {
      expect(checklist.steps.length, checklist.id).toBeGreaterThanOrEqual(5);
      expect(checklist.steps.length, checklist.id).toBeLessThanOrEqual(6);
    });
    expect(new Set(checklists.map((checklist) => checklist.id)).size).toBe(3);
  });

  it("is written from the guide: every checklist cites existing sections", () => {
    const ids = loadAllSections().map((section) => section.id);
    checklists.forEach((checklist) => {
      expect(checklist.guideRef.length).toBeGreaterThan(0);
      checklist.guideRef.forEach((section) => expect(ids).toContain(section));
    });
  });

  it("stays educational: no weapons, harm or combat wording", () => {
    const text = JSON.stringify(checklists).toLowerCase();
    expect(text).not.toMatch(/weapon|gun|combat|attack|kill|troop|military/);
  });

  it("finds a checklist by id and words the number of steps", () => {
    expect(getChecklist("burns")?.title).toBe("Burns");
    expect(getChecklist("nope")).toBeUndefined();
    expect(stepCountLabel(6)).toBe("6 steps");
    expect(stepCountLabel(1)).toBe("1 step");
  });
});
