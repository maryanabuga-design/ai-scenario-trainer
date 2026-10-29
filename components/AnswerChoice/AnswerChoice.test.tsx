import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerChoice } from "@/components/AnswerChoice/AnswerChoice";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";

const noop = () => undefined;
const card = (checked: boolean) =>
  renderToStaticMarkup(
    <AnswerChoice
      letter="b"
      value="Find the two nearest exits"
      checked={checked}
      radioLabel="Correct answer B"
      fieldLabel="Answer B"
      fieldName="option-b"
      onValue={noop}
      onChoose={noop}
    />,
  ).replace(/<!-- -->/g, "");

describe("the answer card", () => {
  it("is one tappable card: the radio and its ring INSIDE it, on the right, after the text field", () => {
    const html = card(false);
    expect(html.startsWith("<label")).toBe(true);
    expect(html.match(/<input/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Correct answer B"');
    expect(html).toContain('aria-label="Answer B"');
    expect(html.indexOf('type="radio"')).toBeLessThan(html.indexOf('aria-label="Answer B"'));
    // the visible ring is the last thing in the card
    expect(html.lastIndexOf("rounded-full border border-primary")).toBeGreaterThan(
      html.indexOf('aria-label="Answer B"'),
    );
    expect(html).toContain("rounded-card");
    expect(html).toContain("min-h-[64px]");
    // no separate radio circle outside the card
    expect(html.indexOf("</label>")).toBe(html.length - "</label>".length);
  });

  it("the selected card has a 1.5px olive border and a filled radio; the others a light border and an empty ring", () => {
    const on = card(true);
    const off = card(false);
    expect(on).toContain("border-[1.5px]");
    expect(on).toMatch(/border-\[1\.5px\][^"]*border-primary/);
    expect(on).toContain("h-2.5 w-2.5 rounded-full bg-primary");
    expect(off).toContain("border-selectable-stroke");
    expect(off).not.toContain("h-2.5 w-2.5 rounded-full bg-primary");
  });

  it("the shared selectable row has the same selected look when asked (emphasis) and is unchanged otherwise", () => {
    const row = (checked: boolean, emphasis?: boolean) =>
      renderToStaticMarkup(
        <SelectableRow name="g" value="1" checked={checked} onChange={noop} emphasis={emphasis}>
          1. Know your exits
        </SelectableRow>,
      );
    expect(row(true, true)).toMatch(/border-\[1\.5px\][^"]*border-primary/);
    expect(row(false, true)).toMatch(/border-\[1\.5px\][^"]*border-selectable-stroke/);
    expect(row(true)).not.toContain("border-[1.5px]");
    expect(row(true)).toContain("border border-selectable-stroke");
  });
});
