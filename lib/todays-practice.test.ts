import { describe, expect, it } from "vitest";
import { modeItems } from "@/lib/parts";
import type { FinishedSession } from "@/lib/session";
import { PER_TOPIC, TODAY_COUNT, pickTodays, todaysResult } from "@/lib/todays-practice";

const pool = modeItems("quiz");
const byId = new Map(pool.map((item) => [item.id, item]));
const wrongOf = (id: string) => {
  const item = byId.get(id)!;
  return item.options.find((o) => o.id !== item.correctOptionId)!.id;
};
const rightOf = (id: string) => byId.get(id)!.correctOptionId;

/** A deterministic random source. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const session = (
  answers: [string, "right" | "wrong"][],
  finishedAt: number,
  mode: FinishedSession["mode"] = "practice",
): FinishedSession => ({
  kind: "quiz",
  mode,
  itemIds: answers.map(([id]) => id),
  answers: answers.map(([id, result]) => ({
    itemId: id,
    optionId: result === "right" ? rightOf(id) : wrongOf(id),
  })),
  finishedAt,
});

const topicOf = (ids: string[]) => ids.map((id) => byId.get(id)!.section);
const maxPerTopic = (ids: string[]) => {
  const counts = new Map<string, number>();
  for (const topic of topicOf(ids)) counts.set(topic, (counts.get(topic) ?? 0) + 1);
  return Math.max(...counts.values());
};

describe("today's practice: which 5 questions", () => {
  it("picks 5 different questions from the pool, whatever the seed", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ids = pickTodays(pool, null, seeded(seed));
      expect(ids).toHaveLength(TODAY_COUNT);
      expect(new Set(ids).size).toBe(TODAY_COUNT);
      for (const id of ids) expect(byId.has(id)).toBe(true);
    }
  });

  it("takes the questions answered wrong last time first", () => {
    const s1 = pool.filter((q) => q.section === "S1").map((q) => q.id);
    const s2 = pool.filter((q) => q.section === "S2").map((q) => q.id);
    const s3 = pool.filter((q) => q.section === "S3").map((q) => q.id);
    const history = [
      session(
        [
          [s1[0], "wrong"],
          [s2[0], "wrong"],
          [s3[0], "wrong"],
        ],
        1_000,
      ),
    ];
    for (let seed = 1; seed <= 10; seed++) {
      const ids = pickTodays(pool, history, seeded(seed));
      expect(ids).toEqual(expect.arrayContaining([s1[0], s2[0], s3[0]]));
      // the other two are never answered ones, not the ones answered right
    }
  });

  it("uses the LATEST answer: a question wrong once and right later is not a wrong one", () => {
    const [a, b] = pool.map((q) => q.id);
    const history = [
      session([[a, "wrong"]], 1_000),
      session([[a, "right"]], 2_000),
      session([[b, "wrong"]], 500),
    ];
    const ids = pickTodays(pool, history, seeded(3));
    expect(ids).toContain(b);
    // a is answered right: it comes after the never-answered ones, so with enough fresh ones it is left out
    expect(ids).not.toContain(a);
  });

  it("then takes never-answered questions before the ones answered right", () => {
    // three new questions, each from its own topic; everything else was answered right
    const fresh = ["S1", "S2", "S3"].map((section) => pool.find((q) => q.section === section)!.id);
    const rightIds = pool.filter((q) => !fresh.includes(q.id)).map((q) => q.id);
    const history = [
      session(
        rightIds.map((id) => [id, "right"] as [string, "right"]),
        1_000,
      ),
    ];
    for (let seed = 1; seed <= 10; seed++) {
      const ids = pickTodays(pool, history, seeded(seed));
      expect(ids).toEqual(expect.arrayContaining(fresh));
      expect(ids).toHaveLength(5);
    }
  });

  it("keeps the topic limit ahead of a lower priority: a third new question of one topic waits", () => {
    const s10 = pool.filter((q) => q.section === "S10").map((q) => q.id);
    const rightIds = pool.filter((q) => !s10.includes(q.id)).map((q) => q.id);
    const history = [
      session(
        rightIds.map((id) => [id, "right"] as [string, "right"]),
        1_000,
      ),
    ];
    const ids = pickTodays(pool, history, seeded(9));
    expect(ids.filter((id) => s10.includes(id))).toHaveLength(PER_TOPIC);
  });

  it("falls back to the rest when nothing is wrong and nothing is new", () => {
    const history = [
      session(
        pool.map((q) => [q.id, "right"] as [string, "right"]),
        1_000,
      ),
    ];
    const ids = pickTodays(pool, history, seeded(7));
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });

  it("spreads the questions: at most 2 from one topic when it is possible", () => {
    // everything answered wrong: the wrong group is the whole pool, yet the spread holds
    const history = [
      session(
        pool.map((q) => [q.id, "wrong"] as [string, "wrong"]),
        1_000,
      ),
    ];
    for (let seed = 1; seed <= 25; seed++) {
      const ids = pickTodays(pool, history, seeded(seed));
      expect(maxPerTopic(ids), `seed ${seed}`).toBeLessThanOrEqual(PER_TOPIC);
      expect(new Set(topicOf(ids)).size).toBeGreaterThanOrEqual(3);
    }
  });

  it("goes over the topic limit only when there are not enough other questions", () => {
    const onlyS1 = pool.filter((q) => q.section === "S1");
    const ids = pickTodays(onlyS1, null, seeded(2));
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    // two topics with 3 questions each: 5 cannot be reached with 2 per topic
    const small = [
      ...pool.filter((q) => q.section === "S1").slice(0, 3),
      ...pool.filter((q) => q.section === "S2").slice(0, 3),
    ];
    const mixed = pickTodays(small, null, seeded(4));
    expect(mixed).toHaveLength(5);
    expect(new Set(mixed).size).toBe(5);
  });

  it("gives fewer than 5 only when the pool is smaller, and never repeats", () => {
    const three = pool.slice(0, 3);
    expect(pickTodays(three, null, seeded(1))).toHaveLength(3);
    expect(pickTodays([], null)).toEqual([]);
  });

  it("is random inside a group but follows the random source", () => {
    const a = pickTodays(pool, null, seeded(1));
    const b = pickTodays(pool, null, seeded(1));
    expect(a).toEqual(b);
    const others = new Set(
      Array.from({ length: 10 }, (_, i) => pickTodays(pool, null, seeded(i + 10)).join()),
    );
    expect(others.size).toBeGreaterThan(1);
  });
});

describe("today's result", () => {
  const noon = new Date(2026, 9, 23, 12, 0).getTime();
  const five = pool.slice(0, 5).map((q) => q.id);
  const today = (rights: boolean[], at = noon - 3_600_000) =>
    session(
      five.map((id, i) => [id, rights[i] ? "right" : "wrong"] as [string, "right" | "wrong"]),
      at,
      "today",
    );

  it("is null before today's practice is finished", () => {
    expect(todaysResult(null, noon)).toBeNull();
    expect(todaysResult([], noon)).toBeNull();
  });

  it("counts the correct answers of today's session", () => {
    expect(todaysResult([today([true, true, false, true, false])], noon)).toEqual({
      correct: 3,
      total: 5,
    });
    expect(todaysResult([today([true, true, true, true, true])], noon)).toEqual({
      correct: 5,
      total: 5,
    });
  });

  it("ignores sessions of the picker and other practice", () => {
    const picker = { ...today([true, true, true, true, true]), mode: "mini-quiz" as const };
    const practice = { ...today([true, true, true, true, true]), mode: "practice" as const };
    expect(todaysResult([picker, practice], noon)).toBeNull();
  });

  it("is null again the next calendar day (local time), even a minute after midnight", () => {
    const entry = today([true, true, true, true, true], new Date(2026, 9, 23, 23, 59).getTime());
    expect(todaysResult([entry], new Date(2026, 9, 23, 23, 59).getTime())).not.toBeNull();
    expect(todaysResult([entry], new Date(2026, 9, 24, 0, 1).getTime())).toBeNull();
    expect(todaysResult([entry], new Date(2026, 9, 24, 12, 0).getTime())).toBeNull();
    // the same date a month later is another day too
    expect(todaysResult([entry], new Date(2026, 10, 23, 12, 0).getTime())).toBeNull();
  });

  it("uses the latest of several sessions of the same day", () => {
    const early = today([false, false, false, false, false], noon - 7_200_000);
    const late = today([true, true, true, true, false], noon - 60_000);
    expect(todaysResult([late, early], noon)).toEqual({ correct: 4, total: 5 });
  });
});
