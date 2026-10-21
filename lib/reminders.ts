import { statusOf } from "@/lib/cohort";
import type { Attempt, Participant } from "@/lib/cohort";
import { isActive, shortDate, splitExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { topicNeedsReview } from "@/lib/students";
import type { StudentProfile } from "@/lib/students";

/**
 * The reminder an Instructor sends from a Student detail (DESIGN.md: Instructor, reminders). Pure:
 * the message is chosen from what the student has to do, in this order: an active exam not yet
 * passed, then the topics below the pass mark, then a kind word.
 */
export type ReminderKind = "exam" | "topics" | "general";

export type Reminder = {
  kind: ReminderKind;
  text: string;
  /** The screen the student's notification opens. */
  target: string;
};

/** The nearest Active exam the participant has not passed yet, or null. */
export function unfinishedExam(
  participant: Participant,
  exams: GroupExam[],
  attempts: Attempt[],
  now: number,
): GroupExam | null {
  return (
    splitExams(exams, now).active.find(
      (exam) =>
        statusOf(participant, exam, { attempts, active: isActive(exam, now) }).kind !== "certified",
    ) ?? null
  );
}

/** "A, B and C", or "A, B, C and 2 more". */
export function nameList(names: string[]): string {
  if (names.length <= 1) return names.join("");
  if (names.length <= 3) return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  const rest = names.length - 3;
  return `${names.slice(0, 3).join(", ")} and ${rest} more`;
}

export function reminderFor(
  profile: StudentProfile,
  exam: GroupExam | null,
  titleOf: (topicId: string) => string,
): Reminder {
  if (exam) {
    return {
      kind: "exam",
      text: `Your instructor reminded you: ${exam.title} is due ${shortDate(exam.deadline)}.`,
      target: `/exam?id=${exam.id}`,
    };
  }
  const weak = profile.topics.filter(topicNeedsReview).map((row) => titleOf(row.sectionId));
  if (weak.length > 0) {
    return {
      kind: "topics",
      text: `Your instructor suggests practising: ${nameList(weak)}.`,
      target: "/weak-topics",
    };
  }
  return { kind: "general", text: "Your instructor says: keep it up.", target: "/" };
}

/** The id of a student's reminder notice: one per student and kind, so sending again updates it. */
export const reminderNoticeId = (email: string, kind: ReminderKind) =>
  `remind-student-${email}-${kind}`;

export const sentLine = (name: string) => `Reminder sent to ${name}`;
