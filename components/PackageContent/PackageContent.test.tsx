import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// the pinned bar normally renders through a portal; here it renders in place
vi.mock("@/components/ActionBar/ActionBar", () => ({
  ActionBarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ActionBar: ({ children }: { children: React.ReactNode }) => <div data-bar>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined, back: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { PackageCard } from "@/components/InstructorContent/PackageCard";
import {
  DocumentAnalysingView,
  STAGES,
} from "@/components/InstructorContent/DocumentAnalysingView";
import { PackageImportView } from "@/components/InstructorContent/PackageImportView";
import { MESSAGES } from "@/lib/document-read";
import { PackageTopicView } from "@/components/InstructorContent/PackageTopicView";
import {
  ChecklistCards,
  GuideSections,
  QuizRows,
  ScenarioCards,
} from "@/components/PackageContent/PackageParts";
import {
  PackageStudentScreen,
  fromTab,
  packagePaths,
} from "@/components/PackageContent/PackageStudentScreen";
import type { StudentPart } from "@/components/PackageContent/PackageStudentScreen";
import { blockingIssues, checkPackage, fixMessage, readPackage } from "@/lib/package-read";
import { flaggedItems } from "@/lib/package-review";
import type { PackageFile } from "@/lib/package-read";
import { createTopic } from "@/lib/packages";

const DIR = "public/templates/sample-package";
const sample = (name: string): PackageFile => {
  const bytes = readFileSync(`${DIR}/${name}`);
  return name.endsWith(".png")
    ? { name, size: bytes.length, dataUrl: `data:image/png;base64,${bytes.toString("base64")}` }
    : { name, size: bytes.length, text: bytes.toString("utf8") };
};
const clean = [
  "topic.csv",
  "guide.csv",
  "steps.csv",
  "scenario.csv",
  "questions.csv",
  "exit-sign.png",
  "assembly-point.png",
].map(sample);
const withProblems = [
  "guide.csv",
  "steps-with-problems.csv",
  "questions-with-problems.csv",
  "exit-sign.png",
  "assembly-point.png",
].map(sample);
const NOW = new Date(2026, 9, 31, 10, 0).getTime();
const topic = createTopic(
  readPackage(clean).data,
  "Evacuating a crowded hall",
  "How to leave.",
  NOW,
  [],
);
const bad = createTopic(readPackage(withProblems).data, "Problem topic", "", NOW, []);
const wrap = (node: React.ReactNode) =>
  renderToStaticMarkup(<ActionBarProvider>{node}</ActionBarProvider>).replace(/<!-- -->/g, "");
const noop = () => undefined;

const importView = (extra: Partial<Parameters<typeof PackageImportView>[0]> = {}) =>
  wrap(
    <PackageImportView
      file={null}
      images={[]}
      onFile={noop}
      onRemove={noop}
      onSample={noop}
      onImages={noop}
      onRemoveImage={noop}
      onImport={noop}
      onCancel={noop}
      {...extra}
    />,
  );
const doc = { name: "evacuation-guide.xlsx", size: 34_000 };

describe("the import screen", () => {
  it("empty: ONE large dashed card, the muted line, two plain links, no What to include, Import disabled", () => {
    const html = importView();
    expect(html).toContain(">Import content</h1>");
    expect(html).toContain("Choose a document");
    expect(html).toContain("Excel (.xlsx), up to 10 MB");
    expect(html).toContain("border-dashed");
    expect(html).toContain('accept=".xlsx"');
    expect(html).not.toMatch(/multiple=""[^>]*data-file-input|data-file-input[^>]*multiple=""/);
    expect(html).toContain('href="/templates/guide-template.xlsx"');
    expect(html).not.toMatch(/What to include|include-panel|aria-expanded/);
    expect(html).not.toContain("Images (optional)".toUpperCase());
    expect(html).not.toContain("CSV");
    expect(html).not.toContain('name="topic-summary"');
    expect(html).toMatch(/disabled=""[^>]*>Import and review</);
    expect(html.indexOf("Import and review")).toBeLessThan(html.indexOf(">Cancel<"));
  });

  it("has the helper line in the header band and ONE row of two plain underlined links, edges aligned, no icons, border or fill", () => {
    const html = importView();
    const band = html.slice(html.indexOf("data-page-header-band"), html.indexOf("</h1>") + 700);
    expect(band).toContain(
      "Upload one Excel document. We will read it and prepare a draft topic for you to review.",
    );
    expect(band).toContain("data-helper");
    expect(band).toContain("text-text-secondary");
    expect(band).toContain("line-clamp-2");
    expect(html.indexOf("data-helper")).toBeGreaterThan(html.indexOf(">Import content</h1>"));
    const row = html.slice(html.indexOf("data-actions-row"), html.indexOf("</section>"));
    expect(row).toContain("-mx-3 flex items-center justify-between");
    expect(row).toMatch(/underline[^>]*>Download blank template</);
    expect(row).toMatch(/underline[^>]*>Try an example</);
    // the visible text is the accessible name: "Download blank template" and "Try an example"
    expect(row).toContain('href="/templates/guide-template.xlsx"');
    expect(row.match(/min-h-11/g)).toHaveLength(2);
    expect(row).not.toMatch(
      /<svg|bg-card|bg-olive-tint|border-selectable-stroke|rounded-button border/,
    );
    expect(row.indexOf("Download blank template")).toBeLessThan(row.indexOf("Try an example"));
    expect(html).not.toMatch(/What to include|Blank template<|Use sample document/);
  });

  it("a file chosen: the dashed card is replaced by ONE file card with a corner x, the Images row appears, Import is enabled", () => {
    const html = importView({ file: doc });
    expect(html).toContain("evacuation-guide.xlsx");
    expect(html).toContain("33 KB");
    expect(html).not.toContain("data-drop-area");
    expect(html.match(/data-file-card/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Remove file"');
    // ONE row, 12px padding on all sides, everything vertically centred, the card radius (not a pill)
    const card = html.slice(html.indexOf("data-file-card"), html.indexOf("data-file-card") + 400);
    expect(card).toContain(
      "flex items-center gap-3 rounded-card border border-selectable-stroke bg-card p-3",
    );
    // the x: a 32px tile in a 44px tap area, in the row, 6px reaching into the 12px padding
    const corner = html.slice(html.indexOf('aria-label="Remove file"') - 160);
    expect(corner).toContain("-mr-1.5 flex h-11 w-11");
    expect(corner).toMatch(/h-8 w-8[^"]*rounded-full bg-neutral-tile-bg/);
    expect(corner).not.toContain("absolute");
    expect(html).toContain("IMAGES (OPTIONAL)");
    expect(html).toMatch(/bg-olive-tint[^>]*>Add images</);
    expect(html).toContain("You can also add them later.");
    expect(html).not.toMatch(/disabled=""[^>]*>Import and review</);
    expect(html).toContain('accept=".png,.jpg,.jpeg,.webp"');
  });

  it("shows each added picture as a compact row (a 40px thumbnail, the name, a small x) and no sentence", () => {
    const html = importView({
      file: doc,
      images: [
        { name: "exit-sign.png", src: "data:image/png;base64,AA" },
        { name: "assembly-point.png", src: "data:image/png;base64,AA" },
      ],
    });
    expect(html.match(/data-image-row=/g)).toHaveLength(2);
    expect(html).not.toMatch(/images added|image added|You can also add them later/);
    const row = html.slice(html.indexOf("data-image-row="));
    expect(row).toContain('width="40" height="40"');
    expect(row).toContain("h-10 w-10");
    expect(row).toContain("exit-sign.png");
    expect(row).toContain('aria-label="Remove exit-sign.png"');
    expect(row).toContain("rounded-panel border border-selectable-stroke bg-card");
    expect(row).toContain("h-8 w-8");
    expect(row).toContain("h-11 w-11");
    // nothing added: no rows and the muted line
    const none = importView({ file: doc });
    expect(none).not.toContain("data-image-row=");
    expect(none).toContain("You can also add them later.");
  });

  it("each message shows under the file card and blocks the Primary", () => {
    for (const message of [MESSAGES.type, MESSAGES.size, MESSAGES.empty, MESSAGES.noGuide]) {
      const html = importView({ file: doc, message });
      expect(html).toContain(message);
      expect(html.indexOf("data-file-card")).toBeLessThan(html.indexOf(message));
      expect(html).toMatch(/disabled=""[^>]*>Import and review</);
    }
    expect(MESSAGES.type).toBe("This file type is not supported. Use an Excel file (.xlsx).");
  });

  it("has exactly one Primary, the old several-files wording is gone, and Replace document says what it replaces", () => {
    const html = importView({ file: doc, notice: "The new document replaces the content of T." });
    expect(html.match(/h-\[52px\] bg-primary/g)).toHaveLength(1);
    for (const gone of [
      "choose them together",
      "Choose files",
      "Download templates",
      "sample package",
    ]) {
      expect(html).not.toContain(gone);
    }
    expect(html).toContain("The new document replaces the content of T.");
  });
});

describe("the analysing screen", () => {
  const results = [
    "5 sheets read",
    "4 found",
    "7 steps, 4 scenario steps",
    "10 questions",
    "all linked",
  ];
  const counts = { guide: 4, steps: 7, scenario: 4, questions: 10 };
  const view = (over: Partial<Parameters<typeof DocumentAnalysingView>[0]> = {}) =>
    wrap(
      <DocumentAnalysingView
        fileName="evacuation-guide.xlsx"
        phase="running"
        done={2}
        results={results}
        counts={counts}
        onCancel={noop}
        onContinue={noop}
        onChooseAnother={noop}
        onOpenDraft={noop}
        onBackToContent={noop}
        {...over}
      />,
    );

  it("running: a centred 160px picture, the title, the file name, five compact stage rows with real results, the calm line, only Cancel", () => {
    const html = view();
    expect(html).toContain("items-center gap-4 pt-6 pb-4 text-center");
    expect(html).toContain('src="/images/instructor/import-analysing.webp"');
    expect(html).toContain("h-40 w-40");
    expect(html.indexOf("data-art")).toBeLessThan(html.indexOf(">Reading your document…</h1>"));
    expect(html.indexOf(">Reading your document…</h1>")).toBeLessThan(
      html.indexOf("data-file-name"),
    );
    expect(html.indexOf("data-file-name")).toBeLessThan(html.indexOf("data-stages"));
    expect(html).toContain("evacuation-guide.xlsx");
    for (const label of STAGES) expect(html).toContain(label);
    expect(html).toContain("w-full max-w-[360px]");
    expect(html.match(/data-stage="done"/g)).toHaveLength(2);
    expect(html.match(/data-stage="current"/g)).toHaveLength(1);
    expect(html.match(/data-stage="waiting"/g)).toHaveLength(2);
    // done: a check in a round success tile; current: a spinner and a static dot for reduced motion
    expect(html.match(/rounded-full bg-status-success-bg text-status-success-ink/g)).toHaveLength(
      2,
    );
    expect(html).toContain("animate-spin motion-reduce:hidden");
    expect(html).toContain("data-static-dot");
    expect(html).toContain("motion-reduce:block");
    expect(html).toContain("5 sheets read");
    expect(html).toContain("4 found");
    expect(html).not.toContain("10 questions");
    expect(html).toContain("This is a draft. You will review everything before it is published.");
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toMatch(/<button[^>]*>Cancel</);
    expect(html).not.toMatch(/%|thinking|\bAI\b/);
    expect(html.match(/h-\[52px\] bg-primary/g)).toBeNull();
  });

  it("finished: the stage rows collapse, the success picture, a summary card with no badge, the counts and the Links to the guide row", () => {
    const html = view({ phase: "finished", done: 5 });
    expect(html).toContain(">Draft is ready</h1>");
    expect(html).toContain('src="/images/instructor/import-success.webp"');
    expect(html).not.toContain("data-stages");
    expect(html).not.toContain("data-stage=");
    const card = html.slice(html.indexOf("data-summary"));
    // a full-width white card, 1px border, radius 16, 12px side padding; no 360px maximum
    expect(card).toContain(
      "w-full rounded-[16px] border border-selectable-stroke bg-card px-4 py-1",
    );
    expect(card).not.toContain("max-w-[360px]");
    expect(card).not.toMatch(/data-badge|h-14 w-14|bg-status-success-bg/);
    expect(card.indexOf("<dl")).toBeLessThan(card.indexOf("data-links-row"));
    expect(card.slice(0, 400)).toContain("data-counts");
    // five rows: the compact tile with its icon (aria-hidden), the label and a plain value
    expect(card.match(/data-icon-tile=/g)).toHaveLength(5);
    expect(card.match(/aria-hidden="true"/g)?.length).toBeGreaterThanOrEqual(5);
    expect(card.match(/h-9 w-9 rounded-full text-icon-muted/g)).toHaveLength(5);
    // the icons: 18px, 1.5px stroke (kept at 1.5px by the absolute stroke width), muted ink
    expect(card.match(/width="18" height="18"/g)).toHaveLength(5);
    expect(card.match(/stroke-width="2"/g)).toHaveLength(5);
    expect(card.match(/min-h-14/g)).toHaveLength(5);
    for (const [label, value, icon] of [
      ["Guide sections", 4, "lucide-book-open"],
      ["Steps", 7, "lucide-layers"],
      ["Scenario steps", 4, "lucide-mountain-snow"],
      ["Questions", 10, "lucide-message-circle-question"],
    ] as const) {
      const row = card.slice(
        card.indexOf(`>${label}</dt>`) - 700,
        card.indexOf(`>${label}</dt>`) + 200,
      );
      expect(row, label).toContain(icon);
      expect(card).toMatch(
        new RegExp(
          `text-text-secondary">${label}</dt><dd class="type-body-strong shrink-0 text-right tabular-nums">${value}</dd>`,
        ),
      );
    }
    // one hairline between neighbouring rows: it starts at the label (after the tile and the gap)
    expect(card.match(/before:left-12/g)?.length).toBeGreaterThanOrEqual(5);
    const links = card.slice(card.indexOf("data-links-row"));
    expect(links).toContain("Links to the guide");
    expect(links).toContain("lucide-link");
    expect(links).toMatch(/text-status-success-ink">All linked</);
    // the values are plain text: no pill, background or border on a value
    expect(card).not.toMatch(/<dd[^>]*(bg-|border|rounded)/);
    const problems = view({ phase: "finished", done: 5, linkProblems: 3 });
    expect(problems).toMatch(
      /type-body-strong shrink-0 text-right text-status-attention-ink">3 need attention</,
    );
    expect(problems).not.toMatch(/<dd[^>]*(bg-|border|rounded)/);
    // Primary Open draft over Secondary Back to Content; no Review or Preview here
    expect(html).toMatch(/h-\[52px\] bg-primary[^>]*>Open draft</);
    expect(html).toMatch(/bg-olive-tint[^>]*>Back to Content</);
    expect(html.match(/h-\[52px\] bg-primary/g)).toHaveLength(1);
    expect(html).not.toMatch(/Review \d|Preview as student/);
  });

  it("partial: centred with the neutral icon, the missing part sentence, Primary Continue over Secondary Choose another file", () => {
    const html = view({
      phase: "partial",
      done: 5,
      partialLine: "We could not find questions in this document.",
    });
    expect(html).toContain("text-center");
    expect(html).toContain("data-art-fallback");
    expect(html).not.toContain("data-art ");
    expect(html).toContain("We could not find questions in this document.");
    expect(html).toMatch(/h-\[52px\] bg-primary[^>]*>Continue</);
    expect(html).toMatch(/bg-olive-tint[^>]*>Choose another file</);
  });

  it("error: centred with the neutral icon, the plain sentence, Primary Choose another file over Secondary Cancel, no stages", () => {
    const html = view({ phase: "error", done: 0 });
    expect(html).toContain("data-art-fallback");
    expect(html).toContain("We could not read this file. Try another file.");
    expect(html).toMatch(/h-\[52px\] bg-primary[^>]*>Choose another file</);
    expect(html).toMatch(/bg-olive-tint[^>]*>Cancel</);
    expect(html).not.toContain("data-stages");
  });

  it("the two pictures exist as 640px webp files; the success one has an alpha channel", () => {
    for (const name of ["import-analysing", "import-success"]) {
      const bytes = readFileSync(`public/images/instructor/${name}.webp`);
      expect(bytes.subarray(0, 4).toString()).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString()).toBe("WEBP");
      expect(bytes.length).toBeLessThan(80 * 1024);
    }
  });
});

describe("the review screen", () => {
  const render = (over: Partial<Parameters<typeof PackageTopicView>[0]> = {}) => {
    const topicOver = over.topic ?? topic;
    return wrap(
      <PackageTopicView
        topic={topicOver}
        tab="guide"
        issues={checkPackage(topicOver)}
        now={NOW}
        dialog={null}
        onTab={noop}
        onAsk={noop}
        onConfirm={noop}
        onCancelDialog={noop}
        onReview={noop}
        onPreview={noop}
        onEditDetails={noop}
        onReplace={noop}
        dialogInline
        {...over}
      />,
    );
  };
  const group = (html: string) =>
    html.slice(html.indexOf('role="radiogroup"'), html.indexOf("</fieldset>"));

  it("shows no demo code, the meta line 'Draft · Last edited today' and the coverage line", () => {
    const html = render();
    expect(html).not.toMatch(/\bN\d\b/);
    const meta = html.slice(html.indexOf("data-package-status"), html.indexOf("data-coverage"));
    expect(meta.replace(/<[^>]+>/g, "")).toContain("Draft · Last edited today");
    expect(html).toContain("Guide sections used: 4 of 4");
    expect(html).toContain('aria-label="Back to Content"');
  });

  it("clean: ONE success Notice 'All items checked', no pills, Publish and Preview offered", () => {
    const html = render();
    expect(html.match(/data-notice=/g)).toHaveLength(1);
    expect(html).toContain('data-notice="success"');
    expect(html).toContain("All items checked");
    expect(html).toContain("Preview as student, then publish.");
    expect(html).not.toContain('data-notice="to-fix"');
    expect(html).not.toContain("data-issue-pill");
    expect(html).not.toContain("data-tab-dot");
    expect(html).toContain("data-pencil");
  });

  it("a published topic is read-only: no pencils on any tab", () => {
    const published = { ...topic, status: "published" as const };
    for (const tab of ["guide", "steps", "scenario", "quiz"] as const) {
      const html = render({ topic: published, tab });
      expect(html, tab).not.toMatch(/data-pencil|Edit /);
    }
  });

  it("with issues: ONE notice with the number of items to review and the items per part", () => {
    const html = render({ topic: bad });
    expect(flaggedItems(checkPackage(bad))).toHaveLength(6);
    expect(html.match(/data-notice=/g)).toHaveLength(1);
    const notice = html.slice(html.indexOf('data-notice="to-fix"'), html.indexOf("</section>"));
    expect(notice).toContain("6 items to review");
    expect(notice).toContain("Steps 2 · Quiz 4");
    expect(notice).not.toMatch(/<a |<button/);
    expect(html).not.toContain("to fix in this tab");
    expect(html).not.toContain("Needs attention");
  });

  it("the four-option selector stays on one line, has no dot and keeps accessible names", () => {
    const html = render({ topic: bad, tab: "steps" });
    const radios = group(html);
    for (const label of ["Guide", "Steps", "Scenario", "Quiz"]) expect(radios).toContain(label);
    expect(radios.match(/whitespace-nowrap/g)).toHaveLength(4);
    expect(html).not.toContain("data-tab-dot");
    expect(radios).toContain('aria-label="Steps, 2 to review"');
    expect(radios).toContain('aria-label="Quiz, 4 to review"');
    expect(radios).not.toContain('aria-label="Guide');
  });

  it("item cards: at most one small text pill with the most important issue, no reason lists, a pencil on every card", () => {
    const steps = render({ topic: bad, tab: "steps" });
    expect(steps.match(/data-issue-pill="must"/g)).toHaveLength(2);
    expect(steps).toMatch(
      /data-issue-pill="must"[^>]*bg-status-attention-bg[^>]*>Guide section 7 does not exist</,
    );
    expect(steps).toMatch(/data-issue-pill="must"[^>]*>No action</);
    expect(steps).not.toContain(">To fix<");
    expect(steps).not.toContain("Edit question");
    expect(steps).not.toContain("Replace files</span></a></div><p");
    // one corner pencil on every step card, named after the step, 44px
    expect(steps.match(/data-pencil/g)).toHaveLength(7);
    expect(steps).toContain('aria-label="Edit step 3 of When the alarm sounds"');
    expect(steps).toMatch(/data-pencil[^>]*h-11 w-11/);
    const quiz = render({ topic: bad, tab: "quiz" });
    expect(quiz.match(/data-issue-pill=/g)).toHaveLength(4);
    expect(quiz.match(/data-pencil/g)).toHaveLength(10);
    expect(quiz).toContain('aria-label="Edit question 4"');
    expect(quiz).toContain(`href="/instructor/content/package/${bad.id}/edit/questions-3"`);
    // no yellow card background on an item
    expect(quiz.slice(quiz.indexOf("data-quiz-row"))).not.toMatch(
      /rounded-card[^"]*bg-status-attention-bg/,
    );
  });

  it("a please-confirm item has the neutral pill and counts as an item to review", () => {
    const withConfirm = {
      ...topic,
      questions: topic.questions!.map((q, i) => (i === 1 ? { ...q, refAuto: true } : q)),
    };
    const html = render({ topic: withConfirm, tab: "quiz" });
    expect(html.match(/data-issue-pill=/g)).toHaveLength(1);
    expect(html).toMatch(/data-issue-pill="confirm"[^>]*bg-neutral-tile-bg[^>]*>Please confirm</);
    expect(html).toContain("1 item to review");
    expect(html).toMatch(/h-\[52px\] bg-primary[^>]*>Review 1 item</);
  });

  it("the meta row is 'Draft · Last edited today' with no Replace files link (it moved into the menu)", () => {
    const html = render();
    const meta = html.slice(html.indexOf("data-package-status"), html.indexOf("data-coverage"));
    expect(meta.replace(/<[^>]+>/g, "")).toContain("Draft · Last edited today");
    expect(meta).not.toContain("Replace");
  });

  it("has Back on the left and a ⋯ More actions button on the right; Delete is in its menu, not in the pinned area", () => {
    const closed = render();
    expect(closed).toContain('aria-label="More actions"');
    expect(closed).toContain('aria-haspopup="menu"');
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("lucide-ellipsis");
    expect(closed).toContain("h-11 w-11");
    expect(closed).not.toContain('role="menu"');
    expect(closed).not.toContain("Delete topic");
    expect(closed.indexOf('aria-label="Back to Content"')).toBeLessThan(
      closed.indexOf('aria-label="More actions"'),
    );
    const open = render({ menuOpen: true });
    expect(open).toContain('role="menu"');
    const items = [...open.matchAll(/role="menuitem"[^>]*>([^<]*)</g)].map((m) => m[1]);
    expect(items).toEqual(["Edit title and summary", "Replace document…", "Delete topic"]);
    expect(open).toMatch(/text-wrong-text[^>]*>Delete topic</);
    expect(open.slice(open.indexOf("data-bar"))).not.toContain("Delete topic");
  });

  it("the pinned area has exactly the right buttons in each state: items to review, nothing left, published", () => {
    const bar = (html: string) => html.slice(html.indexOf("data-bar"));
    const buttons = (html: string) =>
      [...bar(html).matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map((m) =>
        m[1].replace(/<[^>]+>/g, "").trim(),
      );
    const primaries = (html: string) => bar(html).match(/h-\[52px\] bg-primary/g)?.length ?? 0;
    const issues = render({ topic: bad });
    expect(buttons(issues)).toEqual(["Review 6 items", "Preview as student"]);
    expect(primaries(issues)).toBe(1);
    expect(bar(issues)).not.toMatch(/disabled=/);
    // Publish is never offered while something is flagged
    expect(issues).not.toContain(">Publish<");
    const cleanHtml = render();
    expect(buttons(cleanHtml)).toEqual(["Publish", "Preview as student"]);
    expect(primaries(cleanHtml)).toBe(1);
    expect(bar(cleanHtml)).not.toMatch(/disabled=/);
    const published = render({ topic: { ...topic, status: "published" } });
    expect(buttons(published)).toEqual(["Preview as student", "Unpublish"]);
    expect(primaries(published)).toBe(1);
    expect(published).toContain(
      "Visible to students in Materials, in the section From your instructor.",
    );
    for (const html of [issues, cleanHtml, published]) {
      expect(buttons(html).length).toBeLessThanOrEqual(2);
      expect(html).not.toContain("Show next issue");
    }
  });

  it("disables a missing part and shows a calm card", () => {
    const small = createTopic(
      readPackage([sample("guide.csv"), sample("exit-sign.png"), sample("assembly-point.png")])
        .data,
      "Only guide",
      "",
      NOW,
      [],
    );
    const html = render({ topic: small, tab: "steps" });
    expect(html).toContain("This package has no steps.");
    expect(group(html).match(/disabled=""/g)).toHaveLength(3);
  });

  it("has the three dialogs with their words", () => {
    const publish = render({ dialog: "publish" });
    expect(publish).toContain("Publish this demo topic?");
    expect(publish).toContain(">Keep editing<");
    const unpublish = render({ dialog: "unpublish", topic: { ...topic, status: "published" } });
    expect(unpublish).toContain("Unpublish this demo topic?");
    expect(unpublish).toContain(">Keep published<");
    const remove = render({ dialog: "delete" });
    expect(remove).toContain("Delete this topic?");
    expect(remove).toContain(">Keep it<");
  });
});

describe("the issues of a package and the guided review", () => {
  const issues = checkPackage(bad);

  it("the review visits every flagged item in order (Guide, Steps, Scenario, Quiz; items in order)", () => {
    const items = flaggedItems(issues);
    expect(items.map((item) => item.key)).toEqual([
      "steps:0:2",
      "steps:1:1",
      "questions:3",
      "questions:4",
      "questions:6",
      "questions:9",
    ]);
    expect(items.every((item) => item.kind === "must")).toBe(true);
    expect(blockingIssues(issues)).toHaveLength(6);
  });

  it("words the reopened import with what to fix in that tab", () => {
    const message = fixMessage(issues, "steps");
    expect(message).toContain("Guide section 7 does not exist");
    expect(message).toContain("No action");
    expect(message).not.toContain("Q004");
  });
});

describe("the Content root card", () => {
  it("is a fixed 88px card with the parts, a Draft pill and an amber 'to fix' count", () => {
    const html = renderToStaticMarkup(<PackageCard topic={topic} />);
    expect(html).toContain("h-[88px]");
    expect(html).toContain("Guide · Steps · Scenario · 10 questions");
    expect(html).toContain("Draft");
    expect(html).not.toContain("to fix");
    const flagged = renderToStaticMarkup(<PackageCard topic={bad} />);
    expect(flagged).toContain("6 to fix");
    expect(flagged).not.toContain("need attention");
  });
});

describe("plain text everywhere", () => {
  it("shows script text as text, never as HTML", () => {
    const text =
      'section,title,text,image_file,alt_text\n1,<script>alert(1)</script>,"<img src=x onerror=alert(1)>",,\n';
    const data = readPackage([{ name: "g.csv", size: text.length, text }]).data;
    const html = renderToStaticMarkup(<GuideSections data={data} />);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    const scenario = renderToStaticMarkup(
      <ScenarioCards
        data={{
          ...data,
          scenario: [
            {
              step: 1,
              situation: "<b>x</b>",
              question: "<i>q</i>",
              options: ["<u>a</u>", "b", "", ""],
              correct: "a",
              why: "<s>w</s>",
              guideRef: "1",
              imageFile: "",
              alt: "",
            },
          ],
        }}
        guideHref={(s: string) => `#${s}`}
      />,
    );
    expect(scenario).not.toContain("<b>x</b>");
    expect(scenario).toContain("&lt;b&gt;x&lt;/b&gt;");
    // the student's reading screen draws the same text as text
    const screen = wrap(<PackageStudentScreen id="x" title="T" data={data} part="guide" />);
    expect(screen).not.toContain("<script>");
    expect(screen).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

describe("the instructor's tab keeps the review components; the student screens have no tick state", () => {
  it("is read-only cards: no tick, no checked state and nothing saved", () => {
    const html = renderToStaticMarkup(<ChecklistCards data={topic} />);
    expect(html).toContain("When the alarm sounds");
    expect(html).not.toMatch(/type="checkbox"|aria-checked|role="checkbox"|role="switch"/);
    expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/checklist/i);
    for (const file of [
      "components/PackageContent/PackageParts.tsx",
      "components/PackageContent/PackageStudentScreen.tsx",
      "components/StepsView/StepCard.tsx",
    ]) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/localStorage|createStore|checkbox/);
    }
  });
});

describe("preview parity: the student route and the preview route draw the same screens", () => {
  /** The visible text, the headings and the buttons and links, without the preview bar. */
  const shape = (html: string) => {
    const withoutBar = html.replace(/<span[^>]*data-preview-label[^>]*>[\s\S]*?<\/span>/, "");
    const text = withoutBar
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<[^>]+>/g, "\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const headings = [...withoutBar.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)].map(
      (match) => `${match[1]}:${match[2].replace(/<[^>]+>/g, "")}`,
    );
    const actions = [...withoutBar.matchAll(/<(button|a)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(
      (match) => `${match[1]}:${match[2].replace(/<[^>]+>/g, "").trim()}`,
    );
    const images = [...withoutBar.matchAll(/<img[^>]*alt="([^"]*)"/g)].map((match) => match[1]);
    return { text, headings, actions, images };
  };
  const draw = (part: StudentPart, preview: boolean) =>
    wrap(
      <PackageStudentScreen
        id={topic.id}
        title={topic.title}
        data={topic}
        part={part}
        preview={preview}
      />,
    );

  for (const part of ["guide", "steps", "scenario", "quiz"] as const) {
    it(`${part}: the same headings, texts, pictures and buttons; only the small Preview label is added`, () => {
      const student = draw(part, false);
      const preview = draw(part, true);
      expect(student).not.toContain("data-preview-label");
      expect(preview).toContain("data-preview-label");
      expect(preview.match(/data-preview-label/g)).toHaveLength(1);
      // no banner and no Exit preview anywhere
      for (const html of [student, preview]) {
        expect(html).not.toMatch(/Previewing as student|Exit preview|data-preview-bar/);
      }
      const a = shape(student);
      const b = shape(preview);
      expect(b.headings).toEqual(a.headings);
      expect(b.images).toEqual(a.images);
      expect(b.actions).toEqual(a.actions);
      expect(b.text).toEqual(a.text);
      expect(a.text.length).toBeGreaterThan(5);
    });
  }

  it("the guide is the built-in reading screen: header, label, headings, images with alt text, Practise (Primary) and the step guide button (Secondary)", () => {
    const html = draw("guide", false);
    expect(html).toContain("data-reading-header");
    expect(html).toContain("From your instructor");
    expect(html).toMatch(/type-page-title">Evacuating a crowded hall</);
    expect(html).toContain("min read");
    expect(html).toContain("type-card-title");
    expect(html).toContain('alt="Green exit sign above a door"');
    expect(html).toMatch(/bg-primary[^>]*>Practise this topic</);
    expect(html).toMatch(
      /bg-olive-tint[^>]*href="\/materials\/package\/[a-z0-9]+\/steps"[^>]*>Step guide for this topic<|href="\/materials\/package\/[a-z0-9]+\/steps"[^>]*bg-olive-tint[^>]*>Step guide for this topic</,
    );
    // no custom card layout, no hub, no placeholder text, no highlight tip
    expect(html).not.toContain("Read the guide");
    expect(html).not.toContain("(no ");
    expect(html).not.toContain("Tip: select text");
    expect(html).not.toMatch(/READ<|PRACTISE</);
  });

  it("the Step guide button is hidden when the topic has no steps", () => {
    const noSteps = createTopic(
      readPackage([
        sample("guide.csv"),
        sample("questions.csv"),
        sample("exit-sign.png"),
        sample("assembly-point.png"),
      ]).data,
      "No steps",
      "",
      NOW,
      [],
    );
    const html = wrap(
      <PackageStudentScreen id={noSteps.id} title="No steps" data={noSteps} part="guide" />,
    );
    expect(html).toContain("Practise this topic");
    expect(html).not.toContain("Step guide for this topic");
  });

  it("the step guide is the built-in step guide screen with the same summary card and step cards", () => {
    const html = draw("steps", false);
    expect(html).toContain("Step-by-step guide");
    expect(html).toContain("7 steps");
    expect(html).toMatch(/Step 1/i);
    expect(html).toContain("Stop what you are doing");
    expect(html).not.toContain("(no action)");
    expect(html).not.toMatch(/checkbox|aria-checked/);
  });

  it("the scenario and the quiz are the shared question screen: top bar, step strip, Check, no bookmark and no hint", () => {
    for (const part of ["scenario", "quiz"] as const) {
      const html = draw(part, false);
      expect(html).toContain("1 of ");
      expect(html).toContain("Choose one answer");
      expect(html).toMatch(/disabled=""[^>]*>Check</);
      expect(html).not.toContain("Save question");
      expect(html).not.toContain('aria-label="Hint"');
      expect(html).not.toMatch(/AI|bot\b/);
    }
  });
});

describe("one edit pattern for all four tabs", () => {
  const edit = (key: string) => `/edit/${key}`;
  const html = wrap(
    <>
      <GuideSections data={topic} editHref={edit} />
      <ChecklistCards data={topic} editHref={edit} />
      <ScenarioCards data={topic} guideHref={() => "#"} editHref={edit} />
      <QuizRows data={topic} editHref={edit} />
    </>,
  );
  const pencils = [...html.matchAll(/<a [^>]*data-pencil[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);

  it("is one shared pencil: a 32px sand tile in a 44px tap area, labelled Edit <item>, one per card", () => {
    expect(pencils.length).toBe(4 + 7 + 4 + 10);
    for (const pencil of pencils) {
      expect(pencil).toContain("h-11 w-11");
      expect(pencil).toContain("h-8 w-8");
      expect(pencil).toContain("rounded-full bg-neutral-tile-bg text-neutral-tile-ink");
      expect(pencil).toMatch(/aria-label="Edit [^"]+"/);
      expect(pencil).toContain("absolute top-[6px] right-[6px]");
    }
  });

  it("no card has a chevron, an expand control, a second link or an Edit button", () => {
    expect(html).not.toMatch(
      /aria-expanded|lucide-chevron|data-edit-step|data-quiz-open|role="region"|inert/,
    );
    expect(html).not.toContain(">Edit step<");
    // on Steps and Quiz the only links are the pencils (the guide pill belongs to the scenario cards)
    const steps = html.slice(html.indexOf("data-checklist"), html.indexOf("data-scenario-step"));
    const quiz = html.slice(html.indexOf("data-quiz-row"));
    expect([...steps.matchAll(/<a /g)]).toHaveLength(7);
    expect([...quiz.matchAll(/<a /g)]).toHaveLength(10);
  });

  it("a step card shows STEP n, the action, the muted detail and the GUIDE SECTION block", () => {
    const card = html.slice(html.indexOf('data-step-card="0-1"'));
    const one = card.slice(0, card.indexOf("</li>"));
    expect(one).toContain("STEP 2");
    expect(one).toContain("Find the nearest marked exit");
    expect(one).toContain("Follow the green exit signs.");
    expect(one).toContain("text-text-secondary");
    expect(one).toMatch(/GUIDE SECTION<\/span><p[^>]*>1\. Know your exits</);
    expect(one).not.toContain("Based on");
    expect(one).toContain("pr-[52px]");
  });

  it("a quiz card shows the question, CORRECT ANSWER with a success check and GUIDE SECTION, and no list of wrong options", () => {
    const card = html.slice(html.indexOf('data-quiz-row="0"'));
    const one = card.slice(0, card.indexOf('data-quiz-row="1"'));
    expect(one).toContain("What should you do first when you enter a crowded hall?");
    expect(one).toMatch(/CORRECT ANSWER<\/span>/);
    expect(one).toMatch(/lucide-check[^>]*text-status-success-ink/);
    expect(one).toContain("Find the two nearest exits");
    expect(one).toMatch(/GUIDE SECTION<\/span><p[^>]*>1\. Know your exits</);
    // the wrong options and the old lines are gone
    for (const wrong of ["Find a seat close to the stage", "Take a photo of the room"]) {
      expect(one).not.toContain(wrong);
    }
    expect(one).not.toMatch(/data-quiz-options|>Correct answer<|Based on/);
    // no green fill: the answer line has the text colour
    expect(one).not.toMatch(/bg-correct|bg-status-success-bg/);
    expect(one).toContain("pr-[52px]");
  });

  it("the labels use ONE style on both cards: small caps muted, 4.5:1 on white", () => {
    const labels = [
      ...html.matchAll(/<span class="([^"]*)">(?:GUIDE SECTION|CORRECT ANSWER)<\/span>/g),
    ];
    expect(labels.length).toBe(7 + 10 + 10);
    expect(new Set(labels.map((m) => m[1]))).toEqual(new Set(["type-label text-text-secondary"]));
    const css = readFileSync("app/globals.css", "utf8");
    const hex = (name: string) =>
      /#([0-9a-f]{6})/i.exec(new RegExp(`--${name}:\\s*([^;]+);`).exec(css)![1])![1];
    const luminance = (h: string) => {
      const c = [0, 2, 4]
        .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const [a, b] = [luminance(hex("text-secondary")), luminance("ffffff")].sort((x, y) => y - x);
    expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(4.5);
  });

  it("the scenario pencil is inside the situation card, whose text keeps 52px on the right; STEP stays above", () => {
    const step = html.slice(html.indexOf("data-scenario-step"));
    const card = step.slice(step.indexOf("data-situation-card"));
    expect(card.slice(0, card.indexOf("</section>"))).toContain(
      'aria-label="Edit scenario step 1"',
    );
    expect(card).toContain("pr-[52px]");
    expect(step.indexOf("STEP 1")).toBeLessThan(step.indexOf("data-situation-card"));
  });
});

describe("the preview card and the contextual preview", () => {
  const draw = (part: StudentPart, from: string) =>
    wrap(
      <PackageStudentScreen
        id={topic.id}
        title={topic.title}
        data={topic}
        part={part}
        preview
        from={from}
      />,
    );

  it("has no banner: the student screens start with their normal header and only a small Preview label is added", () => {
    for (const part of ["guide", "steps", "scenario", "quiz"] as const) {
      const html = draw(part, part);
      expect(html, part).not.toMatch(/Previewing as student|Exit preview|data-preview-bar/);
      expect(html, part).not.toContain('style="--preview-bar');
      expect(html.match(/data-preview-label/g), part).toHaveLength(1);
      const label = html.slice(
        html.lastIndexOf("<span", html.indexOf("data-preview-label")),
        html.indexOf("Preview</span>") + 14,
      );
      expect(label).toContain('aria-label="Preview mode"');
      expect(label).toContain('role="note"');
      expect(label).toContain("bg-secondary-sand");
      expect(label).toContain("text-text-secondary");
      expect(label).toContain("h-7");
      expect(label).toContain("rounded-full");
      expect(label).not.toMatch(/<a |<button|tabindex/);
    }
    // the guide screen has no extra top spacing and no previous / next arrows (a demo topic has none)
    const guide = draw("guide", "guide");
    expect(
      guide.startsWith(
        '<div class="flex flex-1 flex-col"><div class="flex flex-1 flex-col"><div class="flex flex-1 flex-col pb-',
      ),
    ).toBe(true);
    expect(guide).not.toContain("Previous topic");
  });

  it("the label is never in the real student flow", () => {
    const student = wrap(
      <PackageStudentScreen id={topic.id} title={topic.title} data={topic} part="guide" />,
    );
    expect(student).not.toContain("data-preview-label");
  });

  it("leaves to the topic screen on the same tab and carries the tab in every preview address", () => {
    for (const from of ["guide", "steps", "scenario", "quiz"]) {
      const paths = packagePaths(topic.id, true, from);
      expect(paths.leave).toBe(`/instructor/content/package/${topic.id}?tab=${from}`);
      expect(paths.reading).toContain(`?from=${from}`);
      expect(paths.steps).toContain(`?from=${from}`);
      expect(paths.guideSection("2")).toBe(
        `/instructor/content/package/${topic.id}/preview?from=${from}#section-2`,
      );
    }
    // a student goes to Materials and the addresses carry no tab
    expect(packagePaths(topic.id, false).leave).toBe("/materials");
    expect(packagePaths(topic.id, false).steps).not.toContain("from=");
    // an unknown tab falls back to the guide
    expect(fromTab("nonsense")).toBe("guide");
    expect(fromTab("quiz")).toBe("quiz");
    expect(fromTab(null)).toBe("guide");
  });

  it("opens the quiz and the scenario from the first question or step, and the steps as the step guide", () => {
    const quiz = draw("quiz", "quiz");
    expect(quiz).toContain("Question 1 of");
    const scenario = draw("scenario", "scenario");
    expect(scenario).toContain("Step 1 of");
    expect(draw("steps", "steps")).toContain("Step-by-step guide");
  });
});
