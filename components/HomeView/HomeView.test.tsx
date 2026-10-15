import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeView } from "@/components/HomeView/HomeView";
import { getItem } from "@/lib/items";
import { homeCounts, homeSummary } from "@/lib/home";
import type { PartRecords } from "@/lib/part-progress";
import type { FinishedSession, Session } from "@/lib/session";
import { DEMO_USER } from "@/lib/user";

const counts = homeCounts({ history: [], saved: [], guideSections: 17 });
const NOW = new Date(2026, 9, 17, 15, 0);
const guideName = "Sample evacuation guide.pdf";

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
      const wrong = item.options.find((option) => option.id !== item.correctOptionId)!.id;
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
        ["q-s1-1", "q-s1-2", "q-s1-3", "q-s1-4", "q-s2-1"].map((id): [string, boolean] => [
          id,
          true,
        ]),
      ),
    ],
  },
};

const done = (percent: number) => ({
  lastPercent: percent,
  attempts: 1,
  answeredIds: [],
  correctIds: [],
});

function render(
  state: keyof typeof states = "first",
  readiness = 0,
  records: PartRecords | null = null,
) {
  const { open, history } = states[state];
  return renderToStaticMarkup(
    <HomeView
      name={DEMO_USER.name}
      summary={homeSummary({
        unfinished: open,
        history,
        records,
        now: NOW,
      })}
      readiness={readiness}
      counts={counts}
      guideName={guideName}
    />,
  );
}

describe("Home layout", () => {
  const html = render();

  it("has the greeting with the demo name and a sentence on the left, the profile button on the right", () => {
    expect(html).toContain(`>Hi, ${DEMO_USER.name}</h1>`);
    expect(DEMO_USER.name).toBe("Maryana");
    expect(html.indexOf(">Hi, ")).toBeLessThan(html.indexOf("Start with your first scenario."));
    expect(html.indexOf("Start with your first scenario.")).toBeLessThan(
      html.indexOf('aria-label="Profile"'),
    );
    expect(html).toContain('href="/profile"');
    expect(html).not.toContain(">Learn<");
  });

  it("goes greeting, big card, six tiles, Mini-quiz, How it works", () => {
    const order = [
      'aria-label="Profile"',
      "Your training",
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
    expect(render("goal")).toContain("You are ready. Try a mini-quiz to stay sharp.");
  });
});

describe("the hero card", () => {
  /** The hero card: from its section to the end of its markup. */
  const hero = (html: string) =>
    html.slice(html.indexOf('<section aria-label="Your training"'), html.indexOf("</section>"));

  it("always says Start training and opens Training, in every progress state", () => {
    for (const state of Object.keys(states) as (keyof typeof states)[]) {
      const card = hero(render(state));
      expect(card, state).toContain("Start training");
      expect(card, state).toContain('href="/training"');
      expect(card, state).not.toMatch(/Continue|Repeat weak topics|Next:/);
      expect(card, state).not.toContain("border-arrow-stroke bg-surface shadow");
    }
    // no ArrowCircle on this card
    expect(hero(render())).not.toContain("arrow-shadow");
  });

  it("has the nested sand panel in the card colour, with 8px and 16px padding", () => {
    const card = hero(render());
    expect(card).toContain("rounded-[28px] bg-card p-2");
    expect(card).toContain("rounded-[22px] bg-secondary-sand p-4");
  });

  it("has the white pill with Your training and the number of topics", () => {
    const card = hero(render());
    expect(card).toContain("h-10");
    expect(card).toContain("rounded-full bg-surface");
    expect(card).toContain(">Your training<");
    expect(card).toContain("10 topics");
  });

  it("shows the guide name, the real counts and the 3D tile placeholder", () => {
    const card = hero(render());
    expect(card).toContain(`>${guideName}</h2>`);
    expect(card).toContain("1 scenario · 33 quiz questions");
    expect(card).toContain('data-media3d="placeholder"');
    expect(card).toContain("h-20 w-20");
    expect(card).toContain(">3D<");
  });

  it("has a strip of 10 segments with the right state colours", () => {
    const records: PartRecords = {
      "quiz:S3:1": done(100),
      "quiz:S4:1": done(40),
    };
    const card = hero(render("first", 0, records));
    const segments = card.match(/<li data-state="[^"]+"[^>]*>/g) ?? [];
    expect(segments).toHaveLength(10);
    expect(segments.filter((s) => s.includes('data-state="done"'))).toHaveLength(1);
    expect(segments.filter((s) => s.includes('data-state="in progress"'))).toHaveLength(1);
    expect(segments.filter((s) => s.includes('data-state="not started"'))).toHaveLength(8);
    expect(segments[2]).toContain("bg-primary");
    expect(segments[3]).toContain("bg-olive-tint");
    expect(segments[0]).toContain("bg-arrow-stroke");
    segments.forEach((segment) => expect(segment).toContain("h-1.5 flex-1 rounded-[3px]"));
    expect(card).toContain('<ul aria-label="Topics" class="flex gap-1">');
  });

  it("shows the captions Topics x/10 and Today x/5", () => {
    const first = hero(render());
    expect(first).toContain("Topics 0/10");
    expect(first).toContain("Today 0/5");
    const later = hero(render("goal", 11, { "quiz:S3:1": done(100) }));
    expect(later).toContain("Topics 1/10");
    expect(later).toContain("Today 5/5");
    expect(hero(render("weak"))).toContain("Today 1/5");
  });

  it("has the divider, a full-width Primary button and the square readiness ring that opens Progress", () => {
    const card = hero(render("first", 32));
    expect(card).toContain("<hr");
    expect(card).toContain("h-[52px]");
    expect(card).toContain("h-[52px] bg-primary");
    const square = card.slice(card.lastIndexOf("<a ", card.indexOf('href="/progress"')));
    expect(square).toContain('aria-label="Readiness 32%, open Progress"');
    expect(square).toContain("h-[52px] w-[52px]");
    expect(square).toContain("border border-arrow-stroke bg-surface");
    expect(square).toContain(">32%<");
    expect(square).toContain('aria-label="Readiness 32%"');
  });

  it("makes the empty area of the card open Training through one stretched link", () => {
    const card = hero(render());
    expect(card).toContain("after:absolute after:inset-0");
    expect(card.match(/after:absolute/g)).toHaveLength(1);
    expect(card).toContain("relative z-10");
  });

  it("shows 0% readiness at the start and the percentage after", () => {
    expect(hero(render())).toContain(">0%<");
    expect(hero(render("goal", 11))).toContain(">11%<");
  });
});

describe("the tiles", () => {
  const html = render();

  it("show the flat icon fallback, not a 3D placeholder, until pictures exist", () => {
    const grid = html.slice(html.indexOf("grid-cols-2"), html.lastIndexOf("</ul>"));
    expect(grid).not.toContain("data-media3d");
  });

  it("are six cards in a two-column grid, each with its own pastel circle and a count line", () => {
    expect(html).toContain("grid grid-cols-2 gap-3");
    const grid = html.slice(html.indexOf("grid-cols-2"), html.lastIndexOf("</ul>"));
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
      ["Scenarios", "1 scenario", "/training?mode=scenario"],
      ["Quiz", "33 questions", "/training?mode=quiz"],
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
    expect(row).toContain("Pick topics and how many questions");
    expect(row).toContain("lucide-chevron-right");
    expect(row).toContain("min-h-[104px]");
    expect(row).toContain("rounded-card bg-card");
  });

  it("has a 72px 3D row icon placeholder on the left, the title, the description and the chevron on the right", () => {
    const start = html.lastIndexOf("<a ", html.indexOf(">Mini-quiz<"));
    const row = html.slice(start, html.indexOf("</a>", start));
    expect(row).toContain('data-media3d="placeholder"');
    expect(row).toContain("h-[72px] w-[72px]");
    expect(row).toContain(">3D<");
    const order = ["h-[72px] w-[72px]", ">Mini-quiz<", "Pick topics", "lucide-chevron-right"].map(
      (text) => row.indexOf(text),
    );
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(row).toContain("line-clamp-2");
  });

  it("no longer starts an instant session of 5 questions", () => {
    expect(html).not.toMatch(
      /Mini-session|quick questions|<button type="button" class="flex min-h-16/,
    );
  });
});
