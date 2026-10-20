import { PASS_MARK } from "@/lib/config";
import { isActive, splitExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { allTopicIds } from "@/lib/progress-view";
import { sortProfiles, studentStatus, readinessOf } from "@/lib/students";
import type { StudentProfile } from "@/lib/students";

/**
 * What the Instructor Overview shows (DESIGN.md: Instructor, Overview and consistency). Pure: it only
 * combines the figures of the Students helpers (`lib/students.ts`) and the Exams helpers
 * (`lib/group-exams.ts`), so a number on the Overview always equals the same number on the screen it links to.
 */
export const ATTENTION_LIMIT = 3;
export const WEAKEST_LIMIT = 3;

/** The correct answers of the whole group over all its questions as a whole percent, rounded down. */
export function groupReadiness(list: StudentProfile[]): number {
  let total = 0;
  let correct = 0;
  for (const profile of list) {
    for (const row of profile.topics) {
      total += row.total;
      correct += row.correct;
    }
  }
  return total === 0 ? 0 : Math.floor((correct * 100) / total + 1e-9);
}

/** The students who Need attention, most urgent first: `shown` are the rows, `total` all of them. */
export function needsAttention(list: StudentProfile[]) {
  const all = sortProfiles(list).filter(
    (profile) => studentStatus(readinessOf(profile)) === "needs",
  );
  return { shown: all.slice(0, ATTENTION_LIMIT), total: all.length };
}

export type WeakTopic = { sectionId: string; passing: number; total: number };

/** The topics that fewest students answered correctly (at or above the pass mark), weakest first. */
export function weakestTopics(list: StudentProfile[]): WeakTopic[] {
  return allTopicIds
    .map((sectionId) => ({
      sectionId,
      passing: list.filter((profile) => {
        const row = profile.topics.find((entry) => entry.sectionId === sectionId);
        return (
          !!row && row.total > 0 && Math.floor((row.correct * 100) / row.total + 1e-9) >= PASS_MARK
        );
      }).length,
      total: list.length,
    }))
    .filter((topic) => topic.passing < topic.total)
    .sort(
      (a, b) =>
        a.passing - b.passing ||
        allTopicIds.indexOf(a.sectionId) - allTopicIds.indexOf(b.sectionId),
    )
    .slice(0, WEAKEST_LIMIT);
}

/** The nearest Active exam (the earliest deadline), or null. */
export function nearestActiveExam(exams: GroupExam[], now: number): GroupExam | null {
  const { active } = splitExams(exams, now);
  return (
    [...active]
      .filter((exam) => isActive(exam, now))
      .sort((a, b) => a.deadline.localeCompare(b.deadline) || a.createdAt - b.createdAt)[0] ?? null
  );
}
