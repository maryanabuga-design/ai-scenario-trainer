import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Media3D } from "@/components/Media3D/Media3D";
import { HomeView } from "@/components/HomeView/HomeView";
import { getItem } from "@/lib/items";
import {
  HERO_BUTTON_LABEL,
  HERO_SUBTITLE,
  HERO_TITLE,
  artworkTransform,
  homeArtwork,
  homeFrames,
  homeCounts,
  homeSummary,
} from "@/lib/home";
import type { FinishedSession, Session } from "@/lib/session";

const counts = homeCounts({ history: [], saved: [] });
const NOW = new Date(2026, 9, 17, 15, 0);

const unfinished: Session = {
  kind: "scenario",
  itemIds: Array.from({ length: 20 }, () => "q-scn-s01-001"),
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
  weak: { open: null, history: [finishedAt(today, [["q-quiz-s01-001", false]])] },
  ready: {
    open: null,
    history: [
      finishedAt(
        today,
        ["q-quiz-s01-001", "q-quiz-s01-002", "q-quiz-s01-003", "q-quiz-s01-004", "q-s2-1"].map(
          (id): [string, boolean] => [id, true],
        ),
      ),
    ],
  },
};

function render(state: keyof typeof states = "first") {
  const { open, history } = states[state];
  return renderToStaticMarkup(
    <HomeView
      name={"Maryana"}
      summary={homeSummary({ unfinished: open, history })}
      counts={counts}
    />,
  );
}

describe("Home layout", () => {
  const html = render();

  it("has the avatar, the greeting and the bell in one row, and the sentence full width below it", () => {
    expect(html).toContain(`>Hi, ${"Maryana"}</h1>`);
    const order = [
      'aria-label="Profile"',
      ">Hi, ",
      'href="/notifications"',
      "Start with your first scenario.",
    ].map((text) => html.indexOf(text));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(order.every((position) => position >= 0)).toBe(true);
    expect(html).not.toContain(">Learn<");
  });

  it("has a 44px olive-tint avatar with the first initial, no photo, that opens Profile", () => {
    const start = html.lastIndexOf("<a ", html.indexOf('aria-label="Profile"'));
    const avatar = html.slice(start, html.indexOf("</a>", start));
    expect(avatar).toContain('href="/profile"');
    expect(avatar).toContain("h-11 w-11");
    expect(avatar).toContain("rounded-full bg-olive-tint text-primary");
    expect(avatar.endsWith(`>${"Maryana".charAt(0)}`)).toBe(true);
    expect(avatar).not.toContain("<img");
    expect(avatar).not.toContain("<svg");
  });

  it("has the bell, a 44px white circle like the Back buttons, named by its unread count", () => {
    const start = html.lastIndexOf("<a ", html.indexOf('href="/notifications"'));
    const bell = html.slice(start, html.indexOf("</a>", start));
    expect(bell).toContain("h-11 w-11");
    expect(bell).toContain("rounded-full bg-surface");
    expect(bell).toContain("lucide-bell");
    // nothing is known on the server: no badge, a name without a number
    expect(bell).toContain('aria-label="Notifications, no unread"');
    expect(bell).not.toContain("data-unread-badge");
  });

  it("goes greeting, hero card, four tiles, Mini-quiz", () => {
    const order = [
      'aria-label="Profile"',
      "Training materials",
      ">Exam<",
      ">Saved questions<",
      "Mini-quiz",
    ].map((text) => html.indexOf(text));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("has no onboarding button and no readiness percentage", () => {
    for (const state of Object.keys(states) as (keyof typeof states)[]) {
      const page = render(state);
      expect(page, state).not.toMatch(/How it works|How the app works|onboarding/i);
      expect(page, state).not.toMatch(/Readiness|role="img"/);
      expect(page, state).not.toContain('href="/onboarding"');
      expect(page, state).not.toContain('href="/progress"');
    }
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
    expect(render("ready")).toContain("You are ready. Try a mini-quiz to stay sharp.");
  });
});

describe("the hero card", () => {
  /** The hero card: from its section to the end of its markup. */
  const hero = (html: string) =>
    html.slice(html.indexOf(`<section aria-label="${HERO_TITLE}"`), html.indexOf("</section>"));

  it("says Training materials and the new line, in the named constants", () => {
    expect(HERO_TITLE).toBe("Training materials");
    expect(HERO_SUBTITLE).toBe("Practical scenarios and theory quizzes, by topic");
    expect(HERO_BUTTON_LABEL).toBe("Choose a topic");
    for (const state of Object.keys(states) as (keyof typeof states)[]) {
      const card = hero(render(state));
      expect(card, state).toContain(">Training materials</h2>");
      expect(card, state).toContain(">Practical scenarios and theory quizzes, by topic<");
      expect(card, state).not.toMatch(/Sample evacuation guide|quiz questions|\d+ scenarios?/);
    }
  });

  it("has no pill at the top: the panel starts with the title row", () => {
    const card = hero(render());
    expect(card).not.toContain("Your training");
    expect(card).not.toContain("10 topics");
    expect(card).not.toContain("rounded-full bg-surface");
    const panel = card.slice(card.indexOf("rounded-[22px]"));
    expect(panel.indexOf("<h2")).toBeLessThan(panel.indexOf("<a "));
    expect(panel.slice(panel.indexOf(">") + 1, panel.indexOf("<h2"))).not.toContain("<span");
  });

  it("has the nested sand panel in the card colour, with 8px and 16px padding", () => {
    const card = hero(render());
    expect(card).toContain("rounded-[28px] bg-card p-2");
    expect(card).toContain("rounded-[22px] bg-secondary-sand p-4");
  });

  it("shows the hero picture in a fixed 76 by 60 frame, vertically centred at the right of the title: decorative, bare, no placeholder", () => {
    const card = hero(render());
    const frame = card.slice(card.indexOf("<span"), card.indexOf(">", card.indexOf("<span")) + 1);
    expect(frame).toContain("data-picture-frame");
    expect(frame).toContain("overflow-hidden");
    expect(frame).toContain("width:76px;height:60px");
    const picture = card.slice(card.indexOf("<img"), card.indexOf(">", card.indexOf("<img")) + 1);
    expect(picture).toContain('alt=""');
    expect(picture).toContain('aria-hidden="true"');
    expect(picture).toContain('width="76"');
    expect(picture).toContain('height="60"');
    expect(picture).toContain("h-full w-full");
    expect(picture).not.toMatch(/\bp-|\bm-|-m[trbl]-/);
    expect(picture).toContain("object-contain");
    expect(picture).toContain("/heroes/hero-training.webp");
    // no tile, border, dashed outline, background or shadow around it
    expect(`${frame}${picture}`).not.toMatch(/bg-|border|rounded|shadow/);
    expect(card).not.toContain("data-media3d");
    expect(card).not.toContain(">3D<");
    // the text keeps 84px on the right (76px frame + 8px gap) and the frame adds no height
    expect(card).toContain("min-w-0 flex-col gap-1 pr-[84px]");
    expect(card).toContain("absolute inset-y-0 right-0 flex items-center");
    expect(card.indexOf("<h2")).toBeLessThan(card.indexOf("<img"));
  });

  it("scales the artwork to fill its frame: pure transform from the measured box", () => {
    const books = artworkTransform(homeArtwork.heroTraining, homeFrames.tile);
    const clipboard = artworkTransform(homeArtwork.iconMiniQuiz, homeFrames.row);
    // the artwork is as tall as the frame (99%); the contained file is a 60px square
    expect(books.scale * 60 * ((933 - 347) / 1254)).toBeCloseTo(0.99 * 60, 5);
    expect(clipboard.scale * 60 * ((990 - 221) / 1254)).toBeCloseTo(0.99 * 60, 5);
    // and it fits the frame's width
    expect(books.scale * 60 * ((945 - 312) / 1254)).toBeLessThanOrEqual(76);
    expect(clipboard.scale * 60 * ((984 - 297) / 1254)).toBeLessThanOrEqual(64);
  });

  it("keeps the dashed placeholder for a slot with no picture", () => {
    const html = renderToStaticMarkup(<Media3D variant="tile" />);
    expect(html).toContain('data-media3d="placeholder"');
    expect(html).toContain("h-20 w-20");
    expect(html).toContain(">3D<");
    const row = renderToStaticMarkup(<Media3D variant="row" />);
    expect(row).toContain("h-[72px] w-[72px]");
    expect(row).toContain(">3D<");
  });

  it("has no topic strip, no Topics or Today caption, no divider and no numbers or percentages", () => {
    for (const state of Object.keys(states) as (keyof typeof states)[]) {
      const card = hero(render(state));
      expect(card, state).not.toMatch(/<ul|<li|<hr|progressbar|data-state/);
      // the words on the card (the picture's URL is not text)
      expect(card.replace(/<[^>]+>/g, " "), state).not.toMatch(/Topics|Today|\d+\/\d+|%/);
    }
  });

  it("has no readiness ring and no square button", () => {
    for (const state of Object.keys(states) as (keyof typeof states)[]) {
      const card = hero(render(state));
      expect(card, state).not.toMatch(/Readiness|role="img"|h-\[52px\] w-\[52px\]/);
      expect(card, state).not.toContain('href="/progress"');
      expect(card, state).not.toContain("%<");
    }
  });

  it("has one full-width Primary button, Choose a topic, that opens Training in every state", () => {
    for (const state of Object.keys(states) as (keyof typeof states)[]) {
      const card = hero(render(state));
      expect(card.match(/<a /g), state).toHaveLength(1);
      expect(card, state).toContain('href="/training"');
      expect(card, state).toContain(`>${HERO_BUTTON_LABEL}</a>`);
      expect(card, state).toMatch(/class="[^"]*h-\[52px\][^"]*bg-primary[^"]*w-full/);
      expect(card, state).not.toMatch(/Start training|Continue|Repeat weak topics|Next:/);
    }
  });

  it("makes the empty area of the card open Training through one stretched link, with no ArrowCircle", () => {
    const card = hero(render());
    expect(card).toContain("after:absolute after:inset-0");
    expect(card.match(/after:absolute/g)).toHaveLength(1);
    expect(card).not.toContain("arrow-shadow");
    expect(card).not.toContain("relative z-10");
  });
});

describe("the tiles", () => {
  const html = render();

  it("show the flat icon fallback, not a 3D placeholder, until pictures exist", () => {
    const grid = html.slice(html.indexOf("grid-cols-2"), html.lastIndexOf("</ul>"));
    expect(grid).not.toContain("data-media3d");
  });

  it("are four cards in a two-column grid, each with a neutral circle and a count line", () => {
    expect(html).toContain("grid grid-cols-2 gap-3");
    const grid = html.slice(html.indexOf("grid-cols-2"), html.lastIndexOf("</ul>"));
    expect(grid.match(/<a /g)).toHaveLength(4);
    // one neutral tile for all four: no pastel, the same pair as the bookmark
    expect(grid).not.toContain("pastel");
    expect(grid.match(/bg-neutral-tile-bg text-neutral-tile-ink/g)).toHaveLength(4);
    expect(grid.match(/h-9 w-9/g)).toHaveLength(4);
    expect(grid.match(/width="18"/g)).toHaveLength(4);
    expect(grid.match(/rounded-card bg-card/g)).toHaveLength(4);
  });

  it("are Exam, Steps, Weak topics and Saved questions, and there is no Materials tile", () => {
    const order = [">Exam<", ">Steps<", ">Weak topics<", ">Saved questions<"].map((text) =>
      html.indexOf(text),
    );
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    const grid = html.slice(html.indexOf("grid-cols-2"), html.lastIndexOf("</ul>"));
    expect(grid).not.toMatch(/Materials|Guide|Scenarios|>Quiz<|Quick checklists/);
    expect(grid).not.toContain('href="/materials"');
  });

  it("show the counts and go to the right screen", () => {
    for (const [title, count, href] of [
      ["Exam", "Not taken yet", "/exam"],
      ["Steps", "3 checklists", "/checklists"],
      ["Weak topics", "Nothing to repeat", "/weak-topics"],
      ["Saved questions", "0 saved", "/saved"],
    ]) {
      const start = html.lastIndexOf("<a ", html.indexOf(`>${title}<`));
      const tile = html.slice(start, html.indexOf("</a>", start));
      expect(tile, title).toContain(`href="${href}"`);
      expect(tile, title).toContain(count);
    }
  });

  it("shows the best exam result on the Exam tile", () => {
    const withExam = renderToStaticMarkup(
      <HomeView
        name={"Maryana"}
        summary={homeSummary({ unfinished: null, history: [] })}
        counts={{ ...counts, bestExam: { correct: 17, questions: 20 } }}
      />,
    );
    expect(withExam).toContain("Best: 17 of 20");
    expect(withExam).not.toMatch(/Best: \d+%/);
    expect(withExam).not.toContain("Not taken yet");
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

  it("has the mini-quiz picture in a fixed 64 by 60 frame on the left, centred on the text (bare, decorative), the title, the description and the chevron on the right", () => {
    const start = html.lastIndexOf("<a ", html.indexOf(">Mini-quiz<"));
    const row = html.slice(start, html.indexOf("</a>", start));
    const picture = row.slice(row.indexOf("<img"), row.indexOf(">", row.indexOf("<img")) + 1);
    expect(picture).toContain("/heroes/icon-miniquiz.webp");
    expect(picture).toContain('alt=""');
    expect(picture).toContain('aria-hidden="true"');
    expect(picture).toContain('width="64"');
    expect(picture).toContain('height="60"');
    expect(row).toContain("width:64px;height:60px");
    expect(row).toContain("flex min-w-0 flex-1 items-center gap-3");
    expect(picture).not.toMatch(/bg-|border|rounded|shadow/);
    expect(row).not.toContain("data-media3d");
    expect(row).not.toContain(">3D<");
    const order = ["<img", ">Mini-quiz<", "Pick topics", "lucide-chevron-right"].map((text) =>
      row.indexOf(text),
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
