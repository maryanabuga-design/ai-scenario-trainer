import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProgressView } from "@/components/ProgressView/ProgressView";
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

  it("goes Readiness card, then By topic, and nothing after the topics", () => {
    const order = ["Exam readiness", ">By topic<", ">Other topics ("].map((text) =>
      html.indexOf(text),
    );
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html.slice(html.lastIndexOf("Other topics (")).split("</button>").pop()).not.toMatch(
      /<section|<h2/,
    );
  });

  it("no longer has the session blocks, the chart, the old cards or the status chips", () => {
    for (const gone of [
      "Recent sessions",
      "See all",
      "See more",
      "sessions ·",
      "answers</",
      "data-activity",
      "Result by session",
      "Weak topics",
      "Guide sections",
      "Session history",
      "Not started",
      "Needs work",
      ">Ready<",
      "No sessions yet",
    ]) {
      expect(html).not.toContain(gone);
    }
    expect(html).not.toContain("/progress/sessions");
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

describe("Progress: the change line", () => {
  const withReadiness = (values: (number | undefined)[]) =>
    values.map((readinessAfter, index) =>
      entry(s1.slice(0, 3), 2, day(values.length - index), {
        mode: "practice",
        topicIds: ["S1"],
        readinessAfter,
      }),
    );
  const lineOf = (html: string) => {
    const start = html.indexOf("data-readiness-change");
    return start < 0 ? null : html.slice(start, html.indexOf("</p>", start));
  };

  it("sits between the bar and the sentence, one line, 14px, with a truncating text", () => {
    const html = render(withReadiness([10, 18]));
    const line = lineOf(html)!;
    expect(line).toContain("type-small");
    expect(line).toContain("truncate");
    expect(html.indexOf('role="progressbar"')).toBeLessThan(html.indexOf("data-readiness-change"));
    expect(html.indexOf("data-readiness-change")).toBeLessThan(html.indexOf("Not ready yet"));
  });

  it("shows an up arrow with the success token for a rise, and neutral for no change or a drop", () => {
    // the current readiness is computed from the answers: the stored value only sets the delta
    const rise = lineOf(render(withReadiness([0, 5])))!;
    expect(/<svg[^>]*data-change-icon="up"[^>]*>/.exec(rise)![0]).toContain(
      "text-status-success-ink",
    );
    expect(rise).toMatch(/\+\d+ points? since your last session/);
    const drop = lineOf(render(withReadiness([99, 1])))!;
    expect(drop).toContain('data-change-icon="down"');
    expect(drop).toMatch(/-\d+ points? since your last session/);
    expect(drop).not.toContain("text-status-success-ink");
    for (const line of [rise, drop]) {
      expect(line).toContain("text-neutral-tile-ink");
      expect(line.replace(/<[^>]+>/g, "")).not.toContain("%");
      expect(line).not.toMatch(/wrong|rose|red|correct-text/);
    }
  });

  it("says No change with the dash icon", () => {
    const html = render(withReadiness([0, 0]));
    const current = /Readiness (\d+)%/.exec(html)![1];
    const same = lineOf(render(withReadiness([Number(current), Number(current)])))!;
    expect(same).toContain("No change since your last session");
    expect(same).toContain('data-change-icon="none"');
  });

  it("is not shown with one session, or when the previous record has no stored readiness", () => {
    expect(render(withReadiness([10]))).not.toContain("data-readiness-change");
    expect(render([])).not.toContain("data-readiness-change");
    expect(render(withReadiness([undefined, 12]))).not.toContain("data-readiness-change");
  });

  it("has no 3D slot: the title and the exam line use the full card width", () => {
    const card = render(seeded).slice(render(seeded).indexOf('aria-labelledby="exam-readiness"'));
    const head = card.slice(0, card.indexOf("data-readiness-number"));
    for (const gone of ["data-gauge-slot", "data-media3d", ">3D<", "pr-[72px]", "h-16 w-16"]) {
      expect(head).not.toContain(gone);
    }
    expect(head).toMatch(/data-readiness-exam[^>]*class="type-small truncate/);
  });
});

describe("Progress: By topic", () => {
  const html = render(seeded);

  it("lists the four exam topics, then Other topics (6) closed", () => {
    expect(html).toContain(">In your exam<");
    expect(html.indexOf(">In your exam<")).toBeLessThan(html.indexOf("Other topics (6)"));
    expect(html).toContain('aria-expanded="false"');
    expect(rowsOf(html)).toHaveLength(4);
    expect(html).not.toContain('data-topic-row="S6"');
  });

  it("is in number order inside the group", () => {
    const ids = rowsOf(html).map((match) => /data-topic-row="(S\d+)"/.exec(match[0])![1]);
    expect(ids).toEqual(["S1", "S2", "S3", "S4"]);
  });

  it("shows counts over ALL the topic's questions and no percentage, status or chip", () => {
    const rows = rowsOf(html).map((match) => match[0]);
    expect(rows.every((row) => /\d+ of \d+ correct/.test(row))).toBe(true);
    // the bar width is a style, not a shown number: look at the text only
    expect(rows.every((row) => !row.replace(/<[^>]+>/g, " ").includes("%"))).toBe(true);
    const s1Row = rows.find((row) => row.includes('data-topic-row="S1"'))!;
    expect(s1Row).toContain(`31 of ${s1.length} correct`);
    const s2Row = rows.find((row) => row.includes('data-topic-row="S2"'))!;
    expect(s2Row).toContain(`${s2.length} of ${s2.length} correct`);
    expect(rows.join("")).not.toMatch(/rounded-full whitespace-nowrap|bg-status-|bg-pastel-/);
  });

  it("makes each card exactly 80px high, with the title on one line cut by an ellipsis", () => {
    const row = rowsOf(html)[0][0];
    expect(row.startsWith("<button")).toBe(true);
    expect(row).toContain('type="button"');
    expect(row).toContain("h-[var(--list-card-height,80px)]");
    expect(row).toContain("items-center");
    expect(row).not.toContain("min-h-14");
    // the title: one line (truncate = nowrap + ellipsis), min-width 0 on its flex parent
    expect(row).toMatch(/<span[^>]*data-topic-title[^>]*>/);
    expect(row).toContain("type-body truncate");
    expect(row).toContain("flex min-w-0 flex-1 flex-col");
    // the complete title is in the text
    expect(row).toContain("Responding to an alarm");
  });

  it("has the shared chevron on the right of every card, and the bar inside the card", () => {
    for (const match of rowsOf(html)) {
      const row = match[0];
      expect(row).toContain("lucide-chevron-right");
      expect(row.indexOf("lucide-chevron-right")).toBeGreaterThan(row.indexOf("h-1.5"));
      expect(row).toContain("h-1.5 overflow-hidden rounded-full bg-secondary-sand");
    }
  });

  it("has Other topics as the shared underlined text button: no frame, no border, no background", () => {
    const start = html.lastIndexOf("<button", html.indexOf("Other topics ("));
    const control = html.slice(start, html.indexOf("</button>", start) + 9);
    expect(control).toContain('aria-expanded="false"');
    expect(control).toContain('aria-controls="other-topics"');
    // the tertiary button: 44px tap area, the label underlined with a 4px offset
    expect(control).toContain("type-action text-primary min-h-11");
    expect(control).toContain("underline decoration-1 underline-offset-4");
    expect(control).toContain("lucide-chevron-down");
    expect(control.slice(0, control.indexOf(">"))).not.toMatch(/\bborder|\bbg-|shadow/);
  });

  it("lists all ten topics under Topics, in order, when there is no exam", () => {
    const noExam = render(seeded, { exam: null });
    expect(noExam).not.toContain(">In your exam<");
    expect(noExam).not.toContain("Other topics (");
    expect(noExam).toContain(">Topics<");
    const ids = rowsOf(noExam).map((match) => /data-topic-row="(S\d+)"/.exec(match[0])![1]);
    expect(ids).toEqual(Array.from({ length: 10 }, (_, i) => `S${i + 1}`));
  });

  it("shows readiness and the topics with an empty history too", () => {
    const empty = render([]);
    expect(empty).toContain("Readiness 0%");
    expect(rowsOf(empty)).toHaveLength(4);
    expect(empty).not.toContain("No sessions yet");
  });
});
