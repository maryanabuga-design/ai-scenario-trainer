import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { ReviewQuestion } from "@/components/ReviewQuestion/ReviewQuestion";
import { SavedView } from "@/components/SavedView/SavedView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";
import { getItem } from "@/lib/items";

const noop = () => undefined;
const render = (ids: string[]) =>
  renderToStaticMarkup(
    <ActionBarProvider>
      <SavedView items={ids.map(getItem)} onRepeat={noop} />
    </ActionBarProvider>,
  );

describe("the Saved screen", () => {
  it("has the Back circle and the title", () => {
    const html = render(["s1"]);
    expect(html).toContain('aria-label="Back to Home"');
    expect(html).toContain(">Saved questions</h1>");
  });

  it("shows a short empty state with no rows", () => {
    const html = render([]);
    expect(html).toContain(
      "No saved questions yet. Tap the bookmark on a question to keep it here.",
    );
    expect(html).not.toContain("<li");
    expect(html).toContain("lucide-bookmark");
  });

  it("lists a row for each saved question: section chip, question text and a chevron, in saved order", () => {
    const html = render(["q-s2-1", "s1"]);
    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html.indexOf(getItem("q-s2-1").question)).toBeLessThan(
      html.indexOf(getItem("s1").question),
    );
    expect(html).toContain(">S2<");
    expect(html).toContain(">S1<");
    expect(html).toContain("lucide-chevron-right");
    expect(html).toContain('href="/saved/q-s2-1"');
    expect(html).toContain('href="/saved/s1"');
  });

  it("offers Repeat saved (N) only when something is saved", () => {
    const source = readFileSync("components/SavedView/SavedView.tsx", "utf8");
    expect(source).toContain("Repeat saved (");
    expect(source).toMatch(/items\.length > 0 && \(\s*<ActionBar>/);
  });
});

describe("a saved question on its own", () => {
  const view = (saved: boolean) =>
    renderToStaticMarkup(
      <SourceSheetProvider sections={loadAllSections()}>
        <AskAiProvider>
          <ReviewQuestion item={getItem("s1")} choice={null} saved={saved} onToggleSaved={noop} />
        </AskAiProvider>
      </SourceSheetProvider>,
    );

  it("shows all options with the correct one marked, no choice, Why and the guide chips", () => {
    const html = view(true);
    expect(html.match(/data-state=/g)).toHaveLength(3);
    expect(html.match(/data-state="correct"/g)).toHaveLength(1);
    expect(html).toContain("Correct answer");
    expect(html).not.toContain("Your answer");
    expect(html).toContain(">Why<");
    expect(html).toContain("Guide · S1");
  });

  it("has the bookmark: filled when saved, outlined once removed", () => {
    expect(view(true)).toContain('aria-label="Remove from saved"');
    expect(view(false)).toContain('aria-label="Save question"');
  });
});
