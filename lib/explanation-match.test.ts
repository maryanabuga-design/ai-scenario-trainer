import { describe, expect, it } from "vitest";
import { matchExplanation } from "@/lib/explanation-match";
import { getStep, scenarios } from "@/lib/scenario";

const allSteps = scenarios.flatMap((def) => def.steps);

describe("explanation match", () => {
  it("covers every key point with a full answer", () => {
    const match = matchExplanation(
      getStep("s1"),
      "The alarm is real, so we take the stairs, not the lift, and leave our things behind.",
    );
    expect(match.percent).toBe(100);
    expect(match.beats.every((beat) => beat.covered)).toBe(true);
  });

  it("gives a partial percentage and marks what is missing", () => {
    const match = matchExplanation(getStep("s1"), "We should use the stairs right away.");
    expect(match.percent).toBe(67);
    expect(match.beats.map((beat) => beat.covered)).toEqual([false, true, true]);
  });

  it("does not over-shorten words like bleed and need", () => {
    expect(matchExplanation(getStep("s4"), "They bleed badly, so I press hard").percent).toBe(100);
  });

  it("ignores case and punctuation", () => {
    const match = matchExplanation(getStep("s3"), "SMOKE RISES!!! Stay LOW, near the floor...");
    expect(match.percent).toBe(100);
  });

  it("accepts simple variants and synonyms from the scenario", () => {
    expect(
      matchExplanation(getStep("s4"), "Pressing on the wound stops the bleeding").percent,
    ).toBe(100);
    expect(
      matchExplanation(getStep("s2"), "The door was warm, so we take another way").percent,
    ).toBe(100);
    expect(
      matchExplanation(getStep("s5"), "Tell them where we are and who is injured").beats[1].covered,
    ).toBe(true);
  });

  it("uses the flood scenario's explanation keywords", () => {
    const match = matchExplanation(
      getStep("flood-s2"),
      "You cannot tell how deep it is, so the longer dry path is safer.",
    );
    expect(match.percent).toBe(100);
  });

  it("gives 0% for gibberish", () => {
    const match = matchExplanation(getStep("s6"), "asdf qwer zxcv");
    expect(match.percent).toBe(0);
    expect(match.beats.some((beat) => beat.covered)).toBe(false);
  });

  it("shows no percentage for an empty sentence", () => {
    expect(matchExplanation(getStep("s6"), "").percent).toBeNull();
    expect(matchExplanation(getStep("s6"), "  ... ").percent).toBeNull();
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
        expect(matchExplanation(step, beat).beats[index].covered, `${step.id}: ${beat}`).toBe(true);
      });
    });
  });
});
