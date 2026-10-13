import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";
import { AnswerSheet } from "@/components/AnswerSheet/AnswerSheet";
import { Button } from "@/components/Button/Button";
import { ExplainStep } from "@/components/ExplainStep/ExplainStep";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { Tag } from "@/components/Tag/Tag";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import { MaterialTile } from "@/components/MaterialTile/MaterialTile";
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

describe("secondary olive for inactive states and tonal backgrounds", () => {
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
    const track = classWith(html, "rounded-full") ?? "";
    expect(track).toContain("bg-secondary-olive");
    expect(track).toContain("border border-secondary-olive-pressed");
  });

  it("is every Guide chip, pressed one tone darker", () => {
    const chip = classWith(withSheet(<GuideChip sectionId="S1" />), "min-h-9") ?? "";
    expect(chip).toContain("bg-secondary-olive");
    expect(chip).toContain("active:bg-secondary-olive-pressed");
  });

  it("is the arrow circle on cards", () => {
    expect(renderToStaticMarkup(<ArrowCircle />)).toContain("bg-secondary-olive");
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
    expect(classWith(explain, "border-l-[3px]")).toContain("bg-secondary-olive");
    const sheet = withSheet(
      <AnswerSheet inline content={stepSheet(getStep("s1"), wrong)} onContinue={() => undefined} />,
    );
    expect(classWith(sheet, "border-l-[3px]")).toContain("bg-secondary-olive");
  });

  it("is the background of disabled buttons, with a lower-contrast label", () => {
    const html = renderToStaticMarkup(<Button disabled>Continue</Button>);
    expect(html).toContain("disabled:bg-secondary-olive");
    expect(html).toContain("disabled:text-text-secondary");
  });

  it("is every inactive step segment and carousel dot", () => {
    const bar = renderToStaticMarkup(<SessionTopBar index={0} total={3} unit="Step" />);
    expect(bar.match(/h-1.5 w-4 rounded-full bg-secondary-olive/g)).toHaveLength(2);
    const topics = weakTopics([scoreStep(getStep("s2"), "c", 2), scoreStep(getStep("s5"), "a", 1)]);
    const row = withSheet(<TopicRow topics={topics} labelledBy="t" onRepeat={() => undefined} />);
    expect(row.match(/h-2 w-2 rounded-full bg-secondary-olive/g)).toHaveLength(1);
  });
});

describe("coloured chips and icon backgrounds stay as they are", () => {
  it("keeps every tag in its pastel and never in the olive", () => {
    const tones = {
      yellow: "bg-tag-yellow",
      blue: "bg-tag-blue",
      peach: "bg-tag-peach",
      lilac: "bg-tag-lilac",
      sage: "bg-tag-sage",
    } as const;
    for (const [tone, fill] of Object.entries(tones)) {
      const html = renderToStaticMarkup(<Tag tone={tone as keyof typeof tones}>Scenario</Tag>);
      expect(html).toContain(fill);
      expect(html).not.toContain("secondary-olive");
    }
  });

  it("keeps topic tiles by section and the material tile on its own colour", () => {
    const tile = (sectionId: string) =>
      renderToStaticMarkup(<TopicTile sectionId={sectionId} icon="DoorOpen" />);
    expect(tile("S1")).toContain("bg-tag-yellow");
    expect(tile("S2")).toContain("bg-tag-blue");
    expect(renderToStaticMarkup(<MaterialTile type="PDF" />)).toContain("bg-material-tile");
  });

  it("keeps neutral status chips on the neutral panel colour", () => {
    const ready = renderToStaticMarkup(<StatusBadge status="ready" />);
    expect(ready).toContain("bg-surface-muted");
    expect(ready).not.toContain("secondary-olive");
  });
});
