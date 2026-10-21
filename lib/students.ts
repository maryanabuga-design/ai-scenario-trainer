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
import { shortLabels } from "@/lib/field-of-work";
import { isActive, topicQuestionCount } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { allTopicIds, topicProgress } from "@/lib/progress-view";
import type { TopicProgress } from "@/lib/progress-view";
import { latestResults, scopeItemIds } from "@/lib/readiness";
import type { FinishedSession } from "@/lib/session";

/**
 * The Students section of the Instructor (DESIGN.md: Instructor, Students). Pure: it reads the same
 * participants and helpers as Exams (`lib/cohort.ts`) and the same per-topic counting as Progress
 * (`lib/progress-view.ts`), so no figure is calculated twice.
 */
export const ALMOST_READY = 60;

export const fieldLabels: Record<Field, string> = shortLabels;

/** The short label of a field of work, "Not set" without one. */
export const fieldLabel = (field: Field | null) => (field ? fieldLabels[field] : "Not set");

/** One topic of a student: the answers given (`answered`), the right ones among them (`correct`) and all questions of the topic. */
export type StudentTopic = TopicProgress & { answered: number };

export type StudentProfile = {
  participant: Participant;
  field: Field | null;
  /** S1 to S10 in number order. */
  topics: StudentTopic[];
  /** The correct answers a week ago (only the invented students have this history). */
  previousCorrect?: number;
};

/** A seeded student's per-topic figures, held to the real number of questions of each topic. */
export function seededProfile(student: SeededStudent, participant: Participant): StudentProfile {
  return {
    participant,
    field: student.field,
    ...(student.previousCorrect !== undefined && { previousCorrect: student.previousCorrect }),
    topics: allTopicIds.map((id) => {
      const total = topicQuestionCount(id);
      const answered = Math.min(student.topics[id]?.answered ?? 0, total);
      const correct = Math.min(student.topics[id]?.correct ?? 0, answered);
      return { sectionId: id, correct, total, answered };
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
    field: participant.field ?? null,
    topics: allTopicIds.map((id) => {
      const latest = latestResults(history);
      const answered = scopeItemIds([id]).filter((item) => latest.has(item)).length;
      return { ...topicProgress(id, history), answered };
    }),
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

export type StudentStatus = "ready" | "almost" | "needs" | "not-started";

/** 80 or more is Ready, 60 to 79 Almost ready, below 60 Needs attention (by readiness alone). */
export function studentStatus(readiness: number): Exclude<StudentStatus, "not-started"> {
  if (readiness >= PASS_MARK) return "ready";
  if (readiness >= ALMOST_READY) return "almost";
  return "needs";
}

export const statusLabels: Record<StudentStatus, string> = {
  ready: "Ready",
  almost: "Almost ready",
  needs: "Needs attention",
  "not-started": "Not started",
};

/** The answers a student has given, in all topics. */
export const answeredOf = (profile: Pick<StudentProfile, "topics">) =>
  profile.topics.reduce((sum, row) => sum + row.answered, 0);

/** A participant with no answer at all: "Not started", left out of the group figures. */
export const isNotStarted = (profile: Pick<StudentProfile, "topics">) => answeredOf(profile) === 0;

/** The status of a profile: Not started without any answer, otherwise by readiness. */
export const profileStatus = (profile: StudentProfile): StudentStatus =>
  isNotStarted(profile) ? "not-started" : studentStatus(readinessOf(profile));

/** The participants who have answered something (the group figures count only these). */
export const activeProfiles = (list: StudentProfile[]) => list.filter((p) => !isNotStarted(p));

/** At or above the pass mark in a topic: at least 80% of the answers given there are right. */
export const topicPassed = (row: StudentTopic) =>
  row.answered > 0 && row.correct * 100 >= PASS_MARK * row.answered;

/** Below the pass mark in a topic they answered (a topic without an answer is neither). */
export const topicNeedsReview = (row: StudentTopic) => row.answered > 0 && !topicPassed(row);

/** The topics below the pass mark: never more than the topics the student answered. */
export const topicsToReview = (profile: Pick<StudentProfile, "topics">) =>
  profile.topics.filter(topicNeedsReview).length;

/** The second line of a student row: the status and what follows it ("4 to review"), see DESIGN.md. */
export function rowParts(profile: StudentProfile): { status: StudentStatus; tail: string | null } {
  const status = profileStatus(profile);
  const n = topicsToReview(profile);
  if (status === "not-started") return { status, tail: null };
  if (profile.participant.local) return { status, tail: null };
  if (status === "ready")
    return { status, tail: n === 0 ? "all topics on track" : `${n} to review` };
  // the long status words take the short form, so nothing wraps
  return { status, tail: `${n} to review` };
}

/** The same line as plain text (for tests and screen readers). */
export function rowText(profile: StudentProfile): string {
  const { status, tail } = rowParts(profile);
  const base = profile.participant.local
    ? `Your demo account · ${statusLabels[status]}`
    : statusLabels[status];
  return tail ? `${base} · ${tail}` : base;
}

export type StudentsFilter = "all" | "needs" | "certified";
export const filters: { value: StudentsFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "needs", label: "Attention" },
  { value: "certified", label: "Certified" },
];

/** A filter from the address, "all" when it is missing or unknown. */
export const filterFrom = (value: string | null): StudentsFilter =>
  filters.some((f) => f.value === value) ? (value as StudentsFilter) : "all";

/** Where a filtered list was opened from (the Overview or Topics): Back returns there. */
export type FilterOrigin = "overview" | "topics";
export const originFrom = (value: string | null): FilterOrigin | null =>
  value === "overview" || value === "topics" ? value : null;

/** The one-line label of the filter on the Students list, or null while the whole list shows. */
export function showingLine(
  filter: StudentsFilter,
  topic: { id: string; title: string } | null,
): string | null {
  const status =
    filter === "needs" ? "Needs attention" : filter === "certified" ? "Certified" : null;
  if (topic) {
    const base = `Below pass mark in ${topic.id} · ${topic.title}`;
    return status ? `${base} · ${status}` : base;
  }
  return status ? `Showing: ${status}` : null;
}

const rank: Record<StudentStatus, number> = { needs: 0, almost: 1, ready: 2, "not-started": 3 };

/** Needs attention first, then Almost ready, then Ready, then Not started; alphabetical inside each. */
export function sortProfiles(list: StudentProfile[]): StudentProfile[] {
  return [...list].sort(
    (a, b) =>
      rank[profileStatus(a)] - rank[profileStatus(b)] ||
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
  topic: string | null = null,
): StudentProfile[] {
  const kept = list.filter((profile) => {
    // the topic filter (from Weakest topics): below the pass mark in that topic
    if (topic) {
      const row = profile.topics.find((entry) => entry.sectionId === topic);
      if (!row || !topicNeedsReview(row)) return false;
    }
    if (filter === "needs") return profileStatus(profile) === "needs";
    if (filter === "certified") return certifiedAnywhere(profile.participant, exams, attempts, now);
    return true;
  });
  return sortProfiles(kept);
}

/** "Group A · 14 students", with " · 2 not started" when somebody has not answered anything. */
export const groupLine = (name: string, count: number, notStarted = 0) =>
  `${name} · ${count} ${count === 1 ? "student" : "students"}${notStarted > 0 ? ` · ${notStarted} not started` : ""}`;

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

/** A topic from the address ("S3"), null when it is missing or not a guide topic. */
export const topicFrom = (value: string | null): string | null =>
  value !== null && allTopicIds.includes(value) ? value : null;

export const notStartedCount = (list: StudentProfile[]) => list.filter(isNotStarted).length;
