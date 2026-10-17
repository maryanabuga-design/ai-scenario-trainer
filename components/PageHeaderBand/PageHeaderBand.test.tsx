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
  it("is a full-bleed Primary band, edge to edge and under the status bar, with no border or shadow", () => {
    const html = render();
    expect(html).toContain("data-full-bleed");
    expect(html).toContain("bg-primary");
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
    expect(html).toContain('<h1 class="type-page-title text-primary-text">Steps</h1>');
    expect(html).toContain("Short step-by-step guides for each topic.");
    expect(render({ subtitle: undefined })).not.toMatch(/<p[ >]/);
  });

  it("has the page gutter below it, or 56px where a card overlaps its edge", () => {
    expect(render()).toContain("pb-[var(--gutter,1rem)]");
    expect(render({ overlap: true })).toContain("pb-14");
  });

  it("reads the title and the subtitle at least 4.5:1 on the band", () => {
    const html = render();
    // the classes the title and subtitle really use, and the band's own fill
    expect(html).toContain("text-primary-text");
    expect(html.match(/text-primary-text/g)).toHaveLength(2);
    const band = token("primary");
    const text = token("primary-text");
    expect(contrastRatio(text, band)).toBeGreaterThanOrEqual(TEXT_CONTRAST);
  });
});
