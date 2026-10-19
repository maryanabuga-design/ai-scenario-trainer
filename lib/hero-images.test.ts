import { readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { homeImages } from "@/lib/home";

/** The pictures in public/heroes: compressed webp files with an alpha channel (transparent background). */
const DIR = "public/heroes";
const files = readdirSync(DIR).filter((name) => name.endsWith(".webp"));

describe("the 3D pictures", () => {
  it("includes the two Home pictures", () => {
    expect(files).toEqual(expect.arrayContaining(["hero-training.webp", "icon-miniquiz.webp"]));
    expect(homeImages).toEqual({
      heroTraining: "/heroes/hero-training.webp",
      iconMiniQuiz: "/heroes/icon-miniquiz.webp",
    });
  });

  for (const name of files) {
    it(`${name} is at most 50 KB`, () => {
      expect(statSync(`${DIR}/${name}`).size).toBeLessThanOrEqual(50 * 1024);
    });

    it(`${name} is a webp with an alpha channel`, () => {
      const bytes = readFileSync(`${DIR}/${name}`);
      expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
      // the extended format (VP8X) has a flags byte after the chunk size: bit 4 (0x10) is "alpha"
      expect(bytes.subarray(12, 16).toString("ascii")).toBe("VP8X");
      expect(bytes[20] & 0x10, "alpha flag").toBe(0x10);
    });
  }

  it("nothing in the repo still points at an incoming-images folder", () => {
    for (const file of ["DESIGN.md", "README.md", "CLAUDE.md", "docs/scenario-image-prompts.md"]) {
      expect(readFileSync(file, "utf8")).not.toContain("incoming-images");
    }
  });
});
