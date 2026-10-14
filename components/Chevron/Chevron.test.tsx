import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Chevron } from "@/components/Chevron/Chevron";

describe("Chevron", () => {
  const html = renderToStaticMarkup(<Chevron />);

  it("is a plain dark green chevron, 20px with a 2px line, in a 44px area, no circle", () => {
    expect(html).toMatch(/^<span aria-hidden="true" class="[^"]*h-11 w-11[^"]*text-primary/);
    expect(html).toContain("lucide-chevron-right");
    expect(html).toContain('width="20"');
    expect(html).toContain('stroke-width="2"');
    expect(html).not.toMatch(/bg-|border|shadow|rounded-full/);
  });

  it("is used on the material page's section rows and the Materials cards", () => {
    for (const file of [
      "components/MaterialView/MaterialView.tsx",
      "components/MaterialsList/MaterialsList.tsx",
    ]) {
      const code = readFileSync(file, "utf8");
      expect(code, file).toContain("<Chevron");
      expect(code, file).not.toContain("<ArrowCircle");
    }
  });
});
