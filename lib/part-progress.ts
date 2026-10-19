import { PASS_MARK } from "@/lib/config";
import { getPart, modeItems, partsFor } from "@/lib/parts";
import type { Part, TrainingMode } from "@/lib/parts";
import { scoreSession } from "@/lib/progress";
import { resultPercent } from "@/lib/results";
import type { FinishedSession, Session } from "@/lib/session";
import { cleanPartRecords } from "@/lib/saved-data";
import { createStore } from "@/lib/store";

/** What is kept for one part: the latest finished attempt and how many there were. */
export type PartRecord = {
  lastPercent: number;
  attempts: number;
  /** The questions of the latest finished attempt, and the ones answered correctly in it. */
  answeredIds: string[];
  correctIds: string[];
};

export type PartRecords = Record<string, PartRecord>;

const partStore = createStore<PartRecords>("ast.parts.v1", { sanitize: cleanPartRecords });
const modeStore = createStore<TrainingMode>("ast.training-mode.v1");

export const usePartRecords = partStore.useValue;
export const readPartRecords = () => partStore.read();
export const useTrainingMode = modeStore.useValue;

export function saveTrainingMode(mode: TrainingMode) {
  modeStore.write(mode);
}

/** The records after a finished part session: the latest attempt replaces the earlier one. */
export function withPartResult(
  records: PartRecords | null,
  session: Pick<Session, "partId" | "answers">,
): PartRecords | null {
  if (!session.partId || !getPart(session.partId)) return records;
  const items = scoreSession(session);
  const before = records?.[session.partId];
  return {
    ...(records ?? {}),
    [session.partId]: {
      lastPercent: resultPercent(items),
      attempts: (before?.attempts ?? 0) + 1,
      answeredIds: items.map((item) => item.id),
      correctIds: items.filter((item) => item.correct).map((item) => item.id),
    },
  };
}

/** Called when a session finishes: only a part session changes a part's ring. */
export function recordPartResult(session: Pick<Session, "partId" | "answers">) {
  const next = withPartResult(partStore.read(), session);
  if (next) partStore.write(next);
}

export function clearPartRecords() {
  partStore.write(null);
}

export type PartState = "not started" | "in progress" | "done";

/** Not started, in progress (an unfinished session of this part), or done (a finished attempt). */
export function partState(
  part: Part,
  records: PartRecords | null,
  unfinished: Pick<Session, "partId" | "finished"> | null,
): PartState {
  if (unfinished && !unfinished.finished && unfinished.partId === part.id) return "in progress";
  return records?.[part.id] ? "done" : "not started";
}

/** The ring of a part: the arc is the last result, its text the count of correct answers; an empty grey ring when not started. */
export function partRing(
  part: Part,
  records: PartRecords | null,
): { percent: number; correct: number; passed: boolean; started: boolean } {
  const record = records?.[part.id];
  if (!record) return { percent: 0, correct: 0, passed: false, started: false };
  return {
    percent: record.lastPercent,
    correct: record.correctIds.length,
    passed: record.lastPercent >= PASS_MARK,
    started: true,
  };
}

/** The next recommended part of a topic: its first part that is not done, in list order. */
export function recommendedPart(
  parts: Part[],
  records: PartRecords | null,
  unfinished: Pick<Session, "partId" | "finished"> | null,
): Part | null {
  return parts.find((part) => partState(part, records, unfinished) !== "done") ?? null;
}

/** The latest finished answer to every question, oldest session first. */
export function latestAnswers(history: FinishedSession[] | null): Map<string, boolean> {
  const latest = new Map<string, boolean>();
  [...(history ?? [])]
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .flatMap((session) => scoreSession(session))
    .forEach((item) => latest.set(item.id, item.correct));
  return latest;
}

export type ModeStats = {
  answered: number;
  total: number;
  correct: number;
  /** Whole percent of correct unique answered questions, 0 when none are answered. */
  accuracy: number;
};

/**
 * The stats of a mode: answered = unique questions of the mode with a latest finished answer,
 * total = the mode's questions, accuracy = correct unique / answered unique. A finished session of
 * any kind counts (a part, a repeat round, a mini-quiz); an unfinished one counts for nothing.
 */
export function modeStats(history: FinishedSession[] | null, mode: TrainingMode): ModeStats {
  const latest = latestAnswers(history);
  const items = modeItems(mode);
  const answered = items.filter((item) => latest.has(item.id));
  const correct = answered.filter((item) => latest.get(item.id)).length;
  return {
    answered: answered.length,
    total: items.length,
    correct,
    accuracy: answered.length === 0 ? 0 : Math.round((correct / answered.length) * 100),
  };
}

/** Readiness: the correct unique questions of both modes over all questions of both modes. */
export function readinessOf(history: FinishedSession[] | null): number {
  const stats = [modeStats(history, "scenario"), modeStats(history, "quiz")];
  const total = stats.reduce((sum, mode) => sum + mode.total, 0);
  if (total === 0) return 0;
  return Math.floor((stats.reduce((sum, mode) => sum + mode.correct, 0) / total) * 100 + 1e-9);
}

/** The questions of a section and mode whose latest answer is wrong: the "N to repeat" count. */
export function weakCount(
  history: FinishedSession[] | null,
  mode: TrainingMode,
  sectionId: string,
): number {
  const latest = latestAnswers(history);
  return modeItems(mode).filter(
    (item) => item.section === sectionId && latest.get(item.id) === false,
  ).length;
}

/** Sections of a mode with at least one wrong answer in the latest answers. */
export function weakSectionsOf(history: FinishedSession[] | null, mode: TrainingMode): string[] {
  return [...new Set(partsFor(mode).map((part) => part.sectionId))].filter(
    (sectionId) => weakCount(history, mode, sectionId) > 0,
  );
}
