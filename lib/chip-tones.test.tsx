import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusChip } from "@/components/StatusChip/StatusChip";
import type { Status } from "@/components/StatusChip/StatusChip";
import { Tag } from "@/components/Tag/Tag";

const css = readFileSync("app/globals.css", "utf8");

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css);
  if (!match) throw new Error(`No hex value for --${name}`);
  return match[1].toLowerCase();
}

function rgb(hex: string) {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Hue in degrees, to prove a stroke is the same colour as its fill. */
function hue(hex: string) {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/** Every coloured hue: fill, stroke and the text or icon on it. */
const tones = [
  ["tag-yellow", "tag-yellow-stroke", "text"],
  ["tag-peach", "tag-peach-stroke", "text"],
  ["tag-blue", "tag-blue-stroke", "text"],
  ["tag-lilac", "tag-lilac-stroke", "text"],
  ["tag-sage", "tag-sage-stroke", "text"],
  ["correct-bg", "correct-stroke", "correct"],
  ["wrong-bg", "wrong-stroke", "wrong"],
  ["secure-bg", "secure-stroke", "secure"],
  ["guess-tile", "guess-stroke", "guess-ink"],
  ["caution-bg", "caution-stroke", "caution"],
  ["misconception-bg", "misconception-stroke", "misconception"],
] as const;

describe("chip tones", () => {
  it.each(tones)("%s: a darker stroke of the same hue and AA text", (fill, stroke, ink) => {
    expect(luminance(token(stroke))).toBeLessThan(luminance(token(fill)));
    expect(Math.abs(hue(token(stroke)) - hue(token(fill)))).toBeLessThan(6);
    expect(contrast(token(ink), token(fill))).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps every tag coloured with its own stroke, never neutral", () => {
    for (const tone of ["yellow", "peach", "blue", "lilac", "sage"] as const) {
      const html = renderToStaticMarkup(<Tag tone={tone}>Scenario</Tag>);
      expect(html).toContain(`border border-tag-${tone}-stroke bg-tag-${tone}`);
      expect(html).not.toMatch(/sand|surface-muted|neutral/);
    }
  });

  it("keeps every coloured status chip coloured with its own stroke", () => {
    const coloured: [Status, string][] = [
      ["correct", "correct"],
      ["failed", "wrong"],
      ["wrong", "wrong"],
      ["secure", "secure"],
      ["guess", "guess"],
      ["knowledge_gap", "caution"],
      ["misconception", "misconception"],
    ];
    for (const [status, hueName] of coloured) {
      const html = renderToStaticMarkup(<StatusChip status={status} />);
      expect(html, status).toContain(`border-${hueName}-stroke`);
      expect(html, status).not.toMatch(/sand|surface-muted|neutral/);
    }
  });

  it("keeps Guide chips' partner, Processing, on the sand", () => {
    const html = renderToStaticMarkup(<StatusChip status="processing" />);
    expect(html).toContain("border-secondary-sand-pressed bg-secondary-sand");
  });
});
