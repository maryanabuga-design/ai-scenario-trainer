import { describe, expect, it } from "vitest";
import { PASS_MARK } from "@/lib/config";
import { DAILY_GOAL, questionsToday } from "@/lib/daily-goal";
import {
  heroCounts,
  heroCountsLine,
  homeCounts,
  homeSummary,
  homeTiles,
  readiness,
  topicStrip,
} from "@/lib/home";
import { getItem } from "@/lib/items";
import { modeStats } from "@/lib/part-progress";
import type { PartRecords } from "@/lib/part-progress";
import { modeItems, trainingSections } from "@/lib/parts";
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

const NOW = new Date(2026, 9, 17, 15, 0);
const at = (day: number, hour = 10) => new Date(2026, 9, day, hour).getTime();
const summary = (
  unfinished: Session | null,
  history: FinishedSession[] | null,
  records: PartRecords | null = null,
  now = NOW,
) => homeSummary({ unfinished, history, records, now });

/** A finished session of right answers ended at `time`. */
const rightAnswers = (time: number, ids: string[]) =>
  finished(
    time,
    ids.map((id): [string, boolean] => [id, true]),
  );
const fiveRight = ["q-s1-1", "q-s1-2", "q-s1-3", "q-s1-4", "q-s2-1"];

const record = (lastPercent: number) => ({
  lastPercent,
  attempts: 1,
  answeredIds: [],
  correctIds: [],
});

describe("the topic strip", () => {
  const states = (records: PartRecords | null) => topicStrip(records).map((s) => s.state);

  it("has one segment per guide section, all not started at the start", () => {
    const strip = topicStrip(null);
    expect(strip.map((segment) => segment.sectionId)).toEqual(trainingSections);
    expect(strip).toHaveLength(10);
    expect(states(null).every((state) => state === "not started")).toBe(true);
    expect(states({})).toEqual(states(null));
  });

  it("is in progress once any part of the section has a finished attempt", () => {
    expect(states({ "quiz:S3:1": record(40) })[2]).toBe("in progress");
    expect(states({ "quiz:S3:1": record(40) }).filter((s) => s !== "not started")).toHaveLength(1);
  });

  it("is done only when every part of the section, in both modes, is at or above the pass mark", () => {
    // S1 has a scenario part and a quiz part.
    expect(states({ "quiz:S1:1": record(100) })[0]).toBe("in progress");
    expect(states({ "quiz:S1:1": record(100), "scenario:S1:1": record(PASS_MARK - 1) })[0]).toBe(
      "in progress",
    );
    expect(states({ "quiz:S1:1": record(100), "scenario:S1:1": record(PASS_MARK) })[0]).toBe(
      "done",
    );
    // S3 has no scenario part: its quiz part alone decides.
    expect(states({ "quiz:S3:1": record(PASS_MARK) })[2]).toBe("done");
  });

  it("feeds the summary", () => {
    expect(summary(null, [], { "quiz:S3:1": record(100) }).strip[2].state).toBe("done");
  });
});

describe("the sentence under the greeting", () => {
  it("1 says where an unfinished session stopped, even with weak topics and a reached goal", () => {
    const history = [finished(at(17), [["q-s1-1", false]])];
    expect(summary(session("scenario", 6), history).subtitle).toBe(
      "You stopped at question 7 of 20.",
    );
  });

  it("2 asks for a first scenario when nothing is started", () => {
    expect(summary(null, []).subtitle).toBe("Start with your first scenario.");
  });

  it("3 counts the topics that need another look, in the singular too, before the daily goal", () => {
    const one = [finished(at(17), [["q-s1-1", false]])];
    expect(summary(null, one).subtitle).toBe("1 topic needs another look.");
    const two = [
      finished(at(17), [
        ["q-s1-1", false],
        ["q-s2-1", false],
      ]),
    ];
    expect(summary(null, two).subtitle).toBe("2 topics need another look.");
  });

  it("4 counts the questions left to the daily goal", () => {
    const three = [rightAnswers(at(17), fiveRight.slice(0, 3))];
    expect(summary(null, three).subtitle).toBe("2 more questions to reach today's goal.");
    const four = [rightAnswers(at(17), fiveRight.slice(0, 4))];
    expect(summary(null, four).subtitle).toBe("1 more question to reach today's goal.");
  });

  it("5 says ready when the goal is reached and nothing is weak", () => {
    expect(summary(null, [rightAnswers(at(17), fiveRight)]).subtitle).toBe(
      "You are ready. Try a mini-quiz to stay sharp.",
    );
  });

  it("follows the priority order with fake data and a fake date", () => {
    const old = [rightAnswers(at(16), fiveRight)];
    expect(summary(null, old).subtitle).toBe("5 more questions to reach today's goal.");
    expect(summary(null, old, null, new Date(2026, 9, 16, 23, 0)).subtitle).toBe(
      "You are ready. Try a mini-quiz to stay sharp.",
    );
  });
});

describe("the daily goal", () => {
  it("is 5 questions", () => {
    expect(DAILY_GOAL).toBe(5);
  });

  it("counts the answers of finished sessions of the local day only", () => {
    const history = [
      rightAnswers(at(17, 8), ["q-s1-1", "q-s1-2"]),
      rightAnswers(at(17, 12), ["q-s1-3"]),
      rightAnswers(at(16, 23), ["q-s1-4", "q-s2-1"]),
    ];
    expect(questionsToday(history, NOW)).toBe(3);
    expect(questionsToday(null, NOW)).toBe(0);
    expect(summary(null, history).goal).toEqual({ done: 3, goal: 5 });
  });

  it("starts again at local midnight", () => {
    const history = [rightAnswers(new Date(2026, 9, 17, 23, 59).getTime(), fiveRight)];
    expect(questionsToday(history, new Date(2026, 9, 17, 23, 59))).toBe(5);
    expect(questionsToday(history, new Date(2026, 9, 18, 0, 1))).toBe(0);
  });

  it("counts nothing from an unfinished session", () => {
    const open = {
      ...session("quiz", 3, 5),
      answers: [{ itemId: "q-s1-1", optionId: "a" }],
    };
    expect(summary(open, []).goal.done).toBe(0);
  });

  it("shows at most the goal", () => {
    const more = [rightAnswers(at(17), [...fiveRight, "q-s2-2", "q-s2-3"])];
    expect(summary(null, more).goal).toEqual({ done: 5, goal: 5 });
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
  const counts = homeCounts({
    history: [],
    saved: ["s1", "q-s2-1", "gone"],
    guideSections: 17,
  });

  it("counts scenarios, questions, saved questions, sections and checklists", () => {
    expect(counts).toMatchObject({
      scenarios: 1,
      questions: 33,
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
      ["Scenarios", "1 scenario", "/training?mode=scenario"],
      ["Quiz", "33 questions", "/training?mode=quiz"],
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

describe("the hero card numbers", () => {
  it("are the real counts of the selected guide", () => {
    expect(heroCounts).toEqual({ scenarios: 1, questions: modeItems("quiz").length });
    expect(heroCountsLine(1, 33)).toBe("1 scenario · 33 quiz questions");
    expect(heroCountsLine(2, 1)).toBe("2 scenarios · 1 quiz question");
  });
});
