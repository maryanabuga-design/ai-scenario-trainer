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
  it("is a full-bleed mist band, edge to edge and under the status bar, with no border or shadow", () => {
    const html = render();
    expect(html).toContain("data-full-bleed");
    expect(html).toContain("bg-band-mist");
    expect(html).not.toContain("bg-primary");
    expect(html).toContain("-mx-[var(--gutter,1rem)]");
    expect(html).toContain("env(safe-area-inset-top)");
    expect(html).toContain("px-[var(--gutter,1rem)]");
    // the band itself (its first tag) has no border, shadow, rounding or gradient
    expect(html.slice(0, html.indexOf(">"))).not.toMatch(/border|shadow|rounded|gradient/);
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
    const fill = /bg-(band-mist)/.exec(html)![1];
    const title = /<h1 class="[^"]*\btext-(text)\b/.exec(html)![1];
    const subtitle = /<p class="[^"]*\btext-(text)\b/.exec(html)![1];
    expect(token(fill)).toBe("#e2ecf0");
    for (const name of [title, subtitle]) {
      expect(contrastRatio(token(name), token(fill))).toBeGreaterThanOrEqual(TEXT_CONTRAST);
    }
    // about 14:1 for the main text colour on the band
    expect(contrastRatio(token("text"), token("band-mist"))).toBeCloseTo(14, 0);
  });

  it("limits the title to two lines with an ellipsis", () => {
    expect(render()).toContain("line-clamp-2");
  });
});
