import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StepStrip, stripStates } from "@/components/StepStrip/StepStrip";

function render(answered: boolean[], current: number, unit = "Question") {
  return renderToStaticMarkup(
    <StepStrip unit={unit} states={stripStates(answered, current)} onSelect={() => undefined} />,
  );
}

describe("step strip", () => {
  it("marks the current, answered and unanswered items", () => {
    expect(stripStates([true, false, false, true], 2)).toEqual([
      "answered",
      "unanswered",
      "current",
      "answered",
    ]);
  });

  it("draws current as primary with white number, answered in olive tint, unanswered outlined", () => {
    const html = render([true, false, false], 1);
    expect(html).toContain("bg-olive-tint text-text");
    expect(html).toContain("bg-primary text-primary-text");
    expect(html).toContain("border-[1.5px] border-secondary-sand-pressed text-text");
    expect(html.match(/h-8 w-8/g)).toHaveLength(3);
  });

  it("names each item with its number and state, and marks the current one", () => {
    const html = render([true, false, false], 1);
    expect(html).toContain('aria-label="Question 1, answered"');
    expect(html).toContain('aria-label="Question 2, current"');
    expect(html).toContain('aria-label="Question 3, not answered"');
    expect(html).toContain('aria-current="step"');
    expect(render([false], 0, "Step")).toContain('aria-label="Step 1, current"');
  });

  it("is a row of buttons, one per item, that scrolls sideways", () => {
    const html = render(Array(12).fill(false), 0);
    expect(html.match(/<button/g)).toHaveLength(12);
    expect(html).toContain("overflow-x-auto");
  });

  it("never shows a check or a cross, so it cannot show right or wrong", () => {
    const html = render([true, true, false], 2);
    expect(html).not.toMatch(/lucide|<svg|✓|✗/);
  });
});

describe("step strip in the Answer review", () => {
  const marks = ["correct", "incorrect", "correct"] as const;
  const html = renderToStaticMarkup(
    <StepStrip
      unit="Question"
      states={stripStates([true, true, true], 1)}
      marks={[...marks]}
      onSelect={() => undefined}
    />,
  );

  it("shows a check on a correct square and a cross on an incorrect one", () => {
    expect(html.match(/lucide-check/g)).toHaveLength(2);
    expect(html.match(/lucide-x/g)).toHaveLength(1);
    expect(html).toContain("bg-correct-bg");
    expect(html).toContain("bg-wrong-bg");
  });

  it("names each square by its result, and outlines the current one in primary", () => {
    expect(html).toContain('aria-label="Question 1, correct"');
    expect(html).toContain('aria-label="Question 2, incorrect"');
    expect(html).toContain("outline-primary");
    expect(html).toContain('aria-current="step"');
  });

  it("uses the 32px, 10px-radius square", () => {
    expect(html.match(/h-8 w-8/g)).toHaveLength(3);
    expect(html).toContain("rounded-[10px]");
  });

  it("shows no check or cross in a session strip", () => {
    const session = renderToStaticMarkup(
      <StepStrip
        unit="Question"
        states={stripStates([true, false], 0)}
        onSelect={() => undefined}
      />,
    );
    expect(session).not.toMatch(/lucide-check|lucide-x/);
  });
});
