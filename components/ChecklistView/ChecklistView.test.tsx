import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChecklistDetail } from "@/components/ChecklistView/ChecklistDetail";
import { ChecklistList } from "@/components/ChecklistView/ChecklistList";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { checklists } from "@/lib/checklists";
import { loadAllSections } from "@/lib/guide";

describe("the Quick checklists list", () => {
  const html = renderToStaticMarkup(<ChecklistList />);

  it("has the Back circle to Home, the title and a card per checklist", () => {
    expect(html).toContain('aria-label="Back to Home"');
    expect(html).toContain('href="/"');
    expect(html).toContain(">Quick checklists</h1>");
    expect(html.match(/<li/g)).toHaveLength(3);
  });

  it("shows each title, its number of steps and a chevron, and opens the checklist", () => {
    checklists.forEach((checklist) => {
      expect(html).toContain(checklist.title);
      expect(html).toContain(`${checklist.steps.length} steps`);
      expect(html).toContain(`href="/checklists/${checklist.id}"`);
    });
    expect(html.match(/lucide-chevron-right/g)).toHaveLength(3);
  });
});

describe("one checklist", () => {
  const checklist = checklists[1];
  const html = renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ChecklistDetail checklist={checklist} />
    </SourceSheetProvider>,
  );

  it("goes back to the list", () => {
    expect(html).toContain('aria-label="Back to checklists"');
    expect(html).toContain('href="/checklists"');
    expect(html).toContain(`>${checklist.title}</h1>`);
  });

  it("numbers every step in order", () => {
    checklist.steps.forEach((step, index) => {
      expect(html).toContain(step);
      expect(html).toContain(`>${index + 1}<`);
    });
    expect(html.match(/<li/g)).toHaveLength(checklist.steps.length);
    const first = html.indexOf(checklist.steps[0]);
    expect(first).toBeLessThan(html.indexOf(checklist.steps[checklist.steps.length - 1]));
  });

  it("shows the Guide chips of the sections the steps come from", () => {
    checklist.guideRef.forEach((section) => expect(html).toContain(`Guide · ${section}`));
  });
});
