import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeView } from "@/components/HomeView/HomeView";
import { getItem } from "@/lib/items";
import { homeCounts, homeSummary } from "@/lib/home";
import type { FinishedSession, Session } from "@/lib/session";
import { DEMO_USER } from "@/lib/user";

const counts = homeCounts({ history: [], saved: [], guideSections: 17 });
const NOW = new Date(2026, 9, 17, 15, 0);
const sections = [{ id: "S1", title: "Responding to an alarm" }];

const unfinished: Session = {
  kind: "scenario",
  itemIds: Array.from({ length: 20 }, () => "s1"),
  index: 6,
  answers: [],
  finished: false,
};

function finishedAt(time: number, picks: [string, boolean][]): FinishedSession {
  return {
    kind: "quiz",
    itemIds: picks.map(([id]) => id),
    answers: picks.map(([itemId, right]) => {
      const item = getItem(itemId);
      const wrong = item.options.find(
        (option) => option.id !== item.correctOptionId,
      )!.id;
      return { itemId, optionId: right ? item.correctOptionId : wrong };
    }),
    finishedAt: time,
  };
}

const today = NOW.getTime();
const states = {
  first: { open: null, history: [] as FinishedSession[] },
  continue: { open: unfinished, history: [] as FinishedSession[] },
  weak: { open: null, history: [finishedAt(today, [["q-s1-1", false]])] },
  goal: {
    open: null,
    history: [
      finishedAt(
        today,
        ["q-s1-1", "q-s1-2", "q-s1-3", "q-s1-4", "q-s2-1"].map(
          (id): [string, boolean] => [id, true],
        ),
      ),
    ],
  },
};

function render(state: keyof typeof states = "first", readiness = 0) {
  const { open, history } = states[state];
  return renderToStaticMarkup(
    <HomeView
      name={DEMO_USER.name}
      summary={homeSummary({
        unfinished: open,
        history,
        records: null,
        sections,
        now: NOW,
      })}
      readiness={readiness}
      counts={counts}
      onStartPart={() => undefined}
    />,
  );
}

describe("Home layout", () => {
  const html = render();

  it("has the greeting with the demo name and a sentence on the left, the profile button on the right", () => {
    expect(html).toContain(`>Hi, ${DEMO_USER.name}</h1>`);
    expect(DEMO_USER.name).toBe("Maryana");
    expect(html.indexOf(">Hi, ")).toBeLessThan(
      html.indexOf("Start with your first scenario."),
    );
    expect(html.indexOf("Start with your first scenario.")).toBeLessThan(
      html.indexOf('aria-label="Profile"'),
    );
    expect(html).toContain('href="/profile"');
    expect(html).not.toContain(">Learn<");
  });

  it("goes greeting, big card, six tiles, Mini-quiz, How it works", () => {
    const order = [
      'aria-label="Profile"',
      "Start training",
      ">Scenarios<",
      ">Quick checklists<",
      "Mini-quiz",
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

describe("the sentence under the greeting", () => {
  it("follows the state", () => {
    expect(render("first")).toContain("Start with your first scenario.");
    expect(render("continue")).toContain("You stopped at question 7 of 20.");
    expect(render("weak")).toContain("1 topic needs another look.");
    expect(render("goal")).toContain(
      "You are ready. Try a mini-quiz to stay sharp.",
    );
  });
});

describe("the big card", () => {
  it("says Start training and opens the Training screen when nothing is started", () => {
    const html = render();
    expect(html).toContain("Start training");
    expect(html).toContain("Choose a scenario or a quiz");
    expect(html).toContain('href="/training"');
    expect(html).not.toContain(">Continue<");
  });

  it("says Continue with the mode and position, and resumes the session", () => {
    const html = render("continue");
    expect(html).toContain(">Continue<");
    expect(html).toContain("Scenario · Question 7 of 20");
    expect(html).toContain('href="/session"');
    expect(html).not.toContain("Start training");
  });

  it("says Repeat weak topics and opens the Weak topics page when something is wrong", () => {
    const html = render("weak");
    const card = html.slice(
      html.lastIndexOf("<a ", html.indexOf(">Repeat weak topics<")),
    );
    expect(card).toContain('href="/weak-topics"');
    expect(card).toContain("1 topic to repeat");
  });

  it("names the next part and starts it with a button, not a link, when all is right", () => {
    const html = render("goal");
    const start = html.lastIndexOf(
      "<button",
      html.indexOf(">Next: Responding to an alarm · Part 1<"),
    );
    expect(start).toBeGreaterThan(html.indexOf("</header>"));
    expect(html.slice(start, start + 200)).toContain('type="button"');
    expect(html).not.toMatch(/>(Start training|Continue|Repeat weak topics)</);
  });

  it("has an ArrowCircle top-right and a large radius", () => {
    const html = render();
    const card = html.slice(html.indexOf("<a", html.indexOf("</header>")));
    expect(card).toContain("border-arrow-stroke");
    expect(card).toContain("rounded-[28px] bg-card");
    expect(card).toContain("pr-14");
  });

  it("shows the daily goal as a line and a thin bar", () => {
    const first = render();
    expect(first).toContain("Today: 0/5 questions");
    expect(first).toMatch(/role="progressbar"[^>]*aria-valuenow="0"/);
    const done = render("goal");
    expect(done).toContain("Today: 5/5 questions");
    expect(done).toContain("width:100%");
    expect(render("weak")).toContain("Today: 1/5 questions");
    expect(render("weak")).toContain("width:20%");
  });

  it("shows the readiness ring: 0% at the start, the percentage after", () => {
    const start = render();
    expect(start).toContain('aria-label="Readiness 0%"');
    expect(start).toContain(">0%<");
    const later = render("first", 32);
    expect(later).toContain('aria-label="Readiness 32%"');
    expect(later).toContain(">32%<");
  });
});

describe("the tiles", () => {
  const html = render();

  it("are six cards in a two-column grid, each with its own pastel circle and a count line", () => {
    expect(html).toContain("grid grid-cols-2 gap-3");
    const grid = html.slice(html.indexOf("grid-cols-2"), html.indexOf("</ul>"));
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
      ["Scenarios", "2 scenarios", "/training?mode=scenario"],
      ["Quiz", `${counts.questions} questions`, "/training?mode=quiz"],
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

describe("the Mini-quiz row", () => {
  const html = render();

  it("is a full-width card with a chevron that opens the Mini-quiz screen from Home", () => {
    const start = html.lastIndexOf("<a ", html.indexOf(">Mini-quiz<"));
    const row = html.slice(start, html.indexOf("</a>", start));
    expect(row).toContain('href="/mini-quiz?from=home"');
    expect(row).toContain("Choose topics and how many questions");
    expect(row).toContain("lucide-chevron-right");
    expect(row).toContain("rounded-card bg-card");
  });

  it("no longer starts an instant session of 5 questions", () => {
    expect(html).not.toMatch(
      /Mini-session|quick questions|<button type="button" class="flex min-h-16/,
    );
  });
});
