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

  it("draws the picture at 160px with an empty alt text and no circle, icon or dashes", () => {
    const html = renderToStaticMarkup(<ContentEmpty />);
    expect(html).toMatch(/data-empty-picture[^>]*alt=""/);
    expect(html).toContain("h-40 w-40 object-contain");
    expect(html).not.toMatch(/data-empty-circle|data-empty-fallback|bg-sage-dash/);
    expect(html).toContain("You have no topics yet.");
  });

  it("keeps the earlier icon version as the fallback for a missing file", () => {
    const source = readFileSync("components/InstructorContent/ContentEmpty.tsx", "utf8");
    expect(source).toContain("data-empty-fallback");
    expect(source).toContain("h-36 w-36");
    expect(source).toContain("setFailed(true)");
  });
});
