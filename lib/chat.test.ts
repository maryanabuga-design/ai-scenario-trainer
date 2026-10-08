import { describe, expect, it } from "vitest";
import {
  deferredText,
  matchQuestion,
  notCoveredId,
  notCoveredText,
  replyToChip,
  suggestedChips,
} from "@/lib/chat";
import { getStep, scenario } from "@/lib/scenario";

describe("keyword matching", () => {
  it("answers a free question from the prepared pair with the most matching keywords", () => {
    const reply = matchQuestion(getStep("s1"), "Why can't we just use the lift?", "feedback");
    expect(reply).toEqual({
      kind: "answer",
      text: getStep("s1").chat.find((entry) => entry.id === "s1-elevator")?.answer,
      sources: ["S1"],
    });
  });

  it("matches longer word forms and is not case sensitive", () => {
    const reply = matchQuestion(getStep("s4"), "What about LIFTING the cloth?", "feedback");
    expect(reply.kind).toBe("answer");
    expect(reply.sources).toEqual(["S7"]);
  });

  it("matches phrases made of several words", () => {
    const reply = matchQuestion(getStep("s6"), "Can I go back in for them?", "feedback");
    expect(reply.kind).toBe("answer");
    expect(reply.sources).toEqual(["S4"]);
  });

  it("answers neutral questions on the decision step", () => {
    const reply = matchQuestion(getStep("s5"), "What number do I dial?", "decide");
    expect(reply).toMatchObject({ kind: "answer", sources: ["S5"] });
  });

  it("defers a question that would reveal the answer until after feedback", () => {
    const step = getStep("s1");
    const reply = matchQuestion(step, "Should we take the elevator?", "decide");
    expect(reply).toEqual({ kind: "deferred", sources: step.sources });
    expect(deferredText).toMatch(/after you check your answer/);
  });
});

describe("not-covered fallback", () => {
  it("answers an unmatched question with not covered and the step's guide sections", () => {
    const step = getStep("s2");
    const reply = matchQuestion(step, "How long does a fire brigade take to arrive?", "decide");
    expect(reply).toEqual({ kind: "notCovered", sources: step.sources });
    expect(notCoveredText).toBe("This is not covered by the material.");
  });

  it("answers an empty or unrelated question with not covered", () => {
    expect(matchQuestion(getStep("s3"), "", "feedback").kind).toBe("notCovered");
    expect(matchQuestion(getStep("s3"), "zzz qqq", "feedback").kind).toBe("notCovered");
  });

  it("treats the smoke step's cloth question as not covered, with the closest section", () => {
    const step = getStep("s3");
    expect(matchQuestion(step, "Is a wet towel a good filter?", "decide")).toEqual({
      kind: "notCovered",
      sources: ["S3"],
    });
    expect(replyToChip(step, notCoveredId(step), "feedback")).toEqual({
      kind: "notCovered",
      sources: ["S3"],
    });
  });
});

describe("suggested chips", () => {
  it("offers 3 or 4 chips on every step, before and after feedback", () => {
    scenario.steps.forEach((step) => {
      const before = suggestedChips(step, "decide", []);
      const after = suggestedChips(step, "feedback", []);
      expect(before.length).toBeGreaterThanOrEqual(3);
      expect(before.length).toBeLessThanOrEqual(4);
      expect(after.length).toBeGreaterThanOrEqual(3);
      expect(after.length).toBeLessThanOrEqual(4);
    });
  });

  it("hides a chip once it has been asked", () => {
    const step = getStep("s1");
    const [first] = suggestedChips(step, "decide", []);
    expect(suggestedChips(step, "decide", [first.id]).map((chip) => chip.id)).not.toContain(
      first.id,
    );
  });
});

describe("decision step answers never reveal the correct option", () => {
  const words = (text: string) => new Set(text.toLowerCase().match(/[a-z]{5,}/g) ?? []);

  scenario.steps.forEach((step) => {
    const correct = step.options.find((option) => option.correct);
    const wrongWords = new Set(
      step.options.filter((option) => !option.correct).flatMap((option) => [...words(option.text)]),
    );
    // Words that appear only in the correct option would point to it.
    const giveaways = [...words(correct?.text ?? "")].filter((word) => !wrongWords.has(word));
    const visible = step.chat.filter((entry) => entry.availability === "always");
    const chipIds = suggestedChips(step, "decide", []).map((chip) => chip.id);

    it(`${step.id}: only neutral answers are visible before feedback`, () => {
      chipIds.forEach((id) => {
        const reply = replyToChip(step, id, "decide");
        expect(reply.kind).not.toBe("deferred");
      });
      visible.forEach((entry) => {
        const answer = entry.answer.toLowerCase();
        expect(answer).not.toContain(correct?.text.toLowerCase());
        expect(answer).not.toContain(correct?.why.toLowerCase());
        step.explanationKeyBeats.forEach((beat) => expect(answer).not.toContain(beat));
        giveaways.forEach((word) => expect(words(entry.answer).has(word), word).toBe(false));
        expect(answer).not.toMatch(
          /\b(correct|right answer|best option|best choice|option [a-d])\b/,
        );
      });
    });

    it(`${step.id}: every free question on the decision step gets a neutral reply`, () => {
      step.chat
        .filter((entry) => entry.availability === "afterFeedback")
        .forEach((entry) => {
          expect(matchQuestion(step, entry.question, "decide").kind).toBe("deferred");
        });
    });
  });
});

describe("every prepared answer", () => {
  it("has at least one guide section that exists", () => {
    scenario.steps.forEach((step) =>
      step.chat.forEach((entry) => {
        expect(entry.sources.length).toBeGreaterThan(0);
        entry.sources.forEach((sectionId) => expect(sectionId).toMatch(/^S([1-9]|10)$/));
      }),
    );
  });
});
