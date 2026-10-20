import cohort from "@/content/demo-cohort.json";
import { passCount } from "@/lib/results";

/**
 * The demo group of the Instructor side (DESIGN.md: Instructor, demo group): 14 fictional students
 * plus the local student accounts of this browser, and the status of each participant for an exam.
 * Pure: every group figure is computed here from one participants list, so numbers match everywhere.
 */
export type Field = "rescue" | "paramedic" | "military" | "civil" | "other";

export type SeededStudent = {
  id: string;
  name: string;
  initials: string;
  field: Field;
  topics: Record<string, { answered: number; correct: number }>;
  lastActiveDaysAgo: number;
};

export const GROUP_NAME = cohort.group.name;
export const seededStudents = cohort.students as SeededStudent[];
export const DEMO_NOTE = "Demo group. Student data on this screen is simulated.";

export type Participant = {
  /** A seeded student id ("stu-01") or the email of a local account. */
  id: string;
  name: string;
  initials: string;
  /** A student account of this browser (real data), labelled "Your demo account". */
  local: boolean;
};

/** One attempt at a group exam, kept on this device. */
export type Attempt = {
  examId: string;
  /** The email of the local account. */
  studentId: string;
  correct: number;
  total: number;
  finishedAt: number;
  certificateId?: string;
};

export type ExamStatus =
  | { kind: "not-started" }
  | { kind: "not-passed"; correct: number; total: number }
  | { kind: "certified"; correct: number; total: number; certificateId?: string };

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

/** The group: the local student accounts first (real data), then the seeded students. */
export function participants(local: { name: string; email: string }[]): Participant[] {
  return [
    ...local.map((account) => ({
      id: account.email,
      name: account.name,
      initials: initialsOf(account.name),
      local: true,
    })),
    ...seededStudents.map((student) => ({
      id: student.id,
      name: student.name,
      initials: student.initials,
      local: false,
    })),
  ];
}

/** A number from 0 up to (not including) 1 that depends only on the text. */
export function unit(text: string, salt = ""): number {
  let hash = 2166136261;
  for (const char of `${salt}|${text}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash / 4294967296;
}

type ExamKey = { id: string; deadline: string; questionCount: number };

/**
 * The status of a seeded student: deterministic from (student, exam, deadline). A closed exam has
 * about 60% Certified, 25% Not passed and the rest Not started; an exam still open has fewer attempts.
 */
export function seededStatus(studentId: string, exam: ExamKey, active: boolean): ExamStatus {
  const key = `${studentId}|${exam.id}|${exam.deadline}`;
  const u = unit(key);
  const [certified, notPassed] = active ? [0.3, 0.45] : [0.6, 0.85];
  const total = exam.questionCount;
  const pass = passCount(total);
  if (u < certified) {
    const correct = pass + Math.floor(unit(key, "c") * (total - pass + 1));
    return { kind: "certified", correct, total };
  }
  if (u < notPassed) {
    const low = Math.ceil(total * 0.4);
    const correct = low + Math.floor(unit(key, "n") * Math.max(1, pass - low));
    return { kind: "not-passed", correct: Math.min(correct, pass - 1), total };
  }
  return { kind: "not-started" };
}

/** The status of a local account from its real attempts at the exam: the best one counts. */
export function localStatus(attempts: Attempt[], email: string, examId: string): ExamStatus {
  const mine = attempts.filter((a) => a.studentId === email && a.examId === examId);
  if (mine.length === 0) return { kind: "not-started" };
  const passed = mine
    .filter((a) => a.correct >= passCount(a.total))
    .sort((a, b) => b.correct - a.correct || a.finishedAt - b.finishedAt)[0];
  if (passed) {
    return {
      kind: "certified",
      correct: passed.correct,
      total: passed.total,
      ...(passed.certificateId && { certificateId: passed.certificateId }),
    };
  }
  const best = [...mine].sort((a, b) => b.correct - a.correct)[0];
  return { kind: "not-passed", correct: best.correct, total: best.total };
}

export type StatusContext = { attempts: Attempt[]; active: boolean };

export function statusOf(
  participant: Participant,
  exam: ExamKey,
  context: StatusContext,
): ExamStatus {
  return participant.local
    ? localStatus(context.attempts, participant.id, exam.id)
    : seededStatus(participant.id, exam, context.active);
}

export type GroupCounts = {
  certified: number;
  notPassed: number;
  notStarted: number;
  total: number;
};

/** The counts of the group for an exam, from the one participants list. */
export function groupCounts(
  people: Participant[],
  exam: ExamKey,
  context: StatusContext,
): GroupCounts {
  const counts = { certified: 0, notPassed: 0, notStarted: 0, total: people.length };
  for (const person of people) {
    const status = statusOf(person, exam, context).kind;
    if (status === "certified") counts.certified += 1;
    else if (status === "not-passed") counts.notPassed += 1;
    else counts.notStarted += 1;
  }
  return counts;
}

export type StudentRow = { participant: Participant; status: ExamStatus };

const rank: Record<ExamStatus["kind"], number> = {
  "not-passed": 0,
  "not-started": 1,
  certified: 2,
};

/** The rows of the detail list: Not passed first, then Not started, then Certified; by name inside. */
export function studentRows(
  people: Participant[],
  exam: ExamKey,
  context: StatusContext,
): StudentRow[] {
  return people
    .map((participant) => ({ participant, status: statusOf(participant, exam, context) }))
    .sort(
      (a, b) =>
        rank[a.status.kind] - rank[b.status.kind] ||
        a.participant.name.localeCompare(b.participant.name),
    );
}

/** The wording of a status: "Certified", "Not passed · 14 of 20 correct" or "Not started". */
export function statusText(status: ExamStatus): string {
  if (status.kind === "certified") return "Certified";
  if (status.kind === "not-started") return "Not started";
  return `Not passed · ${status.correct} of ${status.total} correct`;
}
