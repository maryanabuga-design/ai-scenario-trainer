import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { badgeText, bellLabel } from "@/components/NotificationBell/NotificationBell";
import { NotificationsView } from "@/components/NotificationsView/NotificationsView";
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

const render = (items: AppNotification[]) =>
  renderToStaticMarkup(
    <NotificationsView items={items} now={NOW} onOpen={() => {}} onMarkAll={() => {}} />,
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
  const items = [
    make("a", { read: false }),
    make("b", { read: true, target: null, createdAt: NOW - 30 * 60 * 60_000 }),
  ];
  const html = render(items);

  it("has the small Back, the title and Mark all as read while something is unread", () => {
    expect(html).toContain('aria-label="Back to Home"');
    expect(html).toContain("h-10 w-10");
    expect(html).toContain(">Notifications</h1>");
    expect(html).toContain("Mark all as read");
    expect(html.indexOf('aria-label="Back to Home"')).toBeLessThan(
      html.indexOf("Mark all as read"),
    );
  });

  it("hides Mark all as read when nothing is unread", () => {
    expect(render([make("a", { read: true })])).not.toContain("Mark all as read");
  });

  it("groups New and Earlier, and leaves out a group with nothing in it", () => {
    expect(html.indexOf(">New<")).toBeGreaterThan(-1);
    expect(html.indexOf(">New<")).toBeLessThan(html.indexOf(">Earlier<"));
    expect(render([make("a")])).not.toContain(">Earlier<");
    expect(render([make("a", { read: true })])).not.toContain(">New<");
  });

  it("shows the title, up to two lines of text and the relative time", () => {
    expect(html).toContain("Title a");
    expect(html).toContain("line-clamp-2");
    expect(html).toContain("2 h ago");
    expect(html).toContain("Yesterday");
  });

  it("marks only unread cards with a dot, and the card looks the same read or unread", () => {
    expect(html.match(/data-unread-dot/g)).toHaveLength(1);
    expect(html).toContain("Unread: ");
    const card = (read: boolean) => {
      const out = render([make("x", { read })]);
      const start = out.lastIndexOf("<a ", out.indexOf('href="/training"'));
      return out.slice(start, out.indexOf(">", start) + 1);
    };
    expect(card(false)).toBe(card(true));
    expect(card(false)).toContain("rounded-card border border-selectable-stroke bg-list-card");
    expect(card(false)).toContain("p-[var(--gutter,1rem)]");
    expect(card(false)).not.toMatch(/bg-primary|border-primary|bg-olive/);
  });

  it("opens the target with a link and only marks a card without a target (a button)", () => {
    expect(html).toContain('href="/training"');
    expect(html).toContain('<button type="button"');
  });

  it("draws the type icon in the one neutral tile", () => {
    expect(html).toContain("bg-neutral-tile-bg text-neutral-tile-ink");
    expect(html).toContain("lucide-clock");
    expect(render([make("m", { type: "message" })])).toContain("lucide-message-square");
    expect(render([make("r", { type: "result" })])).toContain("lucide-clipboard-check");
  });

  it("has an empty state", () => {
    const empty = render([]);
    expect(empty).toContain("No notifications yet");
    expect(empty).toContain("lucide-bell");
    expect(empty).not.toContain("Mark all as read");
  });

  it("lives on its own screen with no bottom navigation item", () => {
    const nav = readFileSync("components/BottomNav/BottomNav.tsx", "utf8");
    expect(nav).not.toContain("/notifications");
  });
});
