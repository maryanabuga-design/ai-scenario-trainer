import { describe, expect, it } from "vitest";
import { questionSheet, stepSheet } from "@/lib/answer-sheet";
import type { SheetContent } from "@/lib/answer-sheet";
import { describeEffects } from "@/lib/outcome";
import { getQuestion, questions } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import type { Answer, QuizAnswer } from "@/lib/session";

const step = (stepId: string, extra: Partial<Answer> = {}): Answer => ({
  stepId,
  optionId: "b",
  confidence: 3,
  explanation: "",
  ...extra,
});

const quiz = (questionId: string, extra: Omit<QuizAnswer, "questionId" | "confidence">) => ({
  questionId,
  confidence: 3 as const,
  ...extra,
});

/** Every key anywhere in the sheet data, to prove what is never there. */
function keys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(keys);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => [key, ...keys(child)]);
  }
  return [];
}

function text(sheet: SheetContent) {
  return JSON.stringify(sheet);
}

describe("answer sheet for a scenario step", () => {
  it("right call: one box with your choice, the why, sources and what happened", () => {
    const sheet = stepSheet(getStep("s1"), step("s1", { explanation: "Use the stairs now." }));
    expect(sheet.verdict).toBe("right");
    expect(sheet.result).toBe("correct");
    expect(sheet.errorType).toBe("secure");
    expect(sheet.boxes).toEqual([
      { tone: "right", label: "Your choice", lines: [getStep("s1").options[1].text] },
    ]);
    expect(sheet.why).toHaveLength(1);
    expect(sheet.sources).toEqual(["S1"]);
    expect(sheet.whatHappened).toBe(getStep("s1").options[1].consequence);
    expect(sheet.stateChange).toEqual([]);
  });

  it("not the best action: your choice and the better choice, and the state change", () => {
    const sheet = stepSheet(getStep("s1"), step("s1", { optionId: "d" }));
    expect(sheet.verdict).toBe("wrong");
    expect(sheet.result).toBe("wrong");
    expect(sheet.errorType).toBe("misconception");
    expect(sheet.boxes.map((box) => [box.tone, box.label])).toEqual([
      ["wrong", "Your choice"],
      ["better", "Better choice"],
    ]);
    expect(sheet.stateChange).toEqual(["Time lost +1 min 30 s", "Smoke on the route +1"]);
  });

  it("shows the user's own sentence as a reflection, unchanged and never checked", () => {
    const sentence = "  We should use the stairs right away.  ";
    const sheet = stepSheet(getStep("s1"), step("s1", { explanation: sentence }));
    expect(sheet.explanation).toBe("We should use the stairs right away.");
    expect(keys(sheet)).not.toContain("points");
    expect(keys(sheet)).not.toContain("covered");
  });

  it("skip path: after I don't know there is no explanation block", () => {
    expect(stepSheet(getStep("s1"), step("s1", { skipped: true })).explanation).toBeNull();
    expect(stepSheet(getStep("s1"), step("s1")).explanation).toBeNull();
  });

  it("has a result and an error type for every option, and never a percentage or a score", () => {
    for (const optionId of ["a", "b", "c", "d"]) {
      const sheet = stepSheet(getStep("s2"), step("s2", { optionId, explanation: "Hot door." }));
      const all = keys(sheet);
      expect(["correct", "wrong"]).toContain(sheet.result);
      expect(sheet.errorType).toBe(optionId === "c" ? "secure" : "misconception");
      expect(all).not.toContain("score");
      expect(all).not.toContain("percent");
      expect(text(sheet)).not.toMatch(/%/);
    }
  });
});

describe("answer sheet for a quiz question", () => {
  it("single choice: right shows one box, wrong shows yours and the correct answer", () => {
    const question = getQuestion("q-s1-1");
    if (question.type !== "single") throw new Error("expected single choice");
    const right = questionSheet(
      question,
      quiz(question.id, { response: { type: "single", optionId: question.answer } }),
    );
    expect(right.verdict).toBe("right");
    expect(right.result).toBe("correct");
    expect(right.errorType).toBe("secure");
    expect(right.note).toBeNull();
    expect(right.boxes).toHaveLength(1);
    const other = question.options.find((option) => option.id !== question.answer)!;
    const wrong = questionSheet(
      question,
      quiz(question.id, { response: { type: "single", optionId: other.id } }),
    );
    expect(wrong.verdict).toBe("wrong");
    expect(wrong.boxes.map((box) => box.label)).toEqual(["Your answer", "Correct answer"]);
    expect(wrong.sources).toEqual([question.section]);
  });

  it("multiple choice: partly right, with how many are right and the correct answer", () => {
    const sheet = questionSheet(
      getQuestion("q-s1-3"),
      quiz("q-s1-3", { response: { type: "multiple", optionIds: ["a", "b", "c"] } }),
    );
    expect(sheet.verdict).toBe("partial");
    expect(sheet.result).toBe("partial");
    expect(sheet.detail).toBe("2 of 3 correct options chosen, 1 not correct");
    expect(sheet.boxes[1].lines).toHaveLength(3);
  });

  it("ordering: how many are in the right place, as numbered lists", () => {
    const sheet = questionSheet(
      getQuestion("q-s2-3"),
      quiz("q-s2-3", { response: { type: "ordering", order: ["a", "b", "d", "c"] } }),
    );
    expect(sheet.verdict).toBe("partial");
    expect(sheet.detail).toBe("2 of 4 in the right place");
    expect(sheet.boxes.every((box) => box.ordered)).toBe(true);
  });

  it("true or false uses the same sheet", () => {
    const question = getQuestion("q-s1-2");
    if (question.type !== "truefalse") throw new Error("expected true or false");
    const sheet = questionSheet(
      question,
      quiz(question.id, { response: { type: "truefalse", value: !question.answer } }),
    );
    expect(sheet.verdict).toBe("wrong");
    expect(sheet.boxes[1].lines).toEqual([question.answer ? "True" : "False"]);
  });

  it("short text: looks correct, or does not match with the override offered", () => {
    const right = questionSheet(
      getQuestion("q-s2-1"),
      quiz("q-s2-1", { response: { type: "text", text: "The back of my hand" } }),
    );
    expect(right.result).toBe("correct");
    expect(right.boxes.map((box) => box.label)).toEqual(["Your answer", "Reference answer"]);
    const rejected = questionSheet(
      getQuestion("q-s2-1"),
      quiz("q-s2-1", { response: { type: "text", text: "With my knuckles" } }),
    );
    expect(rejected.verdict).toBe("noMatch");
    expect(rejected.result).toBe("wrong");
    expect(rejected.note).toBe("Doesn't match our answer. Yours might still be right.");
    expect(rejected.canMarkCorrect).toBe(true);
  });

  it("short text marked correct by the user", () => {
    const sheet = questionSheet(
      getQuestion("q-s2-1"),
      quiz("q-s2-1", { response: { type: "text", text: "With my knuckles" }, markedCorrect: true }),
    );
    expect(sheet.verdict).toBe("marked");
    expect(sheet.result).toBe("correct");
    expect(sheet.note).toBe("Marked correct by you");
    expect(sheet.canMarkCorrect).toBe(false);
  });

  it("short text skip path: I don't know shows the reference answer and no override", () => {
    const sheet = questionSheet(getQuestion("q-s2-1"), {
      ...quiz("q-s2-1", { response: { type: "text", text: "" }, dontKnow: true }),
      confidence: null,
    });
    expect(sheet.verdict).toBe("dontKnow");
    expect(sheet.result).toBe("wrong");
    expect(sheet.errorType).toBeNull();
    expect(sheet.note).toBe("You said you don't know");
    expect(sheet.boxes.map((box) => box.label)).toEqual(["Reference answer"]);
    expect(sheet.canMarkCorrect).toBe(false);
  });

  it("shows the error type only with a confidence rating, and never a score", () => {
    questions.slice(0, 12).forEach((question) => {
      const response =
        question.type === "single"
          ? { type: "single" as const, optionId: "z" }
          : question.type === "multiple"
            ? { type: "multiple" as const, optionIds: [] }
            : question.type === "ordering"
              ? { type: "ordering" as const, order: question.items.map((item) => item.id) }
              : question.type === "text"
                ? { type: "text" as const, text: "nothing" }
                : { type: "truefalse" as const, value: true };
      const rated = questionSheet(question, quiz(question.id, { response }));
      const unrated = questionSheet(question, {
        ...quiz(question.id, { response }),
        confidence: null,
      });
      expect(rated.errorType).not.toBeNull();
      expect(unrated.errorType).toBeNull();
      const all = keys(rated);
      expect(all).not.toContain("score");
      expect(all).not.toContain("percent");
    });
  });
});

describe("state change", () => {
  it("describes time, levels and stability, and leaves out no change", () => {
    expect(describeEffects("s2", { timeLostSeconds: 30, smokeLevel: 2 })).toEqual([
      "Time lost +30 s",
      "Smoke on the route +2",
    ]);
    expect(describeEffects("s4", { casualtyStability: -1 })).toEqual(["Colleague's condition worsened"]);
    expect(describeEffects("flood-s2", { waterLevel: 1 })).toEqual(["Water level +1"]);
    expect(describeEffects("s1", {})).toEqual([]);
  });
});
