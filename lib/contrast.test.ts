import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, GRAPHIC_CONTRAST, TEXT_CONTRAST } from "@/lib/contrast";

const css = readFileSync("app/globals.css", "utf8");

/** A token's #RRGGBB value from the :root block. */
function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css);
  if (!match) throw new Error(`No hex value for --${name}`);
  return match[1].toLowerCase();
}

type Pair = { what: string; front: string; back: string; min: number };

/** Every pair that carries meaning. Disabled controls are exempt. */
const pairs: Pair[] = [
  // text on the page and on a card
  ...["bg", "card"].flatMap((back) => [
    { what: `body text on ${back}`, front: token("text"), back: token(back), min: TEXT_CONTRAST },
    {
      what: `muted text on ${back}`,
      front: token("text-secondary"),
      back: token(back),
      min: TEXT_CONTRAST,
    },
  ]),
  // the labels on the answer fills
  {
    what: "Correct label on the correct fill",
    front: token("correct-text"),
    back: token("correct-bg"),
    min: TEXT_CONTRAST,
  },
  {
    what: "Not quite label on the wrong fill",
    front: token("wrong-text"),
    back: token("wrong-bg"),
    min: TEXT_CONTRAST,
  },
  {
    what: "body text on the correct fill",
    front: token("text"),
    back: token("correct-bg"),
    min: TEXT_CONTRAST,
  },
  {
    what: "body text on the wrong fill",
    front: token("text"),
    back: token("wrong-bg"),
    min: TEXT_CONTRAST,
  },
  // borders and icons that carry the meaning
  {
    what: "correct border and icon on white",
    front: token("correct"),
    back: "#ffffff",
    min: GRAPHIC_CONTRAST,
  },
  {
    what: "wrong border and icon on white",
    front: token("wrong"),
    back: "#ffffff",
    min: GRAPHIC_CONTRAST,
  },
  {
    what: "correct icon on the correct fill",
    front: token("correct"),
    back: token("correct-bg"),
    min: GRAPHIC_CONTRAST,
  },
  {
    what: "wrong icon on the wrong fill",
    front: token("wrong"),
    back: token("wrong-bg"),
    min: GRAPHIC_CONTRAST,
  },
  // buttons and the selected option
  {
    what: "primary button text on the primary",
    front: token("primary-text"),
    back: token("primary"),
    min: TEXT_CONTRAST,
  },
  {
    what: "selected-option border on white",
    front: token("primary"),
    back: "#ffffff",
    min: GRAPHIC_CONTRAST,
  },
  {
    what: "the radio dot on white",
    front: token("primary"),
    back: token("card"),
    min: GRAPHIC_CONTRAST,
  },
  {
    what: "primary label on the olive tint (secondary button)",
    front: token("primary"),
    back: token("olive-tint"),
    min: TEXT_CONTRAST,
  },
  {
    what: "body text on the olive tint",
    front: token("text"),
    back: token("olive-tint"),
    min: TEXT_CONTRAST,
  },
];

describe("WCAG contrast of the colour tokens", () => {
  it("has the new page and card colours", () => {
    expect(token("bg")).toBe("#f6f4f0");
    expect(token("card")).toBe("#ffffff");
    expect(token("selectable-stroke")).toBe("#e4dfd5");
    expect(token("olive-tint")).toBe("#e0e6d6");
  });

  it("has the semantic answer colours", () => {
    expect(token("correct")).toBe("#2e7d4f");
    expect(token("correct-bg")).toBe("#e3f2e8");
    expect(token("correct-text")).toBe("#1f6b3f");
    expect(token("wrong")).toBe("#c0392b");
    expect(token("wrong-bg")).toBe("#fbe4e1");
    expect(token("wrong-text")).toBe("#9b2c1f");
  });

  for (const { what, front, back, min } of pairs) {
    it(`${what} is at least ${min}:1`, () => {
      expect(contrastRatio(front, back), `${what}: ${front} on ${back}`).toBeGreaterThanOrEqual(
        min,
      );
    });
  }

  it("measures a known pair correctly", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(TEXT_CONTRAST);
  });
});
