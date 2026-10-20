import { describe, expect, it } from "vitest";
import {
  groupCounts,
  localStatus,
  participants,
  seededStatus,
  seededStudents,
  statusOf,
  statusText,
  studentRows,
  unit,
} from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import { passCount } from "@/lib/results";

const exam = { id: "seed-closed", deadline: "2026-10-18", questionCount: 20 };
const open = { id: "seed-active", deadline: "2026-10-30", questionCount: 20 };

describe("the demo group", () => {
  it("has 14 fictional students with ids, initials, a field and per-topic counts", () => {
    expect(seededStudents).toHaveLength(14);
    const ids = new Set(seededStudents.map((s) => s.id));
    expect(ids.size).toBe(14);
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
    expect(people).toHaveLength(15);
    expect(people[0]).toMatchObject({ id: "ana@example.com", initials: "AM", local: true });
    expect(people.slice(1).every((p) => !p.local)).toBe(true);
    expect(participants([])).toHaveLength(14);
  });
});

describe("the status of a seeded student", () => {
  it("is deterministic: the same inputs always give the same status", () => {
    for (const s of seededStudents) {
      expect(seededStatus(s.id, exam, false)).toEqual(seededStatus(s.id, exam, false));
    }
    expect(unit("x", "y")).toBe(unit("x", "y"));
    expect(unit("x")).toBeGreaterThanOrEqual(0);
    expect(unit("x")).toBeLessThan(1);
  });

  it("depends on the exam and the deadline, so another exam can differ", () => {
    const a = seededStudents.map((s) => seededStatus(s.id, exam, false).kind).join();
    const b = seededStudents
      .map((s) => seededStatus(s.id, { ...exam, id: "other" }, false).kind)
      .join();
    const c = seededStudents
      .map((s) => seededStatus(s.id, { ...exam, deadline: "2026-11-01" }, false).kind)
      .join();
    expect(new Set([a, b, c]).size).toBeGreaterThan(1);
  });

  it("is a pass only with at least the pass count, and a fail with fewer", () => {
    for (let n = 0; n < 200; n++) {
      const status = seededStatus(`stu-${n}`, exam, false);
      const pass = passCount(20);
      if (status.kind === "certified") expect(status.correct).toBeGreaterThanOrEqual(pass);
      if (status.kind === "certified") expect(status.correct).toBeLessThanOrEqual(20);
      if (status.kind === "not-passed") {
        expect(status.correct).toBeLessThan(pass);
        expect(status.correct).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("has about 60% certified, 25% not passed for a closed exam, and fewer attempts while open", () => {
    const sample = (active: boolean) => {
      const counts = { certified: 0, "not-passed": 0, "not-started": 0 };
      for (let n = 0; n < 4000; n++) counts[seededStatus(`s${n}`, exam, active).kind] += 1;
      return counts;
    };
    const closed = sample(false);
    expect(closed.certified / 4000).toBeGreaterThan(0.55);
    expect(closed.certified / 4000).toBeLessThan(0.65);
    expect(closed["not-passed"] / 4000).toBeGreaterThan(0.2);
    expect(closed["not-passed"] / 4000).toBeLessThan(0.3);
    const active = sample(true);
    expect(active["not-started"]).toBeGreaterThan(closed["not-started"]);
    expect(active.certified).toBeLessThan(closed.certified);
  });

  it("works for fewer questions: the pass count follows the exam size", () => {
    for (let n = 0; n < 100; n++) {
      const status = seededStatus(`s${n}`, { ...exam, questionCount: 12 }, false);
      if (status.kind === "certified") expect(status.correct).toBeGreaterThanOrEqual(passCount(12));
      if (status.kind !== "not-started") expect(status.total).toBe(12);
    }
  });
});

describe("the status of a local account", () => {
  const attempt = (correct: number, at = 1, examId = "e1", studentId = "a@b.co"): Attempt => ({
    examId,
    studentId,
    correct,
    total: 20,
    finishedAt: at,
  });

  it("is Not started without attempts at that exam", () => {
    expect(localStatus([], "a@b.co", "e1")).toEqual({ kind: "not-started" });
    expect(localStatus([attempt(18, 1, "other")], "a@b.co", "e1")).toEqual({ kind: "not-started" });
    expect(localStatus([attempt(18, 1, "e1", "x@y.zz")], "a@b.co", "e1")).toEqual({
      kind: "not-started",
    });
  });

  it("is Not passed with the best count, and Certified once an attempt passed", () => {
    expect(localStatus([attempt(9), attempt(12, 2)], "a@b.co", "e1")).toEqual({
      kind: "not-passed",
      correct: 12,
      total: 20,
    });
    expect(localStatus([attempt(12), attempt(17, 2)], "a@b.co", "e1")).toEqual({
      kind: "certified",
      correct: 17,
      total: 20,
    });
    expect(
      localStatus([{ ...attempt(19), certificateId: "QT-2026-0001" }], "a@b.co", "e1"),
    ).toMatchObject({ kind: "certified", certificateId: "QT-2026-0001" });
  });

  it("is certified exactly at the pass count (16 of 20) and not at 15", () => {
    expect(localStatus([attempt(16)], "a@b.co", "e1").kind).toBe("certified");
    expect(localStatus([attempt(15)], "a@b.co", "e1").kind).toBe("not-passed");
  });
});

describe("group counts and rows", () => {
  const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
  const attempts: Attempt[] = [
    { examId: open.id, studentId: "ana@example.com", correct: 17, total: 20, finishedAt: 1 },
  ];
  const context = { attempts, active: true };

  it("counts every participant once; the counts add up and match the rows", () => {
    const counts = groupCounts(people, open, context);
    expect(counts.total).toBe(15);
    expect(counts.certified + counts.notPassed + counts.notStarted).toBe(15);
    const rows = studentRows(people, open, context);
    expect(rows).toHaveLength(15);
    expect(rows.filter((r) => r.status.kind === "certified")).toHaveLength(counts.certified);
    expect(rows.filter((r) => r.status.kind === "not-passed")).toHaveLength(counts.notPassed);
    expect(rows.filter((r) => r.status.kind === "not-started")).toHaveLength(counts.notStarted);
    // the local account's real attempt counts
    expect(statusOf(people[0], open, context).kind).toBe("certified");
  });

  it("sorts Not passed first, then Not started, then Certified", () => {
    const kinds = studentRows(people, exam, { attempts: [], active: false }).map(
      (r) => r.status.kind,
    );
    const order = { "not-passed": 0, "not-started": 1, certified: 2 } as const;
    const ranks = kinds.map((k) => order[k]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("changes when a local attempt is added (real data)", () => {
    const before = groupCounts(people, open, { attempts: [], active: true });
    const after = groupCounts(people, open, context);
    expect(before.notStarted - after.notStarted).toBe(1);
    expect(after.certified - before.certified).toBe(1);
  });
});

describe("status wording", () => {
  it("reads Certified, Not started and Not passed with the count", () => {
    expect(statusText({ kind: "certified", correct: 17, total: 20 })).toBe("Certified");
    expect(statusText({ kind: "not-started" })).toBe("Not started");
    expect(statusText({ kind: "not-passed", correct: 14, total: 20 })).toBe(
      "Not passed · 14 of 20 correct",
    );
  });
});
