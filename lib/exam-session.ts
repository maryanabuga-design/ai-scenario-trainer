import { EXAM_QUESTIONS } from "@/lib/config";
import { drawExam, examDurationMs } from "@/lib/exam";
import { demoExam, nearestExam, readExams } from "@/lib/assigned-exams";
import { currentAccount, readAuth } from "@/lib/auth";
import { recordCertificate } from "@/lib/certificates-store";
import { readGroupExams, recordAttempt } from "@/lib/group-store";
import { correctCount, scoreItem } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";
import { resultPercent } from "@/lib/results";
import type { FinishedSession } from "@/lib/session";
import { readExam, saveExam } from "@/lib/exam-store";
import type { ExamSession } from "@/lib/exam-store";
import { findItem } from "@/lib/items";
import { addToHistory, answerFor, topicIdsOf } from "@/lib/session";

/** Starts a new exam now, replacing any earlier one. */
export function startExam(
  now: number = Date.now(),
  random: () => number = Math.random,
  /** A group exam: its topics and question count, and the id the attempt is recorded against. */
  group?: { id: string; topicIds: string[]; questionCount: number },
) {
  saveExam({
    ...(group && { examId: group.id }),
    itemIds: drawExam(random, group?.questionCount ?? EXAM_QUESTIONS, group?.topicIds),
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
    mode: "exam",
    topicIds: topicIdsOf(exam.itemIds),
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
  // a passed attempt earns its (simulated) certificate: one per attempt, none on a fail
  const account = currentAccount(readAuth());
  if (account) {
    const scored = scoreExam({ itemIds: exam.itemIds, answers: ordered });
    const correct = correctCount(scored);
    const group = exam.examId ? readGroupExams().find((e) => e.id === exam.examId) : undefined;
    const certificate = recordCertificate({
      accountId: account.email,
      // the group exam, the assigned exam, or the demo exam the app shows when nothing is assigned yet
      examTitle:
        group?.title ??
        nearestExam(readExams() ?? [demoExam(new Date(finishedAt))])?.title ??
        "Training exam",
      correct,
      total: exam.itemIds.length,
      attemptAt: finishedAt,
      now: finishedAt,
    });
    // an attempt at a group exam is recorded against its id (the instructor's lists read it)
    if (exam.examId) {
      recordAttempt({
        examId: exam.examId,
        studentId: account.email,
        correct,
        total: exam.itemIds.length,
        finishedAt,
        ...(certificate && { certificateId: certificate.id }),
      });
    }
  }
}
