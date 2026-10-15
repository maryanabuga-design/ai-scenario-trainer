import { describe, expect, it } from "vitest";
import { questionsFor } from "@/lib/quiz";
import { getScenario } from "@/lib/scenario";
import {
  buildSession,
  fitLength,
  lengthOptions,
  onlyWeakSections,
  pickQuizItems,
  pickScenarioItems,
  poolFor,
} from "@/lib/setup";

const all = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];
const evacuation = getScenario(undefined).steps;
/** A fixed "random" so draws repeat. */
const seeded = () => {
  let n = 7;
  return () => (n = (n * 48271) % 2147483647) / 2147483647;
};

describe("the lengths on offer", () => {
  it("offers 10, 20 and 30 when 30 or more are available", () => {
    expect(lengthOptions(33).map((option) => option.value)).toEqual([10, 20, 30]);
    expect(lengthOptions(30).map((option) => option.value)).toEqual([10, 20, 30]);
  });

  it("hides 30 below 30 available and 20 below 20", () => {
    expect(lengthOptions(29).map((option) => option.value)).toEqual([10, 20]);
    expect(lengthOptions(19).map((option) => option.value)).toEqual([10]);
    expect(lengthOptions(10).map((option) => option.value)).toEqual([10]);
  });

  it("offers one option, All N, below 10 available (the documented exception)", () => {
    expect(lengthOptions(3)).toEqual([{ value: 3, label: "All 3" }]);
    expect(lengthOptions(9)).toEqual([{ value: 9, label: "All 9" }]);
    expect(lengthOptions(0)).toEqual([]);
  });

  it("keeps a chosen length that is offered, else drops to the largest one below it", () => {
    expect(fitLength(20, 33)).toBe(20);
    expect(fitLength(30, 25)).toBe(20);
    expect(fitLength(20, 12)).toBe(10);
    expect(fitLength(10, 3)).toBe(3);
  });

  it("is limited by the selected sections, for both modes", () => {
    expect(poolFor("quiz", undefined, all)).toHaveLength(33);
    expect(poolFor("quiz", undefined, ["S1"])).toHaveLength(questionsFor(["S1"]).length);
    expect(poolFor("scenario", undefined, all)).toHaveLength(evacuation.length);
    expect(poolFor("scenario", "flood-preparedness-001", ["F1", "F4", "F5"])).toHaveLength(3);
    expect(poolFor("scenario", undefined, ["S3"])).toHaveLength(0);
  });
});

describe("a scenario takes the first k situations of each section in story order", () => {
  it("takes the first situation of each section for a short length, in story order", () => {
    // Sections with situations: S1 (s1, s7), S2 (s2, s3, s8), S4 (s6, s10), S5 (s5, s9), S6 (s4).
    expect(pickScenarioItems(evacuation, all, 5)).toEqual(["s1", "s2", "s4", "s5", "s6"]);
    expect(pickScenarioItems(evacuation, all, 3)).toEqual(["s1", "s2", "s6"]);
  });

  it("goes round the sections again when the length is larger, and stops at what exists", () => {
    expect(pickScenarioItems(evacuation, all, 10)).toHaveLength(evacuation.length);
    expect(pickScenarioItems(evacuation, all, 30)).toHaveLength(evacuation.length);
    expect(pickScenarioItems(evacuation, all, 7)).toHaveLength(7);
  });

  it("takes only the selected sections", () => {
    const ids = pickScenarioItems(evacuation, ["S2"], 10);
    expect(ids.every((id) => evacuation.find((step) => step.id === id)?.section === "S2")).toBe(
      true,
    );
    expect(ids).toEqual(["s2", "s3", "s8"]);
  });

  it("always takes the same questions: no randomness", () => {
    expect(pickScenarioItems(evacuation, all, 6)).toEqual(pickScenarioItems(evacuation, all, 6));
  });
});

describe("a quiz draws at random", () => {
  it("draws exactly the length from the selected sections, without repeats", () => {
    for (const length of [10, 20, 30]) {
      const ids = pickQuizItems(all, length, seeded());
      expect(ids).toHaveLength(length);
      expect(new Set(ids).size).toBe(length);
    }
  });

  it("spreads the draw over the sections", () => {
    const ids = pickQuizItems(all, 10, seeded());
    const sections = new Set(
      ids.map((id) => questionsFor(all).find((question) => question.id === id)!.section),
    );
    expect(sections.size).toBe(10);
  });

  it("differs with another seed and never draws outside the sections", () => {
    const one = pickQuizItems(["S1", "S2"], 5, seeded());
    const other = pickQuizItems(["S1", "S2"], 5, () => 0.123);
    expect(one).not.toEqual(other);
    [...one, ...other].forEach((id) =>
      expect(["S1", "S2"]).toContain(questionsFor(all).find((q) => q.id === id)!.section),
    );
  });

  it("keeps the guide's order unless Shuffle questions is on", () => {
    const base = { mode: "quiz" as const, sections: all, length: 10 };
    const ordered = buildSession({ ...base, shuffle: false }, seeded());
    const bankOrder = questionsFor(all).map((question) => question.id);
    expect(ordered.itemIds).toEqual(
      [...ordered.itemIds].sort((a, b) => bankOrder.indexOf(a) - bankOrder.indexOf(b)),
    );
    const shuffled = buildSession({ ...base, shuffle: true }, seeded());
    expect([...shuffled.itemIds].sort()).toHaveLength(10);
    expect(shuffled.itemIds).not.toEqual(
      [...shuffled.itemIds].sort((a, b) => bankOrder.indexOf(a) - bankOrder.indexOf(b)),
    );
  });
});

describe("building a session", () => {
  it("builds a scenario session in story order for the chosen scenario", () => {
    const built = buildSession({ mode: "scenario", sections: all, length: 10, shuffle: true });
    expect(built.kind).toBe("scenario");
    expect(built.scenarioId).toBe(getScenario(undefined).id);
    expect(built.itemIds).toEqual(evacuation.map((step) => step.id));
  });

  it("builds the flood scenario as All 3", () => {
    const built = buildSession({
      mode: "scenario",
      scenarioId: "flood-preparedness-001",
      sections: ["F1", "F2", "F3", "F4", "F5", "F6", "F7"],
      length: 3,
      shuffle: false,
    });
    expect(built.itemIds).toEqual(["flood-s1", "flood-s2", "flood-s3"]);
  });

  it("limits the sections to the ones to repeat", () => {
    expect(onlyWeakSections(all, ["S6", "S3", "F2"])).toEqual(["S3", "S6"]);
    expect(onlyWeakSections(["S1"], [])).toEqual([]);
  });
});
