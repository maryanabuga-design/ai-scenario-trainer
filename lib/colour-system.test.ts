import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

/** A token's hex value from the :root block. */
export function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css);
  if (!match) throw new Error(`No hex value for --${name}`);
  return match[1].toLowerCase();
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("colour system: primary deep green, secondary light olive", () => {
  it("has the light olive and its darker pressed tone of the same hue", () => {
    expect(token("secondary-olive")).toBe("#dfe5d8");
    expect(token("secondary-olive-pressed")).toBe("#d4dbcd");
    expect(luminance(token("secondary-olive-pressed"))).toBeLessThan(
      luminance(token("secondary-olive")),
    );
  });

  it("keeps dark and muted text readable on the olive and on its pressed tone", () => {
    for (const fill of [token("secondary-olive"), token("secondary-olive-pressed")]) {
      expect(contrast(token("text"), fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token("text-secondary"), fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token("primary"), fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("presses the primary to a darker green that still carries white text", () => {
    expect(css).toContain(
      "--primary-pressed: color-mix(in srgb, var(--primary) 70%, var(--text));",
    );
    expect(contrast("#ffffff", "#34392f")).toBeGreaterThanOrEqual(4.5);
  });
});
