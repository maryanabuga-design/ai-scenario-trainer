import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusChip } from "@/components/StatusChip/StatusChip";

const chip = (status: "ready" | "processing" | "failed") =>
  renderToStaticMarkup(<StatusChip status={status} />);

describe("material status chips", () => {
  it("Ready: plain inline status, a green check and the word, no background, border or padding box", () => {
    const html = chip("ready");
    const cls = /class="([^"]*)"/.exec(html)?.[1] ?? "";
    expect(cls).toContain("text-correct");
    expect(cls).not.toMatch(/\bbg-|\bborder\b|border-|px-|rounded/);
    expect(html).toContain("lucide-check");
    expect(html).toContain('width="16"');
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html).toContain(">Ready</span>");
  });

  it("Ready keeps the chip's row height, and its green passes AA on the card", () => {
    expect(/class="([^"]*)"/.exec(chip("ready"))?.[1]).toContain("py-[5px]");
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5]
        .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    expect((lum("#faf7f3") + 0.05) / (lum("#1f7a4d") + 0.05)).toBeGreaterThanOrEqual(4.5);
  });

  it("Processing: sand with a thin stroke, dark text, clock icon", () => {
    expect(chip("processing")).toContain(
      "border border-secondary-sand-pressed bg-secondary-sand text-text",
    );
    expect(chip("processing")).toContain("lucide-clock");
    expect(chip("processing")).toContain(">Processing</span>");
  });

  it("Failed: red tint, red text, alert icon", () => {
    expect(chip("failed")).toContain("bg-wrong-bg text-wrong");
    expect(chip("failed")).toContain("lucide-circle-alert");
    expect(chip("failed")).toContain(">Failed</span>");
  });

  it("Processing and Failed stay chips with a fill and a stroke", () => {
    for (const status of ["processing", "failed"] as const) {
      const cls = /class="([^"]*)"/.exec(chip(status))?.[1] ?? "";
      expect(cls).toMatch(/bg-/);
      expect(cls).toMatch(/border /);
      expect(cls).toContain("rounded-full");
    }
  });

  it("gives the three statuses three different looks", () => {
    const looks = (["ready", "processing", "failed"] as const).map(
      (status) => /class="([^"]*)"/.exec(chip(status))?.[1],
    );
    expect(new Set(looks).size).toBe(3);
  });
});
