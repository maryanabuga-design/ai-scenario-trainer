import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { contentFingerprint } from "@/lib/content-version";
import { examResults } from "@/lib/exam";
import { findItem, getItem } from "@/lib/items";
import { modeStats, readinessOf } from "@/lib/part-progress";
import { scoreSession, weakItemsFromHistory } from "@/lib/progress";
import { homeCounts, homeSummary, topicStrip } from "@/lib/home";

const storage = new Map<string, string>();
beforeAll(() => {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => void storage.set(key, value),
      removeItem: (key: string) => void storage.delete(key),
    },
  });
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => storage.clear());

/**
 * The readers of the saved data, loaded fresh: each store keeps what it read in memory, so a test
 * that changes the browser storage by hand needs new stores, as a new page load would have.
 */
async function load() {
  vi.resetModules();
  const [session, part, saved, exam, store] = await Promise.all([
    import("@/lib/session"),
    import("@/lib/part-progress"),
    import("@/lib/saved"),
    import("@/lib/exam-store"),
    import("@/lib/store"),
  ]);
  return {
    readSession: session.readSession,
    readHistory: session.readHistory,
    startSession: session.startSession,
    readPartRecords: part.readPartRecords,
    readSaved: saved.readSaved,
    readExam: exam.readExam,
    SCHEMA_VERSION: store.SCHEMA_VERSION,
  };
}

/** What an older browser holds: a value saved with schema 5, with no content fingerprint. */
const old = (key: string, value: unknown, schema = 5) =>
  storage.set(key, JSON.stringify({ schema, value }));

const GONE = ["s1", "s7", "q-s1-1", "q-s1-4"];
const right = (id: string) => ({ itemId: id, optionId: getItem(id).correctOptionId });
const NOW = new Date(2026, 9, 17, 12, 0);

describe("an unknown id never throws", () => {
  it("findItem returns nothing for an id that is gone", async () => {
    for (const id of GONE) expect(findItem(id)).toBeUndefined();
    expect(() => getItem("s1")).toThrow();
  });

  it("scoreSession skips the answers whose question is gone", async () => {
    const items = scoreSession({
      answers: [
        { itemId: "s1", optionId: "b" },
        right("q-quiz-s01-001"),
        { itemId: "q-s1-1", optionId: "a" },
      ],
    });
    expect(items.map((item) => item.id)).toEqual(["q-quiz-s01-001"]);
  });
});

describe("saved sessions", () => {
  it("drops an unfinished session with an unknown id, so Continue never shows", async () => {
    old("ast.session.v1", {
      kind: "scenario",
      itemIds: ["s1", "s2", "s3"],
      answers: [{ itemId: "s1", optionId: "b" }],
      index: 1,
      finished: false,
    });
    expect((await load()).readSession()).toBeNull();
  });

  it("drops a session that has only unknown ids or no questions", async () => {
    old("ast.session.v1", {
      kind: "quiz",
      itemIds: ["q-s1-1", "q-s1-2"],
      answers: [],
      index: 0,
      finished: false,
    });
    expect((await load()).readSession()).toBeNull();
    old("ast.session.v1", { kind: "quiz", itemIds: [], answers: [], index: 0, finished: false });
    expect((await load()).readSession()).toBeNull();
  });

  it("keeps a session whose ids all still exist, with its answers", async () => {
    const valid = {
      kind: "quiz",
      itemIds: ["q-quiz-s01-001", "q-s2-1"],
      answers: [{ itemId: "q-quiz-s01-001", optionId: "a" }],
      index: 1,
      finished: false,
    };
    old("ast.session.v1", valid);
    expect((await load()).readSession()).toEqual(valid);
  });
});

describe("saved results (history)", () => {
  const entry = (answers: { itemId: string; optionId: string }[], at: number) => ({
    kind: "quiz",
    itemIds: answers.map((answer) => answer.itemId),
    answers,
    finishedAt: at,
  });

  it("removes the answers of removed questions and keeps the valid ones in the same entry", async () => {
    old("ast.history.v1", [
      entry([{ itemId: "q-s1-1", optionId: "b" }, right("q-quiz-s01-001"), right("s2")], 1),
    ]);
    const history = (await load()).readHistory()!;
    expect(history).toHaveLength(1);
    expect(history[0].answers.map((answer) => answer.itemId)).toEqual(["q-quiz-s01-001", "s2"]);
    expect(history[0].itemIds).toEqual(["q-quiz-s01-001", "s2"]);
  });

  it("drops an entry with nothing valid left, exams included", async () => {
    old("ast.history.v1", [
      entry([{ itemId: "s1", optionId: "b" }], 1),
      {
        ...entry([{ itemId: "q-s1-2", optionId: "b" }], 2),
        kind: "exam",
        exam: { percent: 90, questions: 20, timeUsedSeconds: 60 },
      },
      entry([right("s2")], 3),
    ]);
    const history = (await load()).readHistory()!;
    expect(history.map((session) => session.finishedAt)).toEqual([3]);
    expect(examResults(history)).toEqual({ last: null, best: null });
  });

  it("keeps a valid exam with its result", async () => {
    const exam = {
      ...entry([right("s2")], 5),
      kind: "exam",
      exam: { percent: 85, questions: 20, timeUsedSeconds: 600 },
    };
    old("ast.history.v1", [exam]);
    expect(examResults((await load()).readHistory()).best?.percent).toBe(85);
  });

  it("feeds stats, readiness, weak topics and Home without throwing", async () => {
    old("ast.history.v1", [
      entry([{ itemId: "s1", optionId: "b" }, { itemId: "q-s1-3", optionId: "a" }, right("s2")], 1),
    ]);
    const history = (await load()).readHistory();
    const app = await load();
    expect(() => {
      modeStats(history, "scenario");
      modeStats(history, "quiz");
      readinessOf(history);
      weakItemsFromHistory(history);
      homeCounts({ history, saved: app.readSaved() });
      homeSummary({ unfinished: null, history, records: app.readPartRecords(), now: NOW });
    }).not.toThrow();
    expect(modeStats(history, "scenario").answered).toBe(1);
  });
});

describe("part progress", () => {
  const record = (ids: string[], percent = 100) => ({
    lastPercent: percent,
    attempts: 1,
    answeredIds: ids,
    correctIds: ids,
  });

  it("ignores a part result that refers only to removed ids", async () => {
    old("ast.parts.v1", {
      "quiz:S1:1": record(["q-s1-1", "q-s1-2"]),
      "quiz:S2:1": record(["q-s2-1"]),
    });
    expect(Object.keys((await load()).readPartRecords()!)).toEqual(["quiz:S2:1"]);
  });

  it("keeps the valid ids of a part result and drops the removed ones", async () => {
    old("ast.parts.v1", { "quiz:S1:1": record(["q-s1-1", "q-quiz-s01-001"]) });
    expect((await load()).readPartRecords()!["quiz:S1:1"].answeredIds).toEqual(["q-quiz-s01-001"]);
  });

  it("ignores a result for a part that does not exist", async () => {
    old("ast.parts.v1", { "quiz:S1:9": record(["q-quiz-s01-001"]) });
    expect((await load()).readPartRecords()).toEqual({});
  });

  it("shows a strip with no done topic from old part results", async () => {
    old("ast.parts.v1", { "quiz:S1:1": record(["q-s1-1"]), "scenario:S1:1": record(["s1"]) });
    expect(
      topicStrip((await load()).readPartRecords()).every(
        (segment) => segment.state === "not started",
      ),
    ).toBe(true);
  });
});

describe("saved questions and the exam", () => {
  it("removes saved questions that are gone and keeps the others in order", async () => {
    old("ast.saved.v1", ["s1", "q-s2-1", "q-s1-1", "q-quiz-s01-003"]);
    expect((await load()).readSaved()).toEqual(["q-s2-1", "q-quiz-s01-003"]);
  });

  it("drops an exam with a removed question, running or finished", async () => {
    const exam = {
      itemIds: ["q-s1-1", "q-s2-1"],
      answers: [],
      index: 0,
      startedAt: 1,
      endsAt: 2,
      finished: false,
    };
    old("ast.exam.v1", exam);
    expect((await load()).readExam()).toBeNull();
    old("ast.exam.v1", { ...exam, itemIds: ["q-s2-1"] });
    expect((await load()).readExam()?.itemIds).toEqual(["q-s2-1"]);
  });
});

describe("the content fingerprint and schema", () => {
  it("is written with every save and is the current one", async () => {
    (await load()).startSession("quiz", ["q-quiz-s01-001"]);
    const stored = JSON.parse(storage.get("ast.session.v1")!);
    expect(stored.schema).toBe((await load()).SCHEMA_VERSION);
    expect((await load()).SCHEMA_VERSION).toBe(6);
    expect(stored.content).toBe(contentFingerprint);
    expect(contentFingerprint).toMatch(/^[0-9a-z]+$/);
  });

  it("reads data saved with schemas 2 to 5 and cleans it", async () => {
    for (const schema of [2, 3, 4, 5]) {
      old("ast.saved.v1", ["s1", "q-s2-1"], schema);
      expect((await load()).readSaved()).toEqual(["q-s2-1"]);
    }
  });

  it("does not read data of a newer schema", async () => {
    old("ast.saved.v1", ["q-s2-1"], 7);
    expect((await load()).readSaved()).toBeNull();
  });
});

describe("corrupted or incompatible data", () => {
  const keys = ["ast.session.v1", "ast.history.v1", "ast.parts.v1", "ast.saved.v1", "ast.exam.v1"];

  it("reads as an empty state when the JSON is broken", async () => {
    for (const key of keys) storage.set(key, "{not json at all");
    expect((await load()).readSession()).toBeNull();
    expect((await load()).readHistory()).toBeNull();
    expect((await load()).readPartRecords()).toBeNull();
    expect((await load()).readSaved()).toBeNull();
    expect((await load()).readExam()).toBeNull();
  });

  it("reads as an empty state when the shape is wrong, and never throws", async () => {
    for (const bad of [
      null,
      5,
      "text",
      [],
      {},
      { schema: 5 },
      { schema: 5, value: 12 },
      { schema: 5, value: "x" },
    ]) {
      for (const key of keys) storage.set(key, JSON.stringify(bad));
      const app = await load();
      expect(() => {
        app.readSession();
        app.readHistory();
        app.readPartRecords();
        app.readSaved();
        app.readExam();
      }).not.toThrow();
      expect(app.readSession()).toBeNull();
      expect(app.readExam()).toBeNull();
    }
  });

  it("cleans a history that holds the wrong kinds of entries", async () => {
    old("ast.history.v1", [
      null,
      3,
      "x",
      { answers: "no" },
      { itemIds: [], answers: [], finishedAt: 1 },
    ]);
    expect((await load()).readHistory()).toEqual([]);
    old("ast.history.v1", { not: "a list" });
    expect((await load()).readHistory()).toBeNull();
  });
});
