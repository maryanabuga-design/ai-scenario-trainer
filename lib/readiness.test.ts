import { describe, expect, it } from "vitest";
import { getItem } from "@/lib/items";
import {
  EXAM_PASS_MARK,
  REPEAT_SESSION_QUESTIONS,
  examReadiness,
  hasWeakTopics,
  isReady,
  knownTopics,
  mistakes,
  readinessOver,
  scopeItemIds,
  topicReadiness,
  unanswered,
  weakSessionIds,
} from "@/lib/readiness";
import { PASS_MARK } from "@/lib/config";
import type { FinishedSession } from "@/lib/session";

const wrongOption = (id: string) =>
  getItem(id).options.find((option) => option.id !== getItem(id).correctOptionId)!.id;

/** A finished session with the given answers at `time` (true = correct, false = wrong). */
function session(
  time: number,
  answers: [string, boolean][],
  kind: FinishedSession["kind"] = "quiz",
): FinishedSession {
  return {
    kind,
    itemIds: answers.map(([id]) => id),
    answers: answers.map(([id, ok]) => ({
      itemId: id,
      optionId: ok ? getItem(id).correctOptionId : wrongOption(id),
    })),
    finishedAt: time,
  };
}

const TOPICS = ["S1", "S2", "S3", "S4"];
const scope = scopeItemIds(TOPICS);
const s1 = scopeItemIds(["S1"]);
const s2 = scopeItemIds(["S2"]);

describe("the exam scope", () => {
  it("is every training question of its topics, in guide order", () => {
    expect(scope.length).toBeGreaterThan(0);
    expect(new Set(scope).size).toBe(scope.length);
    for (const id of scope) expect(TOPICS).toContain(getItem(id).section);
    const sections = scope.map((id) => getItem(id).section);
    expect(sections).toEqual([...sections].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))));
    // both modes: scenario steps and quiz questions
    expect(scope.some((id) => getItem(id).kind === "step")).toBe(true);
    expect(scope.some((id) => getItem(id).kind === "question")).toBe(true);
  });

  it("ignores unknown topic ids, and is empty for none", () => {
    expect(knownTopics(["S2", "nope", "F1", "S1", "S2"])).toEqual(["S1", "S2"]);
    expect(scopeItemIds(["nope"])).toEqual([]);
    expect(scopeItemIds([])).toEqual([]);
  });
});

describe("readiness", () => {
  it("is 0% with no answers: unanswered is not correct", () => {
    expect(examReadiness(TOPICS, null)).toBe(0);
    expect(examReadiness(TOPICS, [])).toBe(0);
    expect(unanswered(TOPICS, [])).toEqual(scope);
    expect(mistakes(TOPICS, [])).toEqual([]);
  });

  it("does not divide by zero on an empty scope", () => {
    expect(examReadiness([], [])).toBe(0);
    expect(examReadiness(["nope"], [session(1, [[s1[0], true]])])).toBe(0);
    expect(readinessOver([], null)).toBe(0);
  });

  it("is the correct share of the whole scope, rounded down", () => {
    const history = [session(1, [[s1[0], true]])];
    expect(examReadiness(TOPICS, history)).toBe(Math.floor((1 / scope.length) * 100));
    const all = [
      session(
        1,
        scope.map((id): [string, boolean] => [id, true]),
      ),
    ];
    expect(examReadiness(TOPICS, all)).toBe(100);
  });

  it("uses the LATEST answer: a later wrong answer takes a correct one away, and the reverse", () => {
    const first = session(1, [[s1[0], true]]);
    const later = session(2, [[s1[0], false]]);
    expect(examReadiness(TOPICS, [first])).toBeGreaterThan(0);
    expect(examReadiness(TOPICS, [first, later])).toBe(0);
    expect(mistakes(TOPICS, [first, later])).toEqual([s1[0]]);
    // the order of the list does not matter, the time does
    expect(examReadiness(TOPICS, [later, first])).toBe(0);
    const fixed = session(3, [[s1[0], true]]);
    expect(mistakes(TOPICS, [first, later, fixed])).toEqual([]);
  });

  it("counts answers from practice sessions and from exams alike", () => {
    const practice = session(1, [[s1[0], true]], "repeat");
    const exam = session(2, [[s1[1], true]], "exam");
    expect(examReadiness(TOPICS, [practice, exam])).toBe(Math.floor((2 / scope.length) * 100));
  });

  it("ignores answers outside the scope and unknown question ids", () => {
    const outside = scopeItemIds(["S9"]);
    const history = [session(1, [[outside[0], true]])];
    expect(examReadiness(TOPICS, history)).toBe(0);
    const odd: FinishedSession = {
      kind: "quiz",
      itemIds: ["ghost"],
      answers: [{ itemId: "ghost", optionId: "a" }],
      finishedAt: 1,
    };
    expect(examReadiness(TOPICS, [odd])).toBe(0);
  });

  it("is computed per topic the same way, weakest first", () => {
    const history = [session(1, [...s1.map((id): [string, boolean] => [id, true]), [s2[0], true]])];
    const rows = topicReadiness(TOPICS, history);
    expect(rows[rows.length - 1]).toMatchObject({ sectionId: "S1", readiness: 100 });
    expect(rows.map((row) => row.readiness)).toEqual(
      [...rows.map((row) => row.readiness)].sort((a, b) => a - b),
    );
    // ties keep the guide order: S3 and S4 have nothing answered
    const zero = rows.filter((row) => row.readiness === 0).map((row) => row.sectionId);
    expect(zero).toEqual([...zero].sort());
    expect(rows.find((row) => row.sectionId === "S2")?.readiness).toBe(
      Math.floor((1 / s2.length) * 100),
    );
  });

  it("is ready at the pass mark and not below: 79 warns, 80 does not", () => {
    expect(EXAM_PASS_MARK).toBe(PASS_MARK);
    expect(EXAM_PASS_MARK).toBe(80);
    expect(isReady(79)).toBe(false);
    expect(isReady(80)).toBe(true);
    expect(isReady(100)).toBe(true);
    expect(isReady(0)).toBe(false);
  });
});

describe("mistakes and unanswered", () => {
  it("lists the wrong ones and the never-answered ones apart", () => {
    const history = [
      session(1, [
        [s1[0], true],
        [s1[1], false],
        [s2[0], false],
      ]),
    ];
    expect(mistakes(TOPICS, history)).toEqual([s1[1], s2[0]]);
    const open = unanswered(TOPICS, history);
    expect(open).not.toContain(s1[0]);
    expect(open).not.toContain(s1[1]);
    expect(open).not.toContain(s2[0]);
    expect(open.length).toBe(scope.length - 3);
    expect(hasWeakTopics(TOPICS, history)).toBe(true);
  });

  it("has nothing to repeat only when every question is answered correctly", () => {
    const all = [
      session(
        1,
        scope.map((id): [string, boolean] => [id, true]),
      ),
    ];
    expect(hasWeakTopics(TOPICS, all)).toBe(false);
    expect(weakSessionIds(TOPICS, all)).toEqual([]);
  });
});

describe("a failed exam", () => {
  it("stores its wrong answers like any other: they become mistakes and readiness drops", () => {
    const before = [
      session(
        1,
        scope.slice(0, 5).map((id): [string, boolean] => [id, true]),
      ),
    ];
    const readyBefore = examReadiness(TOPICS, before);
    const failedExam = session(
      2,
      scope.slice(0, 3).map((id): [string, boolean] => [id, false]),
      "exam",
    );
    const after = [...before, failedExam];
    expect(examReadiness(TOPICS, after)).toBeLessThan(readyBefore);
    expect(mistakes(TOPICS, after)).toEqual(scope.slice(0, 3));
  });
});

describe("the weak-topics session", () => {
  it("is at most 10 questions", () => {
    expect(REPEAT_SESSION_QUESTIONS).toBe(10);
    expect(weakSessionIds(TOPICS, []).length).toBeLessThanOrEqual(10);
    const manyWrong = [
      session(
        1,
        scope.map((id): [string, boolean] => [id, false]),
      ),
    ];
    expect(weakSessionIds(TOPICS, manyWrong)).toHaveLength(10);
  });

  it("brings the mistakes first, the weakest topic first, and no repeats", () => {
    const history = [
      session(1, [
        ...s1.map((id): [string, boolean] => [id, true]),
        [s2[0], false],
        [s2[1], false],
      ]),
    ];
    const ids = weakSessionIds(TOPICS, history);
    expect(ids.slice(0, 2)).toEqual([s2[0], s2[1]]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("puts the weakest topic's mistakes before a stronger topic's", () => {
    const s3 = scopeItemIds(["S3"]);
    const history = [
      session(1, [
        // S1: one wrong of many right (stronger), S3: all wrong (weaker)
        ...s1.slice(1).map((id): [string, boolean] => [id, true]),
        [s1[0], false],
        ...s3.map((id): [string, boolean] => [id, false]),
      ]),
    ];
    const ids = weakSessionIds(["S1", "S3"], history);
    expect(ids[0]).toBe(s3[0]);
    expect(ids).toContain(s1[0]);
    expect(ids.indexOf(s1[0])).toBeGreaterThan(ids.indexOf(s3[s3.length - 1]));
  });

  it("fills the room with the unanswered questions of the weakest topic", () => {
    const history = [session(1, [[s1[0], false]])];
    const ids = weakSessionIds(TOPICS, history);
    expect(ids[0]).toBe(s1[0]);
    expect(ids.length).toBeGreaterThan(1);
    // the rest are unanswered questions of the weakest topic (S1 is weakest with a mistake only if
    // it ties at 0, and ties keep guide order)
    const weakest = topicReadiness(TOPICS, history)[0].sectionId;
    for (const id of ids.slice(1)) expect(getItem(id).section).toBe(weakest);
  });

  it("a correct answer makes the question leave the mistakes list; a wrong one keeps it there", () => {
    const first = session(1, [[s1[0], false]]);
    expect(mistakes(TOPICS, [first])).toEqual([s1[0]]);
    const right = session(2, [[s1[0], true]], "repeat");
    expect(mistakes(TOPICS, [first, right])).toEqual([]);
    const wrongAgain = session(2, [[s1[0], false]], "repeat");
    expect(mistakes(TOPICS, [first, wrongAgain])).toEqual([s1[0]]);
    expect(examReadiness(TOPICS, [first, right])).toBeGreaterThan(
      examReadiness(TOPICS, [first, wrongAgain]),
    );
  });
});
