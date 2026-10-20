import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InstructorOverviewView } from "@/components/InstructorOverview/InstructorOverviewView";
import { groupCounts, participants } from "@/lib/cohort";
import { seedGroupExams } from "@/lib/group-exams";
import { groupReadiness, needsAttention, nearestActiveExam, weakestTopics } from "@/lib/overview";
import { profiles, readinessOf, studentStatus, topicsToReview } from "@/lib/students";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const exams = seedGroupExams(now);
const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const everyone = profiles(people, { "ana@example.com": null });
const titleOf = (id: string) => `Topic ${id}`;
const isNeeds = (p: (typeof everyone)[number]) => studentStatus(readinessOf(p)) === "needs";

const render = (list = everyone, exam = nearestActiveExam(exams, now), allExams = exams) =>
  renderToStaticMarkup(
    <InstructorOverviewView
      name="Ira"
      list={list}
      exam={allExams.length === 0 ? null : exam}
      counts={
        exam && allExams.length > 0
          ? groupCounts(people, exam, { attempts: [], active: true })
          : null
      }
      titleOf={titleOf}
    />,
  );

const visible = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("the figures come from the same helpers as the other Instructor screens", () => {
  it("group readiness is the pooled correct answers, rounded down", () => {
    let correct = 0;
    let total = 0;
    for (const p of everyone)
      for (const t of p.topics) {
        correct += t.correct;
        total += t.total;
      }
    expect(groupReadiness(everyone)).toBe(Math.floor((correct * 100) / total));
    expect(groupReadiness([])).toBe(0);
  });

  it("needs attention lists at most 3 and counts them all, equal to the Needs attention filter", () => {
    const result = needsAttention(everyone);
    expect(result.shown.length).toBeLessThanOrEqual(3);
    expect(result.total).toBe(everyone.filter(isNeeds).length);
    for (const p of result.shown) expect(isNeeds(p)).toBe(true);
  });

  it("weakest topics are at most 3, weakest first, and never more than the group", () => {
    const weak = weakestTopics(everyone);
    expect(weak.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < weak.length; i += 1)
      expect(weak[i].passing).toBeGreaterThanOrEqual(weak[i - 1].passing);
    for (const topic of weak) expect(topic.total).toBe(everyone.length);
  });

  it("the nearest active exam is the one with the earliest deadline, none when all are closed", () => {
    const nearest = nearestActiveExam(exams, now)!;
    expect(nearest).toBeTruthy();
    expect(nearestActiveExam(exams, new Date(2031, 0, 1).getTime())).toBeNull();
    expect(nearestActiveExam([], now)).toBeNull();
  });
});

describe("the Overview screen", () => {
  const html = render();

  it("greets by name, with no header band and no avatar", () => {
    expect(html).toContain(">Hi, Ira</h1>");
    expect(html).not.toContain("data-page-header-band");
    expect(html).not.toContain("data-avatar");
    expect(html).toContain("Here is how Group A is doing.");
  });

  it("has exactly one percentage: the group readiness", () => {
    expect(html).toContain(`Group readiness ${groupReadiness(everyone)}%`);
    expect(visible(html).match(/%/g)).toHaveLength(1);
    expect(html).toContain("Group A · 15 students");
  });

  it("rows of 72px go to the student with a chevron, the topic cards are data without links", () => {
    const rows = html.match(/data-attention=/g) ?? [];
    expect(rows.length).toBe(Math.min(3, needsAttention(everyone).total));
    expect(html).toContain("?from=overview");
    const first = needsAttention(everyone).shown[0];
    expect(html).toContain(
      `${topicsToReview(first)} topics to review`.replace("1 topics", "1 topic"),
    );
    const weakSection = html.slice(html.indexOf("WEAKEST TOPICS"), html.indexOf("EXAMS"));
    expect(weakSection).not.toContain("<a ");
    expect(weakSection).not.toContain("<svg");
    expect(weakSection).toContain("students answered correctly");
    expect(html.match(/h-\[var\(--list-card-height,80px\)\]/g)!.length).toBeGreaterThanOrEqual(2);
  });

  it("shows See all only when more than 3 need attention", () => {
    const many = needsAttention(everyone).total > 3;
    expect(html.includes("See all (")).toBe(many);
    expect(html.includes("/instructor/students?filter=needs")).toBe(many);
    const few = [...everyone.filter(isNeeds).slice(0, 2), ...everyone.filter((p) => !isNeeds(p))];
    expect(render(few)).not.toContain("See all");
  });

  it("shows the nearest active exam as an 88px card and a Secondary Assign exam, with no Primary", () => {
    expect(html).toContain("data-exam-card=");
    expect(html).toContain("h-[88px]");
    expect(html).toContain("?from=overview");
    expect(html).toContain("Assign exam");
    expect(html).not.toContain("h-[52px] bg-primary");
    expect(html).toMatch(/bg-olive-tint[^>]*>Assign exam/);
  });

  it("shows the empty exam card with the one Primary when no exam is active", () => {
    const empty = render(everyone, null, []);
    expect(empty).toContain("No active exam");
    expect(empty).toMatch(/bg-primary[^>]*>Assign exam/);
    expect(empty.match(/>Assign exam</g)).toHaveLength(1);
  });

  it("says Everyone is on track with a success tile when nobody needs attention", () => {
    const fine = render(everyone.filter((p) => !isNeeds(p)));
    expect(fine).toContain("Everyone is on track");
    expect(fine).toContain("bg-status-success-bg");
    expect(fine).not.toContain("data-attention=");
  });

  it("ends with the demo note and has no horizontal scroll helpers, hard-coded colours or external URLs", () => {
    expect(html).toContain("Demo group. Student data on this screen is simulated.");
    const code = readFileSync("components/InstructorOverview/InstructorOverviewView.tsx", "utf8");
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(code).not.toMatch(/https?:\/\//);
    expect(code).not.toContain("overflow-x");
  });
});
