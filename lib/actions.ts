import { groupCounts } from "@/lib/cohort";
import type { Attempt, Participant } from "@/lib/cohort";
import { parseDeadline } from "@/lib/exam-deadline";
import { splitExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { ALL_GROUPS, examsInScope, groupById, groups } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
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
  /** In All groups: the group the row is about; opening the row selects it first. */
  scopeTo?: string;
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
  /** The profiles of every participant (all groups). */
  list: StudentProfile[];
  exams: GroupExam[];
  attempts: Attempt[];
  /** Every participant (all groups), the same list the profiles were made from. */
  people: Participant[];
  drafts: DraftSet[];
  /** The ids of the exams a reminder was already sent for. */
  reminded: ReadonlySet<string>;
  now: number;
  /** "all" or one group: the rows are made per group and carry the group name in All groups. */
  scope: Scope;
};

/**
 * The rows of "Needs your action", the first three that apply, in the rules' order. For one group
 * the rules look at that group only; for All groups each rule runs per group and the title starts
 * with the group name ("Rescue team · 5 students need attention").
 */
export function actionRows({
  list,
  exams,
  attempts,
  people,
  drafts,
  reminded,
  now,
  scope,
}: ActionInput): Action[] {
  const rows: Action[] = [];
  const ids = scope === ALL_GROUPS ? groups.map((group) => group.id) : [scope];
  const all = scope === ALL_GROUPS;
  const named = (id: string, text: string) =>
    all ? `${groupById(id)?.name ?? id} · ${text}` : text;
  const extra = (id: string) => (all ? { scopeTo: id } : {});

  // 1. an active exam due within 3 days with students who have not started it, not reminded yet
  for (const id of ids) {
    const peopleOfGroup = people.filter((person) => person.groupId === id);
    const { active } = splitExams(examsInScope(exams, id), now);
    for (const exam of active) {
      const days = daysUntil(exam.deadline, now);
      if (days === null || days > DUE_SOON_DAYS || reminded.has(exam.id)) continue;
      const { notStarted } = groupCounts(peopleOfGroup, exam, {
        attempts,
        active: true,
      });
      if (notStarted === 0) continue;
      rows.push({
        kind: "exam-not-started",
        title: named(
          id,
          `${studentsCount(notStarted)} ${notStarted === 1 ? "has" : "have"} not started ${exam.title}`,
        ),
        reason: dueReason(days),
        href: `/instructor/exams/${exam.id}?from=overview`,
        ...extra(id),
      });
      break;
    }
  }

  // 2. students below the pass mark
  for (const id of ids) {
    const needs = needsAttention(
      list.filter((profile) => profile.participant.groupId === id),
    ).length;
    if (needs === 0) continue;
    rows.push({
      kind: "needs-attention",
      title: named(id, `${studentsCount(needs)} ${needs === 1 ? "needs" : "need"} attention`),
      reason: "Below the pass mark",
      href: "/instructor/students?filter=needs&from=overview",
      ...extra(id),
    });
  }

  // 3. imported sets still in Draft (a set belongs to no group)
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
  for (const id of ids) {
    if (splitExams(examsInScope(exams, id), now).active.length > 0) continue;
    rows.push({
      kind: "no-exam",
      title: named(id, "No active exam"),
      reason: all ? "Assign an exam to this group" : "Assign an exam to your group",
      href: "/instructor/exams/new?from=overview",
      ...extra(id),
    });
  }

  return rows.slice(0, ACTION_LIMIT);
}
