import { scoreSession } from "@/lib/progress";
import { correctCount } from "@/lib/scoring";
import type { FinishedSession } from "@/lib/session";

/** How many sessions the "Result by session" chart shows. */
export const TREND_SESSIONS = 6;

export type SessionResult = {
  finishedAt: number;
  correct: number;
  total: number;
  percent: number;
};

const percentOf = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

/** Every session's result, oldest first. A repeat round counts like any other session. */
export function sessionStats(history: FinishedSession[]): SessionResult[] {
  return [...history]
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .map((session) => {
      const items = scoreSession(session);
      const correct = correctCount(items);
      return {
        finishedAt: session.finishedAt,
        correct,
        total: items.length,
        percent: percentOf(correct, items.length),
      };
    });
}

/** The last sessions for the chart, oldest first. */
export function trendSessions(history: FinishedSession[]): SessionResult[] {
  return sessionStats(history).slice(-TREND_SESSIONS);
}

export type ProgressSummary = {
  sessions: number;
  averagePercent: number | null;
  correctPercent: number | null;
};

/** Sessions, the mean result per session and the share of correct answers. Null without data. */
export function progressSummary(history: FinishedSession[]): ProgressSummary {
  const results = sessionStats(history);
  if (results.length === 0) return { sessions: 0, averagePercent: null, correctPercent: null };
  const items = history.flatMap(scoreSession);
  const mean = results.reduce((sum, result) => sum + result.percent, 0) / results.length;
  return {
    sessions: results.length,
    averagePercent: Math.round(mean),
    correctPercent: percentOf(correctCount(items), items.length),
  };
}

export type SectionStat = { id: string; correct: number; total: number };

/** Per guide section: correct and all answers whose item cites the section. */
export function sectionStats(history: FinishedSession[], ids: string[]): SectionStat[] {
  const items = history.flatMap(scoreSession);
  return ids.map((id) => {
    const touching = items.filter((item) => item.guideRef.includes(id));
    return { id, correct: touching.filter((item) => item.correct).length, total: touching.length };
  });
}
