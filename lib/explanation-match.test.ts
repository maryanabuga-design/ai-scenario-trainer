import { describe, expect, it } from "vitest";
import {
  formatSelfCheck,
  prefillSelfCheck,
  selfCheckOf,
  sessionSelfCheck,
} from "@/lib/explanation-match";
import { scoreSession } from "@/lib/progress";
import { getStep, scenarios } from "@/lib/scenario";
import type { Answer } from "@/lib/session";
import { weakTopics } from "@/lib/weak-topics";

const allSteps = scenarios.flatMap((def) => def.steps);

const answer = (stepId: string, extra: Partial<Answer> = {}): Answer => ({
  stepId,
  optionId: "b",
  confidence: 3,
  explanation: "",
  ...extra,
});

describe("self-check pre-fill", () => {
  it("pre-checks every key point a full answer covers", () => {
    expect(
      prefillSelfCheck(
        getStep("s1"),
        "The alarm is real, so we take the stairs, not the lift, and leave our things behind.",
      ),
    ).toEqual([true, true, true]);
  });

  it("pre-checks only the points the sentence mentions", () => {
    expect(prefillSelfCheck(getStep("s1"), "We should use the stairs right away.")).toEqual([
      false,
      true,
      true,
    ]);
  });

  it("does not over-shorten words like bleed and need", () => {
    expect(
      prefillSelfCheck(getStep("s4"), "They bleed badly, so I press hard").every(Boolean),
    ).toBe(true);
  });

  it("ignores case and punctuation", () => {
    expect(
      prefillSelfCheck(getStep("s3"), "SMOKE RISES!!! Stay LOW, near the floor...").every(Boolean),
    ).toBe(true);
  });

  it("accepts simple variants and synonyms from the scenario", () => {
    expect(
      prefillSelfCheck(getStep("s4"), "Pressing on the wound stops the bleeding").every(Boolean),
    ).toBe(true);
    expect(
      prefillSelfCheck(getStep("s2"), "The door was warm, so we take another way").every(Boolean),
    ).toBe(true);
    expect(prefillSelfCheck(getStep("s5"), "Tell them where we are and who is injured")[1]).toBe(
      true,
    );
  });

  it("uses the flood scenario's explanation keywords", () => {
    expect(
      prefillSelfCheck(
        getStep("flood-s2"),
        "You cannot tell how deep it is, so the longer dry path is safer.",
      ).every(Boolean),
    ).toBe(true);
  });

  it("leaves every box unchecked for gibberish or an empty sentence", () => {
    expect(prefillSelfCheck(getStep("s6"), "asdf qwer zxcv").some(Boolean)).toBe(false);
    expect(prefillSelfCheck(getStep("s6"), "").some(Boolean)).toBe(false);
    expect(prefillSelfCheck(getStep("s6"), "  ... ").some(Boolean)).toBe(false);
  });

  it("has keywords for every key point of every step", () => {
    allSteps.forEach((step) => {
      expect(step.keyBeatKeywords).toHaveLength(step.explanationKeyBeats.length);
      step.keyBeatKeywords.forEach((keywords) => expect(keywords.length).toBeGreaterThan(0));
    });
  });

  it("every key point can be covered by its own wording", () => {
    allSteps.forEach((step) => {
      step.explanationKeyBeats.forEach((beat, index) => {
        expect(prefillSelfCheck(step, beat)[index], `${step.id}: ${beat}`).toBe(true);
      });
    });
  });
});

describe("self-check counts", () => {
  it("counts the user's own boxes, not the keyword match", () => {
    const check = selfCheckOf(
      answer("s1", { explanation: "asdf", selfCheck: [true, false, true] }),
    );
    expect(check).toEqual({ covered: 2, total: 3 });
    expect(formatSelfCheck(check)).toBe("2 of 3 points");
  });

  it("falls back to the pre-fill for answers saved before the self-check", () => {
    expect(
      selfCheckOf(answer("s1", { explanation: "We should use the stairs right away." })),
    ).toEqual({ covered: 2, total: 3 });
  });

  it("shows Skipped for a skipped step", () => {
    const check = selfCheckOf(answer("s1", { skipped: true }));
    expect(check).toBe("skipped");
    expect(formatSelfCheck(check)).toBe("Skipped");
  });

  it("sums a session over the explained steps and leaves skipped ones out", () => {
    expect(
      sessionSelfCheck([
        answer("s1", { selfCheck: [true, true, true] }),
        answer("s2", { skipped: true }),
        answer("s3", { selfCheck: [false, true] }),
      ]),
    ).toEqual({ covered: 4, total: 3 + getStep("s3").explanationKeyBeats.length });
  });

  it("is Skipped when every step was skipped, and null without steps", () => {
    expect(sessionSelfCheck([answer("s1", { skipped: true })])).toBe("skipped");
    expect(sessionSelfCheck([])).toBeNull();
  });

  it("never changes the score, error types or weak topics", () => {
    const base = [answer("s1"), answer("s2", { optionId: "a", confidence: 1 }), answer("s3")];
    const checked = base.map((item) => ({
      ...item,
      explanation: "Full answer",
      selfCheck: getStep(item.stepId).explanationKeyBeats.map(() => true),
    }));
    const skipped = base.map((item) => ({ ...item, skipped: true }));
    const score = (answers: Answer[]) => scoreSession({ mode: "short", answers, finishedAt: 0 });
    const plain = score(base);
    expect(score(checked)).toEqual(plain);
    expect(score(skipped)).toEqual(plain);
    expect(weakTopics(score(checked))).toEqual(weakTopics(plain));
    expect(weakTopics(score(skipped))).toEqual(weakTopics(plain));
  });
});
