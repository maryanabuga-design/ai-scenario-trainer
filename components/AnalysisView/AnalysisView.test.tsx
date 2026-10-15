import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { AnalysisView } from "@/components/AnalysisView/AnalysisView";
import { getStep } from "@/lib/scenario";
import { plainErrorLabel, scoreStep } from "@/lib/scoring";

const items = [
  scoreStep(getStep("s1"), "b", 3),
  scoreStep(getStep("s2"), "c", 2),
  scoreStep(getStep("s3"), "b", 3),
  scoreStep(getStep("s5"), "a", 1),
];

const html = renderToStaticMarkup(
  <ActionBarProvider>
    <AnalysisView
      items={items}
      quiz={false}
      backHref="/session/results"
      onRepeat={() => undefined}
    />
  </ActionBarProvider>,
);

describe("Error types details", () => {
  it("uses the plain labels and never the word misconceptions as a heading", () => {
    expect(plainErrorLabel).toEqual({
      misconception: "Sure, but wrong",
      knowledge_gap: "Not sure, and wrong",
      guess: "Right, but not sure",
      secure: "Sure and right",
    });
    Object.values(plainErrorLabel).forEach((label) => expect(html).toContain(label));
    expect(html).not.toMatch(/misconceptions/i);
    expect(html).toContain('<h1 class="type-page-title">Error types</h1>');
  });

  it("keeps the chips and the order: most serious first", () => {
    const order = [
      "Sure, but wrong",
      "Not sure, and wrong",
      "Right, but not sure",
      "Sure and right",
    ];
    const positions = order.map((label) => html.indexOf(label));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).toContain("Misconception");
  });

  it("shows the situation practised for each answer and opens its review", () => {
    items.forEach((item, index) => {
      expect(html).toContain(`href="/session/results/review/${index + 1}?from=details"`);
      expect(html).toContain(item.prompt.slice(0, 40));
    });
  });
});
