import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { homeCounts, homeSummary, homeTiles, readiness } from "@/lib/home";
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

const at = (day: number, hour = 10) => new Date(2026, 9, day, hour).getTime();
const summary = (unfinished: Session | null, history: FinishedSession[] | null) =>
  homeSummary({ unfinished, history });

/** A finished session of right answers ended at `time`. */
const rightAnswers = (time: number, ids: string[]) =>
  finished(
    time,
    ids.map((id): [string, boolean] => [id, true]),
  );
const fiveRight = [
  "q-quiz-s01-001",
  "q-quiz-s01-002",
  "q-quiz-s01-003",
  "q-quiz-s01-004",
  "q-s2-1",
];

describe("the sentence under the greeting", () => {
  it("1 says where an unfinished session stopped, even with weak topics", () => {
    const history = [finished(at(17), [["q-quiz-s01-001", false]])];
    expect(summary(session("scenario", 6), history).subtitle).toBe(
      "You stopped at question 7 of 20.",
    );
  });

  it("2 asks for a first scenario when nothing is started", () => {
    expect(summary(null, []).subtitle).toBe("Start with your first scenario.");
  });

  it("3 counts the topics that need another look, in the singular too", () => {
    const one = [finished(at(17), [["q-quiz-s01-001", false]])];
    expect(summary(null, one).subtitle).toBe("1 topic needs another look.");
    const two = [
      finished(at(17), [
        ["q-quiz-s01-001", false],
        ["q-s2-1", false],
      ]),
    ];
    expect(summary(null, two).subtitle).toBe("2 topics need another look.");
  });

  it("4 says ready when nothing is weak, and never mentions a daily goal", () => {
    for (const history of [
      [rightAnswers(at(17), fiveRight)],
      [rightAnswers(at(17), fiveRight.slice(0, 3))],
      [rightAnswers(at(16), fiveRight)],
    ]) {
      expect(summary(null, history).subtitle).toBe("You are ready. Try a mini-quiz to stay sharp.");
    }
  });

  it("follows the priority order", () => {
    const weak = [finished(at(17), [["q-quiz-s01-001", false]])];
    expect(summary(session("quiz", 2, 5), weak).subtitle).toBe("You stopped at question 3 of 5.");
    expect(summary(null, []).subtitle).toBe("Start with your first scenario.");
    expect(summary(null, weak).subtitle).toBe("1 topic needs another look.");
  });
});

describe("the removed topic strip and daily goal", () => {
  it("are no longer part of the Home summary or the code", () => {
    expect(Object.keys(summary(null, []))).toEqual(["subtitle"]);
    expect(existsSync("lib/daily-goal.ts")).toBe(false);
    const home = readFileSync("lib/home.ts", "utf8");
    expect(home).not.toMatch(/DAILY_GOAL|questionsToday|topicStrip|SegmentState/);
  });
});

describe("readiness", () => {
  /** Questions of the guide's sections S1 to S10, in both modes. */
  const TOTAL = modeItems("scenario").length + modeItems("quiz").length;

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
      ["q-scn-s01-001", true],
      ["s2", true],
    ]);
    const before = readiness([first]);
    const more = finished(2, [
      ["q-scn-s01-001", true],
      ["q-quiz-s01-001", true],
      ["q-quiz-s01-002", true],
    ]);
    expect(readiness([first, more])).toBeGreaterThan(before);
    // s1 was right twice: 4 different questions are right, not 5.
    expect(readiness([first, more])).toBe(Math.floor((4 / TOTAL) * 100));
  });

  it("uses only the latest answer: a later wrong answer takes a question away, a right one gives it back", () => {
    const right = finished(1, [
      ["q-scn-s01-001", true],
      ["q-quiz-s01-001", true],
    ]);
    const wrong = finished(2, [["q-scn-s01-001", false]]);
    const again = finished(3, [["q-scn-s01-001", true]]);
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
        ["q-scn-s01-001", true],
        ["q-quiz-s01-001", true],
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
  const counts = homeCounts({ history: [], saved: ["q-scn-s01-001", "q-s2-1", "gone"] });
  const exam = (at: number, percent: number): FinishedSession => ({
    ...finished(at, [["q-quiz-s01-001", true]]),
    kind: "exam",
    exam: { percent, questions: 20, timeUsedSeconds: 600 },
  });

  it("counts exam, saved questions, weak sections and checklists", () => {
    expect(counts).toEqual({
      assigned: null,
      bestExam: null,
      weakSections: 0,
      saved: 2,
      checklists: 3,
    });
  });

  it("counts the sections to repeat from the latest wrong answers", () => {
    const history = [
      finished(1, [
        ["q-scn-s01-001", false],
        ["s4", false],
        ["q-quiz-s01-001", false],
        ["s2", true],
      ]),
    ];
    expect(homeCounts({ history, saved: null }).weakSections).toBe(2);
    const cleared = [
      ...history,
      finished(2, [
        ["q-scn-s01-001", true],
        ["q-quiz-s01-001", true],
      ]),
    ];
    expect(homeCounts({ history: cleared, saved: null }).weakSections).toBe(1);
  });

  it("are exactly four: Exam, Steps, Weak topics and Saved questions, and no Materials tile", () => {
    const tiles = homeTiles(counts);
    expect(tiles.map((tile) => [tile.title, tile.count, tile.href])).toEqual([
      ["Exam", "Not taken yet", "/exam"],
      ["Steps", "3 checklists", "/checklists"],
      ["Weak topics", "Nothing to repeat", "/weak-topics"],
      ["Saved questions", "2 saved", "/saved"],
    ]);
    expect(tiles.some((tile) => /materials|guide/i.test(tile.title + tile.href))).toBe(false);
  });

  it("shows the best exam result as a count once an exam was taken, never a percentage", () => {
    const history = [exam(1, 70), exam(2, 85), exam(3, 60)];
    // the fake exams answer one question correctly; the best percent decides which one is the best
    expect(homeCounts({ history, saved: null }).bestExam).toEqual({ correct: 1, questions: 20 });
    expect(homeTiles(homeCounts({ history, saved: null }))[0].count).toBe("Best: 1 of 20");
  });

  it("says how many sections are to repeat, in the singular too", () => {
    expect(homeTiles({ ...counts, weakSections: 3 })[2].count).toBe("3 sections to repeat");
    expect(homeTiles({ ...counts, weakSections: 1 })[2].count).toBe("1 section to repeat");
    expect(homeTiles({ ...counts, saved: 0 })[3].count).toBe("0 saved");
  });

  it("has no per-tile colour: every tile is drawn in the one neutral tile", () => {
    for (const tile of homeTiles(counts)) expect(tile).not.toHaveProperty("tone");
  });
});
