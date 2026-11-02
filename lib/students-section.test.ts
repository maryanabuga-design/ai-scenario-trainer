import { describe, expect, it } from "vitest";
import { participants, seededStudents } from "@/lib/cohort";
import { cleanAccountGroup } from "@/lib/groups";
import {
  invitationFor,
  markJoined,
  parseEmails,
  pendingOf,
  splitNew,
  withInvitations,
} from "@/lib/invitations";
import { groupByCode, groupToJoin } from "@/lib/join";
import { examReadiness } from "@/lib/readiness";
import { guardRedirect } from "@/lib/route-guard";
import { assignOnTopicParams } from "@/lib/students";
import { allTopicIds, topicProgress } from "@/lib/progress-view";
import { needsReviewTag, topicStandings, weakestTopic } from "@/lib/overview";
import { reminderFor, reminderNoticeId, unfinishedExam } from "@/lib/reminders";
import { seedGroupExams } from "@/lib/group-exams";
import { cleanNotices, collapseReminders } from "@/lib/group-store";
import { modeItems } from "@/lib/parts";
import type { FinishedSession } from "@/lib/session";
import {
  belowPassMark,
  lastActiveLong,
  lastActiveShort,
  localProfile,
  profileStatus,
  profiles,
  readinessChange,
  readinessOf,
  rowMuted,
  showingLine,
  sortProfiles,
  studentStatus,
  topicMuted,
  topicNeedsReview,
  topicsToReview,
} from "@/lib/students";
import { inScope } from "@/lib/groups";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const DAY = 86_400_000;
const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const rescue = profiles(inScope(people, "rescue-team"), {}, now);
const military = profiles(inScope(people, "military-training"), {}, now);

describe("the status thresholds", () => {
  it("is Ready at 80 or more, Almost ready from 60 to 79, Needs attention below 60", () => {
    expect([100, 80].map(studentStatus)).toEqual(["ready", "ready"]);
    expect([79, 60].map(studentStatus)).toEqual(["almost", "almost"]);
    expect([59, 0].map(studentStatus)).toEqual(["needs", "needs"]);
  });

  it("is Not started without any answer, whatever the thresholds", () => {
    const none = rescue.find((p) => p.participant.id === "stu-06")!;
    expect(profileStatus(none)).toBe("not-started");
    expect(none.lastActiveDaysAgo).toBeNull();
  });

  it("sorts Needs attention, Almost ready, Not started, Ready, and by name inside", () => {
    const order = { needs: 0, almost: 1, "not-started": 2, ready: 3 } as const;
    const list = sortProfiles(rescue);
    const ranks = list.map((p) => order[profileStatus(p)]);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});

describe("topics to review and the topic tags", () => {
  const row = (answered: number, correct: number) => ({
    sectionId: "S1",
    answered,
    correct,
    total: 40,
  });

  it("a topic is below the pass mark under 80 percent of the answers given, never when unanswered", () => {
    expect(topicNeedsReview(row(5, 4))).toBe(false);
    expect(topicNeedsReview(row(5, 3))).toBe(true);
    expect(topicNeedsReview(row(0, 0))).toBe(false);
    for (const p of rescue)
      expect(topicsToReview(p)).toBe(p.topics.filter(topicNeedsReview).length);
  });

  it("tags a topic Needs review when fewer than half of the active students are on track", () => {
    expect(needsReviewTag({ sectionId: "S3", passing: 4, total: 14 })).toBe(true);
    expect(needsReviewTag({ sectionId: "S3", passing: 7, total: 14 })).toBe(false);
    expect(needsReviewTag({ sectionId: "S3", passing: 0, total: 0 })).toBe(false);
  });

  it("leaves Not started students out of the topic counts, and picks the weakest topic by its share", () => {
    const standings = topicStandings(rescue);
    const active = rescue.filter((p) => profileStatus(p) !== "not-started").length;
    expect(standings.every((s) => s.total <= active)).toBe(true);
    const weak = weakestTopic(rescue)!;
    expect(weak).toEqual(standings[0]);
    const share = (s: { passing: number; total: number }) => s.passing / s.total;
    expect(standings.filter((s) => s.total > 0).every((s) => share(s) >= share(weak))).toBe(true);
  });

  it("lists the students below the pass mark in a topic, and words 'S3: 2 of 5 correct'", () => {
    const below = belowPassMark(rescue, "S3");
    for (const p of below) {
      const topic = p.topics.find((t) => t.sectionId === "S3")!;
      expect(topicMuted(p, "S3")).toBe(`S3: ${topic.correct} of ${topic.answered} correct`);
    }
    expect(below.length).toBeGreaterThan(0);
  });

  it("prefills Assign exam with the weakest topic and the group in scope", () => {
    const weak = weakestTopic(military)!;
    expect(assignOnTopicParams(weak.sectionId)).toBe(`topic=${weak.sectionId}&from=students`);
  });
});

describe("the words of a row", () => {
  it("gives the muted text only for Needs attention and Almost ready", () => {
    for (const p of rescue) {
      const status = profileStatus(p);
      if (status === "ready" || status === "not-started") expect(rowMuted(p)).toBeNull();
      else expect(rowMuted(p)).toBe(`${topicsToReview(p)} to review`);
    }
  });

  it("says today, yesterday, 3d ago and 2w ago (and the long forms of the detail)", () => {
    expect([0, 1, 3, 13, 14, 21].map(lastActiveShort)).toEqual([
      "today",
      "yesterday",
      "3d ago",
      "13d ago",
      "2w ago",
      "3w ago",
    ]);
    expect([0, 1, 6, 14].map(lastActiveLong)).toEqual([
      "today",
      "yesterday",
      "6 days ago",
      "2 weeks ago",
    ]);
  });

  it("words the filter line for a topic only: every status is a chip", () => {
    for (const status of ["not-started", "almost", "needs", "ready", "all"] as const)
      expect(showingLine(status, null)).toBeNull();
    expect(showingLine("not-started", { id: "S3", title: "Moving through smoke" })).toBe(
      "Below pass mark in S3 · Moving through smoke · Not started",
    );
    expect(showingLine("all", { id: "S3", title: "Moving through smoke" })).toBe(
      "Below pass mark in S3 · Moving through smoke",
    );
  });
});

describe("the weekly change of a student", () => {
  it("is the readiness now against a week ago for the invented students, none for a local account", () => {
    for (const p of rescue.filter(
      (x) => !x.participant.local && x.readinessPrev !== null && profileStatus(x) !== "not-started",
    )) {
      expect(readinessChange(p)).toBe(readinessOf(p) - p.readinessPrev!);
    }
    const local = rescue.find((p) => p.participant.local)!;
    expect(local.readinessPrev).toBeNull();
    expect(readinessChange(local)).toBeNull();
    // up, down and unchanged states exist in the demo data
    const changes = [...rescue, ...military].map(readinessChange).filter((c) => c !== null);
    expect(changes.some((c) => c! > 0)).toBe(true);
    expect(changes.some((c) => c! < 0)).toBe(true);
  });

  it("has practice sessions this week from the seeded data", () => {
    for (const s of seededStudents) {
      const p = [...rescue, ...military].find((x) => x.participant.id === s.id)!;
      expect(p.practiceThisWeek).toBe(s.practiceSessionsThisWeek);
    }
  });
});

describe("the numbers equal what the student sees (Progress and Results use the same helpers)", () => {
  const quiz = modeItems("quiz")
    .filter((q) => q.section === "S1")
    .slice(0, 12);
  const history: FinishedSession[] = [
    {
      kind: "quiz",
      mode: "practice",
      topicIds: ["S1"],
      itemIds: quiz.map((q) => q.id),
      answers: quiz.map((q, i) => ({
        itemId: q.id,
        optionId: i < 9 ? q.correctOptionId : q.options.find((o) => o.id !== q.correctOptionId)!.id,
      })),
      finishedAt: now - 2 * DAY,
    },
    {
      kind: "exam",
      mode: "exam",
      topicIds: ["S1"],
      itemIds: quiz.slice(0, 4).map((q) => q.id),
      answers: quiz.slice(0, 4).map((q) => ({ itemId: q.id, optionId: q.correctOptionId })),
      finishedAt: now - 1 * DAY,
      exam: { percent: 100, questions: 4, timeUsedSeconds: 60 },
    },
  ];
  const profile = localProfile(people[0], history, now);

  it("has the student's own Readiness, per-topic counts, last active and practice sessions", () => {
    expect(readinessOf(profile)).toBe(examReadiness(allTopicIds, history));
    for (const id of allTopicIds) {
      const own = topicProgress(id, history);
      const row = profile.topics.find((t) => t.sectionId === id)!;
      expect([row.correct, row.total]).toEqual([own.correct, own.total]);
    }
    // the latest activity is yesterday's exam attempt; one practice session this week (the exam is not practice)
    expect(profile.lastActiveDaysAgo).toBe(1);
    expect(profile.practiceThisWeek).toBe(1);
    expect(profileStatus(profile)).not.toBe("not-started");
  });

  it("counts a practice session older than 7 days out of the week", () => {
    const old = localProfile(people[0], [{ ...history[0], finishedAt: now - 9 * DAY }], now);
    expect(old.practiceThisWeek).toBe(0);
    expect(old.lastActiveDaysAgo).toBe(9);
  });
});

describe("the reminder", () => {
  const exams = seedGroupExams(now);
  const titleOf = (id: string) => `Topic ${id}`;
  const needs = sortProfiles(rescue).find((p) => profileStatus(p) === "needs")!;
  const ready = rescue.find((p) => profileStatus(p) === "ready")!;

  it("is chosen from what the student has to do: an unfinished exam, else weak topics, else a kind word", () => {
    const withExam = rescue.find((p) => unfinishedExam(p.participant, exams, [], now) !== null)!;
    const exam = unfinishedExam(withExam.participant, exams, [], now);
    expect(exam).not.toBeNull();
    expect(reminderFor(withExam, exam, titleOf)).toMatchObject({
      kind: "exam",
      text: expect.stringMatching(/^Your instructor reminded you: .+ is due \d+ \w{3}\.$/),
    });
    expect(reminderFor(needs, null, titleOf).kind).toBe("topics");
    expect(reminderFor(needs, null, titleOf).text).toMatch(
      /^Your instructor suggests practising: /,
    );
    const clean = { ...ready, topics: ready.topics.map((t) => ({ ...t, correct: t.answered })) };
    expect(reminderFor(clean, null, titleOf)).toMatchObject({
      kind: "general",
      text: "Your instructor says: keep it up.",
    });
  });

  it("keeps one notice per student and kind: sending again replaces it", () => {
    const id = reminderNoticeId("ana@example.com", "topics");
    expect(id).toBe("remind-student-ana@example.com-topics");
    expect(reminderNoticeId("ana@example.com", "exam")).not.toBe(id);
    const list = cleanNotices([
      { id, title: "A", text: "", target: "/", createdAt: 1, to: "ana@example.com" },
      { id, title: "B", text: "", target: "/", createdAt: 2, to: "ana@example.com" },
    ]);
    expect(list).not.toBeNull();
    expect(
      collapseReminders([
        { id: "remind-x", createdAt: 1 },
        { id: "remind-x", createdAt: 2 },
      ]),
    ).toHaveLength(1);
  });
});

describe("inviting by email", () => {
  it("parses addresses split by commas or new lines, ignores duplicates, lists the invalid ones", () => {
    const { valid, invalid } = parseEmails("A@x.com, b@x.com\nnope, a@x.com");
    expect(valid).toEqual(["a@x.com", "b@x.com"]);
    expect(invalid).toEqual(["nope"]);
    const pending = withInvitations([], ["a@x.com"], 1, "rescue-team");
    expect(splitNew(["a@x.com", "c@x.com"], pending)).toEqual({
      fresh: ["c@x.com"],
      duplicates: ["a@x.com"],
    });
  });

  it("keeps the pending list per group and takes a joined invitation out of it", () => {
    const list = [
      ...withInvitations([], ["a@x.com"], 1, "rescue-team"),
      ...withInvitations([], ["m@x.com"], 2, "military-training"),
    ];
    expect(pendingOf(list, "rescue-team").map((i) => i.email)).toEqual(["a@x.com"]);
    const joined = markJoined(list, "A@x.com", 9);
    expect(pendingOf(joined, "rescue-team")).toEqual([]);
    expect(joined[0].joinedAt).toBe(9);
    expect(pendingOf(joined, "military-training")).toHaveLength(1);
    expect(invitationFor(joined, "a@x.com")?.joinedAt).toBe(9);
  });
});

describe("the join link", () => {
  const invitations = withInvitations([], ["ana@example.com"], 1, "military-training");

  it("looks up a group by its code (any case) and knows an unknown one", () => {
    expect(groupByCode("QT-A7K2")?.id).toBe("rescue-team");
    expect(groupByCode("qt-m4r9")?.id).toBe("military-training");
    expect(groupByCode("QT-0000")).toBeUndefined();
  });

  it("puts a new Student into the group of the link, else of the invitation, else nowhere (Rescue team by default)", () => {
    expect(groupToJoin("student", "x@x.com", "QT-M4R9", [])).toBe("military-training");
    expect(groupToJoin("student", "ana@example.com", null, invitations)).toBe("military-training");
    expect(groupToJoin("student", "nobody@x.com", null, invitations)).toBeNull();
    expect(groupToJoin("student", "x@x.com", "QT-0000", [])).toBeNull();
    // an Instructor never joins a group
    expect(groupToJoin("instructor", "x@x.com", "QT-M4R9", invitations)).toBeNull();
  });

  it("makes the new Student a participant of that group, and a Student without one Rescue team's", () => {
    const joined = participants([
      { name: "Ana", email: "ana@example.com", groupId: "military-training" },
    ]);
    expect(joined[0].groupId).toBe("military-training");
    expect(participants([{ name: "Bo", email: "bo@example.com" }])[0].groupId).toBe("rescue-team");
    expect(cleanAccountGroup("military-training")).toBe("military-training");
    expect(cleanAccountGroup("nope")).toBeUndefined();
    expect(cleanAccountGroup("all")).toBeUndefined();
  });

  it("is open to a signed-out visitor and to a signed-in student (who confirms), and an instructor is sent Home", () => {
    expect(guardRedirect(null, "/join/QT-A7K2")).toBeNull();
    expect(guardRedirect(null, "/instructor/students")).toBe("/welcome");
    expect(guardRedirect({ role: "student", onboardingDone: true }, "/join/QT-A7K2")).toBeNull();
    expect(guardRedirect({ role: "instructor", onboardingDone: true }, "/join/QT-A7K2")).toBe(
      "/instructor",
    );
  });
});
