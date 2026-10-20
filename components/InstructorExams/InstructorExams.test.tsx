import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { AssignedExamCard } from "@/components/AssignedExamCard/AssignedExamCard";
import { AssignExamView } from "@/components/InstructorExams/AssignExamView";
import { ExamDetailView, ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { ExamCard } from "@/components/InstructorExams/ExamCard";
import { InstructorExamsView } from "@/components/InstructorExams/InstructorExamsView";
import { groupCounts, participants, studentRows } from "@/lib/cohort";
import { seedGroupExams } from "@/lib/group-exams";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const exams = seedGroupExams(now);
const people = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const titleOf = (id: string) => `Topic ${id}`;

const wrap = (node: React.ReactNode) =>
  renderToStaticMarkup(<ActionBarProvider>{node}</ActionBarProvider>);

describe("the exam card", () => {
  const html = renderToStaticMarkup(<ExamCard exam={exams[0]} passed={4} total={15} />);

  it("is 88px with the 56 by 56 picture, three one-line texts and a chevron", () => {
    expect(html).toContain("h-[88px]");
    expect(html).toContain("/heroes/exam-card.webp");
    expect(html).toContain('width="56"');
    expect(html).toContain("Due 30 Oct · 4 topics");
    expect(html).toContain("Passed 4 of 15");
    expect(html.match(/truncate/g)!.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain("lucide-chevron-right");
    expect(html).toContain(`href="/instructor/exams/${exams[0].id}"`);
    expect(html).not.toContain("%");
  });
});

describe("the Exams list", () => {
  const render = (list = exams, open = false) =>
    wrap(
      <InstructorExamsView
        exams={list}
        people={people}
        attempts={[]}
        now={now}
        initiallyOpen={open}
      />,
    );

  it("has the band, the Primary Assign exam under it, ACTIVE, the closed toggle and the demo note", () => {
    const html = render();
    const order = [
      "data-page-header-band",
      ">Assign exam<",
      ">ACTIVE<",
      `data-exam-card="${exams[0].id}"`,
      "Show closed exams (1)",
      "Demo group. Student data on this screen is simulated.",
    ].map((t) => html.indexOf(t));
    expect(order.every((p) => p >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    const assign = html.slice(0, html.indexOf(">Assign exam<"));
    expect(assign.slice(assign.lastIndexOf("<a "))).toContain("bg-primary");
    expect(html).not.toMatch(/%/);
  });

  it("keeps the closed exams in an inert, collapsed group with ONE toggle after it", () => {
    const html = render();
    const group = html.indexOf('id="closed-exams"');
    expect(group).toBeLessThan(html.indexOf("Show closed exams"));
    expect(html.slice(group)).toContain("inert");
    expect(html).toContain("invisible grid-rows-[0fr]");
    expect(html.match(/aria-controls="closed-exams"/g)).toHaveLength(1);
    expect(html).toContain('aria-expanded="false"');
    const open = render(exams, true);
    expect(open).toContain("Hide closed exams");
    expect(open).toContain(">CLOSED<");
  });

  it("shows the empty state with the Primary button above it", () => {
    const html = render([]);
    expect(html).toContain("No exams yet. Assign the first exam to your group.");
    expect(html.indexOf(">Assign exam<")).toBeLessThan(html.indexOf("No exams yet"));
  });
});

describe("the Exam detail", () => {
  const exam = exams[0];
  const context = { attempts: [], active: true };
  const render = (confirming = false) =>
    renderToStaticMarkup(
      <ExamDetailView
        exam={exam}
        active
        counts={groupCounts(people, exam, context)}
        rows={studentRows(people, exam, context)}
        titleOf={titleOf}
        message=""
        confirmingClose={confirming}
        onRemind={() => undefined}
        onAskClose={() => undefined}
        onCancelClose={() => undefined}
        onClose={() => undefined}
        dialogInline
      />,
    );

  it("has Back to Exams, the title, the rules, three count tiles and 72px rows without a chevron", () => {
    const html = render();
    expect(html).toContain('aria-label="Back to Exams"');
    expect(html).toContain(
      ">20 questions · 20 minutes · pass mark 80<".replace(">20", ">" + exam.questionCount),
    );
    expect(html.match(/data-count=/g)).toHaveLength(3);
    expect(html).toContain("Certified");
    expect(html).toContain("Not passed");
    expect(html).toContain("Not started");
    expect(html.match(/data-student-row=/g)).toHaveLength(15);
    expect(html.match(/h-\[72px\]/g)).toHaveLength(15);
    expect(html.slice(html.indexOf("STUDENTS"))).not.toContain("lucide-chevron-right");
    expect(html).toContain("Your demo account");
    expect(html).not.toContain("%");
  });

  it("has Secondary Remind and Close exam while Active, and a dialog with Primary and Secondary", () => {
    const html = render();
    for (const label of ["Remind students who have not started", "Close exam now"]) {
      const before = html.slice(0, html.indexOf(`>${label}<`));
      expect(before.slice(before.lastIndexOf("<button")), label).toContain("bg-olive-tint");
    }
    const dialog = render(true);
    expect(dialog).toContain("Close this exam now?");
    expect(dialog).toContain(">Close exam<");
    expect(dialog).toContain(">Keep open<");
  });

  it("is the 'Exam not found' screen with a Secondary button back to Exams", () => {
    const html = renderToStaticMarkup(<ExamNotFound />);
    expect(html).toContain("Exam not found");
    const link = html.slice(html.lastIndexOf("<a "));
    expect(link).toContain('href="/instructor/exams"');
    expect(link).toContain("bg-olive-tint");
  });
});

describe("Assign exam", () => {
  const render = (initial = {}) =>
    wrap(
      <AssignExamView
        titleOf={titleOf}
        now={now}
        onAssign={() => undefined}
        onCancel={() => undefined}
        initial={initial}
        dialogInline
      />,
    );

  it("has the four sections in order, 10 topic rows of 64px and the info card", () => {
    const html = render();
    const order = ["TITLE", "TOPICS", "DEADLINE", "20 questions · 20 minutes · pass mark 80"].map(
      (t) => html.indexOf(t),
    );
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html.match(/name="topics"/g)).toHaveLength(10);
    expect(html.match(/h-16 px-/g)).toHaveLength(10);
    expect(html).toContain("Select all");
    for (const label of ["In 3 days", "In 1 week", "In 2 weeks", "Pick a date"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("Audience: all students in Group A");
    expect(html).not.toContain('type="date"');
  });

  it("fills the title from the topics and shows the date field only for Pick a date", () => {
    // (the pinned buttons are portalled; their disabled state is checked in the browser)
    const filled = render({ topics: ["S1", "S2"], preset: "date" });
    expect(filled).toContain('value="Exam: Topic S1, Topic S2"');
    expect(filled).toContain('type="date"');
    expect(render({ topics: ["S1"] })).toContain('value="Exam: Topic S1"');
  });
});

describe("the Assigned exam card on Student Home", () => {
  it("is 88px with the picture, the title, the due line and a chevron, opening the exam intro", () => {
    const html = renderToStaticMarkup(<AssignedExamCard exam={exams[0]} />);
    expect(html).toContain("h-[88px]");
    expect(html).toContain(`href="/exam?id=${exams[0].id}"`);
    expect(html).toContain("Due 30 Oct");
    expect(html).toContain("20 questions · 20 minutes");
    expect(html).toContain("lucide-chevron-right");
    expect(html).not.toContain("Start exam");
  });
});
