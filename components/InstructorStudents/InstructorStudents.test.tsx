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

const list = (
  filter: "all" | "needs" | "certified" = "all",
  shown = sortProfiles(all),
  topic: string | null = null,
  origin: "overview" | "topics" | null = null,
  showing: string | null = null,
) =>
  renderToStaticMarkup(
    <StudentsListView
      shown={shown}
      count={15}
      notStarted={2}
      filter={filter}
      topic={topic}
      origin={origin}
      showing={showing}
      onFilter={() => undefined}
      onClear={() => undefined}
    />,
  );

describe("the Students list", () => {
  const html = list();

  it("has the band with the group line, the Primary Invite students, the selector and 72px rows", () => {
    expect(html).toContain("data-page-header-band");
    expect(html).toContain(">Students</h1>");
    expect(html).toContain("Group A · 15 students · 2 not started");
    expect(html).toContain('href="/instructor/students/invite"');
    expect(html.indexOf("Invite students")).toBeLessThan(html.indexOf("students-filter"));
    expect(html).toMatch(/bg-primary[^>]*>Invite students/);
    for (const label of ["All", "Attention", "Certified"]) expect(html).toContain(`>${label}<`);
    expect(html.match(/data-student=/g)).toHaveLength(15);
    expect(html.match(/h-\[72px\]/g)).toHaveLength(15);
    expect(visible(html)).not.toContain("%");
    expect(html).toContain("Demo group. Student data on this screen is simulated.");
  });

  it("puts the status in the second line with its icon, only a chevron on the right, and no field of work", () => {
    expect(html.match(/data-student-line/g)).toHaveLength(15);
    expect(html.match(/data-status-text=/g)).toHaveLength(15);
    expect(html.match(/lucide-chevron-right/g)).toHaveLength(15);
    expect(html).toMatch(/data-status-text="(ready|almost|needs|not-started)"[^>]*><svg/);
    expect(html).toContain("Your demo account · ");
    expect(html).toContain("to review");
    expect(html).not.toContain("topics to review");
    expect(html).not.toMatch(/Rescue services|Paramedic|Military|Civil protection/);
    expect(html).not.toContain("w-[84px]");
    expect(list("needs")).toContain("?from=students&amp;filter=needs");
  });

  it("has the avatar at the top right of the band, and no Back without a filter origin", () => {
    expect(html).toContain("data-avatar");
    expect(html).not.toContain("Back to Overview");
    expect(html).not.toContain("Clear filter");
    expect(html).not.toContain("data-showing");
  });

  it("with a filter from a tile or Topics: the label, a Secondary Clear filter and Back to where it came from", () => {
    const topicList = list(
      "all",
      all.slice(0, 2),
      "S3",
      "topics",
      "Below pass mark in S3 · Moving through smoke",
    );
    expect(topicList).toContain("Below pass mark in S3 · Moving through smoke");
    expect(topicList).toContain("Back to Topics");
    expect(topicList).toContain('href="/instructor/topics"');
    expect(topicList).toContain("topic=S3");
    expect(topicList).toContain("origin=topics");
    const clear = topicList.slice(0, topicList.indexOf(">Clear filter<"));
    expect(clear.slice(clear.lastIndexOf("<button"))).toContain("bg-olive-tint");
    expect(topicList.indexOf("students-filter")).toBeLessThan(topicList.indexOf("Clear filter"));
    const tile = list("needs", all.slice(0, 1), null, "overview", "Showing: Needs attention");
    expect(tile).toContain("Showing: Needs attention");
    expect(tile).toContain("Back to Overview");
  });

  it("shows 'No students match this filter.' with a Secondary Clear filter when empty", () => {
    const empty = list("certified", []);
    expect(empty).toContain("No students match this filter.");
    const before = empty.slice(0, empty.indexOf(">Clear filter<"));
    expect(before.slice(before.lastIndexOf("<button"))).toContain("bg-olive-tint");
    expect(empty).not.toContain("data-student=");
    // with a filter label the one Clear filter is the label's
    const labelled = list("needs", [], null, "overview", "Showing: Needs attention");
    expect(labelled.match(/>Clear filter</g)).toHaveLength(1);
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
        reminder="Your instructor says: keep it up."
        onSendReminder={() => undefined}
        dialogInline
      />,
    );

  it("has the band with Back and the name, and ONE percentage: the readiness", () => {
    const html = render();
    expect(html).toContain('aria-label="Back to students"');
    expect(html).toContain(`>${person.name}</h1>`);
    // the field of work is the muted line under the name
    expect(html).toContain("data-field-line");
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

  it("has the Secondary Send reminder at the bottom, then the demo note, and no other button", () => {
    const html = render();
    expect(html.match(/<button/g)).toHaveLength(1);
    const button = html.slice(html.indexOf("<button"), html.indexOf("</button>"));
    expect(button).toContain("bg-olive-tint");
    expect(button).toContain("Send reminder");
    expect(html.indexOf("Send reminder")).toBeGreaterThan(html.indexOf(">Exams<"));
    expect(html.indexOf("Demo group.")).toBeGreaterThan(html.indexOf("Send reminder"));
  });

  it("has a 'Student not found' screen with a Secondary Back to students", () => {
    const html = renderToStaticMarkup(<StudentNotFound />);
    expect(html).toContain("Student not found");
    const link = html.slice(html.lastIndexOf("<a "));
    expect(link).toContain('href="/instructor/students"');
    expect(link).toContain("bg-olive-tint");
  });
});
