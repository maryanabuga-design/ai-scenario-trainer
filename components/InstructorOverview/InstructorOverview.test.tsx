import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InstructorOverviewView } from "@/components/InstructorOverview/InstructorOverviewView";
import type { DraftSet } from "@/lib/actions";
import { participants } from "@/lib/cohort";
import { seedGroupExams } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import {
  groupReadiness,
  topicStandings,
  trendLine,
  weakestTopic,
  weakestLine,
} from "@/lib/overview";
import { overviewModel } from "@/lib/overview-model";
import { profileStatus, profiles } from "@/lib/students";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const exams = seedGroupExams(now);
const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const everyone = profiles(people, { "ana@example.com": null });
const titleOf = (id: string) => `Topic ${id}`;
const rescue = everyone.filter((p) => p.participant.groupId === "rescue-team");

const render = ({
  scope = "rescue-team",
  list = everyone,
  allExams = exams,
  drafts = [] as DraftSet[],
  people: who = people,
  publishedSets = 0,
}: {
  scope?: string;
  list?: typeof everyone;
  allExams?: GroupExam[];
  drafts?: DraftSet[];
  people?: typeof people;
  publishedSets?: number;
} = {}) =>
  renderToStaticMarkup(
    <InstructorOverviewView
      name="Ira"
      model={overviewModel({
        scope,
        list,
        people: who,
        exams: allExams,
        attempts: [],
        drafts,
        publishedSets,
        reminded: new Set(),
        now,
      })}
      topicTitle={titleOf}
      onSelectGroup={() => undefined}
    />,
  ).replace(/<!-- -->/g, "");

const visible = (html: string) => html.replace(/<[^>]+>/g, " ");
const needsOf = (list: typeof everyone) => list.filter((p) => profileStatus(p) === "needs");

describe("the Overview header", () => {
  const html = render({ drafts: [{ id: "cdemo", title: "Evacuation routes" }] });

  it("greets by name next to the avatar, with no band and the subtitle of the scope", () => {
    expect(html).toContain(">Hi, Ira</h1>");
    expect(html).not.toContain("data-page-header-band");
    expect(html.indexOf("data-avatar")).toBeLessThan(html.indexOf(">Hi, Ira</h1>"));
    expect(html).toContain("Here is how Rescue team is doing.");
    expect(render({ scope: "all" })).toContain("Here is how your groups are doing.");
  });

  it("has the group switcher under the subtitle: a button pill with a neutral group icon, the name and a chevron, closed", () => {
    expect(html).not.toContain("/instructor/groups");
    const at = html.indexOf("data-group-pill");
    const pill = html.slice(html.lastIndexOf("<button", at), at + 1800);
    expect(pill).toContain("<button");
    expect(pill).toContain('aria-haspopup="listbox"');
    expect(pill).toContain('aria-expanded="false"');
    expect(pill).toContain("min-h-11");
    expect(pill).toContain("h-10");
    expect(pill).toContain("rounded-full");
    expect(pill).toContain("bg-neutral-tile-bg");
    expect(pill).toContain("lucide-users-round");
    expect(pill).not.toContain("bg-primary");
    expect(pill).toContain("Rescue team");
    expect(pill).toContain("lucide-chevron-down");
    expect(html).not.toContain('role="listbox"');
    expect(html.indexOf("Here is how")).toBeLessThan(html.indexOf("data-group-pill"));
    expect(render({ scope: "all" })).toMatch(/data-group-pill[\s\S]*All groups/);
  });

  it("draws the list under the pill when open: a listbox of options with counts and status words, a check on the current one, All groups last", () => {
    const open = renderToStaticMarkup(
      <InstructorOverviewView
        name="Ira"
        switcherOpen
        model={overviewModel({
          scope: "rescue-team",
          list: everyone,
          people,
          exams,
          attempts: [],
          drafts: [],
          publishedSets: 0,
          reminded: new Set(),
          now,
        })}
        topicTitle={titleOf}
        onSelectGroup={() => undefined}
      />,
    );
    expect(open).toContain('aria-expanded="true"');
    expect(open).toContain("rotate-180");
    const list = open.slice(
      open.indexOf('role="listbox"'),
      open.indexOf("</ul>", open.indexOf('role="listbox"')),
    );
    expect(list.match(/role="option"/g)).toHaveLength(3);
    expect(list).toContain("15 students · Almost ready");
    expect(list).toContain("12 students · Needs attention");
    expect(list).toContain("One card per group");
    expect(list.indexOf("Military training")).toBeLessThan(list.indexOf("All groups"));
    expect(list.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(list.match(/lucide-check/g)).toHaveLength(1);
    for (const hook of [
      "rounded-[16px]",
      "border-selectable-stroke",
      "min-h-14",
      "max-w-[min(320px,calc(100vw-32px))]",
      "absolute",
    ]) {
      expect(list.concat(open)).toContain(hook);
    }
    expect(list).not.toContain("%");
    expect(open).not.toContain('role="dialog"');
  });
});

describe("the readiness card", () => {
  const html = render();
  const card = html.slice(html.indexOf("data-group-readiness"), html.indexOf("NEEDS YOUR ACTION"));

  it("has the label, the figure, the trend line, the ring and the strip, in this order", () => {
    const order = [
      "GROUP READINESS",
      "data-readiness-figure",
      "data-trend",
      "data-ring",
      "data-readiness-strip",
    ].map((t) => card.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(card).toContain(`>${groupReadiness(rescue)}%<`);
  });

  it("has one headline percentage and the comparison value in the trend line, nothing else (the ring is only a graphic)", () => {
    const text = visible(html);
    expect(text.match(/%/g)).toHaveLength(2);
    const outside = text.replace(/Up from \d+% last week/, "");
    expect(outside.match(/%/g)).toHaveLength(1);
    const ring = card.slice(card.indexOf("data-ring") - 40, card.indexOf("data-readiness-strip"));
    expect(ring).toContain('aria-hidden="true"');
    expect(ring).toContain("lucide-shield");
    expect(ring).not.toMatch(/<text/);
  });

  it("has no pill any more, and an increase is a plain line with an up arrow in the success text colour", () => {
    expect(html).not.toContain("data-delta");
    expect(card).not.toContain("points this week");
    expect(card).toMatch(
      /data-trend-tone="up"[^>]*class="[^"]*text-status-success-ink[^"]*"[^>]*>↑ Up from 66% last week</,
    );
    expect(card).not.toContain("bg-status-success-bg");
  });

  it("shows a decrease in the muted text colour, never red or amber", () => {
    const military = render({ scope: "military-training" });
    expect(military).toMatch(
      /data-trend-tone="muted"[^>]*class="[^"]*text-text-secondary[^"]*"[^>]*>↓ Down from 62% last week</,
    );
    expect(military).not.toMatch(/bg-wrong|text-wrong/);
  });

  it("shows 'Same as last week' for an unchanged value and nothing without a value or in All groups", () => {
    expect(trendLine(70, 70)?.text).toBe("→ Same as last week");
    expect(render({ scope: "all" })).not.toContain("data-trend");
    expect(trendLine(70, null)).toBeNull();
  });

  it("has a sand strip with the group line that opens Students", () => {
    const strip = card.slice(card.indexOf("data-readiness-strip") - 120);
    expect(strip).toContain('href="/instructor/students?from=overview"');
    expect(strip).toContain("bg-secondary-sand");
    expect(strip).toContain("min-h-11");
    expect(strip).toContain("Rescue team · 15 students · 2 not started");
    expect(strip).toContain("lucide-arrow-right");
  });
});

describe("NEEDS YOUR ACTION", () => {
  const html = render({ drafts: [{ id: "cdemo", title: "Evacuation routes" }] });
  const section = html.slice(html.indexOf("NEEDS YOUR ACTION"), html.indexOf(">EXAMS<"));

  it("is one card with up to three 72px rows divided by hairlines, each with a tile, a one-line title, a reason and a chevron", () => {
    const rows = section.match(/data-action="[a-z-]+"/g)!;
    expect(rows.length).toBeLessThanOrEqual(3);
    expect(rows[0]).toBe('data-action="needs-attention"');
    expect(rows[1]).toBe('data-action="draft-set"');
    expect(section.match(/<ul/g)).toHaveLength(1);
    expect(section).toContain("divide-y divide-soft-divider");
    expect(section.match(/h-\[72px\]/g)).toHaveLength(rows.length);
    expect(section.match(/lucide-chevron-right/g)).toHaveLength(rows.length);
    expect(section.match(/data-icon-tile=/g)).toHaveLength(rows.length);
    expect(section).toContain("h-11 w-11 rounded-[12px]");
    expect(section).toContain("students need attention");
    expect(section).toContain("1 imported set is not published");
    expect(visible(section)).not.toContain("%");
    expect(section.match(/type-body-strong truncate/g)).toHaveLength(rows.length);
  });

  it("says All caught up (success tile, no chevron) when nothing applies", () => {
    const calm = render({ list: everyone.filter((p) => profileStatus(p) !== "needs") });
    expect(calm).toContain("data-all-caught-up");
    expect(calm).toContain("bg-status-success-bg");
    expect(calm).not.toContain("data-action=");
  });
});

describe("EXAMS", () => {
  const html = render();
  const section = html.slice(html.indexOf(">EXAMS<"), html.indexOf("WEAKEST TOPIC"));

  it("has the label with a muted '1 Active' and ONE card with the exam row and a Secondary Assign exam with a plus icon", () => {
    expect(section).toMatch(/data-block-note[^>]*>1 Active</);
    expect(section.match(/data-exams-card/g)).toHaveLength(1);
    expect(section).toContain("data-exam-card=");
    expect(section).toContain("h-[88px]");
    expect(visible(section)).toMatch(/Passed \d+ of 15 · \d+ not started/);
    expect(section).toMatch(/bg-olive-tint[^>]*>[\s\S]*lucide-circle-plus[\s\S]*Assign exam</);
    expect(section).not.toContain("bg-primary");
    // the exam row sits inside the card, with no card of its own
    const row = section.slice(
      section.indexOf("data-exam-card="),
      section.indexOf("data-exam-card=") + 200,
    );
    expect(row).not.toContain("shadow-(--card-shadow)");
    expect(section).not.toContain("All exams");
  });

  it("shows the underlined link 'All exams (n)' when more are active than shown", () => {
    const more: GroupExam[] = [...exams, { ...exams[0], id: "extra", deadline: "2026-11-20" }];
    const withMore = render({ allExams: more });
    expect(withMore).toMatch(/>All exams \(2\)</);
    expect(withMore).toMatch(/href="\/instructor\/exams"[^>]*>[\s\S]*underline[\s\S]*All exams/);
  });

  it("shows 'No active exam' and the one Primary Assign exam when none is active", () => {
    const empty = render({ allExams: [] });
    expect(empty).toContain("No active exam");
    expect(empty).toMatch(/data-block-note[^>]*>0 Active</);
    expect(empty).toMatch(/bg-primary[^>]*>[\s\S]*Assign exam</);
    expect(empty.match(/h-\[52px\] bg-primary/g)).toHaveLength(1);
  });
});

describe("WEAKEST TOPIC", () => {
  const html = render();
  const section = html.slice(html.indexOf("WEAKEST TOPIC"), html.indexOf("data-demo-note"));

  it("has the S badge and name on one row, the muted count, a Secondary with a checklist icon and the centred link", () => {
    const weak = weakestTopic(rescue)!;
    expect(section).toContain(`data-weakest-topic="${weak.sectionId}"`);
    expect(section).toContain(`>${weak.sectionId}<`);
    expect(section).toContain(`Topic ${weak.sectionId}`);
    expect(section).toContain(weakestLine(weak, rescue.length));
    expect(section).toContain("who answered it are at or above the pass mark");
    expect(section).toContain(
      `href="/instructor/exams/new?topic=${weak.sectionId}&amp;from=overview"`,
    );
    expect(section).toMatch(
      /bg-olive-tint[^>]*>[\s\S]*lucide-clipboard-check[\s\S]*Assign exam on this topic</,
    );
    // the link is in the header row with the label, right-aligned, and no longer under the card
    const header = html.slice(
      html.indexOf('aria-labelledby="weakest-title"'),
      html.indexOf("data-weakest-topic"),
    );
    expect(header).toMatch(
      /justify-between[\s\S]*WEAKEST TOPIC[\s\S]*href="\/instructor\/students\?view=topics"[\s\S]*underline[\s\S]*All topics/,
    );
    expect(section.slice(section.indexOf("data-weakest-topic"))).not.toContain("All topics");
    expect(section.match(/All topics/g)).toHaveLength(1);
    expect(section).not.toContain("lucide-chevron-right");
  });

  it("is hidden without data and in All groups", () => {
    expect(render({ list: [], people: [], scope: "rescue-team", allExams: exams })).not.toContain(
      "WEAKEST TOPIC",
    );
    expect(render({ scope: "all" })).not.toContain("WEAKEST TOPIC");
  });
});

describe("All groups", () => {
  const html = render({ scope: "all", drafts: [{ id: "cdemo", title: "Evacuation routes" }] });

  it("replaces the readiness card with a GROUPS card (no figure, no ring, no percentage)", () => {
    expect(html).toContain("data-groups-card");
    expect(html).toContain(">GROUPS<");
    expect(html).not.toContain("data-group-readiness");
    expect(html).not.toContain("data-ring");
    expect(visible(html)).not.toContain("%");
    expect(html).toMatch(/data-group-row="rescue-team"[\s\S]*15 students · \d+ need/);
    expect(html).toMatch(
      /data-group-row="military-training"[\s\S]*12 students · \d+ needs? attention/,
    );
  });

  it("puts the group name first in the action rows and lists the nearest exam of each group with a tag", () => {
    const actions = html.slice(html.indexOf("NEEDS YOUR ACTION"), html.indexOf(">EXAMS<"));
    expect(actions).toMatch(/Rescue team · \d+ students? needs? attention/);
    const section = html.slice(html.indexOf(">EXAMS<"), html.indexOf("data-demo-note"));
    expect(section.match(/data-exam-card=/g)).toHaveLength(2);
    expect(section).toContain("Rescue team");
    expect(section).toContain("Military training");
    expect(section).toMatch(/data-block-note[^>]*>2 Active</);
  });
});

describe("Get started", () => {
  const empty = render({ list: [], people: [], allExams: [] });

  it("replaces the readiness, action, exam and weakest blocks for a group with no students and no exams", () => {
    expect(empty).toContain("data-get-started");
    for (const gone of ["data-group-readiness", "NEEDS YOUR ACTION", ">EXAMS<", "WEAKEST TOPIC"]) {
      expect(empty).not.toContain(gone);
    }
    expect(empty.match(/data-start-step=/g)).toHaveLength(3);
    expect(empty).toContain("Invite students");
    expect(empty).toContain("Import or review questions");
    expect(empty).toContain("Assign the first exam");
    expect(empty).toMatch(/data-start-step="invite"[\s\S]*?data-state="next"/);
    expect(empty).toMatch(/data-state="locked"/);
    expect(empty).toContain('href="/instructor/students/invite"');
    expect(empty).toContain('href="/instructor/content"');
    expect(empty).toContain('href="/instructor/exams/new?from=overview"');
  });

  it("marks the import step done once a set is published", () => {
    expect(render({ list: [], people: [], allExams: [], publishedSets: 1 })).toMatch(
      /data-start-step="import"[\s\S]*?data-state="done"/,
    );
  });

  it("is not shown while the group has students", () => {
    expect(render()).not.toContain("data-get-started");
  });
});

describe("the whole screen", () => {
  it("has at most one Primary button and ends with the demo note", () => {
    for (const html of [
      render(),
      render({ scope: "all" }),
      render({ allExams: [] }),
      render({ list: [], people: [], allExams: [] }),
    ]) {
      expect(html.match(/h-\[52px\] bg-primary/g)?.length ?? 0).toBeLessThanOrEqual(1);
      expect(html).toContain("Demo group. Student data on this screen is simulated.");
    }
  });

  it("has no hard-coded colours or external URLs", () => {
    for (const file of [
      "components/InstructorOverview/InstructorOverviewView.tsx",
      "components/InstructorOverview/OverviewBlocks.tsx",
      "components/GroupSwitcher/GroupSwitcher.tsx",
    ]) {
      const code = readFileSync(file, "utf8");
      expect(code, file).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
      expect(code, file).not.toMatch(/https?:\/\//);
    }
  });

  it("keeps all ten topics on the Topics screen order", () => {
    expect(topicStandings(everyone)).toHaveLength(10);
    expect(needsOf(rescue).length).toBeGreaterThan(0);
  });
});
