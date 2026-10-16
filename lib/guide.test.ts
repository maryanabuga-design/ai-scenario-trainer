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

describe("the guides as reading topics", () => {
  it("lists the evacuation guide with 10 topics and the flood guide with 7, with their titles", async () => {
    const { loadGuides } = await import("@/lib/guide");
    const guides = loadGuides();
    expect(guides.map((guide) => guide.title)).toEqual([
      "Building Evacuation and Basic First Aid: Training Guide",
      "Flood Preparedness for Community Volunteers: Training Guide",
    ]);
    expect(guides[0].sections.map((section) => section.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `S${index + 1}`),
    );
    expect(guides[1].sections.map((section) => section.id)).toEqual(
      Array.from({ length: 7 }, (_, index) => `F${index + 1}`),
    );
    expect(guides[0].sections[0].title).toBe("Responding to an alarm");
    expect(guides[1].sections[4].title).toBe("The dangers of floodwater");
    for (const guide of guides) {
      for (const section of guide.sections) {
        expect(section.body.trim().length, section.id).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the raw markdown of a topic, with its subsections and without its own heading", async () => {
    const { loadGuides } = await import("@/lib/guide");
    const s1 = loadGuides()[0].sections[0];
    expect(s1.body).toContain("### Why every alarm is treated as real");
    expect(s1.body).not.toContain("## S1.");
    const f5 = loadGuides()[1].sections[4];
    expect(f5.body).toContain("**Depth and current.**");
  });
});
