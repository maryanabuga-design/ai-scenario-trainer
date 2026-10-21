import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InstructorOverviewView } from "@/components/InstructorOverview/InstructorOverviewView";
import { actionRows } from "@/lib/actions";
import type { DraftSet } from "@/lib/actions";
import { groupCounts, participants } from "@/lib/cohort";
import { seedGroupExams } from "@/lib/group-exams";
import { groupReadiness, nearestActiveExam, topicStandings, weakestTopic } from "@/lib/overview";
import { profileStatus, profiles } from "@/lib/students";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const exams = seedGroupExams(now);
const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const everyone = profiles(people, { "ana@example.com": null });
const titleOf = (id: string) => `Topic ${id}`;
const isNeeds = (p: (typeof everyone)[number]) => profileStatus(p) === "needs";

const render = (list = everyone, { allExams = exams, drafts = [] as DraftSet[] } = {}) => {
  const exam = nearestActiveExam(allExams, now);
  return renderToStaticMarkup(
    <InstructorOverviewView
      name="Ira"
      list={list}
      actions={actionRows({
        list,
        exams: allExams,
        attempts: [],
        people,
        drafts,
        reminded: new Set(),
        now,
      })}
      exam={exam}
      counts={exam ? groupCounts(people, exam, { attempts: [], active: true }) : null}
      weakest={weakestTopic(list)}
      topicTitle={titleOf}
    />,
  );
};

const visible = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("the Overview screen", () => {
  const html = render(everyone, { drafts: [{ id: "cdemo", title: "Evacuation routes" }] });

  it("greets by name next to the avatar, with no header band and no tiles", () => {
    expect(html).toContain(">Hi, Ira</h1>");
    expect(html).not.toContain("data-page-header-band");
    expect(html.indexOf("data-avatar")).toBeLessThan(html.indexOf(">Hi, Ira</h1>"));
    for (const gone of ["data-tile", "grid grid-cols-2", ">Certified<", ">Not started<"]) {
      expect(html).not.toContain(gone);
    }
  });

  it("has exactly one percentage, the line with not started and the delta line without a percent sign", () => {
    expect(html).toContain(`Group readiness ${groupReadiness(everyone)}%`);
    expect(visible(html).match(/%/g)).toHaveLength(1);
    expect(html).toContain("Group A · 15 students · 2 not started");
    expect(html).toMatch(/data-delta[^>]*>\+\d+ points? since last week</);
  });

  it("has NEEDS YOUR ACTION with 72px rows, an icon circle and a chevron each, in order", () => {
    expect(html).toContain("NEEDS YOUR ACTION");
    const rows = html.match(/data-action="[a-z-]+"/g)!;
    expect(rows.length).toBeLessThanOrEqual(3);
    expect(rows[0]).toBe('data-action="needs-attention"');
    expect(rows[1]).toBe('data-action="draft-set"');
    expect(html.match(/h-\[72px\]/g)).toHaveLength(rows.length);
    const section = html.slice(html.indexOf("NEEDS YOUR ACTION"), html.indexOf("EXAMS"));
    expect(section.match(/lucide-chevron-right/g)).toHaveLength(rows.length);
    expect(section).toContain("students need attention");
    expect(section).toContain("1 imported set is not published");
    expect(section).toContain("Evacuation routes");
    expect(visible(section)).not.toContain("%");
  });

  it("shows the exam card with the not started count and a Secondary Assign exam, no Primary", () => {
    expect(html).toContain("data-exam-card=");
    expect(html).toContain("h-[88px]");
    expect(visible(html)).toMatch(/Passed \d+ of 15 · \d+ not started/);
    expect(html).not.toContain("h-[52px] bg-primary");
    expect(html).toMatch(/bg-olive-tint[^>]*>Assign exam</);
  });

  it("shows the weakest topic as an 80px data card without a chevron, then the Secondary and the inline link", () => {
    const weak = weakestTopic(everyone)!;
    const section = html.slice(html.indexOf("WEAKEST TOPIC"), html.indexOf("data-demo-note"));
    expect(section).toContain(`data-weakest-topic="${weak.sectionId}"`);
    expect(section).toContain(`Topic ${weak.sectionId}`);
    expect(section).toContain(
      `${weak.passing} of ${weak.total} students at or above the pass mark`,
    );
    const card = section.slice(0, section.indexOf("Assign exam on this topic"));
    expect(card).not.toContain("lucide-chevron-right");
    expect(card).toContain("h-[var(--list-card-height,80px)]");
    expect(section).toContain(
      `href="/instructor/exams/new?topic=${weak.sectionId}&amp;from=overview"`,
    );
    expect(section).toMatch(/bg-olive-tint[^>]*>Assign exam on this topic</);
    expect(section).toContain('href="/instructor/topics"');
    expect(section).toMatch(/underline[\s\S]*All topics/);
  });

  it("hides the weakest topic without data", () => {
    const empty = render([]);
    expect(empty).not.toContain("WEAKEST TOPIC");
    expect(empty).not.toContain("data-delta");
  });

  it("says All caught up (success tile, no chevron) when no rule applies", () => {
    const calm = render(everyone.filter((p) => !isNeeds(p)));
    expect(calm).toContain("data-all-caught-up");
    expect(calm).toContain("All caught up");
    expect(calm).toContain("bg-status-success-bg");
    expect(calm).not.toContain("data-action=");
  });

  it("shows the empty exam card with the one Primary when no exam is active", () => {
    const empty = render(everyone, { allExams: [] });
    expect(empty).toContain("No active exam");
    expect(empty).toMatch(/bg-primary[^>]*>Assign exam</);
    expect(empty.match(/>Assign exam</g)).toHaveLength(1);
    expect(empty).toContain('data-action="no-exam"');
  });

  it("ends with the demo note and has no hard-coded colours or external URLs", () => {
    expect(html).toContain("Demo group. Student data on this screen is simulated.");
    const code = readFileSync("components/InstructorOverview/InstructorOverviewView.tsx", "utf8");
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(code).not.toMatch(/https?:\/\//);
  });

  it("keeps all ten topics on the Topics screen order", () => {
    expect(topicStandings(everyone)).toHaveLength(10);
  });
});
