import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { modeItems } from "@/lib/parts";
import { PASS_MARK } from "@/lib/config";
import { getItem } from "@/lib/items";
import {
  modeStats,
  partRing,
  partState,
  readinessOf,
  recommendedPart,
  weakCount,
  weakSectionsOf,
  withPartResult,
} from "@/lib/part-progress";
import type { PartRecords } from "@/lib/part-progress";
import { getPart, partsFor } from "@/lib/parts";
import { finishSession, saveSession, startSession, withAnswer } from "@/lib/session";
import type { FinishedSession, Session } from "@/lib/session";
import { createStore } from "@/lib/store";

const saved = new Map<string, string>();
beforeAll(() => {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => void saved.set(key, value),
      removeItem: (key: string) => void saved.delete(key),
    },
  });
});
afterAll(() => vi.unstubAllGlobals());

const rightOf = (id: string) => getItem(id).correctOptionId;
const wrongOf = (id: string) =>
  getItem(id).options.find((option) => option.id !== getItem(id).correctOptionId)!.id;

/** A finished session answering the given questions right or wrong. */
function finished(at: number, picks: [string, boolean][], partId?: string): FinishedSession {
  return {
    kind: "quiz",
    itemIds: picks.map(([id]) => id),
    answers: picks.map(([itemId, right]) => ({
      itemId,
      optionId: right ? rightOf(itemId) : wrongOf(itemId),
    })),
    finishedAt: at,
    ...(partId && { partId }),
  };
}

const quizS1 = partsFor("quiz").find((part) => part.sectionId === "S1")!;
const scenarioS2 = partsFor("scenario").find((part) => part.sectionId === "S2")!;

describe("stats follow the mode", () => {
  const history = [
    finished(1, [
      ["q-scn-s01-001", true],
      ["s2", false],
      ["q-quiz-s01-001", true],
      ["q-quiz-s01-002", true],
      ["q-s2-1", false],
    ]),
  ];

  it("counts answered over all questions of the mode, and accuracy of the answered", () => {
    expect(modeStats(history, "scenario")).toEqual({
      answered: 2,
      total: modeItems("scenario").length,
      correct: 1,
      accuracy: 50,
    });
    expect(modeStats(history, "quiz")).toEqual({
      answered: 3,
      total: modeItems("quiz").length,
      correct: 2,
      accuracy: 67,
    });
  });

  it("is 0 answered and 0% accuracy when nothing is done", () => {
    expect(modeStats(null, "quiz")).toEqual({
      answered: 0,
      total: modeItems("quiz").length,
      correct: 0,
      accuracy: 0,
    });
    expect(modeStats([], "scenario").accuracy).toBe(0);
  });

  it("counts a question once, by its latest finished answer, whatever the order stored", () => {
    const later = finished(2, [
      ["s2", true],
      ["q-quiz-s01-001", false],
    ]);
    const stats = modeStats([later, ...history], "quiz");
    expect(stats.answered).toBe(3);
    expect(stats.correct).toBe(1);
    expect(modeStats([later, ...history], "scenario").correct).toBe(2);
  });

  it("ignores questions outside the guide's sections (the flood guide)", () => {
    expect(modeStats([finished(1, [["flood-s1", true]])], "scenario").answered).toBe(0);
  });
});

describe("weak counts", () => {
  const history = [
    finished(1, [
      ["q-quiz-s01-001", false],
      ["q-quiz-s01-002", false],
      ["q-s2-1", true],
    ]),
  ];

  it("counts the questions of a section whose latest answer is wrong, in that mode", () => {
    expect(weakCount(history, "quiz", "S1")).toBe(2);
    expect(weakCount(history, "quiz", "S2")).toBe(0);
    expect(weakCount(history, "scenario", "S1")).toBe(0);
  });

  it("lists the sections with at least one wrong answer, and clears them when repeated right", () => {
    expect(weakSectionsOf(history, "quiz")).toEqual(["S1"]);
    const cleared = [
      ...history,
      finished(2, [
        ["q-quiz-s01-001", true],
        ["q-quiz-s01-002", true],
      ]),
    ];
    expect(weakSectionsOf(cleared, "quiz")).toEqual([]);
  });
});

describe("part states and the recommended part", () => {
  const records: PartRecords = {
    [quizS1.id]: { lastPercent: 60, attempts: 1, answeredIds: quizS1.itemIds, correctIds: [] },
  };
  const unfinishedS2: Pick<Session, "partId" | "finished"> = {
    partId: scenarioS2.id,
    finished: false,
  };

  it("is not started, in progress with an unfinished session, or done with a finished attempt", () => {
    expect(partState(quizS1, null, null)).toBe("not started");
    expect(partState(quizS1, records, null)).toBe("done");
    expect(partState(scenarioS2, records, unfinishedS2)).toBe("in progress");
    expect(partState(scenarioS2, records, { partId: scenarioS2.id, finished: true })).toBe(
      "not started",
    );
  });

  it("recommends the first part that is not done, one per topic", () => {
    const parts = partsFor("quiz").filter((part) => part.sectionId === "S1");
    expect(recommendedPart(parts, null, null)?.id).toBe(parts[0].id);
    // S1 has two quiz parts: with part 1 done the next one is part 2, and with both done none is left.
    expect(parts).toHaveLength(2);
    expect(recommendedPart(parts, records, null)?.id).toBe(parts[1].id);
    const bothDone = { ...records, [parts[1].id]: records[parts[0].id] };
    expect(recommendedPart(parts, bothDone, null)).toBeNull();
  });

  it("shows a grey empty ring when not started, the last result when done, a pass at the mark", () => {
    expect(partRing(quizS1, null)).toEqual({ percent: 0, passed: false, started: false });
    expect(partRing(quizS1, records)).toEqual({ percent: 60, passed: false, started: true });
    const passed = { [quizS1.id]: { ...records[quizS1.id], lastPercent: PASS_MARK } };
    expect(partRing(quizS1, passed).passed).toBe(true);
    const below = { [quizS1.id]: { ...records[quizS1.id], lastPercent: PASS_MARK - 1 } };
    expect(partRing(quizS1, below).passed).toBe(false);
  });
});

describe("a finished part session updates the part", () => {
  it("stores the last percent, the attempts and the questions answered and answered right", () => {
    const answers = quizS1.itemIds.map((itemId, index) => ({
      itemId,
      optionId: index === 0 ? wrongOf(itemId) : rightOf(itemId),
    }));
    const first = withPartResult(null, { partId: quizS1.id, answers })!;
    const record = first[quizS1.id];
    expect(record.attempts).toBe(1);
    expect(record.lastPercent).toBe(
      Math.floor(((quizS1.itemIds.length - 1) / quizS1.itemIds.length) * 100),
    );
    expect(record.answeredIds).toEqual(quizS1.itemIds);
    expect(record.correctIds).toEqual(quizS1.itemIds.slice(1));
    const allRight = quizS1.itemIds.map((itemId) => ({ itemId, optionId: rightOf(itemId) }));
    const second = withPartResult(first, { partId: quizS1.id, answers: allRight })!;
    expect(second[quizS1.id]).toMatchObject({ attempts: 2, lastPercent: 100 });
    expect(second[quizS1.id].correctIds).toEqual(quizS1.itemIds);
  });

  it("changes nothing for a session that is not a part, or an unknown part", () => {
    expect(withPartResult(null, { answers: [] })).toBeNull();
    expect(withPartResult(null, { partId: "quiz:S1:9", answers: [] })).toBeNull();
  });

  it("is saved when the session finishes and not before: unfinished sessions count toward nothing", () => {
    const read = () => createStore<PartRecords>("ast.parts.v1").read();
    startSession("quiz", quizS1.itemIds, { partId: quizS1.id, returnTo: "/training?mode=quiz" });
    let session = createStore<Session>("ast.session.v1").read() as Session;
    expect(session).toMatchObject({ partId: quizS1.id, returnTo: "/training?mode=quiz" });
    quizS1.itemIds.slice(0, 2).forEach((id) => {
      session = withAnswer(session, id, rightOf(id));
    });
    saveSession(session);
    expect(read()).toBeNull();
    expect(modeStats([], "quiz").answered).toBe(0);
    quizS1.itemIds.forEach((id) => {
      session = withAnswer(session, id, rightOf(id));
    });
    finishSession(session);
    expect(read()?.[quizS1.id]).toMatchObject({ attempts: 1, lastPercent: 100 });
    const history = createStore<FinishedSession[]>("ast.history.v1").read();
    expect(history?.at(-1)?.partId).toBe(quizS1.id);
  });

  it("does not touch a part ring for a repeat round or another session", () => {
    const before = createStore<PartRecords>("ast.parts.v1").read();
    finishSession({
      kind: "repeat",
      itemIds: ["q-s2-1"],
      answers: [{ itemId: "q-s2-1", optionId: rightOf("q-s2-1") }],
      index: 0,
      finished: false,
    });
    expect(createStore<PartRecords>("ast.parts.v1").read()).toEqual(before);
  });
});

describe("readiness", () => {
  it("is the same selectors over both modes", () => {
    const history = [
      finished(1, [
        ["q-scn-s01-001", true],
        ["q-quiz-s01-001", true],
      ]),
    ];
    expect(readinessOf(history)).toBe(
      Math.floor((2 / (modeItems("scenario").length + modeItems("quiz").length)) * 100),
    );
    expect(getPart("scenario:S1:1")).toBeDefined();
  });
});

describe("a finished mini-quiz", () => {
  it("counts toward the stats and the readiness but not toward any part ring", () => {
    const records = () => createStore<PartRecords>("ast.parts.v1").read();
    const historyNow = () => createStore<FinishedSession[]>("ast.history.v1").read();
    const before = records();
    const statsBefore = modeStats(historyNow(), "quiz");
    const readyBefore = readinessOf(historyNow());
    // a mini-quiz: a quiz session with no part, three questions of S5-S7, all right
    const ids = ["q-s5-1", "q-s6-1", "q-s7-1"];
    startSession("quiz", ids, { returnTo: "/" });
    let session = createStore<Session>("ast.session.v1").read() as Session;
    ids.forEach((id) => {
      session = withAnswer(session, id, rightOf(id));
    });
    finishSession(session);
    expect(records()).toEqual(before);
    const statsAfter = modeStats(historyNow(), "quiz");
    expect(statsAfter.answered).toBe(statsBefore.answered + 3);
    expect(statsAfter.correct).toBe(statsBefore.correct + 3);
    expect(readinessOf(historyNow())).toBeGreaterThan(readyBefore);
    expect(createStore<Session>("ast.session.v1").read()?.returnTo).toBe("/");
  });
});
