import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { isMixed, ReviewPager } from "@/components/ReviewPager/ReviewPager";
import type { Mark } from "@/components/ReviewPager/ReviewPager";

const render = (marks: Mark[], current = 0) =>
  renderToStaticMarkup(<ReviewPager marks={marks} current={current} onSelect={() => undefined} />);

describe("the Answer review pager", () => {
  it("is mixed only when the list has both a correct and a wrong question", () => {
    expect(isMixed(["correct", "wrong"])).toBe(true);
    expect(isMixed(["wrong", "wrong"])).toBe(false);
    expect(isMixed(["correct", "correct"])).toBe(false);
    expect(isMixed([])).toBe(false);
  });

  it("colours the chips with the answer tokens and a 1px tinted border, with no icon", () => {
    const html = render(["correct", "wrong", "correct"], 1);
    expect(html).toContain("border-correct/35 bg-correct-bg");
    expect(html).toContain("border-wrong/35 bg-wrong-bg");
    expect(html).not.toMatch(/lucide|<svg/);
    expect(html.match(/<span[^>]*data-chip="(correct|wrong)"/g)).toHaveLength(3);
    // every chip has a border (1px by default) and no new hex colour
    expect(html).not.toMatch(/#[0-9a-f]{3,6}/i);
  });

  it("renders every chip neutral when all results are the same", () => {
    for (const marks of [
      ["wrong", "wrong", "wrong"],
      ["correct", "correct"],
    ] as Mark[][]) {
      const html = render(marks);
      expect(html).not.toMatch(/bg-correct-bg|bg-wrong-bg/);
      expect(html).toContain("border-selectable-stroke bg-surface");
      expect(html).not.toMatch(/, correct"|, wrong"/);
      expect(html).toContain('aria-label="Question 1"');
    }
  });

  it("marks the active chip with a 2px olive ring, a semibold number and aria-current", () => {
    const html = render(["correct", "wrong"], 1);
    expect(html.match(/outline-2 outline-offset-0 outline-primary/g)).toHaveLength(1);
    expect(html.match(/type-small-strong/g)).toHaveLength(1);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Question 1, correct"');
    expect(html).toContain('aria-label="Question 2, wrong"');
  });

  it("is a 36 by 36 chip with a 10px radius in a 44px tap area, scrolling sideways with no scrollbar", () => {
    const html = render(["correct", "wrong"]);
    expect(html).toContain("h-9 w-9");
    expect(html).toContain("rounded-[10px]");
    expect(html).toContain("h-11 min-w-11");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("[&amp;::-webkit-scrollbar]:hidden");
    expect(html).toContain("px-3");
  });
});
