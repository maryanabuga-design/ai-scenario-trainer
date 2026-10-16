import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { ResultsActions, ResultsView } from "@/components/ResultsView/ResultsView";
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
  scoreItem(getItem("q-scn-s01-001"), "d"),
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
    index < right ? scoreItem(getItem("s2"), "c") : scoreItem(getItem("q-scn-s01-001"), "d"),
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

  it("follows with one conclusion and the Weak topics card, and has no Your answers list", () => {
    expect(html).toContain("2 answers need another look in the guide.");
    expect(html.indexOf("Weak topics")).toBeGreaterThan(html.indexOf("PASS MARK"));
    expect(html).not.toContain("Your answers");
    expect(html).not.toContain("/session/results/review/");
    expect(html).not.toMatch(/aria-label="(Not right|Right)"/);
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

  it("has the Back arrow to Home as the only way out: no Back to Home button", () => {
    expect(html).toContain('aria-label="Back to Home" class');
    expect(html).toContain('href="/"');
    expect(html.match(/Back to Home/g)).toHaveLength(1);
    const source = readFileSync("components/ResultsView/ResultsView.tsx", "utf8");
    expect(source).not.toMatch(/>\s*Back to Home\s*</);
    expect(source).not.toContain("Start a new session");
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

describe("the Results buttons", () => {
  const pair = renderToStaticMarkup(<ResultsActions canRepeat onRepeat={() => undefined} />);

  it("puts Review answers (secondary) first and Repeat weak topics (primary) second, so a row reads left to right", () => {
    expect(pair.indexOf("Review answers")).toBeLessThan(pair.indexOf("Repeat weak topics"));
    const review = pair.slice(pair.indexOf("<a "), pair.indexOf("</a>"));
    expect(review).toContain("bg-olive-tint");
    expect(review).toContain('href="/session/results/review/1"');
    expect(pair.slice(pair.indexOf("<button"))).toContain("bg-primary");
  });

  it("is a row that wraps by itself, with the primary on top when it wraps and no script", () => {
    expect(pair).toContain("flex flex-wrap-reverse gap-3");
    expect(pair).toContain("[&amp;&gt;div]:flex-[1_1_11.5rem]");
    expect(pair).toContain("[&amp;&gt;div]:whitespace-nowrap");
    expect(pair.match(/<div>/g)).toHaveLength(2);
    const source = readFileSync("components/ResultsView/ResultsView.tsx", "utf8");
    expect(source).not.toMatch(/getBoundingClientRect|offsetWidth|ResizeObserver|matchMedia/);
  });

  it("keeps the labels and the shared button size: 52px, 14px radius, 16px side padding", () => {
    expect(pair).toContain(">Review answers<");
    expect(pair).toContain(">Repeat weak topics<");
    expect(pair.match(/h-\[52px\]/g)).toHaveLength(2);
    expect(pair.match(/rounded-button/g)).toHaveLength(2);
    expect(pair.match(/ px-4 /g)).toHaveLength(2);
    expect(pair).not.toMatch(/truncate|text-ellipsis|type-small/);
  });

  it("shows Review answers alone, full width, when there is nothing to repeat", () => {
    const alone = renderToStaticMarkup(
      <ResultsActions canRepeat={false} onRepeat={() => undefined} />,
    );
    expect(alone).toContain("Review answers");
    expect(alone).not.toContain("Repeat weak topics");
    expect(alone).not.toContain("flex-wrap-reverse");
    expect(alone).toContain("w-full");
  });
});

describe("Back on Results", () => {
  const items = [scoreItem(getItem("q-scn-s01-001"), "d")];
  const back = (backHref?: string) =>
    renderToStaticMarkup(
      <SourceSheetProvider sections={loadAllSections()}>
        <ActionBarProvider>
          <ResultsView
            kind="scenario"
            items={items}
            topics={weakTopics(items)}
            backHref={backHref}
            onRepeat={() => undefined}
          />
        </ActionBarProvider>
      </SourceSheetProvider>,
    );

  it("goes Home by default", () => {
    expect(back()).toContain('aria-label="Back to Home"');
  });

  it("goes back to the Training screen with the same mode for a part session", () => {
    const html = back("/training?mode=quiz");
    expect(html).toContain('aria-label="Back to Training"');
    expect(html).toContain('href="/training?mode=quiz"');
    expect(html).not.toContain('aria-label="Back to Home"');
  });
});
