import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeView } from "@/components/HomeView/HomeView";
import type { HomeScenario } from "@/components/HomeView/HomeView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";
import { getStep } from "@/lib/scenario";
import { scoreStep } from "@/lib/scoring";
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
    expect(chip).toContain("bg-tag-yellow");
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
