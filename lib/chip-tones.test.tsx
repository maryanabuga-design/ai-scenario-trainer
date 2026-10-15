import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Chip } from "@/components/Chip/Chip";
import type { ChipTone } from "@/components/Chip/Chip";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { StatusChip, statuses } from "@/components/StatusChip/StatusChip";
import type { Status } from "@/components/StatusChip/StatusChip";
import { Tag } from "@/components/Tag/Tag";
import { loadAllSections } from "@/lib/guide";

const css = readFileSync("app/globals.css", "utf8");

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css);
  if (!match) throw new Error(`No hex value for --${name}`);
  return match[1].toLowerCase();
}

function linear(c: number) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function xyz(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => linear(parseInt(hex.slice(i, i + 2), 16) / 255));
  return [
    0.4124 * r + 0.3576 * g + 0.1805 * b,
    0.2126 * r + 0.7152 * g + 0.0722 * b,
    0.0193 * r + 0.1192 * g + 0.9505 * b,
  ];
}

/** CIE76 colour difference between two hex colours. */
function deltaE(a: string, b: string) {
  const lab = (hex: string) => {
    const [x, y, z] = xyz(hex);
    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const [fx, fy, fz] = [f(x / 0.95047), f(y), f(z / 1.08883)];
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  };
  const [p, q] = [lab(a), lab(b)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

function contrast(a: string, b: string) {
  const [light, dark] = [xyz(a)[1], xyz(b)[1]].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** The backgrounds a chip sits on: the three in the brief and the app's own three. */
const backgrounds = ["#f2eeea", "#faf7f4", "#f2f3ef", "#f3eee9", "#faf7f3", "#f2f3ee"];

const pastel = ["yellow", "peach", "blue", "lilac", "green", "rose", "sand"] as const;

/** Each tone's text or icon colour(s), as defined in DESIGN.md. */
const inks: Record<(typeof pastel)[number], string[]> = {
  yellow: ["text", "caution"],
  peach: ["text"],
  blue: ["text"],
  lilac: ["text"],
  green: ["chip-ink-green"],
  rose: ["wrong"],
  sand: ["text", "text-secondary"],
};

describe("chip tones", () => {
  it("has the one shared palette", () => {
    expect(Object.fromEntries(pastel.map((tone) => [tone, token(`pastel-${tone}`)]))).toEqual({
      yellow: "#f8f2cc",
      peach: "#f7e1d8",
      blue: "#dfecf0",
      lilac: "#ede7f5",
      green: "#ddebe3",
      rose: "#f8e4e2",
      sand: "#e5dfd4",
    });
  });

  it.each(pastel)("%s: ΔE of at least 6 from the page, a card and a selected card", (tone) => {
    for (const background of backgrounds) {
      expect(
        deltaE(token(`pastel-${tone}`), background),
        `${tone} on ${background}`,
      ).toBeGreaterThanOrEqual(6);
    }
  });

  it.each(pastel)("%s: its text and icon colours are at least 4.5:1", (tone) => {
    for (const ink of inks[tone]) {
      expect(
        contrast(token(ink), token(`pastel-${tone}`)),
        `${ink} on ${tone}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the tones about equally soft in lightness (L* within 7 points)", () => {
    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const lightness = pastel.map((tone) => 116 * f(xyz(token(`pastel-${tone}`))[1]) - 16);
    expect(Math.max(...lightness) - Math.min(...lightness)).toBeLessThan(7);
  });

  it("has no older pastel or saturated tokens left", () => {
    expect(css).not.toMatch(
      /--(chip-(yellow|peach|blue|lilac|green|rose|sand)|tag-[a-z]+|next-tile|nav-active|secure-bg|caution-bg|misconception-bg|guess-tile):/,
    );
    expect(css).not.toMatch(/#f5efaf|#f6efa6|#fad6c2|#d4e8f0|#e6ddf5|#d4dbcd|#f9edc8/i);
  });

  it("has no chip stroke tokens left", () => {
    expect(css).not.toMatch(
      /--(tag-[a-z]+|correct|wrong|secure|guess|caution|misconception)-stroke/,
    );
  });
});

const sections = loadAllSections();
const withSheet = (node: React.ReactNode) =>
  renderToStaticMarkup(<SourceSheetProvider sections={sections}>{node}</SourceSheetProvider>);

/** The chip's own class attribute. */
const chipClass = (html: string) => /class="([^"]*)"/.exec(html)?.[1] ?? "";

describe("no chip has a stroke", () => {
  const everyChip: [string, string][] = [
    ...(["yellow", "peach", "blue", "lilac", "green", "rose", "sand", "primary"] as ChipTone[]).map(
      (tone): [string, string] => [
        `Chip ${tone}`,
        renderToStaticMarkup(<Chip tone={tone}>x</Chip>),
      ],
    ),
    ...(["yellow", "peach", "blue", "lilac", "green"] as const).map((tone): [string, string] => [
      `Tag ${tone}`,
      renderToStaticMarkup(<Tag tone={tone}>x</Tag>),
    ]),
    ...(Object.keys(statuses) as Status[]).map((status): [string, string] => [
      `StatusChip ${status}`,
      renderToStaticMarkup(<StatusChip status={status} />),
    ]),
    ["GuideChip", withSheet(<GuideChip sectionId="S1" />).split("</button>")[0]],
  ];

  it.each(everyChip)("%s", (_name, html) => {
    expect(chipClass(html)).not.toMatch(/(^| )border/);
    expect(html).not.toMatch(/-stroke/);
  });

  it("has no hover state on a chip", () => {
    for (const [, html] of everyChip) expect(chipClass(html)).not.toContain("hover:");
  });
});

describe("every chip goes through the shared Chip", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return files(path);
      return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
    });

  it("the Tag, the status chip and the Guide chip render a Chip", () => {
    for (const file of [
      "components/Tag/Tag.tsx",
      "components/StatusChip/StatusChip.tsx",
      "components/GuideChip/GuideChip.tsx",
    ]) {
      expect(readFileSync(file, "utf8"), file).toContain("<Chip");
    }
  });

  it("uses only palette fills on chips, tiles and pills (no other bg-pastel name)", () => {
    const names = new Set(
      [...files("components"), ...files("app")].flatMap(
        (file) => readFileSync(file, "utf8").match(/bg-pastel-[a-z]+/g) ?? [],
      ),
    );
    for (const name of names) expect(pastel.map((tone) => `bg-pastel-${tone}`)).toContain(name);
  });
});

describe("the chip colours of the statuses", () => {
  const tone = (status: Status) => chipClass(renderToStaticMarkup(<StatusChip status={status} />));

  it("keeps the meaning of each hue", () => {
    expect(tone("ready")).toContain("bg-pastel-green");
    expect(tone("failed")).toContain("bg-pastel-rose");
    expect(tone("processing")).toContain("bg-pastel-sand");
  });

  it("Ready has the check, Failed the alert, Processing the clock", () => {
    expect(renderToStaticMarkup(<StatusChip status="ready" />)).toContain("lucide-check");
    expect(renderToStaticMarkup(<StatusChip status="failed" />)).toContain("lucide-circle-alert");
    expect(renderToStaticMarkup(<StatusChip status="processing" />)).toContain("lucide-clock");
  });
});
