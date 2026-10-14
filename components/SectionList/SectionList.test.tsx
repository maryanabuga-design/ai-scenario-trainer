import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MaterialTile } from "@/components/MaterialTile/MaterialTile";
import { SectionList } from "@/components/SectionList/SectionList";
import { loadAllSections } from "@/lib/guide";

const css = readFileSync("app/globals.css", "utf8");
const tint = /--olive-tint: (#[0-9a-f]{6});/i.exec(css)?.[1] ?? "";

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

describe("one olive tint", () => {
  it("is a single token, not the sand", () => {
    expect(tint.toLowerCase()).toBe("#d6dec9");
    expect(tint.toLowerCase()).not.toBe("#f0ece6");
    expect(css.match(/--olive-tint:/g)).toHaveLength(1);
    expect(css).not.toMatch(/--(code-|material-tile|section-tint)/);
  });

  it("is the background of every file-type tile", () => {
    for (const type of ["PDF", "Word document", "Link", "Image", "Text file"]) {
      expect(renderToStaticMarkup(<MaterialTile type={type} />)).toContain("bg-olive-tint");
    }
  });

  it("is the background of every section circle, and no section has its own colour", () => {
    const sections = loadAllSections().map((section) => ({
      id: section.id,
      title: section.title,
    }));
    const html = renderToStaticMarkup(
      <SectionList
        title="Sections"
        titleId="s"
        sections={sections}
        selected={sections.map((section) => section.id)}
        onChange={() => undefined}
      />,
    );
    const circles =
      html.match(/<span aria-hidden="true" class="[^"]*rounded-full[^"]*">S\d+/g) ?? [];
    expect(circles.length).toBeGreaterThanOrEqual(10);
    circles.forEach((circle) => {
      expect(circle).toContain("bg-olive-tint");
      expect(circle).toContain("text-text");
    });
    expect(html).not.toMatch(/bg-code-/);
  });

  it("keeps dark text and the dark green icon readable on it", () => {
    expect(contrast("#1a1a1a", tint)).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#3f4638", tint)).toBeGreaterThanOrEqual(4.5);
  });

  it("is a step darker than both row backgrounds, by the recorded amounts", () => {
    expect(contrast(tint, "#faf7f3")).toBeCloseTo(1.3, 1);
    expect(contrast(tint, "#f2f3ee")).toBeCloseTo(1.24, 1);
  });
});
