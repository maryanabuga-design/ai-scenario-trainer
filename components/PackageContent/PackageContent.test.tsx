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
import { PackageImportView } from "@/components/InstructorContent/PackageImportView";
import { PackageTopicView } from "@/components/InstructorContent/PackageTopicView";
import {
  ChecklistCards,
  GuideSections,
  ScenarioCards,
} from "@/components/PackageContent/PackageParts";
import { PackageStudentScreen } from "@/components/PackageContent/PackageStudentScreen";
import type { StudentPart } from "@/components/PackageContent/PackageStudentScreen";
import {
  blockingIssues,
  checkPackage,
  fixMessage,
  missingImages,
  readPackage,
  shortName,
} from "@/lib/package-read";
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

const importView = (
  files: PackageFile[],
  extra: Partial<Parameters<typeof PackageImportView>[0]> = {},
) => {
  const outcome = readPackage(files);
  return wrap(
    <PackageImportView
      outcome={outcome}
      title={outcome.data.title}
      summary={outcome.data.summary}
      questionsChoice={null}
      onChoice={noop}
      onFiles={noop}
      onRemove={noop}
      onTitle={noop}
      onSummary={noop}
      onImport={noop}
      onCancel={noop}
      {...extra}
    />,
  );
};

describe("the import screen", () => {
  it("empty: the dashed area, the download links, the info Notice with the Word, Excel and PDF line, the tertiary link under it, Import disabled", () => {
    const html = importView([]);
    expect(html).toContain(">Import content</h1>");
    expect(html).toContain("CSV files and images · choose them together");
    expect(html).toMatch(/multiple=""/);
    expect(html).toContain('accept=".csv,.png,.jpg,.jpeg,.webp"');
    expect(html).toMatch(/underline[^>]*>Download templates</);
    expect(html).toMatch(/underline[^>]*>Download sample package</);
    expect(html).toContain('data-notice="info"');
    expect(html).toContain("How the package is read");
    expect(html).toContain("Word, Excel and PDF files are not read in this prototype.");
    expect(html).toContain("A person always reviews before publishing.");
    expect(html).not.toContain("data-recognised");
    expect(html).toMatch(/disabled=""[^>]*>Import and review</);
    // an underlined tertiary link right under the Notice, not a button
    const link = html.slice(html.indexOf('href="/instructor/content/import/questions"') - 300);
    expect(link).toMatch(/underline[^>]*>Import questions to a built-in topic</);
    expect(html.indexOf("How the package is read")).toBeLessThan(
      html.indexOf("Import questions to a built-in topic"),
    );
    expect(html).not.toMatch(/bg-olive-tint[^>]*>Import questions to a built-in topic</);
    expect(html.indexOf("Import and review")).toBeLessThan(html.indexOf(">Cancel<"));
    // the summary is a two-line text area
    expect(html).toMatch(/<textarea[^>]*name="topic-summary"[^>]*rows="2"/);
  });

  it("with the whole package: three-line rows (label, Ready pill, file name), a corner x on each file row, thumbnails for the pictures", () => {
    const html = importView(clean);
    for (const label of [
      "Topic · Evacuating a crowded hall",
      "Guide · 4 sections",
      "Steps · 2 step guides, 7 steps",
      "Scenario · 4 steps",
      "Questions · 10 questions",
      "Images · 2 of 2 found",
    ]) {
      expect(html).toContain(label);
    }
    expect(html.match(/data-recognised-row=/g)).toHaveLength(6);
    expect(html.match(/data-row-pill="ready"/g)).toHaveLength(6);
    expect(html).not.toContain("Needs attention");
    expect(html).not.toContain("data-missing");
    expect(html).not.toContain("data-fix-in-review");
    // a small corner x: a 28px neutral circle in a 44px tap area at the top-right of the card
    expect(html).not.toContain(">Remove<");
    expect(html).toContain('aria-label="Remove guide.csv"');
    const corner = html.slice(html.indexOf('aria-label="Remove guide.csv"') - 160);
    expect(corner).toMatch(/absolute top-0 right-0 flex h-11 w-11/);
    expect(corner).toMatch(/h-7 w-7[^"]*rounded-full bg-neutral-tile-bg/);
    // the text block keeps a right padding so nothing sits under the x
    expect(html).toMatch(/flex items-center gap-3 pr-8/);
    // five file rows have the x; the pictures have their own x on each thumbnail
    expect(html.match(/data-remove/g)).toHaveLength(7);
    expect(html.match(/data-thumbnail=/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Remove exit-sign.png"');
    expect(html).not.toContain("Remove all images");
    // line 1 label, line 2 the pill, line 3 the file name
    const row = html.slice(html.indexOf('data-recognised-row="scenario"'));
    expect(row.indexOf("Scenario · 4 steps")).toBeLessThan(row.indexOf("data-row-pill"));
    expect(row.indexOf("data-row-pill")).toBeLessThan(row.indexOf("data-file-name"));
    expect(html).toContain('value="Evacuating a crowded hall"');
    expect(html).not.toMatch(/disabled=""[^>]*>Import and review</);
  });

  it("the Images row is never Ready while a picture is missing: an amber 'N to add' pill and 'Missing: ...'", () => {
    const html = importView([...clean.slice(0, 5), sample("exit-sign.png")]);
    expect(html).toContain("Images · 1 of 2 found");
    const row = html.slice(html.indexOf('data-recognised-row="images"'));
    expect(row).toMatch(/data-row-pill="to-fix"[^>]*bg-status-attention-bg[^>]*>1 to add</);
    expect(row).not.toContain(">Ready<");
    expect(row).toContain("Missing: assembly-point.png");
    // a thumbnail for the one chosen, a dashed placeholder with the name for the missing one
    expect(row.match(/data-thumbnail=/g)).toHaveLength(1);
    expect(row).toContain('data-thumbnail-missing="assembly-point.png"');
    expect(row).toContain("border-dashed");
    expect(html).toContain("You can import now and fix the issues in the review.");
    // none selected: every named picture is missing
    const none = importView(clean.slice(0, 5));
    expect(none).toContain("Missing: exit-sign.png, assembly-point.png");
    expect(missingImages(readPackage(clean.slice(0, 5)).data)).toEqual([
      "exit-sign.png",
      "assembly-point.png",
    ]);
  });

  it("with problems: the part pills say 'N to fix', one muted line says you can fix in the review, a wrong file is amber", () => {
    const html = importView([
      sample("guide.csv"),
      sample("steps-with-problems.csv"),
      { name: "x.pdf", size: 3 },
    ]);
    expect(html).toMatch(/data-row-pill="to-fix"[^>]*>2 to fix</);
    expect(html).not.toContain("Needs attention");
    expect(html).toContain("You can import now and fix the issues in the review.");
    expect(html).toContain(
      "x.pdf is not a CSV file or a png, jpg or webp picture, so it was left out.",
    );
    expect(html).toContain("data-amber");
  });

  it("shortens a long file name in the middle and keeps the full name as the aria-label", () => {
    expect(shortName("short.csv")).toBe("short.csv");
    const long = "a-very-long-file-name-for-the-guide-of-the-hall.csv";
    const short = shortName(long);
    expect(short.length).toBeLessThanOrEqual(26);
    expect(short).toContain("…");
    expect(short.endsWith(".csv")).toBe(true);
    const html = importView([{ ...sample("guide.csv"), name: long }]);
    expect(html).toContain(`aria-label="${long}"`);
    expect(html).toContain(`aria-label="Remove ${long}"`);
  });

  it("asks where a questions file goes when it is the only file", () => {
    const html = importView([sample("questions.csv")], { onlyQuestions: true });
    expect(html).toContain("Add to a built-in topic");
    expect(html).toContain("Create a demo topic");
    expect(html).toMatch(/disabled=""[^>]*>Import and review</);
  });

  it("shows the Replace files message as a to fix Notice", () => {
    const html = importView([], { notice: "Fix these in your files." });
    expect(html).toContain('data-notice="to-fix"');
    expect(html).toContain("Fix these in your files.");
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
    // a pencil on every step card, named after the step, at least 44px
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

  it("the meta row is 'Draft · Last edited today' followed by an underlined tertiary Replace files link", () => {
    const html = render();
    const meta = html.slice(html.indexOf("data-package-status"), html.indexOf("data-coverage"));
    expect(meta.replace(/<[^>]+>/g, "")).toContain("Draft · Last edited today");
    expect(meta).toMatch(/underline[^>]*>Replace files</);
    expect(meta.indexOf("Last edited")).toBeLessThan(meta.indexOf("Replace files"));
    expect(meta).toContain(`href="/instructor/content/import?replace=${topic.id}"`);
  });

  it("has Back on the left and a ⋯ More actions button on the right; Delete is in its menu, not in the pinned area", () => {
    const closed = render();
    expect(closed).toContain('aria-label="More actions"');
    expect(closed).toContain('aria-haspopup="menu"');
    expect(closed).toContain('aria-expanded="false"');
    expect(closed).toContain("lucide-ellipsis");
    expect(closed).toContain("h-11 w-11");
    expect(closed).not.toContain('role="menu"');
    expect(closed).not.toContain("Delete demo topic");
    expect(closed.indexOf('aria-label="Back to Content"')).toBeLessThan(
      closed.indexOf('aria-label="More actions"'),
    );
    const open = render({ menuOpen: true });
    expect(open).toContain('role="menu"');
    expect(open).toMatch(/role="menuitem"[^>]*>Delete demo topic</);
    expect(open).toContain("text-wrong-text");
    expect(open.slice(open.indexOf("data-bar"))).not.toContain("Delete demo topic");
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
    expect(buttons(published)).toEqual(["Unpublish", "Preview as student"]);
    expect(primaries(published)).toBe(0);
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
    expect(remove).toContain("Delete this demo topic?");
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
