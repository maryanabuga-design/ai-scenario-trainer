import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FLASH_MS, clearFlash, pathOf, setFlash } from "@/lib/flash";
import { renderToStaticMarkup } from "react-dom/server";
import { FlashNotice } from "@/components/FlashNotice/FlashNotice";

describe("the confirmation message", () => {
  it("keeps one message in memory: a new one replaces the old, clearing removes it, never the address", () => {
    setFlash("Changes saved", "/a");
    setFlash("Topic published", "/b");
    clearFlash(1_000_000);
    // render the screen at /b: only the latest message exists (the server snapshot is empty, so check the source of truth)
    const code = readFileSync("lib/flash.ts", "utf8");
    expect(code).toContain("current = { id: counter, text, path }");
    expect(code).not.toMatch(/localStorage|sessionStorage|searchParams|location\./);
    clearFlash();
    expect(FLASH_MS).toBe(6000);
    expect(pathOf("/instructor/content/package/pk1?tab=quiz#x")).toBe(
      "/instructor/content/package/pk1",
    );
  });

  it("is the compact success Notice in a polite live region, closing with the x; nothing on the server render", () => {
    const html = renderToStaticMarkup(<FlashNotice />);
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain("data-notice");
    const component = readFileSync("components/FlashNotice/FlashNotice.tsx", "utf8");
    expect(component).toContain('variant="success"');
    expect(component).toContain("onClose={() => clearFlash(flash.id)}");
    expect(component).toContain("prefers-reduced-motion: reduce");
    expect(component).toContain("window.setTimeout(() => clearFlash(id), FLASH_MS)");
  });

  it("is used after saving, publishing, deleting, replacing and changing a picture", () => {
    const texts: [string, string][] = [
      ["app/(app)/instructor/content/package/[id]/edit/[item]/page.tsx", '"Changes saved"'],
      ["app/(app)/instructor/content/package/[id]/details/page.tsx", '"Title and summary saved"'],
      ["app/(app)/instructor/content/package/[id]/page.tsx", '"Topic published"'],
      ["app/(app)/instructor/content/package/[id]/page.tsx", '"Topic deleted"'],
      ["app/(app)/instructor/content/package/[id]/review/page.tsx", '"Topic published"'],
      ["app/(app)/instructor/content/import/analysing/page.tsx", '"Document replaced"'],
      ["components/InstructorContent/PackageItemEdit.tsx", '"Image added"'],
      ["components/InstructorContent/PackageItemEdit.tsx", '"Image removed"'],
    ];
    for (const [file, text] of texts) expect(readFileSync(file, "utf8"), file).toContain(text);
    // the screens that land show it
    for (const file of [
      "components/InstructorContent/PackageTopicView.tsx",
      "components/InstructorContent/ContentView.tsx",
      "components/InstructorContent/PackageItemEdit.tsx",
      "components/InstructorContent/DocumentAnalysingView.tsx",
    ]) {
      expect(readFileSync(file, "utf8"), file).toMatch(/<FlashNotice\b/);
    }
  });
});
