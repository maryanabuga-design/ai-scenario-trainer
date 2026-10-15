import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { scoreSession } from "@/lib/progress";
import {
  answerFor,
  finishSession,
  firstUnanswered,
  markFinishedCorrect,
  sessionItems,
  useHistory,
  withAnswer,
} from "@/lib/session";
import type { Answer, QuizSession, ScenarioSession } from "@/lib/session";
import { createStore } from "@/lib/store";

/** A browser storage in memory, so the tests read back what the stores really saved. */
beforeAll(() => {
  const saved = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => void saved.set(key, value),
      removeItem: (key: string) => void saved.delete(key),
    },
  });
});
afterAll(() => vi.unstubAllGlobals());

/** What is saved under a key right now. */
const saved = <T>(key: string) => createStore<T>(key).read();

const step = (stepId: string, optionId: string, confidence: 1 | 2 | 3 = 3): Answer => ({
  stepId,
  optionId,
  confidence,
  explanation: "",
  skipped: true,
  answerSource: "dont_know",
  explanationCheck: "skipped",
});

const scenario: ScenarioSession = {
  mode: "short",
  stepIds: ["s1", "s2", "s3"],
  index: 0,
  answers: [],
  finished: false,
};

describe("answers are kept per step and can be changed", () => {
  const first = { type: "step", id: "s1" } as const;
  const second = { type: "step", id: "s2" } as const;

  it("lists the items in order and finds the saved answer of each", () => {
    expect(sessionItems(scenario).map((item) => item.id)).toEqual(["s1", "s2", "s3"]);
    const answered = withAnswer(scenario, second, step("s2", "c"));
    expect(answerFor(answered, second)).toMatchObject({ optionId: "c" });
    expect(answerFor(answered, first)).toBeUndefined();
  });

  it("replaces an earlier answer instead of adding a second one", () => {
    let session = withAnswer(scenario, first, step("s1", "a"));
    session = withAnswer(session, first, step("s1", "b"));
    expect((session as ScenarioSession).answers).toHaveLength(1);
    expect(answerFor(session, first)).toMatchObject({ optionId: "b" });
  });

  it("removes an answer when the draft is no longer complete", () => {
    const session = withAnswer(withAnswer(scenario, first, step("s1", "a")), first, null);
    expect(answerFor(session, first)).toBeUndefined();
  });

  it("finds the first item without an answer", () => {
    expect(firstUnanswered(scenario)).toBe(0);
    const some = withAnswer(withAnswer(scenario, first, step("s1", "b")), second, step("s2", "c"));
    expect(firstUnanswered(some)).toBe(2);
    expect(firstUnanswered(withAnswer(some, { type: "step", id: "s3" }, step("s3", "b")))).toBe(-1);
  });

  it("changing an answer changes the final results, nothing is scored before", () => {
    let session = scenario;
    session = withAnswer(session, first, step("s1", "d"));
    session = withAnswer(session, second, step("s2", "c"));
    session = withAnswer(session, { type: "step", id: "s3" }, step("s3", "b"));
    const before = scoreSession(session);
    // Back to step 1 and choose the better option: the final results use the new answer.
    session = withAnswer(session, first, step("s1", "b"));
    const after = scoreSession(session);
    expect(before.find((item) => item.id === "s1")?.correct).toBe(false);
    expect(after.find((item) => item.id === "s1")?.correct).toBe(true);
    expect(after.filter((item) => item.correct).length).toBe(
      before.filter((item) => item.correct).length + 1,
    );
  });

  it("tags the answers of a repeat round", () => {
    const repeat = withAnswer(
      {
        kind: "repeat",
        topics: ["S1"],
        items: [{ type: "step", id: "s1" }],
        index: 0,
        answers: [],
        finished: false,
      },
      first,
      step("s1", "b"),
    );
    expect(repeat.answers[0]).toMatchObject({ type: "step", stepId: "s1" });
  });
});

describe("finishing", () => {
  it("puts the answers in the order of the steps, however they were given", () => {
    let session: ScenarioSession = scenario;
    for (const [id, option] of [
      ["s3", "b"],
      ["s1", "b"],
      ["s2", "c"],
    ]) {
      session = withAnswer(session, { type: "step", id }, step(id, option)) as ScenarioSession;
    }
    finishSession(session);
    const history = saved<{ answers: Answer[] }[]>("ast.history.v1");
    expect(history?.at(-1)?.answers.map((answer) => answer.stepId)).toEqual(["s1", "s2", "s3"]);
  });

  it("saves 'My explanation is still correct' with the session and its history entry", () => {
    const typed: Answer = {
      stepId: "s1",
      optionId: "b",
      confidence: 3,
      explanation: "лбтдлюью",
      answerSource: "typed",
      explanationCheck: "not_matched",
    };
    let session: ScenarioSession = scenario;
    session = withAnswer(session, { type: "step", id: "s1" }, typed) as ScenarioSession;
    session = withAnswer(session, { type: "step", id: "s2" }, step("s2", "c")) as ScenarioSession;
    session = withAnswer(session, { type: "step", id: "s3" }, step("s3", "b")) as ScenarioSession;
    finishSession(session);
    const finished = saved<ScenarioSession>("ast.session.v1") as ScenarioSession;
    expect(finished.finished).toBe(true);
    expect(finished.finishedAt).toBeTypeOf("number");

    markFinishedCorrect(finished, "s1", true);
    expect(saved<ScenarioSession>("ast.session.v1")?.answers[0].markedCorrect).toBe(true);
    const history = saved<{ answers: Answer[] }[]>("ast.history.v1");
    expect(history?.at(-1)?.answers[0].markedCorrect).toBe(true);

    markFinishedCorrect(saved<ScenarioSession>("ast.session.v1") as ScenarioSession, "s1", false);
    expect(saved<ScenarioSession>("ast.session.v1")?.answers[0].markedCorrect).toBeUndefined();
    const undone = saved<{ answers: Answer[] }[]>("ast.history.v1");
    expect(undone?.at(-1)?.answers[0].markedCorrect).toBeUndefined();
  });

  it("works for a quiz session too", () => {
    const quiz: QuizSession = {
      kind: "quiz",
      mode: "quiz",
      sections: ["S1"],
      questionIds: ["q-s1-1"],
      index: 0,
      answers: [],
      finished: false,
    };
    expect(sessionItems(quiz)).toEqual([{ type: "question", id: "q-s1-1" }]);
    expect(typeof useHistory).toBe("function");
  });
});
