import { describe, expect, it } from "vitest";
import {
  MATERIALS_SUBTITLE,
  MATERIALS_TITLE,
  WORDS_PER_MINUTE,
  readingLabel,
  readingMinutes,
  wordCount,
} from "@/lib/reading";

const words = (count: number) => Array.from({ length: count }, () => "word").join(" ");

describe("reading time", () => {
  it("counts 200 words a minute", () => {
    expect(WORDS_PER_MINUTE).toBe(200);
  });

  it("is the word count divided by 200, rounded up", () => {
    expect(readingMinutes(words(200))).toBe(1);
    expect(readingMinutes(words(201))).toBe(2);
    expect(readingMinutes(words(400))).toBe(2);
    expect(readingMinutes(words(1000))).toBe(5);
    expect(readingMinutes(words(1001))).toBe(6);
  });

  it("is at least 1 minute, even for a very short or empty text", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("   ")).toBe(1);
    expect(readingMinutes(words(5))).toBe(1);
  });

  it("counts words, not markdown marks", () => {
    expect(wordCount("- **Bold** text here\n\n### A heading\n1. one two")).toBe(7);
    expect(wordCount("")).toBe(0);
  });

  it("is written 5 min read", () => {
    expect(readingLabel(5)).toBe("5 min read");
    expect(readingLabel(1)).toBe("1 min read");
  });
});

describe("the Materials texts", () => {
  it("are the title and the subtitle", () => {
    expect(MATERIALS_TITLE).toBe("Materials");
    expect(MATERIALS_SUBTITLE).toBe("Read the training guides, then practise what you read.");
  });
});
