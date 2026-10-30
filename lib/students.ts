import { PASS_MARK } from "@/lib/config";
import { statusOf, statusText } from "@/lib/cohort";
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
import { topicQuestionCount } from "@/lib/group-exams";
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
const DAY = 86_400_000;

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
  /** Whole days since the last answer; null for a student who has not started. */
  lastActiveDaysAgo: number | null;
  /** Practice sessions in the last 7 days. */
  practiceThisWeek: number;
  /** The readiness a week ago in whole percent (the invented students only); null without history. */
  readinessPrev: number | null;
};

/** A seeded student's per-topic figures, held to the real number of questions of each topic. */
export function seededProfile(student: SeededStudent, participant: Participant): StudentProfile {
  const topics = allTopicIds.map((id) => {
    const total = topicQuestionCount(id);
    const answered = Math.min(student.topics[id]?.answered ?? 0, total);
    const correct = Math.min(student.topics[id]?.correct ?? 0, answered);
    return { sectionId: id, correct, total, answered };
  });
  const allQuestions = topics.reduce((sum, row) => sum + row.total, 0);
  return {
    participant,
    field: student.field,
    ...(student.previousCorrect !== undefined && {
      previousCorrect: student.previousCorrect,
    }),
    topics,
    lastActiveDaysAgo: topics.some((row) => row.answered > 0) ? student.lastActiveDaysAgo : null,
    practiceThisWeek: student.practiceSessionsThisWeek ?? 0,
    readinessPrev:
      student.previousCorrect === undefined || allQuestions === 0
        ? null
        : Math.floor((student.previousCorrect * 100) / allQuestions + 1e-9),
  };
}

/** A local account's figures: exactly the Progress calculation over that account's history. */
export function localProfile(
  participant: Participant,
  history: FinishedSession[] | null,
  now: number = Date.now(),
): StudentProfile {
  const sessions = history ?? [];
  const latestAt = sessions.reduce((top, s) => Math.max(top, s.finishedAt), 0);
  const week = now - 7 * DAY;
  return {
    participant,
    field: participant.field ?? null,
    topics: allTopicIds.map((id) => {
      const latest = latestResults(history);
      const answered = scopeItemIds([id]).filter((item) => latest.has(item)).length;
      return { ...topicProgress(id, history), answered };
    }),
    // the date of the latest answer or exam attempt of this account
    lastActiveDaysAgo: latestAt === 0 ? null : Math.max(0, Math.floor((now - latestAt) / DAY)),
    practiceThisWeek: sessions.filter((s) => s.kind !== "exam" && s.finishedAt > week).length,
    readinessPrev: null,
  };
}

/** The profiles of the participants; `histories` holds the history of each local account by email. */
export function profiles(
  people: Participant[],
  histories: Record<string, FinishedSession[] | null>,
  now: number = Date.now(),
): StudentProfile[] {
  return people.map((participant) => {
    if (participant.local) return localProfile(participant, histories[participant.id] ?? null, now);
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

/** "today", "yesterday", "3d ago", "2w ago" (the days since the last answer). */
export function lastActiveShort(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return days < 14 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`;
}

/** "today", "yesterday", "6 days ago", "2 weeks ago" (the Student detail). */
export function lastActiveLong(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

/** The muted text after the status chip of a row: "· 5 to review" (none for Ready and Not started). */
export function rowMuted(profile: StudentProfile): string | null {
  const status = profileStatus(profile);
  if (status === "ready" || status === "not-started") return null;
  return `· ${topicsToReview(profile)} to review`;
}

/** The muted text in the topic students list: "· S3: 2 of 5 correct". */
export function topicMuted(profile: StudentProfile, topicId: string): string | null {
  const row = profile.topics.find((entry) => entry.sectionId === topicId);
  return row ? `· ${topicId}: ${row.correct} of ${row.answered} correct` : null;
}

/** The same row as plain text (for tests and screen readers): "Needs attention · 5 to review". */
export function rowText(profile: StudentProfile): string {
  const muted = rowMuted(profile);
  return `${statusLabels[profileStatus(profile)]}${muted ? ` ${muted}` : ""}`;
}

/** The change of the readiness since last week in points, or null without history (accounts of this browser have none). */
export function readinessChange(profile: StudentProfile): number | null {
  if (profile.readinessPrev === null || isNotStarted(profile)) return null;
  return readinessOf(profile) - profile.readinessPrev;
}

/** The topics of a student below the pass mark in `topicId` (the students of the topic list). */
export const belowPassMark = (list: StudentProfile[], topicId: string) =>
  list.filter((profile) => {
    const row = profile.topics.find((entry) => entry.sectionId === topicId);
    return !!row && topicNeedsReview(row);
  });

/** Whether a name matches the search text (case-insensitive, anywhere in the name). */
export const matchesQuery = (name: string, query: string) =>
  query.trim() === "" || name.toLowerCase().includes(query.trim().toLowerCase());

export type StudentsFilter = "all" | "needs" | "ready" | "almost" | "not-started";

/** The five filter chips, in order: All and the four statuses. */
export const filters: { value: StudentsFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "needs", label: "Needs attention" },
  { value: "almost", label: "Almost ready" },
  { value: "ready", label: "Ready" },
  { value: "not-started", label: "Not started" },
];
const allFilters = filters.map((f) => f.value);

/** A filter from the address, "all" when it is missing or unknown. */
export const filterFrom = (value: string | null): StudentsFilter =>
  allFilters.includes(value as StudentsFilter) ? (value as StudentsFilter) : "all";

/** Whether the filter is one of the chips. */
export const isChipFilter = (filter: StudentsFilter) => filters.some((f) => f.value === filter);

const filterWords: Record<StudentsFilter, string> = {
  all: "All",
  needs: "Needs attention",
  ready: "Ready",
  almost: "Almost ready",
  "not-started": "Not started",
};

/** Where a filtered list was opened from (the Overview or Topics): Back returns there. */
export type FilterOrigin = "overview" | "topics";
export const originFrom = (value: string | null): FilterOrigin | null =>
  value === "overview" || value === "topics" ? value : null;

/**
 * The text of the filter line: "Showing: Not started" for a status that is not a chip, "Below pass
 * mark in S3 · Moving through smoke" for a topic; null while only the chips filter.
 */
export function showingLine(
  filter: StudentsFilter,
  topic: { id: string; title: string } | null,
): string | null {
  if (topic) {
    const base = `Below pass mark in ${topic.id} · ${topic.title}`;
    return filter === "all" ? base : `${base} · ${filterWords[filter]}`;
  }
  return isChipFilter(filter) ? null : `Showing: ${filterWords[filter]}`;
}

const rank: Record<StudentStatus, number> = {
  needs: 0,
  almost: 1,
  "not-started": 2,
  ready: 3,
};

/** Needs attention first, then Almost ready, then Not started, then Ready; alphabetical inside each. */
export function sortProfiles(list: StudentProfile[]): StudentProfile[] {
  return [...list].sort(
    (a, b) =>
      rank[profileStatus(a)] - rank[profileStatus(b)] ||
      a.participant.name.localeCompare(b.participant.name),
  );
}

/** The list for a status filter, a name search and a topic (below the pass mark in it), sorted. */
export function visibleStudents(
  list: StudentProfile[],
  filter: StudentsFilter,
  query = "",
  topic: string | null = null,
): StudentProfile[] {
  const kept = list.filter((profile) => {
    if (topic) {
      const row = profile.topics.find((entry) => entry.sectionId === topic);
      if (!row || !topicNeedsReview(row)) return false;
    }
    if (!matchesQuery(profile.participant.name, query)) return false;
    const status = profileStatus(profile);
    return filter === "all" || status === (filter === "needs" ? "needs" : filter);
  });
  return sortProfiles(kept);
}

/** "Group A · 14 students", with " · 2 not started" when somebody has not answered anything. */
export const groupLine = (name: string, count: number, notStarted = 0) =>
  `${name} · ${count} ${count === 1 ? "student" : "students"}${notStarted > 0 ? ` · ${notStarted} not started` : ""}`;

/** "Passed · 17 of 20 correct", "Not passed · 14 of 20 correct", "In progress", "Missed" or "Not started". */
export function statusDetail(status: ExamStatus): string {
  return statusText(status);
}

export type StudentExamRow = {
  exam: GroupExam;
  status: ExamStatus;
  /** A Passed result of a local account with a certificate: the row opens it. */
  certificateId?: string;
};

/** The exams of one student (those for the student's group), newest deadline first, with the same statuses as the Exam detail. */
export function examRowsFor(
  participant: Participant,
  exams: GroupExam[],
  attempts: Attempt[],
  now: number,
): StudentExamRow[] {
  return exams
    .filter((exam) => exam.groupIds.includes(participant.groupId))
    .sort((a, b) => b.deadline.localeCompare(a.deadline) || b.createdAt - a.createdAt)
    .map((exam) => {
      const context: StatusContext = { attempts, now };
      const status = statusOf(participant, exam, context);
      return {
        exam,
        status,
        ...(status.kind === "passed" &&
          status.certificateId && { certificateId: status.certificateId }),
      };
    });
}

/** A topic from the address ("S3"), null when it is missing or not a guide topic. */
export const topicFrom = (value: string | null): string | null =>
  value !== null && allTopicIds.includes(value) ? value : null;

export const notStartedCount = (list: StudentProfile[]) => list.filter(isNotStarted).length;

/** The query of Assign exam with a topic chosen (the title is prefilled from it). */
export const assignOnTopicParams = (topicId: string) => `topic=${topicId}&from=students`;
