import { useEffect, useMemo } from "react";
import seed from "@/content/notifications.json";
import { DAILY_GOAL, PASS_MARK } from "@/lib/config";
import { isoDay } from "@/lib/exam-deadline";
import { collapseReminders, useNotices } from "@/lib/group-store";
import type { Notice } from "@/lib/group-store";
import { createStore } from "@/lib/store";
import type { FinishedSession } from "@/lib/session";

/**
 * Notifications. CLIENT ONLY (they are saved in this browser). They are demo data: four messages
 * "from your instructor" (`content/notifications.json`) and in-app events. There is no backend,
 * no push, no permission prompt and no network request (DESIGN.md: Notifications).
 */
export type NotificationType = "reminder" | "result" | "message";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  text: string;
  /** The screen it opens, or null for a card that is only marked as read. */
  target: string | null;
  createdAt: number;
  read: boolean;
};

/** The most notifications kept; the oldest are dropped. */
export const MAX_NOTIFICATIONS = 50;

const TYPES: NotificationType[] = ["reminder", "result", "message"];
const STATIC_TARGETS = [
  "/",
  "/training",
  "/exam",
  "/exam/results",
  "/progress",
  "/materials",
  "/weak-topics",
  "/saved",
  "/checklists",
  "/mini-quiz",
  "/profile",
];

/** A screen a notification may open: a known route, or the reading screen of a topic. */
export function isValidTarget(target: string): boolean {
  return (
    STATIC_TARGETS.includes(target) ||
    /^\/materials\/read\/[A-Za-z0-9-]+$/.test(target) ||
    /^\/exam\?id=[A-Za-z0-9-]+$/.test(target)
  );
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const newestFirst = (a: AppNotification, b: AppNotification) => b.createdAt - a.createdAt;

/** Newest first, one reminder per exam, no repeated ids (the first one wins), at most MAX_NOTIFICATIONS. */
function tidy(list: AppNotification[]): AppNotification[] {
  const seen = new Set<string>();
  return collapseReminders([...list])
    .sort(newestFirst)
    .filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)))
    .slice(0, MAX_NOTIFICATIONS);
}

/**
 * The valid notifications of whatever was read: a broken or unknown entry is ignored, an unknown
 * target becomes "no target". An empty list stays an empty list (the empty state); only a value
 * that is not a list reads as nothing, so the demo messages are seeded again.
 */
export function cleanNotifications(value: unknown): AppNotification[] | null {
  if (!Array.isArray(value)) return null;
  const list = value.flatMap((entry): AppNotification[] => {
    if (!isObject(entry)) return [];
    const { id, type, title, text, target, createdAt, read } = entry;
    if (typeof id !== "string" || id === "") return [];
    if (typeof type !== "string" || !TYPES.includes(type as NotificationType)) return [];
    if (typeof title !== "string" || title.trim() === "") return [];
    if (typeof createdAt !== "number" || !Number.isFinite(createdAt)) return [];
    return [
      {
        id,
        type: type as NotificationType,
        title,
        text: typeof text === "string" ? text : "",
        target: typeof target === "string" && isValidTarget(target) ? target : null,
        createdAt,
        read: read === true,
      },
    ];
  });
  return tidy(list);
}

/** The demo messages from the seed file, their times worked out from `minutesAgo`. */
export function seedNotifications(now: number): AppNotification[] {
  const list = seed.notifications.map((n): AppNotification => ({
    id: n.id,
    type: n.type as NotificationType,
    title: n.title,
    text: n.text,
    target: n.target,
    createdAt: now - n.minutesAgo * 60_000,
    read: false,
  }));
  return tidy(list);
}

/** The list with the instructor's notices added once each (an id already in the list is never added again). */
export function withNotices(list: AppNotification[], notices: Notice[]): AppNotification[] {
  return notices.reduce((current, notice) => {
    // a repeated reminder updates the one already there: a new date, unread again
    const old = current.find((n) => n.id === notice.id);
    if (old && notice.createdAt > old.createdAt) {
      return tidy([
        {
          ...old,
          title: notice.title,
          text: notice.text,
          createdAt: notice.createdAt,
          read: false,
        },
        ...current.filter((n) => n.id !== notice.id),
      ]);
    }
    return addNotification(current, {
      id: notice.id,
      type: "message",
      title: notice.title,
      text: notice.text,
      target: isValidTarget(notice.target) ? notice.target : null,
      createdAt: notice.createdAt,
      read: false,
    });
  }, list);
}

export const unreadCount = (list: AppNotification[]) => list.filter((n) => !n.read).length;

export function markRead(list: AppNotification[], id: string): AppNotification[] {
  const target = list.find((n) => n.id === id);
  if (!target || target.read) return list;
  return list.map((n) => (n.id === id ? { ...n, read: true } : n));
}

export function markAllRead(list: AppNotification[]): AppNotification[] {
  return unreadCount(list) === 0 ? list : list.map((n) => (n.read ? n : { ...n, read: true }));
}

/** Unread ones under "New", read ones under "Earlier", newest first in each. */
export function groupNotifications(list: AppNotification[]) {
  const sorted = [...list].sort(newestFirst);
  return { fresh: sorted.filter((n) => !n.read), earlier: sorted.filter((n) => n.read) };
}

/** Adds a notification; one with the same id is never added twice (the list is returned as it was). */
export function addNotification(
  list: AppNotification[],
  added: AppNotification,
): AppNotification[] {
  if (list.some((n) => n.id === added.id)) return list;
  return tidy([added, ...list]);
}

const startOfDay = (time: number) => {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

/** "Just now", "5 min ago", "2 h ago", "Yesterday", "3 days ago", then the date ("7 Oct"). */
export function relativeTime(createdAt: number, now: number): string {
  const minutes = Math.floor(Math.max(0, now - createdAt) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  const days = Math.round((startOfDay(now) - startOfDay(createdAt)) / 86_400_000);
  if (days <= 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** The notification an event adds, or null when it has none. */
function eventFor(
  entry: FinishedSession,
  history: FinishedSession[],
  now: number,
): AppNotification | null {
  if (entry.kind === "exam") {
    if (!entry.exam) return null;
    const { percent } = entry.exam;
    return {
      id: `exam-${entry.finishedAt}`,
      type: "result",
      title: `Exam result: ${percent}% · ${percent >= PASS_MARK ? "passed" : "not passed"}`,
      text: "Open the results to see which answers to review.",
      target: "/exam/results",
      createdAt: entry.finishedAt,
      read: false,
    };
  }
  const today = startOfDay(now);
  const answered = history
    .filter((s) => s.kind !== "exam" && startOfDay(s.finishedAt) === today)
    .reduce((sum, s) => sum + s.answers.length, 0);
  if (answered < DAILY_GOAL) return null;
  return {
    id: `goal-${isoDay(new Date(now))}`,
    type: "result",
    title: "Daily goal reached",
    text: `You answered ${answered} questions today. Well done.`,
    target: "/progress",
    createdAt: now,
    read: false,
  };
}

/** The list after a finished session: an exam result, or the daily goal reached (once per day). */
export function applyFinished(
  list: AppNotification[],
  entry: FinishedSession,
  history: FinishedSession[],
  now: number,
): AppNotification[] {
  const added = eventFor(entry, history, now);
  return added ? addNotification(list, added) : list;
}

const store = createStore<AppNotification[]>("ast.notifications.v1", {
  sanitize: cleanNotifications,
});

/** The saved list (cleaned every time, because the store only cleans a value of other content). */
function readList(): AppNotification[] | null {
  return cleanNotifications(store.read());
}

/** The saved list; the first time, the demo messages are saved and used. */
function readOrSeed(now: number): AppNotification[] {
  const saved = readList();
  if (saved) return saved;
  const seeded = seedNotifications(now);
  store.write(seeded);
  return seeded;
}

function save(before: AppNotification[], after: AppNotification[]) {
  if (after !== before) store.write(after);
}

/** The notifications, "loading" until the browser has been read; the first visit seeds the demo ones. */
export function useNotifications(): AppNotification[] | "loading" {
  const stored = store.useValue();
  const list = useMemo(
    () => (stored === "loading" ? "loading" : cleanNotifications(stored)),
    [stored],
  );
  const notices = useNotices();
  useEffect(() => {
    if (list === null) readOrSeed(Date.now());
  }, [list]);
  // the instructor's notices reach this account once each
  useEffect(() => {
    if (list === null || list === "loading" || notices === "loading") return;
    const merged = withNotices(list, notices);
    if (merged !== list) store.write(merged);
  }, [list, notices]);
  return list === null ? "loading" : list;
}

export function markNotificationRead(id: string) {
  const list = readOrSeed(Date.now());
  save(list, markRead(list, id));
}

export function markAllNotificationsRead() {
  const list = readOrSeed(Date.now());
  save(list, markAllRead(list));
}

/** Called after a session or exam is added to the history: adds the event's notification once. */
export function notifyFinished(entry: FinishedSession, history: FinishedSession[]) {
  const now = Date.now();
  const list = readOrSeed(now);
  save(list, applyFinished(list, entry, history, now));
}

/** Reset progress: the demo messages come back as new. */
export function resetNotifications() {
  store.write(null);
}
