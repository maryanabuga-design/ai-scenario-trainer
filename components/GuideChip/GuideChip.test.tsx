import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";

/** The chip's own markup (the provider also draws the source sheet). */
function chip(sectionId: string, showTitle = false) {
  const html = renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <GuideChip sectionId={sectionId} showTitle={showTitle} />
    </SourceSheetProvider>,
  );
  const start = html.indexOf("<button");
  return html.slice(start, html.indexOf("</button>", start));
}

/** Every component and screen source file. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
  });
}

describe("Guide chips", () => {
  it("use one token: the grey-beige fill, dark text, a document icon, no hover", () => {
    for (const html of [chip("S1"), chip("S2", true), chip("F3")]) {
      expect(html).toContain("bg-chip-sand");
      expect(html).toContain("text-text");
      expect(html).toContain("lucide-file-text");
      expect(html).toContain("active:brightness-95");
      expect(html).not.toContain("hover:");
      expect(html).not.toMatch(/border|-stroke/);
      expect(html).not.toMatch(/bg-(tag|surface|card)|text-text-secondary">·/);
    }
  });

  it("keep a 44px tap area around the 36px chip", () => {
    const html = chip("S1");
    expect(html).toContain("min-h-9");
    expect(html).toContain("before:-inset-y-1");
  });

  it("are all rendered by the shared GuideChip, and no screen styles its own chip", () => {
    const files = [...sourceFiles("components"), ...sourceFiles("app")].filter(
      (file) => !file.includes("GuideChip"),
    );
    const own = files.filter((file) => {
      const code = readFileSync(file, "utf8");
      return (
        /Guide[ ·]+\$?\{/.test(code.replace(/Guide · \{section\.id\}/, "")) ||
        /rounded-full[^"`]*bg-chip|bg-chip[^"`]*rounded-full/.test(code) ||
        code.includes("SourceChip")
      );
    });
    expect(own).toEqual([]);
  });
});
