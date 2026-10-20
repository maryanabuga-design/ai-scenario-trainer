import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, TEXT_CONTRAST } from "@/lib/contrast";

const css = readFileSync("app/globals.css", "utf8");
const token = (name: string) =>
  new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css)?.[1].toLowerCase();

const scale = {
  50: "#f8f5ed",
  100: "#f0e8d8",
  200: "#e4d6bc",
  300: "#d7c4a0",
  400: "#cbb58e",
  500: "#c5b28a",
  600: "#ac956a",
  700: "#907851",
  800: "#705b3d",
  900: "#4d3f2d",
};

describe("the sand scale", () => {
  for (const [step, hex] of Object.entries(scale)) {
    it(`registers --sand-${step} as ${hex} and as a colour utility`, () => {
      expect(token(`sand-${step}`)).toBe(hex);
      expect(css).toContain(`--color-sand-${step}: var(--sand-${step});`);
    });
  }

  it("reads the active navigation item (sand-900 on sand-200) at 4.5:1 or more", () => {
    expect(contrastRatio(scale[900], scale[200])).toBeGreaterThanOrEqual(TEXT_CONTRAST);
  });

  it("explains why sand-700 is never text on white (below 4.5:1)", () => {
    expect(contrastRatio(scale[700], "#ffffff")).toBeLessThan(TEXT_CONTRAST);
  });
});
