import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IconTile } from "@/components/IconTile/IconTile";
import { contrastRatio, GRAPHIC_CONTRAST } from "@/lib/contrast";

const css = readFileSync("app/globals.css", "utf8");
const token = (name: string) => {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css);
  if (!match) throw new Error(`No hex value for --${name}`);
  return match[1].toLowerCase();
};

describe("the icon tile tokens", () => {
  it("are registered with their values and as theme colours", () => {
    expect(token("icon-tile-bg")).toBe("#eaeddf");
    expect(token("icon-ink")).toBe("#5b6938");
    expect(css).toContain("--color-icon-tile-bg: var(--icon-tile-bg);");
    expect(css).toContain("--color-icon-ink: var(--icon-ink);");
  });

  it("keep the icon at least 3:1 on the tile, computed from the registered values", () => {
    const ratio = contrastRatio(token("icon-ink"), token("icon-tile-bg"));
    expect(ratio).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST);
    expect(ratio).toBeCloseTo(5, 0);
  });

  it("leave the olive tint as it was", () => {
    expect(token("olive-tint")).toBe("#e0e6d6");
  });
});

describe("the icon tile", () => {
  it("sets the colours and the centring, and takes its size and shape from the caller", () => {
    const html = renderToStaticMarkup(
      <IconTile className="h-9 w-9 rounded-full">
        <svg />
      </IconTile>,
    );
    expect(html).toContain("bg-icon-tile-bg text-icon-ink");
    expect(html).toContain("h-9 w-9 rounded-full");
    expect(html).toContain("items-center justify-center");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("the places that draw an icon in a tile", () => {
  const read = (file: string) => readFileSync(file, "utf8");

  it("use the shared tile and no longer the olive tint behind an icon", () => {
    for (const file of [
      "components/TopicTile/TopicTile.tsx",
      "components/TrainingCreate/TrainingCreate.tsx",
      "components/ExamView/ExamView.tsx",
      "components/OnboardingView/OnboardingView.tsx",
      "components/MaterialTile/MaterialTile.tsx",
    ]) {
      const code = read(file);
      expect(code, file).toContain("<IconTile");
      expect(code, file).not.toContain("bg-olive-tint");
    }
    // Training: the stats tiles use it; the olive tint stays only for the numbered section circle
    const training = read("components/TrainingView/TrainingView.tsx");
    expect(training).toContain("<IconTile");
    expect(training.match(/bg-olive-tint/g)).toHaveLength(1);
    expect(training).toMatch(/bg-olive-tint tabular-nums/);
  });

  it("keep the olive tint where it means something else", () => {
    expect(read("components/Button/Button.tsx")).toContain("bg-olive-tint");
    expect(read("components/Chip/Chip.tsx")).toContain("bg-olive-tint");
    expect(read("components/PageHeaderBand/PageHeaderBand.tsx")).toContain("bg-secondary-sand");
    expect(read("components/PageHeaderBand/PageHeaderBand.tsx")).not.toContain("icon-tile");
  });
});
