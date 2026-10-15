import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { PASS_MARK } from "@/lib/config";
import { loadAllSections } from "@/lib/guide";
import { getItem } from "@/lib/items";
import { isPassed, resultPercent } from "@/lib/results";
import { scoreItem } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";
import { weakTopics } from "@/lib/weak-topics";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/session/results",
}));

// s1 wrong, s2 right, s3 wrong: 1 of 3.
const items = [
  scoreItem(getItem("s1"), "d"),
  scoreItem(getItem("s2"), "c"),
  scoreItem(getItem("s3"), "b"),
];

function render(list: ScoredItem[]) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>
        <ResultsView
          kind="scenario"
          items={list}
          topics={weakTopics(list)}
          onRepeat={() => undefined}
        />
      </ActionBarProvider>
    </SourceSheetProvider>,
  );
}

/** A result of exactly `right` correct answers out of `total`. */
function result(right: number, total: number): ScoredItem[] {
  return Array.from({ length: total }, (_, index) =>
    index < right ? scoreItem(getItem("s2"), "c") : scoreItem(getItem("s1"), "d"),
  );
}

describe("Results", () => {
  const html = render(items);

  it("has no Outcome card, no Error types card and no error types anywhere", () => {
    expect(html).not.toMatch(/Outcome|Error types|Step by step|Misconception|Knowledge gap|Guess/);
    expect(html).not.toContain("Time lost");
  });

  it("starts with Back and the title Results, then the hero, headline, percentage and pass mark", () => {
    const order = [
      'aria-label="Back to Home"',
      ">Results<",
      "data-media3d",
      "Not passed yet",
      "33%",
      'role="meter"',
      "PASS MARK: 80%",
    ].map((text) => html.indexOf(text));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain(">0<");
    expect(html).toContain(">100<");
  });

  it("follows with one conclusion, the Weak topics card and Your answers", () => {
    expect(html).toContain("2 answers need another look in the guide.");
    const card = html.indexOf("Weak topics");
    expect(card).toBeGreaterThan(html.indexOf("PASS MARK"));
    expect(html.indexOf("Your answers")).toBeGreaterThan(card);
  });

  it("makes the Weak topics card a link with an ArrowCircle and the section tags", () => {
    const start = html.lastIndexOf("<a ", html.indexOf("Weak topics"));
    const card = html.slice(start, html.indexOf("</a>", start));
    expect(card).toContain('href="/weak-topics?from=results"');
    expect(card).toContain("2 topics to repeat");
    expect(card).toContain(">S1<");
    expect(card).toContain(">S2<");
    expect(card).toContain("border-arrow-stroke");
  });

  it("lists every answer in order, each with a check or a cross and a link to its review", () => {
    items.forEach((item, index) => {
      expect(html).toContain(`href="/session/results/review/${index + 1}"`);
      expect(html).toContain(item.title);
    });
    expect(html.match(/aria-label="Not right"/g)).toHaveLength(2);
    expect(html.match(/aria-label="Right"/g)).toHaveLength(1);
    expect(html.match(/\/session\/results\/review\//g)).toHaveLength(3);
  });

  it("shows no Weak topics card when nothing is wrong", () => {
    const clean = render(result(3, 3));
    expect(clean).not.toContain("/weak-topics");
    expect(clean).toContain("Every answer was right.");
  });
});

describe("the pass mark", () => {
  it("is one constant, 80", () => {
    expect(PASS_MARK).toBe(80);
  });

  it("makes 79% Not passed yet and 80% Passed, in the headline and the bar", () => {
    const below = render(result(79, 100));
    expect(resultPercent(result(79, 100))).toBe(79);
    expect(isPassed(result(79, 100))).toBe(false);
    expect(below).toContain("Not passed yet");
    expect(below).toContain('aria-valuenow="79"');
    const at = render(result(80, 100));
    expect(isPassed(result(80, 100))).toBe(true);
    expect(at).toContain(">Passed<");
    expect(at).not.toContain("Not passed yet");
    expect(at).toContain('aria-valuenow="80"');
    expect(at).toContain('style="left:80%"');
  });
});
