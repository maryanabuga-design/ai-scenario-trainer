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
import { PackageStudentScreen } from "@/components/PackageContent/PackageStudentScreen";
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
      onImport={noop}
      onCancel={noop}
      {...extra}
    />,
  );
const doc = { name: "evacuation-guide.xlsx", size: 34_000 };

describe("the import screen", () => {
  it("empty: ONE large dashed card, the muted line, two compact buttons, a collapsed What to include, Import disabled", () => {
    const html = importView();
    expect(html).toContain(">Import content</h1>");
    expect(html).toContain("Choose a document");
    expect(html).toContain("Excel (.xlsx), up to 10 MB");
    expect(html).toContain("border-dashed");
    expect(html).toContain('accept=".xlsx"');
    expect(html).not.toMatch(/multiple=""[^>]*data-file-input|data-file-input[^>]*multiple=""/);
    expect(html).toContain('href="/templates/guide-template.xlsx"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('id="include-panel"');
    expect(html).not.toContain("Images (optional)".toUpperCase());
    expect(html).not.toContain("CSV");
    expect(html).not.toContain('name="topic-summary"');
    expect(html).toMatch(/disabled=""[^>]*>Import and review</);
    expect(html.indexOf("Import and review")).toBeLessThan(html.indexOf(">Cancel<"));
  });

  it("has the helper line in the header band and ONE row of two equal outlined tertiary buttons with icons", () => {
    const html = importView();
    const band = html.slice(html.indexOf("data-page-header-band"), html.indexOf("</h1>") + 700);
    expect(band).toContain(
      "Upload one Excel document. We will read it and prepare a draft topic for you to review.",
    );
    expect(band).toContain("data-helper");
    expect(band).toContain("text-text-secondary");
    expect(band).toContain("line-clamp-2");
    expect(html.indexOf("data-helper")).toBeGreaterThan(html.indexOf(">Import content</h1>"));
    const row = html.slice(html.indexOf("data-actions-row"), html.indexOf("What to include"));
    expect(row).toContain("Blank template");
    expect(row).toContain("Try an example");
    expect(row).toContain('aria-label="Download blank template"');
    expect(row).toContain('aria-label="Try an example"');
    expect(row).toContain('href="/templates/guide-template.xlsx"');
    expect(row).toContain("lucide-download");
    expect(row).toContain("lucide-sparkles");
    // equal widths, 44px, white with a 1px border, radius 14, one line, no underline, no tint fill
    expect(row.match(/flex-1 basis-0/g)).toHaveLength(2);
    expect(row.match(/min-h-11/g)).toHaveLength(2);
    expect(row.match(/bg-card/g)).toHaveLength(2);
    expect(row.match(/border-selectable-stroke/g)).toHaveLength(2);
    expect(row.match(/rounded-button/g)).toHaveLength(2);
    expect(row.match(/whitespace-nowrap/g)).toHaveLength(2);
    expect(row).toContain("gap-3");
    expect(row).not.toMatch(/bg-olive-tint|underline/);
    expect(html).not.toContain("Use sample document");
  });

  it("What to include starts with the round info tint tile, then the title, then the chevron", () => {
    const html = importView();
    const row = html.slice(html.indexOf('aria-controls="include-panel"'));
    expect(row.indexOf("data-include-tile")).toBeLessThan(row.indexOf("What to include"));
    expect(row.indexOf("What to include")).toBeLessThan(row.indexOf("lucide-chevron-down"));
    expect(row).toContain("rounded-full bg-neutral-tile-bg");
  });

  it("What to include opens to five lines and the Section sentence; there is no question-set link", () => {
    const html = importView({ includeOpen: true });
    expect(html).toContain('aria-expanded="true"');
    const panel = html.slice(html.indexOf('id="include-panel"'));
    expect(panel.match(/<li /g)).toHaveLength(5);
    for (const line of [
      "Topic</span>: title and short description (required)",
      "Guide</span>: the text people read, in numbered sections (required)",
      "Steps</span>: short action lists (optional)",
      "Scenario</span>: situations with four answers (optional)",
      "Questions</span>: quiz questions (optional)",
    ]) {
      expect(panel, line).toContain(line);
    }
    expect(panel).toContain(
      "Steps, scenario steps and questions name the guide section they are based on (Section column).",
    );
    expect(html).not.toContain("Only questions?");
    expect(html).not.toContain("question set");
    expect(html).not.toContain("/import/questions");
  });

  it("a file chosen: the dashed card is replaced by ONE file card with a corner x, the Images row appears, Import is enabled", () => {
    const html = importView({ file: doc });
    expect(html).toContain("evacuation-guide.xlsx");
    expect(html).toContain("33 KB");
    expect(html).not.toContain("data-drop-area");
    expect(html.match(/data-file-card/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Remove file"');
    const corner = html.slice(html.indexOf('aria-label="Remove file"') - 160);
    expect(corner).toMatch(/absolute top-0 right-0 flex h-11 w-11/);
    expect(corner).toMatch(/h-7 w-7[^"]*rounded-full bg-neutral-tile-bg/);
    expect(html).toContain("IMAGES (OPTIONAL)");
    expect(html).toMatch(/bg-olive-tint[^>]*>Add images</);
    expect(html).toContain("You can also add them later.");
    expect(html).not.toMatch(/disabled=""[^>]*>Import and review</);
    expect(html).toContain('accept=".png,.jpg,.jpeg,.webp"');
  });

  it("lists the pictures that were added", () => {
    const html = importView({ file: doc, images: ["exit-sign.png", "assembly-point.png"] });
    expect(html).toContain("2 images added: exit-sign.png, assembly-point.png");
    expect(html).not.toContain("You can also add them later.");
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
        onReview={noop}
        onPreview={noop}
        onBackToContent={noop}
        {...over}
      />,
    );

  it("running: the file name, the title, five stages with states and the real results, the calm line, only Cancel", () => {
    const html = view();
    expect(html).toContain(">Reading your document…</h1>");
    expect(html).toContain("evacuation-guide.xlsx");
    for (const label of STAGES) expect(html).toContain(label);
    expect(html.match(/data-stage="done"/g)).toHaveLength(2);
    expect(html.match(/data-stage="current"/g)).toHaveLength(1);
    expect(html.match(/data-stage="waiting"/g)).toHaveLength(2);
    expect(html).toContain("5 sheets read");
    expect(html).toContain("4 found");
    expect(html).not.toContain("10 questions");
    expect(html).toContain("This is a draft. You will review everything before it is published.");
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toMatch(/<button[^>]*>Cancel</);
    expect(html).not.toMatch(/%|thinking|\bAI\b/);
    expect(html.match(/h-\[52px\] bg-primary/g)).toBeNull();
  });

  it("finished: Draft is ready with the counts, Primary Review N items over Secondary Back to Content", () => {
    const html = view({ phase: "finished", done: 5, reviewCount: 6 });
    expect(html).toContain(">Draft is ready</h1>");
    expect(html).toContain("Guide sections");
    expect(html.match(/data-stage="done"/g)).toHaveLength(5);
    expect(html).toMatch(/h-\[52px\] bg-primary[^>]*>Review 6 items</);
    expect(html).toMatch(/bg-olive-tint[^>]*>Back to Content</);
    expect(html.match(/h-\[52px\] bg-primary/g)).toHaveLength(1);
    expect(view({ phase: "finished", done: 5, reviewCount: 1 })).toContain("Review 1 item<");
  });

  it("finished with nothing to review offers Preview as student", () => {
    const html = view({ phase: "finished", done: 5, reviewCount: 0 });
    expect(html).toMatch(/h-\[52px\] bg-primary[^>]*>Preview as student</);
    expect(html).not.toContain("Review 0");
  });

  it("partial: the missing part sentence, Primary Continue over Secondary Choose another file", () => {
    const html = view({
      phase: "partial",
      done: 5,
      partialLine: "We could not find questions in this document.",
    });
    expect(html).toContain("We could not find questions in this document.");
    expect(html).toMatch(/h-\[52px\] bg-primary[^>]*>Continue</);
    expect(html).toMatch(/bg-olive-tint[^>]*>Choose another file</);
  });

  it("error: the plain sentence, Primary Choose another file over Secondary Cancel, no stages", () => {
    const html = view({ phase: "error", done: 0 });
    expect(html).toContain("We could not read this file. Try another file.");
    expect(html).toMatch(/h-\[52px\] bg-primary[^>]*>Choose another file</);
    expect(html).toMatch(/bg-olive-tint[^>]*>Cancel</);
    expect(html).not.toContain("data-stages");
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

  it("a published topic is read-only: no pencils, no Edit step buttons and no editing rows on any tab", () => {
    const published = { ...topic, status: "published" as const };
    for (const tab of ["guide", "steps", "scenario", "quiz"] as const) {
      const html = render({ topic: published, tab });
      expect(html, tab).not.toMatch(/data-pencil|data-edit-step|data-quiz-open|Edit /);
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
    // a step row only expands: no pencil; "Edit step" is in the expanded content, named after the step
    expect(steps).not.toContain("data-pencil");
    expect(steps.match(/data-edit-step/g)).toHaveLength(7);
    expect(steps).toContain('aria-label="Edit step 3 of When the alarm sounds"');
    expect(steps).toMatch(/data-edit-step[^>]*min-h-11/);
    const quiz = render({ topic: bad, tab: "quiz" });
    expect(quiz.match(/data-issue-pill=/g)).toHaveLength(4);
    // a question row opens its edit screen itself: no pencil
    expect(quiz).not.toContain("data-pencil");
    expect(quiz.match(/data-quiz-open/g)).toHaveLength(10);
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
  it("is read-only accordion cards: no tick, no checked state and nothing saved", () => {
    const html = renderToStaticMarkup(<ChecklistCards data={topic} guideHref={(s) => `#${s}`} />);
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
    const withoutBar = html.replace(/<div data-preview-bar[\s\S]*?<\/div>/, "");
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
    it(`${part}: the same headings, texts, pictures and buttons; only the preview bar is added`, () => {
      const student = draw(part, false);
      const preview = draw(part, true);
      expect(student).not.toContain("data-preview-bar");
      expect(preview).toContain("data-preview-bar");
      expect(preview).toContain("Previewing as student");
      expect(preview).toContain("Exit preview");
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

describe("the corner pencil", () => {
  const edit = (key: string) => `/edit/${key}`;
  const html = wrap(
    <>
      <GuideSections data={topic} editHref={edit} />
      <ChecklistCards data={topic} guideHref={() => "#"} editHref={edit} />
      <ScenarioCards data={topic} guideHref={() => "#"} editHref={edit} />
      <QuizRows data={topic} guideHref={() => "#"} editHref={edit} />
    </>,
  );
  const pencils = [...html.matchAll(/<a [^>]*data-pencil[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);

  it("is one shared component: a 32px sand tile in a 44px tap area, labelled Edit <item>", () => {
    expect(pencils.length).toBe(4 + 4);
    for (const pencil of pencils) {
      expect(pencil).toContain("h-11 w-11");
      expect(pencil).toContain("h-8 w-8");
      expect(pencil).toContain("rounded-full bg-neutral-tile-bg text-neutral-tile-ink");
      expect(pencil).toMatch(/aria-label="Edit [^"]+"/);
    }
  });

  it("sits 12px inside the corner (6px offsets for the 44px area) on guide, scenario and quiz cards", () => {
    for (const label of ["Edit Guide section 1", "Edit scenario step 1"]) {
      const pencil = pencils.find((p) => p.includes(`aria-label="${label}"`))!;
      expect(pencil, label).toContain("absolute top-[6px] right-[6px]");
    }
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

  it("no row has a pencil together with a chevron or an expand control", () => {
    const steps = html.slice(html.indexOf("data-checklist"), html.indexOf("data-scenario-step"));
    expect(steps).toContain('aria-expanded="false"');
    expect(steps).not.toContain("data-pencil");
    const quiz = html.slice(html.indexOf("data-quiz-row"));
    expect(quiz).not.toContain("data-pencil");
    // the pencils left are on the guide sections (4) and the scenario situation cards (4)
    expect(pencils).toHaveLength(8);
    expect(pencils.every((p) => /aria-label="Edit (Guide section|scenario step) /.test(p))).toBe(
      true,
    );
  });

  it("Edit step is a tertiary outlined button inside the expandable panel: white, 1px border, radius 14, 44px, a pencil and the label", () => {
    const panel = html.slice(html.indexOf('role="region"'));
    const at = panel.indexOf("data-edit-step");
    const button = panel.slice(panel.lastIndexOf("<a ", at), panel.indexOf("</a>", at));
    expect(button).toContain("data-edit-step");
    expect(button).toContain("min-h-11");
    expect(button).toContain("bg-card");
    expect(button).toContain("border-selectable-stroke");
    expect(button).toContain("rounded-button");
    expect(button).toContain("lucide-pencil");
    expect(button).toContain(">Edit step<");
    expect(button).not.toMatch(/underline|bg-olive-tint/);
    expect(html.indexOf("inert")).toBeGreaterThan(-1);
  });

  it("a quiz row opens the edit screen from the whole row, with a chevron, and the guide pill stays clickable above it", () => {
    const quiz = html.slice(html.indexOf("data-quiz-row"));
    expect(quiz).toContain('href="/edit/questions:0"');
    expect(quiz).toContain("absolute inset-0");
    expect(quiz).toContain("lucide-chevron-right");
    expect(quiz).toContain("relative z-10");
  });
});
