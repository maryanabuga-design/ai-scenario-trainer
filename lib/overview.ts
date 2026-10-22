import { isActive, splitExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { allTopicIds } from "@/lib/progress-view";
import { groups } from "@/lib/groups";
import {
  activeProfiles,
  profileStatus,
  sortProfiles,
  statusLabels,
  studentStatus,
  topicPassed,
} from "@/lib/students";
import type { StudentStatus } from "@/lib/students";
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
export type TopicStanding = {
  sectionId: string;
  passing: number;
  total: number;
};

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
      return {
        sectionId,
        passing: rows.filter(topicPassed).length,
        total: rows.length,
      };
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

/** "+4 points this week", "-3 points this week", "No change this week" (no percent sign). */
export function deltaLine(delta: number): string {
  if (delta === 0) return "No change this week";
  const n = Math.abs(delta);
  return `${delta > 0 ? "+" : "-"}${n} ${n === 1 ? "point" : "points"} this week`;
}

/** Which tone the delta pill takes: success for an increase, neutral for no change, attention (never red) for a decrease. */
export const deltaTone = (delta: number): "success" | "neutral" | "attention" =>
  delta > 0 ? "success" : delta < 0 ? "attention" : "neutral";

/** The weakest topic for the Overview: its standing, or null when nobody has answered anything. */
export const weakestTopic = (list: StudentProfile[]): TopicStanding | null => {
  const first = topicStandings(list)[0];
  return first && first.total > 0 ? first : null;
};

/** The amber "Needs review" tag of a topic: fewer than half of the active students are at or above the pass mark. */
export const needsReviewTag = (topic: TopicStanding) =>
  topic.total > 0 && topic.passing * 2 < topic.total;

/** The trend line under the group readiness: its text and tone. */
export type TrendLine = { text: string; tone: "up" | "muted" };

/**
 * "↑ Up from 62% last week", "↓ Down from 70% last week" or "→ Same as last week", from the readiness
 * of the group a week ago (demo data). Nothing without that value. The percent sign is the comparison
 * value of the ONE headline percentage of the screen (DESIGN.md: Instructor, Overview refinements).
 */
export function trendLine(current: number, lastWeek: number | null | undefined): TrendLine | null {
  if (lastWeek === null || lastWeek === undefined) return null;
  if (current > lastWeek) return { text: `↑ Up from ${lastWeek}% last week`, tone: "up" };
  if (current < lastWeek) return { text: `↓ Down from ${lastWeek}% last week`, tone: "muted" };
  return { text: "→ Same as last week", tone: "muted" };
}

/** The status of a group: Not started when nobody has answered, otherwise by the group readiness. */
export function groupStatus(list: StudentProfile[]): StudentStatus {
  return activeProfiles(list).length === 0 ? "not-started" : studentStatus(groupReadiness(list));
}

/** One row of the group dropdown: "15 students · Almost ready" (no percentages). */
export type SwitcherRow = { id: string; name: string; line: string };

/** The rows of the group dropdown from all participants: each group, then "All groups". */
export function switcherRows(everyone: StudentProfile[]): SwitcherRow[] {
  return [
    ...groups.map((group) => {
      const own = everyone.filter((profile) => profile.participant.groupId === group.id);
      return {
        id: group.id,
        name: group.name,
        line: `${studentsCount(own.length)} · ${statusLabels[groupStatus(own)]}`,
      };
    }),
    { id: "all", name: "All groups", line: "One card per group" },
  ];
}

/**
 * The Weakest topic count. The card counts the students who answered the topic, so when that is fewer
 * than the group it says so: "8 of 13 who answered it are at or above the pass mark".
 */
export function weakestLine(topic: TopicStanding, students: number): string {
  return topic.total === students
    ? `${topic.passing} of ${topic.total} students at or above the pass mark`
    : `${topic.passing} of ${topic.total} who answered it are at or above the pass mark`;
}
