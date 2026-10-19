import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { EXAM_MINUTES } from "@/lib/config";
import { examResults, secondsLeft } from "@/lib/exam";
import { finishExam, scoreExam, startExam } from "@/lib/exam-session";
import { clearExam, readExam } from "@/lib/exam-store";
import { findItem } from "@/lib/items";
import { getItem } from "@/lib/items";
import { modeStats, readinessOf } from "@/lib/part-progress";
import type { PartRecords } from "@/lib/part-progress";
import { createStore } from "@/lib/store";
import type { FinishedSession, Session } from "@/lib/session";
import { resetProgress } from "@/lib/session";

const saved = new Map<string, string>();
beforeAll(() => {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => void saved.set(key, value),
      removeItem: (key: string) => void saved.delete(key),
    },
  });
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
  saved.clear();
  resetProgress();
});

const history = () => createStore<FinishedSession[]>("ast.history.v1").read();
const session = () => createStore<Session>("ast.session.v1").read();
const START = new Date(2026, 9, 17, 10, 0, 0).getTime();

/** The exam with the first `count` questions answered right. */
function answered(count: number) {
  const exam = readExam()!;
  return {
    ...exam,
    answers: exam.itemIds.slice(0, count).map((id) => ({
      itemId: id,
      optionId: getItem(id).correctOptionId,
    })),
  };
}

describe("starting an exam", () => {
  it("stores the end time, so a refresh keeps the timer", () => {
    startExam(START);
    const exam = readExam()!;
    expect(exam.itemIds).toHaveLength(20);
    expect(exam.endsAt).toBe(START + EXAM_MINUTES * 60_000);
    expect(exam.finished).toBe(false);
    // "after a refresh": a fresh read of the same storage, 5 minutes later
    const afterRefresh = createStore<typeof exam>("ast.exam.v1").read()!;
    expect(secondsLeft(afterRefresh.endsAt, START + 5 * 60_000)).toBe(15 * 60);
  });

  it("never creates an unfinished session for Home or Training", () => {
    startExam(START);
    expect(session()).toBeNull();
  });
});

describe("finishing an exam", () => {
  it("adds one history entry with the date, percent, questions and time used", () => {
    startExam(START);
    const exam = answered(20);
    finishExam(exam, START + 12 * 60_000 + 30_000);
    expect(history()).toHaveLength(1);
    expect(history()![0]).toMatchObject({
      kind: "exam",
      finishedAt: START + 12 * 60_000 + 30_000,
      exam: { percent: 100, questions: 20, timeUsedSeconds: 750 },
    });
    expect(readExam()).toMatchObject({ finished: true, timeUsedSeconds: 750 });
  });

  it("finishes automatically at 0:00 with unanswered counted as incorrect", () => {
    startExam(START);
    const exam = answered(5);
    finishExam(exam, exam.endsAt + 3000);
    const entry = history()![0];
    // 5 right of 20 questions: 25%; the time used stops at the end time
    expect(entry.exam).toEqual({ percent: 25, questions: 20, timeUsedSeconds: EXAM_MINUTES * 60 });
    expect(scoreExam(readExam()!)).toHaveLength(20);
    expect(scoreExam(readExam()!).filter((item) => !item.correct)).toHaveLength(15);
    // only the answered ones go to the history's answers
    expect(entry.answers).toHaveLength(5);
  });

  it("adds one entry even when Finish and the timer both run", () => {
    startExam(START);
    const exam = answered(3);
    finishExam(exam, START + 1000);
    finishExam(exam, START + 2000);
    expect(history()).toHaveLength(1);
  });

  it("counts toward answered, accuracy and readiness, but not part rings", () => {
    startExam(START);
    const exam = answered(20);
    finishExam(exam, START + 60_000);
    const all = history();
    const answeredNow = modeStats(all, "scenario").answered + modeStats(all, "quiz").answered;
    expect(answeredNow).toBe(20);
    expect(modeStats(all, "quiz").accuracy).toBe(100);
    expect(readinessOf(all)).toBeGreaterThan(0);
    expect(createStore<PartRecords>("ast.parts.v1").read()).toBeNull();
  });

  it("updates the best result of the Home tile", () => {
    expect(examResults(history()).best).toBeNull();
    startExam(START);
    finishExam(answered(14), START + 1000);
    expect(examResults(history()).best?.percent).toBe(70);
  });
});

describe("leaving an exam", () => {
  it("saves nothing and cannot be continued", () => {
    startExam(START);
    clearExam();
    expect(readExam()).toBeNull();
    expect(history()).toBeNull();
    expect(session()).toBeNull();
  });
});

describe("exam questions", () => {
  it("are all real questions of the guide", () => {
    startExam(START);
    readExam()!.itemIds.forEach((id) => expect(findItem(id)).toBeDefined());
  });
});
