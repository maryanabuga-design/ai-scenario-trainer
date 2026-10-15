import { describe, expect, it } from "vitest";
import { getItem } from "@/lib/items";
import { correctCount, currentWeakItems, scoreItem, weakItems, weakSections } from "@/lib/scoring";

// s1: b is right. s2: c is right. s3: a is right.
const right = scoreItem(getItem("s1"), "b");
const wrong = scoreItem(getItem("s1"), "d");

describe("binary grading", () => {
  it("is right when the chosen option is the correct one, and otherwise wrong", () => {
    expect(right.correct).toBe(true);
    expect(wrong.correct).toBe(false);
    for (const option of getItem("s1").options) {
      expect(scoreItem(getItem("s1"), option.id).correct).toBe(option.id === "b");
    }
  });

  it("works for a quiz question the same way, including true or false", () => {
    expect(scoreItem(getItem("q-s1-1"), "b").correct).toBe(true);
    expect(scoreItem(getItem("q-s1-1"), "a").correct).toBe(false);
    expect(scoreItem(getItem("q-s1-2"), "b").correct).toBe(true);
  });

  it("keeps the choice, the correct option, the section and the full prompt", () => {
    expect(wrong).toMatchObject({
      id: "s1",
      kind: "step",
      section: "S1",
      guideRef: ["S1"],
      chosenOptionId: "d",
      correctOptionId: "b",
      title: "The alarm sounds",
    });
    expect(wrong.prompt).toContain(getItem("s1").situation);
    expect(wrong.prompt).toContain(getItem("s1").question);
    expect(scoreItem(getItem("q-s1-1"), "a").title).toBe(getItem("q-s1-1").question);
  });

  it("has no error type, confidence or partial score anywhere", () => {
    expect(Object.keys(right).sort()).toEqual(
      [
        "chosenOptionId",
        "correct",
        "correctOptionId",
        "guideRef",
        "id",
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
    scoreItem(getItem("s1"), "d"),
    scoreItem(getItem("s2"), "c"),
    scoreItem(getItem("s4"), "a"),
    scoreItem(getItem("s5"), "a"),
  ];

  it("counts the right answers and lists the wrong ones", () => {
    expect(correctCount(items)).toBe(1);
    expect(weakItems(items).map((item) => item.id)).toEqual(["s1", "s4", "s5"]);
  });

  it("names the guide sections with a wrong answer, once each", () => {
    expect(weakSections(items)).toEqual(["S1", "S6", "S5"]);
    expect(weakSections([...items, scoreItem(getItem("s7"), "a")])).toEqual(["S1", "S6", "S5"]);
  });

  it("lets a later right answer clear an earlier wrong one", () => {
    const later = [...items, scoreItem(getItem("s1"), "b")];
    expect(currentWeakItems(later).map((item) => item.id)).toEqual(["s4", "s5"]);
    expect(
      currentWeakItems([...later, scoreItem(getItem("s1"), "a")]).map((item) => item.id),
    ).toContain("s1");
  });
});
