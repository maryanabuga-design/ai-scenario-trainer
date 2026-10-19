import { describe, expect, it } from "vitest";
import { PASS_MARK } from "@/lib/config";
import { getItem } from "@/lib/items";
import {
  activityLabel,
  activitySummary,
  readinessCard,
  recentSessions,
  remainingToTarget,
  sessionDate,
  sessionModeLabel,
  sessionResult,
  sessionTopicIds,
  sortTopics,
  topicGroups,
  topicProgress,
  topicStatus,
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

describe("topic status", () => {
  it("is Not started with no answered question, even when 0 are correct", () => {
    expect(topicStatus(0, 20, 0)).toBe("not-started");
  });

  it("is Needs work once started and below 80% of all the topic's questions", () => {
    expect(topicStatus(0, 20, 3)).toBe("needs-work");
    expect(topicStatus(15, 20, 15)).toBe("needs-work");
    expect(topicStatus(79, 100, 100)).toBe("needs-work");
  });

  it("is Ready at exactly 80% and above", () => {
    expect(topicStatus(16, 20, 20)).toBe("ready");
    expect(topicStatus(80, 100, 90)).toBe("ready");
    expect(topicStatus(20, 20, 20)).toBe("ready");
    expect(PASS_MARK).toBe(80);
  });

  it("counts the answers of the whole topic: X over ALL its questions, not only the answered ones", () => {
    const total = s1.length;
    const need = Math.ceil((PASS_MARK * total) / 100);
    const row = topicProgress("S1", [session(s1.slice(0, need), need)]);
    expect(row).toMatchObject({ sectionId: "S1", correct: need, total, status: "ready" });
    const less = topicProgress("S1", [session(s1.slice(0, need - 1), need - 1)]);
    expect(less.status).toBe("needs-work");
    expect(less.total).toBe(total);
  });

  it("uses the LATEST answer per question, across sessions", () => {
    const first = session(s1.slice(0, 4), 4, at(2));
    const later = session(s1.slice(0, 2), 0, at(1));
    const row = topicProgress("S1", [first, later]);
    expect(row.correct).toBe(2);
    expect(row.answered).toBe(4);
  });
});

describe("the topic lists", () => {
  it("sorts weakest first: Not started, Needs work, Ready, then the lower share, then guide order", () => {
    const rows = [
      { sectionId: "S1", correct: 10, total: 10, answered: 10, status: "ready" as const },
      { sectionId: "S2", correct: 5, total: 10, answered: 10, status: "needs-work" as const },
      { sectionId: "S3", correct: 0, total: 10, answered: 0, status: "not-started" as const },
      { sectionId: "S4", correct: 2, total: 10, answered: 5, status: "needs-work" as const },
      { sectionId: "S5", correct: 0, total: 10, answered: 0, status: "not-started" as const },
      { sectionId: "S6", correct: 8, total: 10, answered: 8, status: "ready" as const },
    ];
    expect(sortTopics(rows).map((row) => row.sectionId)).toEqual([
      "S3",
      "S5",
      "S4",
      "S2",
      "S6",
      "S1",
    ]);
  });

  it("groups the exam's topics first and the other ten-topic list after it", () => {
    const groups = topicGroups(["S1", "S2", "S3", "S4"], []);
    expect(groups.inExam.map((row) => row.sectionId).sort()).toEqual(["S1", "S2", "S3", "S4"]);
    expect(groups.other).toHaveLength(6);
    expect(groups.other.every((row) => !["S1", "S2", "S3", "S4"].includes(row.sectionId))).toBe(
      true,
    );
  });

  it("has no exam group without an exam: all ten topics are listed", () => {
    const groups = topicGroups(null, []);
    expect(groups.inExam).toEqual([]);
    expect(groups.other).toHaveLength(10);
  });
});

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

describe("activity", () => {
  it("counts sessions and the questions answered at least once", () => {
    const history = [session(s1.slice(0, 4), 4), session(s1.slice(2, 6), 1)];
    expect(activitySummary(history)).toEqual({ sessions: 2, answers: 6 });
    expect(activityLabel({ sessions: 6, answers: 28 })).toBe("6 sessions · 28 answers");
    expect(activityLabel({ sessions: 1, answers: 1 })).toBe("1 session · 1 answer");
  });
});

describe("recent sessions", () => {
  it("takes the newest first and limits the list", () => {
    const history = [1, 2, 3, 4, 5].map((n) => session(s1.slice(0, 2), 1, at(6 - n)));
    const recent = recentSessions(history, 3);
    expect(recent).toHaveLength(3);
    expect(recent.map((entry) => entry.finishedAt)).toEqual(
      [...recent.map((entry) => entry.finishedAt)].sort((a, b) => b - a),
    );
    expect(recent[0].finishedAt).toBe(at(1));
  });

  it("labels the mode, with Practice for a record without one", () => {
    expect(sessionModeLabel(session(s1, 1, at(0), { mode: "mini-quiz" }))).toBe("Mini-quiz");
    expect(sessionModeLabel(session(s1, 1, at(0), { mode: "practice" }))).toBe("Practice");
    expect(sessionModeLabel(session(s1, 1, at(0), { kind: "exam" }))).toBe("Exam");
    expect(sessionModeLabel(session(s1, 1, at(0), { mode: "exam" }))).toBe("Exam");
    // an old record: no mode, no topics
    expect(sessionModeLabel(session(s1, 1))).toBe("Practice");
    expect(sessionTopicIds(session(s1, 1))).toEqual([]);
  });

  it("reads the stored topics and ignores a broken value", () => {
    expect(sessionTopicIds(session(s1, 1, at(0), { topicIds: ["S1", "S2"] }))).toEqual([
      "S1",
      "S2",
    ]);
    const broken = { ...session(s1, 1), topicIds: "S1", mode: 7 } as unknown as FinishedSession;
    expect(sessionTopicIds(broken)).toEqual([]);
    expect(sessionModeLabel(broken)).toBe("Practice");
    const mixed = { ...session(s1, 1), topicIds: ["S1", 3, null] } as unknown as FinishedSession;
    expect(sessionTopicIds(mixed)).toEqual(["S1"]);
  });

  it("gives the result as counts: correct of all, an exam over all its questions", () => {
    expect(sessionResult(session(s1.slice(0, 10), 7))).toEqual({ correct: 7, total: 10 });
    const exam = session(s1.slice(0, 4), 3, at(0), {
      kind: "exam",
      exam: { percent: 15, questions: 20, timeUsedSeconds: 60 },
    });
    expect(sessionResult(exam)).toEqual({ correct: 3, total: 20 });
  });
});

describe("the human date", () => {
  it("says Today with the time, Yesterday, then the day and month", () => {
    expect(sessionDate(at(0, 10, 37), NOW)).toBe("Today, 10:37");
    expect(sessionDate(at(1, 22, 5), NOW)).toBe("Yesterday");
    expect(sessionDate(at(1, 0, 5), NOW)).toBe("Yesterday");
    expect(sessionDate(at(1, 12), NOW)).toBe("Yesterday");
    expect(sessionDate(at(3, 9), NOW)).toBe("16 Oct");
    expect(sessionDate(new Date(2025, 11, 31, 9).getTime(), NOW)).toBe("31 Dec 2025");
  });
});

describe("session records", () => {
  it("store the guide topics of their questions, in guide order, once each", () => {
    expect(topicIdsOf([...s2.slice(0, 2), ...s1.slice(0, 2)])).toEqual(["S1", "S2"]);
    expect(topicIdsOf([])).toEqual([]);
    expect(topicIdsOf(["no-such-question"])).toEqual([]);
  });

  it("load without a mode or topics (records saved before) and with broken values, without errors", () => {
    const old = session(s1.slice(0, 3), 2);
    const broken = { ...session(s1.slice(0, 3), 2, at(1)), mode: 5, topicIds: "S1" };
    const loaded = cleanHistory([old, broken, { nonsense: true }, null, "x"])!;
    expect(loaded).toHaveLength(2);
    for (const entry of loaded) {
      expect(sessionModeLabel(entry)).toBe("Practice");
      expect(sessionTopicIds(entry)).toEqual([]);
      expect(sessionResult(entry).total).toBe(3);
    }
  });
});
