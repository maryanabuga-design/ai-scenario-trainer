import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Colour classes must exist in the theme. A class like `bg-band-xyz` with no `--color-band-xyz`
 * in `app/globals.css` renders NO background, and a border with no colour class falls back to the
 * default (black). Neither fails the build, so this test finds both.
 */

const css = readFileSync("app/globals.css", "utf8");
const theme = new Set([...css.matchAll(/--color-([a-z0-9-]+):/g)].map((match) => match[1]));

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}
const sources = [...files("components"), ...files("app")].map((file) => ({
  file,
  code: readFileSync(file, "utf8"),
}));

/** Utilities that look like colour classes but are not (sizes, alignment, widths, styles). */
const notColours = new Set([
  "left",
  "center",
  "right",
  "justify",
  "start",
  "end",
  "balance",
  "pretty",
  "wrap",
  "nowrap",
  "ellipsis",
  "clip",
  "sm",
  "xs",
  "base",
  "lg",
  "xl",
  "t",
  "b",
  "l",
  "r",
  "x",
  "y",
  "s",
  "e",
  "solid",
  "dashed",
  "dotted",
  "none",
  "hidden",
  "transparent",
  "current",
  "inherit",
  "offset",
  "collapse",
  "separate",
  "spacing",
  "opacity",
  "white",
  "black",
]);

/** `bg-xxx`, `text-xxx`, `border-xxx`, `outline-xxx`, `fill-xxx`, `stroke-xxx` names used in classes. */
function colourClasses(code: string): { prefix: string; name: string }[] {
  const found: { prefix: string; name: string }[] = [];
  for (const match of code.matchAll(
    /(?<![\w-])(?:[a-z-]+:)*(bg|text|border|outline|fill|stroke|ring|divide)-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?![\w[(-])/g,
  )) {
    found.push({ prefix: match[1], name: match[2] });
  }
  return found;
}

describe("the theme tokens", () => {
  it("registers the band and step caption colours", () => {
    for (const name of ["band-olive-200", "step-caption"]) {
      expect(theme.has(name), `--color-${name}`).toBe(true);
    }
  });

  it("has no other band or step tokens: one band colour and one step caption colour", () => {
    const names = [...css.matchAll(/--((?:band|step)-[a-z0-9-]+):/g)].map((match) => match[1]);
    expect(new Set(names)).toEqual(new Set(["band-olive-200", "step-caption"]));
  });

  it("defines every custom colour class a component uses", () => {
    const missing = new Set<string>();
    for (const { file, code } of sources) {
      for (const { prefix, name } of colourClasses(code)) {
        // text-xs, border-t, text-left ... are not colours; so are their first words
        if (notColours.has(name.split("-")[0]) && !theme.has(name)) continue;
        // type-* utilities and `text-` sizes are named utilities, not colours
        if (prefix === "text" && /^(?:\d|\[)/.test(name)) continue;
        // arbitrary-ish single words that are real Tailwind (outline-accent etc.) must be in the theme
        if (!theme.has(name)) missing.add(`${file}: ${prefix}-${name}`);
      }
    }
    expect([...missing].sort()).toEqual([]);
  });

  it("never draws a border without naming its colour in the same class list", () => {
    const bare: string[] = [];
    for (const { file, code } of sources) {
      for (const literal of code.matchAll(/(["'`])((?:(?!\1)[^\n])*?)\1/g)) {
        const text = literal[2];
        if (!/(?<![\w-])border(?:-[trblxy])?(?![\w-])/.test(text)) continue;
        // a class list, not prose
        if (!/(?:flex|grid|rounded|p-|px-|bg-|text-|min-|h-|w-|gap-)/.test(text)) continue;
        const named = colourClasses(text).some(
          ({ prefix, name }) => prefix === "border" && theme.has(name),
        );
        if (!named) bare.push(`${file}: ${text.slice(0, 80)}`);
      }
    }
    expect(bare).toEqual([]);
  });
});
