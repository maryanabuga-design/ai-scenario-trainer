import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { contrastRatio, TEXT_CONTRAST } from "@/lib/contrast";

const css = readFileSync("app/globals.css", "utf8");
const token = (name: string) => {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css);
  if (!match) throw new Error(`No hex value for --${name}`);
  return match[1].toLowerCase();
};

const render = (props: Partial<Parameters<typeof PageHeaderBand>[0]> = {}) =>
  renderToStaticMarkup(
    <PageHeaderBand
      title="Steps"
      subtitle="Short step-by-step guides for each topic."
      back={{ label: "Back to Home", href: "/" }}
      {...props}
    />,
  );

describe("the page header band", () => {
  it("is a full-bleed band in the hero-card colour, edge to edge and under the status bar, with a hairline bottom border and no shadow", () => {
    const html = render();
    expect(html).toContain("data-full-bleed");
    // the Home hero card's own token, not a copy of its value
    expect(html).toContain("bg-secondary-sand");
    expect(readFileSync("components/HomeView/HomeView.tsx", "utf8")).toContain(
      "bg-secondary-sand p-4",
    );
    expect(html).toContain("border-b border-selectable-stroke");
    expect(html).not.toContain("bg-primary");
    expect(html).toContain("-mx-[var(--gutter,1rem)]");
    expect(html).toContain("env(safe-area-inset-top)");
    expect(html).toContain("px-[var(--gutter,1rem)]");
    // the band itself (its first tag): only the bottom border; no shadow, rounding or gradient
    const band = html.slice(0, html.indexOf(">"));
    expect(band).not.toMatch(/shadow|rounded|gradient/);
    expect(band.match(/border/g)).toHaveLength(2);
  });

  it("has the white 40px Back, the white title and the optional subtitle", () => {
    const html = render();
    expect(html).toContain('aria-label="Back to Home"');
    expect(html).toContain("h-10 w-10");
    expect(html).toContain("bg-surface");
    expect(html).toContain('<h1 class="type-page-title text-text line-clamp-2">Steps</h1>');
    expect(html).toContain("Short step-by-step guides for each topic.");
    expect(render({ subtitle: undefined })).not.toMatch(/<p[ >]/);
  });

  it("has the page gutter below it, or 56px where a card overlaps its edge", () => {
    expect(render()).toContain("pb-[var(--gutter,1rem)]");
    expect(render({ overlap: true })).toContain("pb-14");
  });

  it("reads the title and the subtitle at least 4.5:1 on the band, computed from the real classes", () => {
    const html = render();
    // the fill and the text classes the band really uses, mapped to their tokens
    const fill = /bg-(secondary-sand)/.exec(html)![1];
    const title = /<h1 class="[^"]*\btext-(text)\b/.exec(html)![1];
    const subtitle = /<p class="[^"]*\btext-(text)\b/.exec(html)![1];
    expect(token(fill)).toBe("#f0ece6");
    for (const name of [title, subtitle]) {
      expect(contrastRatio(token(name), token(fill))).toBeGreaterThanOrEqual(TEXT_CONTRAST);
    }
  });

  it("limits the title to two lines with an ellipsis", () => {
    expect(render()).toContain("line-clamp-2");
  });
});
