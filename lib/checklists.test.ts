import { describe, expect, it } from "vitest";
import {
  STEPS_SUBTITLE,
  STEPS_TITLE,
  checklists,
  getChecklist,
  stepCountLabel,
} from "@/lib/checklists";
import { loadAllSections } from "@/lib/guide";

describe("quick checklists", () => {
  it("has 3 step guides of 4 to 7 steps each, with unique ids", () => {
    expect(checklists).toHaveLength(3);
    checklists.forEach((checklist) => {
      expect(checklist.steps.length, checklist.id).toBeGreaterThanOrEqual(4);
      expect(checklist.steps.length, checklist.id).toBeLessThanOrEqual(7);
    });
    expect(new Set(checklists.map((checklist) => checklist.id)).size).toBe(3);
  });

  it("gives every step a stable id (<guide>-s1, s2, ...), a title and details, and a reading topic", () => {
    const ids = loadAllSections().map((section) => section.id);
    checklists.forEach((checklist) => {
      expect(ids, checklist.id).toContain(checklist.topic);
      checklist.steps.forEach((step, index) => {
        expect(step.id).toBe(`${checklist.id}-s${index + 1}`);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.details.length).toBeGreaterThan(0);
        step.details.forEach((detail) => expect(detail.length).toBeGreaterThan(10));
      });
    });
  });

  it("gives each guide its own known icon: bell, blood drop, flame", () => {
    expect(checklists.map((checklist) => checklist.icon)).toEqual(["BellRing", "Droplet", "Flame"]);
    expect(new Set(checklists.map((checklist) => checklist.icon)).size).toBe(checklists.length);
  });

  it("never invents a link: there is no source or URL unless the content has one", () => {
    expect(JSON.stringify(checklists)).not.toMatch(/https?:|www\./);
    checklists.forEach((checklist) => expect(checklist.source).toBeUndefined());
  });

  it("only uses sentences of the guide: every detail is found in the guide text", () => {
    const guide = loadAllSections()
      .flatMap((section) => [
        section.body,
        ...section.subsections.map((sub) => sub.lines.join(" ")),
      ])
      .join(" ")
      .replace(/\s+/g, " ")
      .replace(/^- /gm, "");
    const norm = (text: string) => text.replace(/\s+/g, " ").trim();
    checklists.forEach((checklist) =>
      checklist.steps.forEach((step) =>
        step.details.forEach((detail) => {
          // the sentences of a detail, each present in the guide (quotes aside)
          norm(detail)
            .split(/(?<=[.:?!])\s+(?=[A-Z"])/)
            .forEach((sentence) => {
              const plain = sentence.replace(/^"|"$|\\"/g, "").replace(/[.]$/, "");
              expect(guide, `${step.id}: ${plain}`).toContain(plain.slice(0, 40));
            });
        }),
      ),
    );
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
    expect(STEPS_TITLE).toBe("Steps");
    expect(STEPS_SUBTITLE).toBe("Short step-by-step guides for each topic.");
    expect(getChecklist("nope")).toBeUndefined();
    expect(stepCountLabel(6)).toBe("6 steps");
    expect(stepCountLabel(1)).toBe("1 step");
  });
});
