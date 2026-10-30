import { describe, expect, it } from "vitest";
import { participants } from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import {
  HARDEST_LIMIT,
  attemptsAllowedLine,
  attemptsLeftLine,
  closedLine,
  duePillText,
  extendedDeadline,
  hardestQuestions,
  resultsLine,
  rosterLine,
  triedLine,
  wrongLine,
} from "@/lib/exam-detail";
import { examQuestionIds } from "@/lib/exam-pool";
import { examsToTake } from "@/lib/exams-to-take";
import { assignProblems, cleanGroupExams, createExam, seedGroupExams } from "@/lib/group-exams";
import { cleanAttempts, cleanNotices, collapseReminders } from "@/lib/group-store";
import { examPeople } from "@/lib/groups";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const [active, closed] = seedGroupExams(now);
const everyone = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const ana = "ana@example.com";

const finished = (examId: string, correct: number, at = 1): Attempt => ({
  examId,
  studentId: ana,
  startedAt: at - 1,
  finishedAt: at,
  correct,
  total: 20,
  answers: {},
});

describe("the words of the Exams screens (counts only)", () => {
  it("words the date pill as the date only, whatever the time left (no amber 'due soon')", () => {
    for (const deadline of ["2026-10-24", "2026-10-26", "2026-10-28", "2027-01-05"]) {
      expect(duePillText({ deadline })).toMatch(/^Due \d{1,2} \w{3}$/);
    }
    expect(duePillText({ deadline: "2026-10-26" })).toBe("Due 26 Oct");
    expect(duePillText({ deadline: "2026-10-28" })).toBe("Due 28 Oct");
  });

  it("says Closed with the day the exam was closed", () => {
    expect(closedLine({ deadline: "2026-10-12" })).toBe("Closed 12 Oct");
    expect(
      closedLine({ deadline: "2026-10-30", closedAt: new Date(2026, 9, 20, 9).getTime() }),
    ).toBe("Closed 20 Oct");
  });

  it("words the results, completion and attempts without any percent sign", () => {
    const counts = { passed: 1, notPassed: 2, inProgress: 0, notStarted: 11, missed: 0, total: 14 };
    expect(resultsLine(counts, true)).toBe("Passed 1 of 14 · 11 not started");
    expect(resultsLine({ ...counts, passed: 12 }, false)).toBe("Passed 12 of 14");
    expect(triedLine(counts)).toBe("3 of 14 tried");
    expect(attemptsAllowedLine({ attemptsAllowed: 3 })).toBe("3 attempts allowed");
    expect(attemptsAllowedLine({ attemptsAllowed: 1 })).toBe("1 attempt allowed");
    expect(attemptsAllowedLine({ attemptsAllowed: null })).toBe("Unlimited attempts");
    expect(attemptsLeftLine(2)).toBe("2 attempts left");
    expect(attemptsLeftLine(1)).toBe("1 attempt left");
    expect(attemptsLeftLine(null)).toBe("Unlimited attempts");
    expect(wrongLine({ wrong: 9, answered: 14 })).toBe("9 of 14 answered wrong");
  });

  it("words the roster line for each status", () => {
    expect(rosterLine({ kind: "passed", correct: 19, total: 20, attempts: 1 }, now)).toBe(
      "19 of 20 correct · 1 attempt",
    );
    expect(rosterLine({ kind: "not-passed", correct: 14, total: 20, attempts: 2 }, now)).toBe(
      "14 of 20 correct · 2 attempts",
    );
    expect(rosterLine({ kind: "in-progress", startedAt: now - 600_000, attempt: 1 }, now)).toBe(
      "Started 10 min ago · Attempt 1",
    );
    expect(rosterLine({ kind: "not-started" }, now)).toBe("No attempts yet");
    expect(rosterLine({ kind: "missed" }, now)).toBe("Closed without a try");
  });
});

describe("hardest questions", () => {
  const people = examPeople(everyone, closed);

  it("come from the attempts of this exam: counts of wrong answers, hardest first, at most three, numbered by place", () => {
    const hard = hardestQuestions(people, closed, [], now);
    expect(hard.length).toBeGreaterThan(0);
    expect(hard.length).toBeLessThanOrEqual(HARDEST_LIMIT);
    const wrongs = hard.map((q) => q.wrong);
    expect(wrongs).toEqual([...wrongs].sort((a, b) => b - a));
    const ids = examQuestionIds(closed);
    for (const q of hard) {
      expect(ids[q.number - 1]).toBe(q.id);
      expect(q.wrong).toBeGreaterThan(0);
      expect(q.wrong).toBeLessThanOrEqual(q.answered);
      expect(q.text.length).toBeGreaterThan(0);
    }
  });

  it("are computed from the same attempts: a real wrong answer of the local account adds to the count", () => {
    const first = hardestQuestions(people, closed, [], now)[0];
    const local: Attempt = {
      ...finished(closed.id, 10),
      answers: Object.fromEntries(examQuestionIds(closed).map((id) => [id, id !== first.id])),
    };
    const after = hardestQuestions(people, closed, [local], now).find((q) => q.id === first.id)!;
    expect(after.wrong).toBe(first.wrong + 1);
    expect(after.answered).toBe(first.answered + 1);
  });

  it("need at least three finished attempts", () => {
    const only = examPeople(everyone, active).filter((p) => p.local);
    expect(hardestQuestions(only, active, [], now)).toEqual([]);
    expect(
      hardestQuestions(only, active, [finished(active.id, 10), finished(active.id, 12)], now),
    ).toEqual([]);
    const three = [finished(active.id, 10), finished(active.id, 12, 2), finished(active.id, 8, 3)];
    expect(hardestQuestions(only, active, three, now)).not.toEqual(undefined);
  });
});

describe("extending a deadline", () => {
  const exam = { deadline: "2026-10-27" };
  it("counts from the old deadline: +3 days and +1 week", () => {
    expect(extendedDeadline(exam, "3d", "")).toBe("2026-10-30");
    expect(extendedDeadline(exam, "1w", "")).toBe("2026-11-03");
  });
  it("takes a picked date only when it is later than the old one", () => {
    expect(extendedDeadline(exam, "date", "2026-11-10")).toBe("2026-11-10");
    expect(extendedDeadline(exam, "date", "2026-10-27")).toBeNull();
    expect(extendedDeadline(exam, "date", "2026-10-01")).toBeNull();
    expect(extendedDeadline(exam, "date", "")).toBeNull();
    expect(extendedDeadline({ deadline: "bad" }, "3d", "")).toBeNull();
  });
});

describe("assign validation and exam data", () => {
  const ok = {
    title: "Exam: Alarm",
    topicIds: ["S1"],
    deadline: "2026-10-27",
    groupIds: ["rescue-team"],
  };
  it("needs a title, topics with at least 10 questions, a deadline today or later and an audience", () => {
    expect(assignProblems(ok, now)).toEqual([]);
    expect(assignProblems({ ...ok, groupIds: [] }, now)).toContain("Choose at least one group.");
    expect(assignProblems({ ...ok, deadline: "2026-10-01" }, now)).toContain(
      "The deadline cannot be in the past.",
    );
    expect(assignProblems({ ...ok, deadline: "2026-10-24" }, now)).toEqual([]);
  });

  it("creates an exam with 1, 3 or unlimited attempts (3 by default)", () => {
    expect(createExam(ok, now).attemptsAllowed).toBe(3);
    expect(createExam({ ...ok, attemptsAllowed: 1 }, now).attemptsAllowed).toBe(1);
    expect(createExam({ ...ok, attemptsAllowed: null }, now).attemptsAllowed).toBeNull();
  });

  it("loads tolerantly: an older exam gets 3 attempts, 'unlimited' becomes null, odd values fall back", () => {
    const base = { title: "T", topicIds: ["S1", "S2"], deadline: "2026-10-31" };
    const list = cleanGroupExams([
      { ...base, id: "a" },
      { ...base, id: "b", attemptsAllowed: "unlimited" },
      { ...base, id: "c", attemptsAllowed: null },
      { ...base, id: "d", attemptsAllowed: 7 },
      { ...base, id: "e", attemptsAllowed: 1 },
    ])!;
    expect(list.map((e) => e.attemptsAllowed)).toEqual([3, null, null, 3, 1]);
  });

  it("loads attempts tolerantly: an older attempt gets a start and answers, a broken one is dropped", () => {
    const list = cleanAttempts([
      { examId: "e", studentId: ana, correct: 17, total: 20, finishedAt: 5 },
      { examId: "e", studentId: ana, correct: 0, total: 20, startedAt: 7 },
      { examId: "e", studentId: ana, correct: 99, total: 20, finishedAt: 5 },
      { examId: "e", studentId: ana, correct: 1, total: 20 },
      "nope",
    ])!;
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ startedAt: 5, finishedAt: 5, answers: {} });
    expect(list[1].finishedAt).toBeUndefined();
  });
});

describe("notifications of the Exams flow", () => {
  it("keeps one reminder per exam: sending again replaces it", () => {
    const list = collapseReminders([
      { id: "remind-x", createdAt: 1 },
      { id: "remind-x", createdAt: 5 },
      { id: "notice-x", createdAt: 2 },
    ]);
    expect(list.map((n) => n.id).sort()).toEqual(["notice-x", "remind-x"]);
    expect(list.find((n) => n.id === "remind-x")!.createdAt).toBe(5);
  });

  it("keeps the extension notice once per new date", () => {
    const base = { title: "Deadline extended: T", text: "", target: "/", createdAt: 1 };
    const list = cleanNotices([
      { ...base, id: "extended-e-2026-10-30" },
      { ...base, id: "extended-e-2026-11-03", createdAt: 2 },
      { ...base, id: "extended-e-2026-10-30" },
    ])!;
    expect(list.map((n) => n.id)).toEqual(["extended-e-2026-10-30", "extended-e-2026-11-03"]);
  });
});

describe("exams to take for a student", () => {
  it("drops an exam once it is passed, when no try is left, and keeps one in progress", () => {
    const exam = { ...active, attemptsAllowed: 1 as const };
    expect(examsToTake([exam], [], ana, now)).toHaveLength(1);
    expect(examsToTake([exam], [finished(exam.id, 18)], ana, now)).toHaveLength(0);
    expect(examsToTake([exam], [finished(exam.id, 10)], ana, now)).toHaveLength(0);
    const three = { ...active, attemptsAllowed: 3 as const };
    expect(examsToTake([three], [finished(three.id, 10)], ana, now)).toHaveLength(1);
    const unlimited = { ...active, attemptsAllowed: null };
    expect(
      examsToTake(
        [unlimited],
        [finished(unlimited.id, 10), finished(unlimited.id, 11, 2)],
        ana,
        now,
      ),
    ).toHaveLength(1);
    const open: Attempt = { ...finished(exam.id, 0), finishedAt: undefined };
    expect(examsToTake([exam], [finished(exam.id, 10, 1), open], ana, now)).toHaveLength(1);
  });

  it("drops a closed exam", () => {
    expect(examsToTake([closed], [], ana, now)).toHaveLength(0);
    expect(examsToTake([{ ...active, closedAt: now - 1 }], [], ana, now)).toHaveLength(0);
  });

  it("shows the new date after an extension", () => {
    const extended = { ...active, deadline: "2026-11-20" };
    expect(examsToTake([extended], [], ana, now)[0].deadline).toBe("2026-11-20");
  });
});
