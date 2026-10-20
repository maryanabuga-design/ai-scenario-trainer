import { localStatus } from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import { shortDate, splitExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";

/**
 * The group exams a student still has to take (DESIGN.md: Assigned exams move into Notifications):
 * Active (not closed, deadline not passed) and not yet passed by this account, nearest deadline
 * first. Computed from the current exam state, never from the notification history.
 */
export function examsToTake(
  exams: GroupExam[],
  attempts: Attempt[],
  email: string,
  now: number,
): GroupExam[] {
  return splitExams(exams, now).active.filter(
    (exam) => localStatus(attempts, email, exam.id).kind !== "certified",
  );
}

/** "1 assigned · due 23 Oct" for the Home Exam tile (the nearest due date), or null without one. */
export function assignedLine(toTake: GroupExam[]): string | null {
  if (toTake.length === 0) return null;
  return `${toTake.length} assigned · due ${shortDate(toTake[0].deadline)}`;
}
