import { daysUntil, DUE_SOON_DAYS, dueReason } from "@/lib/actions";
import { bestAttempt, finishedOf, triedCount } from "@/lib/cohort";
import type { Attempt, ExamStatus, GroupCounts, Participant } from "@/lib/cohort";
import { attemptsOf } from "@/lib/cohort";
import { isoDay, parseDeadline } from "@/lib/exam-deadline";
import { examQuestionIds } from "@/lib/exam-pool";
import { shortDate } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { findItem } from "@/lib/items";

/**
 * What the Instructor's Exams screens say about an exam (DESIGN.md: Instructor, Exams rebuilt).
 * Pure: counts and words only, never a percentage.
 */

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const topicsCount = (exam: Pick<GroupExam, "topicIds">) =>
  plural(exam.topicIds.length, "topic", "topics");

/** The soft pill of an active card: "Due in 2 days · 1 topic" (amber within 3 days) or "Due 26 Oct · 2 topics". */
export function duePill(
  exam: Pick<GroupExam, "deadline" | "topicIds">,
  now: number,
): { text: string; tone: "amber" | "neutral" } {
  const days = daysUntil(exam.deadline, now);
  if (days !== null && days <= DUE_SOON_DAYS) {
    const text = dueReason(days);
    return { text: `${text} · ${topicsCount(exam)}`, tone: "amber" };
  }
  return { text: `Due ${shortDate(exam.deadline)} · ${topicsCount(exam)}`, tone: "neutral" };
}

/** The day an exam closed: when it was closed by hand, else its deadline. */
export const closedDay = (exam: Pick<GroupExam, "deadline" | "closedAt">): string =>
  exam.closedAt === undefined ? exam.deadline : isoDay(new Date(exam.closedAt));

/** "Closed 12 Oct". */
export const closedLine = (exam: Pick<GroupExam, "deadline" | "closedAt">) =>
  `Closed ${shortDate(closedDay(exam))}`;

/** "Passed 1 of 14 · 11 not started" for an active exam, "Passed 12 of 14" for a closed one. */
export function resultsLine(counts: GroupCounts, active: boolean): string {
  const base = `Passed ${counts.passed} of ${counts.total}`;
  return active ? `${base} · ${counts.notStarted} not started` : base;
}

/** "3 of 14 tried". */
export const triedLine = (counts: GroupCounts) => `${triedCount(counts)} of ${counts.total} tried`;

/** "3 attempts allowed", "1 attempt allowed", "Unlimited attempts". */
export const attemptsAllowedLine = (exam: Pick<GroupExam, "attemptsAllowed">) =>
  exam.attemptsAllowed === null
    ? "Unlimited attempts"
    : `${plural(exam.attemptsAllowed, "attempt", "attempts")} allowed`;

/** "2 attempts left", "Unlimited attempts" (the student side). */
export const attemptsLeftLine = (left: number | null) =>
  left === null ? "Unlimited attempts" : `${plural(left, "attempt", "attempts")} left`;

/** The muted second line of a roster row. */
export function rosterLine(status: ExamStatus, now: number): string {
  switch (status.kind) {
    case "passed":
    case "not-passed":
      return `${status.correct} of ${status.total} correct · ${plural(status.attempts, "attempt", "attempts")}`;
    case "in-progress": {
      const minutes = Math.max(0, Math.round((now - status.startedAt) / 60_000));
      return `Started ${minutes} min ago · Attempt ${status.attempt}`;
    }
    case "missed":
      return "Closed without a try";
    default:
      return "No attempts yet";
  }
}

export type HardQuestion = {
  /** The question's place in the exam, from 1 ("Q4"). */
  number: number;
  id: string;
  text: string;
  wrong: number;
  answered: number;
};

export const HARDEST_MIN_ATTEMPTS = 3;
export const HARDEST_LIMIT = 3;

/**
 * The hardest questions of an exam, from the best finished attempt of each student: the questions
 * most students answered wrong, most first. Empty until at least three finished attempts exist.
 */
export function hardestQuestions(
  people: Participant[],
  exam: GroupExam,
  attempts: Attempt[],
  now: number,
): HardQuestion[] {
  const best = people.flatMap((person) => {
    const top = bestAttempt(attemptsOf(person, exam, attempts, now));
    return top ? [top] : [];
  });
  const finished = people.reduce(
    (sum, person) => sum + finishedOf(attemptsOf(person, exam, attempts, now)).length,
    0,
  );
  if (finished < HARDEST_MIN_ATTEMPTS) return [];
  return examQuestionIds(exam)
    .map((id, index) => {
      const answered = best.filter((a) => id in a.answers).length;
      const wrong = best.filter((a) => a.answers[id] === false).length;
      return { number: index + 1, id, text: findItem(id)?.question ?? id, wrong, answered };
    })
    .filter((question) => question.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || a.number - b.number)
    .slice(0, HARDEST_LIMIT);
}

/** "9 of 14 answered wrong". */
export const wrongLine = (question: Pick<HardQuestion, "wrong" | "answered">) =>
  `${question.wrong} of ${question.answered} answered wrong`;

export type ExtendOption = "3d" | "1w" | "date";
export const extendOptions: { id: ExtendOption; label: string; days?: number }[] = [
  { id: "3d", label: "+3 days", days: 3 },
  { id: "1w", label: "+1 week", days: 7 },
  { id: "date", label: "Pick a date" },
];

/** The new deadline: the old one plus the days, or the picked date; null when it is not later than the old one. */
export function extendedDeadline(
  exam: Pick<GroupExam, "deadline">,
  option: ExtendOption,
  picked: string,
): string | null {
  const old = parseDeadline(exam.deadline);
  if (!old) return null;
  const days = extendOptions.find((o) => o.id === option)?.days;
  const next = days === undefined ? picked : isoDay(old, days);
  return parseDeadline(next) && next > exam.deadline ? next : null;
}
