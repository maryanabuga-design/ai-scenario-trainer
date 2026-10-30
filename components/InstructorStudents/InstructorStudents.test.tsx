import { readFileSync, readdirSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { FilterChips } from "@/components/FilterChips/FilterChips";
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

  it("groups by spacing: 24px under the switch, Invite, 24px, ONE group of the search field and the chips 12px apart, 16px, the list", () => {
    expect(html).toContain("mt-2 flex flex-col gap-6");
    const group = html.slice(html.indexOf("data-search-group"), html.indexOf("data-student-rows"));
    expect(group).toContain("flex flex-col gap-3");
    expect(group.indexOf('name="student-search"')).toBeLessThan(group.indexOf("data-filter-chip"));
    // Invite is the single Primary and stays at the top of the list view
    expect(html.match(/h-\[52px\] bg-primary/g)).toHaveLength(1);
    expect(html.indexOf(">Invite students<")).toBeLessThan(html.indexOf("data-search-group"));
  });

  it("has five filter chips, in order, as toggle buttons with aria-pressed: active tint + 1px light green border + semi-bold, inactive white + 1px border + regular, no check icon", () => {
    expect(html.match(/data-filter-chip=/g)).toHaveLength(5);
    const labels = ["All", "Needs attention", "Almost ready", "Ready", "Not started"];
    for (const label of labels) expect(html).toContain(`${label}</span>`);
    const at = labels.map((label) => html.indexOf(`${label}</span>`));
    expect(at).toEqual([...at].sort((a, b) => a - b));
    expect(html.match(/min-h-11/g)!.length).toBeGreaterThanOrEqual(5);
    expect(html.match(/h-10 items-center/g)).toHaveLength(5);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(4);
    // wraps onto more lines: 8px along, 4px between the 44px tap areas (8px between the pills)
    expect(html).toContain("flex-wrap gap-x-2 gap-y-1");
    const chip = (id: string) =>
      html.slice(
        html.indexOf(`data-filter-chip="${id}"`),
        html.indexOf("</button>", html.indexOf(`data-filter-chip="${id}"`)),
      );
    expect(chip("all")).toContain("border border-chip-active-stroke bg-olive-tint");
    expect(chip("all")).not.toMatch(/border-primary|border-\[1\.5px\]/);
    expect(chip("all")).toContain("type-small-strong");
    expect(chip("needs")).toContain("border border-selectable-stroke bg-card");
    expect(chip("needs")).toMatch(/type-small /);
    expect(chip("needs")).not.toContain("type-small-strong");
    const chipRow = html.slice(
      html.indexOf("data-filter-chips"),
      html.indexOf("data-student-rows"),
    );
    expect(chipRow).not.toContain("lucide-check");
    // every status is a chip: Not started and Almost ready press their own chip
    for (const id of ["almost", "not-started"]) {
      const html = list(id as "almost");
      expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
      expect(html).toMatch(
        new RegExp(
          `data-filter-chip="${id}"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*data-filter-chip="${id}"`,
        ),
      );
    }
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

  it("shows 'No students match this search.' with a Secondary Clear search, and 'No students match this filter.' with a Secondary Clear filter", () => {
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
    const filter = list("needs", { shown: [] });
    expect(filter).toContain("students-no-results.webp");
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
    expect(html).toMatch(/text-text-secondary">Readiness and results for each topic\.</);
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

describe("FilterChips", () => {
  const chips = (value: string | null) =>
    clean(
      renderToStaticMarkup(
        <FilterChips
          name="x"
          legend="Show"
          options={[
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ]}
          value={value}
          onChange={() => undefined}
        />,
      ),
    );

  it("is a labelled group of toggle buttons, none pressed when the value is null, no check icon", () => {
    const html = chips(null);
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Show"');
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).not.toMatch(/type="radio"|lucide-check/);
  });

  it("marks the chosen chip as pressed and keeps every tap area at 44px", () => {
    const html = chips("b");
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/min-h-11/g)).toHaveLength(2);
    expect(html).toMatch(/aria-pressed="true"[^>]*>[\s\S]*?border border-chip-active-stroke/);
  });

  it("is used by the Students list only", () => {
    const users = ["components", "app"]
      .flatMap((dir) => walk(dir))
      .filter((file) => /<FilterChips\b/.test(readFileSync(file, "utf8")));
    expect(users).toEqual(["components/InstructorStudents/StudentsListView.tsx"]);
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
