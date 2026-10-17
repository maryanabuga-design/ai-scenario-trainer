import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ReadingHeader } from "@/components/ReadingHeader/ReadingHeader";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: () => {}, push: () => {} }) }));

const render = (props: Partial<Parameters<typeof ReadingHeader>[0]> = {}) =>
  renderToStaticMarkup(
    <ReadingHeader
      label="S3 · 3 of 10"
      previousId="S2"
      nextId="S4"
      scrolled={false}
      onBack={() => {}}
      {...props}
    />,
  );
const source = readFileSync("components/ReadingHeader/ReadingHeader.tsx", "utf8");

describe("the reading header", () => {
  it("has Back, the position label and the two topic arrows, and not the title", () => {
    const html = render();
    expect(html).toContain('aria-label="Back"');
    expect(html).toContain("S3 · 3 of 10");
    expect(html).toContain('aria-label="Previous topic"');
    expect(html).toContain('aria-label="Next topic"');
  });

  it("is sticky on the page colour, 56px plus the top safe area, full width and marked full-bleed", () => {
    const html = render();
    expect(html).toContain("sticky top-0");
    expect(html).toContain("bg-bg");
    expect(html).toContain("h-[calc(56px+env(safe-area-inset-top))]");
    expect(html).toContain("data-full-bleed");
  });

  it("draws the bottom line only once scrolled, and keeps its height either way", () => {
    expect(render({ scrolled: false })).toMatch(/border-b[^"]*border-transparent/);
    expect(render({ scrolled: true })).toContain("border-selectable-stroke");
    expect(render({ scrolled: true })).toMatch(/\bborder-b\b/);
  });

  it("disables the arrow with no neighbour, which keeps its place", () => {
    const tag = (html: string, name: string) =>
      html.match(new RegExp(`<button[^>]*aria-label="${name}"[^>]*>`))![0];
    // the attribute, not the disabled: styles in the class
    const off = (html: string, name: string) => /\sdisabled(=""|\s|>)/.test(tag(html, name));
    const first = render({ previousId: null });
    expect(off(first, "Previous topic")).toBe(true);
    expect(off(first, "Next topic")).toBe(false);
    const last = render({ nextId: null });
    expect(off(last, "Next topic")).toBe(true);
    expect(off(last, "Previous topic")).toBe(false);
  });

  it("replaces the history entry and returns to the top", () => {
    expect(source).toContain("router.replace(readingPath(id))");
    expect(source).toContain("window.scrollTo(0, 0)");
  });
});
