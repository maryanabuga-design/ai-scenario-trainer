import { describe, expect, it } from "vitest";
import data from "@/content/notifications.json";
import { DAILY_GOAL, PASS_MARK } from "@/lib/config";
import { isoDay } from "@/lib/exam-deadline";
import { topicFor } from "@/lib/materials-topics";
import {
  MAX_NOTIFICATIONS,
  addNotification,
  applyFinished,
  cleanNotifications,
  groupNotifications,
  isValidTarget,
  markAllRead,
  markRead,
  relativeTime,
  seedNotifications,
  unreadCount,
} from "@/lib/notifications";
import type { AppNotification } from "@/lib/notifications";
import type { FinishedSession } from "@/lib/session";

const NOW = new Date(2026, 9, 19, 14, 0, 0).getTime();
const MINUTE = 60_000;

const make = (id: string, minutesAgo = 10, extra: Partial<AppNotification> = {}) => ({
  id,
  type: "message" as const,
  title: `Title ${id}`,
  text: "Text",
  target: null,
  createdAt: NOW - minutesAgo * MINUTE,
  read: false,
  ...extra,
});

describe("the seed file", () => {
  it("has four demo messages with unique ids, known types and valid targets", () => {
    const list = data.notifications;
    expect(list).toHaveLength(4);
    expect(new Set(list.map((n) => n.id)).size).toBe(list.length);
    for (const n of list) {
      expect(["reminder", "result", "message"]).toContain(n.type);
      expect(n.title.trim()).not.toBe("");
      expect(n.text.trim()).not.toBe("");
      expect(Number.isFinite(n.minutesAgo)).toBe(true);
      expect(n.minutesAgo).toBeGreaterThanOrEqual(0);
      if (n.target !== null) {
        expect(isValidTarget(n.target), n.target).toBe(true);
        const reading = /^\/materials\/read\/(.+)$/.exec(n.target);
        if (reading) expect(topicFor(reading[1]), n.target).toBeDefined();
      }
    }
  });

  it("covers the four examples: welcome, continue Part 1, new material, mock exam", () => {
    const targets = data.notifications.map((n) => n.target);
    expect(targets).toEqual([null, "/training", "/materials/read/S2", "/exam"]);
  });

  it("is turned into stored notifications with times worked out from minutesAgo, all unread", () => {
    const seeded = seedNotifications(NOW);
    expect(seeded).toHaveLength(4);
    expect(seeded.every((n) => !n.read)).toBe(true);
    const mock = seeded.find((n) => n.id === "mock-exam")!;
    expect(mock.createdAt).toBe(NOW - 45 * MINUTE);
    // newest first
    expect(seeded.map((n) => n.createdAt)).toEqual(
      [...seeded.map((n) => n.createdAt)].sort((a, b) => b - a),
    );
  });
});

describe("targets", () => {
  it("accepts the screens a notification can open and nothing else", () => {
    for (const target of ["/training", "/exam", "/exam/results", "/progress", "/materials"]) {
      expect(isValidTarget(target)).toBe(true);
    }
    expect(isValidTarget("/materials/read/S2")).toBe(true);
    for (const target of ["", "training", "https://example.com", "//evil.test", "/nowhere"]) {
      expect(isValidTarget(target), target).toBe(false);
    }
  });
});

describe("unread count and read state", () => {
  it("counts the unread ones", () => {
    expect(unreadCount([])).toBe(0);
    expect(unreadCount([make("a"), make("b", 5, { read: true }), make("c")])).toBe(2);
  });

  it("marks one as read, and only that one", () => {
    const list = [make("a"), make("b")];
    const next = markRead(list, "a");
    expect(next.find((n) => n.id === "a")!.read).toBe(true);
    expect(next.find((n) => n.id === "b")!.read).toBe(false);
    expect(markRead(list, "missing")).toBe(list);
    expect(markRead(next, "a")).toBe(next);
  });

  it("marks all as read", () => {
    const next = markAllRead([make("a"), make("b")]);
    expect(unreadCount(next)).toBe(0);
    expect(next).toHaveLength(2);
  });

  it("groups unread under New and read under Earlier, newest first", () => {
    const list = [
      make("old-unread", 300),
      make("read-new", 20, { read: true }),
      make("new-unread", 5),
      make("read-old", 900, { read: true }),
    ];
    const { fresh, earlier } = groupNotifications(list);
    expect(fresh.map((n) => n.id)).toEqual(["new-unread", "old-unread"]);
    expect(earlier.map((n) => n.id)).toEqual(["read-new", "read-old"]);
  });
});

describe("adding notifications", () => {
  it("adds the newest first and never twice for the same id", () => {
    const list = addNotification([make("a", 60)], make("b", 1));
    expect(list.map((n) => n.id)).toEqual(["b", "a"]);
    expect(addNotification(list, make("b", 0))).toBe(list);
  });

  it(`keeps at most ${MAX_NOTIFICATIONS} and drops the oldest`, () => {
    let list: AppNotification[] = [];
    for (let i = 0; i < 60; i++) list = addNotification(list, make(`n${i}`, 600 - i));
    expect(list).toHaveLength(MAX_NOTIFICATIONS);
    expect(list[0].id).toBe("n59");
    expect(list.some((n) => n.id === "n0")).toBe(false);
    expect(list.some((n) => n.id === "n10")).toBe(true);
    expect(list.some((n) => n.id === "n9")).toBe(false);
  });
});

describe("loading what was saved", () => {
  it("reads nothing for a value that is not a list", () => {
    for (const value of [null, undefined, 3, "x", {}, { items: [] }]) {
      expect(cleanNotifications(value)).toBeNull();
    }
  });

  it("keeps an empty list as an empty list (the empty state), not as nothing", () => {
    expect(cleanNotifications([])).toEqual([]);
  });

  it("ignores broken entries, fixes an unknown target and never throws", () => {
    const cleaned = cleanNotifications([
      make("ok", 5, { target: "/training" }),
      null,
      42,
      "text",
      { id: "", type: "message", title: "x", text: "y", createdAt: 1, read: false },
      { id: "no-type", type: "alarm", title: "x", text: "y", createdAt: 1, read: false },
      { id: "no-title", type: "message", text: "y", createdAt: 1, read: false },
      { id: "no-time", type: "message", title: "x", text: "y", read: false },
      make("bad-target", 6, { target: "/not-a-screen" }),
      { ...make("loose", 7), read: "yes", text: undefined },
      make("ok", 1),
    ])!;
    expect(cleaned.map((n) => n.id)).toEqual(["ok", "bad-target", "loose"]);
    expect(cleaned.find((n) => n.id === "bad-target")!.target).toBeNull();
    expect(cleaned.find((n) => n.id === "loose")).toMatchObject({ read: false, text: "" });
  });

  it("applies the cap of 50 to a saved list too", () => {
    const many = Array.from({ length: 70 }, (_, i) => make(`n${i}`, i + 1));
    expect(cleanNotifications(many)!).toHaveLength(MAX_NOTIFICATIONS);
  });
});

describe("in-app events", () => {
  const answers = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ itemId: `q${i}`, optionId: "a" }));
  const session = (count: number, minutesAgo = 5, kind = "quiz"): FinishedSession =>
    ({
      kind,
      itemIds: [],
      answers: answers(count),
      finishedAt: NOW - minutesAgo * MINUTE,
    }) as FinishedSession;
  const exam = (percent: number, minutesAgo = 1): FinishedSession =>
    ({
      kind: "exam",
      itemIds: [],
      answers: [],
      finishedAt: NOW - minutesAgo * MINUTE,
      exam: { percent, questions: 20, timeUsedSeconds: 600 },
    }) as FinishedSession;

  it("finishing an exam adds exactly one result notification, passed or not", () => {
    const passed = exam(PASS_MARK);
    const list = applyFinished([], passed, [passed], NOW);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      type: "result",
      title: `Exam result: ${PASS_MARK}% · passed`,
      target: "/exam/results",
      read: false,
    });
    const failed = exam(PASS_MARK - 1, 0);
    const second = applyFinished(list, failed, [passed, failed], NOW);
    expect(second.map((n) => n.title)).toContain(`Exam result: ${PASS_MARK - 1}% · not passed`);
    // the same event again adds nothing
    expect(applyFinished(second, failed, [passed, failed], NOW)).toBe(second);
  });

  it("an exam does not count toward the daily goal", () => {
    const entry = exam(90);
    const list = applyFinished([], entry, [session(DAILY_GOAL, 30), entry], NOW);
    expect(list.map((n) => n.id).filter((id) => id.startsWith("goal-"))).toEqual([]);
  });

  it("reaching the daily goal adds exactly one notification per local day", () => {
    const first = session(DAILY_GOAL - 2, 60);
    expect(applyFinished([], first, [first], NOW)).toEqual([]);
    const reaching = session(2, 5);
    const list = applyFinished([], reaching, [first, reaching], NOW);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: `goal-${isoDay(new Date(NOW))}`, target: "/progress" });
    // more sessions the same day add nothing, even after it was read
    const more = session(3, 1);
    const read = markAllRead(list);
    expect(applyFinished(read, more, [first, reaching, more], NOW)).toBe(read);
  });

  it("yesterday's questions do not count toward today's goal", () => {
    const yesterday = session(DAILY_GOAL, 60 * 24);
    const today = session(1, 2);
    expect(applyFinished([], today, [yesterday, today], NOW)).toEqual([]);
  });

  it("a weak-topics repeat only counts as answers, it has no notification of its own", () => {
    const repeat = session(2, 3, "repeat");
    expect(applyFinished([], repeat, [repeat], NOW)).toEqual([]);
  });
});

describe("relative time", () => {
  it("says Just now, minutes, hours, Yesterday, days and then the date", () => {
    expect(relativeTime(NOW - 20_000, NOW)).toBe("Just now");
    expect(relativeTime(NOW - 5 * MINUTE, NOW)).toBe("5 min ago");
    expect(relativeTime(NOW - 2 * 60 * MINUTE, NOW)).toBe("2 h ago");
    expect(relativeTime(NOW - 26 * 60 * MINUTE, NOW)).toBe("Yesterday");
    expect(relativeTime(NOW - 3 * 24 * 60 * MINUTE, NOW)).toBe("3 days ago");
    expect(relativeTime(NOW - 12 * 24 * 60 * MINUTE, NOW)).toBe("7 Oct");
    expect(relativeTime(NOW + 5 * MINUTE, NOW)).toBe("Just now");
  });
});
