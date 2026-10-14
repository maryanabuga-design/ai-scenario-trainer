import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";
import type { FinishedSession } from "@/lib/session";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/progress",
}));

const session = (index: number): FinishedSession => ({
  mode: "short",
  answers: [
    { stepId: "s1", optionId: "d", confidence: 2, explanation: "" },
    { stepId: "s2", optionId: "c", confidence: 3, explanation: "" },
  ],
  finishedAt: Date.UTC(2026, 9, 1 + index, 9),
});

function render(count: number) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ProgressView
        history={Array.from({ length: count }, (_, index) => session(index))}
        onRepeat={() => undefined}
      />
    </SourceSheetProvider>,
  );
}

describe("Progress", () => {
  it("has the grey subtitle on its own line under the title", () => {
    const html = render(2);
    expect(html).toContain(
      '<p class="type-small text-text-secondary">Topics to repeat and your past sessions.</p>',
    );
    expect(html.indexOf(">Progress</h1>")).toBeLessThan(html.indexOf("Topics to repeat and"));
  });

  it("has no See all, and the repeat card's arrow opens the Weak topics page", () => {
    const html = render(2);
    expect(html).not.toContain("See all");
    const start = html.lastIndexOf("<a ", html.indexOf('href="/weak-topics"'));
    const link = html.slice(start);
    expect(link.slice(0, link.indexOf("</a>"))).toContain("bg-secondary-sand");
    expect(html).toContain(">Repeat weak topics</button>");
  });

  it("shows the 5 newest sessions with See more, and no button with 5 or fewer", () => {
    const many = render(12);
    expect(many.match(/of 2 correct/g)).toHaveLength(5);
    expect(many).toContain(">See more</span></button>");
    expect(render(5)).not.toContain("See more");
    expect(render(5).match(/of 2 correct/g)).toHaveLength(5);
  });
});
