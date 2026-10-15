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

describe("colour system: primary deep green, secondary sand", () => {
  it("has the sand and its darker pressed tone of the same warm hue", () => {
    expect(token("secondary-sand")).toBe("#f0ece6");
    expect(token("secondary-sand-pressed")).toBe("#e2ded5");
    expect(luminance(token("secondary-sand-pressed"))).toBeLessThan(
      luminance(token("secondary-sand")),
    );
  });

  it("keeps dark and muted text readable on the sand and on its pressed tone", () => {
    for (const fill of [token("secondary-sand"), token("secondary-sand-pressed")]) {
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

describe("coloured chips and icon backgrounds keep their tokens", () => {
  it("has the same tag, code circle and tile colours as before", () => {
    const names = ["olive-tint", "next-card", "stroke-sage", "secondary-pressed"];
    expect(Object.fromEntries(names.map((name) => [name, token(name)]))).toMatchInlineSnapshot(`
      {
        "next-card": "#f2f3ee",
        "olive-tint": "#e0e6d6",
        "secondary-pressed": "#e3e8dc",
        "stroke-sage": "#a9b5a0",
      }
    `);
  });
});

describe("no leftover grey-beige for inactive states", () => {
  /** Every component, screen and style file. */
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return files(path);
      return /\.(tsx|css)$/.test(path) && !path.endsWith(".test.tsx") ? [path] : [];
    });
  }

  it("has no old neutral tokens or values left", () => {
    const leftovers = [...files("components"), ...files("app")].filter((file) => {
      // The sage #DFE5D8 may only stay as the TRAINING tag and sage topic tile colour.
      const code = readFileSync(file, "utf8");
      return /#efece5|#c0bbb1|#dfe5d8|#d4dbcd|secondary-olive|neutral-surface|--chip(?![-\w])|bg-chip(?![-\w])|chip-pressed|ring-track/i.test(
        code,
      );
    });
    expect(leftovers).toEqual([]);
  });

  it("lets no component set its own colour value", () => {
    const own = files("components").filter((file) =>
      /(bg|text|border|fill|stroke)-\[#|#[0-9a-f]{6}\b/i.test(readFileSync(file, "utf8")),
    );
    expect(own).toEqual([]);
  });

  it("uses the olive, never the neutral panel colour, for inactive dots, tracks and disabled fills", () => {
    const inactive = [
      "components/StepStrip/StepStrip.tsx",
      "components/OnboardingView/OnboardingView.tsx",
      "components/SegmentedControl/SegmentedControl.tsx",
      "components/Button/Button.tsx",
      "components/ResultsView/ResultsView.tsx",
    ];
    for (const file of inactive) {
      const code = readFileSync(file, "utf8");
      expect(code, file).toMatch(/secondary-sand/);
      expect(code, file).not.toMatch(/surface-muted|bg-border\b/);
    }
  });
});

describe("the secondary button fill", () => {
  /** CIE76 colour difference between two hex colours. */
  function lab(hex: string): [number, number, number] {
    const [r, g, b] = [1, 3, 5].map((start) => {
      const c = parseInt(hex.slice(start, start + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
    const f = (v: number) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
  }
  const deltaE = (a: string, b: string) =>
    Math.hypot(...lab(a).map((value, index) => value - lab(b)[index]));

  it("is #E0E6D6, with the pressed #D6DDCB", () => {
    expect(token("olive-tint")).toBe("#e0e6d6");
    expect(token("olive-tint-pressed")).toBe("#d6ddcb");
  });

  it("stands out from the page, the card and the selected card by a ΔE of at least 6", () => {
    for (const background of ["#f2eeea", "#faf7f4", "#f2f3ef"]) {
      expect(deltaE("#e0e6d6", background)).toBeGreaterThanOrEqual(6);
    }
  });

  it("has a label with a contrast of at least 4.5:1", () => {
    expect(contrast(token("primary"), "#e0e6d6")).toBeGreaterThanOrEqual(4.5);
  });
});
