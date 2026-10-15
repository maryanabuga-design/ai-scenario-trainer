import { describe, expect, it } from "vitest";
import { loadAllSections } from "@/lib/guide";
import { hintFor } from "@/lib/items";
import type { Item } from "@/lib/items";
import { questions } from "@/lib/quiz";
import { scenarios } from "@/lib/scenario";

const steps = scenarios.flatMap((def) => def.steps);
const all = [...steps, ...questions];
const sections = loadAllSections();
const titleOf = (id: string) => sections.find((section) => section.id === id)?.title;

describe("question validation", () => {
  it("gives every scenario question exactly 3 options", () => {
    steps.forEach((step) => expect(step.options, step.id).toHaveLength(3));
  });

  it("gives a quiz question 3 or 4 options, or 2 for true-false", () => {
    questions.forEach((question) => {
      if (question.type === "true-false") {
        expect(
          question.options.map((option) => option.text),
          question.id,
        ).toEqual(["True", "False"]);
      } else {
        expect(question.options.length, question.id).toBeGreaterThanOrEqual(3);
        expect(question.options.length, question.id).toBeLessThanOrEqual(4);
      }
    });
  });

  it("marks every True/False question as true-false, and nothing else", () => {
    questions.forEach((question) => {
      const twoOptions = question.options.length === 2;
      expect(question.type === "true-false", question.id).toBe(twoOptions);
    });
    expect(questions.filter((question) => question.type === "true-false").length).toBeGreaterThan(
      0,
    );
    steps.forEach((step) => expect(step.type ?? "single").toBe("single"));
  });

  it("has a correct option that exists among the options, for every question", () => {
    all.forEach((item) => {
      expect(
        item.options.map((option) => option.id),
        item.id,
      ).toContain(item.correctOptionId);
    });
  });
});

describe("hints never reveal the answer", () => {
  const normal = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

  it("never contain the exact text of the correct option", () => {
    all.forEach((item) => {
      const correct = item.options.find((option) => option.id === item.correctOptionId)!;
      const hint = hintFor(item, titleOf);
      if (!hint) return;
      expect(normal(hint.text), item.id).not.toContain(normal(correct.text));
      expect(normal(correct.text), item.id).not.toContain(normal(hint.text));
    });
  });

  it("fail the check when a hint does quote the correct option", () => {
    const step = steps[0];
    const correct = step.options.find((option) => option.id === step.correctOptionId)!;
    const leaky = hintFor({ ...step, hint: `The answer: ${correct.text}` }, titleOf)!;
    expect(normal(leaky.text)).toContain(normal(correct.text));
  });

  it("gives every scenario question a hint of its own, written as a reminder", () => {
    steps.forEach((step) => {
      expect(step.hint?.length, step.id).toBeGreaterThan(20);
      expect(step.hint, step.id).not.toMatch(
        /the answer is|correct (answer|option)|choose (a|b|c)\b/i,
      );
    });
  });
});

describe("the hint of a question", () => {
  const base: Item = {
    id: "x",
    kind: "question",
    section: "S2",
    question: "Q?",
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
    ],
    correctOptionId: "a",
    why: "Because.",
    guideRef: ["S2"],
  };

  it("uses the hint of the question, and points to its first guide section", () => {
    expect(hintFor({ ...base, hint: "Think about doors." }, titleOf)).toEqual({
      text: "Think about doors.",
      section: "S2",
    });
  });

  it("falls back to Review: and the section title when there is no hint", () => {
    const hint = hintFor(base, titleOf);
    expect(hint?.text).toBe(`Review: ${titleOf("S2")}`);
    expect(hint?.text).toMatch(/^Review: .+/);
    expect(hint?.section).toBe("S2");
    expect(hintFor({ ...base, guideRef: ["Z9"] }, titleOf)?.text).toBe("Review: Z9");
  });

  it("is absent when there is neither a hint nor a guide section", () => {
    expect(hintFor({ ...base, guideRef: [] }, titleOf)).toBeNull();
    expect(hintFor({ ...base, guideRef: [], hint: "Think." }, titleOf)).toEqual({
      text: "Think.",
      section: null,
    });
  });

  it("gives every quiz question at least the fallback", () => {
    questions.forEach((question) => expect(hintFor(question, titleOf), question.id).not.toBeNull());
  });
});
