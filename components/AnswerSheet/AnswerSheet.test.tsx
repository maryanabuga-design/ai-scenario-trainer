import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerSheet } from "@/components/AnswerSheet/AnswerSheet";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { stepSheet } from "@/lib/answer-sheet";
import { loadAllSections } from "@/lib/guide";
import { getStep } from "@/lib/scenario";
import type { Answer } from "@/lib/session";

/** A right choice with a typed explanation that misses the guide: the one case with the button. */
const missed: Answer = { stepId: "s1", optionId: "b", confidence: 3, explanation: "лбтдлюью" };
const matched: Answer = {
  stepId: "s1",
  optionId: "b",
  confidence: 3,
  explanation: "The alarm is real, so we take the stairs now.",
};
const wrong: Answer = { stepId: "s1", optionId: "d", confidence: 2, explanation: "лбтдлюью" };

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

describe("My explanation is still correct", () => {
  it("is there for a wrong choice with typed gibberish too", () => {
    expect(render(wrong)).toContain(">My explanation is still correct</button>");
  });

  it("is a secondary button below Continue for a right choice with a missed explanation", () => {
    const html = render(missed);
    expect(html).toContain("Doesn&#x27;t match the guide yet");
    const button = html.indexOf(">My explanation is still correct</button>");
    expect(button).toBeGreaterThan(-1);
    // Continue comes first on screen and in the Tab order.
    expect(html.indexOf(">Continue</button>")).toBeLessThan(button);
    expect(html.slice(html.lastIndexOf("<button", button), button)).toContain("border-primary");
  });

  it("is not there for a matching explanation", () => {
    expect(render(matched)).toContain("Matches the guide");
    expect(render(matched)).not.toContain("still correct");
    expect(render(matched)).not.toContain("Better explanation");
    expect(render(wrong)).toContain("Better explanation");
  });

  it("becomes a confirmation with Undo once pressed", () => {
    const html = render({ ...missed, markedCorrect: true });
    expect(html).not.toContain("My explanation is still correct");
    expect(html).toContain("Marked as correct by you");
    expect(html).toContain(">Undo</span></button>");
    expect(html).toContain("Better explanation");
  });
});

describe("Your choice block", () => {
  it("uses the Guide chip fill and a 3px dark green line on the left", () => {
    const html = render(missed);
    const label = html.indexOf(">Your choice</h3>");
    const block = html.slice(
      html.lastIndexOf('<div class="', html.lastIndexOf("<svg", label)),
      label,
    );
    expect(block).toContain("bg-secondary-sand");
    expect(block).toContain("border-l-[3px]");
    expect(block).toContain("border-l-primary");
  });
});
