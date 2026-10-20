import { readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { homeImages } from "@/lib/home";
import { heroSlotFiles } from "@/lib/media-frames";

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

  it("includes the five Welcome, onboarding and Verify pictures, at the right size and weight", () => {
    const wanted = [
      ["welcome.webp", 640, 60],
      ["onboarding-practise.webp", 640, 60],
      ["onboarding-mistakes.webp", 640, 60],
      ["onboarding-exam.webp", 640, 60],
      ["verify.webp", 384, 30],
    ] as const;
    for (const [name, pixels, kb] of wanted) {
      expect(files, name).toContain(name);
      const bytes = readFileSync(`${DIR}/${name}`);
      expect(bytes.length, `${name} weight`).toBeLessThanOrEqual(kb * 1024);
      // the extended format stores the canvas size minus one in three bytes each, after the flags
      const width = (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)) + 1;
      const height = (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) + 1;
      expect([width, height], `${name} pixels`).toEqual([pixels, pixels]);
    }
  });

  it("names every slot file", () => {
    expect(Object.values(heroSlotFiles).sort()).toEqual(
      [
        "/heroes/welcome.webp",
        "/heroes/onboarding-practise.webp",
        "/heroes/onboarding-mistakes.webp",
        "/heroes/onboarding-exam.webp",
        "/heroes/verify.webp",
      ].sort(),
    );
    for (const file of Object.values(heroSlotFiles)) expect(files).toContain(file.split("/").pop());
  });

  it("nothing in the repo still points at an incoming-images folder", () => {
    for (const file of ["DESIGN.md", "README.md", "CLAUDE.md", "docs/scenario-image-prompts.md"]) {
      expect(readFileSync(file, "utf8")).not.toContain("incoming-images");
    }
  });
});
