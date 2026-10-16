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

/** s1 is wrong, s2 is right: 1 of 2 correct. */
const session = (index: number): FinishedSession => ({
  kind: "scenario",
  itemIds: ["q-scn-s01-001", "s2"],
  answers: [
    { itemId: "q-scn-s01-001", optionId: "d" },
    { itemId: "s2", optionId: "c" },
  ],
  finishedAt: Date.UTC(2026, 9, 1 + index, 9),
});

function render(count: number) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ProgressView history={Array.from({ length: count }, (_, index) => session(index))} />
    </SourceSheetProvider>,
  );
}

describe("Progress", () => {
  it("has the grey subtitle on its own line under the title", () => {
    const html = render(2);
    expect(html).toContain(
      '<p class="type-small text-text-secondary">How you are doing over time.</p>',
    );
    expect(html.indexOf(">Progress</h1>")).toBeLessThan(html.indexOf("How you are doing"));
  });

  it("does not repeat Home: no Repeat weak topics button and no Topics row", () => {
    const html = render(3);
    expect(html).not.toContain("Repeat weak topics");
    expect(html).not.toContain("N TO REPEAT");
    expect(html).not.toContain("TO REPEAT");
    expect(html).not.toContain(">Topics<");
    expect(html).not.toContain("See all");
  });

  it("shows the three summary numbers first", () => {
    const html = render(3);
    expect(html).toContain("Sessions");
    expect(html).toContain("Average result");
    expect(html).toContain("Correct answers");
    expect(html).not.toMatch(/Secure|Guess|Misconception|Knowledge gap|Error types/);
    expect(html.indexOf("Sessions")).toBeLessThan(html.indexOf("Result by session"));
  });

  it("orders the cards: summary, result by session, weak topics, guide sections, history", () => {
    const html = render(3);
    const order = [
      "Average result",
      "Result by session",
      "Weak topics",
      "Guide sections",
      "Session history",
    ].map((title) => html.indexOf(title));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("draws the trend with a value and date per bar and a hidden table", () => {
    const html = render(3);
    expect(html).toContain("50%");
    expect(html).toContain("2 Oct");
    expect(html).toContain('<table class="sr-only">');
    expect(html).not.toContain("Complete two sessions to see your trend.");
  });

  it("shows only the last 6 sessions in the trend", () => {
    const html = render(9);
    expect(html.match(/<tr>/g)).toHaveLength(7); // 6 rows plus the header row
  });

  it("asks for a second session instead of drawing a trend", () => {
    const html = render(1);
    expect(html).toContain("Complete two sessions to see your trend.");
    expect(html).not.toContain('<table class="sr-only">');
  });

  it("links to the Weak topics page with a tertiary link, not a primary button", () => {
    const html = render(2);
    const start = html.lastIndexOf("<a ", html.indexOf('href="/weak-topics"'));
    const link = html.slice(start, html.indexOf("</a>", start));
    expect(link).toContain("to repeat · Weak topics");
    expect(link).toContain("type-action");
    expect(link).not.toContain("bg-primary");
  });

  it("lists the guide sections S1 to S10 with their progress, not tappable", () => {
    const html = render(2);
    for (let number = 1; number <= 10; number++) expect(html).toContain(`>S${number}<`);
    expect(html).toContain("Not practised yet");
    expect(html).toMatch(/\d of \d correct/);
    expect(html).toContain("bg-olive-tint");
    const card = html.slice(html.indexOf("Guide sections"), html.indexOf("Session history"));
    expect(card).not.toContain("<a ");
    expect(card).not.toContain("<button");
  });

  it("shows the 5 newest sessions with See more, and no button with 5 or fewer", () => {
    const rows = (html: string) =>
      html.slice(html.indexOf("Session history")).match(/1 of 2 correct/g);
    const many = render(12);
    expect(rows(many)).toHaveLength(5);
    expect(many).toContain(">See more</span></button>");
    expect(render(5)).not.toContain("See more");
    expect(rows(render(5))).toHaveLength(5);
  });

  it("has one empty state and a primary button to Home without any session", () => {
    const html = render(0);
    expect(html).toContain("No sessions yet. Start a scenario to see your progress.");
    expect(html).toContain('href="/"');
    expect(html).toContain(">Start a scenario<");
    expect(html).not.toContain("Result by session");
    expect(html).not.toContain("Average result");
  });
});
