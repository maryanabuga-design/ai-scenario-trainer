import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { FilterChips } from "@/components/FilterChips/FilterChips";
import {
  StudentDetailView,
  StudentNotFound,
} from "@/components/InstructorStudents/StudentDetailView";
import { InviteView } from "@/components/InstructorStudents/InviteView";
import { StudentsHeader } from "@/components/InstructorStudents/StudentsHeader";
import { EmptyCard, StudentsListView } from "@/components/InstructorStudents/StudentsListView";
import { TopicStudentsView } from "@/components/InstructorTopics/TopicStudentsView";
import { TopicsView } from "@/components/InstructorTopics/TopicsView";
import { JoinView } from "@/components/JoinView/JoinView";
import { SearchField } from "@/components/SearchField/SearchField";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { participants } from "@/lib/cohort";
import { seedGroupExams } from "@/lib/group-exams";
import { loadAllSections } from "@/lib/guide";
import { inScope } from "@/lib/groups";
import { switcherRows, topicStandings } from "@/lib/overview";
import {
  belowPassMark,
  examRowsFor,
  profileStatus,
  profiles,
  showingLine,
  sortProfiles,
  visibleStudents,
} from "@/lib/students";
import type { StudentsFilter } from "@/lib/students";

const now = new Date(2026, 9, 24, 10, 0).getTime();
const exams = seedGroupExams(now).filter((exam) => exam.groupIds.includes("rescue-team"));
const people = inScope(
  participants([{ name: "Ana Test", email: "ana@example.com" }]),
  "rescue-team",
);
const all = profiles(people, { "ana@example.com": null }, now);
const titleOf = (id: string) => `Topic ${id}`;
const visible = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const clean = (html: string) => html.replace(/<!-- -->/g, "");

const list = (
  filter: StudentsFilter = "all",
  {
    shown = visibleStudents(all, filter),
    query = "",
    showing = showingLine(filter, null),
    total = all.length,
  } = {},
) =>
  clean(
    renderToStaticMarkup(
      <StudentsListView
        shown={shown}
        total={total}
        filter={filter}
        query={query}
        showing={showing}
        onFilter={() => undefined}
        onQuery={() => undefined}
        onClearFilter={() => undefined}
      />,
    ),
  );

const rows = switcherRows(
  profiles(
    participants([{ name: "Ana Test", email: "ana@example.com" }]),
    { "ana@example.com": null },
    now,
  ),
);

describe("the Students header", () => {
  const html = clean(
    renderToStaticMarkup(
      <StudentsHeader
        scope="rescue-team"
        rows={rows}
        onScope={() => undefined}
        view="students"
        onView={() => undefined}
      />,
    ),
  );

  it("has the band with the title, the small group pill on the same row and the avatar", () => {
    expect(html).toContain("data-page-header-band");
    expect(html).toContain(">Students</h1>");
    const row = html.slice(html.indexOf("<h1"), html.indexOf("data-avatar"));
    expect(row).toContain("data-group-pill");
    expect(row).toContain("Rescue team");
    expect(row).toContain("lucide-chevron-down");
    expect(html).not.toContain("/instructor/groups");
    expect(row).toContain('aria-haspopup="listbox"');
    expect(row).toContain("bg-neutral-tile-bg");
    expect(html).toContain("data-avatar");
    expect(html).not.toContain('aria-label="Back');
    // the pill is small (32px) inside a 44px tap target
    expect(html).toContain("min-h-11");
    expect(html).toContain("h-8");
    expect(html).not.toMatch(
      /<h1[^>]*>Students<\/h1>[\s\S]*h-2 w-2 shrink-0 rounded-full bg-primary/,
    );
  });

  it("has the segmented switch Students | Topics under the band, with the current view chosen", () => {
    expect(html.indexOf("data-page-header-band")).toBeLessThan(html.indexOf('role="radiogroup"'));
    expect(html).toContain("Students");
    expect(html).toMatch(/checked=""[^>]*value="students"/);
    expect(html).toMatch(/value="topics"/);
    const topics = clean(
      renderToStaticMarkup(
        <StudentsHeader
          scope="all"
          rows={rows}
          onScope={() => undefined}
          view="topics"
          onView={() => undefined}
        />,
      ),
    );
    expect(topics).toMatch(/checked=""[^>]*value="topics"/);
    expect(topics).toContain("All groups");
  });

  it("has Back in the band for a list opened from the Overview or Topics", () => {
    const back = renderToStaticMarkup(
      <StudentsHeader
        scope="rescue-team"
        rows={rows}
        onScope={() => undefined}
        view="students"
        onView={() => undefined}
        back={{ label: "Back to Overview", href: "/instructor" }}
      />,
    );
    expect(back).toContain('aria-label="Back to Overview"');
  });
});

describe("the Students list", () => {
  const html = list();

  it("has the Primary Invite students with an add-person icon, the search field, the chips, the rows card and the note, in order", () => {
    const order = [
      ">Invite students<",
      'name="student-search"',
      "data-filter-chip",
      "data-student-rows",
      "Demo group. Student data on this screen is simulated.",
    ].map((t) => html.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    const invite = html.slice(0, html.indexOf(">Invite students<"));
    const link = invite.slice(invite.lastIndexOf("<a "));
    expect(link).toContain("bg-primary");
    expect(link).toContain("lucide-user-plus");
    expect(link).toContain('href="/instructor/students/invite"');
  });

  it("has a 52px search field with a magnifier and the placeholder, and a clear button only while filled", () => {
    expect(html).toContain('placeholder="Search students"');
    expect(html).toContain("h-[52px]");
    expect(html).toContain("lucide-search");
    expect(html).not.toContain('aria-label="Clear search"');
    const filled = clean(
      renderToStaticMarkup(
        <SearchField
          label="Search students"
          placeholder="Search students"
          value="Al"
          onChange={() => undefined}
        />,
      ),
    );
    expect(filled).toContain('aria-label="Clear search"');
    expect(filled).toContain("h-11 w-11");
  });

  it("has three filter chips (All, Needs attention, Ready), 40px high in a 44px tap target, the chosen one with a check", () => {
    expect(html.match(/data-filter-chip=/g)).toHaveLength(3);
    for (const label of ["All", "Needs attention", "Ready"])
      expect(html).toContain(`${label}</span>`);
    expect(html.match(/min-h-11/g)!.length).toBeGreaterThanOrEqual(3);
    expect(html.match(/h-10 items-center/g)).toHaveLength(3);
    expect(html).toMatch(/checked=""[^>]*value="all"/);
    expect(
      html.slice(html.indexOf('data-filter-chip="all"'), html.indexOf('data-filter-chip="needs"')),
    ).toContain("lucide-check");
    // a status that is not a chip leaves none chosen
    expect(list("not-started")).not.toMatch(/checked=""[^>]*value="(all|needs|ready)"/);
  });

  it("has ONE white card of 72px rows with hairlines; the whole row is the link, with only a chevron at its right", () => {
    expect(html.match(/data-student-rows/g)).toHaveLength(1);
    expect(html).toContain("divide-y divide-soft-divider");
    expect(html.match(/data-student=/g)).toHaveLength(15);
    expect(html.match(/h-\[72px\]/g)).toHaveLength(15);
    const rows = html.slice(html.indexOf("data-student-rows"));
    expect(rows.match(/lucide-chevron-right/g)).toHaveLength(15);
    expect(rows.match(/<a /g)).toHaveLength(15);
    expect(html).toContain("/instructor/students/");
    expect(visible(html)).not.toContain("%");
  });

  it("has the 48px initials avatar, the name, and under it the status chip on one line; no dot, no chip at the right", () => {
    const row = html.slice(
      html.indexOf("data-student="),
      html.indexOf("</li>", html.indexOf("data-student=")),
    );
    expect(row).toContain("h-12 w-12");
    expect(row).not.toContain("data-status-dot");
    expect(row).toContain("data-status-chip=");
    expect(row.indexOf("truncate")).toBeLessThan(row.indexOf("data-status-chip"));
    // the chip never wraps or shrinks
    expect(row).toMatch(/data-status-chip="[a-z-]+" class="[^"]*shrink-0[^"]*whitespace-nowrap/);
    // the chip comes before the chevron, and is the only status text
    expect(row.indexOf("data-status-chip")).toBeLessThan(row.indexOf("lucide-chevron-right"));
    expect(html.match(/data-status-chip=/g)).toHaveLength(15);
    // Last active is not in a row
    expect(visible(html)).not.toMatch(/active \d|Last active|today|yesterday/);
  });

  it("shows the four statuses with icon and words, and the muted text after the chip only for Needs attention and Almost ready", () => {
    for (const [status, word] of [
      ["needs", "Needs attention"],
      ["almost", "Almost ready"],
      ["ready", "Ready"],
      ["not-started", "Not started"],
    ]) {
      expect(html).toContain(`data-status-chip="${status}"`);
      expect(visible(html)).toContain(word);
    }
    const chips = html.match(/data-status-chip="[a-z-]+"[^>]*>(?:<svg[^>]*>.*?<\/svg>)/g)!;
    expect(chips.length).toBe(15);
    for (const profile of all) {
      const id = profile.participant.id;
      const row = html.slice(
        html.indexOf(`data-student="${id}"`),
        html.indexOf("</a>", html.indexOf(`data-student="${id}"`)),
      );
      const status = profileStatus(profile);
      expect(row.includes("data-muted"), id).toBe(status === "needs" || status === "almost");
    }
    expect(html).toMatch(/· \d+ to review/);
  });

  it("drops the muted text first on a narrow row (a container query), and shows 'Your demo account' only when there is room", () => {
    expect(html).toContain("@container");
    expect(html).toContain("@min-[216px]:inline");
    expect(html).toContain("@min-[330px]:inline");
    expect(html).toMatch(/data-demo-account[^>]*>· Your demo account/);
    // the muted text and the demo account are hidden by default, the chip is not
    expect(html).toMatch(/data-muted="true" class="hidden /);
    expect(html).not.toMatch(/data-status-chip="[a-z-]+" class="hidden/);
  });

  it("sorts Needs attention, Almost ready, Not started, then Ready", () => {
    const order = { needs: 0, almost: 1, "not-started": 2, ready: 3 } as Record<string, number>;
    const kinds = [...html.matchAll(/data-status-chip="([a-z-]+)"/g)].map((m) => order[m[1]]);
    expect(kinds).toEqual([...kinds].sort((a, b) => a - b));
  });

  it("shows the filter line (funnel, words, an underlined Clear filter) only for a status that is not a chip, or a topic", () => {
    expect(html).not.toContain("data-filter-line");
    const line = list("not-started");
    expect(line).toContain("data-filter-line");
    expect(line).toContain("Showing: Not started");
    expect(line).toContain("lucide-funnel");
    expect(line).toContain("min-h-11");
    expect(line).toMatch(/underline[^>]*>Clear filter</);
    const topic = list("all", {
      showing: showingLine("all", { id: "S3", title: "Moving through smoke" }),
    });
    expect(topic).toContain("Below pass mark in S3 · Moving through smoke");
  });

  it("shows 'No students match this search.' with a Secondary Clear search, and 'No students match this filter.' with a Secondary Clear filter", () => {
    const search = list("all", { shown: [], query: "Zimmerman" });
    expect(search).toContain("No students match this search.");
    expect(search).toContain("Try another name or clear the filters.");
    expect(search).toMatch(/bg-olive-tint[^>]*>Clear search</);
    expect(search).not.toContain("COHORT");
    const filter = list("needs", { shown: [] });
    expect(filter).toContain("No students match this filter.");
    expect(filter).toMatch(/bg-olive-tint[^>]*>Clear filter</);
    expect(filter).not.toContain("Clear search");
  });

  it("shows the Get started style card with Invite students for an empty group", () => {
    const empty = list("all", { shown: [], total: 0 });
    expect(empty).toContain("data-get-started");
    expect(empty).toContain("Invite students");
    expect(empty).toContain('href="/instructor/students/invite"');
  });
});

describe("the Topics view", () => {
  const standings = topicStandings(all);
  const html = clean(renderToStaticMarkup(<TopicsView standings={standings} titleOf={titleOf} />));

  it("has ten 80px cards from the weakest topic, each with the badge, the name and the one-line count", () => {
    expect(html.match(/data-topic-card=/g)).toHaveLength(10);
    expect(html.match(/h-\[var\(--list-card-height,80px\)\]/g)).toHaveLength(10);
    const ids = [...html.matchAll(/data-topic-card="(S\d+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(standings.map((s) => s.sectionId));
    expect(html).toMatch(/\d+ of \d+ at or above pass mark/);
    expect(
      html.match(/whitespace-nowrap text-text-secondary tabular-nums/g)!.length,
    ).toBeGreaterThan(0);
    // the count line is never clamped or truncated (the name may wrap to two lines)
    expect(html).not.toMatch(
      /tabular-nums[^"]*line-clamp|line-clamp[^"]*tabular-nums|tabular-nums[^"]*truncate/,
    );
    expect(visible(html)).not.toContain("%");
  });

  it("tags a topic Needs review (amber) when fewer than half of the active students are on track, and opens the topic students", () => {
    const military = profiles(inScope(participants([]), "military-training"), {}, now);
    const tagged = clean(
      renderToStaticMarkup(<TopicsView standings={topicStandings(military)} titleOf={titleOf} />),
    );
    expect(tagged).toContain("data-review-tag");
    expect(tagged).toContain("bg-status-attention-bg");
    expect(tagged).toContain("Needs review");
    expect(html).toContain('href="/instructor/students/topic/');
    expect(html.match(/lucide-chevron-right/g)!.length).toBeGreaterThan(0);
  });

  it("ends with the Secondary Assign exam on weakest topic that opens Assign exam with the topic, then the note", () => {
    const weak = standings.find((s) => s.total > 0)!;
    expect(html).toContain(
      `href="/instructor/exams/new?topic=${weak.sectionId}&amp;from=students"`,
    );
    expect(html).toMatch(
      /bg-olive-tint[^>]*>[\s\S]*lucide-file-plus[\s\S]*Assign exam on weakest topic</,
    );
    expect(html.indexOf("Assign exam on weakest topic")).toBeLessThan(
      html.indexOf("data-demo-note"),
    );
  });

  it("shows a message and a Secondary Choose group instead of the list in All groups", () => {
    const empty = clean(
      renderToStaticMarkup(
        <EmptyCard
          dataEmpty="all-groups"
          title="Select a group to see topic results."
          text="x"
          action={<a href="#choose">Choose group</a>}
        />,
      ),
    );
    expect(empty).toContain("Select a group to see topic results.");
    expect(empty).not.toContain("data-topic-card");
  });
});

describe("the topic students list", () => {
  const standing = topicStandings(all).find((t) => t.sectionId === "S3")!;
  const rows = sortProfiles(belowPassMark(all, "S3"));
  const html = clean(
    renderToStaticMarkup(
      <TopicStudentsView
        id="S3"
        title="Topic S3"
        standing={standing}
        rows={rows}
        onClear={() => undefined}
      />,
    ),
  );

  it("has Back to Topics, the summary card, the filter line, the count label, the rows and the Secondary Assign exam on this topic", () => {
    expect(html).toContain('aria-label="Back to Topics"');
    expect(html).toContain('href="/instructor/students?view=topics"');
    expect(html).toContain(">Topic S3</h1>");
    expect(html).toContain("data-topic-summary");
    expect(html).toContain(
      `Pass mark: 80 · ${standing.passing} of ${standing.total} students on track`,
    );
    expect(html).toContain("Below pass mark in S3");
    expect(html).toMatch(/underline[^>]*>Clear filter</);
    expect(html).toContain(`${rows.length} STUDENTS BELOW PASS MARK`);
    expect(html.match(/data-student=/g)).toHaveLength(rows.length);
    expect(html).toMatch(/· S3: \d+ of \d+ correct/);
    expect(html).toContain("@min-[256px]:inline");
    expect(html).toMatch(/bg-olive-tint[^>]*>[\s\S]*Assign exam on this topic</);
    expect(html).toContain("from=students&amp;topic=S3&amp;origin=topics");
    expect(visible(html)).not.toContain("%");
    expect(html).toContain("Demo group. Student data on this screen is simulated.");
  });
});

describe("the Student detail", () => {
  const person = sortProfiles(all).find(
    (p) => !p.participant.local && profileStatus(p) === "needs",
  )!;
  const rows = examRowsFor(person.participant, exams, [], now);
  const render = (
    profile = person,
    certificate: (r: (typeof rows)[number]) => string | null = () => null,
    confirming = false,
  ) =>
    clean(
      renderToStaticMarkup(
        <StudentDetailView
          profile={profile}
          groupName="Rescue team"
          now={now}
          backHref="/instructor/students"
          backLabel="Back to students"
          rows={examRowsFor(profile.participant, exams, [], now)}
          titleOf={titleOf}
          certificateHref={certificate}
          reminder="Your instructor suggests practising: Topic S3."
          onSendReminder={() => undefined}
          confirmingInitially={confirming}
          dialogInline
        />,
      ),
    );
  const html = render();

  it("has Back and the band 'Student detail' without an avatar, then the header card with the large avatar, status dot, name, field and group, last active", () => {
    expect(html).toContain('aria-label="Back to students"');
    expect(html).toContain(">Student detail</h1>");
    expect(html).not.toContain('data-avatar="true"');
    expect(html).toContain("data-student-header");
    expect(html).toContain("h-16 w-16");
    expect(html).toContain('data-status-dot="needs"');
    expect(html).toContain(`>${person.participant.name}</h2>`);
    expect(html).toMatch(/data-field-line[^>]*>[A-Za-z ]+ · Rescue team</);
    expect(html).toMatch(
      /data-last-active[^>]*>[\s\S]*lucide-clock[\s\S]*Last active (today|yesterday|\d+ (days|weeks) ago)/,
    );
  });

  it("has READINESS with the large figure (the ONLY percentage), the weekly pill and the two-cell strip", () => {
    expect(html).toContain(">READINESS<");
    expect(html).toMatch(/data-readiness-number[^>]*>\d+%</);
    expect(visible(html).match(/%/g)).toHaveLength(1);
    expect(html).toMatch(/data-delta[^>]*>[\s\S]*points? this week/);
    expect(html).toContain("Pass mark: 80");
    expect(html).toMatch(/Practised (\d+ times|once) this week|No practice this week/);
    // no delta for an account without history
    const local = render(all.find((p) => p.participant.local)!);
    expect(local).not.toContain("data-delta");
    expect(visible(local).match(/%/g)).toHaveLength(1);
  });

  it("has BY TOPIC with '10 topics', S1 to S10 in order as 80px cards, an amber tag or a green check, and no chevron", () => {
    expect(html).toContain(">BY TOPIC<");
    expect(html).toContain("10 topics");
    const ids = [...html.matchAll(/data-topic-row="(S\d+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"]);
    expect(html.match(/h-\[var\(--list-card-height,80px\)\]/g)).toHaveLength(10);
    const part = html.slice(html.indexOf(">BY TOPIC<"), html.indexOf(">EXAMS<"));
    expect(part).not.toContain("lucide-chevron-right");
    expect(part).toContain("data-needs-review");
    expect(part).toMatch(/\d+ of \d+ correct/);
    expect(part.includes("data-on-track")).toBe(part.includes("bg-status-success-bg"));
    expect(part).toContain("bg-status-attention-bg");
  });

  it("has EXAMS with '2 total' as one card of hairline rows with the status pill on one line, and a chevron only for a Passed row with a certificate", () => {
    expect(html).toContain(">EXAMS<");
    expect(html).toContain(`${rows.length} total`);
    expect(html.match(/data-exam-row=/g)).toHaveLength(rows.length);
    expect(html).toContain("divide-y divide-soft-divider");
    expect(html.match(/data-status-pill=/g)).toHaveLength(rows.length);
    expect(html).toMatch(/\d+ of \d+ correct · \d+ attempts?|No attempts yet|Closed without a try/);
    const examsPart = html.slice(html.indexOf(">EXAMS<"));
    expect(examsPart).not.toContain("lucide-chevron-right");
    expect(examsPart).not.toMatch(/<a /);
    const linked = render(person, (r) => `/instructor/students/x/certificate/${r.exam.id}`);
    const linkedPart = linked.slice(linked.indexOf(">EXAMS<"));
    expect(linkedPart.match(/<a /g)).toHaveLength(rows.length);
    expect(linkedPart).toContain("data-certificate-badge");
    expect(linkedPart.match(/lucide-chevron-right/g)).toHaveLength(rows.length);
  });

  it("has the Secondary Send reminder with a bell, then the note; the dialog has the muted message and Primary and Secondary buttons", () => {
    expect(html.indexOf(">Send reminder<")).toBeLessThan(html.indexOf("data-demo-note"));
    const before = html.slice(0, html.indexOf(">Send reminder<"));
    const button = before.slice(before.lastIndexOf("<button"));
    expect(button).toContain("bg-olive-tint");
    expect(button).toContain("lucide-bell");
    const dialog = render(person, () => null, true);
    expect(dialog).toContain(`Send a reminder to ${person.participant.name}?`);
    expect(dialog).toContain("data-reminder-preview");
    expect(dialog).toContain("Your instructor suggests practising: Topic S3.");
    expect(dialog).toContain(">Cancel<");
    expect(dialog).not.toMatch(/SUGGESTED|Suggested practice/);
  });

  it("has a 'Student not found' screen with a Secondary Back to students", () => {
    const nf = renderToStaticMarkup(<StudentNotFound />);
    expect(nf).toContain("Student not found");
    const link = nf.slice(nf.lastIndexOf("<a "));
    expect(link).toContain('href="/instructor/students"');
    expect(link).toContain("bg-olive-tint");
  });
});

describe("Invite students", () => {
  const day = new Date(2026, 9, 21).getTime();
  const render = (
    scope = "rescue-team",
    invitations = [] as Parameters<typeof InviteView>[0]["invitations"],
  ) =>
    clean(
      renderToStaticMarkup(
        <ActionBarProvider>
          <InviteView
            scope={scope}
            counts={{ "rescue-team": 15, "military-training": 12 }}
            invitations={invitations}
            origin="https://example.test"
            onSend={() => undefined}
            onCancel={() => undefined}
          />
        </ActionBarProvider>,
      ),
    );

  it("has Back and no avatar, the group card, GROUP CODE, INVITE LINK and INVITE BY EMAIL, in order", () => {
    const html = render();
    expect(html).toContain('aria-label="Back to Students"');
    expect(html).not.toContain('data-avatar="true"');
    expect(html).toMatch(/data-invite-group[\s\S]*Rescue team · 15 students/);
    const order = ["data-invite-group", ">GROUP CODE<", ">INVITE LINK<", ">INVITE BY EMAIL<"].map(
      (t) => html.indexOf(t),
    );
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toMatch(/data-group-code[^>]*>QT-A7K2</);
    expect(html).toContain('value="https://example.test/join/QT-A7K2"');
    expect(html).toMatch(/readOnly|readonly/);
    expect(html).toMatch(/lucide-copy[\s\S]*Copy code/);
    expect(html).toMatch(/lucide-link-2[\s\S]*Copy link/);
    expect(html).toContain('placeholder="name@example.com, name2@example.com"');
    expect(html).toContain("Separate addresses with commas or new lines.");
    expect(html).toContain("Prototype: no emails are sent.");
    expect(html).not.toContain("Recipients will receive");
  });

  it("lists PENDING INVITATIONS (n) as 72px rows with an avatar, 'Invited 21 Oct' and a Pending pill; joined ones are not listed", () => {
    const html = render("rescue-team", [
      { email: "j.l@example.com", invitedAt: day, groupId: "rescue-team" },
      { email: "m.h@example.com", invitedAt: day, groupId: "rescue-team" },
      { email: "done@example.com", invitedAt: day, groupId: "rescue-team", joinedAt: day },
      { email: "other@example.com", invitedAt: day, groupId: "military-training" },
    ]);
    expect(html).toContain("PENDING INVITATIONS (2)");
    expect(html.match(/data-pending=/g)).toHaveLength(2);
    expect(html.match(/data-pending-pill/g)).toHaveLength(2);
    expect(html).toContain("Invited 21 Oct");
    expect(html).not.toContain("done@example.com");
    expect(html).not.toContain("other@example.com");
    const rows = html.slice(html.indexOf("data-pending="));
    expect(rows).not.toContain("lucide-chevron-right");
    expect(rows).toContain("h-[72px]");
  });

  it("asks which group first in All groups", () => {
    const html = render("all");
    expect(html).toContain(">GROUP<");
    expect(html).toContain("data-choose-group");
    expect(html).not.toContain("data-group-code");
  });
});

describe("the join screen", () => {
  const view = (code: string) =>
    clean(
      renderToStaticMarkup(
        <SourceSheetProvider sections={loadAllSections()}>
          <JoinView code={code} />
        </SourceSheetProvider>,
      ),
    );

  it("says 'You are invited to Rescue team' with a Primary Create account and a Secondary Sign in", () => {
    const html = view("QT-A7K2");
    expect(html).toContain("You are invited to Rescue team");
    expect(html).toMatch(/bg-primary[^>]*>Create account</);
    expect(html).toMatch(/bg-olive-tint[^>]*>Sign in</);
    expect(view("qt-m4r9")).toContain("You are invited to Military training");
  });

  it("says the link is not valid for an unknown code, with a Secondary Back to welcome", () => {
    const html = view("QT-0000");
    expect(html).toContain("This invitation link is not valid.");
    expect(html).not.toContain("Create account");
    expect(html).toMatch(/href="\/welcome"[^>]*>[\s\S]*Back to welcome/);
  });
});

describe("FilterChips", () => {
  it("is a radio group of pills, none chosen when the value is null", () => {
    const html = clean(
      renderToStaticMarkup(
        <FilterChips
          name="x"
          legend="Show"
          options={[
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ]}
          value={null}
          onChange={() => undefined}
        />,
      ),
    );
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).not.toContain("checked");
  });
});
