import cohort from "@/content/demo-cohort.json";
import { examQuestionIds } from "@/lib/exam-pool";
import { isActive } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { DEFAULT_GROUP_ID } from "@/lib/groups";
import { passCount } from "@/lib/results";

/**
 * The demo participants of the Instructor side (DESIGN.md: Instructor, demo group and groups): 26
 * fictional students in two groups plus the local student accounts of this browser (Rescue team), and the status of each participant for an exam.
 * Pure: every group figure is computed here from one participants list, so numbers match everywhere.
 */
export type Field = "rescue" | "paramedic" | "military" | "civil" | "other";

export type SeededStudent = {
  id: string;
  /** The id of the demo group (`lib/groups.ts`). */
  group: string;
  name: string;
  initials: string;
  field: Field;
  topics: Record<string, { answered: number; correct: number }>;
  lastActiveDaysAgo: number;
  /** Practice sessions in the last 7 days (the demo history). */
  practiceSessionsThisWeek: number;
  /** The correct answers a week ago (all topics together): the demo history behind "since last week". */
  previousCorrect?: number;
};

export const seededStudents = cohort.students as SeededStudent[];
/** What a student is told about the Instructor (Profile and Create account). */
export const INSTRUCTOR_SEES = "Your instructor can see your progress and exam results.";

export type Participant = {
  /** A seeded student id ("stu-01") or the email of a local account. */
  id: string;
  name: string;
  initials: string;
  /** A student account of this browser (real data), labelled "Your demo account". */
  local: boolean;
  /** The group: seeded students have theirs, a local account joins the default group. */
  groupId: string;
  /** The field of work of a local account, when it chose one. */
  field?: Field | null;
};

/**
 * One attempt at a group exam, kept on this device (DESIGN.md: Instructor, Exams rebuilt): it starts
 * unfinished (no `finishedAt`) and is finished by Finish or the timer. `answers` holds a right or
 * wrong for each question id.
 */
export type Attempt = {
  examId: string;
  /** The email of the local account, or the id of a seeded student. */
  studentId: string;
  startedAt: number;
  finishedAt?: number;
  correct: number;
  total: number;
  answers: Record<string, boolean>;
  certificateId?: string;
};

/**
 * The status of a participant for an exam: Passed (the best finished attempt reaches the pass mark),
 * Not passed (finished attempts, none passed), In progress (an unfinished attempt), Not started
 * (nothing yet, exam still Active) or Missed (nothing, exam Closed). "Certified" is not a status.
 */
export type ExamStatus =
  | { kind: "not-started" }
  | { kind: "missed" }
  | { kind: "in-progress"; startedAt: number; attempt: number }
  | { kind: "not-passed"; correct: number; total: number; attempts: number }
  | { kind: "passed"; correct: number; total: number; attempts: number; certificateId?: string };

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

/** The group: the local student accounts first (real data), then the seeded students. */
export function participants(
  local: {
    name: string;
    email: string;
    field?: Field | null;
    groupId?: string;
    noGroup?: boolean;
  }[],
): Participant[] {
  return [
    // a student who left the group is in no roster
    ...local
      .filter((account) => !account.noGroup)
      .map((account) => ({
        id: account.email,
        name: account.name,
        initials: initialsOf(account.name),
        local: true,
        // a Student who joined through a link or an invitation is in that group
        groupId: account.groupId ?? DEFAULT_GROUP_ID,
        // the field of work the person chose (shown on the Instructor's Student detail)
        field: account.field ?? null,
      })),
    ...seededStudents.map((student) => ({
      id: student.id,
      name: student.name,
      initials: student.initials,
      local: false,
      groupId: student.group,
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

/** What the status helpers need to know about an exam (a `GroupExam` has all of it). */
export type ExamKey = Pick<
  GroupExam,
  "id" | "topicIds" | "deadline" | "questionCount" | "attemptsAllowed" | "createdAt" | "closedAt"
>;

/** The attempts a seeded student has made at an exam: deterministic from (student, exam, deadline). */
export function seededAttempts(studentId: string, exam: ExamKey, now: number): Attempt[] {
  const key = `${studentId}|${exam.id}|${exam.deadline}`;
  const u = unit(key);
  const active = isActive(exam, now);
  const [passedBelow, notPassedBelow] = active ? [0.3, 0.45] : [0.6, 0.85];
  const total = exam.questionCount;
  const pass = passCount(total);
  const allowed = exam.attemptsAllowed ?? 3;
  const span = Math.max(60_000, Math.min(now, exam.createdAt + 86_400_000 * 14) - exam.createdAt);
  const make = (index: number, correct: number): Attempt => {
    const startedAt = exam.createdAt + Math.floor(unit(key, `t${index}`) * span * 0.9);
    return {
      examId: exam.id,
      studentId,
      startedAt,
      finishedAt: startedAt + (8 + Math.floor(unit(key, `d${index}`) * 10)) * 60_000,
      correct,
      total,
      answers: seededAnswers(studentId, exam, correct),
    };
  };
  const failing = (index: number) => {
    const low = Math.ceil(total * 0.4);
    return Math.min(pass - 1, low + Math.floor(unit(key, `f${index}`) * Math.max(1, pass - low)));
  };
  if (u < passedBelow) {
    const tries = allowed === 1 ? 1 : 1 + (unit(key, "n") < 0.4 ? 1 : 0);
    const list = Array.from({ length: tries - 1 }, (_, i) => make(i, failing(i)));
    const correct = pass + Math.floor(unit(key, "c") * (total - pass + 1));
    return [...list, make(tries - 1, correct)];
  }
  if (u < notPassedBelow) {
    const tries = 1 + Math.floor(unit(key, "n") * Math.min(allowed, 3));
    return Array.from({ length: tries }, (_, i) => make(i, failing(i)));
  }
  if (active && unit(key, "ip") < 0.35) {
    const minutes = 3 + Math.floor(unit(key, "m") * 14);
    return [
      {
        examId: exam.id,
        studentId,
        startedAt: now - minutes * 60_000,
        correct: 0,
        total,
        answers: {},
      },
    ];
  }
  return [];
}

/** Which questions a seeded attempt got wrong: the harder ones of the exam first, so the same questions are hard for everyone. */
function seededAnswers(studentId: string, exam: ExamKey, correct: number): Record<string, boolean> {
  const ids = examQuestionIds(exam);
  const wrong = Math.max(0, ids.length - correct);
  const hardness = (id: string) =>
    unit(id, exam.id) * 0.75 + unit(id, `${studentId}|${exam.id}`) * 0.25;
  const hardest = new Set([...ids].sort((a, b) => hardness(b) - hardness(a)).slice(0, wrong));
  return Object.fromEntries(ids.map((id) => [id, !hardest.has(id)]));
}

/** The attempts of a participant at an exam: the real ones of a local account, the seeded ones otherwise. */
export function attemptsOf(
  participant: Participant,
  exam: ExamKey,
  attempts: Attempt[],
  now: number,
): Attempt[] {
  return participant.local
    ? attempts.filter((a) => a.studentId === participant.id && a.examId === exam.id)
    : seededAttempts(participant.id, exam, now);
}

/** The finished attempts, earliest first. */
export const finishedOf = (list: Attempt[]) =>
  list.filter((a) => a.finishedAt !== undefined).sort((a, b) => a.finishedAt! - b.finishedAt!);

/** The best finished attempt: the most correct answers, the earliest on a tie. */
export function bestAttempt(list: Attempt[]): Attempt | null {
  const done = finishedOf(list);
  return done.reduce<Attempt | null>((top, a) => (top && top.correct >= a.correct ? top : a), null);
}

/** The status from a participant's attempts, the exam and the time (see ExamStatus). */
export function deriveStatus(list: Attempt[], exam: ExamKey, now: number): ExamStatus {
  const done = finishedOf(list);
  const best = bestAttempt(list);
  if (best && best.correct >= passCount(best.total)) {
    const certified = done.find((a) => a.correct >= passCount(a.total) && a.certificateId);
    return {
      kind: "passed",
      correct: best.correct,
      total: best.total,
      attempts: done.length,
      ...(certified?.certificateId && { certificateId: certified.certificateId }),
    };
  }
  const open = list.find((a) => a.finishedAt === undefined);
  if (open) return { kind: "in-progress", startedAt: open.startedAt, attempt: done.length + 1 };
  if (best)
    return { kind: "not-passed", correct: best.correct, total: best.total, attempts: done.length };
  return { kind: isActive(exam, now) ? "not-started" : "missed" };
}

/** The attempts a student may still make (null: unlimited). */
export function attemptsLeft(
  exam: Pick<ExamKey, "attemptsAllowed">,
  list: Attempt[],
): number | null {
  if (exam.attemptsAllowed === null) return null;
  return Math.max(0, exam.attemptsAllowed - finishedOf(list).length);
}

export type StatusContext = { attempts: Attempt[]; now: number };

export function statusOf(
  participant: Participant,
  exam: ExamKey,
  context: StatusContext,
): ExamStatus {
  return deriveStatus(
    attemptsOf(participant, exam, context.attempts, context.now),
    exam,
    context.now,
  );
}

export type GroupCounts = {
  passed: number;
  notPassed: number;
  inProgress: number;
  notStarted: number;
  missed: number;
  total: number;
};

/** "Tried": passed, not passed or in progress. */
export const triedCount = (counts: GroupCounts) =>
  counts.passed + counts.notPassed + counts.inProgress;

/** The counts of the group for an exam, from the one participants list. */
export function groupCounts(
  people: Participant[],
  exam: ExamKey,
  context: StatusContext,
): GroupCounts {
  const counts = {
    passed: 0,
    notPassed: 0,
    inProgress: 0,
    notStarted: 0,
    missed: 0,
    total: people.length,
  };
  for (const person of people) {
    const kind = statusOf(person, exam, context).kind;
    if (kind === "passed") counts.passed += 1;
    else if (kind === "not-passed") counts.notPassed += 1;
    else if (kind === "in-progress") counts.inProgress += 1;
    else if (kind === "missed") counts.missed += 1;
    else counts.notStarted += 1;
  }
  return counts;
}

export type StudentRow = { participant: Participant; status: ExamStatus };

const rank: Record<ExamStatus["kind"], number> = {
  "not-passed": 0,
  "in-progress": 1,
  "not-started": 2,
  missed: 2,
  passed: 3,
};

/** The roster: Not passed first, then In progress, then Not started or Missed, then Passed; by name inside. */
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

/** The wording of a status: "Passed", "Not passed · 14 of 20 correct", "In progress", "Not started" or "Missed". */
export function statusText(status: ExamStatus): string {
  switch (status.kind) {
    case "passed":
      return `Passed · ${status.correct} of ${status.total} correct`;
    case "not-passed":
      return `Not passed · ${status.correct} of ${status.total} correct`;
    case "in-progress":
      return "In progress";
    case "missed":
      return "Missed";
    default:
      return "Not started";
  }
}
