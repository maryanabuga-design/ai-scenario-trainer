import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GroupSwitcher } from "@/components/GroupSwitcher/GroupSwitcher";

const rows = [
  { id: "rescue-team", name: "Rescue team", line: "15 students · Almost ready" },
  { id: "military-training", name: "Military training", line: "12 students · Needs attention" },
  { id: "all", name: "All groups", line: "One card per group" },
];
const render = (props: Partial<Parameters<typeof GroupSwitcher>[0]> = {}) =>
  renderToStaticMarkup(
    <GroupSwitcher scope="rescue-team" rows={rows} onSelect={() => undefined} {...props} />,
  ).replace(/<!-- -->/g, "");

describe("the group switcher", () => {
  it("is a full pill with the group icon on a 32px circle in the sand tile colour, the name and a chevron, closed by default", () => {
    const html = render();
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("aria-controls");
    expect(html).toContain("rounded-full border border-selectable-stroke bg-card");
    const circle = html.slice(html.indexOf("data-group-icon"));
    const tag = circle.slice(0, circle.indexOf(">"));
    expect(tag).toContain("h-8 w-8");
    expect(tag).toContain("rounded-full");
    expect(tag).toContain("bg-chip-neutral-bg");
    expect(tag).not.toMatch(/rounded-\[/);
    expect(html).toContain("lucide-users-round");
    expect(html).not.toMatch(/h-2 w-2[^"]*rounded-full bg-primary/);
    expect(html).toContain(">Rescue team<");
    expect(html).not.toContain('role="listbox"');
    expect(html).not.toContain("rotate-180");
    // no link and no page: it opens a list in place
    expect(html).not.toContain("<a ");
  });

  it("opens a listbox under the pill: 16px radius, 1px border, shadow, over the content, not a dialog", () => {
    const html = render({ initiallyOpen: true });
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("rotate-180");
    expect(html).toContain('role="listbox"');
    for (const hook of [
      "absolute",
      "top-full",
      "z-30",
      "rounded-[16px]",
      "border-selectable-stroke",
      "shadow-(--card-shadow)",
      "min-w-full",
      "max-w-[min(320px,calc(100vw-32px))]",
    ]) {
      expect(html).toContain(hook);
    }
    expect(html).not.toMatch(/role="dialog"|fixed inset/);
  });

  it("has options of at least 56px with the count line and a check on the current one; All groups is last", () => {
    const html = render({ initiallyOpen: true, scope: "military-training" });
    expect(html.match(/role="option"/g)).toHaveLength(3);
    expect(html.match(/min-h-14/g)).toHaveLength(3);
    expect(html).toMatch(
      /data-group-option="military-training"[^>]*aria-selected="true"|aria-selected="true"[^>]*data-group-option="military-training"/,
    );
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html.match(/lucide-check/g)).toHaveLength(1);
    const at = (id: string) => html.indexOf(`data-group-option="${id}"`);
    expect(at("rescue-team")).toBeLessThan(at("military-training"));
    expect(at("all")).toBeGreaterThan(at("military-training"));
    expect(html).toContain("12 students · Needs attention");
    expect(html).toContain("One card per group");
    expect(html).not.toContain("%");
  });

  it("does not animate anything", () => {
    expect(render({ initiallyOpen: true })).not.toMatch(/transition|animate-/);
  });
});
