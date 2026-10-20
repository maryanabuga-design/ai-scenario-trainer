import { PASS_MARK } from "@/lib/config";
import { statusOf } from "@/lib/cohort";
import type {
  Attempt,
  ExamStatus,
  Field,
  Participant,
  SeededStudent,
  StatusContext,
} from "@/lib/cohort";
import { seededStudents } from "@/lib/cohort";
import { isActive, topicQuestionCount } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { allTopicIds, topicProgress } from "@/lib/progress-view";
import type { TopicProgress } from "@/lib/progress-view";
import type { FinishedSession } from "@/lib/session";

/**
 * The Students section of the Instructor (DESIGN.md: Instructor, Students). Pure: it reads the same
 * participants and helpers as Exams (`lib/cohort.ts`) and the same per-topic counting as Progress
 * (`lib/progress-view.ts`), so no figure is calculated twice.
 */
export const ALMOST_READY = 60;

export const fieldLabels: Record<Field, string> = {
  rescue: "Rescue services",
  paramedic: "Paramedics",
  military: "Military",
  civil: "Civil protection",
  other: "Other",
};

/** The short label of a field of work, "Not set" without one. */
export const fieldLabel = (field: Field | null) => (field ? fieldLabels[field] : "Not set");

export type StudentProfile = {
  participant: Participant;
  field: Field | null;
  /** S1 to S10 in number order: the correct answers over ALL questions of the topic. */
  topics: TopicProgress[];
};

/** A seeded student's per-topic figures, held to the real number of questions of each topic. */
export function seededProfile(student: SeededStudent, participant: Participant): StudentProfile {
  return {
    participant,
    field: student.field,
    topics: allTopicIds.map((id) => {
      const total = topicQuestionCount(id);
      const correct = Math.min(student.topics[id]?.correct ?? 0, total);
      return { sectionId: id, correct, total };
    }),
  };
}

/** A local account's figures: exactly the Progress calculation over that account's history. */
export function localProfile(
  participant: Participant,
  history: FinishedSession[] | null,
): StudentProfile {
  return {
    participant,
    field: null,
    topics: allTopicIds.map((id) => topicProgress(id, history)),
  };
}

/** The profiles of the participants; `histories` holds the history of each local account by email. */
export function profiles(
  people: Participant[],
  histories: Record<string, FinishedSession[] | null>,
): StudentProfile[] {
  return people.map((participant) => {
    if (participant.local) return localProfile(participant, histories[participant.id] ?? null);
    const student = seededStudents.find((entry) => entry.id === participant.id)!;
    return seededProfile(student, participant);
  });
}

/** The correct answers over all questions as a whole percent, rounded down (as Progress's Readiness). */
export function readinessOf(profile: Pick<StudentProfile, "topics">): number {
  const total = profile.topics.reduce((sum, row) => sum + row.total, 0);
  if (total === 0) return 0;
  const correct = profile.topics.reduce((sum, row) => sum + row.correct, 0);
  return Math.floor((correct * 100) / total + 1e-9);
}

export type StudentStatus = "ready" | "almost" | "needs";

/** 80 or more is Ready, 60 to 79 Almost ready, below 60 Needs attention. */
export function studentStatus(readiness: number): StudentStatus {
  if (readiness >= PASS_MARK) return "ready";
  if (readiness >= ALMOST_READY) return "almost";
  return "needs";
}

export const statusLabels: Record<StudentStatus, string> = {
  ready: "Ready",
  almost: "Almost ready",
  needs: "Needs attention",
};

/** Whether a topic is below the pass mark on its own. */
export const topicNeedsReview = (row: TopicProgress) =>
  row.total > 0 && Math.floor((row.correct * 100) / row.total + 1e-9) < PASS_MARK;

export const topicsToReview = (profile: Pick<StudentProfile, "topics">) =>
  profile.topics.filter(topicNeedsReview).length;

/** "Rescue services · 3 topics to review". */
export function reviewLine(profile: StudentProfile): string {
  const n = topicsToReview(profile);
  const text = n === 0 ? "No topics to review" : `${n} ${n === 1 ? "topic" : "topics"} to review`;
  return `${fieldLabel(profile.field)} · ${text}`;
}

export type StudentsFilter = "all" | "needs" | "certified";
export const filters: { value: StudentsFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "needs", label: "Needs attention" },
  { value: "certified", label: "Certified" },
];

/** A filter from the address, "all" when it is missing or unknown. */
export const filterFrom = (value: string | null): StudentsFilter =>
  filters.some((f) => f.value === value) ? (value as StudentsFilter) : "all";

const rank: Record<StudentStatus, number> = { needs: 0, almost: 1, ready: 2 };

/** Needs attention first, then Almost ready, then Ready; alphabetical inside each. */
export function sortProfiles(list: StudentProfile[]): StudentProfile[] {
  return [...list].sort(
    (a, b) =>
      rank[studentStatus(readinessOf(a))] - rank[studentStatus(readinessOf(b))] ||
      a.participant.name.localeCompare(b.participant.name),
  );
}

/** Whether the participant is Certified for at least one exam. */
export function certifiedAnywhere(
  participant: Participant,
  exams: GroupExam[],
  attempts: Attempt[],
  now: number,
): boolean {
  return exams.some(
    (exam) =>
      statusOf(participant, exam, { attempts, active: isActive(exam, now) }).kind === "certified",
  );
}

/** The list for a filter, sorted. */
export function visibleStudents(
  list: StudentProfile[],
  filter: StudentsFilter,
  exams: GroupExam[],
  attempts: Attempt[],
  now: number,
): StudentProfile[] {
  const kept = list.filter((profile) => {
    if (filter === "needs") return studentStatus(readinessOf(profile)) === "needs";
    if (filter === "certified") return certifiedAnywhere(profile.participant, exams, attempts, now);
    return true;
  });
  return sortProfiles(kept);
}

/** "Group A · 14 students". */
export const groupLine = (name: string, count: number) =>
  `${name} · ${count} ${count === 1 ? "student" : "students"}`;

/** "Certified · 17 of 20 correct", "Not passed · 14 of 20 correct" or "Not started". */
export function statusDetail(status: ExamStatus): string {
  if (status.kind === "not-started") return "Not started";
  const text = status.kind === "certified" ? "Certified" : "Not passed";
  return `${text} · ${status.correct} of ${status.total} correct`;
}

export type StudentExamRow = {
  exam: GroupExam;
  status: ExamStatus;
  /** A Certified result of a local account with a certificate: the row opens it. */
  certificateId?: string;
};

/** The exams of one student, newest deadline first, with the same statuses as the Exam detail. */
export function examRowsFor(
  participant: Participant,
  exams: GroupExam[],
  attempts: Attempt[],
  now: number,
): StudentExamRow[] {
  return [...exams]
    .sort((a, b) => b.deadline.localeCompare(a.deadline) || b.createdAt - a.createdAt)
    .map((exam) => {
      const context: StatusContext = { attempts, active: isActive(exam, now) };
      const status = statusOf(participant, exam, context);
      return {
        exam,
        status,
        ...(status.kind === "certified" &&
          status.certificateId && { certificateId: status.certificateId }),
      };
    });
}
