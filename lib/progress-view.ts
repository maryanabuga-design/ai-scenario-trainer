import { PASS_MARK } from "@/lib/config";
import type { AssignedExam } from "@/lib/assigned-exams";
import { deadlineText } from "@/lib/exam-deadline";
import { sectionOrder } from "@/lib/items";
import { trainingSections } from "@/lib/parts";
import { examReadiness, latestResults, scopeItemIds } from "@/lib/readiness";
import type { FinishedSession } from "@/lib/session";

/**
 * What the Progress screen shows (DESIGN.md: Progress). CLIENT ONLY by the server/client rule (it is
 * about progress). Pure: the history and "now" are parameters. Every count uses the LATEST answer per
 * question over ALL the questions of the topic, so the lists agree with Readiness.
 */

/** The ten guide topics the Progress lists are about. */
export const allTopicIds = trainingSections;

export type TopicProgress = {
  sectionId: string;
  /** Questions of the topic whose latest answer is correct. */
  correct: number;
  /** ALL questions of the topic, in both modes. */
  total: number;
};

export function topicProgress(sectionId: string, history: FinishedSession[] | null): TopicProgress {
  const ids = scopeItemIds([sectionId]);
  const latest = latestResults(history);
  return {
    sectionId,
    correct: ids.filter((id) => latest.get(id) === true).length,
    total: ids.length,
  };
}

/** Topics in number order: S1, S2, ... S9, S10 (numeric, so S10 is after S9). */
export function byNumber(rows: TopicProgress[]): TopicProgress[] {
  return [...rows].sort((a, b) => sectionOrder(a.sectionId) - sectionOrder(b.sectionId));
}

/** "In your exam" (the exam's topics) and the other topics, each in number order. */
export function topicGroups(examTopicIds: string[] | null, history: FinishedSession[] | null) {
  const inExam = new Set(examTopicIds ?? []);
  const rows = allTopicIds.map((id) => topicProgress(id, history));
  return {
    inExam: byNumber(rows.filter((row) => inExam.has(row.sectionId))),
    other: byNumber(rows.filter((row) => !inExam.has(row.sectionId))),
  };
}

/** The correct answers still needed to reach the pass mark over the scope. Never below zero. */
export function remainingToTarget(topicIds: string[], history: FinishedSession[] | null) {
  const ids = scopeItemIds(topicIds);
  const latest = latestResults(history);
  const correct = ids.filter((id) => latest.get(id) === true).length;
  const target = Math.ceil((PASS_MARK * ids.length) / 100);
  return { scope: ids.length, correct, remaining: Math.max(0, target - correct) };
}

export type ReadinessCard = {
  title: string;
  subtitle: string | null;
  readiness: number;
  ready: boolean;
  sentence: string;
};

/** The readiness card: the exam's topics, or all ten topics without an exam. */
export function readinessCard(
  topicIds: string[] | null,
  history: FinishedSession[] | null,
  now: Date,
  exam: AssignedExam | null = null,
): ReadinessCard {
  const scope = topicIds ?? allTopicIds;
  const readiness = examReadiness(scope, history);
  const { remaining } = remainingToTarget(scope, history);
  const ready = readiness >= PASS_MARK;
  return {
    title: exam ? "Exam readiness" : "Overall readiness",
    subtitle: exam ? `${exam.title} · ${deadlineText(exam.deadline, now).label}` : null,
    readiness,
    ready,
    sentence: ready
      ? "You are ready for the exam."
      : `Not ready yet. ${remaining} more correct ${remaining === 1 ? "answer" : "answers"} to reach ${PASS_MARK}%.`,
  };
}

/**
 * How readiness changed with the most recent session: the current readiness minus the readiness
 * stored by the session before it. Null (no line) with fewer than two sessions, or when the earlier
 * record has no stored value (a record saved before it, or a broken value).
 */
export function readinessChange(history: FinishedSession[], current: number): number | null {
  if (history.length < 2) return null;
  const sorted = [...history].sort((a, b) => a.finishedAt - b.finishedAt);
  const previous: unknown = sorted[sorted.length - 2].readinessAfter;
  if (typeof previous !== "number" || !Number.isFinite(previous)) return null;
  return current - previous;
}

/** The change line: points, never a percent sign. "+1 point", "+9 points", "No change", "-4 points". */
export function changeText(delta: number): string {
  if (delta === 0) return "No change since your last session";
  const points = Math.abs(delta);
  return `${delta > 0 ? "+" : "-"}${points} ${points === 1 ? "point" : "points"} since your last session`;
}
