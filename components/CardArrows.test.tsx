import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { MaterialsList } from "@/components/MaterialsList/MaterialsList";
import { NextUpCard } from "@/components/NextUpCard/NextUpCard";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { TopicCard } from "@/components/TopicCard/TopicCard";
import { loadAllSections } from "@/lib/guide";
import { sampleMaterials } from "@/lib/materials";
import { getStep } from "@/lib/scenario";
import { scoreStep } from "@/lib/scoring";
import { weakTopics } from "@/lib/weak-topics";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/",
}));

const withSheet = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>{node}</ActionBarProvider>
    </SourceSheetProvider>,
  );

/** The text block holding `text`: its nearest ancestor that carries the clearance. */
function clearedBlock(html: string, text: string) {
  const at = html.indexOf(text);
  return html.lastIndexOf("pr-14", at) > html.lastIndexOf("absolute top-4 right-4", at);
}

describe("long titles never run under the corner circle (360px)", () => {
  const topic = weakTopics([scoreStep(getStep("s4"), "a", 3)])[0];

  it("Home topic card", () => {
    const html = withSheet(<TopicCard topic={topic} onRepeat={() => undefined} />);
    expect(html).toContain("absolute top-4 right-4");
    expect(clearedBlock(html, "type-item-title")).toBe(true);
  });

  it("Next up card", () => {
    const html = withSheet(
      <NextUpCard
        next={{
          kind: "repeat",
          title: "12 topics to repeat across both guides",
          detail: "3 misconceptions, 5 knowledge gaps, 4 guesses",
          action: "Repeat weak topics",
          linksToTopics: true,
        }}
        onRepeat={() => undefined}
        onStartScenario={() => undefined}
      />,
    );
    expect(html).toContain("absolute top-4 right-4");
    expect(clearedBlock(html, "12 topics to repeat across both guides")).toBe(true);
  });

  it("Progress repeat card", () => {
    const html = withSheet(
      <ProgressView
        history={[
          {
            mode: "short",
            finishedAt: 1,
            answers: [{ stepId: "s4", optionId: "a", confidence: 3, explanation: "" }],
          },
        ]}
        onRepeat={() => undefined}
      />,
    );
    expect(clearedBlock(html, "to repeat</h2>")).toBe(true);
  });
});

describe("the plain chevron stays centred", () => {
  it("on Materials cards, vertically centred on the right", () => {
    const html = withSheet(<MaterialsList samples={sampleMaterials} />);
    const chevron = html.indexOf("lucide-chevron-right");
    const wrapper = html.slice(html.lastIndexOf("<span", chevron), chevron);
    expect(wrapper).toContain("self-center");
    expect(wrapper).not.toContain("absolute");
  });
});
