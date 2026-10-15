import { EXAM_QUESTIONS } from "@/lib/config";
import { drawExam, examDurationMs } from "@/lib/exam";
import { scoreItem } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";
import { resultPercent } from "@/lib/results";
import type { FinishedSession } from "@/lib/session";
import { readExam, saveExam } from "@/lib/exam-store";
import type { ExamSession } from "@/lib/exam-store";
import { findItem } from "@/lib/items";
import { addToHistory, answerFor } from "@/lib/session";

/** Starts a new exam now, replacing any earlier one. */
export function startExam(now: number = Date.now(), random: () => number = Math.random) {
  saveExam({
    itemIds: drawExam(random, EXAM_QUESTIONS),
    answers: [],
    index: 0,
    startedAt: now,
    endsAt: now + examDurationMs,
    finished: false,
  });
}

/** Every question of the exam graded: one with no answer counts as incorrect. */
export function scoreExam(exam: Pick<ExamSession, "itemIds" | "answers">): ScoredItem[] {
  return exam.itemIds.flatMap((id) => {
    const item = findItem(id);
    return item ? [scoreItem(item, answerFor(exam, id)?.optionId ?? "")] : [];
  });
}

/**
 * Finishes the exam (Finish, or the time running out) and adds it to the history. Unanswered
 * questions count as incorrect in the result; only the answered ones go to the history's answers.
 */
export function finishExam(exam: ExamSession, now: number = Date.now()) {
  // Finishing twice (the last Next and the timer together) adds one entry only.
  if (readExam()?.finished) return;
  const finishedAt = Math.min(now, exam.endsAt);
  const ordered = exam.itemIds.flatMap((id) => answerFor(exam, id) ?? []);
  const timeUsedSeconds = Math.round((finishedAt - exam.startedAt) / 1000);
  saveExam({ ...exam, answers: ordered, finished: true, finishedAt, timeUsedSeconds });
  const entry: FinishedSession = {
    kind: "exam",
    itemIds: exam.itemIds,
    answers: ordered,
    finishedAt,
    exam: {
      percent: resultPercent(scoreExam({ itemIds: exam.itemIds, answers: ordered })),
      questions: exam.itemIds.length,
      timeUsedSeconds,
    },
  };
  addToHistory(entry);
}
