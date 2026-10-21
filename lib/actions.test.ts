import { describe, expect, it } from "vitest";
import { ACTION_LIMIT, actionRows, dueReason, daysUntil } from "@/lib/actions";
import type { DraftSet } from "@/lib/actions";
import { participants } from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import { seedGroupExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { deltaLine, groupDelta, weakestTopic } from "@/lib/overview";
import { profileStatus, profiles } from "@/lib/students";
import type { StudentProfile, StudentTopic } from "@/lib/students";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const list = profiles(people, { "ana@example.com": null });
const [seedActive] = seedGroupExams(now);
const draft: DraftSet = { id: "cx", title: "Evacuation routes" };
const calm = list.filter((p) => p.participant.local || profileStatus(p) !== "needs");

const exam = (deadline: string, id = "e1", title = "Exam One"): GroupExam => ({
  ...seedActive,
  id,
  title,
  deadline,
});
const rows = (over: Partial<Parameters<typeof actionRows>[0]> & { exams: GroupExam[] }) =>
  actionRows({
    list,
    attempts: [],
    people,
    drafts: [],
    reminded: new Set(),
    now,
    ...over,
  });

describe("days until a deadline", () => {
  it("counts calendar days: today is 0, and the words follow", () => {
    expect(daysUntil("2026-10-24", now)).toBe(0);
    expect(daysUntil("2026-10-26", now)).toBe(2);
    expect(daysUntil("bad", now)).toBeNull();
    expect(dueReason(0)).toBe("Due today");
    expect(dueReason(1)).toBe("Due in 1 day");
    expect(dueReason(2)).toBe("Due in 2 days");
  });
});

describe("the rows of Needs your action", () => {
  it("1: an exam due within 3 days with students not started comes first, opens the Exam detail", () => {
    const result = rows({ exams: [exam("2026-10-26")], drafts: [draft] });
    expect(result.map((r) => r.kind)).toEqual(["exam-not-started", "needs-attention", "draft-set"]);
    expect(result[0].title).toMatch(/^\d+ students? (has|have) not started Exam One$/);
    expect(result[0].reason).toBe("Due in 2 days");
    expect(result[0].href).toBe("/instructor/exams/e1?from=overview");
    expect(rows({ exams: [exam("2026-10-24")] })[0].reason).toBe("Due today");
  });

  it("1 applies only within 3 days, and not after a reminder for that exam", () => {
    expect(rows({ exams: [exam("2026-10-27")] })[0].kind).toBe("exam-not-started");
    expect(rows({ exams: [exam("2026-10-28")] }).some((r) => r.kind === "exam-not-started")).toBe(
      false,
    );
    expect(
      rows({ exams: [exam("2026-10-26")], reminded: new Set(["e1"]) }).some(
        (r) => r.kind === "exam-not-started",
      ),
    ).toBe(false);
  });

  it("1 disappears when nobody is left who has not started (everyone attempted)", () => {
    const attempts: Attempt[] = people
      .filter((p) => p.local)
      .map((p) => ({ examId: "e1", studentId: p.id, correct: 20, total: 20, finishedAt: 1 }));
    // the invented students keep their seeded statuses, so some are still not started
    expect(rows({ exams: [exam("2026-10-26")], attempts }).length).toBeGreaterThan(0);
  });

  it("2: students below the pass mark, with the count and the reason, open the filtered list", () => {
    const [row] = rows({ exams: [seedActive] });
    expect(row).toMatchObject({
      kind: "needs-attention",
      reason: "Below the pass mark",
      href: "/instructor/students?filter=needs&from=overview",
    });
    expect(row.title).toMatch(/^\d+ students need attention$/);
  });

  it("3: a draft set, singular or plural, opens its Review or the Content tab", () => {
    const one = rows({ exams: [seedActive], list: calm, drafts: [draft] });
    expect(one).toEqual([
      {
        kind: "draft-set",
        title: "1 imported set is not published",
        reason: "Evacuation routes",
        href: "/instructor/content/cx",
      },
    ]);
    const two = rows({
      exams: [seedActive],
      list: calm,
      drafts: [draft, { id: "cy", title: "Other" }],
    });
    expect(two[0].title).toBe("2 imported sets are not published");
    expect(two[0].href).toBe("/instructor/content");
  });

  it("4: no active exam opens Assign exam", () => {
    const [row] = rows({ exams: [], list: calm });
    expect(row).toEqual({
      kind: "no-exam",
      title: "No active exam",
      reason: "Assign an exam to your group",
      href: "/instructor/exams/new?from=overview",
    });
    expect(rows({ exams: [exam("2020-01-01")], list: calm })[0].kind).toBe("no-exam");
  });

  it("shows at most 3 rows, in priority order, and none when nothing applies", () => {
    const all = rows({ exams: [exam("2026-10-25")], drafts: [draft] });
    expect(all.length).toBeLessThanOrEqual(ACTION_LIMIT);
    const four = rows({ exams: [], drafts: [draft] });
    expect(four.map((r) => r.kind)).toEqual(["needs-attention", "draft-set", "no-exam"]);
    expect(rows({ exams: [seedActive], list: calm })).toEqual([]);
  });

  it("uses counts only: no percent sign in any row", () => {
    for (const row of rows({ exams: [exam("2026-10-25")], drafts: [draft] })) {
      expect(`${row.title} ${row.reason}`).not.toContain("%");
    }
  });
});

describe("the change since last week", () => {
  it("is the seeded demo history: the same students now against a week ago, in whole points", () => {
    expect(groupDelta(list)).toBe(4);
    expect(deltaLine(4)).toBe("+4 points since last week");
    expect(deltaLine(1)).toBe("+1 point since last week");
    expect(deltaLine(-3)).toBe("-3 points since last week");
    expect(deltaLine(0)).toBe("No change since last week");
    expect(deltaLine(-3)).not.toContain("%");
  });

  it("is absent without history, and the local account (no history) is not counted", () => {
    const local = list.filter((p) => p.participant.local);
    expect(groupDelta(local)).toBeNull();
    expect(groupDelta([])).toBeNull();
    const noHistory = list.map((p) => ({ ...p, previousCorrect: undefined }));
    expect(groupDelta(noHistory as StudentProfile[])).toBeNull();
    expect(groupDelta(list.filter((p) => !p.participant.local))).toBe(groupDelta(list));
  });

  it("can be negative", () => {
    const topic = (correct: number): StudentTopic => ({
      sectionId: "S1",
      answered: 10,
      correct,
      total: 10,
    });
    const profile = (previousCorrect: number): StudentProfile => ({
      participant: { id: "a", name: "A", initials: "A", local: false },
      field: null,
      topics: [topic(6)],
      previousCorrect,
    });
    expect(groupDelta([profile(9)])).toBe(-30);
    expect(deltaLine(-30)).toBe("-30 points since last week");
  });
});

describe("the weakest topic", () => {
  it("is the first standing with data, or null without; Assign exam on it prefills the topic", () => {
    const weak = weakestTopic(list)!;
    expect(weak.total).toBeGreaterThan(0);
    expect(weakestTopic([])).toBeNull();
    expect(`/instructor/exams/new?topic=${weak.sectionId}&from=overview`).toContain(weak.sectionId);
  });
});
