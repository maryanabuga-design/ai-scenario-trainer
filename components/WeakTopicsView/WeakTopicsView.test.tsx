import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { WeakTopicsView } from "@/components/WeakTopicsView/WeakTopicsView";
import { loadAllSections } from "@/lib/guide";
import { getItem } from "@/lib/items";
import { scoreItem } from "@/lib/scoring";
import type { WeakTopic } from "@/lib/weak-topics";

const topic = (sectionId: string, wrongAnswers: number): WeakTopic => ({
  sectionId,
  icon: "DoorOpen",
  items: Array.from({ length: wrongAnswers }, () => scoreItem(getItem("q-scn-s01-001"), "d")),
});

function render(topics: WeakTopic[], selected: string[]) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>
        <WeakTopicsView
          topics={topics}
          selected={selected}
          backHref="/session/results"
          backLabel="Back to results"
          onToggle={() => undefined}
          onRepeat={() => undefined}
        />
      </ActionBarProvider>
    </SourceSheetProvider>,
  );
}

describe("Weak topics page", () => {
  const html = render([topic("S1", 2), topic("S2", 1)], ["S1"]);

  it("is one flat list with no groups or headings by error type", () => {
    expect(html).not.toMatch(/Misconception|Knowledge gap|Guesses|<legend[^>]*>(?!Weak topics)/);
    expect(html.match(/<fieldset/g)).toHaveLength(1);
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
  });

  it("shows each section with its number of answers to repeat, and the 3D-icon slot fallback", () => {
    expect(html).toContain("Evacuation guide · S1");
    expect(html).toContain("2 to repeat");
    expect(html).toContain("1 to repeat");
    expect(html.match(/h-9 w-9/g)).toHaveLength(2);
    expect(html).toContain('stroke-width="1.75"');
  });

  it("has the back button where the person came from", () => {
    expect(html).toContain('aria-label="Back to results"');
    expect(html).toContain('href="/session/results"');
  });

  it("says nothing to repeat when no section is weak", () => {
    const empty = render([], []);
    expect(empty).toContain("Nothing to repeat.");
    expect(empty).not.toContain("Repeat selected");
  });
});
