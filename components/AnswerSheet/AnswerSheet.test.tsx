import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerSheet } from "@/components/AnswerSheet/AnswerSheet";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { stepSheet } from "@/lib/answer-sheet";
import { loadAllSections } from "@/lib/guide";
import { getStep } from "@/lib/scenario";
import type { Answer } from "@/lib/session";

const wrong: Answer = { stepId: "s1", optionId: "d", confidence: 2, explanation: "x" };
const right: Answer = { stepId: "s1", optionId: "b", confidence: 3, explanation: "x" };

function render(answer: Answer) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <AnswerSheet
        inline
        content={stepSheet(getStep("s1"), answer)}
        onContinue={() => undefined}
        onMarkCorrect={() => undefined}
      />
    </SourceSheetProvider>,
  );
}

describe("My answer is still correct", () => {
  it("is a secondary button below Continue after a typed wrong answer", () => {
    const html = render(wrong);
    const button = html.indexOf(">My answer is still correct</button>");
    expect(button).toBeGreaterThan(-1);
    // Continue comes first on screen and in the Tab order.
    expect(html.indexOf(">Continue</button>")).toBeLessThan(button);
    expect(html.slice(html.lastIndexOf("<button", button), button)).toContain("border-primary");
  });

  it("is not there after a right answer", () => {
    expect(render(right)).not.toContain("My answer is still correct");
  });

  it("becomes a confirmation with Undo once pressed", () => {
    const html = render({ ...wrong, markedCorrect: true });
    expect(html).not.toContain("My answer is still correct");
    expect(html).toContain("Marked as correct by you");
    expect(html).toContain(">Undo</button>");
    expect(html).toContain("Better choice");
  });
});

describe("Your choice block", () => {
  it("uses the Guide chip fill and a 3px dark green line on the left", () => {
    const html = render(wrong);
    const label = html.indexOf(">Your choice</h3>");
    const block = html.slice(
      html.lastIndexOf('<div class="', html.lastIndexOf("<svg", label)),
      label,
    );
    expect(block).toContain("bg-neutral-surface");
    expect(block).toContain("border-l-[3px] border-primary");
  });
});
