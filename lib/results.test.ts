import { describe, expect, it } from "vitest";
import { PASS_MARK } from "@/lib/config";
import { conclusion, isPassed, resultPercent } from "@/lib/results";
import { getItem } from "@/lib/items";
import { scoreItem } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";

const right = (id: string) => scoreItem(getItem(id), getItem(id).correctOptionId);
const wrong = (id: string) =>
  scoreItem(getItem(id), getItem(id).options.find((o) => o.id !== getItem(id).correctOptionId)!.id);

/** `rightCount` right answers out of `total`, using the quiz questions. */
function session(rightCount: number, total: number): ScoredItem[] {
  const ids = ["q-quiz-s01-001", "q-quiz-s01-002", "q-s2-1", "q-s2-2", "q-s3-1"].slice(0, total);
  return ids.map((id, index) => (index < rightCount ? right(id) : wrong(id)));
}

describe("conclusion sentence", () => {
  it("says every answer was right", () => {
    expect(conclusion(session(5, 5))).toBe("Every answer was right.");
  });

  it("counts the answers that need another look", () => {
    expect(conclusion(session(4, 5))).toBe("1 answer needs another look in the guide.");
    expect(conclusion(session(2, 5))).toBe("3 answers need another look in the guide.");
  });
});

describe("the pass mark", () => {
  it("is one constant, 80", () => {
    expect(PASS_MARK).toBe(80);
  });

  it("is a share of correct answers, rounded down", () => {
    expect(resultPercent(session(4, 5))).toBe(80);
    expect(resultPercent(session(3, 5))).toBe(60);
    expect(resultPercent([])).toBe(0);
    const third = [right("q-quiz-s01-001"), wrong("q-quiz-s01-002"), wrong("q-s2-1")];
    expect(resultPercent(third)).toBe(33);
  });

  it("passes at 80% and not at 79%", () => {
    expect(isPassed(session(4, 5))).toBe(true);
    expect(isPassed(session(3, 5))).toBe(false);
    // 79 right answers out of 100 is 79%, 80 out of 100 is 80%.
    const hundred = (rightCount: number) =>
      Array.from({ length: 100 }, (_, index) =>
        index < rightCount ? right("q-quiz-s01-001") : wrong("q-quiz-s01-001"),
      );
    expect(resultPercent(hundred(79))).toBe(79);
    expect(isPassed(hundred(79))).toBe(false);
    expect(isPassed(hundred(80))).toBe(true);
  });
});
