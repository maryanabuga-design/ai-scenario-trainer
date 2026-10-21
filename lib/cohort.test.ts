import { describe, expect, it } from "vitest";
import {
  attemptsLeft,
  attemptsOf,
  bestAttempt,
  deriveStatus,
  groupCounts,
  participants,
  seededAttempts,
  seededStudents,
  statusOf,
  statusText,
  studentRows,
  triedCount,
  unit,
} from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import { seedGroupExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { inScope } from "@/lib/groups";
import { examQuestionIds } from "@/lib/exam-pool";
import { passCount } from "@/lib/results";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const seeded = seedGroupExams(now);
const open = seeded.find((e) => e.id === "seed-active")!;
const closed = seeded.find((e) => e.id === "seed-closed")!;
const exam = (over: Partial<GroupExam> = {}): GroupExam => ({ ...open, ...over });

const attempt = (correct: number, over: Partial<Attempt> = {}): Attempt => ({
  examId: open.id,
  studentId: "ana@example.com",
  startedAt: now - 3_600_000,
  finishedAt: now - 3_000_000,
  correct,
  total: 20,
  answers: {},
  ...over,
});

describe("the demo group", () => {
  it("has 26 fictional students in two groups (14 and 12) with ids, initials, a field and per-topic counts", () => {
    expect(seededStudents).toHaveLength(26);
    expect(seededStudents.filter((s) => s.group === "rescue-team")).toHaveLength(14);
    expect(seededStudents.filter((s) => s.group === "military-training")).toHaveLength(12);
    const ids = new Set(seededStudents.map((s) => s.id));
    expect(ids.size).toBe(26);
    for (const s of seededStudents) {
      expect(s.initials).toBe(
        s.name
          .split(" ")
          .map((w) => w[0])
          .join(""),
      );
      expect(["rescue", "paramedic", "military", "civil", "other"]).toContain(s.field);
      expect(Object.keys(s.topics)).toHaveLength(10);
      for (const t of Object.values(s.topics)) {
        expect(t.correct).toBeLessThanOrEqual(t.answered);
        expect(t.answered).toBeGreaterThanOrEqual(0);
      }
      expect(s.lastActiveDaysAgo).toBeGreaterThanOrEqual(0);
    }
    // all five fields are used
    expect(new Set(seededStudents.map((s) => s.field)).size).toBe(5);
  });

  it("puts the local accounts first and labels them local; initials come from the name", () => {
    const people = participants([{ name: "Ana Maria Test", email: "ana@example.com" }]);
    expect(people).toHaveLength(27);
    expect(people[0].groupId).toBe("rescue-team");
    expect(people[0]).toMatchObject({ id: "ana@example.com", initials: "AM", local: true });
    expect(people.slice(1).every((p) => !p.local)).toBe(true);
    expect(participants([])).toHaveLength(26);
  });
});

describe("the status of a participant (derived from attempts)", () => {
  it("is Passed from the best finished attempt reaching the pass mark (16 of 20), Not passed below it", () => {
    expect(passCount(20)).toBe(16);
    expect(deriveStatus([attempt(16)], open, now)).toMatchObject({
      kind: "passed",
      correct: 16,
      total: 20,
      attempts: 1,
    });
    expect(deriveStatus([attempt(15)], open, now)).toMatchObject({
      kind: "not-passed",
      correct: 15,
    });
  });

  it("takes the best attempt, the earliest on a tie, and counts the finished ones", () => {
    const list = [
      attempt(12, { finishedAt: 1 }),
      attempt(17, { finishedAt: 2 }),
      attempt(14, { finishedAt: 3 }),
    ];
    expect(bestAttempt(list)?.correct).toBe(17);
    expect(deriveStatus(list, open, now)).toMatchObject({
      kind: "passed",
      correct: 17,
      attempts: 3,
    });
    expect(
      bestAttempt([attempt(10, { finishedAt: 5 }), attempt(10, { finishedAt: 2 })])?.finishedAt,
    ).toBe(2);
    expect(bestAttempt([])).toBeNull();
  });

  it("is In progress with an unfinished attempt (and no passed one), with the attempt number", () => {
    const unfinished = attempt(0, { finishedAt: undefined, startedAt: now - 600_000 });
    expect(deriveStatus([unfinished], open, now)).toEqual({
      kind: "in-progress",
      startedAt: now - 600_000,
      attempt: 1,
    });
    expect(deriveStatus([attempt(10), unfinished], open, now)).toMatchObject({
      kind: "in-progress",
      attempt: 2,
    });
    // a passed attempt wins over a later unfinished one
    expect(deriveStatus([attempt(18), unfinished], open, now).kind).toBe("passed");
  });

  it("is Not started while Active and Missed once Closed, with no attempt", () => {
    expect(deriveStatus([], open, now).kind).toBe("not-started");
    expect(deriveStatus([], closed, now).kind).toBe("missed");
    expect(deriveStatus([], { ...open, closedAt: now - 1 }, now).kind).toBe("missed");
  });

  it("keeps an unfinished attempt In progress after the deadline (it can be submitted)", () => {
    const after = new Date(2026, 10, 30).getTime();
    const unfinished = attempt(0, { finishedAt: undefined });
    expect(deriveStatus([unfinished], open, after).kind).toBe("in-progress");
    expect(deriveStatus([], open, after).kind).toBe("missed");
  });

  it("reads Passed, Not passed, In progress, Not started and Missed in words (never Certified)", () => {
    expect(statusText({ kind: "passed", correct: 17, total: 20, attempts: 1 })).toBe(
      "Passed · 17 of 20 correct",
    );
    expect(statusText({ kind: "not-passed", correct: 14, total: 20, attempts: 2 })).toBe(
      "Not passed · 14 of 20 correct",
    );
    expect(statusText({ kind: "in-progress", startedAt: 1, attempt: 1 })).toBe("In progress");
    expect(statusText({ kind: "not-started" })).toBe("Not started");
    expect(statusText({ kind: "missed" })).toBe("Missed");
  });

  it("keeps the certificate of a passed attempt", () => {
    expect(deriveStatus([attempt(18, { certificateId: "QT-2026-0001" })], open, now)).toMatchObject(
      { kind: "passed", certificateId: "QT-2026-0001" },
    );
  });
});

describe("attempts left", () => {
  it("is the attempts allowed minus the finished ones, never below 0; unlimited is null", () => {
    expect(attemptsLeft({ attemptsAllowed: 3 }, [attempt(10)])).toBe(2);
    expect(attemptsLeft({ attemptsAllowed: 1 }, [attempt(10)])).toBe(0);
    expect(attemptsLeft({ attemptsAllowed: 1 }, [attempt(10), attempt(11)])).toBe(0);
    expect(attemptsLeft({ attemptsAllowed: null }, [attempt(10)])).toBeNull();
    // an unfinished attempt is not a used try
    expect(attemptsLeft({ attemptsAllowed: 3 }, [attempt(0, { finishedAt: undefined })])).toBe(3);
  });
});

describe("the attempts of a seeded student", () => {
  it("are deterministic and consistent with the exam: counts, a fixed question set, per-question results", () => {
    for (const s of seededStudents.slice(0, 12)) {
      const first = seededAttempts(s.id, open, now);
      expect(seededAttempts(s.id, open, now)).toEqual(first);
      for (const a of first) {
        expect(a.total).toBe(open.questionCount);
        if (a.finishedAt === undefined) continue;
        const ids = Object.keys(a.answers);
        expect(ids.sort()).toEqual([...examQuestionIds(open)].sort());
        expect(Object.values(a.answers).filter(Boolean)).toHaveLength(a.correct);
      }
      expect(first.length).toBeLessThanOrEqual(3);
    }
    expect(unit("x", "y")).toBe(unit("x", "y"));
  });

  it("respect one attempt allowed", () => {
    const single = exam({ attemptsAllowed: 1 });
    for (const s of seededStudents) {
      expect(seededAttempts(s.id, single, now).length).toBeLessThanOrEqual(1);
    }
  });

  it("give a spread of statuses: some of each for an active exam, Missed (no In progress) once closed", () => {
    const kinds = (e: GroupExam) =>
      seededStudents
        .filter((s) => s.group === "rescue-team")
        .map((s) => deriveStatus(seededAttempts(s.id, e, now), e, now).kind);
    const active = kinds(open);
    for (const kind of ["passed", "not-passed", "not-started"]) expect(active).toContain(kind);
    const done = kinds(closed);
    expect(done).toContain("passed");
    expect(done).not.toContain("in-progress");
    expect(done).not.toContain("not-started");
    // a closed exam has more passed than an open one
    expect(done.filter((k) => k === "passed").length).toBeGreaterThan(
      active.filter((k) => k === "passed").length,
    );
  });

  it("make the same questions hard for everyone (the hardest are shared)", () => {
    const wrongCounts = new Map<string, number>();
    for (const s of seededStudents.filter((x) => x.group === "rescue-team")) {
      const best = bestAttempt(seededAttempts(s.id, closed, now));
      for (const [id, right] of Object.entries(best?.answers ?? {})) {
        if (!right) wrongCounts.set(id, (wrongCounts.get(id) ?? 0) + 1);
      }
    }
    const sorted = [...wrongCounts.values()].sort((a, b) => b - a);
    expect(sorted[0]).toBeGreaterThan(sorted[sorted.length - 1]);
  });
});

describe("group counts and rows", () => {
  const people = inScope(
    participants([{ name: "Ana Test", email: "ana@example.com" }]),
    "rescue-team",
  );
  const attempts: Attempt[] = [attempt(17)];
  const context = { attempts, now };

  it("counts every participant once; the counts add up and match the rows", () => {
    const counts = groupCounts(people, open, context);
    expect(counts.total).toBe(15);
    expect(
      counts.passed + counts.notPassed + counts.inProgress + counts.notStarted + counts.missed,
    ).toBe(15);
    expect(counts.missed).toBe(0);
    const rows = studentRows(people, open, context);
    expect(rows).toHaveLength(15);
    for (const kind of ["passed", "not-passed", "in-progress", "not-started"] as const) {
      const key = {
        passed: "passed",
        "not-passed": "notPassed",
        "in-progress": "inProgress",
        "not-started": "notStarted",
      }[kind] as "passed";
      expect(rows.filter((r) => r.status.kind === kind)).toHaveLength(counts[key]);
    }
    expect(statusOf(people[0], open, context).kind).toBe("passed");
    expect(triedCount(counts)).toBe(counts.passed + counts.notPassed + counts.inProgress);
  });

  it("has Missed instead of Not started once the exam is closed", () => {
    const counts = groupCounts(people, closed, { attempts: [], now });
    expect(counts.notStarted).toBe(0);
    expect(counts.missed).toBeGreaterThan(0);
    // the local account has no attempt at it
    expect(statusOf(people[0], closed, { attempts: [], now }).kind).toBe("missed");
  });

  it("sorts Not passed, then In progress, then Not started or Missed, then Passed", () => {
    const order = {
      "not-passed": 0,
      "in-progress": 1,
      "not-started": 2,
      missed: 2,
      passed: 3,
    } as const;
    const ranks = studentRows(people, open, { attempts: [], now }).map((r) => order[r.status.kind]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("changes when a local attempt is added (real data)", () => {
    const before = groupCounts(people, open, { attempts: [], now });
    const after = groupCounts(people, open, { attempts: [attempt(18)], now });
    expect(before.notStarted).toBe(after.notStarted + 1);
    expect(after.passed).toBe(before.passed + 1);
    // an unfinished attempt makes the local account In progress
    const started = groupCounts(people, open, {
      attempts: [attempt(0, { finishedAt: undefined })],
      now,
    });
    expect(started.inProgress).toBe(before.inProgress + 1);
    expect(attemptsOf(people[0], open, [attempt(18)], now)).toHaveLength(1);
  });
});
