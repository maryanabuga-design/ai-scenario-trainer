import { readdirSync, readFileSync } from "node:fs";
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
import { createExam, seedGroupExams } from "@/lib/group-exams";
import { isDemoExam } from "@/lib/cohort";
import { examPeople, examsInScope } from "@/lib/groups";
import { loadAllSections } from "@/lib/guide";
import { findItem } from "@/lib/items";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const allExams = seedGroupExams(now);
const exams = examsInScope(allExams, "rescue-team");
const everyone = participants([{ name: "Ana Test", email: "ana@example.com" }]);
const titleOf = (id: string) => `Topic ${id}`;
const visible = (html: string) => html.replace(/<[^>]+>/g, " ");

const css = readFileSync("app/globals.css", "utf8");
const wrap = (node: React.ReactNode) =>
  renderToStaticMarkup(<ActionBarProvider>{node}</ActionBarProvider>).replace(/<!-- -->/g, "");

describe("the exam card", () => {
  const exam = exams[0];
  const counts = (passed: number, total = 14) => ({
    passed,
    notPassed: 0,
    inProgress: 0,
    notStarted: total - passed,
    missed: 0,
    total,
  });
  const card = (props: Partial<React.ComponentProps<typeof ExamCard>> = {}) =>
    renderToStaticMarkup(<ExamCard exam={exam} counts={counts(1)} {...props} />).replace(
      /<!-- -->/g,
      "",
    );
  const active = card();

  it("is 88px: the 48px icon tile, a one-line title, the neutral date pill, the results line, a chevron", () => {
    expect(active).toContain("h-[88px]");
    expect(active).toContain(">Due 30 Oct<");
    expect(active).toContain("data-date-pill");
    expect(active).toContain("Passed 1 of 14");
    // only the title, the date pill and ONE result line: no topics count, no not-started count, no group
    expect(active).not.toMatch(/topics?<|not started|data-group-name/);
    expect(active).toContain("lucide-chevron-right");
    expect(active).toContain(`href="/instructor/exams/${exam.id}"`);
    expect(active).not.toContain("%");
  });

  it("shows the one icon tile and no picture: 48x48, radius 14, #EFECE6, the Exams navigation icon at 24px, aria-hidden", () => {
    const tile = active.slice(active.indexOf('data-icon-tile="exam"') - 40);
    expect(tile).toContain('aria-hidden="true"');
    expect(tile).toContain("h-12 w-12");
    expect(tile).toContain("rounded-[14px]");
    expect(tile).toContain("bg-chip-neutral-bg text-text");
    expect(tile).toMatch(/lucide-clipboard-list[^>]*/);
    expect(tile).toContain("[&amp;_svg]:h-6 [&amp;_svg]:w-6");
    expect(active).not.toContain("<img");
    expect(active).not.toContain("/heroes/exam-card.webp");
    // the same icon as the Exams item of the bottom navigation
    expect(readFileSync("components/BottomNav/BottomNav.tsx", "utf8")).toContain(
      'label: "Exams", Icon: ClipboardList',
    );
  });

  it("gives every date pill ONE neutral style, with no amber 'due soon' variant at any distance", () => {
    expect(css).toMatch(/--chip-neutral-bg:\s*#efece6;/i);
    const styles = new Set<string>();
    for (const deadline of ["2026-10-24", "2026-10-26", "2026-10-28", "2027-02-01"]) {
      const html = card({ exam: { ...exam, deadline } });
      const pill = html.slice(html.indexOf("data-date-pill"));
      const cls = /class="([^"]*)"/.exec(pill)![1];
      styles.add(cls);
      expect(pill.slice(0, pill.indexOf("</span>"))).toMatch(/>Due \d{1,2} \w{3}$/);
      expect(html).not.toMatch(/amber|data-due-pill|bg-status-attention/);
    }
    expect(styles.size).toBe(1);
    const closed = card({ closed: true, exam: { ...exam, deadline: "2026-10-12" } });
    const closedClass = /data-date-pill[^>]*class="([^"]*)"/.exec(closed)![1];
    expect([closedClass]).toEqual([...styles]);
    expect(closedClass).toContain("bg-chip-neutral-bg");
    expect(closedClass).toContain("text-chip-neutral-ink");
    expect(closedClass).toContain("type-caption");
    expect(closedClass).toContain("px-2.5");
  });

  it("keeps the amber rule out of the code", () => {
    const sources = ["components/InstructorExams/ExamCard.tsx", "lib/exam-detail.ts"];
    for (const file of sources)
      expect(readFileSync(file, "utf8"), file).not.toMatch(/DUE_SOON|amber|duePill\(/);
  });

  it("is the very same card inside the Overview's EXAMS card: no chrome, but the icon tile, the neutral date pill and one result line", () => {
    const bare = card({ bare: true, from: "overview" });
    expect(bare).toContain('data-icon-tile="exam"');
    expect(bare).toContain("data-date-pill");
    expect(bare).toContain("Passed 1 of 14");
    expect(bare).not.toMatch(/not started|topics?<|<img|exam-card\.webp/);
    expect(bare).not.toContain("shadow-(--card-shadow)");
    expect(bare).toContain(`href="/instructor/exams/${exam.id}?from=overview"`);
    // the same markup as the list card, apart from the card chrome
    const strip = (html: string) =>
      html.replace(
        / rounded-card border border-selectable-stroke bg-card shadow-\(--card-shadow\)/,
        "",
      );
    const same = (html: string) => html.replace(/href="[^"]*"/, "").replace(/\s+"/g, '"');
    expect(same(strip(card()))).toBe(same(bare));
  });

  it("shows the same icon tile, 'Closed 12 Oct' and 'Passed 12 of 14' when closed", () => {
    const closed = card({
      closed: true,
      counts: counts(12),
      exam: { ...exam, deadline: "2026-10-12" },
    });
    expect(closed).toContain(">Closed 12 Oct<");
    expect(closed).toContain("Passed 12 of 14");
    expect(closed).not.toContain("not started");
    expect(closed).not.toContain("/heroes/exam-card.webp");
    expect(closed).toContain('data-icon-tile="exam"');
    expect(closed).toContain("lucide-clipboard-list");
    expect(closed).not.toContain("lucide-list-checks");
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

  it("has the band with the subtitle and the avatar (no group switcher), the Primary Assign exam with a plus icon, ACTIVE, the toggle and no demo line", () => {
    const html = render();
    const order = [
      "data-page-header-band",
      ">Assign exam<",
      ">ACTIVE<",
      `data-exam-card="${allExams[0].id}"`,
      "Show closed exams (1)",
    ].map((t) => html.indexOf(t));
    expect(order.every((p) => p >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).not.toContain("data-group-pill");
    expect(html).toContain("data-avatar");
    expect(html).toContain("Assign exams and see who has passed.");
    // no duplicate count at the right of the section header, no demo line
    expect(html).not.toMatch(/data-active-count|\d+ Active|>Archive</);
    expect(html).not.toContain("data-demo-note");
    expect(visible(html)).not.toContain("Demo group");
    const assign = html.slice(0, html.indexOf(">Assign exam<"));
    const link = assign.slice(assign.lastIndexOf("<a "));
    expect(link).toContain("bg-primary");
    expect(link).toContain("lucide-circle-plus");
    expect(visible(html)).not.toMatch(/%/);
  });

  it("lists the exams of all groups as calm 88px cards without a group name", () => {
    const html = render();
    expect(html.match(/h-\[88px\]/g)).toHaveLength(3);
    expect(html).not.toMatch(/h-\[104px\]|data-group-name/);
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

  it("has the muted subtitle and a white specs card like the other cards", () => {
    const html = render();
    expect(html).toContain("Choose the topics and give the exam a title.");
    expect(html).toMatch(/text-text-secondary">Choose the topics and give the exam a title\.</);
    const specs = html.slice(html.indexOf("data-specs-card"));
    const tag = specs.slice(0, specs.indexOf(">"));
    expect(tag).toContain("bg-card");
    expect(tag).toContain("border border-selectable-stroke");
    expect(tag).not.toContain("bg-secondary-sand");
  });

  it("has Select all as a tertiary action at the right of TOPICS (underlined, no fill, 44px), and Clear all when every topic is chosen", () => {
    const html = render();
    const topics = html.slice(
      html.indexOf(">TOPICS<"),
      html.indexOf("<fieldset", html.indexOf(">TOPICS<")),
    );
    expect(topics).toMatch(/Select all/);
    const before = topics.slice(0, topics.indexOf(">Select all<"));
    const button = before.slice(before.lastIndexOf("<button"));
    expect(button).not.toContain("bg-olive-tint");
    expect(button).not.toContain("bg-primary");
    expect(topics).toMatch(/underline[^>]*>Select all</);
    expect(button).toMatch(/min-h-11|h-11/);
    expect(topics).not.toContain(">Clear<");
    const all = render({ topics: Array.from({ length: 10 }, (_, i) => `S${i + 1}`) });
    expect(all).toContain(">Clear all<");
    expect(all).not.toContain(">Select all<");
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
    menuOpen = false,
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
        dialog={dialog}
        menuOpen={menuOpen}
        onAskRemind={() => undefined}
        onRemind={() => undefined}
        onAskClose={() => undefined}
        onClose={() => undefined}
        onCancelDialog={() => undefined}
        onExtend={() => undefined}
        onDuplicate={() => undefined}
        dialogInline
      />,
    );
  };

  it("Active: Back, the title, the pill, TOPICS, a group pill, the rules line, 'n of 15 tried' and four count tiles", () => {
    const html = render();
    expect(html).toContain('aria-label="Back to Exams"');
    expect(html).toContain(`>${exams[0].title}</h1>`);
    expect(html).toContain("Active · Due 30 Oct");
    expect(html).toContain(">TOPICS<");
    expect(html).not.toContain("TOPIC MODULE");
    expect(html).toMatch(/data-group-pills[\s\S]*Rescue team/);
    expect(html).toContain("3 attempts · 20 questions · 20 minutes · Pass mark 80%");
    expect(html).toMatch(/data-tried[^>]*>\d+ of 15 tried</);
    expect(html.match(/data-count=/g)).toHaveLength(4);
    for (const label of ["Passed", "Not passed", "In progress", "Not started"])
      expect(html).toContain(`>${label}<`);
    expect(html).not.toContain('data-avatar="true"');
    // the only percent sign is the pass mark
    expect(visible(html).match(/%/g)).toHaveLength(1);
    expect(html).not.toContain("data-no-results");
    expect(html).toContain("Results by student and the hardest questions.");
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
    expect(html).toContain("Pass mark 80%");
    expect(html).toContain("Max 1 attempts");
    expect(html).toContain("15 assigned");
    expect(html.match(/data-count=/g)).toHaveLength(3);
    for (const label of ["Passed", "Not passed", "Missed"]) expect(html).toContain(`>${label}<`);
    expect(html).toContain("bg-status-success-bg");
    expect(html).toContain("bg-status-attention-bg");
    expect(visible(html).match(/%/g)).toHaveLength(1);
  });

  it("has the STUDENTS roster: one card, hairline rows of at least 72px, a plain initials avatar, the name, the status chip with its description and a chevron; Not passed first, Passed last", () => {
    const html = render();
    expect(html).toContain(">STUDENTS<");
    expect(html).toContain("15 students");
    expect(html.match(/data-student-row=/g)).toHaveLength(15);
    expect(html.match(/min-h-\[72px\]/g)).toHaveLength(15);
    expect(html).not.toContain("data-avatar-badge");
    expect(html.match(/data-initials-avatar/g)).toHaveLength(15);
    expect(html.match(/data-status-chip=/g)).toHaveLength(15);
    expect(html).not.toContain("data-status-pill");
    // the same two-line layout as the Students list: the chip, then the wrapping description
    expect(html).toMatch(/data-row-status[^>]*class="[^"]*flex flex-wrap items-baseline gap-x-2/);
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

  it("shows each exam status as the same icon-free chip with its tone", () => {
    const active = render();
    for (const [kind, tone] of [
      ["passed", "positive"],
      ["not-passed", "attention"],
      ["in-progress", "neutral"],
      ["not-started", "neutral"],
    ]) {
      expect(active).toMatch(new RegExp(`data-status-chip="${kind}" data-tone="${tone}"`));
    }
    expect(render(exams[1], false)).toMatch(/data-status-chip="missed" data-tone="attention"/);
    const rows = active.slice(active.indexOf(">STUDENTS<"));
    expect(rows).not.toMatch(/data-status-chip="[^"]+"[^>]*><svg/);
    expect(rows).not.toMatch(/lucide-(rotate-ccw|circle|minus|clock)\b/);
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

  it("has the muted subtitle under the exam title", () => {
    for (const html of [render(), render(exams[1], false)]) {
      expect(html).toMatch(
        /<\/h1>[\s\S]*?text-text-secondary">Results by student and the hardest questions\.</,
      );
    }
  });

  it("has no stacked action buttons and no demo line: the actions live in the '...' menu", () => {
    for (const html of [render(), render(exams[1], false)]) {
      for (const label of ["Extend deadline", "Duplicate exam", "Close exam now"])
        expect(html, label).not.toContain(`>${label}<`);
      expect(html).not.toContain("data-demo-note");
      expect(html).not.toContain("Demo group");
      expect(html).not.toContain("data-message");
      expect(html).not.toContain("Opens Assign exam with the same topics and settings.");
    }
    // the band holds the menu button next to the back arrow
    const html = render();
    expect(html).toMatch(
      /data-page-header-band[\s\S]*aria-label="More actions"[\s\S]*aria-haspopup="menu"/,
    );
  });

  it("Active menu: Extend deadline, Duplicate exam, then Close exam now last, after a divider, in the destructive red", () => {
    const html = render(exams[0], true, [], null, true);
    const items = [...html.matchAll(/data-menu-item="([a-z]+)"/g)].map((m) => m[1]);
    expect(items).toEqual(["extend", "duplicate", "close"]);
    const close = html.slice(html.indexOf('data-menu-item="close"'));
    expect(close.slice(0, close.indexOf("</li>"))).toMatch(/border-t border-soft-divider/);
    expect(close.slice(0, close.indexOf("</li>"))).toContain("text-wrong-text");
    expect(
      html.slice(html.indexOf('data-menu-item="extend"'), html.indexOf('data-menu-item="close"')),
    ).not.toContain("text-wrong-text");
  });

  it("Closed menu has only Duplicate exam", () => {
    const html = render(exams[1], false, [], null, true);
    expect([...html.matchAll(/data-menu-item="([a-z]+)"/g)].map((m) => m[1])).toEqual([
      "duplicate",
    ]);
  });

  it("the dialogs have a Primary and a Secondary", () => {
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

describe("the one assign icon", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return files(path);
      return path.endsWith(".tsx") && !path.includes(".test.") ? [path] : [];
    });

  it("is the circled plus on every button that assigns an exam, and no other icon is used for it", () => {
    const sources = [...files("components"), ...files("app")].filter(
      (file) => !file.startsWith("app/screens/"),
    );
    const found: string[] = [];
    for (const file of sources) {
      const code = readFileSync(file, "utf8");
      for (const m of code.matchAll(/icon=\{(\w+)\}[^>]*>\s*(Assign exam[^<{]*)</g)) {
        found.push(`${file}: ${m[2].trim()}`);
        expect(m[1], `${file}: ${m[2]}`).toBe("AssignIcon");
      }
    }
    // Exams (two), Overview EXAMS (two), the weakest topic, Topics and topic students
    expect(found.length).toBeGreaterThanOrEqual(7);
    // the submit button of the Assign exam screen (its props span several lines)
    expect(readFileSync("components/InstructorExams/AssignExamView.tsx", "utf8")).toMatch(
      /<Button\s+icon=\{AssignIcon\}/,
    );
    expect(readFileSync("components/AssignIcon/AssignIcon.tsx", "utf8")).toContain("CirclePlus");
  });
});

describe("a new exam has no results", () => {
  const fresh = createExam(
    {
      title: "Exam: Responding to an alarm",
      topicIds: ["S1", "S2"],
      deadline: "2026-11-02",
      groupIds: ["rescue-team"],
    },
    now,
  );
  const group = examPeople(everyone, fresh);
  const detail = (attempts: Attempt[] = []) => {
    const context = { attempts, now };
    return wrap(
      <ExamDetailView
        exam={fresh}
        active
        now={now}
        counts={groupCounts(group, fresh, context)}
        rows={studentRows(group, fresh, context)}
        hardest={hardestQuestions(group, fresh, attempts, now)}
        titleOf={titleOf}
        dialog={null}
        onAskRemind={() => undefined}
        onRemind={() => undefined}
        onAskClose={() => undefined}
        onClose={() => undefined}
        onCancelDialog={() => undefined}
        onExtend={() => undefined}
        onDuplicate={() => undefined}
        dialogInline
      />,
    );
  };
  const attempt = (studentId: string, correct: number): Attempt => ({
    examId: fresh.id,
    studentId,
    startedAt: now - 3_600_000,
    finishedAt: now - 3_000_000,
    correct,
    total: fresh.questionCount,
    answers: Object.fromEntries(examQuestionIds(fresh).map((id, index) => [id, index < correct])),
  });

  it("is not a seeded demo exam, so no student has an invented attempt", () => {
    expect(isDemoExam(fresh.id)).toBe(false);
    expect(isDemoExam(allExams[0].id)).toBe(true);
    const counts = groupCounts(group, fresh, { attempts: [], now });
    expect(counts).toMatchObject({ passed: 0, notPassed: 0, inProgress: 0, missed: 0 });
    expect(counts.notStarted).toBe(counts.total);
    expect(counts.total).toBe(group.length);
  });

  it("state A: no completion, no tiles, no chips or scores, no hardest questions; the No results line and names only", () => {
    const html = detail();
    expect(html).toContain("Results will appear here once students start.");
    expect(html).toContain(">TOPICS<");
    expect(html).toContain("3 attempts · 20 questions · 20 minutes · Pass mark 80%");
    expect(html).toContain("No results yet. They appear when students start the exam.");
    for (const absent of ["COMPLETION", "data-count=", "data-tried", "HARDEST QUESTIONS"])
      expect(html).not.toContain(absent);
    expect(html).not.toMatch(/Not passed|Passed|In progress|of \d+ correct|No attempts yet/);
    expect(html).not.toContain("data-status-chip");
    // the roster is the group: the same count, avatar and name only
    expect(html.match(/data-student-row=/g)).toHaveLength(group.length);
    expect(html.match(/data-roster-name/g)).toHaveLength(group.length);
    expect(visible(html)).toContain(`${group.length} students`);
    expect(html).toContain("Ana Test");
  });

  it("keeps the pinned Send reminder on a new active exam (nobody has started)", () => {
    const source = readFileSync("components/InstructorExams/ExamDetailView.tsx", "utf8");
    expect(source).toContain("{active && counts.notStarted > 0 && (");
  });

  it("state B after one finished attempt: counts, tiles, the chip and score line, derived from the attempt", () => {
    const html = detail([attempt("ana@example.com", fresh.questionCount)]);
    expect(html).toContain("Results by student and the hardest questions.");
    expect(html).not.toContain("data-no-results");
    expect(html).toMatch(/data-tried[^>]*>1 of \d+ tried</);
    expect(html).toMatch(/data-count="passed"[\s\S]*?tabular-nums">1</);
    expect(html).toContain(`${fresh.questionCount} of ${fresh.questionCount} correct · 1 attempt`);
    const total = group.length;
    const counts = groupCounts(group, fresh, { attempts: [attempt("ana@example.com", 3)], now });
    expect(counts.notPassed).toBe(1);
    expect(counts.passed + counts.notPassed + counts.inProgress + counts.notStarted).toBe(total);
  });

  it("an old exam (any id that is not a demo exam) loses invented results", () => {
    const old = { ...allExams[0], id: "grp-old-1" };
    expect(groupCounts(examPeople(everyone, old), old, { attempts: [], now }).notStarted).toBe(
      examPeople(everyone, old).length,
    );
  });

  it("the seeded demo exams keep their demo results", () => {
    const counts = groupCounts(examPeople(everyone, allExams[0]), allExams[0], {
      attempts: [],
      now,
    });
    expect(counts.passed + counts.notPassed + counts.inProgress).toBeGreaterThan(0);
  });

  it("the Exams list card says Not started yet for a new exam, and keeps Passed n of m with attempts", () => {
    const none = groupCounts(group, fresh, { attempts: [], now });
    const html = renderToStaticMarkup(<ExamCard exam={fresh} counts={none} />);
    expect(html).toContain("Not started yet");
    expect(html).not.toContain("Passed 0 of");
    const some = groupCounts(group, fresh, {
      attempts: [attempt("ana@example.com", fresh.questionCount)],
      now,
    });
    expect(renderToStaticMarkup(<ExamCard exam={fresh} counts={some} />)).toContain(
      `Passed 1 of ${group.length}`,
    );
    expect(renderToStaticMarkup(<ExamCard exam={fresh} counts={none} closed />)).toContain(
      "Nobody started it",
    );
  });
});
