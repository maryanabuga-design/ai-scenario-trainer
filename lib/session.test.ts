import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { scoreSession } from "@/lib/progress";
import {
  answerFor,
  finishSession,
  firstUnanswered,
  isValidSession,
  saveSession,
  startSession,
  withAnswer,
  withHintUsed,
} from "@/lib/session";
import type { FinishedSession, Session } from "@/lib/session";
import { createStore } from "@/lib/store";

/** A browser storage in memory, so the tests read back what the stores really saved. */
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

/** What is saved under a key right now, read by a fresh store. */
const read = <T>(key: string) => createStore<T>(key).read();

const base: Session = {
  kind: "scenario",
  itemIds: ["s1", "s2", "s3"],
  answers: [],
  index: 0,
  finished: false,
};

describe("answers are kept per question and can be changed", () => {
  it("saves the chosen option and finds it again", () => {
    const answered = withAnswer(base, "s2", "c");
    expect(answerFor(answered, "s2")).toEqual({ itemId: "s2", optionId: "c" });
    expect(answerFor(answered, "s1")).toBeUndefined();
  });

  it("replaces an earlier choice instead of adding a second one", () => {
    const session = withAnswer(withAnswer(base, "s1", "a"), "s1", "b");
    expect(session.answers).toEqual([{ itemId: "s1", optionId: "b" }]);
  });

  it("finds the first question without an answer", () => {
    expect(firstUnanswered(base)).toBe(0);
    const some = withAnswer(withAnswer(base, "s1", "b"), "s2", "c");
    expect(firstUnanswered(some)).toBe(2);
    expect(firstUnanswered(withAnswer(some, "s3", "a"))).toBe(-1);
  });

  it("changing an answer changes the final result; nothing is scored before Finish", () => {
    let session = withAnswer(withAnswer(withAnswer(base, "s1", "d"), "s2", "c"), "s3", "a");
    const before = scoreSession(session);
    session = withAnswer(session, "s1", "b"); // Back to question 1 and choose the right option
    const after = scoreSession(session);
    expect(before.find((item) => item.id === "s1")?.correct).toBe(false);
    expect(after.find((item) => item.id === "s1")?.correct).toBe(true);
    expect(after.filter((item) => item.correct)).toHaveLength(
      before.filter((item) => item.correct).length + 1,
    );
  });
});

describe("starting and finishing", () => {
  it("starts a session of any kind from a list of questions", () => {
    startSession("quiz", ["q-s1-1", "q-s1-2"]);
    const quiz = read<Session>("ast.session.v1");
    expect(quiz).toMatchObject({ kind: "quiz", itemIds: ["q-s1-1", "q-s1-2"], index: 0 });
    expect(quiz?.finished).toBe(false);
    startSession("scenario", ["s1"], "building-evacuation-001");
    expect(read<Session>("ast.session.v1")?.scenarioId).toBe("building-evacuation-001");
  });

  it("puts the answers in the order of the questions and saves the finished session", () => {
    let session = base;
    for (const [id, option] of [
      ["s3", "a"],
      ["s1", "b"],
      ["s2", "c"],
    ]) {
      session = withAnswer(session, id, option);
    }
    finishSession(session);
    const done = read<Session>("ast.session.v1");
    expect(done?.finished).toBe(true);
    expect(done?.finishedAt).toBeTypeOf("number");
    expect(done?.answers.map((answer) => answer.itemId)).toEqual(["s1", "s2", "s3"]);
    const history = read<FinishedSession[]>("ast.history.v1");
    expect(history?.at(-1)?.answers.map((answer) => answer.itemId)).toEqual(["s1", "s2", "s3"]);
  });

  it("saves an unfinished session with its answers and the question on screen", () => {
    saveSession({ ...withAnswer(base, "s1", "b"), index: 1 });
    expect(read<Session>("ast.session.v1")).toMatchObject({
      index: 1,
      finished: false,
      answers: [{ itemId: "s1", optionId: "b" }],
    });
  });
});

describe("hints are recorded on the answer", () => {
  it("records hintUsed on an answer that exists when the hint is opened", () => {
    const answered = withHintUsed(withAnswer(base, "s1", "a"), "s1");
    expect(answerFor(answered, "s1")).toEqual({ itemId: "s1", optionId: "a", hintUsed: true });
  });

  it("keeps it for an answer given after the hint, and when the answer is changed", () => {
    const opened = withHintUsed(base, "s2");
    expect(answerFor(opened, "s2")).toBeUndefined();
    const answered = withAnswer(opened, "s2", "a");
    expect(answerFor(answered, "s2")?.hintUsed).toBe(true);
    expect(answerFor(withAnswer(answered, "s2", "c"), "s2")).toEqual({
      itemId: "s2",
      optionId: "c",
      hintUsed: true,
    });
  });

  it("leaves other questions without hintUsed, and saves it in the finished session", () => {
    let session = withHintUsed(withAnswer(base, "s1", "b"), "s1");
    session = withAnswer(withAnswer(session, "s2", "c"), "s3", "a");
    expect(answerFor(session, "s2")).toEqual({ itemId: "s2", optionId: "c" });
    finishSession(session);
    const done = read<Session>("ast.session.v1");
    expect(done?.answers.find((answer) => answer.itemId === "s1")?.hintUsed).toBe(true);
    expect(done?.answers.find((answer) => answer.itemId === "s2")?.hintUsed).toBeUndefined();
    const history = read<FinishedSession[]>("ast.history.v1");
    expect(history?.at(-1)?.answers.find((answer) => answer.itemId === "s1")?.hintUsed).toBe(true);
  });
});

describe("the saved schema is versioned", () => {
  it("reads a value saved with schema 2 as it is (version 3 only adds fields) and writes it back as 3", () => {
    saved.set("ast.session.v1", JSON.stringify({ schema: 2, value: base }));
    expect(read<Session>("ast.session.v1")).toEqual(base);
    saveSession(base);
    expect(JSON.parse(saved.get("ast.session.v1")!).schema).toBe(3);
  });

  it("saves the value with the schema version", () => {
    saveSession(base);
    expect(JSON.parse(saved.get("ast.session.v1")!)).toMatchObject({ schema: 3, value: base });
  });

  it("ignores a session saved by an older version, without crashing", () => {
    const old = {
      mode: "full",
      stepIds: ["s1"],
      index: 0,
      phase: "decide",
      answers: [{ stepId: "s1", optionId: "b", confidence: 3, explanation: "" }],
      finished: false,
    };
    saved.set("ast.session.v1", JSON.stringify(old));
    expect(read<Session>("ast.session.v1")).toBeNull();
    saved.set("ast.session.v1", JSON.stringify({ schema: 1, value: base }));
    expect(read<Session>("ast.session.v1")).toBeNull();
    saved.set("ast.session.v1", JSON.stringify({ schema: 4, value: base }));
    expect(read<Session>("ast.session.v1")).toBeNull();
    saved.set("ast.session.v1", "not json at all {");
    expect(read<Session>("ast.session.v1")).toBeNull();
    saved.set("ast.history.v1", JSON.stringify([{ kind: "quiz", mode: "quiz", answers: [] }]));
    expect(read<FinishedSession[]>("ast.history.v1")).toBeNull();
  });

  it("does not use a saved session of the right version but the wrong shape", () => {
    expect(isValidSession(null)).toBe(false);
    expect(isValidSession({ kind: "quiz" })).toBe(false);
    expect(isValidSession({ ...base, itemIds: ["gone-question"] })).toBe(false);
    expect(isValidSession(base)).toBe(true);
  });
});
