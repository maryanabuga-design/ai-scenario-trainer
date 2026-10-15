import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeView } from "@/components/HomeView/HomeView";
import { homeCounts } from "@/lib/home";
import type { Session } from "@/lib/session";

const noop = () => undefined;
const counts = homeCounts({ history: [], saved: [], guideSections: 17 });

function render(unfinished: Session | null = null, readiness = 0) {
  return renderToStaticMarkup(
    <HomeView
      directionTitle="Building evacuation and first aid"
      unfinished={unfinished}
      readiness={readiness}
      counts={counts}
      onOpenSetup={noop}
      onMiniSession={noop}
    />,
  );
}

const unfinished: Session = {
  kind: "scenario",
  itemIds: Array.from({ length: 20 }, () => "s1"),
  index: 6,
  answers: [],
  finished: false,
};

describe("Home layout", () => {
  const html = render();

  it("has the top row: the title and direction on the left, the profile button on the right", () => {
    expect(html.indexOf(">Learn<")).toBeLessThan(html.indexOf('aria-label="Profile"'));
    expect(html).toContain("Building evacuation and first aid");
    expect(html).toContain('href="/profile"');
  });

  it("goes top row, big card, six tiles, Mini-session, How it works", () => {
    const order = [
      'aria-label="Profile"',
      "Start training",
      ">Scenarios<",
      ">Quick checklists<",
      "Mini-session",
      "How it works",
    ].map((text) => html.indexOf(text));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("repeats nothing from Progress: no summary numbers, no history", () => {
    expect(html).not.toMatch(
      /Sessions|Average result|Correct answers|Session history|Result by session/,
    );
    expect(html).not.toMatch(/Next up|New scenario|Topics<|Repeat weak topics/);
    expect(html).not.toContain("<table");
  });
});

describe("the Continue training card", () => {
  it("says Start training and goes to Session setup when nothing is unfinished", () => {
    const html = render();
    expect(html).toContain("Start training");
    expect(html).toContain("Choose a scenario or a quiz");
    expect(html).toContain('href="/session/setup"');
    expect(html).not.toContain(">Continue<");
  });

  it("says Continue with the mode and position, and resumes the session", () => {
    const html = render(unfinished);
    expect(html).toContain(">Continue<");
    expect(html).toContain("Scenario · Question 7 of 20");
    expect(html).toContain('href="/session"');
    expect(html).not.toContain("Start training");
  });

  it("has an ArrowCircle top-right and a large radius", () => {
    const html = render();
    const card = html.slice(html.indexOf("<a", html.indexOf("</header>")));
    expect(card).toContain("border-arrow-stroke");
    expect(card).toContain("rounded-[28px] bg-card");
    expect(card).toContain("pr-14");
  });

  it("shows the readiness ring: 0% at the start, the percentage after", () => {
    const start = render();
    expect(start).toContain('aria-label="Readiness 0%"');
    expect(start).toContain(">0%<");
    const later = render(null, 32);
    expect(later).toContain('aria-label="Readiness 32%"');
    expect(later).toContain(">32%<");
  });
});

describe("the tiles", () => {
  const html = render();

  it("are six cards in a two-column grid, each with its own pastel circle and a count line", () => {
    expect(html).toContain("grid grid-cols-2 gap-3");
    const grid = html.slice(html.indexOf("grid-cols-2"), html.indexOf("<button"));
    expect(grid.match(/<a /g)).toHaveLength(6);
    for (const tone of ["yellow", "blue", "peach", "lilac", "green", "sand"]) {
      expect(grid).toContain(`bg-pastel-${tone}`);
    }
    expect(grid.match(/h-9 w-9/g)).toHaveLength(6);
    expect(grid.match(/width="18"/g)).toHaveLength(6);
    expect(grid.match(/rounded-card bg-card/g)).toHaveLength(6);
  });

  it("show the counts and go to the right screen", () => {
    for (const [title, count, href] of [
      ["Scenarios", "2 scenarios", "/session/setup?mode=scenario"],
      ["Quiz", `${counts.questions} questions`, "/session/setup?mode=quiz"],
      ["Weak topics", "Nothing to repeat", "/weak-topics"],
      ["Saved questions", "0 saved", "/saved"],
      ["Guide", "17 sections", "/materials"],
      ["Quick checklists", "3 checklists", "/checklists"],
    ]) {
      const start = html.lastIndexOf("<a ", html.indexOf(`>${title}<`));
      const tile = html.slice(start, html.indexOf("</a>", start));
      expect(tile, title).toContain(`href="${href.replace(/&/g, "&amp;")}"`);
      expect(tile, title).toContain(count);
    }
  });
});

describe("the Mini-session row", () => {
  const html = render();

  it("is a full-width card with a chevron that starts 5 quick questions", () => {
    const start = html.indexOf("<button");
    const row = html.slice(start, html.indexOf("</button>", start));
    expect(row).toContain("Mini-session");
    expect(row).toContain(">5<");
    expect(row).toContain("quick questions");
    expect(row).toContain("lucide-chevron-right");
    expect(row).toContain("rounded-card bg-card");
  });
});
