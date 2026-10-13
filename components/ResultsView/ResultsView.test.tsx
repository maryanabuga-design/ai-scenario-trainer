import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";
import { scoreSession } from "@/lib/progress";
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
  phase: "feedback",
  finished: true,
  answers: [
    { stepId: "s1", optionId: "b", confidence: 3, explanation: "лбтдлюью" },
    { stepId: "s2", optionId: "c", confidence: 3, explanation: "x" },
    { stepId: "s3", optionId: "a", confidence: 3, explanation: "x" },
  ],
};

function render(current: ScenarioSession) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>
        <ResultsView
          results={{ kind: "scenario", mode: "short" }}
          items={scoreSession(current)}
          onRepeat={() => undefined}
        />
      </ActionBarProvider>
    </SourceSheetProvider>,
  );
}

describe("Results after My explanation is still correct", () => {
  it("labels the step Marked correct by you; the score depends only on the choice", () => {
    const before = render(session);
    const after = render(setMarkedCorrect(session, "s1", true));
    expect(before).not.toContain("Marked correct by you");
    expect(after).toContain("Marked correct by you");
    const correct = (html: string) => Number(/(\d)\/3 correct/.exec(html)?.[1]);
    expect(correct(after)).toBe(correct(before));
  });
});
