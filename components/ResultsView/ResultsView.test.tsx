import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import {
  ResultsActions,
  ResultsButtons,
  ResultsView,
  backLabelFor,
} from "@/components/ResultsView/ResultsView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { PASS_MARK } from "@/lib/config";
import { loadAllSections } from "@/lib/guide";
import { getItem } from "@/lib/items";
import { displayPercent, isPassed, passCount, resultPercent } from "@/lib/results";
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

  it("starts with Back and the title Results, then the hero, headline, the percentage, the count and the bar with the pass mark in percent", () => {
    const order = [
      'aria-label="Back to Home"',
      ">Results<",
      "data-picture-frame",
      "Not passed yet",
      "33%",
      "1 of 3 correct",
      'role="progressbar"',
      "Pass mark: 80%",
    ].map((text) => html.indexOf(text));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("shows the percentage large and centred, once for assistive technology, with the exact count under it", () => {
    expect(html).toMatch(/aria-hidden="true" class="type-score text-center">33%</);
    expect(html).toContain('aria-valuenow="33"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuetext="33 percent, pass mark 80 percent"');
    expect(html).toContain("width:33%");
    expect(html).toContain('style="left:80%"');
    expect(html.indexOf("type-score")).toBeLessThan(html.indexOf("1 of 3 correct"));
    expect(html).not.toContain("PASS MARK");
    expect(html).not.toMatch(/Pass mark: \d+ of \d+/);
  });

  it("follows with one conclusion and the Weak topics card, and has no Your answers list", () => {
    expect(html).toContain("2 answers need another look in the guide.");
    expect(html.indexOf("Weak topics")).toBeGreaterThan(html.indexOf("Pass mark"));
    expect(html).not.toContain("Your answers");
    expect(html).not.toContain("/session/results/review/");
    expect(html).not.toMatch(/aria-label="(Not right|Right)"/);
  });

  it("makes the Weak topics card a link: icon tile, the text with name chips, and the ArrowCircle", () => {
    const start = html.lastIndexOf("<a ", html.indexOf("Weak topics"));
    const card = html.slice(start, html.indexOf("</a>", start));
    expect(card).toContain('href="/weak-topics?from=results"');
    expect(card).toContain("2 topics to repeat");
    expect(card).toContain("S1 · Responding to an alarm");
    expect(card).toContain("S2 · Checking the route");
    expect(card).toContain("border-arrow-stroke");
    // the 48px round tile with the 24px icon comes first, aligned with the title row, hidden from assistive technology
    expect(card).toMatch(
      /data-weak-icon="true" aria-hidden="true"[^>]*h-12 w-12 shrink-0[^>]*self-start rounded-full bg-chip-neutral-bg text-text/,
    );
    expect(card).toContain("lucide-list-checks");
    expect(card).toContain('width="24"');
    expect(card.indexOf("data-weak-icon")).toBeLessThan(card.indexOf("Weak topics"));
    // the chips are the shared sand chips, one line, cut with an ellipsis, no icons
    expect(card).toContain("bg-pastel-sand");
    expect(card).toContain('class="truncate"');
    expect(card).toContain("max-w-full");
    expect((card.match(/<svg/g) ?? []).length).toBe(2); // the tile icon and the arrow
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
    expect(below).toContain("79 of 100 correct");
    expect(below).toContain("Pass mark: 80%");
    const at = render(result(80, 100));
    expect(isPassed(result(80, 100))).toBe(true);
    expect(at).toContain(">Passed<");
    expect(at).not.toContain("Not passed yet");
    expect(at).toContain('aria-valuenow="80"');
    expect(passCount(100)).toBe(80);
    expect(passCount(10)).toBe(8);
    expect(passCount(20)).toBe(16);
    expect(passCount(3)).toBe(3);
    expect(passCount(0)).toBe(0);
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

describe("exam results and the repeat-session summary", () => {
  const draw = (right: number, total: number) => result(right, total);
  const view = (
    kind: "exam" | "repeat",
    list: ScoredItem[],
    extra: Partial<Parameters<typeof ResultsView>[0]> = {},
  ) =>
    renderToStaticMarkup(
      <SourceSheetProvider sections={loadAllSections()}>
        <ActionBarProvider>
          <ResultsView
            kind={kind}
            items={list}
            topics={weakTopics(list)}
            backHref="/exam?id=e"
            backLabel="Back to Exam"
            onRepeat={() => undefined}
            {...extra}
          />
        </ActionBarProvider>
      </SourceSheetProvider>,
    );
  const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  it("an exam shows 85% with '17 of 20 correct' under it and the pass mark in percent", () => {
    const html = view("exam", draw(17, 20));
    expect(text(html)).toContain("85%");
    expect(text(html)).toContain("17 of 20 correct");
    expect(html).toContain("Pass mark: 80%");
    expect(html).toContain('aria-valuetext="85 percent, pass mark 80 percent"');
  });

  const buttons = (
    kind: "exam" | "repeat",
    passed: boolean,
    extra: Partial<Parameters<typeof ResultsButtons>[0]> = {},
  ) =>
    renderToStaticMarkup(
      <ResultsButtons
        kind={kind}
        passed={passed}
        canRepeat
        examRepeat={false}
        onRepeat={() => undefined}
        doneHref="/exam?id=e"
        {...extra}
      />,
    );

  it("a passed exam has the Primary Done to the exam screen, and no repeat button", () => {
    const html = buttons("exam", true);
    expect(html).toContain(">Done<");
    expect(html).not.toContain("Repeat weak topics");
    expect(html).not.toContain("Back to exam");
    const done = html.slice(0, html.indexOf(">Done<"));
    const link = done.slice(done.lastIndexOf("<a "));
    expect(link).toContain('href="/exam?id=e"');
    expect(link).toContain("bg-primary");
    expect(html).toContain(">Review answers<");
  });

  it("a failed exam has the Primary Repeat weak topics and the Secondary Back to exam", () => {
    const html = buttons("exam", false);
    expect(html.indexOf(">Repeat weak topics<")).toBeLessThan(html.indexOf(">Back to exam<"));
    const repeat = html.slice(0, html.indexOf(">Repeat weak topics<"));
    expect(repeat.slice(repeat.lastIndexOf("<button"))).toContain("bg-primary");
    const back = html.slice(0, html.indexOf(">Back to exam<"));
    expect(back.slice(back.lastIndexOf("<a "))).toContain("bg-olive-tint");
    expect(html).not.toContain(">Done<");
    expect(html).toContain(">Review answers<");
  });

  it("a repeat session for an exam has Done", () => {
    const html = buttons("repeat", false, { examRepeat: true });
    expect(html).toContain(">Done<");
    expect(html).not.toContain("Back to exam");
  });

  it("a plain repeat round keeps the Review / Repeat row", () => {
    const html = buttons("repeat", false);
    expect(html).toContain("flex flex-wrap-reverse");
    expect(html).not.toContain(">Done<");
  });

  it("a repeat session for an exam shows the percentage and the count, and no readiness line", () => {
    const html = view("repeat", draw(7, 10), { examRepeat: true });
    expect(text(html)).toContain("70%");
    expect(text(html)).toContain("7 of 10 correct");
    expect(text(html)).not.toMatch(/Readiness|→/);
    expect(html).toContain("Pass mark: 80%");
  });

  it("Review answers is a Secondary button next to Done, never a text link", () => {
    for (const html of [
      buttons("exam", true),
      buttons("exam", false),
      buttons("repeat", false, { examRepeat: true }),
    ]) {
      const review = html.slice(0, html.indexOf(">Review answers<"));
      const link = review.slice(review.lastIndexOf("<a "));
      expect(link).toContain("bg-olive-tint");
      expect(link).not.toContain("underline");
      expect(html).not.toContain("type-action");
    }
  });

  it("a plain repeat round shows its percentage like any result", () => {
    expect(text(view("repeat", draw(7, 10)))).toContain("70%");
  });
});

describe("the percentage on Results", () => {
  const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const shown = (right: number, total: number) => displayPercent(result(right, total));

  it("is a whole percent rounded half up", () => {
    expect(shown(1, 3)).toBe(33);
    expect(shown(2, 3)).toBe(67);
    expect(shown(3, 4)).toBe(75);
    expect(shown(1, 8)).toBe(13); // 12.5 rounds up
    expect(shown(159, 200)).toBe(80); // 79.5 rounds up
  });

  it("shows 0% only when nothing was right and 100% only when everything was", () => {
    expect(shown(0, 4)).toBe(0);
    expect(shown(4, 4)).toBe(100);
    expect(shown(0, 1)).toBe(0);
    expect(shown(1, 1)).toBe(100);
    expect(shown(1, 300)).toBe(1); // 0.33% would round to 0
    expect(shown(299, 300)).toBe(99); // 99.67% would round to 100
    expect(shown(0, 0)).toBe(0);
  });

  it("never decides the pass: 159 of 200 shows 80% and is still not passed", () => {
    const list = result(159, 200);
    expect(displayPercent(list)).toBe(80);
    expect(isPassed(list)).toBe(false);
    const html = render(list);
    expect(html).toContain("Not passed yet");
    expect(html).toContain('aria-valuenow="80"');
    expect(html).toContain("159 of 200 correct");
    // exactly at the pass mark and just below
    expect(isPassed(result(160, 200))).toBe(true);
    expect(isPassed(result(4, 5))).toBe(true);
    expect(isPassed(result(3, 4))).toBe(false);
    expect(isPassed(result(0, 0))).toBe(false);
  });

  it("fills the bar to the shown percentage and puts the marker at the pass mark", () => {
    for (const [right, total, width] of [
      [3, 4, 75],
      [1, 1, 100],
      [0, 1, 0],
      [9, 10, 90],
    ]) {
      const html = render(result(right, total));
      expect(html).toContain(`width:${width}%`);
      expect(html).toContain('style="left:80%"');
      expect(html).toContain(`aria-valuenow="${width}"`);
    }
  });

  it("handles one question (0% or 100%) and no answers", () => {
    expect(text(render(result(0, 1)))).toContain("0 of 1 correct");
    expect(text(render(result(1, 1)))).toContain("1 of 1 correct");
    expect(text(render(result(0, 0)))).toContain("0 of 0 correct");
    expect(render(result(1, 1))).toContain(">Passed<");
  });

  it("uses a fixed large style that fits 360px: the biggest value is 100%", () => {
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toMatch(
      /@utility type-score \{\s*font-size: 48px;\s*line-height: 52px;\s*font-weight: 600;/,
    );
    expect(render(result(1, 1))).toContain(">100%<");
  });
});

describe("the Weak topics chips", () => {
  it("cut a long topic name with an ellipsis on one line and keep one chip per topic", () => {
    const html = render(items);
    const chips = html.match(/<span class="truncate">[^<]+<\/span>/g) ?? [];
    expect(chips).toHaveLength(weakTopics(items).length);
    expect(html).toContain("whitespace-nowrap"); // the chip itself never wraps its text
  });

  it("show only the code when the topic name is unknown", () => {
    const unknown = [scoreItem({ ...getItem("s2"), guideRef: ["Z9"], section: "Z9" }, "a")];
    const html = render(unknown);
    expect(html).toContain('<span class="truncate">Z9</span>');
  });
});

describe("a passed practice result has one Primary: Done", () => {
  const passedHtml = (extra?: { backHref?: string; doneHref?: string }) =>
    renderToStaticMarkup(
      <SourceSheetProvider sections={loadAllSections()}>
        <ActionBarProvider>
          <ResultsView
            kind="quiz"
            items={result(9, 10)}
            topics={weakTopics(result(9, 10))}
            onRepeat={() => undefined}
            {...extra}
          />
        </ActionBarProvider>
      </SourceSheetProvider>,
    );
  const buttons = (passed: boolean, canRepeat = true) =>
    renderToStaticMarkup(
      <ResultsButtons
        kind="quiz"
        passed={passed}
        canRepeat={canRepeat}
        examRepeat={false}
        onRepeat={() => undefined}
        doneHref="/materials/read/S2"
      />,
    );

  it("shows Done (Primary, to where the practice was opened from) and Review answers (Secondary), no Repeat", () => {
    const html = buttons(true);
    expect(html).toContain(">Done<");
    expect(html).toContain(">Review answers<");
    expect(html).not.toContain("Repeat weak topics");
    const done = html.slice(
      html.lastIndexOf("<a ", html.indexOf(">Done<")),
      html.indexOf(">Done<"),
    );
    expect(done).toContain('href="/materials/read/S2"');
    expect(done).toContain("bg-primary");
    const review = html.slice(
      html.lastIndexOf("<a ", html.indexOf(">Review answers<")),
      html.indexOf(">Review answers<"),
    );
    expect(review).toContain("bg-olive-tint");
    // the same row as before: Review on the left, the Primary on the right and last
    expect(html).toContain("flex-wrap-reverse");
    expect(html.indexOf(">Review answers<")).toBeLessThan(html.indexOf(">Done<"));
    expect((html.match(/(?<![-\w:])bg-primary(?![-\w])/g) ?? []).length).toBe(1);
  });

  it("is unchanged when not passed: Primary Repeat weak topics, Secondary Review answers, no Done", () => {
    const html = buttons(false);
    expect(html).toContain(">Repeat weak topics<");
    expect(html).toContain(">Review answers<");
    expect(html).not.toContain(">Done<");
    expect(html.indexOf(">Review answers<")).toBeLessThan(html.indexOf(">Repeat weak topics<"));
  });

  it("without anything to repeat a result that is not passed still shows only Review answers", () => {
    const html = buttons(false, false);
    expect(html).toContain(">Review answers<");
    expect(html).not.toContain(">Done<");
  });

  it("Done and the Back arrow lead to the same place", () => {
    const html = passedHtml({ backHref: "/materials/read/S2" });
    expect(html).toContain('aria-label="Back to topic"');
    expect(html).toContain('href="/materials/read/S2"');
    // the buttons are drawn through the action bar portal: Done takes the same address as Back
    const source = readFileSync("components/ResultsView/ResultsView.tsx", "utf8");
    expect(source).toContain("doneHref={doneHref ?? backHref}");
    expect(passedHtml()).toContain('href="/"');
  });

  it("names the place Back goes to", () => {
    expect(backLabelFor("/")).toBe("Back to Home");
    expect(backLabelFor("/training?mode=quiz")).toBe("Back to Training");
    expect(backLabelFor("/materials/read/S1")).toBe("Back to topic");
    expect(backLabelFor("/materials")).toBe("Back to Materials");
    expect(backLabelFor("/progress")).toBe("Back to Progress");
    expect(backLabelFor("/exam?id=e")).toBe("Back to Exam");
  });

  it("puts the focus on the title when Results opens", () => {
    expect(passedHtml()).toMatch(/<h1 tabindex="-1"[^>]*>Results<\/h1>/);
  });

  it("the exam result already has Done as its only Primary", () => {
    const html = renderToStaticMarkup(
      <ResultsButtons
        kind="exam"
        passed
        canRepeat
        examRepeat={false}
        onRepeat={() => undefined}
        doneHref="/exam?id=e"
      />,
    );
    expect(html).toContain(">Done<");
    expect((html.match(/(?<![-\w:])bg-primary(?![-\w])/g) ?? []).length).toBe(1);
  });
});
