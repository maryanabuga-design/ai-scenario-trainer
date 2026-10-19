import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProgressView, SessionsListView } from "@/components/ProgressView/ProgressView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { demoExam } from "@/lib/assigned-exams";
import { loadAllSections } from "@/lib/guide";
import { getItem } from "@/lib/items";
import { scopeItemIds } from "@/lib/readiness";
import type { FinishedSession } from "@/lib/session";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/progress",
}));

const NOW = new Date(2026, 9, 19, 14, 0, 0);
const day = (daysAgo: number, hour = 10, minute = 37) =>
  new Date(2026, 9, 19 - daysAgo, hour, minute).getTime();
const exam = demoExam(NOW);

const answers = (ids: string[], right: number) =>
  ids.map((id, index) => {
    const item = getItem(id);
    return {
      itemId: id,
      optionId:
        index < right
          ? item.correctOptionId
          : item.options.find((option) => option.id !== item.correctOptionId)!.id,
    };
  });
const entry = (
  ids: string[],
  right: number,
  finishedAt: number,
  extra: Partial<FinishedSession> = {},
): FinishedSession => ({
  kind: "quiz",
  itemIds: ids,
  answers: answers(ids, right),
  finishedAt,
  ...extra,
});

const s1 = scopeItemIds(["S1"]);
const s2 = scopeItemIds(["S2"]);

const seeded: FinishedSession[] = [
  entry(s1, s1.length, day(6), { mode: "practice", topicIds: ["S1"] }),
  entry([...s2.slice(0, 4), ...s1.slice(20, 22)], 6, day(3), {
    mode: "mini-quiz",
    topicIds: ["S1", "S2"],
  }),
  entry(s2.slice(0, 10), 7, day(1), { mode: "practice", topicIds: ["S2"] }),
  entry(s1.slice(0, 12), 3, day(0), { kind: "exam", mode: "exam", topicIds: ["S1"] }),
];

function render(history: FinishedSession[], props: { exam?: typeof exam | null } = {}) {
  // React puts a comment between neighbouring texts; the page shows them as one text
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ProgressView
        history={history}
        exam={props.exam === undefined ? exam : props.exam}
        now={NOW}
        resultHref={(session) => (session.finishedAt === day(0) ? "/exam/results" : null)}
      />
    </SourceSheetProvider>,
  ).replace(/<!-- -->/g, "");
}

const rowsOf = (html: string) => [
  ...html.matchAll(/<button[^>]*data-topic-row[\s\S]*?<\/button>/g),
];

describe("Progress: the header and the order of the sections", () => {
  const html = render(seeded);

  it("has the title and the grey subtitle", () => {
    expect(html).toContain(">Progress</h1>");
    expect(html).toContain(
      '<p class="type-small text-text-secondary">How you are doing over time.</p>',
    );
  });

  it("goes Readiness card, By topic, Activity, Recent sessions", () => {
    const order = ["Exam readiness", ">By topic<", "data-activity", ">Recent sessions<"].map(
      (text) => html.indexOf(text),
    );
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("no longer has the bar chart, the Weak topics card, the Guide sections card or the history cards", () => {
    for (const gone of [
      "Result by session",
      "Weak topics",
      "Guide sections",
      "Session history",
      "Complete two sessions",
      "Correct answers",
      "SCENARIO",
      "Repeat round",
    ]) {
      expect(html).not.toContain(gone);
    }
  });

  it("keeps the bottom padding and the page rhythm", () => {
    expect(html).toContain("flex flex-col gap-6 pb-4");
  });
});

describe("Progress: the readiness card", () => {
  it("shows the exam, its deadline, Readiness, the bar with its marker and one sentence", () => {
    const html = render(seeded);
    expect(html).toContain(">Exam readiness</h2>");
    expect(html).toContain("Evacuation basics exam · Due 26 Oct · 7 days left");
    expect(html).toMatch(/Readiness \d+%/);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain("data-readiness-tick-label");
    expect(html).toMatch(/Not ready yet\. \d+ more correct answers? to reach 80%\./);
  });

  it("has the Primary Repeat weak topics below the target, and no Start exam", () => {
    const html = render(seeded);
    expect(html).toContain(">Repeat weak topics<");
    expect(html).not.toContain(">Start exam<");
  });

  it("is Overall readiness with no deadline line when no exam is assigned", () => {
    const html = render(seeded, { exam: null });
    expect(html).toContain(">Overall readiness</h2>");
    expect(html).not.toContain("Due ");
    expect(html).not.toContain("days left");
  });

  it("shows a Secondary Start exam instead of Repeat once ready", () => {
    const ids = scopeItemIds(exam.topicIds);
    const done = [entry(ids, ids.length, day(0), { mode: "practice", topicIds: exam.topicIds })];
    const html = render(done);
    expect(html).toContain("You are ready for the exam.");
    expect(html).toContain(">Start exam<");
    expect(html).toContain('href="/exam?id=demo-evacuation-basics"');
    expect(html).not.toContain(">Repeat weak topics<");
    // no red anywhere on the card
    expect(html).not.toMatch(/text-wrong|bg-wrong|pastel-rose|text-red|bg-red/);
  });
});

describe("Progress: By topic", () => {
  const html = render(seeded);

  it("lists the four exam topics first, then Other topics (6) closed", () => {
    expect(html).toContain(">In your exam<");
    expect(html.indexOf(">In your exam<")).toBeLessThan(html.indexOf("Other topics (6)"));
    expect(html).toContain('aria-expanded="false"');
    expect(rowsOf(html)).toHaveLength(4);
    expect(html).not.toContain('data-topic-row="S6"');
  });

  it("shows counts over ALL the topic's questions and a status word, never a percentage", () => {
    const rows = rowsOf(html).map((match) => match[0]);
    expect(rows.every((row) => /\d+ of \d+ correct/.test(row))).toBe(true);
    // the bar width is a style, not a shown number: look at the text only
    expect(rows.every((row) => !row.replace(/<[^>]+>/g, " ").includes("%"))).toBe(true);
    const total = s1.length;
    const s1Row = rows.find((row) => row.includes('data-topic-row="S1"'))!;
    expect(s1Row).toContain(`31 of ${total} correct`);
    expect(s1Row).toContain(">Needs work<");
    const s2Row = rows.find((row) => row.includes('data-topic-row="S2"'))!;
    expect(s2Row).toContain(`${s2.length} of ${s2.length} correct`);
    expect(s2Row).toContain(">Ready<");
    expect(rows.find((row) => row.includes('data-topic-row="S4"'))).toContain(">Not started<");
  });

  it("sorts the weakest first inside the exam group", () => {
    const ids = rowsOf(html).map((match) => /data-topic-row="(S\d+)"/.exec(match[0])![1]);
    // S3 and S4 not started (guide order), then S1 (31 of 40) needs work, S2 is ready
    expect(ids).toEqual(["S3", "S4", "S1", "S2"]);
  });

  it("uses the status tokens for the chips and no red", () => {
    expect(html).toContain("bg-neutral-tile-bg text-neutral-tile-ink");
    expect(html).toContain("bg-status-attention-bg text-status-attention-ink");
    expect(html).toContain("bg-status-success-bg text-status-success-ink");
    const rows = rowsOf(html)
      .map((match) => match[0])
      .join("");
    expect(rows).not.toMatch(/wrong|rose|red/);
  });

  it("makes a row ONE tap target at least 56px high", () => {
    const row = rowsOf(html)[0][0];
    expect(row.startsWith("<button")).toBe(true);
    expect(row).toContain("min-h-14");
    expect(row).toContain('type="button"');
  });

  it("lists all ten topics under Topics when there is no exam", () => {
    const noExam = render(seeded, { exam: null });
    expect(noExam).not.toContain(">In your exam<");
    expect(noExam).not.toContain("Other topics (");
    expect(rowsOf(noExam)).toHaveLength(10);
  });
});

describe("Progress: Activity and Recent sessions", () => {
  const html = render(seeded);

  it("has one compact line: sessions and answers", () => {
    const distinct = new Set(seeded.flatMap((session) => session.answers.map((a) => a.itemId)))
      .size;
    expect(html).toContain(`4 sessions · ${distinct} answers`);
  });

  it("shows the last 3 sessions, newest first, with mode, topic, count and human date", () => {
    const section = html.slice(html.indexOf(">Recent sessions<"));
    expect(section.match(/<li/g)).toHaveLength(3);
    expect(section.indexOf("Today, 10:37")).toBeLessThan(section.indexOf("Yesterday"));
    expect(section).toContain("Exam");
    expect(section).toContain("Practice");
    expect(section).toContain("Mini-quiz");
    expect(section).toContain("2 topics");
    expect(section).toMatch(/\d+ of \d+ correct/);
    expect(section).not.toContain("%");
    // the oldest session is not in the list
    expect(section).not.toContain("13 Oct");
  });

  it("gives a chevron and a link only to a session whose results screen exists", () => {
    const section = html.slice(html.indexOf(">Recent sessions<"));
    expect(section.match(/href="\/exam\/results"/g)).toHaveLength(1);
    expect(section.match(/lucide-chevron-right/g)).toHaveLength(1);
    expect(section.match(/data-session-row/g)).toHaveLength(2);
  });

  it("has See all, to the full list", () => {
    expect(html).toContain('href="/progress/sessions"');
    expect(html).toContain(">See all<");
  });

  it("shows records saved before mode and topics as Practice with no topic name", () => {
    const old = render([entry(s1.slice(0, 4), 2, day(2))]);
    const section = old.slice(old.indexOf(">Recent sessions<"));
    expect(section).toContain("Practice");
    expect(section).not.toContain("topics");
    expect(section).toContain("2 of 4 correct");
    expect(section).toContain("17 Oct");
  });
});

describe("Progress: the empty state", () => {
  const html = render([]);

  it("says there are no sessions and offers Choose a topic, with no Activity line or Recent sessions", () => {
    expect(html).toContain("No sessions yet. Start with Choose a topic.");
    expect(html).toContain('href="/training"');
    expect(html).toContain(">Choose a topic<");
    expect(html).not.toContain("data-activity");
    expect(html).not.toContain("Recent sessions");
  });

  it("still shows readiness and the topics", () => {
    expect(html).toContain("Readiness 0%");
    expect(rowsOf(html)).toHaveLength(4);
    expect(html).toContain(">Not started<");
  });
});

describe("the full session list", () => {
  const many = Array.from({ length: 25 }, (_, index) => entry(s1.slice(0, 2), 1, day(0, 8, index)));
  const list = (history: FinishedSession[]) =>
    renderToStaticMarkup(
      <SourceSheetProvider sections={loadAllSections()}>
        <SessionsListView history={history} now={NOW} />
      </SourceSheetProvider>,
    );

  it("has Back to Progress, the title and 10 rows with See more", () => {
    const html = list(many);
    expect(html).toContain('aria-label="Back to Progress"');
    expect(html).toContain(">Sessions</h1>");
    expect(html.match(/data-session-row/g)).toHaveLength(10);
    expect(html).toContain(">See more<");
  });

  it("has no See more with 10 sessions or fewer", () => {
    expect(list(many.slice(0, 10))).not.toContain("See more");
  });
});
