import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";

/** The chip's own markup (the provider also draws the source sheet). */
function chip(sectionId: string, showTitle = false) {
  const html = renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <SourceChip sectionId={sectionId} showTitle={showTitle} />
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
      expect(html).toContain("bg-chip");
      expect(html).toContain("text-text");
      expect(html).toContain("lucide-file-text");
      expect(html).toContain("active:bg-border");
      expect(html).not.toContain("hover:");
      expect(html).not.toMatch(/bg-(tag|surface|card)|border-/);
    }
  });

  it("keep a 44px tap area around the 36px chip", () => {
    const html = chip("S1");
    expect(html).toContain("min-h-9");
    expect(html).toContain("before:-inset-y-1");
  });

  it("are the only way a guide section is shown as a chip", () => {
    const offenders = [...sourceFiles("components"), ...sourceFiles("app")].filter((file) => {
      if (file.includes("SourceChip") || file.includes("SourceSheet")) return false;
      return /Guide[ ·]+\$?\{/.test(readFileSync(file, "utf8"));
    });
    expect(offenders).toEqual([]);
  });
});
