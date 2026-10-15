import { describe, expect, it } from "vitest";
import floodBank from "@/content/question-bank-flood.json";
import bank from "@/content/quiz-bank.json";
import { getQuestion, questions, questionsFor } from "@/lib/quiz";

describe("the question banks", () => {
  it("has one pattern: 3 or 4 options (two for true or false), one correct answer", () => {
    questions.forEach((question) => {
      const trueFalse = question.options.map((option) => option.text).join() === "True,False";
      expect(question.options.length, question.id).toBeGreaterThanOrEqual(2);
      expect(question.options.length, question.id).toBeLessThanOrEqual(4);
      if (!trueFalse) expect(question.options.length, question.id).toBeGreaterThanOrEqual(3);
      expect(
        question.options.filter((option) => option.id === question.correctOptionId),
        question.id,
      ).toHaveLength(1);
      expect(new Set(question.options.map((option) => option.id)).size).toBe(
        question.options.length,
      );
    });
  });

  it("has the shared data shape and nothing from the removed question types", () => {
    questions.forEach((question) => {
      expect(question.kind).toBe("question");
      expect(question.why.length).toBeGreaterThan(0);
      expect(question.guideRef).toContain(question.section);
      expect(question.situation).toBeUndefined();
    });
    [...bank.questions, ...floodBank.questions].forEach((raw) => {
      expect([undefined, "single", "true-false"]).toContain((raw as { type?: string }).type);
      ["answer", "items", "accepted", "prompt", "correct", "correctOrder", "misconception"].forEach(
        (field) => expect(raw, `${raw.id} ${field}`).not.toHaveProperty(field),
      );
    });
  });

  it("keeps the ids: every guide section has questions and ids are unique", () => {
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
    expect(bank.questions.length).toBe(33);
    expect(floodBank.questions.length).toBe(10);
    ["q-s1-3", "q-s2-3", "q-s5-2", "q-s7-4", "q-s10-1", "flood-q4", "flood-q6"].forEach((id) =>
      expect(getQuestion(id).options.length).toBeGreaterThanOrEqual(3),
    );
    for (let n = 1; n <= 10; n++) expect(questionsFor([`S${n}`]).length).toBeGreaterThan(0);
  });

  it("finds the questions of some sections, and throws for an unknown id", () => {
    expect(questionsFor(["S1"]).every((question) => question.section === "S1")).toBe(true);
    expect(questionsFor([])).toEqual([]);
    expect(() => getQuestion("nope")).toThrow("Unknown question");
  });
});
