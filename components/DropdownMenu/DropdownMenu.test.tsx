import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DropdownMenu } from "@/components/DropdownMenu/DropdownMenu";

const render = (open = false) =>
  renderToStaticMarkup(
    <DropdownMenu
      label="More actions"
      initiallyOpen={open}
      items={[
        { id: "delete", label: "Delete demo topic", destructive: true, onSelect: () => undefined },
      ]}
    />,
  );

describe("the dropdown menu", () => {
  it("is an icon button with a 44px tap area, named, with aria-haspopup and aria-expanded", () => {
    const html = render();
    expect(html).toContain('aria-label="More actions"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("h-11 w-11");
    expect(html).toContain("lucide-ellipsis");
    expect(html).not.toContain('role="menu"');
  });

  it("opens a white panel with 16px radius, a border and a shadow under the button, not a sheet", () => {
    const html = render(true);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('role="menu"');
    for (const hook of [
      "absolute",
      "top-full",
      "right-0",
      "rounded-[16px]",
      "border-selectable-stroke",
      "shadow-(--card-shadow)",
    ]) {
      expect(html).toContain(hook);
    }
    expect(html).not.toMatch(/role="dialog"|fixed inset/);
    expect(html).not.toMatch(/transition|animate-/);
  });

  it("draws a destructive item in the destructive label colour with a 48px row", () => {
    const html = render(true);
    expect(html).toMatch(/role="menuitem"[^>]*min-h-12[^>]*text-wrong-text/);
    expect(html).toContain(">Delete demo topic<");
  });

  it("highlights nothing when it opens by mouse or touch; hover, press and the keyboard row use the one lighter token", () => {
    const html = render(true);
    expect(html).not.toMatch(/ bg-menu-highlight outline-2/);
    expect(html).not.toContain("aria-activedescendant");
    expect(html).toContain("hover:bg-menu-highlight active:bg-menu-highlight");
    expect(html).not.toContain("bg-secondary-sand");
  });
});

describe("the shared menu highlight", () => {
  const css = readFileSync("app/globals.css", "utf8");

  it("is the page background colour on the white menu card, in ONE token", () => {
    expect(css).toMatch(/--menu-highlight:\s*#f6f4f0;/i);
    expect(css).toMatch(/--bg:\s*#f6f4f0;/i);
  });

  it("is used by the menu and the group dropdown, never the header-band sand", () => {
    for (const file of [
      "components/DropdownMenu/DropdownMenu.tsx",
      "components/GroupSwitcher/GroupSwitcher.tsx",
    ]) {
      const rows = readFileSync(file, "utf8").split("<li")[1] ?? "";
      expect(rows, file).toContain("bg-menu-highlight");
      expect(rows, file).not.toContain("bg-secondary-sand");
      // a visible focus ring for the keyboard row
      expect(rows, file).toContain("outline-2 -outline-offset-2 outline-primary");
    }
  });
});
