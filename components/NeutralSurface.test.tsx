import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { AnswerSheet } from "@/components/AnswerSheet/AnswerSheet";
import { Button } from "@/components/Button/Button";
import { ExplainStep } from "@/components/ExplainStep/ExplainStep";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { Tag } from "@/components/Tag/Tag";
import { TopicRow } from "@/components/TopicRow/TopicRow";
import { stepSheet } from "@/lib/answer-sheet";
import { loadAllSections } from "@/lib/guide";
import { getStep } from "@/lib/scenario";
import { scoreStep } from "@/lib/scoring";
import { weakTopics } from "@/lib/weak-topics";

const wrong = { stepId: "s1", optionId: "d", confidence: 2 as const, explanation: "x" };

function withSheet(node: React.ReactNode) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>{node}</ActionBarProvider>
    </SourceSheetProvider>,
  );
}

/** The class attribute of the first element whose class contains `marker`. */
function classWith(html: string, marker: string) {
  return [...html.matchAll(/class="([^"]*)"/g)].map((m) => m[1]).find((c) => c.includes(marker));
}

describe("one neutral surface", () => {
  it("is the Scenario/Quiz switch track", () => {
    const html = renderToStaticMarkup(
      <SegmentedControl
        name="mode"
        legend="Mode"
        options={[
          { value: "scenario", label: "Scenario" },
          { value: "quiz", label: "Quiz" },
        ]}
        value="scenario"
        onChange={() => undefined}
      />,
    );
    expect(classWith(html, "rounded-full")).toContain("bg-neutral-surface");
  });

  it("is every Guide chip, neutral tag and neutral status chip", () => {
    const chip = withSheet(<GuideChip sectionId="S1" />);
    expect(classWith(chip, "min-h-9")).toContain("bg-neutral-surface");
    expect(renderToStaticMarkup(<Tag>Quiz</Tag>)).toContain("bg-neutral-surface");
    expect(renderToStaticMarkup(<StatusBadge status="ready" />)).toContain("bg-neutral-surface");
  });

  it("is the Your choice block on the Explain screen and in the answer sheet", () => {
    const explain = withSheet(
      <ExplainStep
        step={getStep("s1")}
        answer={wrong}
        index={0}
        total={3}
        onSend={() => undefined}
        onDontKnow={() => undefined}
      />,
    );
    expect(classWith(explain, "border-l-[3px]")).toContain("bg-neutral-surface");
    const sheet = withSheet(
      <AnswerSheet inline content={stepSheet(getStep("s1"), wrong)} onContinue={() => undefined} />,
    );
    expect(classWith(sheet, "border-l-[3px]")).toContain("bg-neutral-surface");
  });

  it("is the background of disabled buttons, with a lower-contrast label", () => {
    const html = renderToStaticMarkup(<Button disabled>Continue</Button>);
    expect(html).toContain("disabled:bg-neutral-surface");
    expect(html).toContain("disabled:text-text-secondary");
  });

  it("is every inactive step segment and carousel dot", () => {
    const bar = renderToStaticMarkup(<SessionTopBar index={0} total={3} unit="Step" />);
    expect(bar.match(/h-1.5 w-4 rounded-full bg-neutral-surface/g)).toHaveLength(2);
    const topics = weakTopics([scoreStep(getStep("s2"), "c", 2), scoreStep(getStep("s5"), "a", 1)]);
    const row = withSheet(<TopicRow topics={topics} labelledBy="t" onRepeat={() => undefined} />);
    expect(row.match(/h-2 w-2 rounded-full bg-neutral-surface/g)).toHaveLength(1);
  });
});
