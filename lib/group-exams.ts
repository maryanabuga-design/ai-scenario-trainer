import cohort from "@/content/demo-cohort.json";
import { EXAM_MINUTES, EXAM_QUESTIONS, PASS_MARK } from "@/lib/config";
import { isoDay, parseDeadline } from "@/lib/exam-deadline";
import { modeItems, trainingSections } from "@/lib/parts";

/**
 * The exams of the Instructor side (DESIGN.md: Instructor, Exams). Pure: the shared storage is in
 * `lib/group-exams-store.ts`. An exam is Active until the end of its deadline day.
 */
export type GroupExam = {
  id: string;
  title: string;
  topicIds: string[];
  questionCount: number;
  timeLimit: number;
  passMark: number;
  /** A local date, YYYY-MM-DD. */
  deadline: string;
  createdAt: number;
  createdBy: string;
  /** Set when the instructor closed the exam before its deadline. */
  closedAt?: number;
};

/** The fewest questions the selected topics must hold. */
export const MIN_QUESTIONS = 10;

const questionTotal = new Map<string, number>();
for (const item of [...modeItems("scenario"), ...modeItems("quiz")]) {
  questionTotal.set(item.section, (questionTotal.get(item.section) ?? 0) + 1);
}

/** The number of questions (scenario and quiz) a guide topic holds. */
export const topicQuestionCount = (topicId: string) => questionTotal.get(topicId) ?? 0;

/** The questions the selected topics hold in total. */
export const totalQuestions = (topicIds: string[]) =>
  topicIds.reduce((sum, id) => sum + topicQuestionCount(id), 0);

/** 20 questions, or the real number when the topics hold fewer. */
export const examQuestionCount = (topicIds: string[]) =>
  Math.min(EXAM_QUESTIONS, totalQuestions(topicIds));

/** Topics in guide order, known ones only, each once. */
export const knownTopicIds = (ids: string[]) =>
  trainingSections.filter((section) => ids.includes(section));

const endOfDay = (iso: string): number => {
  const date = parseDeadline(iso);
  return date
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime()
    : 0;
};

/** Active until the end of the deadline day, unless the instructor closed it. */
export function isActive(exam: Pick<GroupExam, "deadline" | "closedAt">, now: number): boolean {
  return exam.closedAt === undefined && now <= endOfDay(exam.deadline);
}

/** A deadline is allowed when it is today or later. */
export function deadlineAllowed(iso: string, now: number): boolean {
  const date = parseDeadline(iso);
  return date !== null && iso >= isoDay(new Date(now));
}

export type DeadlinePreset = "3d" | "1w" | "2w" | "date";
export const presets: { id: DeadlinePreset; label: string; days?: number }[] = [
  { id: "3d", label: "In 3 days", days: 3 },
  { id: "1w", label: "In 1 week", days: 7 },
  { id: "2w", label: "In 2 weeks", days: 14 },
  { id: "date", label: "Pick a date" },
];

/** The deadline a preset gives (null for "Pick a date"). */
export function presetDeadline(preset: DeadlinePreset, now: number): string | null {
  const days = presets.find((p) => p.id === preset)?.days;
  return days === undefined ? null : isoDay(new Date(now), days);
}

/** "Exam: " and the names of the first selected topics. */
export function defaultTitle(topicIds: string[], titleOf: (id: string) => string): string {
  if (topicIds.length === 0) return "";
  const names = topicIds.slice(0, 2).map(titleOf).join(", ");
  return `Exam: ${names}${topicIds.length > 2 ? ` +${topicIds.length - 2}` : ""}`;
}

export type AssignInput = { title: string; topicIds: string[]; deadline: string | null };

/** Why the exam cannot be assigned yet; empty when it can. */
export function assignProblems(input: AssignInput, now: number): string[] {
  const problems: string[] = [];
  if (input.title.trim() === "") problems.push("Add a title.");
  if (input.topicIds.length === 0) problems.push("Choose at least one topic.");
  else if (totalQuestions(input.topicIds) < MIN_QUESTIONS)
    problems.push(`Choose topics with at least ${MIN_QUESTIONS} questions in total.`);
  if (!input.deadline) problems.push("Choose a deadline.");
  else if (!deadlineAllowed(input.deadline, now))
    problems.push("The deadline cannot be in the past.");
  return problems;
}

let counter = 0;
/** A new exam from valid input. */
export function createExam(input: AssignInput, now: number, createdBy = "Instructor"): GroupExam {
  counter += 1;
  const topicIds = knownTopicIds(input.topicIds);
  return {
    id: `grp-${now.toString(36)}-${counter}`,
    title: input.title.trim(),
    topicIds,
    questionCount: examQuestionCount(topicIds),
    timeLimit: EXAM_MINUTES,
    passMark: PASS_MARK,
    deadline: input.deadline ?? isoDay(new Date(now)),
    createdAt: now,
    createdBy,
  };
}

/** The two seeded exams, one Active and one Closed, dated from `now`. */
export function seedGroupExams(now: number): GroupExam[] {
  return cohort.exams.map((entry) => {
    const topicIds = knownTopicIds(entry.topicIds);
    return {
      id: entry.id,
      title: entry.title,
      topicIds,
      questionCount: examQuestionCount(topicIds),
      timeLimit: EXAM_MINUTES,
      passMark: PASS_MARK,
      deadline: isoDay(new Date(now), entry.deadlineOffsetDays),
      createdAt: now - entry.createdDaysAgo * 86_400_000,
      createdBy: "Instructor",
    };
  });
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Tolerant loading: a broken exam is dropped, unknown topics are removed, nothing throws. */
export function cleanGroupExams(value: unknown): GroupExam[] | null {
  if (!Array.isArray(value)) return null;
  const list: GroupExam[] = [];
  for (const entry of value) {
    if (!isObject(entry)) continue;
    const { id, title, topicIds, deadline, createdAt, createdBy, closedAt } = entry;
    if (typeof id !== "string" || id === "" || list.some((e) => e.id === id)) continue;
    if (typeof title !== "string" || title.trim() === "") continue;
    if (typeof deadline !== "string" || !parseDeadline(deadline)) continue;
    const topics = Array.isArray(topicIds)
      ? knownTopicIds(topicIds.filter((t): t is string => typeof t === "string"))
      : [];
    if (topics.length === 0 || totalQuestions(topics) < MIN_QUESTIONS) continue;
    list.push({
      id,
      title: title.trim(),
      topicIds: topics,
      questionCount: examQuestionCount(topics),
      timeLimit: EXAM_MINUTES,
      passMark: PASS_MARK,
      deadline,
      createdAt: typeof createdAt === "number" && Number.isFinite(createdAt) ? createdAt : 0,
      createdBy: typeof createdBy === "string" && createdBy !== "" ? createdBy : "Instructor",
      ...(typeof closedAt === "number" && Number.isFinite(closedAt) && { closedAt }),
    });
  }
  return list.length > 0 ? list : null;
}

/** Active exams first (nearest deadline first), then closed ones (latest deadline first). */
export function splitExams(exams: GroupExam[], now: number) {
  const active = exams
    .filter((e) => isActive(e, now))
    .sort((a, b) => a.deadline.localeCompare(b.deadline) || b.createdAt - a.createdAt);
  const closed = exams
    .filter((e) => !isActive(e, now))
    .sort((a, b) => b.deadline.localeCompare(a.deadline) || b.createdAt - a.createdAt);
  return { active, closed };
}

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
/** "25 Oct" for a deadline. */
export const shortDate = (iso: string) => {
  const date = parseDeadline(iso);
  return date ? dayMonth.format(date) : iso;
};

/** "Due 25 Oct · 6 topics". */
export const dueLine = (exam: Pick<GroupExam, "deadline" | "topicIds">) =>
  `Due ${shortDate(exam.deadline)} · ${exam.topicIds.length} ${exam.topicIds.length === 1 ? "topic" : "topics"}`;

/** The topics on one line: the first two names and "+n more". */
export function topicsLine(topicIds: string[], titleOf: (id: string) => string): string {
  const names = topicIds.slice(0, 2).map(titleOf);
  const more = topicIds.length - names.length;
  return more > 0 ? `${names.join(", ")} +${more} more` : names.join(", ");
}

/** "20 questions · 20 minutes · pass mark 80". */
export const rulesLine = (exam: Pick<GroupExam, "questionCount" | "timeLimit" | "passMark">) =>
  `${exam.questionCount} questions · ${exam.timeLimit} minutes · pass mark ${exam.passMark}`;
