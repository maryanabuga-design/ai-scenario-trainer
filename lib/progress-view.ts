import { PASS_MARK } from "@/lib/config";
import type { AssignedExam } from "@/lib/assigned-exams";
import { deadlineText } from "@/lib/exam-deadline";
import { sectionOrder } from "@/lib/items";
import { trainingSections } from "@/lib/parts";
import { scoreSession } from "@/lib/progress";
import { examReadiness, latestResults, scopeItemIds } from "@/lib/readiness";
import { correctCount } from "@/lib/scoring";
import type { FinishedSession } from "@/lib/session";

/**
 * What the Progress screen shows (DESIGN.md: Progress). CLIENT ONLY by the server/client rule (it is
 * about progress). Pure: the history and "now" are parameters. Every count uses the LATEST answer per
 * question over ALL the questions of the topic, so the lists agree with Readiness.
 */

/** The ten guide topics the Progress lists are about. */
export const allTopicIds = trainingSections;

export type TopicStatus = "not-started" | "needs-work" | "ready";

export type TopicProgress = {
  sectionId: string;
  /** Questions of the topic whose latest answer is correct. */
  correct: number;
  /** ALL questions of the topic, in both modes. */
  total: number;
  /** Questions answered at least once. */
  answered: number;
  status: TopicStatus;
};

/** Ready from the pass mark up (as a share of ALL the topic's questions), Not started with no answer. */
export function topicStatus(correct: number, total: number, answered: number): TopicStatus {
  if (answered === 0) return "not-started";
  return correct * 100 >= PASS_MARK * total ? "ready" : "needs-work";
}

export function topicProgress(sectionId: string, history: FinishedSession[] | null): TopicProgress {
  const ids = scopeItemIds([sectionId]);
  const latest = latestResults(history);
  const answered = ids.filter((id) => latest.has(id)).length;
  const correct = ids.filter((id) => latest.get(id) === true).length;
  return {
    sectionId,
    correct,
    total: ids.length,
    answered,
    status: topicStatus(correct, ids.length, answered),
  };
}

const statusRank: Record<TopicStatus, number> = { "not-started": 0, "needs-work": 1, ready: 2 };

/** Weakest first: Not started, Needs work, Ready; the lower share first; then guide order. */
export function sortTopics(rows: TopicProgress[]): TopicProgress[] {
  const share = (row: TopicProgress) => (row.total === 0 ? 0 : row.correct / row.total);
  return [...rows].sort(
    (a, b) =>
      statusRank[a.status] - statusRank[b.status] ||
      share(a) - share(b) ||
      sectionOrder(a.sectionId) - sectionOrder(b.sectionId),
  );
}

/** "In your exam" (the exam's topics) and the other topics, each weakest first. */
export function topicGroups(examTopicIds: string[] | null, history: FinishedSession[] | null) {
  const inExam = new Set(examTopicIds ?? []);
  const rows = allTopicIds.map((id) => topicProgress(id, history));
  return {
    inExam: sortTopics(rows.filter((row) => inExam.has(row.sectionId))),
    other: sortTopics(rows.filter((row) => !inExam.has(row.sectionId))),
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

/** The sessions and the questions answered at least once. */
export function activitySummary(history: FinishedSession[]) {
  const answered = new Set(history.flatMap((session) => session.answers.map((a) => a.itemId)));
  return { sessions: history.length, answers: answered.size };
}

export function activityLabel({ sessions, answers }: { sessions: number; answers: number }) {
  return `${sessions} ${sessions === 1 ? "session" : "sessions"} · ${answers} ${answers === 1 ? "answer" : "answers"}`;
}

/** The newest sessions first. */
export function recentSessions(history: FinishedSession[], limit: number): FinishedSession[] {
  return [...history].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, limit);
}

export type SessionMode = "practice" | "mini-quiz" | "exam";

/** The mode of a record; one without a (valid) mode is Practice, except an exam. */
export function sessionMode(session: Pick<FinishedSession, "kind" | "mode">): SessionMode {
  if (session.kind === "exam" || session.mode === "exam") return "exam";
  return session.mode === "mini-quiz" ? "mini-quiz" : "practice";
}

export function sessionModeLabel(session: Pick<FinishedSession, "kind" | "mode">): string {
  return { practice: "Practice", "mini-quiz": "Mini-quiz", exam: "Exam" }[sessionMode(session)];
}

/** The topics stored with the record; a record without them, or with a broken value, has none. */
export function sessionTopicIds(session: Pick<FinishedSession, "topicIds">): string[] {
  const ids: unknown = session.topicIds;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

/** Correct answers over all questions: an exam counts its unanswered questions as incorrect. */
export function sessionResult(session: FinishedSession) {
  const scored = scoreSession(session);
  const total = session.exam?.questions ?? scored.length;
  return { correct: correctCount(scored), total: Math.max(total, scored.length) };
}

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

const startOfDay = (time: number) => {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

/** "Today, 10:37", "Yesterday", "18 Oct" (with the year when it is not this year). */
export function sessionDate(finishedAt: number, now: Date): string {
  const days = Math.round((startOfDay(now.getTime()) - startOfDay(finishedAt)) / 86_400_000);
  if (days <= 0) return `Today, ${clock.format(finishedAt)}`;
  if (days === 1) return "Yesterday";
  const sameYear = new Date(finishedAt).getFullYear() === now.getFullYear();
  return (sameYear ? dayMonth : dayMonthYear).format(finishedAt);
}
