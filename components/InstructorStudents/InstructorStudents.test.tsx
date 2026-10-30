import { readFileSync, readdirSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { FilterSheet } from "@/components/FilterSheet/FilterSheet";
import {
  StudentDetailView,
  StudentNotFound,
} from "@/components/InstructorStudents/StudentDetailView";
import { InitialsAvatar } from "@/components/InitialsAvatar/InitialsAvatar";
import { InviteView } from "@/components/InstructorStudents/InviteView";
import { STUDENTS_SUBTITLE, StudentsHeader } from "@/components/InstructorStudents/StudentsHeader";
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
import { topicStandings } from "@/lib/overview";
import {
  belowPassMark,
  examRowsFor,
  profileStatus,
  profiles,
  showingLine,
  sortProfiles,
  visibleStudents,
  readinessOf,
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
        counted={all}
      />,
    ),
  );

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return walk(path);
    return /\.tsx$/.test(entry.name) && !/\.test\./.test(entry.name) ? [path] : [];
  });

describe("the Students header", () => {
  const html = clean(
    renderToStaticMarkup(<StudentsHeader view="students" onView={() => undefined} />),
  );

  it("has the band with the title, the muted subtitle and the avatar, and NO group chip", () => {
    expect(html).toContain("data-page-header-band");
    expect(html).toContain(">Students</h1>");
    expect(html).toContain("See how each student is doing and who needs your attention.");
    expect(STUDENTS_SUBTITLE).toBe("See how each student is doing and who needs your attention.");
    expect(html).toMatch(/text-text-secondary">See how each student/);
    expect(html).toContain("data-avatar");
    expect(html).not.toMatch(
      /data-group-pill|data-group-switcher|aria-haspopup="listbox"|Rescue team/,
    );
    expect(html).not.toContain('aria-label="Back');
  });

  it("has the segmented switch Students | Topics under the band, with the current view chosen", () => {
    expect(html.indexOf("data-page-header-band")).toBeLessThan(html.indexOf('role="radiogroup"'));
    expect(html).toMatch(/checked=""[^>]*value="students"/);
    expect(html).toMatch(/value="topics"/);
    const topics = clean(
      renderToStaticMarkup(<StudentsHeader view="topics" onView={() => undefined} />),
    );
    expect(topics).toMatch(/checked=""[^>]*value="topics"/);
  });

  it("has Back in the band for a list opened from the Overview or Topics", () => {
    const back = renderToStaticMarkup(
      <StudentsHeader
        view="students"
        onView={() => undefined}
        back={{ label: "Back to Overview", href: "/instructor" }}
      />,
    );
    expect(back).toContain('aria-label="Back to Overview"');
  });

  it("the group chip is only in the Overview: no other screen file draws the switcher", () => {
    const users = ["components", "app"]
      .flatMap((dir) => walk(dir))
      .filter((file) => /<GroupSwitcher\b/.test(readFileSync(file, "utf8")));
    expect(users).toEqual(["components/InstructorOverview/InstructorOverviewView.tsx"]);
  });
});

describe("the Students list", () => {
  const html = list();

  it("has the Primary Invite students with an add-person icon, the search field, the chips, the rows card and the note, in order", () => {
    const order = [
      ">Invite students<",
      "data-search-group",
      'name="student-search"',
      "data-filter-button",
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

  it("groups by spacing: 24px under the switch, Invite, 24px, ONE group of the search field and the filter icon button 12px apart in one row, 16px, the list", () => {
    expect(html).toContain("mt-2 flex flex-col gap-6");
    const group = html.slice(html.indexOf("data-search-group"), html.indexOf("data-student-rows"));
    expect(group).toContain("flex items-start gap-3");
    expect(group.indexOf('name="student-search"')).toBeLessThan(
      group.indexOf("data-filter-button"),
    );
    // Invite is the single Primary and stays at the top of the list view
    expect(html.match(/h-\[52px\] bg-primary/g)).toHaveLength(1);
    expect(html.indexOf(">Invite students<")).toBeLessThan(html.indexOf("data-search-group"));
  });

  it("has ONE 48px square filter icon button beside the search field, no Status row and no chips", () => {
    expect(html).not.toMatch(/data-filter-chip|data-filter-select|data-select-button|>Status</);
    expect(html.match(/data-filter-button/g)).toHaveLength(1);
    const at = html.indexOf("<button", html.indexOf("data-search-group"));
    const tag = html.slice(at, html.indexOf(">", at));
    expect(tag).toContain('aria-label="Filter by status"');
    expect(tag).toContain('aria-haspopup="dialog"');
    expect(tag).toContain("h-12 w-12");
    expect(tag).toContain("rounded-[14px]");
    expect(tag).toContain("bg-olive-tint");
    expect(tag).toContain("text-primary");
    expect(html.slice(at, html.indexOf("</button>", at))).toContain("lucide-sliders-horizontal");
    // the search field is level with it: 48px, in the same row
    expect(html.slice(html.indexOf("data-search-group"), at)).toContain("h-12 w-full");
    expect(html).not.toContain("data-filter-sheet");
    expect(html).not.toContain("data-status-line");
  });

  it("darkens the button and shows the 'Showing: ...' line with a tertiary Clear while a status is chosen", () => {
    const chosen = list("needs");
    expect(chosen).toContain("bg-filter-active");
    expect(chosen).toContain("data-status-line");
    expect(chosen).toMatch(/Showing: <!-- -->Needs attention|Showing: Needs attention/);
    expect(chosen).toMatch(/underline[^>]*>Clear</);
    expect(list("not-started")).toContain("Showing: Not started");
    expect(html).not.toContain("bg-filter-active");
  });

  it("opens the sheet with five options in order, counts after the label, the radio at the right and the chosen card outlined", () => {
    const open = clean(
      renderToStaticMarkup(
        <StudentsListView
          shown={all}
          total={all.length}
          filter="almost"
          query=""
          onFilter={() => undefined}
          onQuery={() => undefined}
          onClearFilter={() => undefined}
          counted={all}
          statusOpen
        />,
      ),
    );
    expect(open).toContain('role="dialog"');
    expect(open).toContain('aria-modal="true"');
    expect(open).toMatch(/aria-labelledby="([^"]+)"[\s\S]*id="\1"[^>]*>Filter by status</);
    expect(open.match(/name="students-status"/g)).toHaveLength(5);
    const labels = ["All", "Needs attention", "Almost ready", "Ready", "Not started"];
    const sheet = open.slice(open.indexOf("data-filter-sheet"));
    const at = labels.map((label) => sheet.indexOf(`>${label}<span data-option-count`));
    expect(at.every((i) => i > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    const counts = [...sheet.matchAll(/data-option-count[^>]*> · (\d+)</g)].map((m) =>
      Number(m[1]),
    );
    const statuses = (kind: string) => all.filter((p) => profileStatus(p) === kind).length;
    expect(counts).toEqual([
      all.length,
      statuses("needs"),
      statuses("almost"),
      statuses("ready"),
      statuses("not-started"),
    ]);
    expect(sheet.match(/border-\[1\.5px\]/g)).toHaveLength(5);
    expect(sheet.match(/border-primary/g)!.length).toBeGreaterThanOrEqual(1);
    expect(sheet.match(/checked=""/g)).toHaveLength(1);
    expect(sheet).toMatch(/data-sheet-close/);
    expect(sheet).toContain("rounded-t-[20px]");
    expect(sheet).toContain("data-sheet-handle");
    expect(sheet).toContain("filter-sheet");
    // 56px cards, and no immediate apply: only the Primary "Show N students" is pinned
    expect(sheet.match(/h-14 px-/g)).toHaveLength(5);
    expect(sheet).not.toMatch(/>Apply</);
    const from = sheet.indexOf("data-sheet-footer");
    const footer = sheet.slice(from);
    const almost = all.filter((p) => profileStatus(p) === "almost").length;
    expect(footer).toMatch(/aria-live="polite"[^>]*>[^]*bg-primary[^>]*>Show (<!-- -->)?\d+/);
    expect(visible(footer)).toContain(`Show ${almost} ${almost === 1 ? "student" : "students"}`);
    expect(footer.match(/(?<![:-])bg-primary(?![-\w])/g)).toHaveLength(1);
    // one button only: no Reset, and no Secondary button in the sheet
    expect(sheet).not.toMatch(/>Reset</);
    expect(
      sheet.slice(sheet.indexOf('role="dialog"'), sheet.indexOf("data-sheet-footer") + 600),
    ).not.toContain('bg-olive-tint" ');
    const buttons = sheet.slice(from, from + 900).match(/<button/g) ?? [];
    expect(buttons).toHaveLength(1);
    // the options scroll, the footer does not
    expect(sheet.indexOf("data-sheet-options")).toBeLessThan(sheet.indexOf("data-sheet-footer"));
    expect(sheet).toMatch(/data-sheet-options[^>]*overflow-y-auto/);
    expect(sheet).toMatch(/data-sheet-footer[^>]*shrink-0/);
  });

  it("starts the draft from the applied status, and labels the Primary for All, a status, one student and none", () => {
    const open = (filter: StudentsFilter, counted = all, draft?: StudentsFilter) =>
      visible(
        clean(
          renderToStaticMarkup(
            <StudentsListView
              shown={all}
              total={all.length}
              filter={filter}
              query=""
              onFilter={() => undefined}
              onQuery={() => undefined}
              onClearFilter={() => undefined}
              counted={counted}
              statusOpen
              initialDraft={draft}
            />,
          ),
        ),
      );
    expect(open("all")).toContain(`Show ${all.length} students`);
    const needs = all.filter((p) => profileStatus(p) === "needs").length;
    // marked but not applied: the draft drives the label, the applied filter drives the page
    const marked = open("all", all, "needs");
    expect(marked).toContain(`Show ${needs} ${needs === 1 ? "student" : "students"}`);
    expect(marked).not.toContain("Showing:");
    const one = all.slice(0, 1);
    expect(open("all", one)).toContain("Show 1 student");
    expect(open("all", one)).not.toContain("Show 1 students");
    expect(open("needs", [])).toContain("Show 0 students");
  });

  it("has ONE white card of 72px rows with hairlines; the whole row is the link, with only a chevron at its right", () => {
    expect(html.match(/data-student-rows/g)).toHaveLength(1);
    expect(html).toContain("divide-y divide-soft-divider");
    expect(html.match(/data-student=/g)).toHaveLength(15);
    expect(html.match(/min-h-\[72px\]/g)).toHaveLength(15);
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
    // the chip never wraps or shrinks, and has no icon
    expect(row).toMatch(
      /data-status-chip="[a-z-]+"[^>]*class="[^"]*shrink-0[^"]*whitespace-nowrap/,
    );
    expect(row).not.toMatch(/data-status-chip="[^"]+"[^>]*><svg/);
    // the chip comes before the chevron, and is the only status text
    expect(row.indexOf("data-status-chip")).toBeLessThan(row.indexOf("lucide-chevron-right"));
    expect(html.match(/data-status-chip=/g)).toHaveLength(15);
    // Last active is not in a row
    expect(visible(html)).not.toMatch(/active \d|Last active|today|yesterday/);
  });

  it("shows the four statuses as words only, and the muted description after the chip only for Needs attention and Almost ready", () => {
    for (const [status, word] of [
      ["needs", "Needs attention"],
      ["almost", "Almost ready"],
      ["ready", "Ready"],
      ["not-started", "Not started"],
    ]) {
      expect(html).toContain(`data-status-chip="${status}"`);
      expect(visible(html)).toContain(word);
    }
    expect(html.match(/data-status-chip="[a-z-]+"[^>]*>[A-Z]/g)).toHaveLength(15);
    for (const profile of all) {
      const id = profile.participant.id;
      const row = html.slice(
        html.indexOf(`data-student="${id}"`),
        html.indexOf("</a>", html.indexOf(`data-student="${id}"`)),
      );
      const status = profileStatus(profile);
      expect(/\d+ to review/.test(row), id).toBe(status === "needs" || status === "almost");
    }
    expect(html).toMatch(/>\d+ to review</);
  });

  it("wraps the description under the chip instead of hiding it: a wrapping row, 8px apart, on the baseline", () => {
    expect(html).not.toMatch(/@container|@min-\[|hidden whitespace-nowrap/);
    const row = html.slice(
      html.indexOf("data-student="),
      html.indexOf("</li>", html.indexOf("data-student=")),
    );
    expect(row).toMatch(/data-row-status[^>]*class="[^"]*flex flex-wrap items-baseline gap-x-2/);
    expect(row).toMatch(/data-description[^>]*class="[^"]*min-w-0 text-pretty text-text-secondary/);
    // the local account's description names it after the muted text
    const mine = all.find((p) => p.participant.local);
    if (mine) {
      const own = html.slice(html.indexOf(`data-student="${mine.participant.id}"`));
      expect(own.slice(0, own.indexOf("</li>"))).toContain("Your demo account");
    }
  });

  it("sorts Needs attention, Almost ready, Not started, then Ready", () => {
    const order = { needs: 0, almost: 1, "not-started": 2, ready: 3 } as Record<string, number>;
    const kinds = [...html.matchAll(/data-status-chip="([a-z-]+)"/g)].map((m) => order[m[1]]);
    expect(kinds).toEqual([...kinds].sort((a, b) => a - b));
  });

  it("shows the filter line (funnel, words, an underlined Clear filter) only for a topic, never for a status", () => {
    expect(html).not.toContain("data-filter-line");
    expect(showingLine("not-started", null)).toBeNull();
    expect(showingLine("almost", null)).toBeNull();
    const line = list("all", {
      showing: showingLine("all", { id: "S3", title: "Moving through smoke" }),
    });
    expect(line).toContain("data-filter-line");
    expect(line).toContain("lucide-funnel");
    expect(line).toContain("min-h-11");
    expect(line).toMatch(/underline[^>]*>Clear filter</);
    const topic = list("all", {
      showing: showingLine("all", { id: "S3", title: "Moving through smoke" }),
    });
    expect(topic).toContain("Below pass mark in S3 · Moving through smoke");
  });

  it("shows 'No students match this search.' with a Secondary Clear search, also when only a status filters (the one card resets both)", () => {
    const search = list("all", { shown: [], query: "Zimmerman" });
    expect(search).toContain("No students match this search.");
    expect(search).toContain("Try another name or clear the filters.");
    expect(search).toMatch(/bg-olive-tint[^>]*>Clear search</);
    expect(search).not.toContain("COHORT");
    // the picture: about 120px, decorative, centred above the title; the icon tile is only the fallback
    const card = search.slice(search.indexOf('data-empty="search"'));
    expect(card).toContain('src="/images/instructor/students-no-results.webp"');
    expect(card).toContain('alt=""');
    expect(card).toContain("h-[120px] w-[120px]");
    expect(card).not.toContain("data-empty-tile");
    expect(card.indexOf("data-no-results-art")).toBeLessThan(card.indexOf("No students match"));
    expect(card).toContain("items-center");
    // the spacing: picture 16px to the title, 6px to the line, 24px to the Secondary button
    expect(card).toMatch(/data-empty-title[^>]*class="[^"]*\bmt-4\b/);
    expect(card).toMatch(/data-empty-text[^>]*class="[^"]*\bmt-1\.5\b/);
    expect(card).toMatch(/data-empty-action[^>]*class="[^"]*\bmt-6\b/);
    expect(card).not.toMatch(/data-empty="search"[^>]*\bgap-/);
    const status = list("needs", { shown: [] });
    expect(status).toContain("students-no-results.webp");
    expect(status).toContain("No students match this search.");
    expect(status).toMatch(/bg-olive-tint[^>]*>Clear search</);
    expect(status).not.toContain("No students match this filter.");
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
      <TopicStudentsView id="S3" title="Topic S3" standing={standing} rows={rows} />,
    ),
  );

  it("has Back to Topics, the title, the muted subtitle, a white summary card with Topic S3, the count label, the rows and the Secondary Assign exam on this topic", () => {
    expect(html).toContain('aria-label="Back to Topics"');
    expect(html).toContain('href="/instructor/students?view=topics"');
    expect(html).toContain(">Topic S3</h1>");
    expect(html).toMatch(/text-text-secondary">Students below the pass mark on this topic\.</);
    const card = html.slice(html.indexOf("data-topic-summary"), html.indexOf("BELOW PASS MARK"));
    // white, like the student card of the detail screen: same radius, padding and tile
    expect(card).toContain("rounded-card border border-selectable-stroke bg-card");
    expect(card).toContain("p-[var(--gutter,1rem)]");
    expect(card).not.toContain("bg-secondary-sand");
    expect(card).toContain("data-initials-avatar");
    expect(card).toContain("h-16 w-16");
    expect(card).toMatch(/>Topic S3<\/h2>/);
    expect(card).toContain(
      `Pass mark: 80 · ${standing.passing} of ${standing.total} students on track`,
    );
    // the title above holds the topic name, the card does not repeat it
    expect(card).not.toContain("Topic S3</p>");
    // no filter strip and no filter control
    expect(html).not.toMatch(/Below pass mark in|Clear filter|data-filter-line/);
    expect(html).toContain(`${rows.length} STUDENTS BELOW PASS MARK`);
    expect(html.match(/data-student=/g)).toHaveLength(rows.length);
    expect(html).toMatch(/>S3: \d+ of \d+ correct</);
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

  it("has Back and the band 'Student detail' without an avatar, then the header card with the large plain avatar (no status dot), name, field and group, last active", () => {
    expect(html).toContain('aria-label="Back to students"');
    expect(html).toContain(">Student detail</h1>");
    expect(html).toMatch(/text-text-secondary">Readiness and results for each topic\.</);
    expect(html).not.toContain('data-avatar="true"');
    expect(html).toContain("data-student-header");
    expect(html).toContain("h-16 w-16");
    expect(html).not.toContain("data-status-dot");
    expect(html).toContain(`>${person.participant.name}</h2>`);
    expect(html).toMatch(/data-field-line[^>]*>[A-Za-z ]+ · Rescue team</);
    expect(html).toMatch(
      /data-last-active[^>]*>[\s\S]*lucide-clock[\s\S]*Last active (today|yesterday|\d+ (days|weeks) ago)/,
    );
  });

  it("has READINESS with the large figure (the ONLY percentage), the weekly pill and the two-cell strip", () => {
    expect(html).toContain(">READINESS<");
    expect(html).toMatch(/data-readiness-number[^>]*>\d+%</);
    // ONE headline percentage; the comparison value in its pill ("Up from 45% last week") is allowed
    expect(html.match(/data-readiness-number/g)).toHaveLength(1);
    expect(visible(html).match(/%/g)).toHaveLength(2);
    expect(html).toMatch(/data-delta[^>]*>[\s\S]*(Up|Down) from \d+% last week|Same as last week/);
    expect(html).not.toMatch(/points? this week|No change this week/);
    expect(html).toContain("Pass mark: 80");
    expect(html).toMatch(/Practised (\d+ times|once) this week|No practice this week/);
    // no delta for an account without history
    const local = render(all.find((p) => p.participant.local)!);
    expect(local).not.toContain("data-delta");
    expect(visible(local).match(/%/g)).toHaveLength(1);
  });

  it("has the topics in two labelled groups with counts, no BY TOPIC row, no per-row badge and no chevron", () => {
    expect(html).not.toMatch(/>BY TOPIC<|10 topics/);
    const labels = [...html.matchAll(/type-label text-text-secondary">([^<]+)<\/h2>/g)]
      .map((m) => m[1].replace(/<!-- -->/g, ""))
      .filter((l) => /REVIEW/.test(l));
    expect(labels).toHaveLength(2);
    expect(labels[0]).toMatch(/^NEEDS REVIEW · \d+$/);
    expect(labels[1]).toMatch(/^NOTHING TO REVIEW · \d+$/);
    const counts = labels.map((l) => Number(l.split("· ")[1]));
    expect(counts[0] + counts[1]).toBe(10);
    // the count matches the rows of each group, and the order inside a group is the topic order
    for (const [i, id] of ["review", "clear"].entries()) {
      const section = html.slice(html.indexOf(`data-topic-group="${id}"`));
      const part = section.slice(0, section.indexOf("</section>"));
      const ids = [...part.matchAll(/data-topic-row="(S\d+)"/g)].map((m) => Number(m[1].slice(1)));
      expect(ids).toHaveLength(counts[i]);
      expect(ids).toEqual([...ids].sort((a, b) => a - b));
    }
    expect(html.indexOf('data-topic-group="review"')).toBeLessThan(
      html.indexOf('data-topic-group="clear"'),
    );
    expect(html.match(/h-\[var\(--list-card-height,80px\)\]/g)).toHaveLength(10);
    const part = html.slice(html.indexOf("data-topic-group"), html.indexOf(">EXAMS<"));
    expect(part).not.toMatch(
      /lucide-chevron-right|data-needs-review|data-on-track|data-review-tag|Needs review|lucide-check/,
    );
    expect(part).toMatch(/\d+ of \d+ correct/);
  });

  it("hides a group that is empty", () => {
    const allClear = {
      ...person,
      topics: person.topics.map((row) => ({
        ...row,
        correct: row.answered,
        answered: row.answered,
      })),
    };
    const clear = render(allClear);
    expect(clear).not.toContain('data-topic-group="review"');
    expect(clear).toContain('data-topic-group="clear"');
    expect(clear).toMatch(/NOTHING TO REVIEW · 10/);
    const allReview = render({
      ...person,
      topics: person.topics.map((row) => ({ ...row, answered: 10, correct: 1 })),
    });
    expect(allReview).not.toContain('data-topic-group="clear"');
    expect(allReview).toMatch(/NEEDS REVIEW · 10/);
  });

  it("says the comparison in plain words in all three cases", () => {
    const base = { ...person, readinessPrev: null };
    const wording = (delta: number | "same") => {
      const current = readinessOf(person);
      const prev = delta === "same" ? current : current - delta;
      return render({ ...base, readinessPrev: prev });
    };
    expect(wording(4)).toMatch(/Up from \d+% last week/);
    expect(wording(-3)).toMatch(/Down from \d+% last week/);
    expect(wording("same")).toContain("Same as last week");
  });

  it("has EXAMS with '2 total' as one card of hairline rows with the status chip and its description, and a chevron only for a Passed row with a certificate", () => {
    expect(html).toContain(">EXAMS<");
    expect(html).toContain(`${rows.length} total`);
    expect(html.match(/data-exam-row=/g)).toHaveLength(rows.length);
    expect(html).toContain("divide-y divide-soft-divider");
    expect(html.match(/data-status-chip=/g)).toHaveLength(rows.length);
    expect(html).not.toMatch(/data-status-pill/);
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

  it("has Back, the muted subtitle, a white group card, GROUP CODE, INVITE LINK and INVITE BY EMAIL, in order", () => {
    const html = render();
    expect(html).toContain('aria-label="Back to Students"');
    expect(html).not.toContain('data-avatar="true"');
    expect(html).toContain("Share the group code or link, or invite students by email.");
    expect(html).toMatch(/data-invite-group[^>]*bg-card[\s\S]*Rescue team · 15 students/);
    const order = ["data-invite-group", ">GROUP CODE<", ">INVITE LINK<", ">INVITE BY EMAIL<"].map(
      (t) => html.indexOf(t),
    );
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toMatch(/value="QT-A7K2"/);
    expect(html).toContain('value="https://example.test/join/QT-A7K2"');
    expect(html.match(/readOnly=""|readonly=""/g)).toHaveLength(2);
    expect(html).not.toContain("Prototype: no emails are sent.");
    expect(html).not.toContain("Demo group.");
    expect(html).not.toContain("Recipients will receive");
  });

  it("uses ONE field look for the three fields, and no separate copy buttons", () => {
    const html = render();
    const boxes = html.match(/class="type-body min-h-\[52px\][^"]*"/g) ?? [];
    expect(boxes).toHaveLength(3);
    for (const box of boxes) {
      expect(box).toContain("min-h-[52px]");
      expect(box).toContain("rounded-[14px]");
      expect(box).toContain("border-selectable-stroke");
      expect(box).toContain("bg-card");
    }
    expect(html).not.toContain(">Copy code<");
    expect(html).not.toContain(">Copy link<");
    expect(html.match(/data-copy-button/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Copy group code"');
    expect(html).toContain('aria-label="Copy invite link"');
    expect(html.match(/lucide-copy/g)).toHaveLength(2);
    expect(html.match(/data-copy-label="true">Copy</g)).toHaveLength(2);
    // 44px tap area around a 32px sand tile
    expect(html).toMatch(/data-copy-button[^>]*class="[^"]*h-11/);
    expect(html).toMatch(/type-action[^"]*h-8[^"]*bg-secondary-sand/);
    // the value is cut with an ellipsis and never wraps
    expect(html).toMatch(/data-invite-link=""[^>]*class="[^"]*truncate[^"]*whitespace-nowrap/);
  });

  it("makes INVITE BY EMAIL a combobox with the helper text, the helper texts and the tags", () => {
    const html = render();
    expect(html).toMatch(/role="combobox"[^>]*aria-expanded="false"/);
    expect(html).toContain("Type a name or email. You can add several people.");
    expect(html).toMatch(/aria-live="polite"/);
    const withTags = clean(
      renderToStaticMarkup(
        <ActionBarProvider>
          <InviteView
            scope="rescue-team"
            counts={{ "rescue-team": 15 }}
            invitations={[]}
            origin="https://example.test"
            onSend={() => undefined}
            onCancel={() => undefined}
            initialRecipients={[
              { email: "alina.kovalenko@example.com", name: "Alina Kovalenko" },
              { email: "new.person@example.com" },
            ]}
            initialText="Al"
            initialError="Check this email address."
          />
        </ActionBarProvider>,
      ),
    );
    expect(withTags).toContain("2 people will get an invitation.");
    expect(withTags).not.toContain("You can add several people.");
    expect(withTags).toContain('data-tag="alina.kovalenko@example.com"');
    expect(withTags).toContain(">Alina Kovalenko<");
    expect(withTags).toContain(">new.person@example.com<");
    expect(withTags).toContain('aria-label="Remove Alina Kovalenko"');
    expect(withTags).toContain("Check this email address.");
    expect(withTags).toMatch(/h-11 w-9/);
    // "Al" lists people not already added, never an already added one
    expect(withTags).toContain('role="listbox"');
    expect(withTags).toContain('data-suggestion="alex.moroz@example.com"');
    expect(withTags).not.toContain('data-suggestion="alina.kovalenko@example.com"');
    expect(withTags).toMatch(/role="combobox"[^>]*aria-expanded="true"/);
    // each suggestion has the 32px initials avatar; the tags have none
    const list = withTags.slice(withTags.indexOf('role="listbox"'));
    expect(list).toMatch(
      /data-suggestion="alex.moroz@example.com"[\s\S]*?data-initials-avatar[^>]*h-8 w-8[^>]*>AM</,
    );
    const tagArea = withTags.slice(
      withTags.indexOf("data-recipient-field"),
      withTags.indexOf('role="listbox"'),
    );
    expect(tagArea).not.toContain("data-initials-avatar");
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

describe("FilterSheet", () => {
  const sheet = (open: boolean) =>
    clean(
      renderToStaticMarkup(
        <FilterSheet open={open} title="Filter by status" onClose={() => undefined}>
          <p>Options</p>
        </FilterSheet>,
      ),
    );

  it("draws nothing while closed", () => {
    expect(sheet(false)).toBe("");
  });

  it("is a modal dialog inside a layer as wide as the phone column, with a scrim, 20px top corners, a handle and a close x", () => {
    const html = sheet(true);
    expect(html).toContain("fixed inset-y-0 left-1/2 z-40 w-full max-w-app");
    expect(html).toContain("data-sheet-scrim");
    expect(html).toContain("color-mix(in_srgb,var(--text)_40%,transparent)");
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("rounded-t-[20px]");
    expect(html).toContain("bg-bg");
    expect(html).toContain("data-sheet-handle");
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain("h-11 w-11");
    expect(html).toContain("pb-[max(16px,env(safe-area-inset-bottom))]");
  });

  it("is used by the Students list only, and the dropdown component is gone", () => {
    const files = ["components", "app"].flatMap((dir) => walk(dir));
    expect(files.filter((file) => /<FilterSheet\b/.test(readFileSync(file, "utf8")))).toEqual([
      "components/InstructorStudents/StudentsListView.tsx",
    ]);
    expect(
      files.filter((file) =>
        /FilterSelect|FilterChips|data-filter-chip/.test(readFileSync(file, "utf8")),
      ),
    ).toEqual([]);
  });
});

describe("the initials avatar", () => {
  it("shows the initials, and a picture when one is given (the failed-picture fallback is checked on the screen review page)", () => {
    const plain = renderToStaticMarkup(<InitialsAvatar initials="AK" size={32} />);
    expect(plain).toContain(">AK<");
    expect(plain).toContain("h-8 w-8");
    expect(plain).not.toContain("<img");
    const photo = renderToStaticMarkup(<InitialsAvatar initials="AK" image="/a.png" />);
    expect(photo).toContain('src="/a.png"');
    expect(photo).not.toContain(">AK<");
    expect(renderToStaticMarkup(<InitialsAvatar initials="AK" image="" />)).toContain(">AK<");
  });
});
