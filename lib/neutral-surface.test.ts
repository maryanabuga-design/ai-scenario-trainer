import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

/** A token's hex value from the :root block. */
function token(name: string): string {
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

describe("neutral surface token", () => {
  it("is #E2DED5, between the old switch track and the old Guide chips", () => {
    expect(token("neutral-surface")).toBe("#e2ded5");
    expect(token("neutral-surface-pressed")).toBe("#d3cdc2");
    expect(luminance(token("neutral-surface"))).toBeLessThan(luminance("#efece5"));
    expect(luminance(token("neutral-surface"))).toBeGreaterThan(luminance("#d3cdc2"));
  });

  it("keeps dark and grey text at AA or better", () => {
    const fill = token("neutral-surface");
    expect(contrast(token("text"), fill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("text-secondary"), fill)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("text"), token("neutral-surface-pressed"))).toBeGreaterThanOrEqual(4.5);
  });

  it("is darker than the page, the cards and the white sheet", () => {
    const fill = luminance(token("neutral-surface"));
    for (const around of ["bg", "card", "surface"]) {
      expect(fill).toBeLessThan(luminance(token(around)));
    }
  });
});

describe("no leftover neutral values", () => {
  /** Every component, screen and style file. */
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return files(path);
      return /\.(tsx|css)$/.test(path) && !path.endsWith(".test.tsx") ? [path] : [];
    });
  }

  it("has no old grey-beige values or tokens left", () => {
    const sources = [...files("components"), ...files("app")];
    const leftovers = sources.filter((file) =>
      /#efece5|#c0bbb1|--surface-muted|surface-muted\b|--chip\b|bg-chip\b|chip-pressed/i.test(
        readFileSync(file, "utf8"),
      ),
    );
    expect(leftovers).toEqual([]);
  });

  it("lets no component set its own colour value", () => {
    const own = files("components").filter((file) =>
      /(bg|text|border|fill|stroke)-\[#|#[0-9a-f]{6}\b/i.test(readFileSync(file, "utf8")),
    );
    expect(own).toEqual([]);
  });
});
