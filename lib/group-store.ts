import { useEffect, useMemo } from "react";
import type { Attempt } from "@/lib/cohort";
import { cleanGroupExams, seedGroupExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { createStore } from "@/lib/store";

/**
 * The shared data of the Instructor side (DESIGN.md: Instructor): exams, attempts and notices are
 * kept ONCE for the whole device (a shared key, not per account), so the instructor and every local
 * student account see the same exams and results. Versioned, tolerant loading, no server.
 */

const examStore = createStore<GroupExam[]>("ast.group-exams.v1", {
  shared: true,
  sanitize: cleanGroupExams,
});

export const readGroupExams = (): GroupExam[] => cleanGroupExams(examStore.read()) ?? [];

/** Saves the two seeded exams when nothing valid is stored yet. */
export function seedGroup(now: number = Date.now()): GroupExam[] {
  const stored = cleanGroupExams(examStore.read());
  if (stored) return stored;
  const seeded = seedGroupExams(now);
  examStore.write(seeded);
  return seeded;
}

/** The exams of the group (the two seeded ones on first use), "loading" until read. */
export function useGroupExams(): GroupExam[] | "loading" {
  const raw = examStore.useValue();
  const missing = raw !== "loading" && cleanGroupExams(raw) === null;
  useEffect(() => {
    if (missing) seedGroup();
  }, [missing]);
  return useMemo(() => (raw === "loading" ? "loading" : (cleanGroupExams(raw) ?? [])), [raw]);
}

export function saveGroupExam(exam: GroupExam) {
  // the seeded exams first, so a new exam never replaces them when nothing was saved yet
  const list = seedGroup();
  examStore.write([exam, ...list.filter((entry) => entry.id !== exam.id)]);
}

/** Closes an exam now: it stops being Active at once. */
export function closeGroupExam(id: string, now: number = Date.now()) {
  examStore.write(
    seedGroup(now).map((exam) =>
      exam.id === id && exam.closedAt === undefined ? { ...exam, closedAt: now } : exam,
    ),
  );
}

// ---- attempts -------------------------------------------------------------------------------

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Tolerant loading of the attempts: a broken one is dropped. */
export function cleanAttempts(value: unknown): Attempt[] | null {
  if (!Array.isArray(value)) return null;
  const list: Attempt[] = [];
  for (const entry of value) {
    if (!isObject(entry)) continue;
    const { examId, studentId, correct, total, finishedAt, certificateId } = entry;
    if (typeof examId !== "string" || typeof studentId !== "string") continue;
    if (typeof correct !== "number" || typeof total !== "number") continue;
    if (!Number.isInteger(correct) || !Number.isInteger(total) || total <= 0) continue;
    if (correct < 0 || correct > total) continue;
    if (typeof finishedAt !== "number" || !Number.isFinite(finishedAt)) continue;
    list.push({
      examId,
      studentId,
      correct,
      total,
      finishedAt,
      ...(typeof certificateId === "string" && { certificateId }),
    });
  }
  return list.length > 0 ? list : null;
}

const attemptStore = createStore<Attempt[]>("ast.group-attempts.v1", {
  shared: true,
  sanitize: cleanAttempts,
});

export const readAttempts = (): Attempt[] => cleanAttempts(attemptStore.read()) ?? [];

export function useAttempts(): Attempt[] | "loading" {
  const raw = attemptStore.useValue();
  return useMemo(() => (raw === "loading" ? "loading" : (cleanAttempts(raw) ?? [])), [raw]);
}

export function recordAttempt(attempt: Attempt) {
  attemptStore.write([...readAttempts(), attempt]);
}

// ---- notices --------------------------------------------------------------------------------

/** A message from the instructor to every local student account. */
export type Notice = {
  id: string;
  title: string;
  text: string;
  /** The screen it opens. */
  target: string;
  createdAt: number;
};

export function cleanNotices(value: unknown): Notice[] | null {
  if (!Array.isArray(value)) return null;
  const list: Notice[] = [];
  for (const entry of value) {
    if (!isObject(entry)) continue;
    const { id, title, text, target, createdAt } = entry;
    if (typeof id !== "string" || id === "" || list.some((n) => n.id === id)) continue;
    if (typeof title !== "string" || title.trim() === "") continue;
    if (typeof createdAt !== "number" || !Number.isFinite(createdAt)) continue;
    list.push({
      id,
      title,
      text: typeof text === "string" ? text : "",
      target: typeof target === "string" ? target : "/",
      createdAt,
    });
  }
  return list.length > 0 ? list.slice(-50) : null;
}

const noticeStore = createStore<Notice[]>("ast.group-notices.v1", {
  shared: true,
  sanitize: cleanNotices,
});

export const useNotices = () => {
  const raw = noticeStore.useValue();
  return useMemo(() => (raw === "loading" ? "loading" : (cleanNotices(raw) ?? [])), [raw]);
};

export const readNotices = (): Notice[] => cleanNotices(noticeStore.read()) ?? [];

export function addNotice(notice: Notice) {
  const list = readNotices();
  if (list.some((entry) => entry.id === notice.id)) return;
  noticeStore.write([...list, notice].slice(-50));
}
