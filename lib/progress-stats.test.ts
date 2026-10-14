import { describe, expect, it } from "vitest";
import {
  errorTypeShare,
  firstVsLatest,
  progressSummary,
  sectionStats,
  sessionStats,
  trendSessions,
} from "@/lib/progress-stats";
import { getStep } from "@/lib/scenario";
import type { FinishedSession } from "@/lib/session";

const day = (n: number) => Date.UTC(2026, 9, n, 9);

/** s1: b right, d wrong. s2: c right, a wrong. s3: a right, b wrong. */
const answer = (stepId: string, optionId: string, confidence: 1 | 2 | 3) => ({
  stepId,
  optionId,
  confidence,
  explanation: "",
});

/** 0 of 3 right: one misconception and two knowledge gaps. */
const bad: FinishedSession = {
  mode: "short",
  finishedAt: day(1),
  answers: [answer("s1", "d", 3), answer("s2", "a", 1), answer("s3", "b", 2)],
};

/** 3 of 3 right: two secure answers and a guess. */
const good: FinishedSession = {
  mode: "short",
  finishedAt: day(2),
  answers: [answer("s1", "b", 3), answer("s2", "c", 3), answer("s3", "a", 2)],
};

describe("per-session results", () => {
  it("gives each session its correct count, total and percent, oldest first", () => {
    expect(sessionStats([bad, good])).toEqual([
      { finishedAt: day(1), correct: 0, total: 3, percent: 0 },
      { finishedAt: day(2), correct: 3, total: 3, percent: 100 },
    ]);
  });

  it("rounds the percent", () => {
    const twoOfThree: FinishedSession = {
      mode: "short",
      finishedAt: day(3),
      answers: [answer("s1", "b", 3), answer("s2", "c", 3), answer("s3", "b", 2)],
    };
    expect(sessionStats([twoOfThree])[0].percent).toBe(67);
  });

  it("keeps the last 6 sessions for the chart, still oldest first", () => {
    const many = Array.from({ length: 9 }, (_, index) => ({ ...good, finishedAt: day(index + 1) }));
    const trend = trendSessions(many);
    expect(trend).toHaveLength(6);
    expect(trend[0].finishedAt).toBe(day(4));
    expect(trend[5].finishedAt).toBe(day(9));
  });

  it("treats a repeat round like any other session", () => {
    const repeat: FinishedSession = {
      kind: "repeat",
      topics: ["S1"],
      finishedAt: day(4),
      answers: [{ type: "step", ...answer("s1", "b", 3) }],
    };
    expect(sessionStats([repeat])).toEqual([
      { finishedAt: day(4), correct: 1, total: 1, percent: 100 },
    ]);
  });
});

describe("the summary", () => {
  it("counts sessions, averages the percents and shares the secure answers", () => {
    expect(progressSummary([bad, good])).toEqual({
      sessions: 2,
      averagePercent: 50,
      securePercent: 33,
    });
  });

  it("works with one session", () => {
    expect(progressSummary([good])).toEqual({
      sessions: 1,
      averagePercent: 100,
      securePercent: 67,
    });
  });

  it("has no numbers without sessions", () => {
    expect(progressSummary([])).toEqual({ sessions: 0, averagePercent: null, securePercent: null });
  });
});

describe("error types", () => {
  it("counts every answer by type across all sessions", () => {
    expect(errorTypeShare([bad, good])).toEqual({
      counts: { secure: 2, guess: 1, knowledge_gap: 2, misconception: 1 },
      total: 6,
    });
  });

  it("is empty without sessions", () => {
    expect(errorTypeShare([]).total).toBe(0);
  });

  it("compares misconceptions and knowledge gaps in the first and the latest session", () => {
    expect(firstVsLatest([bad, good])).toEqual({ first: 3, latest: 0 });
  });

  it("has no comparison with fewer than two sessions", () => {
    expect(firstVsLatest([good])).toBeNull();
    expect(firstVsLatest([])).toBeNull();
  });
});

describe("guide sections", () => {
  const sourcesOf = (id: string) => getStep(id).sources;

  it("counts correct and total answers for every section a step cites", () => {
    const sections = ["S1", "S2", "S3", "S4"];
    const stats = sectionStats([bad, good], sections);
    expect(stats.map((entry) => entry.id)).toEqual(sections);
    for (const entry of stats) {
      const touching = ["s1", "s2", "s3"].filter((id) => sourcesOf(id).includes(entry.id));
      expect(entry.total, entry.id).toBe(touching.length * 2);
      // Each step was wrong in the first session and right in the second.
      expect(entry.correct, entry.id).toBe(touching.length);
    }
  });

  it("leaves a section nobody practised at zero", () => {
    expect(sectionStats([good], ["S9"])).toEqual([{ id: "S9", correct: 0, total: 0 }]);
  });

  it("is all zero without sessions", () => {
    expect(sectionStats([], ["S1", "S2"]).every((entry) => entry.total === 0)).toBe(true);
  });
});
