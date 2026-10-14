import { scoreSession } from "@/lib/progress";
import { countErrorTypes } from "@/lib/scoring";
import type { ErrorType } from "@/lib/scoring";
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
      const correct = items.filter((item) => item.correct).length;
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
  securePercent: number | null;
};

/** Sessions, the mean result per session and the share of Secure answers. Null without data. */
export function progressSummary(history: FinishedSession[]): ProgressSummary {
  const results = sessionStats(history);
  if (results.length === 0) return { sessions: 0, averagePercent: null, securePercent: null };
  const { counts, total } = errorTypeShare(history);
  const mean = results.reduce((sum, result) => sum + result.percent, 0) / results.length;
  return {
    sessions: results.length,
    averagePercent: Math.round(mean),
    securePercent: percentOf(counts.secure, total),
  };
}

/** All answers across all sessions, counted by error type. */
export function errorTypeShare(history: FinishedSession[]) {
  const items = history.flatMap(scoreSession);
  return { counts: countErrorTypes(items), total: items.length };
}

const WEAK: ErrorType[] = ["misconception", "knowledge_gap"];

/** Misconceptions plus knowledge gaps in the first and in the latest session. Null under 2. */
export function firstVsLatest(history: FinishedSession[]) {
  if (history.length < 2) return null;
  const ordered = [...history].sort((a, b) => a.finishedAt - b.finishedAt);
  const weakIn = (session: FinishedSession) => {
    const counts = countErrorTypes(scoreSession(session));
    return WEAK.reduce((sum, type) => sum + counts[type], 0);
  };
  return { first: weakIn(ordered[0]), latest: weakIn(ordered[ordered.length - 1]) };
}

export type SectionStat = { id: string; correct: number; total: number };

/** Per guide section: correct and all answers whose item cites the section. */
export function sectionStats(history: FinishedSession[], ids: string[]): SectionStat[] {
  const items = history.flatMap(scoreSession);
  return ids.map((id) => {
    const touching = items.filter((item) => item.sources.includes(id));
    return { id, correct: touching.filter((item) => item.correct).length, total: touching.length };
  });
}
