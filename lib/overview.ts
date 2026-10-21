import { isActive, splitExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { allTopicIds } from "@/lib/progress-view";
import {
  activeProfiles,
  profileStatus,
  sortProfiles,
  topicPassed,
} from "@/lib/students";
import type { StudentProfile } from "@/lib/students";

/**
 * What the Instructor Overview shows (DESIGN.md: Instructor, Overview and consistency). Pure: it only
 * combines the figures of the Students helpers (`lib/students.ts`) and the Exams helpers
 * (`lib/group-exams.ts`), so a number on the Overview always equals the same number on the screen it links to.
 */

/** The correct answers of the active participants over all their questions as a whole percent, rounded down. Not started participants are left out. */
export function groupReadiness(list: StudentProfile[]): number {
  let total = 0;
  let correct = 0;
  for (const profile of activeProfiles(list)) {
    for (const row of profile.topics) {
      total += row.total;
      correct += row.correct;
    }
  }
  return total === 0 ? 0 : Math.floor((correct * 100) / total + 1e-9);
}

/** The students who Need attention (Not started ones never do), most urgent first. */
export const needsAttention = (list: StudentProfile[]) =>
  sortProfiles(list).filter((profile) => profileStatus(profile) === "needs");

/** A topic with the students at or above the pass mark in it, among those who answered it. */
export type TopicStanding = { sectionId: string; passing: number; total: number };

/**
 * All ten topics, the weakest first: for each topic, the active participants who answered it and those
 * of them at or above the pass mark (80% of their answers right); the lowest share first, ties by topic
 * number; a topic nobody answered (total 0) comes last.
 */
export function topicStandings(list: StudentProfile[]): TopicStanding[] {
  return allTopicIds
    .map((sectionId) => {
      const rows = activeProfiles(list).flatMap((profile) => {
        const row = profile.topics.find((entry) => entry.sectionId === sectionId);
        return row && row.answered > 0 ? [row] : [];
      });
      return { sectionId, passing: rows.filter(topicPassed).length, total: rows.length };
    })
    .sort(
      (a, b) =>
        Number(a.total === 0) - Number(b.total === 0) ||
        (a.total === 0 ? 0 : a.passing * b.total - b.passing * a.total) ||
        allTopicIds.indexOf(a.sectionId) - allTopicIds.indexOf(b.sectionId),
    );
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

/** "5 students" or "1 student". */
export const studentsCount = (n: number) => `${n} ${n === 1 ? "student" : "students"}`;

/**
 * The change of the group readiness since last week, in whole points, or null without history. It
 * compares the SAME students now and a week ago: the active ones that have a seeded history (the
 * accounts of this browser have none).
 */
export function groupDelta(list: StudentProfile[]): number | null {
  const same = activeProfiles(list).filter((p) => p.previousCorrect !== undefined);
  const total = same.reduce((sum, p) => sum + p.topics.reduce((s, t) => s + t.total, 0), 0);
  if (same.length === 0 || total === 0) return null;
  const now = same.reduce((sum, p) => sum + p.topics.reduce((s, t) => s + t.correct, 0), 0);
  const before = same.reduce((sum, p) => sum + (p.previousCorrect ?? 0), 0);
  return Math.floor((now * 100) / total + 1e-9) - Math.floor((before * 100) / total + 1e-9);
}

/** "+4 points since last week", "-3 points since last week", "No change since last week" (no percent sign). */
export function deltaLine(delta: number): string {
  if (delta === 0) return "No change since last week";
  const n = Math.abs(delta);
  return `${delta > 0 ? "+" : "-"}${n} ${n === 1 ? "point" : "points"} since last week`;
}

/** The weakest topic for the Overview: its standing, or null when nobody has answered anything. */
export const weakestTopic = (list: StudentProfile[]): TopicStanding | null => {
  const first = topicStandings(list)[0];
  return first && first.total > 0 ? first : null;
};
