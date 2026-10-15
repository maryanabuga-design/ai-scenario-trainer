import { describe, expect, it } from "vitest";
import { EXAM_MINUTES, EXAM_QUESTIONS, EXAM_WARNING_MINUTES } from "@/lib/config";
import { drawExam, examResults, formatClock, isTimeWarning, secondsLeft } from "@/lib/exam";
import { findItem } from "@/lib/items";
import { modeItems, trainingSections } from "@/lib/parts";
import type { FinishedSession } from "@/lib/session";

/** A small seeded random generator so the draws are repeatable. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const scenarioIds = new Set(modeItems("scenario").map((item) => item.id));

describe("the exam constants", () => {
  it("are 20 questions, 20 minutes and a 2 minute warning", () => {
    expect(EXAM_QUESTIONS).toBe(20);
    expect(EXAM_MINUTES).toBe(20);
    expect(EXAM_WARNING_MINUTES).toBe(2);
  });
});

describe("the exam questions", () => {
  it("are EXAM_QUESTIONS different questions", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const ids = drawExam(seeded(seed));
      expect(ids).toHaveLength(EXAM_QUESTIONS);
      expect(new Set(ids).size).toBe(EXAM_QUESTIONS);
      ids.forEach((id) => expect(findItem(id)).toBeDefined());
    }
  });

  it("cover every topic of the guide when possible", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const sections = new Set(drawExam(seeded(seed)).map((id) => findItem(id)!.section));
      expect([...sections].sort()).toEqual([...trainingSections].sort());
    }
  });

  it("mix scenario and quiz questions half and half", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const ids = drawExam(seeded(seed));
      expect(ids.filter((id) => scenarioIds.has(id))).toHaveLength(10);
      expect(ids.filter((id) => !scenarioIds.has(id))).toHaveLength(10);
    }
  });

  it("come in a different order and mix on different draws", () => {
    expect(drawExam(seeded(1))).not.toEqual(drawExam(seeded(2)));
    expect([...drawExam(seeded(1))].sort()).not.toEqual([...drawExam(seeded(2))].sort());
  });

  it("use every question when there are fewer than asked for", () => {
    const all = drawExam(seeded(3), 500);
    expect(all).toHaveLength(modeItems("scenario").length + modeItems("quiz").length);
    expect(new Set(all).size).toBe(all.length);
  });

  it("take one of each topic first when the count is smaller than the topics", () => {
    const ids = drawExam(seeded(4), 6);
    expect(ids).toHaveLength(6);
    expect(new Set(ids.map((id) => findItem(id)!.section)).size).toBe(6);
  });
});

describe("the timer", () => {
  const endsAt = 1_000_000 + EXAM_MINUTES * 60_000;

  it("counts down and never goes below 0", () => {
    expect(secondsLeft(endsAt, 1_000_000)).toBe(1200);
    expect(secondsLeft(endsAt, 1_000_000 + 1000)).toBe(1199);
    expect(secondsLeft(endsAt, endsAt - 1)).toBe(1);
    expect(secondsLeft(endsAt, endsAt)).toBe(0);
    expect(secondsLeft(endsAt, endsAt + 5000)).toBe(0);
  });

  it("is written mm:ss", () => {
    expect(formatClock(1200)).toBe("20:00");
    expect(formatClock(125)).toBe("02:05");
    expect(formatClock(0)).toBe("00:00");
  });

  it("turns to warning in the last 2 minutes", () => {
    expect(isTimeWarning(121)).toBe(false);
    expect(isTimeWarning(120)).toBe(true);
    expect(isTimeWarning(0)).toBe(true);
  });
});

describe("the exam results", () => {
  const exam = (at: number, percent: number): FinishedSession => ({
    kind: "exam",
    itemIds: [],
    answers: [],
    finishedAt: at,
    exam: { percent, questions: 20, timeUsedSeconds: 600 },
  });

  it("are empty when no exam was taken", () => {
    expect(examResults(null)).toEqual({ last: null, best: null });
    expect(examResults([{ ...exam(1, 50), exam: undefined }])).toEqual({ last: null, best: null });
  });

  it("find the last and the best exam", () => {
    const { last, best } = examResults([exam(2, 85), exam(5, 60), exam(1, 70)]);
    expect(last).toMatchObject({ percent: 60, finishedAt: 5 });
    expect(best).toMatchObject({ percent: 85, finishedAt: 2 });
  });
});
