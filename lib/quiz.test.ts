import { describe, expect, it } from "vitest";
import {
  getQuestion,
  matchesKeywords,
  matchesText,
  pickQuestions,
  questions,
  questionsFor,
  scoreQuestion,
  scoreResponse,
} from "@/lib/quiz";

describe("question bank", () => {
  it("has at least 30 questions, every section of both guides and every question type", () => {
    expect(questions.length).toBeGreaterThanOrEqual(30);
    const sections = new Set(questions.map((question) => question.section));
    expect([...sections].filter((id) => id.startsWith("S"))).toHaveLength(10);
    expect([...sections].filter((id) => id.startsWith("F")).length).toBeGreaterThan(0);
    const types = new Set(questions.map((question) => question.type));
    expect([...types].sort()).toEqual(["multiple", "ordering", "single", "text", "truefalse"]);
  });

  it("gives every question a section reference, a misconception type and a why", () => {
    questions.forEach((question) => {
      expect(question.section).toMatch(/^(S([1-9]|10)|F[1-7])$/);
      expect(question.misconception.length).toBeGreaterThan(0);
      expect(question.why.length).toBeGreaterThan(0);
    });
  });

  it("only refers to options that exist", () => {
    questions.forEach((question) => {
      if (question.type === "single") {
        expect(question.options.map((option) => option.id)).toContain(question.answer);
      }
      if (question.type === "multiple") {
        question.answer.forEach((id) =>
          expect(question.options.map((option) => option.id)).toContain(id),
        );
      }
      if (question.type === "ordering") {
        expect([...question.answer].sort()).toEqual(question.items.map((item) => item.id).sort());
        expect(question.items.map((item) => item.id)).not.toEqual(question.answer);
      }
    });
  });
});

describe("scoring each question type", () => {
  it("single choice: 1 for the right option, 0 otherwise", () => {
    const question = getQuestion("q-s1-1");
    expect(scoreResponse(question, { type: "single", optionId: "b" })).toBe(1);
    expect(scoreResponse(question, { type: "single", optionId: "a" })).toBe(0);
  });

  it("true or false: 1 for the right value, 0 otherwise", () => {
    const question = getQuestion("q-s1-2");
    expect(scoreResponse(question, { type: "truefalse", value: false })).toBe(1);
    expect(scoreResponse(question, { type: "truefalse", value: true })).toBe(0);
  });

  it("multiple choice: partial credit, wrong picks take credit away, never below 0", () => {
    const question = getQuestion("q-s1-3"); // right: a, c, d
    expect(scoreResponse(question, { type: "multiple", optionIds: ["a", "c", "d"] })).toBe(1);
    expect(scoreResponse(question, { type: "multiple", optionIds: ["a", "c"] })).toBeCloseTo(2 / 3);
    expect(scoreResponse(question, { type: "multiple", optionIds: ["a", "b", "c"] })).toBeCloseTo(
      1 / 3,
    );
    expect(scoreResponse(question, { type: "multiple", optionIds: ["b"] })).toBe(0);
    expect(scoreResponse(question, { type: "multiple", optionIds: [] })).toBe(0);
  });

  it("ordering: partial credit for each item in the right place", () => {
    const question = getQuestion("q-s2-3"); // right: a, b, c, d
    expect(scoreResponse(question, { type: "ordering", order: ["a", "b", "c", "d"] })).toBe(1);
    expect(scoreResponse(question, { type: "ordering", order: ["a", "b", "d", "c"] })).toBe(0.5);
    expect(scoreResponse(question, { type: "ordering", order: ["d", "c", "b", "a"] })).toBe(0);
  });

  it("short text: uses the simulated text check", () => {
    const question = getQuestion("q-s2-1");
    expect(scoreResponse(question, { type: "text", text: "With the BACK of my hand." })).toBe(1);
    expect(scoreResponse(question, { type: "text", text: "my palm" })).toBe(0);
  });

  it("feeds error types: partial credit counts as not correct", () => {
    const question = getQuestion("q-s1-3");
    const partial = scoreQuestion(question, { type: "multiple", optionIds: ["a", "c"] }, 3);
    expect(partial.correct).toBe(false);
    expect(partial.errorType).toBe("misconception");
    expect(partial.sources).toEqual(["S1"]);
    const sureRight = scoreQuestion(
      question,
      { type: "multiple", optionIds: ["a", "c", "d"] },
      null,
    );
    expect(sureRight.errorType).toBe("secure");
    expect(sureRight.correctAnswer).toContain("Stop non-essential tasks");
  });
});

describe("text matching", () => {
  const accepted = ["back of your hand", "back of the hand"];

  it("accepts an accepted phrase inside a longer answer, ignoring case and punctuation", () => {
    expect(matchesText(accepted, "I'd use the Back of the hand, first.")).toBe(true);
  });

  it("accepts every word of a phrase in any order", () => {
    expect(matchesText(["name and last known location"], "last known location and name")).toBe(
      true,
    );
  });

  it("ignores simple plurals", () => {
    expect(matchesText(["add more layers"], "add more layer")).toBe(true);
    expect(matchesText(["aed"], "AEDs")).toBe(true);
  });

  it("rejects answers that miss part of every accepted phrase", () => {
    expect(matchesText(accepted, "with my hand")).toBe(false);
    expect(matchesText(["name and last known location"], "their name")).toBe(false);
  });

  it("rejects empty answers", () => {
    expect(matchesText(accepted, "")).toBe(false);
    expect(matchesText(accepted, "  ?! ")).toBe(false);
  });
});

describe("picking questions", () => {
  it("never asks for more than the chosen sections hold", () => {
    expect(pickQuestions(["S2"], 10)).toHaveLength(questionsFor(["S2"]).length);
  });

  it("takes from every chosen section and repeats no question", () => {
    const picked = pickQuestions(["S1", "S5", "S8"], 5);
    expect(picked).toHaveLength(5);
    expect(new Set(picked).size).toBe(5);
    const sections = new Set(picked.map((id) => getQuestion(id).section));
    expect(sections).toEqual(new Set(["S1", "S5", "S8"]));
  });
});

describe("flood question bank", () => {
  const flood = questions.filter((question) => question.id.startsWith("flood-"));

  it("has its 10 questions, with ids that never clash with the guide's", () => {
    expect(flood).toHaveLength(10);
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
  });

  it("maps every question type to the app's types", () => {
    expect(getQuestion("flood-q1")).toMatchObject({ type: "single", answer: "a", section: "F1" });
    expect(getQuestion("flood-q4")).toMatchObject({ type: "multiple", answer: ["a", "b", "c"] });
    expect(getQuestion("flood-q5")).toMatchObject({ type: "truefalse", answer: false });
    expect(getQuestion("flood-q6")).toMatchObject({
      type: "ordering",
      answer: ["a", "b", "c", "d"],
    });
  });

  it("never starts an ordering question already solved", () => {
    const question = getQuestion("flood-q6");
    expect(question.type === "ordering" && question.items.map((item) => item.id)).not.toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("checks short text by counting accepted keywords", () => {
    const question = getQuestion("flood-q8");
    expect(
      scoreResponse(question, { type: "text", text: "Because people assume someone else called." }),
    ).toBe(1);
    expect(scoreResponse(question, { type: "text", text: "It is quicker that way." })).toBe(0);
    expect(matchesKeywords(["named", "specific"], 2, "a specific, named person")).toBe(true);
    expect(matchesKeywords(["named", "specific"], 2, "a named person")).toBe(false);
    expect(matchesKeywords(["named"], 1, "")).toBe(false);
  });
});
