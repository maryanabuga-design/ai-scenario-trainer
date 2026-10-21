import { describe, expect, it } from "vitest";
import { participants } from "@/lib/cohort";
import { seedGroupExams } from "@/lib/group-exams";
import { addNotice, collapseReminders, readNotices } from "@/lib/group-store";
import {
  GROUP_CODE,
  INVITE_LINK,
  invalidLine,
  invitedLine,
  parseEmails,
  splitNew,
  withInvitations,
} from "@/lib/invitations";
import { withNotices } from "@/lib/notifications";
import { groupReadiness, needsAttention, topicStandings } from "@/lib/overview";
import { nameList, reminderFor, reminderNoticeId, unfinishedExam } from "@/lib/reminders";
import type { Attempt } from "@/lib/cohort";
import {
  activeProfiles,
  isNotStarted,
  profileStatus,
  profiles,
  topicFrom,
  topicsToReview,
  visibleStudents,
} from "@/lib/students";
import type { StudentProfile, StudentTopic } from "@/lib/students";

const now = new Date(2026, 10, 2, 10, 0).getTime();
const exams = seedGroupExams(now);
const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const all = profiles(people, { "ana@example.com": null });
const seeded = all.filter((p) => !p.participant.local);

const topic = (sectionId: string, answered: number, correct: number): StudentTopic => ({
  sectionId,
  answered,
  correct,
  total: 10,
});
const student = (id: string, topics: StudentTopic[], local = false): StudentProfile => ({
  participant: { id, name: id, initials: id.slice(0, 2).toUpperCase(), local },
  field: null,
  topics,
});

describe("the demo data is realistic", () => {
  it("has about 4 Ready, 5 Almost ready, 4 Needs attention and 1 Not started among the 14", () => {
    const count = (status: string) => seeded.filter((p) => profileStatus(p) === status).length;
    expect([count("ready"), count("almost"), count("needs"), count("not-started")]).toEqual([
      4, 5, 4, 1,
    ]);
    expect(seeded).toHaveLength(14);
  });

  it("has topics to review between 0 and 7, different weak topics, and nobody with all 10 unless Not started", () => {
    const counts = seeded.map(topicsToReview);
    expect(Math.min(...counts)).toBe(0);
    expect(Math.max(...counts)).toBe(7);
    for (const p of seeded) {
      if (!isNotStarted(p)) expect(topicsToReview(p)).toBeLessThan(10);
      expect(topicsToReview(p)).toBeLessThanOrEqual(p.topics.filter((t) => t.answered > 0).length);
    }
    const weakSets = new Set(
      seeded.map((p) =>
        p.topics
          .filter((t) => t.answered > 0 && t.correct * 100 < 80 * t.answered)
          .map((t) => t.sectionId)
          .join(),
      ),
    );
    expect(weakSets.size).toBeGreaterThan(6);
  });

  it("makes the local demo account Not started, so it does not count as needing attention", () => {
    const mine = all.find((p) => p.participant.local)!;
    expect(profileStatus(mine)).toBe("not-started");
    expect(needsAttention(all).includes(mine)).toBe(false);
  });
});

describe("the group figures leave out Not started participants", () => {
  it("changes nothing when a Not started participant joins", () => {
    const base = activeProfiles(all);
    expect(activeProfiles(all)).toHaveLength(13);
    expect(groupReadiness(all)).toBe(groupReadiness(base));
    expect(topicStandings(all)).toEqual(topicStandings(base));
    expect(needsAttention(all)).toHaveLength(needsAttention(base).length);
  });

  it("orders Weakest topics by the lowest share, ties by topic number, and only counts those who answered", () => {
    const list = [
      student("a", [
        topic("S1", 10, 10),
        topic("S2", 10, 4),
        topic("S3", 10, 4),
        topic("S4", 0, 0),
      ]),
      student("b", [
        topic("S1", 10, 5),
        topic("S2", 10, 10),
        topic("S3", 10, 9),
        topic("S4", 10, 3),
      ]),
      student("c", [
        topic("S1", 10, 5),
        topic("S2", 10, 10),
        topic("S3", 10, 10),
        topic("S4", 10, 3),
      ]),
      student("never", [topic("S1", 0, 0), topic("S2", 0, 0)]),
    ];
    // S1: 1 of 3 pass; S2: 2 of 3; S3: 2 of 3; S4: 0 of 2 (a did not answer it)
    expect(topicStandings(list).slice(0, 3)).toEqual([
      { sectionId: "S4", passing: 0, total: 2 },
      { sectionId: "S1", passing: 1, total: 3 },
      { sectionId: "S2", passing: 2, total: 3 },
    ]);
  });

  it("passes a topic at 80% of the answers given: 8 of 10 passes, 7 of 10 does not", () => {
    const list = [student("a", [topic("S1", 10, 8)]), student("b", [topic("S1", 10, 7)])];
    expect(topicStandings(list)[0]).toEqual({ sectionId: "S1", passing: 1, total: 2 });
  });

  it("lists all ten topics; a topic nobody answered comes last with no data", () => {
    const standings = topicStandings([student("a", [topic("S2", 5, 5), topic("S7", 5, 1)])]);
    expect(standings).toHaveLength(10);
    expect(standings[0]).toEqual({ sectionId: "S7", passing: 0, total: 1 });
    expect(standings[1]).toEqual({ sectionId: "S2", passing: 1, total: 1 });
    expect(standings.slice(2).every((s) => s.total === 0)).toBe(true);
    expect(standings.slice(2).map((s) => s.sectionId)).toEqual([
      "S1",
      "S3",
      "S4",
      "S5",
      "S6",
      "S8",
      "S9",
      "S10",
    ]);
    expect(groupReadiness([student("a", [topic("S1", 0, 0)])])).toBe(0);
  });

  it("filters the students below the pass mark in a topic, and reads the topic from the address", () => {
    const s3 = visibleStudents(all, "all", exams, [], now, "S3");
    for (const p of s3) {
      const row = p.topics.find((t) => t.sectionId === "S3")!;
      expect(row.answered).toBeGreaterThan(0);
      expect(row.correct * 100).toBeLessThan(80 * row.answered);
    }
    expect(s3.length).toBeGreaterThan(0);
    expect(
      visibleStudents(all, "needs", exams, [], now, "S3").every(
        (p) => profileStatus(p) === "needs",
      ),
    ).toBe(true);
    expect(topicFrom("S3")).toBe("S3");
    expect(topicFrom("S11")).toBeNull();
    expect(topicFrom(null)).toBeNull();
  });
});

describe("inviting students", () => {
  it("parses addresses separated by commas, spaces, semicolons and new lines, once each, in lower case", () => {
    const { valid, invalid } = parseEmails("A@x.com, b@x.com\nc@x.com;a@x.com  nope, d@");
    expect(valid).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
    expect(invalid).toEqual(["nope", "d@"]);
    expect(parseEmails("")).toEqual({ valid: [], invalid: [] });
    expect(invalidLine(["nope", "d@"])).toBe("Not a valid address: nope, d@");
    expect(invalidLine([])).toBe("");
  });

  it("ignores addresses that are already invited, and puts new ones first", () => {
    const pending = withInvitations([], ["a@x.com"], 1);
    expect(splitNew(["a@x.com", "b@x.com"], pending)).toEqual({
      fresh: ["b@x.com"],
      duplicates: ["a@x.com"],
    });
    const next = withInvitations(pending, ["b@x.com", "c@x.com"], 2);
    expect(next.map((e) => e.email)).toEqual(["b@x.com", "c@x.com", "a@x.com"]);
    expect(invitedLine(new Date(2026, 9, 21).getTime())).toBe("Invited 21 Oct");
  });

  it("has a fixed demo code and link", () => {
    expect(GROUP_CODE).toBe("QT-A7K2");
    expect(INVITE_LINK).toContain(GROUP_CODE);
  });
});

describe("reminders", () => {
  const titleOf = (id: string) => `Topic ${id}`;
  const weak = student("w", [topic("S1", 10, 5), topic("S2", 10, 9), topic("S3", 10, 2)]);
  const fine = student("f", [topic("S1", 10, 10)]);
  const active = exams[0];

  it("chooses the exam, then the weak topics, then a kind word", () => {
    expect(reminderFor(weak, active, titleOf)).toMatchObject({
      kind: "exam",
      target: `/exam?id=${active.id}`,
    });
    expect(reminderFor(weak, active, titleOf).text).toMatch(
      /^Your instructor reminded you: .+ is due \d{1,2} \w{3}\.$/,
    );
    expect(reminderFor(weak, null, titleOf)).toMatchObject({
      kind: "topics",
      text: "Your instructor suggests practising: Topic S1 and Topic S3.",
    });
    expect(reminderFor(fine, null, titleOf)).toEqual({
      kind: "general",
      text: "Your instructor says: keep it up.",
      target: "/",
    });
  });

  it("names the topics in plain words", () => {
    expect(nameList(["A"])).toBe("A");
    expect(nameList(["A", "B", "C"])).toBe("A, B and C");
    expect(nameList(["A", "B", "C", "D", "E"])).toBe("A, B, C and 2 more");
  });

  it("finds the active exam a student has not passed (a passed one is skipped)", () => {
    const person = people[0];
    expect(unfinishedExam(person, exams, [], now)?.id).toBe(exams[0].id);
    const passed: Attempt = {
      examId: exams[0].id,
      studentId: person.id,
      correct: 20,
      total: 20,
      finishedAt: 1,
    };
    expect(unfinishedExam(person, exams, [passed], now)).toBeNull();
  });

  it("gives one notice per student and kind, and sending again updates it (new date, unread again)", () => {
    expect(reminderNoticeId("ana@example.com", "exam")).toBe("remind-student-ana@example.com-exam");
    const id = reminderNoticeId("ana@example.com", "topics");
    const first = { id, title: "one", text: "", target: "/", createdAt: 10, to: "ana@example.com" };
    const second = { ...first, title: "two", createdAt: 20 };
    expect(collapseReminders([first, second]).map((n) => n.title)).toEqual(["two"]);
    const list = withNotices([], [first], "ana@example.com");
    expect(list).toHaveLength(1);
    const read = list.map((n) => ({ ...n, read: true }));
    const again = withNotices(read, [first, second], "ana@example.com");
    expect(again).toHaveLength(1);
    expect(again[0]).toMatchObject({ title: "two", read: false, createdAt: 20 });
    // a reminder for one account never reaches another
    expect(withNotices([], [first], "bob@example.com")).toEqual([]);
    expect(withNotices([], [first], null)).toEqual([]);
  });

  it("keeps one stored notice per student and kind when added twice", () => {
    const id = reminderNoticeId("zed@example.com", "general");
    addNotice({ id, title: "a", text: "", target: "/", createdAt: 1, to: "zed@example.com" });
    addNotice({ id, title: "b", text: "", target: "/", createdAt: 2, to: "zed@example.com" });
    const mine = readNotices().filter((n) => n.id === id);
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ title: "b", to: "zed@example.com" });
  });
});
