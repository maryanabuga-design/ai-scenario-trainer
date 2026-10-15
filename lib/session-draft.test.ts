import { describe, expect, it } from "vitest";
import { getQuestion } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import {
  emptyQuizDraft,
  emptyStepDraft,
  isQuizComplete,
  isStepComplete,
  quizAnswerFrom,
  quizDraftFrom,
  stepAnswerFrom,
  stepDraftFrom,
} from "@/lib/session-draft";

const step = getStep("s1");

describe("a scenario step", () => {
  it("is complete once an option and a confidence are chosen; the explanation never blocks", () => {
    expect(isStepComplete(emptyStepDraft)).toBe(false);
    expect(isStepComplete({ ...emptyStepDraft, optionId: "b" })).toBe(false);
    expect(isStepComplete({ optionId: "b", confidence: 2, explanation: "" })).toBe(true);
    expect(stepAnswerFrom(step, { ...emptyStepDraft, optionId: "b" })).toBeNull();
  });

  it("saves a skipped explanation as skipped", () => {
    expect(stepAnswerFrom(step, { optionId: "b", confidence: 2, explanation: "  " })).toMatchObject(
      {
        explanation: "",
        skipped: true,
        answerSource: "dont_know",
        explanationCheck: "skipped",
      },
    );
  });

  it("checks a typed explanation against the key beats and saves the verdict", () => {
    const matched = stepAnswerFrom(step, {
      optionId: "b",
      confidence: 3,
      explanation: "The alarm is real, so we take the stairs now.",
    });
    expect(matched).toMatchObject({ answerSource: "typed", explanationCheck: "matched" });
    const missed = stepAnswerFrom(step, { optionId: "b", confidence: 3, explanation: "лбтдлюью" });
    expect(missed?.explanationCheck).toBe("not_matched");
  });

  it("fills the screen again with the saved option, confidence and explanation", () => {
    const draft = { optionId: "c", confidence: 3 as const, explanation: "My own words here." };
    const saved = stepAnswerFrom(step, draft);
    expect(stepDraftFrom(saved ?? undefined)).toEqual(draft);
    expect(stepDraftFrom(undefined)).toEqual(emptyStepDraft);
  });
});

describe("a quiz question", () => {
  it("needs an answer; an untouched ordering counts as its listed order", () => {
    const single = getQuestion("q-s1-1");
    expect(isQuizComplete(emptyQuizDraft(single))).toBe(false);
    expect(isQuizComplete({ response: { type: "single", optionId: "a" }, confidence: null })).toBe(
      true,
    );
    expect(
      isQuizComplete({ response: { type: "multiple", optionIds: [] }, confidence: null }),
    ).toBe(false);
    expect(isQuizComplete({ response: { type: "text", text: "  " }, confidence: null })).toBe(
      false,
    );
    const ordering = getQuestion("q-s2-3");
    expect(isQuizComplete(emptyQuizDraft(ordering))).toBe(true);
  });

  it("counts I don't know as an answer, without confidence", () => {
    const text = getQuestion("q-s2-1");
    const draft = {
      response: { type: "text" as const, text: "" },
      confidence: null,
      dontKnow: true,
    };
    expect(isQuizComplete(draft)).toBe(true);
    expect(quizAnswerFrom(text, draft)).toMatchObject({
      dontKnow: true,
      answerSource: "dont_know",
    });
  });

  it("fills the screen again with the saved answer and confidence", () => {
    const question = getQuestion("q-s1-1");
    const draft = { response: { type: "single" as const, optionId: "b" }, confidence: 2 as const };
    const saved = quizAnswerFrom(question, draft);
    expect(quizDraftFrom(question, saved ?? undefined)).toEqual(draft);
  });
});
