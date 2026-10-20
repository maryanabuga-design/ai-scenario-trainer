import { describe, expect, it } from "vitest";
import {
  MIN_QUESTIONS,
  assignProblems,
  cleanGroupExams,
  createExam,
  deadlineAllowed,
  defaultTitle,
  dueLine,
  examQuestionCount,
  isActive,
  knownTopicIds,
  presetDeadline,
  rulesLine,
  seedGroupExams,
  splitExams,
  topicQuestionCount,
  topicsLine,
  totalQuestions,
} from "@/lib/group-exams";
import { cleanAttempts, cleanNotices } from "@/lib/group-store";

const now = new Date(2026, 9, 24, 10, 0).getTime();

describe("question counts", () => {
  it("counts scenario and quiz questions per topic, and is 20 at most", () => {
    expect(topicQuestionCount("S1")).toBeGreaterThan(20);
    expect(topicQuestionCount("S9")).toBeGreaterThan(0);
    expect(topicQuestionCount("S99")).toBe(0);
    expect(totalQuestions(["S1", "S2"])).toBe(topicQuestionCount("S1") + topicQuestionCount("S2"));
    expect(examQuestionCount(["S1"])).toBe(20);
  });

  it("uses the real number when the topics hold fewer than 20", () => {
    const small = ["S8", "S9", "S10"];
    const total = totalQuestions(small);
    expect(examQuestionCount(small)).toBe(Math.min(20, total));
    if (total < 20) expect(examQuestionCount(small)).toBe(total);
  });
});

describe("the minimum-question rule and deadline rules", () => {
  const ok = { title: "Exam: Alarm", topicIds: ["S1"], deadline: "2026-10-27" };

  it("accepts a complete valid exam", () => {
    expect(assignProblems(ok, now)).toEqual([]);
  });

  it("asks for a title, topics and a deadline", () => {
    expect(assignProblems({ ...ok, title: "   " }, now)).toContain("Add a title.");
    expect(assignProblems({ ...ok, topicIds: [] }, now)).toContain("Choose at least one topic.");
    expect(assignProblems({ ...ok, deadline: null }, now)).toContain("Choose a deadline.");
  });

  it("requires at least 10 questions in the selected topics", () => {
    const tiny = ["S10"].filter((id) => topicQuestionCount(id) < MIN_QUESTIONS);
    if (tiny.length > 0) {
      expect(assignProblems({ ...ok, topicIds: tiny }, now).join()).toContain(
        "at least 10 questions",
      );
    }
    expect(assignProblems({ ...ok, topicIds: ["S1"] }, now)).toEqual([]);
  });

  it("does not allow a date in the past, but allows today", () => {
    expect(deadlineAllowed("2026-10-23", now)).toBe(false);
    expect(deadlineAllowed("2026-10-24", now)).toBe(true);
    expect(deadlineAllowed("2026-12-01", now)).toBe(true);
    expect(deadlineAllowed("not a date", now)).toBe(false);
    expect(assignProblems({ ...ok, deadline: "2026-10-01" }, now)).toContain(
      "The deadline cannot be in the past.",
    );
  });

  it("works out the presets: 3 days, 1 week, 2 weeks, and none for a picked date", () => {
    expect(presetDeadline("3d", now)).toBe("2026-10-27");
    expect(presetDeadline("1w", now)).toBe("2026-10-31");
    expect(presetDeadline("2w", now)).toBe("2026-11-07");
    expect(presetDeadline("date", now)).toBeNull();
  });
});

describe("an exam", () => {
  it("is Active until the end of its deadline day, then Closed", () => {
    const exam = { deadline: "2026-10-24" };
    expect(isActive(exam, new Date(2026, 9, 24, 0, 0).getTime())).toBe(true);
    expect(isActive(exam, new Date(2026, 9, 24, 23, 59).getTime())).toBe(true);
    expect(isActive(exam, new Date(2026, 9, 25, 0, 1).getTime())).toBe(false);
    expect(isActive({ ...exam, closedAt: now }, now)).toBe(false);
  });

  it("is created from valid input with 20 minutes, pass mark 80 and its question count", () => {
    const exam = createExam(
      { title: "  Exam: Alarm  ", topicIds: ["S3", "S1"], deadline: "2026-10-31" },
      now,
    );
    expect(exam).toMatchObject({
      title: "Exam: Alarm",
      topicIds: ["S1", "S3"],
      questionCount: 20,
      timeLimit: 20,
      passMark: 80,
      deadline: "2026-10-31",
      createdAt: now,
      createdBy: "Instructor",
    });
    expect(exam.id).toMatch(/^grp-/);
    expect(createExam({ title: "x", topicIds: ["S1"], deadline: "2026-10-31" }, now).id).not.toBe(
      exam.id,
    );
  });

  it("has two seeded exams, one Active and one Closed, dated from now", () => {
    const seeded = seedGroupExams(now);
    expect(seeded).toHaveLength(2);
    const { active, closed } = splitExams(seeded, now);
    expect(active).toHaveLength(1);
    expect(closed).toHaveLength(1);
    for (const e of seeded)
      expect(totalQuestions(e.topicIds)).toBeGreaterThanOrEqual(MIN_QUESTIONS);
  });

  it("splits Active (nearest deadline first) and Closed (latest first)", () => {
    const base = seedGroupExams(now)[0];
    const list = [
      { ...base, id: "a", deadline: "2026-10-30" },
      { ...base, id: "b", deadline: "2026-10-26" },
      { ...base, id: "c", deadline: "2026-10-01" },
      { ...base, id: "d", deadline: "2026-10-10" },
      { ...base, id: "e", deadline: "2026-11-30", closedAt: now },
    ];
    const { active, closed } = splitExams(list, now);
    expect(active.map((e) => e.id)).toEqual(["b", "a"]);
    expect(closed.map((e) => e.id)).toEqual(["e", "d", "c"]);
  });
});

describe("texts", () => {
  it("builds the title, the due line, the topics line and the rules", () => {
    const titleOf = (id: string) => ({ S1: "Alarm", S2: "Routes", S3: "Smoke" })[id] ?? id;
    expect(defaultTitle([], titleOf)).toBe("");
    expect(defaultTitle(["S1"], titleOf)).toBe("Exam: Alarm");
    expect(defaultTitle(["S1", "S2"], titleOf)).toBe("Exam: Alarm, Routes");
    expect(defaultTitle(["S1", "S2", "S3"], titleOf)).toBe("Exam: Alarm, Routes +1");
    expect(
      dueLine({ deadline: "2026-10-25", topicIds: ["S1", "S2", "S3", "S4", "S5", "S6"] }),
    ).toBe("Due 25 Oct · 6 topics");
    expect(dueLine({ deadline: "2026-10-25", topicIds: ["S1"] })).toBe("Due 25 Oct · 1 topic");
    expect(topicsLine(["S1", "S2", "S3", "S4"], titleOf)).toBe("Alarm, Routes +2 more");
    expect(topicsLine(["S1", "S2"], titleOf)).toBe("Alarm, Routes");
    expect(rulesLine({ questionCount: 20, timeLimit: 20, passMark: 80 })).toBe(
      "20 questions · 20 minutes · pass mark 80",
    );
    expect(knownTopicIds(["S3", "S99", "S1"])).toEqual(["S1", "S3"]);
  });
});

describe("tolerant loading", () => {
  const good = seedGroupExams(now)[0];

  it("drops broken exams and fixes what it can, without throwing", () => {
    const loaded = cleanGroupExams([
      good,
      null,
      "x",
      { ...good, id: "" },
      { ...good, id: "t1", title: " " },
      { ...good, id: "t2", deadline: "soon" },
      { ...good, id: "t3", topicIds: ["S99"] },
      { ...good, id: "t4", topicIds: ["S1", "S99", 5] },
      { ...good, id: "t5", closedAt: "x", createdAt: "y" },
      good,
    ]);
    expect(loaded!.map((e) => e.id)).toEqual([good.id, "t4", "t5"]);
    expect(loaded![1].topicIds).toEqual(["S1"]);
    expect(loaded![2].closedAt).toBeUndefined();
    expect(cleanGroupExams("garbage")).toBeNull();
    expect(cleanGroupExams([])).toBeNull();
    expect(cleanGroupExams(null)).toBeNull();
  });

  it("cleans attempts and notices the same way", () => {
    const attempts = cleanAttempts([
      { examId: "e", studentId: "a@b.co", correct: 10, total: 20, finishedAt: 5 },
      { examId: "e", studentId: "a@b.co", correct: 25, total: 20, finishedAt: 5 },
      { examId: "e", studentId: "a@b.co", correct: 1, total: 0, finishedAt: 5 },
      null,
      "x",
    ]);
    expect(attempts).toHaveLength(1);
    expect(cleanAttempts("x")).toBeNull();
    const notices = cleanNotices([
      { id: "n1", title: "New exam", text: "t", target: "/exam", createdAt: 1 },
      { id: "n1", title: "dup", createdAt: 2 },
      { id: "n2", title: "", createdAt: 3 },
      7,
    ]);
    expect(notices).toHaveLength(1);
    expect(cleanNotices(null)).toBeNull();
  });
});
