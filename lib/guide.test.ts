import { describe, expect, it } from "vitest";
import { loadFloodGuide, loadGuide } from "@/lib/guide";

describe("the evacuation guide", () => {
  const guide = loadGuide();
  const s1 = guide.sections.find((section) => section.id === "S1")!;

  it("has the ten sections S1 to S10 in order, then the flood guide F1 to F7", () => {
    expect(guide.sections.map((section) => section.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `S${index + 1}`),
    );
    expect(loadFloodGuide().sections.map((section) => section.id)).toEqual(
      Array.from({ length: 7 }, (_, index) => `F${index + 1}`),
    );
  });

  it("keeps the original S1 text first and unchanged", () => {
    expect(s1.title).toBe("Responding to an alarm");
    expect(s1.lines).toEqual([
      "Treat every alarm as real until it is officially confirmed otherwise.",
      "Stop non-essential tasks. Take only what you can carry in a few seconds; never delay your exit to collect belongings.",
      "Do not use elevators during a fire. Use the stairs.",
      "Help people who need assistance only if it is safe. Otherwise report their location to responders.",
    ]);
  });

  it("adds the seven S1 demo extension subsections after it, in order", () => {
    expect(s1.subsections.map((subsection) => subsection.title)).toEqual([
      "Why every alarm is treated as real",
      "The first seconds",
      "What to take and what to leave",
      "Stairs, not elevators",
      "Helping other people",
      "Instructions and announcements",
      "Common mistakes",
    ]);
    s1.subsections.forEach((subsection) => expect(subsection.lines.length).toBeGreaterThan(0));
    expect(s1.subsections[5].lines[0]).toMatch(/^Follow the instructions of wardens/);
    expect(s1.lines.join(" ")).not.toContain("###");
  });

  it("has no subsections in the other sections yet", () => {
    for (const section of [...guide.sections.slice(1), ...loadFloodGuide().sections]) {
      expect(section.subsections, section.id).toEqual([]);
    }
  });
});
