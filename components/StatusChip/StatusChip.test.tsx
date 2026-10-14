import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusChip } from "@/components/StatusChip/StatusChip";

const chip = (status: "ready" | "processing" | "failed") =>
  renderToStaticMarkup(<StatusChip status={status} />);

describe("material status chips", () => {
  it("Ready: a green chip with the check icon, no stroke", () => {
    const cls = /class="([^"]*)"/.exec(chip("ready"))?.[1] ?? "";
    expect(cls).toContain("bg-chip-green");
    expect(cls).toContain("text-chip-ink-green");
    expect(cls).toContain("rounded-full");
    expect(chip("ready")).toContain("lucide-check");
    expect(chip("ready")).toContain(">Ready</span>");
  });

  it("Processing: a sand chip with dark text and the clock icon", () => {
    expect(chip("processing")).toContain("bg-chip-sand");
    expect(chip("processing")).toContain("text-text");
    expect(chip("processing")).toContain("lucide-clock");
    expect(chip("processing")).toContain(">Processing</span>");
  });

  it("Failed: a rose chip with red text and the alert icon", () => {
    expect(chip("failed")).toContain("bg-chip-rose");
    expect(chip("failed")).toContain("text-wrong");
    expect(chip("failed")).toContain("lucide-circle-alert");
    expect(chip("failed")).toContain(">Failed</span>");
  });

  it("Ready, Processing and Failed are all chips with a fill and no stroke", () => {
    for (const status of ["ready", "processing", "failed"] as const) {
      const cls = /class="([^"]*)"/.exec(chip(status))?.[1] ?? "";
      expect(cls).toMatch(/bg-chip-/);
      expect(cls).not.toMatch(/(^| )border/);
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
