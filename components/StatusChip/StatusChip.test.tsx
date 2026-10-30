import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  StatusChip,
  examTone,
  materialLabel,
  materialTone,
  studentTone,
} from "@/components/StatusChip/StatusChip";
import type { StatusTone } from "@/components/StatusChip/StatusChip";

const css = readFileSync("app/globals.css", "utf8");
const token = (name: string) => {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css);
  if (!match) throw new Error(`No hex value for --${name}`);
  return match[1];
};
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const chip = (tone: StatusTone, word = "Ready") =>
  renderToStaticMarkup(
    <StatusChip tone={tone} value="x">
      {word}
    </StatusChip>,
  );

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return path.endsWith(".tsx") && !path.includes(".test.") ? [path] : [];
  });

describe("the one status chip", () => {
  it("is a 24px pill with 10px side padding, 13px semi-bold text and no icon", () => {
    const html = chip("positive");
    expect(html).toContain("h-6");
    expect(html).toContain("px-2.5");
    expect(html).toContain("rounded-full");
    expect(html).toContain("type-chip");
    expect(html).toContain("whitespace-nowrap");
    expect(html).not.toContain("<svg");
    expect(html).toMatch(/>Ready<\/span>$/);
    expect(css).toMatch(/@utility type-chip \{[^}]*font-size: 13px;[^}]*font-weight: 600;/);
  });

  it("has three tones with their colours", () => {
    expect(chip("positive")).toContain("bg-status-success-bg text-status-success-ink");
    expect(chip("attention")).toContain("bg-status-attention-bg text-status-attention-ink");
    expect(chip("neutral")).toContain("bg-chip-neutral-bg text-chip-neutral-ink");
    expect(token("status-success-bg")).toBe("#e1eada");
    expect(token("status-success-ink")).toBe("#44683a");
    expect(token("status-attention-bg")).toBe("#f1e4c8");
    expect(token("status-attention-ink")).toBe("#6f5120");
    expect(token("chip-neutral-bg")).toBe("#efece6");
  });

  it("keeps the text of every tone at 4.5:1 or more on its fill (neutral ink darkened from #6B7062)", () => {
    expect(contrast("#6b7062", token("chip-neutral-bg"))).toBeLessThan(4.5);
    expect(token("chip-neutral-ink")).toBe("#646a5a");
    const pairs: [string, string][] = [
      [token("status-success-bg"), token("status-success-ink")],
      [token("status-attention-bg"), token("status-attention-ink")],
      [token("chip-neutral-bg"), token("chip-neutral-ink")],
    ];
    for (const [bg, ink] of pairs) expect(contrast(bg, ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("maps every student status to its tone", () => {
    expect(studentTone).toEqual({
      ready: "positive",
      needs: "attention",
      almost: "neutral",
      "not-started": "neutral",
    });
  });

  it("maps every exam status to its tone", () => {
    expect(examTone).toEqual({
      passed: "positive",
      "not-passed": "attention",
      missed: "attention",
      "in-progress": "neutral",
      "not-started": "neutral",
    });
  });

  it("maps every material status to its tone and word", () => {
    expect(materialTone).toEqual({ ready: "positive", failed: "attention", processing: "neutral" });
    expect(materialLabel).toEqual({ ready: "Ready", processing: "Processing", failed: "Failed" });
  });

  it("is the only status chip: no other chip, pill or avatar badge for a status exists in the code", () => {
    const sources = [...files("components"), ...files("app")];
    const bad = sources.filter((file) =>
      /StatusPill\b|StatusAvatar|StudentStatusChip|statusChipLook|statusLook|data-avatar-badge|data-status-dot|StatusIcon/.test(
        readFileSync(file, "utf8"),
      ),
    );
    expect(bad).toEqual([]);
    // every place that draws a status chip goes through the component
    const drawn = sources.filter((file) => readFileSync(file, "utf8").includes("data-status-chip"));
    expect(drawn).toEqual(["components/StatusChip/StatusChip.tsx"]);
  });
});
