import { describe, expect, it } from "vitest";
import { progressSummary, sectionStats, sessionStats, trendSessions } from "@/lib/progress-stats";
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
  ["q-scn-s01-001", "a"],
  ["s2", "a"],
  ["s3", "b"],
]);
const good = session(day(2), [
  ["q-scn-s01-001", "b"],
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
      ["q-scn-s01-001", "b"],
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
  it("counts sessions and the correct answers over all answers, never a percentage", () => {
    expect(progressSummary([bad, good])).toEqual({ sessions: 2, correct: 3, answered: 6 });
  });

  it("works with one session and has zeros without sessions", () => {
    expect(progressSummary([good])).toEqual({ sessions: 1, correct: 3, answered: 3 });
    expect(progressSummary([])).toEqual({ sessions: 0, correct: 0, answered: 0 });
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
