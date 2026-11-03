import { readFileSync, statSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ContentEmpty, CONTENT_EMPTY_IMAGE } from "@/components/InstructorContent/ContentEmpty";

describe("the Content empty state picture", () => {
  it("is an 800 by 800 WEBP with a transparent background, under 100 KB", async () => {
    const file = `public${CONTENT_EMPTY_IMAGE}`;
    const bytes = readFileSync(file);
    expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
    expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
    const meta = await sharp(bytes).metadata();
    expect([meta.format, meta.width, meta.height, meta.hasAlpha]).toEqual(["webp", 800, 800, true]);
    expect(statSync(file).size).toBeLessThan(100 * 1024);
    const { data } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(data[3]).toBe(0);
  });

  it("draws the picture at 140px with an empty alt text and no circle, icon or dashes", () => {
    const html = renderToStaticMarkup(<ContentEmpty />);
    expect(html).toMatch(/data-empty-picture[^>]*alt=""/);
    expect(html).toContain("h-[140px] w-[140px] object-contain");
    expect(html).not.toMatch(/data-empty-circle|data-empty-fallback|bg-sage-dash/);
    expect(html).toContain("You have no topics yet.");
  });

  it("keeps the earlier icon version as the fallback for a missing file", () => {
    const source = readFileSync("components/InstructorContent/ContentEmpty.tsx", "utf8");
    expect(source).toContain("data-empty-fallback");
    expect(source).toContain("h-[140px] w-[140px]");
    expect(source).toContain("setFailed(true)");
  });
});

describe("the cropped 3D pictures", () => {
  const cropped = [
    "entry/entry-group",
    "entry/entry-invite",
    "entry/entry-profile",
    "entry/entry-signin",
    "instructor/content-empty",
    "instructor/import-success",
    "instructor/students-no-results",
  ];

  for (const name of cropped) {
    it(`${name}.webp has about 4% transparent margin on its longer side (3 to 6%)`, async () => {
      const { data, info } = await sharp(`public/images/${name}.webp`)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let x0 = info.width;
      let x1 = -1;
      let y0 = info.height;
      let y1 = -1;
      for (let y = 0; y < info.height; y++)
        for (let x = 0; x < info.width; x++)
          if (data[(y * info.width + x) * 4 + 3] > 8) {
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);
          }
      expect(info.width).toBe(info.height);
      const side = info.width;
      const wide = x1 - x0 >= y1 - y0;
      const margins = wide
        ? [x0 / side, (side - 1 - x1) / side]
        : [y0 / side, (side - 1 - y1) / side];
      for (const margin of margins) {
        expect(margin).toBeGreaterThanOrEqual(0.03);
        expect(margin).toBeLessThanOrEqual(0.06);
      }
    });
  }
});
