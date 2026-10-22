import { readFileSync, statSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const FILES = [
  ["continue-session", 256],
  ["exam-card", 256],
  ["result-retry", 640],
  ["result-pass", 640],
] as const;

describe("the card and result illustrations", () => {
  for (const [name, side] of FILES) {
    const path = `public/heroes/${name}.webp`;

    it(`${name}.webp is a WebP under 40 KB with an alpha channel, ${side} by ${side}`, async () => {
      expect(statSync(path).size).toBeLessThan(40 * 1024);
      const head = readFileSync(path).subarray(0, 12).toString("latin1");
      expect(head.startsWith("RIFF") && head.endsWith("WEBP")).toBe(true);
      const meta = await sharp(path).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.hasAlpha).toBe(true);
      expect([meta.width, meta.height]).toEqual([side, side]);
    });

    it(`${name}.webp has transparent corners and no large dark areas`, async () => {
      const { data, info } = await sharp(path)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const at = (x: number, y: number) => (y * info.width + x) * 4;
      for (const [x, y] of [
        [1, 1],
        [info.width - 2, 1],
        [1, info.height - 2],
        [info.width - 2, info.height - 2],
      ]) {
        expect(data[at(x, y) + 3]).toBe(0);
      }
      // illustrations never use large areas darker than about #5F6E40 (a few shadow pixels are fine)
      let opaque = 0;
      let dark = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 200) continue;
        opaque += 1;
        if (data[i] < 0x5f - 12 && data[i + 1] < 0x6e - 12 && data[i + 2] < 0x40 - 12) dark += 1;
      }
      expect(opaque).toBeGreaterThan(0);
      expect(dark / opaque).toBeLessThan(0.05);
    });
  }
});
