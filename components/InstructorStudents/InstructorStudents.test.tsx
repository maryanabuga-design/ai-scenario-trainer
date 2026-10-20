import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  StudentDetailView,
  StudentNotFound,
} from "@/components/InstructorStudents/StudentDetailView";
import { StudentsListView } from "@/components/InstructorStudents/StudentsListView";
import { participants } from "@/lib/cohort";
import { seedGroupExams } from "@/lib/group-exams";
import { examRowsFor, profiles, sortProfiles } from "@/lib/students";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const exams = seedGroupExams(now);
const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const all = profiles(people, { "ana@example.com": null });
const titleOf = (id: string) => `Topic ${id}`;

/** The text a person reads (no tags, no attributes). */
const visible = (html: string) => html.replace(/<[^>]+>/g, " ");

const list = (filter: "all" | "needs" | "certified" = "all", shown = sortProfiles(all)) =>
  renderToStaticMarkup(
    <StudentsListView shown={shown} count={15} filter={filter} onFilter={() => undefined} />,
  );

describe("the Students list", () => {
  const html = list();

  it("has the band with the group line, the three-option selector and 72px rows", () => {
    expect(html).toContain("data-page-header-band");
    expect(html).toContain(">Students</h1>");
    expect(html).toContain("Group A · 15 students");
    for (const label of ["All", "Needs attention", "Certified"])
      expect(html).toContain(`>${label}<`);
    expect(html.match(/data-student=/g)).toHaveLength(15);
    expect(html.match(/h-\[72px\]/g)).toHaveLength(15);
    expect(visible(html)).not.toContain("%");
    expect(html).toContain("Your demo account");
    expect(html).toContain("Demo group. Student data on this screen is simulated.");
  });

  it("has the status as an icon plus text and a chevron on every row, linking with the filter", () => {
    expect(html.match(/data-status-text=/g)).toHaveLength(15);
    expect(html.match(/lucide-chevron-right/g)).toHaveLength(15);
    expect(html).toMatch(/data-status-text="(ready|almost|needs)"[^>]*><svg/);
    expect(list("needs")).toContain("?from=students&amp;filter=needs");
    expect(html).toContain("Needs attention");
  });

  it("shows 'No students match this filter.' with a Secondary Show all when empty", () => {
    const empty = list("certified", []);
    expect(empty).toContain("No students match this filter.");
    const before = empty.slice(0, empty.indexOf(">Show all<"));
    expect(before.slice(before.lastIndexOf("<button"))).toContain("bg-olive-tint");
    expect(empty).not.toContain("data-student=");
  });
});

describe("the Student detail", () => {
  const person = people[1];
  const profile = profiles([person], {})[0];
  const rows = examRowsFor(person, exams, [], now);
  const render = (certificate: (r: (typeof rows)[number]) => string | null = () => null) =>
    renderToStaticMarkup(
      <StudentDetailView
        profile={profile}
        backHref="/instructor/students"
        backLabel="Back to students"
        rows={rows}
        titleOf={titleOf}
        certificateHref={certificate}
      />,
    );

  it("has the band with Back and the name, and ONE percentage: the readiness", () => {
    const html = render();
    expect(html).toContain('aria-label="Back to students"');
    expect(html).toContain(`>${person.name}</h1>`);
    expect(html).toContain("Group A");
    const text = visible(html);
    expect(text.match(/Readiness \d+%/g)).toHaveLength(1);
    expect(text.match(/%/g)).toHaveLength(1);
    expect(html).toContain("Pass mark: 80");
  });

  it("lists S1 to S10 in order as 80px cards that are not tappable (no chevron), with Needs review", () => {
    const html = render();
    const ids = [...html.matchAll(/data-topic-row="(S\d+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(Array.from({ length: 10 }, (_, i) => `S${i + 1}`));
    expect(html.match(/h-\[var\(--list-card-height,80px\)\]/g)).toHaveLength(10);
    const topics = html.slice(html.indexOf("By topic"), html.indexOf(">Exams<"));
    expect(topics).not.toContain("lucide-chevron-right");
    expect(topics).not.toMatch(/<a |<button/);
    for (const row of profile.topics) {
      expect(topics).toContain(`${row.correct} of ${row.total} correct`);
    }
    // every topic below the pass mark says so, in text with an icon
    const weak = profile.topics.filter((t) => Math.floor((t.correct * 100) / t.total) < 80).length;
    expect(topics.match(/data-needs-review/g)?.length ?? 0).toBe(weak);
  });

  it("lists the exams in rows of 72px with the status line, and links only a row with a certificate", () => {
    const plain = render();
    expect(plain.match(/data-exam-row=/g)).toHaveLength(exams.length);
    expect(plain.match(/h-\[72px\]/g)).toHaveLength(exams.length);
    const examsPart = plain.slice(plain.indexOf(">Exams<"));
    expect(examsPart).not.toContain("lucide-chevron-right");
    expect(examsPart).not.toMatch(/<a /);
    const linked = render((r) => `/instructor/students/x/certificate/${r.exam.id}`);
    expect(linked.slice(linked.indexOf(">Exams<")).match(/lucide-chevron-right/g)).toHaveLength(
      exams.length,
    );
  });

  it("is read-only: no button on the screen, and the demo note ends it", () => {
    const html = render();
    expect(html).not.toMatch(/<button/);
    expect(html.indexOf("Demo group.")).toBeGreaterThan(html.indexOf(">Exams<"));
  });

  it("has a 'Student not found' screen with a Secondary Back to students", () => {
    const html = renderToStaticMarkup(<StudentNotFound />);
    expect(html).toContain("Student not found");
    const link = html.slice(html.lastIndexOf("<a "));
    expect(link).toContain('href="/instructor/students"');
    expect(link).toContain("bg-olive-tint");
  });
});
