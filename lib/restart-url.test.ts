import { describe, expect, it } from "vitest";
import { asksForRestart } from "@/lib/restart";

describe("the restart shortcut address", () => {
  it("is /welcome?restart=1 and nothing else", () => {
    expect(asksForRestart("/welcome", "restart=1")).toBe(true);
    expect(asksForRestart("/welcome", "?restart=1")).toBe(true);
    expect(asksForRestart("/welcome", "a=2&restart=1")).toBe(true);
    for (const [path, search] of [
      ["/welcome", ""],
      ["/welcome", "restart=0"],
      ["/welcome", "restart=yes"],
      ["/", "restart=1"],
      ["/profile", "restart=1"],
      ["/sign-in", "restart=1"],
    ]) {
      expect(asksForRestart(path, search), `${path}?${search}`).toBe(false);
    }
  });
});
