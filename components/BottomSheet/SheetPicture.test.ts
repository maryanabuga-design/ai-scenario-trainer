import { readFileSync, statSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const FILES = ["feedback-correct", "feedback-wrong", "hint"].map(
  (name) => `public/images/student/${name}.webp`,
);

describe("the pictures of the quiz sheets", () => {
  for (const file of FILES) {
    it(`${file} is a 512 by 512 WEBP with a transparent background, under 80 KB`, async () => {
      const bytes = readFileSync(file);
      expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
      const meta = await sharp(bytes).metadata();
      expect([meta.format, meta.width, meta.height, meta.hasAlpha]).toEqual([
        "webp",
        512,
        512,
        true,
      ]);
      expect(statSync(file).size).toBeLessThan(80 * 1024);
      const { data } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(data[3]).toBe(0); // the top left corner is transparent
    });
  }
});
