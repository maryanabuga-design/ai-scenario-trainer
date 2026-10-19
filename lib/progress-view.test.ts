import { describe, expect, it } from "vitest";
import { PASS_MARK } from "@/lib/config";
import { getItem } from "@/lib/items";
import {
  byNumber,
  readinessCard,
  remainingToTarget,
  topicGroups,
  topicProgress,
} from "@/lib/progress-view";
import { examReadiness, scopeItemIds } from "@/lib/readiness";
import { cleanHistory } from "@/lib/saved-data";
import { topicIdsOf } from "@/lib/session";
import type { FinishedSession } from "@/lib/session";

const NOW = new Date(2026, 9, 19, 14, 0, 0);
const at = (days: number, hours = 12, minutes = 0) =>
  new Date(2026, 9, 19 - days, hours, minutes).getTime();

const wrongOption = (id: string) => {
  const item = getItem(id);
  return item.options.find((option) => option.id !== item.correctOptionId)!.id;
};
const answer = (id: string, right: boolean) => ({
  itemId: id,
  optionId: right ? getItem(id).correctOptionId : wrongOption(id),
});

/** A finished session answering `ids`, the first `rightCount` of them right. */
function session(
  ids: string[],
  rightCount: number,
  finishedAt = at(0),
  extra: Partial<FinishedSession> = {},
): FinishedSession {
  return {
    kind: "quiz",
    itemIds: ids,
    answers: ids.map((id, index) => answer(id, index < rightCount)),
    finishedAt,
    ...extra,
  };
}

const s1 = scopeItemIds(["S1"]);
const s2 = scopeItemIds(["S2"]);

describe("the readiness card", () => {
  it("shows the same readiness as the exam screen for the same data", () => {
    const history = [session(s1, s1.length - 2), session(s2.slice(0, 5), 3)];
    const topics = ["S1", "S2", "S3", "S4"];
    expect(readinessCard(topics, history, NOW).readiness).toBe(examReadiness(topics, history));
    expect(readinessCard(null, history, NOW).readiness).toBe(
      examReadiness(
        Array.from({ length: 10 }, (_, i) => `S${i + 1}`),
        history,
      ),
    );
  });

  it("counts the remaining correct answers: ceil(0.8 x questions) minus the correct ones", () => {
    const scope = scopeItemIds(["S1", "S2", "S3", "S4"]).length;
    const target = Math.ceil((PASS_MARK * scope) / 100);
    expect(remainingToTarget(["S1", "S2", "S3", "S4"], [])).toEqual({
      scope,
      correct: 0,
      remaining: target,
    });
    const some = session(s1.slice(0, 5), 5);
    expect(remainingToTarget(["S1", "S2", "S3", "S4"], [some]).remaining).toBe(target - 5);
  });

  it("is zero at the target and never negative above it", () => {
    const ids = scopeItemIds(["S1", "S2", "S3", "S4"]);
    const target = Math.ceil((PASS_MARK * ids.length) / 100);
    const atTarget = [session(ids.slice(0, target), target)];
    expect(remainingToTarget(["S1", "S2", "S3", "S4"], atTarget).remaining).toBe(0);
    const above = [session(ids, ids.length)];
    expect(remainingToTarget(["S1", "S2", "S3", "S4"], above).remaining).toBe(0);
  });

  it("gives the sentence and the button for each side of the target", () => {
    const ids = scopeItemIds(["S1", "S2", "S3", "S4"]);
    const below = readinessCard(["S1", "S2", "S3", "S4"], [], NOW);
    expect(below.ready).toBe(false);
    expect(below.sentence).toMatch(/^Not ready yet\. \d+ more correct answers to reach 80%\.$/);
    const done = readinessCard(["S1", "S2", "S3", "S4"], [session(ids, ids.length)], NOW);
    expect(done.ready).toBe(true);
    expect(done.sentence).toBe("You are ready for the exam.");
  });

  it("says 1 more correct answer in the singular", () => {
    const ids = scopeItemIds(["S1"]);
    const target = Math.ceil((PASS_MARK * ids.length) / 100);
    const card = readinessCard(["S1"], [session(ids.slice(0, target - 1), target - 1)], NOW);
    expect(card.sentence).toBe("Not ready yet. 1 more correct answer to reach 80%.");
  });

  it("is Exam readiness with the exam and its deadline, or Overall readiness without one", () => {
    const exam = {
      id: "e",
      title: "Evacuation basics exam",
      topicIds: ["S1", "S2"],
      deadline: "2026-10-25",
      assignedBy: "Admin",
      assignedAt: 0,
    };
    const withExam = readinessCard(exam.topicIds, [], NOW, exam);
    expect(withExam.title).toBe("Exam readiness");
    expect(withExam.subtitle).toBe("Evacuation basics exam · Due 25 Oct · 6 days left");
    const without = readinessCard(null, [], NOW);
    expect(without.title).toBe("Overall readiness");
    expect(without.subtitle).toBeNull();
  });
});

describe("topic counts", () => {
  it("count the latest correct answers over ALL the topic's questions, unanswered as not correct", () => {
    const total = s1.length;
    const some = topicProgress("S1", [session(s1.slice(0, 7), 5)]);
    expect(some).toEqual({ sectionId: "S1", correct: 5, total });
    expect(topicProgress("S1", [])).toEqual({ sectionId: "S1", correct: 0, total });
  });

  it("use the LATEST answer per question, across sessions", () => {
    const first = session(s1.slice(0, 4), 4, at(2));
    const later = session(s1.slice(0, 2), 0, at(1));
    expect(topicProgress("S1", [first, later]).correct).toBe(2);
  });

  it("have no status and no percentage, only the counts", () => {
    expect(Object.keys(topicProgress("S2", [])).sort()).toEqual(["correct", "sectionId", "total"]);
  });
});

describe("the topic lists are in number order", () => {
  const rows = (ids: string[]) => ids.map((sectionId) => ({ sectionId, correct: 0, total: 1 }));

  it("sorts by number, not as text: S10 comes after S9", () => {
    const sorted = byNumber(rows(["S10", "S2", "S1", "S9", "S3"])).map((r) => r.sectionId);
    expect(sorted).toEqual(["S1", "S2", "S3", "S9", "S10"]);
  });

  it("puts S1 to S4 in the exam group and S5 to S10 in the other group, each in order", () => {
    // the progress of the topics does not change the order
    const history = [session(scopeItemIds(["S4"]), 3), session(scopeItemIds(["S1"]), 0)];
    const groups = topicGroups(["S4", "S2", "S1", "S3"], history);
    expect(groups.inExam.map((r) => r.sectionId)).toEqual(["S1", "S2", "S3", "S4"]);
    expect(groups.other.map((r) => r.sectionId)).toEqual(["S5", "S6", "S7", "S8", "S9", "S10"]);
  });

  it("lists all ten in order with no exam group when there is no exam", () => {
    const groups = topicGroups(null, []);
    expect(groups.inExam).toEqual([]);
    expect(groups.other.map((r) => r.sectionId)).toEqual(
      Array.from({ length: 10 }, (_, i) => `S${i + 1}`),
    );
  });
});

describe("session records (stored, not shown on Progress)", () => {
  it("keep the guide topics of their questions, in guide order, once each", () => {
    expect(topicIdsOf([...s2.slice(0, 2), ...s1.slice(0, 2)])).toEqual(["S1", "S2"]);
    expect(topicIdsOf([])).toEqual([]);
  });

  it("load without a mode or topics (records saved before) and with broken values, without errors", () => {
    const old = session(s1.slice(0, 3), 2);
    const broken = { ...session(s1.slice(0, 3), 2, at(1)), mode: 5, topicIds: "S1" };
    const loaded = cleanHistory([old, broken, { nonsense: true }, null, "x"])!;
    expect(loaded).toHaveLength(2);
    // they still count toward the topic counts
    expect(topicProgress("S1", loaded).correct).toBe(2);
  });
});
