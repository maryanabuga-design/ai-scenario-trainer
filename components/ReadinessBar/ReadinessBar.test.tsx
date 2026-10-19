import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReadinessBar } from "@/components/ReadinessBar/ReadinessBar";
import { contrastRatio, GRAPHIC_CONTRAST, TEXT_CONTRAST } from "@/lib/contrast";

const css = readFileSync("app/globals.css", "utf8");
const token = (name: string) => {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css);
  if (!match) throw new Error(`No hex value for --${name}`);
  return match[1].toLowerCase();
};

describe("the readiness bar", () => {
  const html = renderToStaticMarkup(<ReadinessBar percent={62} />);

  it("is a progressbar with its values and an accessible name that says the pass mark", () => {
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuenow="62"');
    expect(html).toContain('aria-label="Readiness 62%, pass mark 80%"');
  });

  it("fills to the readiness on an olive-tint track and ticks at 80% with a text label", () => {
    expect(html).toContain("bg-olive-tint");
    expect(html).toContain("bg-primary");
    expect(html).toContain("width:62%");
    expect(html).toContain("left:80%");
    expect(html).toContain("data-readiness-tick-label");
    expect(html.replace(/<[^>]+>/g, "")).toBe("80%");
  });

  it("clamps nothing it should not: 0 and 100 render", () => {
    expect(renderToStaticMarkup(<ReadinessBar percent={0} />)).toContain("width:0%");
    expect(renderToStaticMarkup(<ReadinessBar percent={100} />)).toContain("width:100%");
  });

  it("keeps the fill and the tick at least 3:1 on the track, and the label at least 4.5:1, from the tokens", () => {
    const track = token("olive-tint");
    expect(contrastRatio(token("primary"), track)).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST);
    expect(contrastRatio(token("text"), track)).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST);
    // the label sits on the page and on the sand card
    for (const back of ["bg", "secondary-sand", "card"]) {
      expect(contrastRatio(token("text-secondary"), token(back))).toBeGreaterThanOrEqual(
        TEXT_CONTRAST,
      );
    }
  });
});
