import { readFileSync } from "node:fs";
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
  it("is the shared selectable row: one card, the letter as plain text, a borderless field inside, the radio on the right", () => {
    const html = card(false);
    expect(html.startsWith("<label")).toBe(true);
    expect(html).toContain('data-correct="b"');
    expect(html).toContain("data-answer-card");
    expect(html.match(/<input/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Correct answer B"');
    expect(html).toContain('aria-label="Answer B"');
    // the letter is plain text at the start of the line: no circle, no badge
    expect(html).toMatch(
      /<span aria-hidden="true" class="type-body shrink-0 text-text">B\.<\/span>/,
    );
    expect(html).not.toMatch(/bg-olive-tint|h-6 w-6/);
    // the field has no border, no background and no inner rectangle
    const field = html.slice(html.indexOf('aria-label="Answer B"'));
    expect(field).toMatch(/border-0 bg-transparent p-0/);
    expect(field).not.toMatch(/rounded-\[|border-selectable-stroke bg-card/);
    // the radio ring is the last thing in the card, in a 44px tap area
    expect(html).toContain("data-radio-area");
    expect(html).toContain("h-11 w-11");
    expect(html.indexOf("data-radio-area")).toBeGreaterThan(html.indexOf('aria-label="Answer B"'));
    // the same card as the Guide section cards: 64px high, the card radius
    expect(html).toContain("h-16");
    expect(html).toContain("rounded-card");
  });

  it("the selected card has a 1.5px olive border and a filled radio; the others a light border and an empty ring", () => {
    const on = card(true);
    const off = card(false);
    expect(on).toMatch(/border-\[1\.5px\][^"]*border-primary/);
    expect(on).toContain("h-2.5 w-2.5 rounded-full bg-primary");
    expect(off).toContain("border-selectable-stroke");
    expect(off).not.toContain("h-2.5 w-2.5 rounded-full bg-primary");
  });

  it("answers, scenario answers and the Guide section list are ONE component: the shared selectable row with emphasis", () => {
    const code = (file: string) => readFileSync(file, "utf8");
    expect(code("components/AnswerChoice/AnswerChoice.tsx")).toContain("<SelectableRow");
    expect(code("components/AnswerChoice/AnswerChoice.tsx")).toContain("emphasis");
    // the quiz and scenario answers of the item edit screen and the question edit screen
    expect(code("components/InstructorContent/PackageItemEdit.tsx")).toContain("<AnswerChoice");
    expect(code("components/InstructorContent/EditQuestionView.tsx")).toContain("<AnswerChoice");
    // the Guide section list
    expect(code("components/InstructorContent/PackageItemEdit.tsx")).toMatch(
      /<SelectableRow[\s\S]*?emphasis/,
    );
    // nobody draws a radio by hand any more in these screens
    for (const file of [
      "components/InstructorContent/PackageItemEdit.tsx",
      "components/InstructorContent/EditQuestionView.tsx",
    ]) {
      expect(code(file), file).not.toMatch(/type="radio"/);
    }
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
    expect(row(true)).not.toContain("data-radio-area");
    expect(row(true)).toContain("border border-selectable-stroke");
  });
});
