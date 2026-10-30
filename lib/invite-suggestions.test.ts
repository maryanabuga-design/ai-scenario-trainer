import { describe, expect, it } from "vitest";
import data from "@/content/invite-suggestions.json";
import { MAX_SUGGESTIONS, SUGGESTIONS, suggest } from "@/lib/invite-suggestions";

describe("the simulated invite suggestions", () => {
  it("are about ten invented people on example addresses, marked as simulated", () => {
    expect(SUGGESTIONS.length).toBeGreaterThanOrEqual(8);
    expect(SUGGESTIONS.length).toBeLessThanOrEqual(12);
    expect(data.note).toMatch(/^SIMULATED/);
    for (const person of SUGGESTIONS) expect(person.email).toMatch(/@example\.com$/);
  });

  it("match a name or an email part, ignore case, and give nothing for an empty text", () => {
    expect(suggest("")).toEqual([]);
    expect(suggest("  ")).toEqual([]);
    expect(suggest("al").map((p) => p.name)).toContain("Alina Kovalenko");
    expect(suggest("AL").length).toBe(suggest("al").length);
    expect(suggest("melnyk")).toEqual([
      { name: "Daria Melnyk", email: "daria.melnyk@example.com" },
    ]);
    expect(suggest("zzzz")).toEqual([]);
  });

  it("skip the people already added and show at most five", () => {
    expect(suggest("a", ["alina.kovalenko@example.com"]).map((p) => p.email)).not.toContain(
      "alina.kovalenko@example.com",
    );
    expect(suggest("example.com").length).toBe(MAX_SUGGESTIONS);
  });
});
