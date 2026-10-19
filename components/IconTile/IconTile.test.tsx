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

describe("the exam status tiles", () => {
  it("register the attention colours and reuse the correct-answer tokens for success", () => {
    expect(token("status-attention-bg")).toBe("#fbe7b5");
    expect(token("status-attention-ink")).toBe("#7a4e00");
    expect(css).toContain("--color-status-attention-bg: var(--status-attention-bg);");
    expect(css).toContain("--color-status-attention-ink: var(--status-attention-ink);");
    // success is the existing green, not a copy of its values
    expect(css).not.toMatch(/--status-success/);
    expect(token("correct-bg")).toBe("#e3f2e8");
    expect(token("correct-text")).toBe("#1f6b3f");
  });

  it("keep the icon at least 3:1 on each tile, computed from the registered tokens", () => {
    const attention = contrastRatio(token("status-attention-ink"), token("status-attention-bg"));
    const success = contrastRatio(token("correct-text"), token("correct-bg"));
    expect(attention).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST);
    expect(success).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST);
    expect(attention).toBeCloseTo(5.6, 0);
    expect(success).toBeCloseTo(5.6, 0);
  });

  it("draw the three tones", () => {
    const html = (tone: "default" | "attention" | "success") =>
      renderToStaticMarkup(
        <IconTile tone={tone} className="h-11 w-11 rounded-[12px]">
          <svg />
        </IconTile>,
      );
    expect(html("default")).toContain("bg-icon-tile-bg text-icon-ink");
    expect(html("attention")).toContain("bg-status-attention-bg text-status-attention-ink");
    expect(html("success")).toContain("bg-correct-bg text-correct-text");
  });
});
