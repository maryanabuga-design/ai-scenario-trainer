import { describe, expect, it } from "vitest";
import { initialOpen, toggleOpen } from "@/lib/accordion";

describe("the single-open accordion", () => {
  it("opens step 1 first", () => {
    expect(initialOpen(["a", "b", "c"])).toBe("a");
    expect(initialOpen([])).toBeNull();
  });

  it("opening a step closes the one that was open", () => {
    expect(toggleOpen("a", "b")).toBe("b");
  });

  it("tapping the open step closes it, and nothing open is allowed", () => {
    expect(toggleOpen("b", "b")).toBeNull();
    expect(toggleOpen(null, "c")).toBe("c");
  });
});
