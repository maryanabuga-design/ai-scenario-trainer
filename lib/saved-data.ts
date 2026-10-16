import type { ExamSession } from "@/lib/exam-store";
import { findItem } from "@/lib/items";
import type { PartRecords } from "@/lib/part-progress";
import { getPart } from "@/lib/parts";
import type { Answer, FinishedSession, Session } from "@/lib/session";

/**
 * Cleaners for saved progress. Each takes whatever was read from the browser and returns data the
 * app can use, or null for an empty state. Unknown question ids (content that was replaced) are
 * dropped silently and nothing throws; valid answers stay.
 */

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isKnown = (id: unknown): id is string => typeof id === "string" && findItem(id) !== undefined;

function knownAnswers(value: unknown): Answer[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (answer): answer is Answer =>
      isObject(answer) && isKnown(answer.itemId) && typeof answer.optionId === "string",
  );
}

/** A list of questions (a session or an exam): only valid when every question still exists. */
function cleanQuestionList<T extends Pick<Session, "itemIds" | "answers" | "index">>(
  value: unknown,
): T | null {
  if (!isObject(value) || !Array.isArray(value.itemIds) || !Array.isArray(value.answers)) {
    return null;
  }
  const ids = value.itemIds;
  if (ids.length === 0 || !ids.every(isKnown)) return null;
  const index = typeof value.index === "number" ? value.index : 0;
  return {
    ...value,
    answers: knownAnswers(value.answers),
    index: Math.max(0, Math.min(index, ids.length - 1)),
  } as unknown as T;
}

/** A session with an unknown question, or none left, is discarded. */
export function cleanSession(value: unknown): Session | null {
  const session = cleanQuestionList<Session>(value);
  return session && typeof session.finished === "boolean" ? session : null;
}

/** An exam with an unknown question is discarded: it cannot be continued anyway. */
export function cleanExam(value: unknown): ExamSession | null {
  const exam = cleanQuestionList<ExamSession>(value);
  return exam && typeof exam.endsAt === "number" && typeof exam.finished === "boolean"
    ? exam
    : null;
}

/** Finished sessions: unknown answers are removed, and an entry with nothing valid left is dropped. */
export function cleanHistory(value: unknown): FinishedSession[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((entry) => {
    if (!isObject(entry) || typeof entry.finishedAt !== "number") return [];
    const answers = knownAnswers(entry.answers);
    if (answers.length === 0) return [];
    const itemIds = Array.isArray(entry.itemIds) ? entry.itemIds.filter(isKnown) : [];
    return [{ ...entry, answers, itemIds } as unknown as FinishedSession];
  });
}

/** Part results: unknown ids are removed, and a result that only referred to unknown ids is ignored. */
export function cleanPartRecords(value: unknown): PartRecords | null {
  if (!isObject(value)) return null;
  const records: PartRecords = {};
  for (const [id, record] of Object.entries(value)) {
    if (!getPart(id) || !isObject(record) || typeof record.lastPercent !== "number") continue;
    const answered = Array.isArray(record.answeredIds) ? record.answeredIds : [];
    const correct = Array.isArray(record.correctIds) ? record.correctIds : [];
    const answeredIds = answered.filter(isKnown);
    if (answered.length > 0 && answeredIds.length === 0) continue;
    records[id] = {
      lastPercent: record.lastPercent,
      attempts: typeof record.attempts === "number" ? record.attempts : 1,
      answeredIds,
      correctIds: correct.filter(isKnown),
    };
  }
  return records;
}

/** Saved (bookmarked) questions: the ids that still exist, in the order they were saved. */
export function cleanSaved(value: unknown): string[] | null {
  return Array.isArray(value) ? value.filter(isKnown) : null;
}
