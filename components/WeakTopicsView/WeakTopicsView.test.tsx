import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { WeakTopicsView } from "@/components/WeakTopicsView/WeakTopicsView";
import { loadAllSections } from "@/lib/guide";
import type { WeakTopic } from "@/lib/weak-topics";

const topic = (sectionId: string, errorType: WeakTopic["errorType"]): WeakTopic => ({
  sectionId,
  icon: "DoorOpen",
  errorType,
  items: [],
});

const html = renderToStaticMarkup(
  <SourceSheetProvider sections={loadAllSections()}>
    <ActionBarProvider>
      <WeakTopicsView
        topics={[topic("S1", "misconception"), topic("S2", "knowledge_gap")]}
        selected={["S1"]}
        onToggle={() => undefined}
        onRepeat={() => undefined}
      />
    </ActionBarProvider>
  </SourceSheetProvider>,
);

describe("Weak topics rows", () => {
  it("use the compact icon tile: 36px circle, 18px icon, 1.75 stroke", () => {
    expect(html.match(/h-9 w-9/g)).toHaveLength(2);
    expect(html).not.toContain("h-12 w-12");
    expect(html.match(/width="18"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('stroke-width="1.75"');
  });

  it("keep a 12px gap between tile and text and a tighter row", () => {
    expect(html).toContain('class="flex items-center gap-3"');
    expect(html).toContain("py-1");
    expect(html).not.toContain("px-4 py-2");
  });

  it("keep titles, meta line, check boxes and group headers", () => {
    expect(html).toContain("Misconceptions");
    expect(html).toContain("Knowledge gaps");
    expect(html).toContain("Evacuation guide · S1");
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
  });
});
