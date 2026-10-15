import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { PASS_MARK } from "@/lib/config";
import { loadAllSections } from "@/lib/guide";
import { scoreSession } from "@/lib/progress";
import { isPassed, resultPercent } from "@/lib/results";
import { getStep } from "@/lib/scenario";
import { scoreStep } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";
import { setMarkedCorrect } from "@/lib/session";
import type { ScenarioSession } from "@/lib/session";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/session/results",
}));

const session: ScenarioSession = {
  mode: "short",
  stepIds: ["s1", "s2", "s3"],
  index: 2,
  finished: true,
  answers: [
    { stepId: "s1", optionId: "b", confidence: 3, explanation: "лбтдлюью" },
    { stepId: "s2", optionId: "c", confidence: 3, explanation: "x" },
    { stepId: "s3", optionId: "b", confidence: 3, explanation: "x" },
  ],
};

function render(items: ScoredItem[]) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>
        <ResultsView
          results={{ kind: "scenario", mode: "short" }}
          items={items}
          onRepeat={() => undefined}
        />
      </ActionBarProvider>
    </SourceSheetProvider>,
  );
}

/** One item scoring a given share, so the percentage can be set exactly. */
function scoring(score: number): ScoredItem[] {
  return [{ ...scoreStep(getStep("s1"), "b", 3), score, correct: score === 1 }];
}

describe("Results", () => {
  const html = render(scoreSession(session));

  it("has no Outcome card, no ring and no Step by step card any more", () => {
    expect(html).not.toContain("Outcome");
    expect(html).not.toContain("Step by step");
    expect(html).not.toMatch(/stroke-ring|correct<\/h2>/);
    expect(html).not.toContain("Time lost");
  });

  it("starts with the hero slot, then the headline, then the percentage and the pass mark", () => {
    const hero = html.indexOf("data-hero-fallback");
    const headline = html.indexOf("Not passed yet");
    expect(headline).toBeGreaterThan(-1);
    const percent = html.indexOf('role="meter"');
    const mark = html.indexOf(`Pass mark ${PASS_MARK}%`);
    expect(hero).toBeGreaterThan(-1);
    expect(hero).toBeLessThan(headline);
    expect(headline).toBeLessThan(percent);
    expect(percent).toBeLessThan(mark);
  });

  it("follows with the Error types card and Your answers, then the actions", () => {
    const types = html.indexOf("Error types");
    const answers = html.indexOf("Your answers");
    expect(types).toBeGreaterThan(html.indexOf('role="meter"'));
    expect(answers).toBeGreaterThan(types);
  });

  it("lists every answer, in order, each linking to its own review", () => {
    const items = scoreSession(session);
    items.forEach((item, index) => {
      expect(html).toContain(`href="/session/results/review/${index + 1}"`);
      expect(html).toContain(item.title);
    });
    expect(html.match(/\/session\/results\/review\//g)).toHaveLength(items.length);
    expect(html).toContain('aria-label="Right"');
    expect(html).toContain('aria-label="Not right"');
  });
});

describe("the pass mark", () => {
  it("is one constant, 80 by default", () => {
    expect(PASS_MARK).toBe(80);
  });

  it("makes 79% Not passed yet and 80% Passed, in the headline and the marker", () => {
    const below = render(scoring(0.79));
    expect(resultPercent(scoring(0.79))).toBe(79);
    expect(isPassed(scoring(0.79))).toBe(false);
    expect(below).toContain("Not passed yet");
    expect(below).toContain("79%");
    expect(below).toContain('aria-valuenow="79"');

    const at = render(scoring(0.8));
    expect(isPassed(scoring(0.8))).toBe(true);
    expect(at).toContain(">Passed<");
    expect(at).toContain("80%");
    expect(at).not.toContain("Not passed yet");
    expect(at).toContain('style="left:80%"');
  });

  it("rounds the percentage down, so 79.6% is never a pass", () => {
    expect(resultPercent(scoring(0.796))).toBe(79);
    expect(isPassed(scoring(0.796))).toBe(false);
  });
});

describe("Marked correct by you", () => {
  it("labels the answer on Results and leaves the score alone", () => {
    const before = render(scoreSession(session));
    const after = render(scoreSession(setMarkedCorrect(session, "s1", true)));
    expect(before).not.toContain("Marked correct by you");
    expect(after).toContain("Marked correct by you");
    expect(resultPercent(scoreSession(setMarkedCorrect(session, "s1", true)))).toBe(
      resultPercent(scoreSession(session)),
    );
  });
});
