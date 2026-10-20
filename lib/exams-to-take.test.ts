import { describe, expect, it } from "vitest";
import { homeTiles } from "@/lib/home";
import type { Attempt } from "@/lib/cohort";
import { assignedLine, examsToTake } from "@/lib/exams-to-take";
import { seedGroupExams } from "@/lib/group-exams";
import { addNotification, withNotices } from "@/lib/notifications";
import { cleanNotices, collapseReminders, reminderExam } from "@/lib/group-store";
import { cleanNotifications, unreadCount } from "@/lib/notifications";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const [active, closed] = seedGroupExams(now);
const mine = "ira@example.com";
const passed = (examId: string): Attempt => ({
  examId,
  studentId: mine,
  correct: 20,
  total: 20,
  finishedAt: now,
});

describe("the exams to take", () => {
  it("are the Active exams not yet passed, nearest deadline first", () => {
    const later = { ...active, id: "later", deadline: "2026-11-30" };
    const sooner = { ...active, id: "sooner", deadline: "2026-10-25" };
    expect(examsToTake([later, closed, sooner], [], mine, now).map((e) => e.id)).toEqual([
      "sooner",
      "later",
    ]);
  });

  it("drop an exam once it is passed, and never for a failed attempt or another student", () => {
    expect(examsToTake([active], [passed(active.id)], mine, now)).toEqual([]);
    expect(examsToTake([active], [{ ...passed(active.id), correct: 5 }], mine, now)).toHaveLength(
      1,
    );
    expect(
      examsToTake([active], [{ ...passed(active.id), studentId: "other@example.com" }], mine, now),
    ).toHaveLength(1);
  });

  it("drop a closed exam and an exam closed by the instructor", () => {
    expect(examsToTake([closed], [], mine, now)).toEqual([]);
    expect(examsToTake([{ ...active, closedAt: now - 1 }], [], mine, now)).toEqual([]);
  });

  it("give the Home tile line: the count and the nearest due date, null with none", () => {
    expect(assignedLine([])).toBeNull();
    expect(assignedLine([active])).toMatch(/^1 assigned · due \d{1,2} \w{3}$/);
    expect(assignedLine([active, { ...active, id: "x" }])).toMatch(/^2 assigned · due /);
    const tile = (assigned: string | null, best: { correct: number; questions: number } | null) =>
      homeTiles({
        assigned,
        bestExam: best,
        weakSections: 0,
        saved: 0,
        checklists: 1,
      }).find((t) => t.id === "exam")!.count;
    expect(tile("1 assigned · due 26 Oct", null)).toBe("1 assigned · due 26 Oct");
    expect(tile(null, null)).toBe("Not taken yet");
    expect(tile(null, { correct: 17, questions: 20 })).toBe("Best: 17 of 20");
  });
});

describe("fewer duplicates", () => {
  const base = { type: "message" as const, text: "", target: null, read: true };

  it("reads a reminder id with or without the old time suffix", () => {
    expect(reminderExam("remind-seed-active")).toBe("seed-active");
    expect(reminderExam("remind-seed-active-1792000000000")).toBe("seed-active");
    expect(reminderExam("notice-seed-active")).toBeNull();
  });

  it("collapses several stored reminders of one exam to the newest, per exam", () => {
    const list = collapseReminders([
      { id: "remind-a-1792000000001", createdAt: 1 },
      { id: "remind-a-1792000000003", createdAt: 3 },
      { id: "remind-b-1792000000002", createdAt: 2 },
      { id: "notice-a", createdAt: 0 },
    ]);
    expect(list.map((e) => `${e.id}@${e.createdAt}`)).toEqual([
      "remind-a@3",
      "remind-b@2",
      "notice-a@0",
    ]);
  });

  it("cleans stored notices and notifications the same way", () => {
    const notices = cleanNotices([
      { id: "remind-a-1792000000001", title: "R", createdAt: 1 },
      { id: "remind-a-1792000000002", title: "R", createdAt: 2 },
    ])!;
    expect(notices).toHaveLength(1);
    expect(notices[0].id).toBe("remind-a");
    const list = cleanNotifications(
      [1, 2, 3].map((n) => ({
        ...base,
        id: `remind-a-179200000000${n}`,
        title: "R",
        createdAt: n,
      })),
    )!;
    expect(list).toHaveLength(1);
    expect(list[0].createdAt).toBe(3);
  });

  it("adds one notification per assignment, and a repeated reminder updates the row (unread, new date)", () => {
    const notice = {
      id: "notice-x",
      title: "New exam assigned: X",
      text: "",
      target: "/",
      createdAt: 10,
    };
    const once = withNotices([], [notice, notice]);
    expect(once).toHaveLength(1);
    expect(withNotices(once, [notice])).toBe(once);
    const first = withNotices(once, [
      { ...notice, id: "remind-x", title: "Reminder: X", createdAt: 20 },
    ]);
    const read = first.map((n) => ({ ...n, read: true }));
    expect(first).toHaveLength(2);
    const again = withNotices(read, [
      { ...notice, id: "remind-x", title: "Reminder: X", createdAt: 30 },
    ]);
    expect(again).toHaveLength(2);
    const reminder = again.find((n) => n.id === "remind-x")!;
    expect(reminder.createdAt).toBe(30);
    expect(reminder.read).toBe(false);
    expect(unreadCount(again)).toBe(1);
    expect(addNotification(again, { ...reminder })).toBe(again);
  });
});
