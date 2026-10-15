import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { SessionSetup, defaultSetup, setupChoice } from "@/components/SessionSetup/SessionSetup";
import type { SetupValue } from "@/components/SessionSetup/SessionSetup";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";

const all = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];
const noop = () => undefined;

function render(
  value: Partial<SetupValue> = {},
  extra: { weak?: string[]; stats?: [number, number, number]; practised?: number } = {},
) {
  const [questions, correct, incorrect] = extra.stats ?? [24, 17, 7];
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>
        <SessionSetup
          value={{ ...defaultSetup, sections: all, ...value }}
          onChange={noop}
          onStart={noop}
          materialName="Sample evacuation guide.pdf"
          scenarioId="building-evacuation-001"
          guideSectionIds={all}
          stats={{ questions, correct, incorrect }}
          practised={extra.practised ?? 32}
          weakSectionIds={extra.weak ?? ["S3"]}
        />
      </ActionBarProvider>
    </SourceSheetProvider>,
  );
}

describe("Session setup", () => {
  const html = render();

  it("has the top row: Back, the title with the guide name under it, and the practised ring", () => {
    const order = [
      'aria-label="Back to material"',
      "Session setup",
      "Sample evacuation guide.pdf",
    ].map((text) => html.indexOf(text));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain('aria-label="32% of the guide practised"');
    expect(html).toContain(">32%<");
  });

  it("follows with the hero, the guide title, the switch, Your answers and the settings card", () => {
    const order = [
      "data-media3d",
      "type-page-title break-words",
      'name="mode-',
      "YOUR ANSWERS",
      ">Length<",
      "Guide sections ·",
    ].map((text) => html.indexOf(text));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain("rounded-[14px]");
  });

  it("shows the answers to this guide in three columns", () => {
    expect(html).toContain("Questions");
    expect(html).toContain("Correct");
    expect(html).toContain("Incorrect");
    for (const number of ["24", "17", "7"]) expect(html).toContain(`>${number}<`);
    const zeros = render({}, { stats: [0, 0, 0], practised: 0 });
    expect(zeros.match(/>0</g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("offers the length in the same way for a scenario and a quiz", () => {
    const quiz = render({ mode: "quiz" });
    expect(quiz).toContain("10 questions");
    expect(quiz).toContain("20 questions");
    expect(quiz).toContain("30 questions");
    // the evacuation scenario has 10 situations: only 10 is offered
    const scenario = render({ mode: "scenario" });
    expect(scenario).toContain("10 questions");
    expect(scenario).not.toContain("20 questions");
  });

  it("hides the lengths the selected sections cannot fill, and offers All N below 10", () => {
    const two = render({ mode: "quiz", sections: ["S1", "S2"] });
    expect(two).toContain("All 7");
    expect(two).not.toContain("10 questions");
    const mid = render({ mode: "quiz", sections: ["S1", "S2", "S3", "S4", "S5", "S6"] });
    expect(mid).toContain("10 questions");
    expect(mid).toContain("20 questions");
    expect(mid).not.toContain("30 questions");
  });

  it("has the shuffle toggle for a quiz only", () => {
    expect(render({ mode: "quiz" })).toContain('aria-label="Shuffle questions"');
    expect(render({ mode: "scenario" })).not.toContain("Shuffle questions");
  });

  it("has Only topics to repeat, disabled with a hint when nothing is weak", () => {
    expect(render({}, { weak: [] })).toContain("Nothing to repeat yet.");
    const enabled = render({}, { weak: ["S3"] });
    expect(enabled).not.toContain("Nothing to repeat yet.");
    expect(enabled).toContain('aria-label="Only topics to repeat"');
  });

  it("shows how many guide sections are selected in a chevron row", () => {
    expect(html).toContain("10 selected");
    expect(render({ sections: ["S1", "S2", "S3"] })).toContain("3 selected");
  });

  it("offers no length when no section is selected", () => {
    const none = render({ sections: [] });
    expect(none).toContain("No questions in the selected sections.");
    expect(none).toContain("0 selected");
  });
});

describe("what the setup builds", () => {
  it("limits the questions to the sections to repeat when that toggle is on", () => {
    const choice = setupChoice(
      { ...defaultSetup, mode: "quiz", sections: all, onlyWeak: true },
      undefined,
      ["S3"],
    );
    expect(choice.sections).toEqual(["S3"]);
    expect(choice.available).toBe(4);
    expect(choice.length).toBe(4);
  });

  it("keeps the shuffle for a quiz only", () => {
    expect(
      setupChoice(
        { ...defaultSetup, mode: "scenario", sections: all, shuffle: true },
        undefined,
        [],
      ).shuffle,
    ).toBe(false);
    expect(
      setupChoice({ ...defaultSetup, mode: "quiz", sections: all, shuffle: true }, undefined, [])
        .shuffle,
    ).toBe(true);
  });
});
