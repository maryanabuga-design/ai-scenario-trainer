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

describe("coloured chips and icon backgrounds keep their tokens", () => {
  it("has the same tag, code circle and tile colours as before", () => {
    const names = [
      "tag-yellow",
      "tag-peach",
      "tag-blue",
      "tag-lilac",
      "tag-sage",
      "code-yellow",
      "code-blue",
      "code-lilac",
      "code-sage",
      "code-peach",
      "next-tile",
      "secure-bg",
      "caution-bg",
      "misconception-bg",
      "guess-tile",
    ];
    expect(Object.fromEntries(names.map((name) => [name, token(name)]))).toMatchInlineSnapshot(`
      {
        "caution-bg": "#f8efd9",
        "code-blue": "#e1eff4",
        "code-lilac": "#eee7f8",
        "code-peach": "#fce2d4",
        "code-sage": "#e9ede4",
        "code-yellow": "#f9f4c1",
        "guess-tile": "#e8e2db",
        "misconception-bg": "#f5dce0",
        "next-tile": "#d4dbcd",
        "secure-bg": "#e2e7dd",
        "tag-blue": "#d4e8f0",
        "tag-lilac": "#e6ddf5",
        "tag-peach": "#fad6c2",
        "tag-sage": "#dfe5d8",
        "tag-yellow": "#f6efa6",
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
    const leftovers = [...files("components"), ...files("app")].filter((file) =>
      /#efece5|#c0bbb1|neutral-surface|--chip\b|bg-chip\b|chip-pressed|ring-track/i.test(
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

  it("uses the olive, never the neutral panel colour, for inactive dots, tracks and disabled fills", () => {
    const inactive = [
      "components/SessionTopBar/SessionTopBar.tsx",
      "components/TopicRow/TopicRow.tsx",
      "components/OnboardingView/OnboardingView.tsx",
      "components/SegmentedControl/SegmentedControl.tsx",
      "components/GuideChip/GuideChip.tsx",
      "components/Button/Button.tsx",
      "components/ProgressCard/ProgressCard.tsx",
      "components/ArrowCircle/ArrowCircle.tsx",
    ];
    for (const file of inactive) {
      const code = readFileSync(file, "utf8");
      expect(code, file).toMatch(/secondary-olive/);
      expect(code, file).not.toMatch(/surface-muted|bg-border\b/);
    }
  });
});
