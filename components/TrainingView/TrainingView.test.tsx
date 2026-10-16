import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrainingView } from "@/components/TrainingView/TrainingView";
import type { TrainingTopic } from "@/components/TrainingView/TrainingView";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { modeStats, partState, recommendedPart, weakCount } from "@/lib/part-progress";
import type { PartRecords } from "@/lib/part-progress";
import { modeItems, partsFor, sectionsWithParts } from "@/lib/parts";
import type { TrainingMode } from "@/lib/parts";
import type { FinishedSession } from "@/lib/session";

const noop = () => undefined;

function topicsFor(
  mode: TrainingMode,
  records: PartRecords | null = null,
  history: FinishedSession[] = [],
): TrainingTopic[] {
  const parts = partsFor(mode);
  return sectionsWithParts(mode).map((sectionId) => {
    const own = parts.filter((part) => part.sectionId === sectionId);
    const next = recommendedPart(own, records, null);
    return {
      sectionId,
      title: `Title of ${sectionId}`,
      toRepeat: weakCount(history, mode, sectionId),
      parts: own.map((part) => ({
        part,
        state: partState(part, records, null),
        recommended: next?.id === part.id,
      })),
    };
  });
}

function render(
  mode: TrainingMode,
  {
    records = null,
    history = [],
  }: { records?: PartRecords | null; history?: FinishedSession[] } = {},
) {
  return renderToStaticMarkup(
    <TrainingView
      guideName="Sample evacuation guide.pdf"
      mode={mode}
      onModeChange={noop}
      stats={modeStats(history, mode)}
      topics={topicsFor(mode, records, history)}
      records={records}
      onStartPart={noop}
    />,
  );
}

/** Every quiz part of S1 done with 100%, S2's part at 60%. */
const doneS1: PartRecords = {
  ...Object.fromEntries(
    partsFor("quiz")
      .filter((part) => part.sectionId === "S1")
      .map((part) => [
        part.id,
        { lastPercent: 100, attempts: 1, answeredIds: part.itemIds, correctIds: part.itemIds },
      ]),
  ),
  "quiz:S2:1": { lastPercent: 60, attempts: 2, answeredIds: [], correctIds: [] },
};

describe("Training layout", () => {
  const html = render("scenario");

  it("has the Back circle to Home, the large title and the guide name under it", () => {
    expect(html).toContain('aria-label="Back to Home"');
    expect(html).toContain('href="/"');
    expect(html.indexOf(">Training</h1>")).toBeLessThan(
      html.indexOf("Sample evacuation guide.pdf"),
    );
  });

  it("goes back, title, stats card, the switch, then the topic cards", () => {
    const order = [
      'aria-label="Back to Home"',
      ">Training<",
      "Questions",
      "Accuracy",
      "Scenario",
      "Title of S1",
    ].map((text) => html.indexOf(text));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("has no Session setup, no settings and no lock anywhere", () => {
    expect(html).not.toMatch(/Session setup|Shuffle|Only topics|Guide sections|lucide-lock/);
    expect(html).not.toMatch(/type="checkbox"|role="switch"/);
  });
});

describe("the stats card", () => {
  it("shows two columns with a divider, olive icon tiles, the answered count and the accuracy", () => {
    const html = render("quiz");
    expect(html).toContain(`0/${modeItems("quiz").length}`);
    expect(html).toContain(">0%<");
    expect(html.match(/bg-olive-tint/g)!.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain("w-px");
    expect(html).toContain("rounded-[28px] bg-card");
  });

  it("follows the mode", () => {
    expect(render("scenario")).toContain(`0/${modeItems("scenario").length}`);
    expect(render("quiz")).toContain(`0/${modeItems("quiz").length}`);
  });
});

describe("the switch and the Mini-quiz card", () => {
  it("is the segmented control, full width, 14px outer and 10px inner radius, with a hidden legend", () => {
    const html = render("quiz");
    expect(html).toContain("rounded-[14px]");
    expect(html).toContain("rounded-[10px]");
    expect(html).toContain('<legend class="sr-only">Mode</legend>');
    expect(html).toContain("flex-1");
  });

  it("shows the Mini-quiz card in Quiz mode only, linking to its screen", () => {
    const quiz = render("quiz");
    expect(quiz).toContain(">Mini-quiz<");
    expect(quiz).toContain("Choose topics and 5, 10 or 15 questions");
    expect(quiz).toContain('href="/mini-quiz?from=training"');
    expect(quiz.indexOf("Mini-quiz")).toBeGreaterThan(quiz.indexOf('name="training-mode'));
    expect(quiz.indexOf("Mini-quiz")).toBeLessThan(quiz.indexOf("Title of S1"));
    const scenario = render("scenario");
    expect(scenario).not.toContain("Mini-quiz");
    expect(scenario).not.toContain("/mini-quiz");
  });

  it("lists the topics that have questions in the mode: all 10 in quiz mode", () => {
    expect(render("scenario").match(/aria-labelledby="topic-/g)).toHaveLength(
      sectionsWithParts("scenario").length,
    );
    expect(render("quiz").match(/aria-labelledby="topic-/g)).toHaveLength(10);
  });

  it("is a plain segmented control (the existing component)", () => {
    const control = renderToStaticMarkup(
      <SegmentedControl
        name="x"
        legend="Mode"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
        value="a"
        onChange={noop}
      />,
    );
    expect(control).toContain('<legend class="type-body-strong mb-3">Mode</legend>');
  });
});

describe("a topic card and its parts", () => {
  const html = render("quiz", { records: doneS1 });

  it("has a numbered olive circle, the title in the label style and one row per part", () => {
    const card = html.slice(
      html.indexOf('aria-labelledby="topic-S1"'),
      html.indexOf('aria-labelledby="topic-S2"'),
    );
    expect(card).toContain(">1</span>");
    expect(card).toContain("type-label");
    expect(card).toContain("Title of S1");
    expect(card.match(/>Part \d</g)).toHaveLength(
      partsFor("quiz").filter((p) => p.sectionId === "S1").length,
    );
    expect(card).toMatch(/\d+ questions?/);
    expect(card).toContain("border-t border-border");
  });

  it("shows the Start pill on the next recommended part and a ring on a part that is done", () => {
    const s1 = html.slice(
      html.indexOf('aria-labelledby="topic-S1"'),
      html.indexOf('aria-labelledby="topic-S2"'),
    );
    expect(s1).not.toContain("data-pill");
    expect(s1).toContain('aria-label="Part 1: last result 100%"');
    expect(s1).toContain('aria-label="Part 2: last result 100%"');
    expect(s1).toContain("lucide-check");
    const s3 = html.slice(
      html.indexOf('aria-labelledby="topic-S3"'),
      html.indexOf('aria-labelledby="topic-S4"'),
    );
    expect(s3).toContain("data-pill");
    expect(s3).toContain(">Start<");
    expect(s3).not.toContain("<svg viewBox");
  });

  it("shows a grey ring with 0% when a part is not started and is not the recommended one", () => {
    const twoParts: TrainingTopic = {
      sectionId: "S1",
      title: "Title of S1",
      toRepeat: 0,
      parts: [
        { part: { ...partsFor("quiz")[0], n: 1 }, state: "done", recommended: false },
        {
          part: { ...partsFor("quiz")[0], n: 2, id: "quiz:S1:2" },
          state: "not started",
          recommended: false,
        },
      ],
    };
    const view = renderToStaticMarkup(
      <TrainingView
        guideName="G"
        mode="quiz"
        onModeChange={noop}
        stats={modeStats([], "quiz")}
        topics={[twoParts]}
        records={null}
        onStartPart={noop}
      />,
    );
    expect(view).toContain('aria-label="Part 2: not started"');
    expect(view).toContain("stroke-transparent");
    expect(view).toMatch(/Part 2: not started[\s\S]*text-text-secondary/);
  });

  it("is a row you can tap, with no lock", () => {
    expect(
      html.match(/<button type="button" class="flex min-h-16 w-full/g)!.length,
    ).toBeGreaterThan(5);
    expect(html).not.toMatch(/lucide-lock|aria-disabled|<button[^>]* disabled/);
  });

  it("shows Continue on a part that is in progress", () => {
    const [first] = partsFor("quiz");
    const view = renderToStaticMarkup(
      <TrainingView
        guideName="G"
        mode="quiz"
        onModeChange={noop}
        stats={modeStats([], "quiz")}
        topics={[
          {
            sectionId: "S1",
            title: "T",
            toRepeat: 0,
            parts: [{ part: first, state: "in progress", recommended: true }],
          },
        ]}
        records={null}
        onStartPart={noop}
      />,
    );
    expect(view).toContain(">Continue<");
    expect(view).not.toContain(">Start<");
  });
});

describe("the N to repeat chip", () => {
  it("shows N to repeat only on a topic with wrong answers", () => {
    const history: FinishedSession[] = [
      {
        kind: "quiz",
        itemIds: ["q-quiz-s01-001", "q-quiz-s01-002", "q-s2-1"],
        answers: [
          { itemId: "q-quiz-s01-001", optionId: "b" },
          { itemId: "q-quiz-s01-002", optionId: "a" },
          { itemId: "q-s2-1", optionId: "b" },
        ],
        finishedAt: 1,
      },
    ];
    const html = render("quiz", { history });
    const s1 = html.slice(
      html.indexOf('aria-labelledby="topic-S1"'),
      html.indexOf('aria-labelledby="topic-S2"'),
    );
    expect(s1).toContain("2 to repeat");
    const chip = s1.slice(
      s1.indexOf("<span", s1.indexOf("bg-olive-tint") - 120),
      s1.indexOf("</span>", s1.indexOf("2 to repeat")),
    );
    // the chip is the neutral olive tint with dark text: rose and red mean a wrong answer only
    expect(chip).toContain("bg-olive-tint");
    expect(chip).toContain("text-text");
    expect(html).not.toMatch(/pastel-rose|text-wrong|bg-wrong/);
    expect(chip).not.toContain("border");
    expect(chip).toContain("rounded-full");
    expect(html.match(/to repeat/g)).toHaveLength(1);
    expect(render("quiz")).not.toContain("to repeat");
  });
});

describe("the small primary pill", () => {
  it("is 36px high with a 12px radius, in the primary fill, and is not a second button in the row", () => {
    const html = render("quiz");
    const pill = html.slice(
      html.indexOf("<span data-pill"),
      html.indexOf("</span>", html.indexOf("<span data-pill")),
    );
    expect(pill).toContain("bg-primary text-primary-text");
    expect(pill).toContain("h-9!");
    expect(pill).toContain("rounded-xl!");
    expect(pill).not.toContain("w-full");
    const row = html.slice(
      html.indexOf("<button", html.indexOf("data-pill") - 600),
      html.indexOf("data-pill"),
    );
    expect(row).toContain("<button");
  });
});

describe("the Training screen source", () => {
  it("has bottom padding so the navigation never covers the last card", () => {
    expect(readFileSync("components/TrainingView/TrainingView.tsx", "utf8")).toContain("pb-6");
  });

  it("remembers the last mode and accepts a preselected one", () => {
    const page = readFileSync("app/(app)/training/page.tsx", "utf8");
    expect(page).toContain("saveTrainingMode");
    expect(page).toContain('useSearchParams().get("mode")');
  });
});
