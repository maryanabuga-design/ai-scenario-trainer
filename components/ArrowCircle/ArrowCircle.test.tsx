import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";

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
      "components/MaterialsList/MaterialsList.tsx",
      "components/MaterialView/MaterialView.tsx",
      "components/UploadSheet/UploadSheet.tsx",
      "components/ErrorTypesCard/ErrorTypesCard.tsx",
    ]) {
      expect(readFileSync(file, "utf8"), file).toContain("<ArrowCircle");
    }
  });

  it("leaves no bare arrow or chevron anywhere else", () => {
    // Allowed: the shared circle itself and the arrow inside the Generate button.
    const allowed = ["ArrowCircle/ArrowCircle.tsx", "TrainingCreate/TrainingCreate.tsx"];
    const own = [...files("components"), ...files("app")].filter((file) => {
      if (allowed.some((name) => file.endsWith(name))) return false;
      return /<(ArrowRight|ChevronRight)\b|iconEnd=\{ArrowRight\}/.test(readFileSync(file, "utf8"));
    });
    expect(own).toEqual([]);
  });
});
