import { describe, expect, it } from "vitest";
import { getItem } from "@/lib/items";
import { correctCount, currentWeakItems, scoreItem, weakItems, weakSections } from "@/lib/scoring";

// s1: b is right. s2: c is right. s3: a is right.
const right = scoreItem(getItem("q-scn-s01-001"), "b");
const wrong = scoreItem(getItem("q-scn-s01-001"), "a");

describe("binary grading", () => {
  it("is right when the chosen option is the correct one, and otherwise wrong", () => {
    expect(right.correct).toBe(true);
    expect(wrong.correct).toBe(false);
    for (const option of getItem("q-scn-s01-001").options) {
      expect(scoreItem(getItem("q-scn-s01-001"), option.id).correct).toBe(option.id === "b");
    }
  });

  it("works for a quiz question the same way, including true or false", () => {
    expect(scoreItem(getItem("q-quiz-s01-001"), "a").correct).toBe(true);
    expect(scoreItem(getItem("q-quiz-s01-001"), "b").correct).toBe(false);
    expect(scoreItem(getItem("q-quiz-s01-002"), "b").correct).toBe(true);
  });

  it("keeps the choice, the correct option, the section and the full prompt", () => {
    expect(wrong).toMatchObject({
      id: "q-scn-s01-001",
      kind: "step",
      section: "S1",
      guideRef: ["S1"],
      chosenOptionId: "a",
      correctOptionId: "b",
      title: "The alarm sounds",
    });
    expect(wrong.prompt).toContain(getItem("q-scn-s01-001").situation);
    expect(wrong.prompt).toContain(getItem("q-scn-s01-001").question);
    expect(scoreItem(getItem("q-quiz-s01-001"), "a").title).toBe(
      getItem("q-quiz-s01-001").question,
    );
  });

  it("has no error type, confidence or partial score anywhere", () => {
    expect(Object.keys(right).sort()).toEqual(
      [
        "chosenOptionId",
        "correct",
        "correctOptionId",
        "guideRef",
        "id",
        "image",
        "kind",
        "prompt",
        "section",
        "title",
      ].sort(),
    );
  });
});

describe("weak answers", () => {
  const items = [
    scoreItem(getItem("q-scn-s01-001"), "d"),
    scoreItem(getItem("s2"), "c"),
    scoreItem(getItem("s4"), "a"),
    scoreItem(getItem("s5"), "a"),
  ];

  it("counts the right answers and lists the wrong ones", () => {
    expect(correctCount(items)).toBe(1);
    expect(weakItems(items).map((item) => item.id)).toEqual(["q-scn-s01-001", "s4", "s5"]);
  });

  it("names the guide sections with a wrong answer, once each", () => {
    expect(weakSections(items)).toEqual(["S1", "S6", "S5"]);
    expect(weakSections([...items, scoreItem(getItem("q-scn-s01-011"), "a")])).toEqual([
      "S1",
      "S6",
      "S5",
    ]);
  });

  it("lets a later right answer clear an earlier wrong one", () => {
    const later = [...items, scoreItem(getItem("q-scn-s01-001"), "b")];
    expect(currentWeakItems(later).map((item) => item.id)).toEqual(["s4", "s5"]);
    expect(
      currentWeakItems([...later, scoreItem(getItem("q-scn-s01-001"), "a")]).map((item) => item.id),
    ).toContain("q-scn-s01-001");
  });
});
