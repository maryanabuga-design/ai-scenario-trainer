import { describe, expect, it } from "vitest";
import { modeItems } from "@/lib/parts";
import {
  amountOptions,
  drawMiniQuiz,
  fitAmount,
  MINI_QUIZ_AMOUNTS,
  miniQuizPool,
  miniQuizSections,
} from "@/lib/mini-quiz";
import { drawQuestions, shuffled } from "@/lib/quiz-draw";
import { getItem } from "@/lib/items";

/** A fixed "random" so a draw can be repeated. */
const seeded = (seed: number) => {
  let n = seed;
  return () => (n = (n * 48271) % 2147483647) / 2147483647;
};

const values = (pool: number) => amountOptions(pool).map((option) => option.value);

describe("the pool", () => {
  it("is the quiz questions of the selected topics, never scenarios or the flood guide", () => {
    expect(miniQuizPool(miniQuizSections)).toHaveLength(modeItems("quiz").length);
    const s1 = miniQuizPool(["S1"]);
    expect(s1.length).toBeGreaterThan(0);
    s1.forEach((question) => {
      expect(question.kind).toBe("question");
      expect(question.section).toBe("S1");
    });
    expect(miniQuizPool([])).toEqual([]);
    expect(miniQuizPool(["F1", "F2"])).toEqual([]);
  });

  it("covers the ten guide sections", () => {
    expect(miniQuizSections).toHaveLength(10);
  });
});

describe("the amounts follow the pool", () => {
  it("offers 5, 10 and 15 only when the pool is that big", () => {
    expect(MINI_QUIZ_AMOUNTS).toEqual([5, 10, 15]);
    expect(values(33)).toEqual([5, 10, 15]);
    expect(values(15)).toEqual([5, 10, 15]);
    expect(values(14)).toEqual([5, 10]);
    expect(values(10)).toEqual([5, 10]);
    expect(values(9)).toEqual([5]);
    expect(values(5)).toEqual([5]);
  });

  it("adds no extra option when the pool is not exactly an amount", () => {
    expect(values(12)).toEqual([5, 10]);
    expect(values(7)).toEqual([5]);
    expect(values(6)).toEqual([5]);
  });

  it("offers one option, All N, when the pool is smaller than 5", () => {
    expect(amountOptions(4)).toEqual([{ value: 4, label: "All 4" }]);
    expect(amountOptions(1)).toEqual([{ value: 1, label: "All 1" }]);
  });

  it("offers nothing when no topic is selected", () => {
    expect(amountOptions(0)).toEqual([]);
    expect(fitAmount(10, 0)).toBeNull();
  });

  it("defaults to the largest amount on offer", () => {
    expect(fitAmount(null, 33)).toBe(15);
    expect(fitAmount(null, 12)).toBe(10);
    expect(fitAmount(null, 7)).toBe(5);
    expect(fitAmount(null, 3)).toBe(3);
  });

  it("recomputes when the topics change: keeps a choice that is still offered, else the largest", () => {
    expect(fitAmount(10, 33)).toBe(10);
    expect(fitAmount(10, 12)).toBe(10);
    expect(fitAmount(10, 7)).toBe(5);
    expect(fitAmount(15, 12)).toBe(10);
    expect(fitAmount(5, 3)).toBe(3);
    // from "All 3" back to a bigger pool: 3 is not an amount, so the largest is chosen again
    expect(fitAmount(3, 12)).toBe(10);
  });

  it("follows the real topic selections", () => {
    const pool = (sections: string[]) => miniQuizPool(sections).length;
    // Whatever the content holds, the options are the ones the pool of the topics allows.
    for (const sections of [miniQuizSections, ["S1"], ["S1", "S2"], ["S1", "S2", "S3"]]) {
      const size = pool(sections);
      expect(values(size)).toEqual(
        size < 5 ? [size] : MINI_QUIZ_AMOUNTS.filter((amount) => amount <= size),
      );
    }
    expect(values(pool(miniQuizSections))).toEqual([5, 10, 15]);
  });
});

describe("the draw", () => {
  const sections = ["S1", "S2", "S3"];
  const pool = miniQuizPool(sections);

  it("has exactly the chosen number of different questions, only from the selected topics", () => {
    for (const count of [5, 10]) {
      const ids = drawMiniQuiz(sections, count, seeded(count));
      expect(ids).toHaveLength(count);
      expect(new Set(ids).size).toBe(count);
      ids.forEach((id) => expect(sections).toContain(getItem(id).section));
    }
  });

  it("is All N when the amount is the whole pool: every question once", () => {
    const small = ["S2"];
    const ids = drawMiniQuiz(small, miniQuizPool(small).length, seeded(3));
    expect(ids.sort()).toEqual(
      miniQuizPool(small)
        .map((question) => question.id)
        .sort(),
    );
  });

  it("never draws more than the pool holds, and nothing without topics", () => {
    expect(drawMiniQuiz(["S1"], 99, seeded(1))).toHaveLength(miniQuizPool(["S1"]).length);
    expect(drawMiniQuiz([], 5, seeded(1))).toEqual([]);
  });

  it("is in a different order on every start (seeded here)", () => {
    const first = drawMiniQuiz(sections, 10, seeded(11));
    const second = drawMiniQuiz(sections, 10, seeded(12));
    expect(first).not.toEqual(second);
    expect(drawMiniQuiz(sections, 10, seeded(11))).toEqual(first);
    const unseeded = new Set(Array.from({ length: 12 }, () => drawMiniQuiz(sections, 10).join()));
    expect(unseeded.size).toBeGreaterThan(1);
  });

  it("shuffles fairly: the same items, a new order, the original list untouched", () => {
    const list = Array.from({ length: 20 }, (_, index) => index);
    const mixed = shuffled(list, seeded(5));
    expect([...mixed].sort((a, b) => a - b)).toEqual(list);
    expect(mixed).not.toEqual(list);
    expect(list[0]).toBe(0);
    expect(drawQuestions(pool, 5, seeded(2))).toHaveLength(5);
  });
});
