import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SoftShape } from "@/components/SoftShape/SoftShape";

describe("SoftShape", () => {
  it("is decorative: hidden from screen readers and never catches a tap", () => {
    for (const variant of ["strong", "faint"] as const) {
      const html = renderToStaticMarkup(<SoftShape variant={variant} />);
      expect(html).toMatch(/^<svg aria-hidden="true"/);
      expect(html).toContain("pointer-events-none");
    }
  });

  it("is fainter in New scenario than in Next up", () => {
    const opacities = (variant: "strong" | "faint") =>
      [
        ...renderToStaticMarkup(<SoftShape variant={variant} />).matchAll(
          /fill-opacity="([\d.]+)"/g,
        ),
      ]
        .map((match) => Number(match[1]))
        .reduce((sum, value) => sum + value, 0);
    expect(opacities("faint")).toBeLessThan(opacities("strong"));
  });
});
