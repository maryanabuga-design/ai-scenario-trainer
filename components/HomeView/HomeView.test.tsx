import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";
import { HomeView } from "@/components/HomeView/HomeView";
import { SoftShape } from "@/components/SoftShape/SoftShape";
import type { HomeScenario } from "@/components/HomeView/HomeView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";
import { getStep } from "@/lib/scenario";
import { scoreItem } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";

const DIRECTION = "Building evacuation and first aid";

function renderHome(weakItems: ScoredItem[] = [], scenarios: HomeScenario[] = []) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <HomeView
        directionTitle={DIRECTION}
        unfinished={null}
        weakItems={weakItems}
        hasHistory={weakItems.length > 0}
        scenarios={scenarios}
        onRepeat={() => undefined}
        onStartScenario={() => undefined}
      />
    </SourceSheetProvider>,
  );
}

/** The opening tag of the element whose text is exactly `text`. */
function tagAround(html: string, text: string) {
  const end = html.indexOf(`>${text}<`);
  return html.slice(html.lastIndexOf("<", end), end + 1);
}

describe("Home eyebrow", () => {
  it("is a chip in the tag style, in sentence case, with no line under it", () => {
    const html = renderHome();
    const chip = tagAround(html, DIRECTION);
    expect(chip).toMatch(/^<span /);
    expect(chip).toContain("bg-pastel-yellow");
    expect(chip).toContain("type-label");
    expect(chip).toContain("normal-case");
    expect(html).not.toContain("h-px");
  });

  it("is a label, not something to tab to or press", () => {
    const chip = tagAround(renderHome(), DIRECTION);
    expect(chip).not.toContain("tabindex");
    expect(chip).not.toContain("active:");
  });
});

describe("Next up card", () => {
  it("has the strong soft shape behind its content", () => {
    const html = renderHome();
    const card = html.slice(html.indexOf('aria-labelledby="next-up-title"'));
    expect(card.slice(0, card.indexOf("</section>"))).toContain("<svg aria-hidden");
  });
});

// s2 c unsure: a guess on S2; s5 a unsure: a knowledge gap on S5.
const twoTopics = [scoreItem(getStep("s3"), "b"), scoreItem(getStep("s5"), "a")];
const oneTopic = [scoreItem(getStep("s3"), "b")];

/** The markup of the topic row: the list and the dots after it. */
function topicRow(html: string) {
  const start = html.indexOf('aria-labelledby="topics-title"');
  return html.slice(start, html.indexOf("</section>", start));
}

describe("Topics on Home", () => {
  it("has only the heading, no See all", () => {
    const html = renderHome(twoTopics);
    expect(html).toContain(">Topics</h2>");
    expect(html).not.toContain("See all");
  });

  it("keeps the Weak topics page one tap away through the Next up arrow", () => {
    const html = renderHome(twoTopics);
    const card = html.slice(html.indexOf('aria-labelledby="next-up-title"'));
    expect(card.slice(0, card.indexOf("</section>"))).toContain('href="/weak-topics"');
  });

  it("shows no repeat count or progress on topic cards", () => {
    const row = topicRow(renderHome(twoTopics));
    expect(row).not.toMatch(/to repeat|repeated/i);
    expect(row).toContain("Evacuation guide · S2");
  });

  it("uses the shared ArrowCircle on topic cards", () => {
    const arrow = renderToStaticMarkup(<ArrowCircle />);
    const row = topicRow(renderHome(twoTopics));
    expect(row.split(arrow)).toHaveLength(3);
  });

  it("shows one dot per topic with a text alternative, and none for a single topic", () => {
    const row = topicRow(renderHome(twoTopics));
    expect(row.match(/h-2 w-2 rounded-full bg-(primary|secondary-sand)/g)).toHaveLength(2);
    expect(row).toContain("Card 1 of 2");
    expect(
      topicRow(renderHome(oneTopic)).match(/h-2 w-2 rounded-full bg-(primary|secondary-sand)/g),
    ).toBeNull();
  });
});

describe("New scenario card", () => {
  const scenarios: HomeScenario[] = [
    {
      id: "evacuation-guide",
      title: "Fire alarm in a training centre",
      line: "Short: 3 decisions, about 5 min.",
      onOpen: () => undefined,
    },
  ];
  const card = () => {
    const html = renderHome([], scenarios);
    const start = html.indexOf('aria-labelledby="new-title"');
    return html.slice(start, html.indexOf("</section>", start));
  };

  it("shows only the Short line", () => {
    expect(card()).toContain("Short: 3 decisions, about 5 min.");
    expect(card()).not.toContain("Full:");
    expect(card()).not.toContain("Or take a quiz");
  });

  it("keeps the tag, uses the shared ArrowCircle and the faint soft shape", () => {
    expect(card()).toContain(">Scenario<");
    expect(card()).toContain(renderToStaticMarkup(<ArrowCircle />));
    expect(card()).toContain(renderToStaticMarkup(<SoftShape variant="faint" />));
  });
});
