import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusChip } from "@/components/StatusChip/StatusChip";

const chip = (status: "ready" | "processing" | "failed") =>
  renderToStaticMarkup(<StatusChip status={status} />);

describe("material status chips", () => {
  it("Ready: a chip with the light green fill, a darker green stroke and the check icon", () => {
    const cls = /class="([^"]*)"/.exec(chip("ready"))?.[1] ?? "";
    expect(cls).toContain("border border-correct-stroke bg-correct-bg text-correct");
    expect(cls).toContain("rounded-full");
    expect(chip("ready")).toContain("lucide-check");
    expect(chip("ready")).toContain(">Ready</span>");
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

  it("Ready, Processing and Failed are all chips with a fill and a stroke", () => {
    for (const status of ["ready", "processing", "failed"] as const) {
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
