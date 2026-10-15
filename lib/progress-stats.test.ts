import { describe, expect, it } from "vitest";
import {
  guidePracticed,
  guideStats,
  progressSummary,
  sectionStats,
  sessionStats,
  trendSessions,
} from "@/lib/progress-stats";
import type { FinishedSession } from "@/lib/session";

const day = (n: number) => Date.UTC(2026, 9, n, 9);

const session = (finishedAt: number, picks: [string, string][]): FinishedSession => ({
  kind: "scenario",
  itemIds: picks.map(([id]) => id),
  answers: picks.map(([itemId, optionId]) => ({ itemId, optionId })),
  finishedAt,
});

/** s1: b right. s2: c right. s3: a right. */
const bad = session(day(1), [
  ["s1", "d"],
  ["s2", "a"],
  ["s3", "b"],
]);
const good = session(day(2), [
  ["s1", "b"],
  ["s2", "c"],
  ["s3", "a"],
]);

describe("per-session results", () => {
  it("gives each session its correct count, total and percent, oldest first", () => {
    expect(sessionStats([good, bad])).toEqual([
      { finishedAt: day(1), correct: 0, total: 3, percent: 0 },
      { finishedAt: day(2), correct: 3, total: 3, percent: 100 },
    ]);
  });

  it("rounds the percent", () => {
    const two = session(day(3), [
      ["s1", "b"],
      ["s2", "c"],
      ["s3", "b"],
    ]);
    expect(sessionStats([two])[0]).toMatchObject({ correct: 2, percent: 67 });
  });

  it("keeps the last 6 sessions for the chart, still oldest first", () => {
    const many = Array.from({ length: 9 }, (_, index) => ({ ...good, finishedAt: day(index + 1) }));
    const trend = trendSessions(many);
    expect(trend).toHaveLength(6);
    expect(trend[0].finishedAt).toBe(day(4));
    expect(trend[5].finishedAt).toBe(day(9));
  });
});

describe("the summary", () => {
  it("counts sessions, averages the percents and shares the correct answers", () => {
    expect(progressSummary([bad, good])).toEqual({
      sessions: 2,
      averagePercent: 50,
      correctPercent: 50,
    });
  });

  it("works with one session and has no numbers without sessions", () => {
    expect(progressSummary([good])).toMatchObject({ sessions: 1, correctPercent: 100 });
    expect(progressSummary([])).toEqual({
      sessions: 0,
      averagePercent: null,
      correctPercent: null,
    });
  });
});

describe("guide sections", () => {
  it("counts correct and total answers for every section a question cites", () => {
    const stats = sectionStats([bad, good], ["S1", "S2", "S3"]);
    expect(stats.find((entry) => entry.id === "S1")).toEqual({ id: "S1", correct: 1, total: 2 });
    expect(stats.find((entry) => entry.id === "S2")).toMatchObject({ total: 4 });
  });

  it("leaves a section nobody practised at zero", () => {
    expect(sectionStats([good], ["S9"])).toEqual([{ id: "S9", correct: 0, total: 0 }]);
    expect(sectionStats([], ["S1", "S2"]).every((entry) => entry.total === 0)).toBe(true);
  });
});

describe("a guide's answers and how much of it is practised", () => {
  const evacuation = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];

  it("counts all answers to the guide's questions in the saved sessions", () => {
    expect(guideStats([bad, good], evacuation)).toEqual({
      questions: 6,
      correct: 3,
      incorrect: 3,
    });
  });

  it("is zero without sessions, and ignores another guide's questions", () => {
    expect(guideStats([], evacuation)).toEqual({ questions: 0, correct: 0, incorrect: 0 });
    expect(guideStats([good], ["F1", "F2"])).toEqual({ questions: 0, correct: 0, incorrect: 0 });
  });

  it("shares the guide's questions and situations answered at least once", () => {
    expect(guidePracticed([], evacuation)).toBe(0);
    expect(guidePracticed([good], evacuation)).toBeGreaterThan(0);
    expect(guidePracticed([good, bad], evacuation)).toBe(guidePracticed([good], evacuation));
    expect(guidePracticed([good], [])).toBe(0);
  });
});
