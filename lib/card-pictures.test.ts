import { statSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { cardPictureFiles } from "@/lib/media-frames";

const budgets: Record<keyof typeof cardPictureFiles, { size: number; kb: number }> = {
  continueSession: { size: 256, kb: 20 },
  examCard: { size: 256, kb: 20 },
  resultPass: { size: 640, kb: 60 },
  resultRetry: { size: 640, kb: 60 },
};

describe("the Training card and Results pictures", () => {
  for (const [name, file] of Object.entries(cardPictureFiles)) {
    const { size, kb } = budgets[name as keyof typeof budgets];
    it(`${file} is ${size} by ${size} with alpha and at most ${kb} KB`, async () => {
      const path = `public${file}`;
      expect(statSync(path).size).toBeLessThanOrEqual(kb * 1024);
      const meta = await sharp(path).metadata();
      expect([meta.width, meta.height]).toEqual([size, size]);
      expect(meta.format).toBe("webp");
      expect(meta.hasAlpha).toBe(true);
      // the corners are transparent (no baked-in background)
      const { data, info } = await sharp(path)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (const [x, y] of [
        [0, 0],
        [info.width - 1, 0],
        [0, info.height - 1],
        [info.width - 1, info.height - 1],
      ]) {
        expect(data[(y * info.width + x) * 4 + 3]).toBe(0);
      }
    });
  }
});
