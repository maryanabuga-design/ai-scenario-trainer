import { actionRows } from "@/lib/actions";
import type { Action, DraftSet } from "@/lib/actions";
import { groupCounts } from "@/lib/cohort";
import type { Attempt, GroupCounts, Participant } from "@/lib/cohort";
import { getStarted } from "@/lib/get-started";
import type { StartStep } from "@/lib/get-started";
import { splitExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import {
  ALL_GROUPS,
  examPeople,
  examsInScope,
  groupNames,
  groups,
} from "@/lib/groups";
import type { Group, Scope } from "@/lib/groups";
import {
  groupDelta,
  groupReadiness,
  needsAttention,
  nearestActiveExam,
  weakestTopic,
} from "@/lib/overview";
import type { TopicStanding } from "@/lib/overview";
import { notStartedCount } from "@/lib/students";
import type { StudentProfile } from "@/lib/students";

/** What the Instructor Overview shows for a scope, combined from the pure helpers only. */
/** One row of the GROUPS card (All groups): a group, its students and those who need attention. */
export type GroupRow = { group: Group; students: number; needs: number };

export const groupRows = (list: StudentProfile[]): GroupRow[] =>
  groups.map((group) => {
    const own = list.filter(
      (profile) => profile.participant.groupId === group.id,
    );
    return { group, students: own.length, needs: needsAttention(own).length };
  });

/** An exam of the EXAMS card with the counts of its audience and, in All groups, its group tag. */
export type ExamRow = {
  exam: GroupExam;
  counts: GroupCounts;
  tag: string | null;
};

export type OverviewInput = {
  scope: Scope;
  /** The profiles of every participant (all groups). */
  list: StudentProfile[];
  people: Participant[];
  exams: GroupExam[];
  attempts: Attempt[];
  drafts: DraftSet[];
  /** How many imported sets are published. */
  publishedSets: number;
  reminded: ReadonlySet<string>;
  now: number;
};

/** Everything the Overview shows for a scope, from the pure helpers (DESIGN.md: Instructor, Overview). */
export type OverviewModel = {
  scope: Scope;
  /** The profiles of the scope. */
  list: StudentProfile[];
  readiness: number;
  delta: number | null;
  /** "Rescue team · 14 students · 1 not started" lines of the scope (one group), else null. */
  students: number;
  notStarted: number;
  /** The GROUPS card rows (All groups), else an empty list. */
  groupRows: GroupRow[];
  actions: Action[];
  examRows: ExamRow[];
  /** The active exams of the scope ("1 Active"). */
  activeCount: number;
  weakest: TopicStanding | null;
  /** The Get started steps, or null. */
  steps: StartStep[] | null;
};

export function overviewModel(input: OverviewInput): OverviewModel {
  const { scope, people, exams, attempts, now } = input;
  const all = scope === ALL_GROUPS;
  const list = all
    ? input.list
    : input.list.filter((profile) => profile.participant.groupId === scope);
  const scoped = examsInScope(exams, scope);
  const { active } = splitExams(scoped, now);
  const counts = (exam: GroupExam) =>
    groupCounts(examPeople(people, exam), exam, { attempts, now });
  // the nearest active exam: of the group, or of each group (once when it is shared)
  const nearest = all
    ? groups.flatMap((group) => {
        const exam = nearestActiveExam(examsInScope(exams, group.id), now);
        return exam ? [exam] : [];
      })
    : (() => {
        const exam = nearestActiveExam(scoped, now);
        return exam ? [exam] : [];
      })();
  const unique = nearest.filter(
    (exam, index) => nearest.findIndex((e) => e.id === exam.id) === index,
  );
  return {
    scope,
    list,
    readiness: groupReadiness(list),
    delta: groupDelta(list),
    students: list.length,
    notStarted: notStartedCount(list),
    groupRows: all ? groupRows(input.list) : [],
    actions: actionRows({
      list: input.list,
      exams,
      attempts,
      people,
      drafts: input.drafts,
      reminded: input.reminded,
      now,
      scope,
    }),
    examRows: unique.map((exam) => ({
      exam,
      counts: counts(exam),
      tag: all ? groupNames(exam.groupIds) : null,
    })),
    activeCount: active.length,
    weakest: all ? null : weakestTopic(list),
    steps: all
      ? null
      : getStarted({
          students: list.length,
          exams: scoped.length,
          publishedSets: input.publishedSets,
        }),
  };
}
