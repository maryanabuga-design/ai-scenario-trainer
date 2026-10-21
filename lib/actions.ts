import { groupCounts } from "@/lib/cohort";
import type { Attempt, Participant } from "@/lib/cohort";
import { parseDeadline } from "@/lib/exam-deadline";
import { splitExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { needsAttention, studentsCount } from "@/lib/overview";
import type { StudentProfile } from "@/lib/students";

/**
 * "Needs your action" on the Instructor Overview (DESIGN.md: Instructor, action dashboard). Pure:
 * the rules in their order, at most three rows, counts only. A row is there only while its
 * condition holds, so resolving it (a reminder, a published set, an assigned exam) removes it.
 */
export const ACTION_LIMIT = 3;
export const DUE_SOON_DAYS = 3;
export const ALL_CAUGHT_UP = "All caught up";

export type ActionKind = "exam-not-started" | "needs-attention" | "draft-set" | "no-exam";

export type DraftSet = { id: string; title: string };

export type Action = {
  kind: ActionKind;
  title: string;
  /** The one muted reason line. */
  reason: string;
  href: string;
};

const DAY = 86_400_000;

/** Whole days from today to the end of the deadline day (0 on the day itself), or null for a bad date. */
export function daysUntil(deadline: string, now: number): number | null {
  const due = parseDeadline(deadline);
  if (!due) return null;
  const today = new Date(now);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  return Math.round((dueStart - start) / DAY);
}

/** "Due today" or "Due in 2 days". */
export const dueReason = (days: number) =>
  days <= 0 ? "Due today" : `Due in ${days} ${days === 1 ? "day" : "days"}`;

export type ActionInput = {
  list: StudentProfile[];
  exams: GroupExam[];
  attempts: Attempt[];
  /** The people of the group (the same list the profiles were made from). */
  people: Participant[];
  drafts: DraftSet[];
  /** The ids of the exams a reminder was already sent for. */
  reminded: ReadonlySet<string>;
  now: number;
};

/** The rows of "Needs your action", the first three that apply, in the rules' order. */
export function actionRows({
  list,
  exams,
  attempts,
  people,
  drafts,
  reminded,
  now,
}: ActionInput): Action[] {
  const rows: Action[] = [];
  const { active } = splitExams(exams, now);

  // 1. an active exam due within 3 days, with students who have not started it, not reminded yet
  for (const exam of active) {
    const days = daysUntil(exam.deadline, now);
    if (days === null || days > DUE_SOON_DAYS || reminded.has(exam.id)) continue;
    const { notStarted } = groupCounts(people, exam, { attempts, active: true });
    if (notStarted === 0) continue;
    rows.push({
      kind: "exam-not-started",
      title: `${studentsCount(notStarted)} ${notStarted === 1 ? "has" : "have"} not started ${exam.title}`,
      reason: dueReason(days),
      href: `/instructor/exams/${exam.id}?from=overview`,
    });
    break;
  }

  // 2. students below the pass mark
  const needs = needsAttention(list).length;
  if (needs > 0) {
    rows.push({
      kind: "needs-attention",
      title: `${studentsCount(needs)} ${needs === 1 ? "needs" : "need"} attention`,
      reason: "Below the pass mark",
      href: "/instructor/students?filter=needs&from=overview",
    });
  }

  // 3. imported sets still in Draft
  if (drafts.length > 0) {
    rows.push({
      kind: "draft-set",
      title:
        drafts.length === 1
          ? "1 imported set is not published"
          : `${drafts.length} imported sets are not published`,
      reason: drafts[0].title,
      href: drafts.length === 1 ? `/instructor/content/${drafts[0].id}` : "/instructor/content",
    });
  }

  // 4. no active exam
  if (active.length === 0) {
    rows.push({
      kind: "no-exam",
      title: "No active exam",
      reason: "Assign an exam to your group",
      href: "/instructor/exams/new?from=overview",
    });
  }

  return rows.slice(0, ACTION_LIMIT);
}
