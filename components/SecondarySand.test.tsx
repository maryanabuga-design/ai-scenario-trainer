import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { StepStrip, stripStates } from "@/components/StepStrip/StepStrip";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { Tag } from "@/components/Tag/Tag";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import { MaterialTile } from "@/components/MaterialTile/MaterialTile";
import { loadAllSections } from "@/lib/guide";

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
    const track = classWith(html, "rounded-[14px]") ?? "";
    expect(track).toContain("bg-secondary-sand");
    expect(track).toContain("border border-secondary-sand-pressed");
  });

  it("is not used for Guide chips any more: they are the chip sand, without a stroke", () => {
    const chip = classWith(withSheet(<GuideChip sectionId="S1" />), "min-h-9") ?? "";
    expect(chip).toContain("bg-pastel-sand");
    expect(chip).not.toMatch(/border|secondary-sand/);
  });

  it("is the background of disabled buttons, with a lower-contrast label", () => {
    const html = renderToStaticMarkup(<Button disabled>Continue</Button>);
    expect(html).toContain("disabled:bg-secondary-sand");
    expect(html).toContain("disabled:border-secondary-sand-pressed");
    expect(html).toContain("disabled:text-text-secondary");
  });

  it("is every inactive step segment and carousel dot", () => {
    const strip = renderToStaticMarkup(
      <StepStrip
        unit="Step"
        states={stripStates([false, false, false], 0)}
        onSelect={() => undefined}
      />,
    );
    expect(strip.match(/border-\[1.5px\] border-secondary-sand-pressed/g)).toHaveLength(2);
  });
});

describe("coloured chips and icon backgrounds stay as they are", () => {
  it("keeps every tag in its pastel and never in the olive", () => {
    const tones = {
      yellow: "bg-pastel-yellow",
      blue: "bg-pastel-blue",
      peach: "bg-pastel-peach",
      lilac: "bg-pastel-lilac",
      olive: "bg-olive-tint",
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
