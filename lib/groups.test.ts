import { describe, expect, it } from "vitest";
import { actionRows } from "@/lib/actions";
import { participants, seededStudents } from "@/lib/cohort";
import { examsToTake } from "@/lib/exams-to-take";
import { getStarted } from "@/lib/get-started";
import { cleanGroupExams, createExam, seedGroupExams } from "@/lib/group-exams";
import { cleanNotices } from "@/lib/group-store";
import {
  ALL_GROUPS,
  DEFAULT_GROUP_ID,
  examPeople,
  examsInScope,
  groupNames,
  groups,
  inScope,
  isScope,
  scopeName,
  scopeSubtitle,
} from "@/lib/groups";
import { cleanInvitations, inviteLink, withInvitations } from "@/lib/invitations";
import { withNotices } from "@/lib/notifications";
import {
  deltaLine,
  deltaTone,
  groupDelta,
  groupReadiness,
  needsAttention,
  studentsCount,
} from "@/lib/overview";
import { groupRows, overviewModel } from "@/lib/overview-model";
import { activeProfiles, notStartedCount, profiles } from "@/lib/students";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const everyone = profiles(people, { "ana@example.com": null });
const exams = seedGroupExams(now);

describe("the demo groups", () => {
  it("are Rescue team (14 invented students, code QT-A7K2) and Military training (12, code QT-M4R9)", () => {
    expect(groups.map((g) => g.name)).toEqual(["Rescue team", "Military training"]);
    expect(groups.map((g) => g.code)).toEqual(["QT-A7K2", "QT-M4R9"]);
    expect(seededStudents.filter((s) => s.group === "rescue-team")).toHaveLength(14);
    expect(seededStudents.filter((s) => s.group === "military-training")).toHaveLength(12);
    expect(new Set(seededStudents.map((s) => s.id)).size).toBe(26);
    expect(DEFAULT_GROUP_ID).toBe("rescue-team");
  });

  it("put local accounts in Rescue team", () => {
    const local = people.find((p) => p.local)!;
    expect(local.groupId).toBe("rescue-team");
    expect(inScope(people, "rescue-team")).toHaveLength(15);
    expect(inScope(people, "military-training")).toHaveLength(12);
    expect(inScope(people, ALL_GROUPS)).toHaveLength(27);
  });

  it("know their scopes and names", () => {
    expect(isScope("all")).toBe(true);
    expect(isScope("military-training")).toBe(true);
    expect(isScope("nope")).toBe(false);
    expect(isScope(3)).toBe(false);
    expect(scopeName("all")).toBe("All groups");
    expect(scopeName("rescue-team")).toBe("Rescue team");
    expect(scopeSubtitle("military-training")).toBe("Here is how Military training is doing.");
    expect(scopeSubtitle("all")).toBe("Here is how your groups are doing.");
    expect(groupNames(["rescue-team", "military-training"])).toBe("Rescue team, Military training");
  });
});

describe("scope-aware figures", () => {
  it("group figures are the same helpers over the group's students, never a second calculation", () => {
    for (const group of groups) {
      const own = everyone.filter((p) => p.participant.groupId === group.id);
      const model = overviewModel({
        scope: group.id,
        list: everyone,
        people,
        exams,
        attempts: [],
        drafts: [],
        publishedSets: 0,
        reminded: new Set(),
        now,
      });
      expect(model.list).toEqual(own);
      expect(model.readiness).toBe(groupReadiness(own));
      expect(model.delta).toBe(groupDelta(own));
      expect(model.students).toBe(own.length);
      expect(model.notStarted).toBe(notStartedCount(own));
    }
  });

  it("student counts of the groups add up to all participants, and need-attention counts add up too", () => {
    const rows = groupRows(everyone);
    expect(rows.map((r) => r.students)).toEqual([15, 12]);
    expect(rows.reduce((s, r) => s + r.students, 0)).toBe(everyone.length);
    expect(rows.reduce((s, r) => s + r.needs, 0)).toBe(needsAttention(everyone).length);
    expect(studentsCount(12)).toBe("12 students");
  });

  it("All groups never averages: the model carries group rows and no combined weakest topic", () => {
    const model = overviewModel({
      scope: ALL_GROUPS,
      list: everyone,
      people,
      exams,
      attempts: [],
      drafts: [],
      publishedSets: 0,
      reminded: new Set(),
      now,
    });
    expect(model.groupRows.map((r) => r.group.id)).toEqual(["rescue-team", "military-training"]);
    expect(model.weakest).toBeNull();
    expect(model.steps).toBeNull();
    // one nearest active exam per group, each once
    expect(model.examRows.map((r) => r.exam.id)).toEqual(["seed-active", "seed-military-active"]);
    expect(model.examRows.map((r) => r.tag)).toEqual(["Rescue team", "Military training"]);
    expect(model.activeCount).toBe(2);
  });

  it("the two delta states of the demo data: Rescue team up, Military training down", () => {
    const delta = (id: string) => groupDelta(everyone.filter((p) => p.participant.groupId === id));
    expect(delta("rescue-team")).toBe(4);
    expect(delta("military-training")).toBe(-3);
  });

  it("names the three delta tones and wording", () => {
    expect(deltaLine(4)).toBe("+4 points this week");
    expect(deltaLine(-3)).toBe("-3 points this week");
    expect(deltaLine(0)).toBe("No change this week");
    expect(deltaLine(1)).toBe("+1 point this week");
    expect(deltaTone(4)).toBe("success");
    expect(deltaTone(0)).toBe("neutral");
    expect(deltaTone(-3)).toBe("attention");
  });

  it("has Military training students with a spread of statuses and one not started", () => {
    const own = everyone.filter((p) => p.participant.groupId === "military-training");
    expect(notStartedCount(own)).toBe(1);
    expect(activeProfiles(own)).toHaveLength(11);
    expect(needsAttention(own).length).toBeGreaterThan(0);
  });
});

describe("the action rules per scope", () => {
  const rows = (scope: string, over: Partial<Parameters<typeof actionRows>[0]> = {}) =>
    actionRows({
      list: everyone,
      exams,
      attempts: [],
      people,
      drafts: [],
      reminded: new Set(),
      now,
      scope,
      ...over,
    });

  it("one group: no prefix, only that group's students", () => {
    const own = rows("military-training");
    const needs = own.find((r) => r.kind === "needs-attention")!;
    const count = needsAttention(
      everyone.filter((p) => p.participant.groupId === "military-training"),
    ).length;
    expect(needs.title).toBe(
      `${count} ${count === 1 ? "student needs" : "students need"} attention`,
    );
    expect(needs.scopeTo).toBeUndefined();
  });

  it("All groups: each row starts with the group name and selects that group when opened", () => {
    const all = rows(ALL_GROUPS);
    expect(all.length).toBeLessThanOrEqual(3);
    const needs = all.filter((r) => r.kind === "needs-attention");
    expect(needs.map((r) => r.scopeTo)).toEqual(["rescue-team", "military-training"]);
    expect(needs[0].title).toMatch(/^Rescue team · \d+ students? needs? attention$/);
    expect(needs[1].title).toMatch(/^Military training · \d+ students? needs? attention$/);
  });

  it("All groups: a group without an active exam gets its own 'No active exam' row; a draft set has no group", () => {
    const onlyRescue = exams.filter((e) => e.groupIds.includes("rescue-team"));
    const result = rows(ALL_GROUPS, { exams: onlyRescue, drafts: [{ id: "c1", title: "Set" }] });
    expect(result.find((r) => r.kind === "draft-set")!.title).toBe(
      "1 imported set is not published",
    );
    const noneRows = actionRows({
      list: [],
      exams: [],
      attempts: [],
      people: [],
      drafts: [],
      reminded: new Set(),
      now,
      scope: ALL_GROUPS,
    });
    expect(noneRows.map((r) => r.title)).toEqual([
      "Rescue team · No active exam",
      "Military training · No active exam",
    ]);
  });

  it("an exam of another group never counts for this group", () => {
    const military = exams.find((e) => e.id === "seed-military-active")!;
    const soon = { ...military, deadline: "2026-10-26" };
    const forRescue = rows("rescue-team", { exams: [soon] });
    expect(forRescue.some((r) => r.kind === "exam-not-started")).toBe(false);
    const forMilitary = rows("military-training", { exams: [soon] });
    expect(forMilitary.find((r) => r.kind === "exam-not-started")?.href).toBe(
      "/instructor/exams/seed-military-active?from=overview",
    );
  });
});

describe("exams and their audience", () => {
  it("are listed for the scope: a group sees its own, All groups sees all", () => {
    expect(examsInScope(exams, "rescue-team").map((e) => e.id)).toEqual([
      "seed-active",
      "seed-closed",
    ]);
    expect(examsInScope(exams, "military-training").map((e) => e.id)).toEqual([
      "seed-military-active",
    ]);
    expect(examsInScope(exams, ALL_GROUPS)).toHaveLength(3);
  });

  it("have an audience of the participants of their groups", () => {
    const military = exams.find((e) => e.id === "seed-military-active")!;
    expect(examPeople(people, military)).toHaveLength(12);
    const both = { groupIds: ["rescue-team", "military-training"] };
    expect(examPeople(people, both)).toHaveLength(27);
  });

  it("are created with the chosen groups, and an old exam without groups is Rescue team's", () => {
    const made = createExam(
      { title: "T", topicIds: ["S1"], deadline: "2026-10-31", groupIds: ["military-training"] },
      now,
    );
    expect(made.groupIds).toEqual(["military-training"]);
    const old = cleanGroupExams([
      { id: "old", title: "Old", topicIds: ["S1", "S2"], deadline: "2026-10-31" },
      {
        id: "bad",
        title: "Bad",
        topicIds: ["S1", "S2"],
        deadline: "2026-10-31",
        groupIds: ["zzz"],
      },
    ])!;
    expect(old.map((e) => e.groupIds)).toEqual([["rescue-team"], ["rescue-team"]]);
  });
});

describe("local students follow their group", () => {
  const military = exams.find((e) => e.id === "seed-military-active")!;

  it("are offered only the exams that include Rescue team", () => {
    const take = examsToTake(exams, [], "ana@example.com", now).map((e) => e.id);
    expect(take).toEqual(["seed-active"]);
    expect(take).not.toContain(military.id);
  });

  it("are notified only for exams of their group", () => {
    const base = { id: "n1", title: "T", text: "", target: "/", createdAt: 1 };
    const notices = [
      { ...base, id: "a", groups: ["military-training"] },
      { ...base, id: "b", groups: ["rescue-team", "military-training"] },
      { ...base, id: "c" },
    ];
    const merged = withNotices([], notices, "ana@example.com").map((n) => n.id);
    expect(merged).toContain("b");
    expect(merged).toContain("c");
    expect(merged).not.toContain("a");
  });

  it("keep the groups of a notice when loaded, tolerantly", () => {
    const list = cleanNotices([
      {
        id: "x",
        title: "T",
        text: "",
        target: "/",
        createdAt: 1,
        groups: ["military-training", "zzz", 3],
      },
    ])!;
    expect(list[0].groups).toEqual(["military-training"]);
  });
});

describe("invitations by group", () => {
  it("belong to a group, default Rescue team, and use that group's code", () => {
    const list = withInvitations([], ["a@x.com"], 1, "military-training");
    expect(list[0].groupId).toBe("military-training");
    expect(withInvitations([], ["b@x.com"], 1)[0].groupId).toBe("rescue-team");
    expect(cleanInvitations([{ email: "c@x.com", invitedAt: 1 }])![0].groupId).toBe("rescue-team");
    expect(inviteLink(groups[1].code)).toContain("QT-M4R9");
  });
});

describe("Get started", () => {
  it("shows only while the group has no students and no exams", () => {
    expect(getStarted({ students: 3, exams: 0, publishedSets: 0 })).toBeNull();
    expect(getStarted({ students: 0, exams: 1, publishedSets: 0 })).toBeNull();
    expect(getStarted({ students: 0, exams: 0, publishedSets: 0 })).not.toBeNull();
  });

  it("has three steps: the first not done is next, the rest locked, a published set marks Import done", () => {
    const fresh = getStarted({ students: 0, exams: 0, publishedSets: 0 })!;
    expect(fresh.map((s) => s.id)).toEqual(["invite", "import", "assign"]);
    expect(fresh.map((s) => s.state)).toEqual(["next", "locked", "locked"]);
    expect(fresh.map((s) => s.href)).toEqual([
      "/instructor/students/invite",
      "/instructor/content",
      "/instructor/exams/new?from=overview",
    ]);
    expect(getStarted({ students: 0, exams: 0, publishedSets: 2 })!.map((s) => s.state)).toEqual([
      "next",
      "done",
      "locked",
    ]);
  });
});
