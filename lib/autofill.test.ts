import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf8");

describe("the browser autofill tint", () => {
  const rule = css.slice(
    css.indexOf("input:-webkit-autofill"),
    css.indexOf("@keyframes slide-in-next"),
  );

  it("is switched off on every input: a white inset shadow, dark text and a very long transition", () => {
    expect(rule).toContain("input:-webkit-autofill,");
    expect(rule).toContain("input:autofill");
    expect(rule).toContain("box-shadow: 0 0 0 1000px var(--card) inset");
    expect(rule).toContain("-webkit-text-fill-color: var(--text)");
    expect(rule).toMatch(/transition:\s*background-color 600000s 0s/);
  });

  it("uses registered tokens only (the white card and the text colour)", () => {
    expect(rule).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
    expect(css).toMatch(/--card:\s*#ffffff/i);
  });
});
