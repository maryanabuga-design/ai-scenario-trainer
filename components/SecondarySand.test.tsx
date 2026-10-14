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
import { StatusChip } from "@/components/StatusChip/StatusChip";
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

describe("secondary sand for inactive states and tonal backgrounds", () => {
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
    expect(track).toContain("bg-secondary-sand");
    expect(track).toContain("border border-secondary-sand-pressed");
  });

  it("is not used for Guide chips any more: they are the chip sand, without a stroke", () => {
    const chip = classWith(withSheet(<GuideChip sectionId="S1" />), "min-h-9") ?? "";
    expect(chip).toContain("bg-pastel-sand");
    expect(chip).not.toMatch(/border|secondary-sand/);
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
    expect(classWith(explain, "border-l-[3px]")).toMatch(
      /border border-l-\[3px\] border-secondary-sand-pressed border-l-primary bg-secondary-sand/,
    );
    const sheet = withSheet(
      <AnswerSheet inline content={stepSheet(getStep("s1"), wrong)} onContinue={() => undefined} />,
    );
    expect(classWith(sheet, "border-l-[3px]")).toMatch(
      /border border-l-\[3px\] border-secondary-sand-pressed border-l-primary bg-secondary-sand/,
    );
  });

  it("is the background of disabled buttons, with a lower-contrast label", () => {
    const html = renderToStaticMarkup(<Button disabled>Continue</Button>);
    expect(html).toContain("disabled:bg-secondary-sand");
    expect(html).toContain("disabled:border-secondary-sand-pressed");
    expect(html).toContain("disabled:text-text-secondary");
  });

  it("is every inactive step segment and carousel dot", () => {
    const bar = renderToStaticMarkup(<SessionTopBar index={0} total={3} unit="Step" />);
    expect(bar.match(/h-1.5 w-4 rounded-full bg-secondary-sand-pressed/g)).toHaveLength(2);
    const topics = weakTopics([scoreStep(getStep("s2"), "c", 2), scoreStep(getStep("s5"), "a", 1)]);
    const row = withSheet(<TopicRow topics={topics} labelledBy="t" onRepeat={() => undefined} />);
    expect(row.match(/h-2 w-2 rounded-full bg-secondary-sand-pressed/g)).toHaveLength(1);
  });
});

describe("coloured chips and icon backgrounds stay as they are", () => {
  it("keeps every tag in its pastel and never in the olive", () => {
    const tones = {
      yellow: "bg-pastel-yellow",
      blue: "bg-pastel-blue",
      peach: "bg-pastel-peach",
      lilac: "bg-pastel-lilac",
      green: "bg-pastel-green",
    } as const;
    for (const [tone, fill] of Object.entries(tones)) {
      const html = renderToStaticMarkup(<Tag tone={tone as keyof typeof tones}>Scenario</Tag>);
      expect(html).toContain(fill);
      expect(html).not.toContain("secondary-sand");
    }
  });

  it("keeps topic tiles by section and the material tile on its own colour", () => {
    const tile = (sectionId: string) =>
      renderToStaticMarkup(<TopicTile sectionId={sectionId} icon="DoorOpen" />);
    expect(tile("S1")).toContain("bg-pastel-yellow");
    expect(tile("S2")).toContain("bg-pastel-blue");
    expect(renderToStaticMarkup(<MaterialTile type="PDF" />)).toContain("bg-olive-tint");
  });

  it("keeps the neutral status chip (Marked correct by you) on the chip sand", () => {
    const marked = renderToStaticMarkup(<StatusChip status="marked" />);
    expect(marked).toContain("bg-pastel-sand");
    expect(marked).not.toContain("secondary-sand");
  });
});

describe("the shared pastel palette on icon tiles", () => {
  it("draws the Home topic tile at the default size: 48px circle, 24px icon", () => {
    const html = renderToStaticMarkup(<TopicTile sectionId="S1" icon="DoorOpen" />);
    expect(html).toContain("h-12 w-12");
    expect(html).toContain('width="24"');
    expect(html).toContain('stroke-width="2"');
  });

  it("has a compact variant: 36px circle, 18px icon, 1.75 stroke", () => {
    const html = renderToStaticMarkup(<TopicTile sectionId="S1" icon="DoorOpen" size="compact" />);
    expect(html).toContain("h-9 w-9");
    expect(html).toContain('width="18"');
    expect(html).toContain('stroke-width="1.75"');
  });

  it("cycles the five palette tones by section, the sage now being the green", () => {
    const fill = (id: string) =>
      /bg-pastel-[a-z]+/.exec(
        renderToStaticMarkup(<TopicTile sectionId={id} icon="DoorOpen" />),
      )?.[0];
    expect(["S1", "S2", "S3", "S4", "S5"].map(fill)).toEqual([
      "bg-pastel-yellow",
      "bg-pastel-blue",
      "bg-pastel-lilac",
      "bg-pastel-green",
      "bg-pastel-peach",
    ]);
  });
});
