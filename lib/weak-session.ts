import type { AssignedExam } from "@/lib/assigned-exams";
import { weakSessionIds } from "@/lib/readiness";
import { startSession } from "@/lib/session";
import type { FinishedSession } from "@/lib/session";

/** The exam screen a session started from the exam returns to. */
export const examPath = (examId: string) => `/exam?id=${encodeURIComponent(examId)}`;

/**
 * Starts "Repeat weak topics" for an exam: a practice session of kind "repeat" (the normal
 * training feedback) with up to 10 questions, remembering the exam so Results ends with Done.
 * Returns false when there is nothing to repeat. CLIENT ONLY.
 */
export function startWeakSession(exam: AssignedExam, history: FinishedSession[] | null): boolean {
  const ids = weakSessionIds(exam.topicIds, history);
  if (ids.length === 0) return false;
  startSession("repeat", ids, {
    returnTo: examPath(exam.id),
    examId: exam.id,
  });
  return true;
}
