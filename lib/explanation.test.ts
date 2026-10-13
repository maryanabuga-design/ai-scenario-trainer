import { afterEach, describe, expect, it, vi } from "vitest";
import { explanationOutcome, simulatedFeedback } from "@/lib/feedback";
import { getStep, scenarios } from "@/lib/scenario";
import { saveSession } from "@/lib/session";
import type { Answer, ScenarioSession } from "@/lib/session";
import { createStore } from "@/lib/store";

const check = (stepId: string, text: string) =>
  simulatedFeedback.checkExplanation(getStep(stepId), text);

describe("checking the typed explanation", () => {
  it("matches a sentence of at least 3 words with a keyword of a key beat", () => {
    expect(check("s1", "The alarm is real, so we take the stairs.")).toBe("matched");
    expect(check("s2", "The door is hot so we go another way")).toBe("matched");
  });

  it("ignores case and punctuation", () => {
    expect(check("s1", "STAIRS!!! Not the lift, NOW.")).toBe("matched");
    expect(check("s9", "I would not hang up, I'd stay on the line.")).toBe("matched");
  });

  it("never matches one word, random letters or another language", () => {
    expect(check("s1", "stairs")).toBe("not_matched");
    expect(check("s1", "лбтдлюью")).toBe("not_matched");
    expect(check("s1", "asdf qwer zxcv uiop")).toBe("not_matched");
    expect(check("s1", "Треба негайно йти сходами вниз")).toBe("not_matched");
  });

  it("matches keywords only at the start of a word", () => {
    // "now" is a keyword of s1, but "know" must not count.
    expect(check("s1", "I do not know what to say here")).toBe("not_matched");
  });

  it("counts an empty explanation as skipped", () => {
    expect(check("s1", "   ")).toBe("skipped");
  });

  it("accepts every reference explanation for its own step", () => {
    scenarios
      .flatMap((def) => def.steps)
      .forEach((step) =>
        expect(simulatedFeedback.checkExplanation(step, step.referenceExplanation), step.id).toBe(
          "matched",
        ),
      );
  });
});

describe("the stored outcome", () => {
  const typed: Answer = { stepId: "s1", optionId: "b", confidence: 3, explanation: "лбтдлюью" };

  it("is matched, not_matched or skipped, and worked out for older answers", () => {
    expect(explanationOutcome(getStep("s1"), typed)).toBe("not_matched");
    expect(explanationOutcome(getStep("s1"), { ...typed, explanation: "", skipped: true })).toBe(
      "skipped",
    );
    expect(explanationOutcome(getStep("s1"), { ...typed, explanationCheck: "matched" })).toBe(
      "matched",
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("survives a reload", () => {
    const saved = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => saved.get(key) ?? null,
        setItem: (key: string, value: string) => saved.set(key, value),
        removeItem: (key: string) => saved.delete(key),
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    });
    const session: ScenarioSession = {
      mode: "short",
      stepIds: ["s1", "s2", "s3"],
      index: 0,
      phase: "feedback",
      finished: false,
      answers: [{ ...typed, explanationCheck: "not_matched", answerSource: "typed" }],
    };
    saveSession(session);
    const reloaded = createStore<ScenarioSession>("ast.session.v1").read();
    expect(reloaded?.answers[0].explanationCheck).toBe("not_matched");
  });
});
