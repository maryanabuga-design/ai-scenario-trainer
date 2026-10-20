import { findItem } from "@/lib/items";
import type { Answer } from "@/lib/session";
import { cleanExam } from "@/lib/saved-data";
import { createStore } from "@/lib/store";

/**
 * The running or last finished exam. It has its own key and never touches the normal session, so
 * Home and Training never see an unfinished exam.
 */
export type ExamSession = {
  itemIds: string[];
  answers: Answer[];
  /** The question on screen. */
  index: number;
  /** The group exam this attempt is for (the Instructor side); absent for the generic exam. */
  examId?: string;
  startedAt: number;
  /** When the time is up: stored, so a refresh keeps the timer. */
  endsAt: number;
  finished: boolean;
  finishedAt?: number;
  timeUsedSeconds?: number;
};

const examStore = createStore<ExamSession>("ast.exam.v1", { sanitize: cleanExam });

export const useExam = examStore.useValue;

/** The exam saved right now, read from the browser. */
export const readExam = () => examStore.read();

/** An exam that has the shape this version expects. */
export function isValidExam(value: unknown): value is ExamSession {
  const exam = value as ExamSession | null;
  return (
    !!exam &&
    typeof exam === "object" &&
    Array.isArray(exam.itemIds) &&
    Array.isArray(exam.answers) &&
    typeof exam.index === "number" &&
    typeof exam.endsAt === "number" &&
    typeof exam.finished === "boolean" &&
    exam.itemIds.every((id) => findItem(id) !== undefined)
  );
}

export function saveExam(exam: ExamSession) {
  examStore.write(exam);
}

/** Leaving the exam: nothing is saved and it cannot be continued. */
export function clearExam() {
  examStore.write(null);
}
