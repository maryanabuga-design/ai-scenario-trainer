import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { badgeText, bellLabel } from "@/components/NotificationBell/NotificationBell";
import { NotificationsView } from "@/components/NotificationsView/NotificationsView";
import { seedGroupExams } from "@/lib/group-exams";
import type { AppNotification } from "@/lib/notifications";

const NOW = new Date(2026, 9, 19, 14, 0, 0).getTime();
const make = (id: string, extra: Partial<AppNotification> = {}): AppNotification => ({
  id,
  type: "reminder",
  title: `Title ${id}`,
  text: "A line of text.",
  target: "/training",
  createdAt: NOW - 120 * 60_000,
  read: false,
  ...extra,
});

const exams = seedGroupExams(NOW);
const render = (items: AppNotification[], toTake = exams.slice(0, 1), fresh: string[] = []) =>
  renderToStaticMarkup(
    <NotificationsView items={items} toTake={toTake} now={NOW} freshIds={new Set(fresh)} />,
  );

describe("the bell", () => {
  it("counts up to 9 and then says 9+", () => {
    expect([0, 1, 9, 10, 40].map((n) => badgeText(n))).toEqual(["0", "1", "9", "9+", "9+"]);
  });

  it("is named with the unread count", () => {
    expect(bellLabel(3)).toBe("Notifications, 3 unread");
    expect(bellLabel(0)).toBe("Notifications, no unread");
  });
});

describe("the Notifications screen", () => {
  const items = [make("a"), make("b", { target: null, createdAt: NOW - 30 * 60 * 60_000 })];
  const html = render(items, exams, ["a"]);

  it("has the small Back and the title, and no Mark all as read", () => {
    expect(html).toContain('aria-label="Back to Home"');
    expect(html).toContain("h-10 w-10");
    expect(html).toContain(">Notifications</h1>");
    expect(html).not.toContain("Mark all as read");
  });

  it("has EXAMS TO TAKE first, then EARLIER", () => {
    expect(html.indexOf("EXAMS TO TAKE")).toBeGreaterThan(-1);
    expect(html.indexOf("EXAMS TO TAKE")).toBeLessThan(html.indexOf("EARLIER"));
    expect(html).not.toContain(">New<");
  });

  it("leaves out EXAMS TO TAKE when there is none, and EARLIER when the history is empty", () => {
    expect(render(items, [])).not.toContain("EXAMS TO TAKE");
    expect(render([], exams)).not.toContain("EARLIER");
  });

  it("shows one 88px card per exam to take, each opening the exam intro", () => {
    expect(html.match(/data-assigned-exam=/g)).toHaveLength(exams.length);
    expect(html.match(/h-\[88px\]/g)).toHaveLength(exams.length);
    expect(html).toContain(`href="/exam?id=${exams[0].id}"`);
    expect(html).toContain("questions · ");
    expect(html).not.toContain("Start exam");
  });

  it("shows history rows of a fixed 72px with the title, the relative time and a dot only when new", () => {
    expect(html.match(/h-\[72px\]/g)).toHaveLength(2);
    expect(html).toContain("2 h ago");
    expect(html).toContain("Yesterday");
    expect(html.match(/data-unread-dot/g)).toHaveLength(1);
    expect(html).toContain("Unread: ");
    expect(html).toContain("line-clamp-2");
  });

  it("gives a chevron only to a row that opens something", () => {
    const row = (out: string, id: string) => {
      const start = out.indexOf(`data-history-row="${id}"`);
      return out.slice(start, out.indexOf("</li>", start));
    };
    expect(row(html, "a")).toContain("lucide-chevron-right");
    expect(row(html, "a")).toContain('href="/training"');
    expect(row(html, "b")).not.toContain("lucide-chevron-right");
    expect(row(html, "b")).not.toContain("<a ");
  });

  it("opens an exam row only while that exam is active", () => {
    const row = make("e", { target: `/exam?id=${exams[0].id}`, type: "message" });
    const open = render([row], exams.slice(0, 1));
    expect(open).toContain(`data-history-row="e"`);
    const start = open.indexOf('data-history-row="e"');
    expect(open.slice(start - 200, start)).toContain("<a ");
    const closed = render([row], []);
    const at = closed.indexOf('data-history-row="e"');
    expect(closed.slice(at - 200, at)).not.toContain("<a ");
    expect(closed.slice(at, closed.indexOf("</li>", at))).not.toContain("lucide-chevron-right");
  });

  it("draws the type icon in the one neutral tile", () => {
    expect(html).toContain("bg-neutral-tile-bg text-neutral-tile-ink");
    expect(html).toContain("lucide-clock");
    expect(render([make("m", { type: "message" })])).toContain("lucide-message-square");
    expect(render([make("r", { type: "result" })])).toContain("lucide-clipboard-check");
  });

  it("has an empty state only when both sections are empty", () => {
    const empty = render([], []);
    expect(empty).toContain("No notifications yet");
    expect(empty).toContain("lucide-bell");
    expect(render([], exams)).not.toContain("No notifications yet");
    expect(render(items, [])).not.toContain("No notifications yet");
  });

  it("lives on its own screen with no bottom navigation item", () => {
    const nav = readFileSync("components/BottomNav/BottomNav.tsx", "utf8");
    expect(nav).not.toContain("/notifications");
  });
});
