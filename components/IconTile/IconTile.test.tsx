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
  it("are the one neutral pair; the old olive icon tile tokens are gone", () => {
    expect(token("neutral-tile-bg")).toBe("#e2ded6");
    expect(token("neutral-tile-ink")).toBe("#5c5a56");
    expect(css).not.toContain("--icon-tile-bg");
    expect(css).not.toContain("--icon-ink");
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
    expect(html).toContain("bg-neutral-tile-bg text-neutral-tile-ink");
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
  it("register the attention and success colours as their own muted tokens", () => {
    expect(token("status-attention-bg")).toBe("#f1e4c8");
    expect(token("status-attention-ink")).toBe("#6f5120");
    expect(token("status-success-bg")).toBe("#e1eada");
    expect(token("status-success-ink")).toBe("#44683a");
    expect(css).toContain("--color-status-attention-bg: var(--status-attention-bg);");
    expect(css).toContain("--color-status-attention-ink: var(--status-attention-ink);");
    expect(css).toContain("--color-status-success-bg: var(--status-success-bg);");
    expect(css).toContain("--color-status-success-ink: var(--status-success-ink);");
    // the bright answer green stays as it was and is not reused for status tiles
    expect(token("correct-bg")).toBe("#e3f2e8");
    expect(token("correct-text")).toBe("#1f6b3f");
    expect(token("correct")).toBe("#2e7d4f");
    const status = [token("status-success-bg"), token("status-success-ink")];
    expect(status).not.toContain(token("correct-bg"));
    expect(status).not.toContain(token("correct-text"));
  });

  it("keep the icon at least 3:1 on each tile, computed from the registered tokens", () => {
    const attention = contrastRatio(token("status-attention-ink"), token("status-attention-bg"));
    const success = contrastRatio(token("status-success-ink"), token("status-success-bg"));
    expect(attention).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST);
    expect(success).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST);
    expect(attention).toBeCloseTo(5.8, 0);
    expect(success).toBeCloseTo(5.2, 0);
  });

  it("draw the three tones", () => {
    const html = (tone: "neutral" | "attention" | "success") =>
      renderToStaticMarkup(
        <IconTile tone={tone} className="h-11 w-11 rounded-[12px]">
          <svg />
        </IconTile>,
      );
    expect(html("neutral")).toContain("bg-neutral-tile-bg text-neutral-tile-ink");
    expect(html("attention")).toContain("bg-status-attention-bg text-status-attention-ink");
    expect(html("success")).toContain("bg-status-success-bg text-status-success-ink");
    expect(html("success")).not.toContain("correct");
  });
});

describe("the neutral warm grey pair", () => {
  it("is registered once, for every icon tile and the bookmark", () => {
    expect(token("neutral-tile-bg")).toBe("#e2ded6");
    expect(token("neutral-tile-ink")).toBe("#5c5a56");
    expect(css).toContain("--color-neutral-tile-bg: var(--neutral-tile-bg);");
    expect(css).toContain("--color-neutral-tile-ink: var(--neutral-tile-ink);");
    expect(readFileSync("components/BookmarkButton/BookmarkButton.tsx", "utf8")).toContain(
      "bg-neutral-tile-bg text-neutral-tile-ink",
    );
    expect(
      renderToStaticMarkup(
        <IconTile tone="neutral" className="h-9 w-9 rounded-full">
          <svg />
        </IconTile>,
      ),
    ).toContain("bg-neutral-tile-bg text-neutral-tile-ink");
  });

  it("keeps the icon at least 3:1 on the tile, computed from the registered tokens (about 4.9:1)", () => {
    const ratio = contrastRatio(token("neutral-tile-ink"), token("neutral-tile-bg"));
    expect(ratio).toBeGreaterThanOrEqual(GRAPHIC_CONTRAST);
    expect(ratio).toBeCloseTo(4.9, 0);
  });
});
