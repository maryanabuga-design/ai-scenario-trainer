import { describe, expect, it } from "vitest";
import { continueCard, homeCounts, homeTiles, readiness } from "@/lib/home";
import { getItem } from "@/lib/items";
import { modeStats } from "@/lib/part-progress";
import { modeItems } from "@/lib/parts";
import { questions } from "@/lib/quiz";
import type { FinishedSession, Session } from "@/lib/session";

const session = (kind: Session["kind"], index: number, length = 20): Session => ({
  kind,
  itemIds: Array.from({ length }, (_, i) => `s${(i % 10) + 1}`),
  index,
  answers: [],
  finished: false,
});

/** A finished session answering the given items with their right or wrong option. */
function finished(at: number, picks: [string, boolean][]): FinishedSession {
  return {
    kind: "quiz",
    itemIds: picks.map(([id]) => id),
    answers: picks.map(([itemId, right]) => {
      const item = getItem(itemId);
      const wrong = item.options.find((option) => option.id !== item.correctOptionId)!.id;
      return { itemId, optionId: right ? item.correctOptionId : wrong };
    }),
    finishedAt: at,
  };
}

describe("the Continue training card", () => {
  it("continues an unfinished session with its mode and position", () => {
    expect(continueCard(session("scenario", 6))).toEqual({
      kind: "continue",
      title: "Continue",
      subtitle: "Scenario · Question 7 of 20",
      href: "/session",
    });
    expect(continueCard(session("quiz", 0, 10)).subtitle).toBe("Quiz · Question 1 of 10");
    expect(continueCard(session("repeat", 2, 5)).subtitle).toBe("Repeat round · Question 3 of 5");
  });

  it("starts training, with Session setup behind it, when nothing is unfinished", () => {
    expect(continueCard(null)).toEqual({
      kind: "start",
      title: "Start training",
      subtitle: "Choose a scenario or a quiz",
      href: "/training",
    });
  });
});

describe("readiness", () => {
  /** Questions of the guide's sections S1 to S10: 10 scenario steps and 33 quiz questions. */
  const TOTAL = 43;

  it("is 0% when nothing is done", () => {
    expect(readiness(null)).toBe(0);
    expect(readiness([])).toBe(0);
  });

  it("is the unique questions answered correctly divided by all questions of both modes", () => {
    const ids = questions.slice(0, 14).map((question) => question.id);
    const history = [
      finished(
        1,
        ids.map((id): [string, boolean] => [id, true]),
      ),
    ];
    expect(readiness(history)).toBe(Math.floor((14 / TOTAL) * 100));
    expect(readiness(history)).toBeGreaterThan(0);
  });

  it("updates after another finished session, and counts a question once", () => {
    const first = finished(1, [
      ["s1", true],
      ["s2", true],
    ]);
    const before = readiness([first]);
    const more = finished(2, [
      ["s1", true],
      ["q-s1-1", true],
      ["q-s1-2", true],
    ]);
    expect(readiness([first, more])).toBeGreaterThan(before);
    // s1 was right twice: 4 different questions are right, not 5.
    expect(readiness([first, more])).toBe(Math.floor((4 / TOTAL) * 100));
  });

  it("uses only the latest answer: a later wrong answer takes a question away, a right one gives it back", () => {
    const right = finished(1, [
      ["s1", true],
      ["q-s1-1", true],
    ]);
    const wrong = finished(2, [["s1", false]]);
    const again = finished(3, [["s1", true]]);
    expect(readiness([right, wrong])).toBe(Math.floor((1 / TOTAL) * 100));
    expect(readiness([right, wrong, again])).toBe(readiness([right]));
    // the order the sessions are stored in does not matter
    expect(readiness([wrong, again, right])).toBe(readiness([right, wrong, again]));
  });

  it("reaches 100% only when every question of both modes is right", () => {
    const every = finished(1, [
      ...modeItems("quiz").map((item): [string, boolean] => [item.id, true]),
      ...modeItems("scenario").map((item): [string, boolean] => [item.id, true]),
    ]);
    expect(readiness([every])).toBe(100);
    expect(readiness([finished(1, [["flood-s1", true]])])).toBe(0);
  });

  it("is the same number the Training screen's selectors give", () => {
    const history = [
      finished(1, [
        ["s1", true],
        ["q-s1-1", true],
        ["q-s2-1", false],
      ]),
    ];
    const stats = [modeStats(history, "scenario"), modeStats(history, "quiz")];
    expect(readiness(history)).toBe(
      Math.floor(((stats[0].correct + stats[1].correct) / (stats[0].total + stats[1].total)) * 100),
    );
  });
});

describe("the tiles", () => {
  const counts = homeCounts({ history: [], saved: ["s1", "q-s2-1", "gone"], guideSections: 17 });

  it("counts scenarios, questions, saved questions, sections and checklists", () => {
    expect(counts).toMatchObject({
      scenarios: 2,
      questions: questions.length,
      weakSections: 0,
      saved: 2,
      guideSections: 17,
      checklists: 3,
    });
  });

  it("counts the sections to repeat from the latest wrong answers", () => {
    const history = [
      finished(1, [
        ["s1", false],
        ["s4", false],
        ["q-s1-1", false],
        ["s2", true],
      ]),
    ];
    expect(homeCounts({ history, saved: null, guideSections: 17 }).weakSections).toBe(2);
    const cleared = [
      ...history,
      finished(2, [
        ["s1", true],
        ["q-s1-1", true],
      ]),
    ];
    expect(homeCounts({ history: cleared, saved: null, guideSections: 17 }).weakSections).toBe(1);
  });

  it("words each count line and sends each tile to its screen", () => {
    const tiles = homeTiles(counts);
    expect(tiles.map((tile) => [tile.title, tile.count, tile.href])).toEqual([
      ["Scenarios", "2 scenarios", "/training?mode=scenario"],
      ["Quiz", `${questions.length} questions`, "/training?mode=quiz"],
      ["Weak topics", "Nothing to repeat", "/weak-topics"],
      ["Saved questions", "2 saved", "/saved"],
      ["Guide", "17 sections", "/materials"],
      ["Quick checklists", "3 checklists", "/checklists"],
    ]);
  });

  it("says how many sections are to repeat, in the singular too", () => {
    expect(homeTiles({ ...counts, weakSections: 3 })[2].count).toBe("3 sections to repeat");
    expect(homeTiles({ ...counts, weakSections: 1 })[2].count).toBe("1 section to repeat");
    expect(homeTiles({ ...counts, saved: 0 })[3].count).toBe("0 saved");
  });

  it("gives every tile its own pastel from the shared palette", () => {
    const tones = homeTiles(counts).map((tile) => tile.tone);
    expect(new Set(tones).size).toBe(6);
    expect(tones).not.toContain("rose");
  });
});
