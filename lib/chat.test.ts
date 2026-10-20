import { describe, expect, it } from "vitest";
import { keywordMatches, tokens } from "@/lib/chat";

describe("the keyword rule", () => {
  it("splits a question into lower-case words, keeping hyphenated words", () => {
    expect(tokens("Why is a Fire-door shut?")).toEqual(["why", "is", "a", "fire-door", "shut"]);
    expect(tokens("???")).toEqual([]);
  });

  it("matches a word, a longer form of a word of four letters or more, and a phrase", () => {
    const words = tokens("Is lifting a person safe");
    const normalised = words.join(" ");
    expect(keywordMatches("person", words, normalised)).toBe(true);
    expect(keywordMatches("lift", words, normalised)).toBe(true);
    expect(keywordMatches("lif", words, normalised)).toBe(false);
    expect(keywordMatches("a person", words, normalised)).toBe(true);
    expect(keywordMatches("fire", words, normalised)).toBe(false);
  });
});
