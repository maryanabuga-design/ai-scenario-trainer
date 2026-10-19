import { useEffect } from "react";
import { isoDay, parseDeadline } from "@/lib/exam-deadline";
import { knownTopics } from "@/lib/readiness";
import { createStore } from "@/lib/store";

/**
 * An assigned exam. CLIENT ONLY (it is saved in this browser). Exam assignment is a single-browser
 * simulation of an admin feature; there is no server.
 */
export type AssignedExam = {
  id: string;
  title: string;
  topicIds: string[];
  /** YYYY-MM-DD, local. */
  deadline: string;
  assignedBy: string;
  assignedAt: number;
};

/** The one demo exam seeded on first load (docs: demo data). */
export const DEMO_EXAM_ID = "demo-evacuation-basics";
export const DEMO_EXAM_DAYS = 7;

export function demoExam(now: Date): AssignedExam {
  return {
    id: DEMO_EXAM_ID,
    title: "Evacuation basics exam",
    topicIds: ["S1", "S2", "S3", "S4"],
    deadline: isoDay(now, DEMO_EXAM_DAYS),
    assignedBy: "Admin",
    assignedAt: now.getTime(),
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The valid exams of whatever was read: unknown topics are dropped, a broken entry is ignored. */
export function cleanExams(value: unknown): AssignedExam[] | null {
  if (!Array.isArray(value)) return null;
  const exams = value.flatMap((entry): AssignedExam[] => {
    if (!isObject(entry)) return [];
    const { id, title, topicIds, deadline, assignedBy, assignedAt } = entry;
    if (typeof id !== "string" || id === "" || typeof title !== "string" || title.trim() === "")
      return [];
    if (typeof deadline !== "string" || !parseDeadline(deadline)) return [];
    const topics = Array.isArray(topicIds)
      ? knownTopics(topicIds.filter((topic): topic is string => typeof topic === "string"))
      : [];
    if (topics.length === 0) return [];
    return [
      {
        id,
        title,
        topicIds: topics,
        deadline,
        assignedBy: typeof assignedBy === "string" && assignedBy !== "" ? assignedBy : "Admin",
        assignedAt: typeof assignedAt === "number" ? assignedAt : 0,
      },
    ];
  });
  return exams.length > 0 ? exams : null;
}

/** Nearest deadline first (ties by when they were assigned). */
export function byDeadline(exams: AssignedExam[]): AssignedExam[] {
  return [...exams].sort(
    (a, b) => a.deadline.localeCompare(b.deadline) || a.assignedAt - b.assignedAt,
  );
}

/** The exam to show when none is chosen: the nearest deadline. */
export const nearestExam = (exams: AssignedExam[]): AssignedExam | null =>
  byDeadline(exams)[0] ?? null;

const store = createStore<AssignedExam[]>("ast.exams.v1", { sanitize: cleanExams });

export const readExams = () => store.read();
const useStored = store.useValue;

/** Saves the demo exam when nothing valid is stored; returns what is stored. */
export function seedExams(now: Date = new Date()): AssignedExam[] {
  const stored = cleanExams(store.read());
  if (stored) return stored;
  const seeded = [demoExam(now)];
  store.write(seeded);
  return seeded;
}

/** The assigned exams of this browser; the demo exam is seeded on first load. "loading" until read. */
export function useExams(): AssignedExam[] | "loading" {
  const stored = useStored();
  const missing = stored !== "loading" && cleanExams(stored) === null;
  useEffect(() => {
    if (missing) seedExams();
  }, [missing]);
  if (stored === "loading") return "loading";
  return cleanExams(stored) ?? [];
}
