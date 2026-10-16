import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { contentFingerprint } from "@/lib/content-version";
import { scoreSession } from "@/lib/progress";
import {
  answerFor,
  finishSession,
  firstUnanswered,
  isDone,
  isValidSession,
  saveSession,
  startSession,
  withAnswer,
  withChecked,
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
  itemIds: ["q-scn-s01-001", "s2", "s3"],
  answers: [],
  index: 0,
  finished: false,
};

describe("answers are kept per question and can be changed", () => {
  it("saves the chosen option and finds it again", () => {
    const answered = withAnswer(base, "s2", "c");
    expect(answerFor(answered, "s2")).toEqual({ itemId: "s2", optionId: "c" });
    expect(answerFor(answered, "q-scn-s01-001")).toBeUndefined();
  });

  it("replaces an earlier choice instead of adding a second one", () => {
    const session = withAnswer(withAnswer(base, "q-scn-s01-001", "a"), "q-scn-s01-001", "b");
    expect(session.answers).toEqual([{ itemId: "q-scn-s01-001", optionId: "b" }]);
  });

  it("finds the first question without an answer", () => {
    expect(firstUnanswered(base)).toBe(0);
    const some = withAnswer(withAnswer(base, "q-scn-s01-001", "b"), "s2", "c");
    expect(firstUnanswered(some)).toBe(2);
    expect(firstUnanswered(withAnswer(some, "s3", "a"))).toBe(-1);
  });

  it("changing an answer changes the final result; nothing is scored before Finish", () => {
    let session = withAnswer(
      withAnswer(withAnswer(base, "q-scn-s01-001", "a"), "s2", "c"),
      "s3",
      "a",
    );
    const before = scoreSession(session);
    session = withAnswer(session, "q-scn-s01-001", "b"); // Back to question 1 and choose the right option
    const after = scoreSession(session);
    expect(before.find((item) => item.id === "q-scn-s01-001")?.correct).toBe(false);
    expect(after.find((item) => item.id === "q-scn-s01-001")?.correct).toBe(true);
    expect(after.filter((item) => item.correct)).toHaveLength(
      before.filter((item) => item.correct).length + 1,
    );
  });
});

describe("starting and finishing", () => {
  it("starts a session of any kind from a list of questions", () => {
    startSession("quiz", ["q-quiz-s01-001", "q-quiz-s01-002"]);
    const quiz = read<Session>("ast.session.v1");
    expect(quiz).toMatchObject({
      kind: "quiz",
      itemIds: ["q-quiz-s01-001", "q-quiz-s01-002"],
      index: 0,
    });
    expect(quiz?.finished).toBe(false);
    startSession("scenario", ["q-scn-s01-001"], { scenarioId: "building-evacuation-001" });
    expect(read<Session>("ast.session.v1")?.scenarioId).toBe("building-evacuation-001");
  });

  it("puts the answers in the order of the questions and saves the finished session", () => {
    let session = base;
    for (const [id, option] of [
      ["s3", "a"],
      ["q-scn-s01-001", "b"],
      ["s2", "c"],
    ]) {
      session = withAnswer(session, id, option);
    }
    finishSession(session);
    const done = read<Session>("ast.session.v1");
    expect(done?.finished).toBe(true);
    expect(done?.finishedAt).toBeTypeOf("number");
    expect(done?.answers.map((answer) => answer.itemId)).toEqual(["q-scn-s01-001", "s2", "s3"]);
    const history = read<FinishedSession[]>("ast.history.v1");
    expect(history?.at(-1)?.answers.map((answer) => answer.itemId)).toEqual([
      "q-scn-s01-001",
      "s2",
      "s3",
    ]);
  });

  it("saves an unfinished session with its answers and the question on screen", () => {
    saveSession({ ...withAnswer(base, "q-scn-s01-001", "b"), index: 1 });
    expect(read<Session>("ast.session.v1")).toMatchObject({
      index: 1,
      finished: false,
      answers: [{ itemId: "q-scn-s01-001", optionId: "b" }],
    });
  });
});

describe("hints are recorded on the answer", () => {
  it("records hintUsed on an answer that exists when the hint is opened", () => {
    const answered = withHintUsed(withAnswer(base, "q-scn-s01-001", "a"), "q-scn-s01-001");
    expect(answerFor(answered, "q-scn-s01-001")).toEqual({
      itemId: "q-scn-s01-001",
      optionId: "a",
      hintUsed: true,
    });
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
    let session = withHintUsed(withAnswer(base, "q-scn-s01-001", "b"), "q-scn-s01-001");
    session = withAnswer(withAnswer(session, "s2", "c"), "s3", "a");
    expect(answerFor(session, "s2")).toEqual({ itemId: "s2", optionId: "c" });
    finishSession(session);
    const done = read<Session>("ast.session.v1");
    expect(done?.answers.find((answer) => answer.itemId === "q-scn-s01-001")?.hintUsed).toBe(true);
    expect(done?.answers.find((answer) => answer.itemId === "s2")?.hintUsed).toBeUndefined();
    const history = read<FinishedSession[]>("ast.history.v1");
    expect(
      history?.at(-1)?.answers.find((answer) => answer.itemId === "q-scn-s01-001")?.hintUsed,
    ).toBe(true);
  });
});

describe("the saved schema is versioned", () => {
  it("reads a value saved with schema 2 as it is (version 3 only adds fields) and writes it back as 3", () => {
    saved.set("ast.session.v1", JSON.stringify({ schema: 2, value: base }));
    expect(read<Session>("ast.session.v1")).toEqual(base);
    saveSession(base);
    expect(JSON.parse(saved.get("ast.session.v1")!).schema).toBe(6);
  });

  it("reads a value saved with schema 4 as it is (version 5 only adds the exam fields)", () => {
    saved.set("ast.session.v1", JSON.stringify({ schema: 4, value: base }));
    expect(read<Session>("ast.session.v1")).toEqual(base);
    saved.set("ast.history.v1", JSON.stringify({ schema: 4, value: [] }));
    expect(read<FinishedSession[]>("ast.history.v1")).toEqual([]);
  });

  it("saves the value with the schema version", () => {
    saveSession(base);
    expect(JSON.parse(saved.get("ast.session.v1")!)).toMatchObject({
      schema: 6,
      content: contentFingerprint,
      value: base,
    });
  });

  it("ignores a session saved by an older version, without crashing", () => {
    const old = {
      mode: "full",
      stepIds: ["q-scn-s01-001"],
      index: 0,
      phase: "decide",
      answers: [{ stepId: "q-scn-s01-001", optionId: "b", confidence: 3, explanation: "" }],
      finished: false,
    };
    saved.set("ast.session.v1", JSON.stringify(old));
    expect(read<Session>("ast.session.v1")).toBeNull();
    saved.set("ast.session.v1", JSON.stringify({ schema: 1, value: base }));
    expect(read<Session>("ast.session.v1")).toBeNull();
    saved.set("ast.session.v1", JSON.stringify({ schema: 7, value: base }));
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

describe("a checked answer", () => {
  const start = (): Session => ({
    ...base,
    itemIds: ["q-quiz-s01-001", "q-quiz-s01-002"],
    answers: [],
  });

  it("is locked by Check: the choice cannot change afterwards, and other questions are unaffected", () => {
    let session = withAnswer(start(), "q-quiz-s01-001", "b");
    session = withAnswer(session, "q-quiz-s01-001", "a");
    expect(answerFor(session, "q-quiz-s01-001")?.optionId).toBe("a");
    expect(answerFor(session, "q-quiz-s01-001")?.checked).toBeUndefined();
    session = withChecked(session, "q-quiz-s01-001");
    expect(answerFor(session, "q-quiz-s01-001")).toMatchObject({ optionId: "a", checked: true });
    expect(withAnswer(session, "q-quiz-s01-001", "b")).toBe(session);
    expect(answerFor(withAnswer(session, "q-quiz-s01-002", "a"), "q-quiz-s01-002")?.checked).toBe(
      undefined,
    );
  });

  it("counts as done when checked in the training modes, and when chosen in the exam", () => {
    const chosen = { itemId: "q-quiz-s01-001", optionId: "a" };
    expect(isDone(undefined, "training")).toBe(false);
    expect(isDone(chosen, "training")).toBe(false);
    expect(isDone({ ...chosen, checked: true }, "training")).toBe(true);
    expect(isDone(chosen, "exam")).toBe(true);
    expect(isDone(undefined, "exam")).toBe(false);
  });

  it("is saved with the session, so a reload resumes selected or checked exactly", () => {
    let session = withAnswer(start(), "q-quiz-s01-001", "a");
    session = withAnswer(session, "q-quiz-s01-002", "b");
    session = withChecked(session, "q-quiz-s01-001");
    saveSession(session);
    const saved = read<Session>("ast.session.v1")!;
    expect(saved.answers.find((a) => a.itemId === "q-quiz-s01-001")).toMatchObject({
      optionId: "a",
      checked: true,
    });
    const second = saved.answers.find((a) => a.itemId === "q-quiz-s01-002");
    expect(second?.optionId).toBe("b");
    expect(second?.checked).toBeUndefined();
    expect(isValidSession(saved)).toBe(true);
  });

  it("reads an older saved answer without the flag as not checked", () => {
    saved.set(
      "ast.session.v1",
      JSON.stringify({
        schema: 6,
        content: contentFingerprint,
        value: { ...start(), answers: [{ itemId: "q-quiz-s01-001", optionId: "a" }] },
      }),
    );
    const old = read<Session>("ast.session.v1")!;
    expect(isDone(answerFor(old, "q-quiz-s01-001"), "training")).toBe(false);
  });
});
