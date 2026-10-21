import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { AssignedExamCard } from "@/components/AssignedExamCard/AssignedExamCard";
import { AssignExamView } from "@/components/InstructorExams/AssignExamView";
import { ExamDetailView, ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { ExamCard } from "@/components/InstructorExams/ExamCard";
import { ExamQuestionView } from "@/components/InstructorExams/ExamQuestionView";
import { ExtendDeadlineView } from "@/components/InstructorExams/ExtendDeadlineView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { InstructorExamsView } from "@/components/InstructorExams/InstructorExamsView";
import { groupCounts, participants, studentRows } from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import { hardestQuestions } from "@/lib/exam-detail";
import { examQuestionIds } from "@/lib/exam-pool";
import { seedGroupExams } from "@/lib/group-exams";
import { examPeople, examsInScope } from "@/lib/groups";
import { loadAllSections } from "@/lib/guide";
import { findItem } from "@/lib/items";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const allExams = seedGroupExams(now);
const exams = examsInScope(allExams, "rescue-team");
const everyone = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const titleOf = (id: string) => `Topic ${id}`;
const visible = (html: string) => html.replace(/<[^>]+>/g, " ");

const wrap = (node: React.ReactNode) =>
  renderToStaticMarkup(<ActionBarProvider>{node}</ActionBarProvider>).replace(/<!-- -->/g, "");

describe("the exam card", () => {
  const exam = exams[0];
  const active = renderToStaticMarkup(
    <ExamCard exam={exam} passed={1} total={14} notStarted={11} now={now} />,
  ).replace(/<!-- -->/g, "");

  it("is 88px: the 56 by 56 picture, a one-line title, the soft due pill, the results line, a chevron", () => {
    expect(active).toContain("h-[88px]");
    expect(active).toContain("/heroes/exam-card.webp");
    expect(active).toContain('width="56"');
    expect(active).toContain(">Due 30 Oct · 4 topics<");
    expect(active).toContain('data-due-pill="neutral"');
    expect(active).toContain("Passed 1 of 14 · 11 not started");
    expect(active).toContain("lucide-chevron-right");
    expect(active).toContain(`href="/instructor/exams/${exam.id}"`);
    expect(active).not.toContain("%");
  });

  it("makes the pill amber within 3 days: 'Due in 2 days · 1 topic'", () => {
    const soon = renderToStaticMarkup(
      <ExamCard
        exam={{ ...exam, deadline: "2026-10-26", topicIds: ["S1"] }}
        passed={1}
        total={14}
        notStarted={11}
        now={now}
      />,
    ).replace(/<!-- -->/g, "");
    expect(soon).toContain("Due in 2 days · 1 topic");
    expect(soon).toContain('data-due-pill="amber"');
    expect(soon).toContain("bg-status-attention-bg");
  });

  it("is a fixed 104px with the group name under the title when there are several groups", () => {
    const several = renderToStaticMarkup(
      <ExamCard exam={exam} passed={1} total={14} now={now} groupName="Rescue team" />,
    );
    expect(several).toContain("h-[104px]");
    expect(several).toContain("data-group-name");
    expect(several.indexOf(exam.title)).toBeLessThan(several.indexOf("data-group-name"));
  });

  it("shows the neutral checklist tile, 'Closed 12 Oct' and 'Passed 12 of 14' when closed", () => {
    const closed = renderToStaticMarkup(
      <ExamCard
        exam={{ ...exam, deadline: "2026-10-12" }}
        passed={12}
        total={14}
        now={now}
        closed
      />,
    ).replace(/<!-- -->/g, "");
    expect(closed).toContain("Closed 12 Oct");
    expect(closed).toContain("Passed 12 of 14");
    expect(closed).not.toContain("not started");
    expect(closed).not.toContain("/heroes/exam-card.webp");
    expect(closed).toContain("lucide-list-checks");
    expect(closed).toContain("bg-neutral-tile-bg");
  });
});

describe("the Exams list", () => {
  const render = (list = allExams, open = false) =>
    wrap(
      <InstructorExamsView
        exams={list}
        people={everyone}
        attempts={[]}
        now={now}
        initiallyOpen={open}
      />,
    );

  it("has the band with the avatar only (no group switcher), the Primary Assign exam with a plus icon, ACTIVE with its count, the toggle and the note", () => {
    const html = render();
    const order = [
      "data-page-header-band",
      ">Assign exam<",
      ">ACTIVE<",
      "2 Active",
      `data-exam-card="${allExams[0].id}"`,
      "Show closed exams (1)",
      "Demo group. Student data on this screen is simulated.",
    ].map((t) => html.indexOf(t));
    expect(order.every((p) => p >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).not.toContain("data-group-pill");
    expect(html).toContain("data-avatar");
    const assign = html.slice(0, html.indexOf(">Assign exam<"));
    const link = assign.slice(assign.lastIndexOf("<a "));
    expect(link).toContain("bg-primary");
    expect(link).toContain("lucide-circle-plus");
    expect(visible(html)).not.toMatch(/%/);
  });

  it("lists the exams of all groups, each card with its group name and a fixed 104px", () => {
    const html = render();
    expect(html.match(/h-\[104px\]/g)).toHaveLength(3);
    expect(html).toContain("Rescue team");
    expect(html).toContain("Military training");
  });

  it("keeps the closed exams in an inert, collapsed group with ONE Secondary toggle before it", () => {
    const html = render();
    const toggle = html.indexOf("Show closed exams");
    expect(toggle).toBeLessThan(html.indexOf('id="closed-exams"'));
    const button = html.slice(html.lastIndexOf("<button", toggle), toggle);
    expect(button).toContain("bg-olive-tint");
    expect(html.slice(html.indexOf('id="closed-exams"'))).toContain("inert");
    expect(html).toContain("invisible grid-rows-[0fr]");
    expect(html.match(/aria-controls="closed-exams"/g)).toHaveLength(1);
    expect(html).toContain('aria-expanded="false"');
    const open = render(allExams, true);
    expect(open).toContain("Hide closed exams");
    expect(open).toContain(">CLOSED<");
  });

  it("shows the empty card: the picture, the words, ONE Primary inside it, the note; not repeated above", () => {
    const html = render([]);
    expect(html).toContain("data-exams-empty");
    expect(html).toContain("No exams yet");
    expect(html).toContain("Assign the first exam to your group.");
    expect(html).toContain("Exams check how well your group knows the topics you choose.");
    expect(html).toContain("/heroes/exam-card.webp");
    expect(html.match(/>Assign exam</g)).toHaveLength(1);
    expect(html.indexOf("data-exams-empty")).toBeLessThan(html.indexOf(">Assign exam<"));
    expect(html).not.toContain("Standard scenario templates");
    expect(html).not.toContain(">ACTIVE<");
  });
});

describe("Assign exam", () => {
  const render = (initial = {}, groups = ["rescue-team"]) =>
    wrap(
      <AssignExamView
        titleOf={titleOf}
        groupCounts={{ "rescue-team": 15, "military-training": 12 }}
        initialGroups={groups}
        now={now}
        onAssign={() => undefined}
        onCancel={() => undefined}
        initial={initial}
        dialogInline
      />,
    );

  it("has the specs card, then TITLE, TOPICS, DEADLINE, ATTEMPTS and AUDIENCE, each its own white card", () => {
    const html = render();
    const order = [
      "data-specs-card",
      ">TITLE<",
      ">TOPICS<",
      ">DEADLINE<",
      ">ATTEMPTS<",
      ">AUDIENCE<",
    ].map((t) => html.indexOf(t));
    expect(order.every((p) => p >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(
      html.match(/rounded-card border border-selectable-stroke bg-card/g)!.length,
    ).toBeGreaterThanOrEqual(5);
    expect(html).toContain(">20 questions<");
    expect(html).toContain("20 minutes · pass mark 80");
    expect(html).not.toContain("lucide-info");
    expect(html).not.toContain('data-avatar="true"');
  });

  it("lists all ten topics with their S code and name, with selection circles and Select all", () => {
    const html = render();
    expect(html.match(/name="topics"/g)).toHaveLength(10);
    for (const n of [1, 5, 10]) expect(html).toContain(`S${n} Topic S${n}`);
    expect(html).toContain("Select all");
    expect(html).toContain('type="checkbox"');
    expect(html.slice(html.indexOf(">TOPICS<"), html.indexOf(">DEADLINE<"))).toContain(
      "rounded-full border",
    );
    expect(html.match(/h-16 px-/g)!.length).toBeGreaterThanOrEqual(10);
  });

  it("has the deadline as a 2 by 2 grid, the attempts as three segments (3 chosen), and the audience rows with counts", () => {
    const html = render();
    expect(html).toContain("grid-cols-2");
    for (const label of ["In 3 days", "In 1 week", "In 2 weeks", "Pick a date"])
      expect(html).toContain(label);
    expect(html).not.toContain('type="date"');
    for (const label of ["1 attempt", "3 attempts", "Unlimited"])
      expect(html).toContain(`>${label}<`);
    expect(html).toMatch(/checked=""[^>]*value="3"/);
    expect(html.match(/name="audience"/g)).toHaveLength(2);
    expect(html).toContain("15 students");
    expect(html).toContain("12 students");
    expect(html.slice(html.indexOf(">AUDIENCE<")).match(/checked/g)).toHaveLength(1);
  });

  it("fills the title from the topics and shows the date field only for Pick a date", () => {
    const filled = render({ topics: ["S1", "S2"], preset: "date" });
    expect(filled).toContain('value="Exam: Topic S1, Topic S2"');
    expect(filled).toContain('type="date"');
    expect(render({ topics: ["S1"] })).toContain('value="Exam: Topic S1"');
    expect(render({ attempts: null })).toMatch(/checked=""[^>]*value="unlimited"/);
  });
});

describe("Extend deadline", () => {
  const html = wrap(
    <ExtendDeadlineView
      exam={exams[0]}
      now={now}
      onExtend={() => undefined}
      onCancel={() => undefined}
    />,
  );
  it("has Back, the three choices, the note, and no percentage", () => {
    expect(html).toContain('aria-label="Back to exam"');
    for (const label of ["+3 days", "+1 week", "Pick a date"]) expect(html).toContain(label);
    expect(html).toContain("Students will be notified.");
    expect(html).toContain("New deadline 2 Nov");
    expect(visible(html)).not.toContain("%");
  });
});

describe("the Exam detail", () => {
  const render = (
    exam = exams[0],
    active = true,
    attempts: Attempt[] = [],
    dialog: "remind" | "close" | null = null,
  ) => {
    const group = examPeople(everyone, exam);
    const context = { attempts, now };
    return wrap(
      <ExamDetailView
        exam={exam}
        active={active}
        now={now}
        counts={groupCounts(group, exam, context)}
        rows={studentRows(group, exam, context)}
        hardest={hardestQuestions(group, exam, attempts, now)}
        titleOf={titleOf}
        message=""
        dialog={dialog}
        onAskRemind={() => undefined}
        onRemind={() => undefined}
        onAskClose={() => undefined}
        onClose={() => undefined}
        onCancelDialog={() => undefined}
        dialogInline
      />,
    );
  };

  it("Active: Back, the title, the pill, TOPIC MODULE, a group pill, the rules line, 'n of 15 tried' and four count tiles", () => {
    const html = render();
    expect(html).toContain('aria-label="Back to Exams"');
    expect(html).toContain(`>${exams[0].title}</h1>`);
    expect(html).toContain("Active · Due 30 Oct");
    expect(html).toContain("TOPIC MODULE");
    expect(html).toMatch(/data-group-pills[\s\S]*Rescue team/);
    expect(html).toContain("3 attempts allowed · 20 questions · 20 minutes · Pass mark 80");
    expect(html).toMatch(/data-tried[^>]*>\d+ of 15 tried</);
    expect(html.match(/data-count=/g)).toHaveLength(4);
    for (const label of ["Passed", "Not passed", "In progress", "Not started"])
      expect(html).toContain(`>${label}<`);
    expect(html).not.toContain('data-avatar="true"');
    expect(visible(html)).not.toContain("%");
  });

  it("Closed: the pill with 'Final results' and a lock, the group, the large title, the specs box and Passed, Not passed, Missed", () => {
    const html = render(exams[1], false);
    expect(html).toContain("Closed 18 Oct");
    expect(html).toContain("Final results");
    expect(html).toContain("lucide-lock");
    expect(html).toContain("data-group-label");
    expect(html).toContain("RESCUE TEAM");
    expect(html).toContain("data-exam-title");
    expect(html).toContain("14 questions · 20 min");
    expect(html).toContain("Pass mark 80");
    expect(html).toContain("Max 1 attempts".replace("attempts", "attempts"));
    expect(html).toContain("15 assigned");
    expect(html.match(/data-count=/g)).toHaveLength(3);
    for (const label of ["Passed", "Not passed", "Missed"]) expect(html).toContain(`>${label}<`);
    expect(html).toContain("bg-status-success-bg");
    expect(html).toContain("bg-status-attention-bg");
    expect(visible(html)).not.toContain("%");
  });

  it("has the STUDENTS roster: one card, hairline rows of 72px, an avatar badge, a status pill, a muted line and a chevron; Not passed first, Passed last", () => {
    const html = render();
    expect(html).toContain(">STUDENTS<");
    expect(html).toContain("15 students");
    expect(html.match(/data-student-row=/g)).toHaveLength(15);
    expect(html.match(/h-\[72px\]/g)).toHaveLength(15);
    expect(html.match(/data-avatar-badge=/g)).toHaveLength(15);
    expect(html.match(/data-status-pill=/g)).toHaveLength(15);
    expect(html).toContain("divide-y divide-soft-divider");
    expect(html).toContain(`?from=exam&amp;exam=${exams[0].id}`);
    expect(html).toContain("Your demo account · No attempts yet");
    const kinds = [...html.matchAll(/data-student-row="[^"]+" data-status="([a-z-]+)"/g)].map(
      (m) => m[1],
    );
    const rank = {
      "not-passed": 0,
      "in-progress": 1,
      "not-started": 2,
      missed: 2,
      passed: 3,
    } as Record<string, number>;
    expect(kinds.map((k) => rank[k])).toEqual([...kinds.map((k) => rank[k])].sort((a, b) => a - b));
  });

  it("shows a status badge per status: check, retry arrow, clock, circle (Active) and dash (Missed)", () => {
    const active = render();
    for (const icon of ["lucide-check", "lucide-rotate-ccw", "lucide-clock", "lucide-circle"]) {
      expect(active).toContain(icon);
    }
    expect(render(exams[1], false)).toContain("lucide-minus");
  });

  it("shows a certificate badge next to Passed when the attempt has a certificate", () => {
    const attempts: Attempt[] = [
      {
        examId: exams[0].id,
        studentId: "ana@example.com",
        startedAt: now - 1,
        finishedAt: now,
        correct: 18,
        total: 20,
        answers: {},
        certificateId: "QT-2026-0001",
      },
    ];
    expect(render(exams[0], true, attempts)).toContain("data-certificate-badge");
    expect(render()).not.toContain("data-certificate-badge");
  });

  it("shows HARDEST QUESTIONS (up to three, 'Flagged for debrief') only with at least three finished attempts", () => {
    const closedExam = exams[1];
    const html = render(closedExam, false);
    expect(html).toContain("HARDEST QUESTIONS");
    expect(html).toContain("Flagged for debrief");
    const cards = html.match(/data-hard-question="\d+"/g)!;
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(3);
    expect(html).toMatch(/>Q\d+</);
    expect(html).toMatch(/\d+ of \d+ answered wrong/);
    expect(html).toContain(`href="/instructor/exams/${closedExam.id}/questions/`);
    // none when nobody has finished enough attempts
    const bare = { ...exams[0], id: "no-results", deadline: "2030-01-01" };
    const group = examPeople(everyone, bare).filter((p) => p.local);
    expect(hardestQuestions(group, bare, [], now)).toEqual([]);
  });

  it("Active actions are four stacked Secondary buttons with icons; the dialogs have a Primary and a Secondary", () => {
    const html = render();
    for (const label of ["Send reminder", "Extend deadline", "Duplicate exam", "Close exam now"]) {
      const before = html.slice(0, html.indexOf(`>${label}<`));
      const control = before.slice(
        Math.max(before.lastIndexOf("<button"), before.lastIndexOf("<a ")),
      );
      expect(control, label).toContain("bg-olive-tint");
      expect(control, label).toMatch(/lucide-/);
    }
    expect(html).toContain(`href="/instructor/exams/${exams[0].id}/extend"`);
    expect(html).toContain(`href="/instructor/exams/new?duplicate=${exams[0].id}"`);
    const remind = render(exams[0], true, [], "remind");
    expect(remind).toMatch(/Remind \d+ students\?/);
    expect(remind).toContain("data-reminder-preview");
    expect(remind).toContain(">Send reminder<");
    expect(remind).toContain(">Cancel<");
    const close = render(exams[0], true, [], "close");
    expect(close).toContain("Close this exam now?");
    expect(close).toContain("Students will no longer be able to start it. Results stay available.");
    expect(close).toContain(">Close exam<");
    expect(close).toContain(">Keep open<");
  });

  it("Closed has only Duplicate exam with its note, and no Close, Extend or Send reminder", () => {
    const html = render(exams[1], false);
    expect(html).toContain(">Duplicate exam<");
    expect(html).toContain("Opens Assign exam with the same topics and settings.");
    for (const gone of ["Send reminder", "Extend deadline", "Close exam now"]) {
      expect(html).not.toContain(`>${gone}<`);
    }
  });

  it("is the 'Exam not found' screen with a Secondary button back to Exams", () => {
    const html = renderToStaticMarkup(<ExamNotFound />);
    expect(html).toContain("Exam not found");
    const link = html.slice(html.lastIndexOf("<a "));
    expect(link).toContain('href="/instructor/exams"');
    expect(link).toContain("bg-olive-tint");
  });
});

describe("the read-only exam question", () => {
  const id = examQuestionIds(exams[0])[3];
  const html = renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ExamQuestionView
        item={findItem(id)!}
        number={4}
        stats={{ wrong: 9, answered: 14 }}
        examId={exams[0].id}
      />
    </SourceSheetProvider>,
  ).replace(/<!-- -->/g, "");
  it("has Back, the question, the options, Why and the guide chip; no bookmark and no editing", () => {
    expect(html).toContain('aria-label="Back to exam"');
    expect(html).toContain("Question 4");
    expect(html).toContain("9 of 14 answered wrong");
    expect(html).toContain(
      findItem(id)!.question.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").slice(0, 20),
    );
    expect(html).toContain(">Why<");
    expect(html).not.toContain("Save question");
    expect(html).not.toMatch(/<input/);
    expect(html).not.toMatch(/Edit/);
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
