import { describe, expect, it } from "vitest";
import { groupCounts, participants, seededStudents, statusOf } from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import { isActive, seedGroupExams, topicQuestionCount } from "@/lib/group-exams";
import { allTopicIds } from "@/lib/progress-view";
import { examReadiness } from "@/lib/readiness";
import type { FinishedSession } from "@/lib/session";
import { modeItems } from "@/lib/parts";
import {
  certifiedAnywhere,
  examRowsFor,
  fieldLabel,
  filterFrom,
  groupLine,
  localProfile,
  profileStatus,
  profiles,
  readinessOf,
  rowText,
  seededProfile,
  sortProfiles,
  statusDetail,
  studentStatus,
  topicNeedsReview,
  topicsToReview,
  visibleStudents,
} from "@/lib/students";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const exams = seedGroupExams(now);
const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const all = profiles(people, { "ana@example.com": null });

describe("thresholds", () => {
  it("80 or more is Ready, 60 to 79 Almost ready, below 60 Needs attention", () => {
    expect(studentStatus(100)).toBe("ready");
    expect(studentStatus(80)).toBe("ready");
    expect(studentStatus(79)).toBe("almost");
    expect(studentStatus(60)).toBe("almost");
    expect(studentStatus(59)).toBe("needs");
    expect(studentStatus(0)).toBe("needs");
  });
});

describe("a student's figures", () => {
  it("holds every seeded student to the real question counts, S1 to S10 in order", () => {
    for (const student of seededStudents) {
      const profile = seededProfile(
        student,
        people.find((p) => p.id === student.id)!,
      );
      expect(profile.topics.map((t) => t.sectionId)).toEqual(allTopicIds);
      for (const row of profile.topics) {
        expect(row.total).toBe(topicQuestionCount(row.sectionId));
        expect(row.correct).toBeGreaterThanOrEqual(0);
        expect(row.correct).toBeLessThanOrEqual(row.answered);
        expect(row.answered).toBeLessThanOrEqual(row.total);
      }
    }
  });

  it("gives the demo group a spread of statuses", () => {
    const kinds = new Set(all.map((p) => profileStatus(p)));
    expect(kinds).toEqual(new Set(["ready", "almost", "needs", "not-started"]));
  });

  it("is the Progress readiness for a local account (the same calculation)", () => {
    const quiz = modeItems("quiz").slice(0, 12);
    const history: FinishedSession[] = [
      {
        kind: "quiz",
        mode: "practice",
        itemIds: quiz.map((q) => q.id),
        answers: quiz.map((q, i) => ({
          itemId: q.id,
          optionId:
            i < 8 ? q.correctOptionId : q.options.find((o) => o.id !== q.correctOptionId)!.id,
        })),
        finishedAt: 1,
      },
    ];
    const profile = localProfile(people[0], history);
    expect(readinessOf(profile)).toBe(examReadiness(allTopicIds, history));
    expect(localProfile(people[0], null).topics.every((t) => t.correct === 0)).toBe(true);
    expect(readinessOf(localProfile(people[0], null))).toBe(0);
  });

  it("counts topics below the pass mark (80% of the answers given) as 'to review', never more than answered", () => {
    const row = (sectionId: string, answered: number, correct: number, total = 10) => ({
      sectionId,
      answered,
      correct,
      total,
    });
    const profile = {
      participant: people[1],
      field: "rescue" as const,
      topics: [row("S1", 40, 40, 40), row("S2", 5, 4, 6), row("S3", 4, 3, 4), row("S4", 0, 0, 5)],
    };
    expect(topicNeedsReview(profile.topics[0])).toBe(false);
    expect(topicNeedsReview(profile.topics[1])).toBe(false); // 4 of 5 is exactly 80%
    expect(topicNeedsReview(profile.topics[2])).toBe(true); // 3 of 4 is 75%
    expect(topicNeedsReview(profile.topics[3])).toBe(false); // nothing answered: neither
    expect(topicsToReview(profile)).toBe(1);
    expect(fieldLabel("paramedic")).toBe("Paramedic");
    expect(fieldLabel(null)).toBe("Not set");
  });

  it("words the second line of a row: the status, then the short 'to review', or the local account", () => {
    const row = (answered: number, correct: number) => ({
      sectionId: "S1",
      answered,
      correct,
      total: 40,
    });
    const base = { participant: people[1], field: null };
    const bad = { ...base, topics: [row(10, 5), { ...row(10, 5), sectionId: "S2" }] };
    expect(rowText(bad)).toBe("Needs attention · 2 to review");
    const ready = {
      ...base,
      topics: [row(40, 38), { ...row(40, 40), sectionId: "S2", total: 40 }],
    };
    expect(profileStatus(ready)).toBe("ready");
    expect(rowText(ready)).toBe("Ready · all topics on track");
    expect(rowText({ ...base, topics: [row(0, 0)] })).toBe("Not started");
    expect(rowText({ ...base, participant: people[0], topics: [row(0, 0)] })).toBe(
      "Your demo account · Not started",
    );
  });
});

describe("the list", () => {
  it("sorts Needs attention first, then Almost ready, then Ready, then Not started, alphabetical inside", () => {
    const list = sortProfiles(all);
    const ranks = list.map(
      (p) => ({ needs: 0, almost: 1, ready: 2, "not-started": 3 })[profileStatus(p)],
    );
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    for (let i = 1; i < list.length; i++) {
      if (ranks[i] === ranks[i - 1]) {
        expect(
          list[i - 1].participant.name.localeCompare(list[i].participant.name),
        ).toBeLessThanOrEqual(0);
      }
    }
  });

  it("filters: All keeps everyone, Needs attention only those below 60", () => {
    expect(visibleStudents(all, "all", exams, [], now)).toHaveLength(15);
    const needs = visibleStudents(all, "needs", exams, [], now);
    expect(needs.length).toBeGreaterThan(0);
    for (const p of needs) expect(readinessOf(p)).toBeLessThan(60);
    // the local account has nothing answered: it is Not started, not Needs attention
    expect(needs.some((p) => p.participant.local)).toBe(false);
  });

  it("Certified keeps the students certified for at least one exam, the same statuses as the Exam detail", () => {
    const attempts: Attempt[] = [];
    const certified = visibleStudents(all, "certified", exams, attempts, now);
    for (const p of certified)
      expect(certifiedAnywhere(p.participant, exams, attempts, now)).toBe(true);
    for (const p of all.filter((x) => !certified.includes(x))) {
      expect(certifiedAnywhere(p.participant, exams, attempts, now)).toBe(false);
    }
    // a real attempt makes the local account certified
    const mine: Attempt[] = [
      { examId: exams[0].id, studentId: "ana@example.com", correct: 18, total: 20, finishedAt: 1 },
    ];
    expect(
      visibleStudents(all, "certified", exams, mine, now).some((p) => p.participant.local),
    ).toBe(true);
  });

  it("reads the filter from the address and falls back to All", () => {
    expect(filterFrom("needs")).toBe("needs");
    expect(filterFrom("certified")).toBe("certified");
    expect(filterFrom("nope")).toBe("all");
    expect(filterFrom(null)).toBe("all");
  });

  it("words the group line and the status detail", () => {
    expect(groupLine("Group A", 14)).toBe("Group A · 14 students");
    expect(groupLine("Group A", 1)).toBe("Group A · 1 student");
    expect(groupLine("Group A", 15, 2)).toBe("Group A · 15 students · 2 not started");
    expect(statusDetail({ kind: "certified", correct: 17, total: 20 })).toBe(
      "Certified · 17 of 20 correct",
    );
    expect(statusDetail({ kind: "not-passed", correct: 14, total: 20 })).toBe(
      "Not passed · 14 of 20 correct",
    );
    expect(statusDetail({ kind: "not-started" })).toBe("Not started");
  });
});

describe("the exams of a student match the Exam detail", () => {
  it("gives every exam with the same status the Exam detail computes, for every participant", () => {
    for (const person of people) {
      const rows = examRowsFor(person, exams, [], now);
      expect(rows).toHaveLength(exams.length);
      for (const row of rows) {
        expect(row.status).toEqual(
          statusOf(person, row.exam, { attempts: [], active: isActive(row.exam, now) }),
        );
      }
    }
  });

  it("agrees with the group counts of each exam", () => {
    for (const exam of exams) {
      const context = { attempts: [], active: isActive(exam, now) };
      const counts = groupCounts(people, exam, context);
      const kinds = people.map(
        (p) => examRowsFor(p, exams, [], now).find((r) => r.exam.id === exam.id)!.status.kind,
      );
      expect(kinds.filter((k) => k === "certified")).toHaveLength(counts.certified);
      expect(kinds.filter((k) => k === "not-passed")).toHaveLength(counts.notPassed);
      expect(kinds.filter((k) => k === "not-started")).toHaveLength(counts.notStarted);
    }
  });

  it("offers a certificate only for a Certified local result that has one", () => {
    const attempts: Attempt[] = [
      {
        examId: exams[0].id,
        studentId: "ana@example.com",
        correct: 18,
        total: 20,
        finishedAt: 1,
        certificateId: "QT-2026-0001",
      },
    ];
    const mine = examRowsFor(people[0], exams, attempts, now).find(
      (r) => r.exam.id === exams[0].id,
    )!;
    expect(mine.certificateId).toBe("QT-2026-0001");
    for (const row of examRowsFor(people[1], exams, attempts, now)) {
      expect(row.certificateId).toBeUndefined();
    }
  });
});
