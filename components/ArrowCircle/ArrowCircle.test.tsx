import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ARROW_CLEARANCE, ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";

const circle = (html: string) => /<span[^>]*class="([^"]*rounded-full[^"]*)"/.exec(html)?.[1] ?? "";

describe("ArrowCircle", () => {
  it("is a white circle with a warm stroke and a very soft shadow, a dark green arrow", () => {
    const html = renderToStaticMarkup(<ArrowCircle />);
    expect(circle(html)).toContain("bg-surface");
    expect(circle(html)).toContain("border border-arrow-stroke");
    expect(circle(html)).toContain("shadow-(--arrow-shadow)");
    expect(circle(html)).toContain("text-primary");
    expect(html).toContain('stroke-width="2"');
    expect(html).toMatch(/^<span aria-hidden="true"/);
    expect(circle(html)).not.toContain("hover:");
  });

  it("has two sizes: 40px with a 20px arrow, 32px with a 16px arrow", () => {
    const md = renderToStaticMarkup(<ArrowCircle />);
    expect(circle(md)).toContain("h-10 w-10");
    expect(md).toContain('width="20"');
    const sm = renderToStaticMarkup(<ArrowCircle size="sm" />);
    expect(circle(sm)).toContain("h-8 w-8");
    expect(sm).toContain('width="16"');
  });

  it("uses a pure white surface token", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toMatch(/--surface: #ffffff;/);
    expect(css).toMatch(/--arrow-stroke: #e4dfd5;/);
  });
});

describe("ArrowCircle position: the top-right corner", () => {
  it("places itself in the card's top-right corner with equal offsets", () => {
    expect(renderToStaticMarkup(<ArrowCircle />)).toMatch(
      /^<span aria-hidden="true" class="pointer-events-none absolute top-4 right-4/,
    );
    expect(renderToStaticMarkup(<ArrowCircle size="sm" />)).toMatch(
      /^<span aria-hidden="true" class="pointer-events-none absolute top-3 right-3/,
    );
  });

  it("keeps text clear of the circle: at least the circle width + 12px", () => {
    // 16px offset + 40px circle + 12px gap, minus the card's own 16px padding = 52px; we use 56px.
    expect(ARROW_CLEARANCE.md).toBe("pr-14");
    expect(ARROW_CLEARANCE.sm).toBe("pr-11");
  });

  it("is used only on cards that are positioned and give their text the clearance", () => {
    for (const file of [
      "components/NextUpCard/NextUpCard.tsx",
      "components/TopicCard/TopicCard.tsx",
      "components/ScenarioCard/ScenarioCard.tsx",
      "components/RepeatSummary/RepeatSummary.tsx",
      "components/UploadSheet/UploadSheet.tsx",
    ]) {
      const code = readFileSync(file, "utf8");
      expect(code, file).toContain("ARROW_CLEARANCE");
      expect(code, file).toMatch(/className=\{?[`"][^`"]*\brelative\b/);
    }
  });
});

describe("every card arrow goes through ArrowCircle", () => {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return files(path);
      return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
    });
  }

  it("is used by every card that opens something", () => {
    for (const file of [
      "components/NextUpCard/NextUpCard.tsx",
      "components/TopicCard/TopicCard.tsx",
      "components/ScenarioCard/ScenarioCard.tsx",
      "components/RepeatSummary/RepeatSummary.tsx",
      "components/UploadSheet/UploadSheet.tsx",
    ]) {
      expect(readFileSync(file, "utf8"), file).toContain("<ArrowCircle");
    }
  });

  it("leaves no bare arrow or chevron anywhere else", () => {
    // Allowed: the shared circle itself, the arrow inside the Generate button and the shared
    // plain Chevron, and the plain arrow of the Details text link.
    const allowed = [
      "ArrowCircle/ArrowCircle.tsx",
      "TrainingCreate/TrainingCreate.tsx",
      "Chevron/Chevron.tsx",
      "ErrorTypesCard/ErrorTypesCard.tsx",
    ];
    const own = [...files("components"), ...files("app")].filter((file) => {
      if (allowed.some((name) => file.endsWith(name))) return false;
      return /<(ArrowRight|ChevronRight)\b|iconEnd=\{ArrowRight\}/.test(readFileSync(file, "utf8"));
    });
    expect(own).toEqual([]);
  });
});
