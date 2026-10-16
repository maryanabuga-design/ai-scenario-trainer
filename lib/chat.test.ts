import { describe, expect, it } from "vitest";
import {
  matchQuestion,
  notCoveredId,
  notCoveredText,
  replyToChip,
  suggestedChips,
} from "@/lib/chat";
import { getStep, scenario } from "@/lib/scenario";

describe("keyword matching", () => {
  it("answers a free question from the prepared pair with the most matching keywords", () => {
    const entry = getStep("s2").chat?.find((candidate) => candidate.id === "s2-check-door");
    const reply = matchQuestion(getStep("s2"), "How do I feel the door with my hand to check it?");
    expect(reply).toEqual({ kind: "answer", text: entry?.answer, sources: entry?.sources });
  });

  it("matches longer word forms and is not case sensitive", () => {
    const reply = matchQuestion(getStep("s4"), "What about LIFTING the cloth?");
    expect(reply.kind).toBe("answer");
    expect(reply.sources).toEqual(["S7"]);
  });

  it("matches phrases made of several words", () => {
    const reply = matchQuestion(getStep("s6"), "Can I go back in for them?");
    expect(reply.kind).toBe("answer");
    expect(reply.sources).toEqual(["S4"]);
  });

  it("answers a question about the situation", () => {
    const reply = matchQuestion(getStep("s5"), "What number do I dial?");
    expect(reply).toMatchObject({ kind: "answer", sources: ["S5"] });
  });
});

describe("not-covered fallback", () => {
  it("answers an unmatched question with not covered and the step's guide sections", () => {
    const step = getStep("s2");
    const reply = matchQuestion(step, "How long does a fire brigade take to arrive?");
    expect(reply).toEqual({ kind: "notCovered", sources: step.guideRef });
    expect(notCoveredText).toBe("This is not covered by the material.");
  });

  it("answers an empty or unrelated question with not covered", () => {
    expect(matchQuestion(getStep("s3"), "").kind).toBe("notCovered");
    expect(matchQuestion(getStep("s3"), "zzz qqq").kind).toBe("notCovered");
  });

  it("treats the smoke step's cloth question as not covered, with the closest section", () => {
    const step = getStep("s3");
    expect(matchQuestion(step, "Is a wet towel a good filter?")).toEqual({
      kind: "notCovered",
      sources: ["S3"],
    });
    expect(replyToChip(step, notCoveredId(step))).toEqual({
      kind: "notCovered",
      sources: ["S3"],
    });
  });
});

describe("suggested chips", () => {
  it("offers 3 or 4 chips on every step", () => {
    scenario.steps.forEach((step) => {
      const chips = suggestedChips(step, []);
      expect(chips.length).toBeGreaterThanOrEqual(3);
      expect(chips.length).toBeLessThanOrEqual(4);
    });
  });

  it("keeps the not-covered question among the chips after the answer", () => {
    const step = getStep("s3");
    expect(suggestedChips(step, []).map((chip) => chip.id)).toContain(notCoveredId(step));
  });

  it("hides a chip once it has been asked", () => {
    const step = getStep("q-scn-s01-001");
    const [first] = suggestedChips(step, []);
    expect(suggestedChips(step, [first.id]).map((chip) => chip.id)).not.toContain(first.id);
  });
});

describe("every prepared answer", () => {
  it("has at least one guide section that exists", () => {
    scenario.steps.forEach((step) =>
      (step.chat ?? []).forEach((entry) => {
        expect(entry.sources.length).toBeGreaterThan(0);
        entry.sources.forEach((sectionId) => expect(sectionId).toMatch(/^S([1-9]|10)$/));
      }),
    );
  });
});
