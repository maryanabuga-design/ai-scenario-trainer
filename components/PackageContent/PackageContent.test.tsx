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
  nextIssue,
  orderedIssues,
  readPackage,
  shortName,
} from "@/lib/package-read";
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

  it("with the whole package: three-line rows (label, Ready pill, file name), icon Remove buttons, nothing missing", () => {
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
    // remove: 44px neutral icon buttons named after the file, no large Secondary buttons
    expect(html).not.toContain(">Remove<");
    expect(html).toContain('aria-label="Remove guide.csv"');
    expect(html).toContain('aria-label="Remove all images"');
    expect(html.match(/aria-label="Remove /g)).toHaveLength(6);
    expect(
      html.match(/h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-tile-bg/g),
    ).toHaveLength(6);
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
        onNextIssue={noop}
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

  it("clean: ONE success Notice 'Nothing to fix', no to fix Notice, no dots, Publish and Preview enabled", () => {
    const html = render();
    expect(html).toContain('data-notice="success"');
    expect(html).toContain("Nothing to fix");
    expect(html).toContain("Preview as student, then publish.");
    expect(html).not.toContain('data-notice="to-fix"');
    expect(html).not.toContain("data-tab-dot");
    const bar = html.slice(html.indexOf("data-bar"));
    expect(bar).not.toMatch(/disabled=""[^>]*>Publish</);
    expect(bar).not.toMatch(/disabled=""[^>]*>[\s\S]*Preview as student</);
  });

  it("with issues: a to fix Notice with the count, its body and 'Show next issue' as an underlined tertiary link", () => {
    const html = render({ topic: bad });
    const count = blockingIssues(checkPackage(bad)).length;
    expect(count).toBe(6);
    expect(html).toContain('data-notice="to-fix"');
    expect(html).toContain(`${count} to fix before you can publish`);
    expect(html).toContain("Preview and Publish unlock when everything is fixed.");
    expect(html).toMatch(/underline[^>]*>Show next issue</);
    expect(html.match(/Show next issue/g)).toHaveLength(1);
    expect(html).not.toContain("Needs attention");
    expect(html).not.toContain('data-notice="success"');
  });

  it("the four-option selector stays on one line and a tab with issues has an amber dot with an accessible name", () => {
    const html = render({ topic: bad, tab: "steps" });
    const radios = group(html);
    for (const label of ["Guide", "Steps", "Scenario", "Quiz"])
      expect(radios).toContain(`${label}`);
    expect(radios.match(/whitespace-nowrap/g)).toHaveLength(4);
    expect(radios).toContain('aria-label="Steps, 2 to fix"');
    expect(radios).toContain('aria-label="Quiz, 4 to fix"');
    expect(radios.match(/data-tab-dot/g)).toHaveLength(2);
    expect(radios).not.toContain('aria-label="Guide');
    expect(radios).toContain("bg-status-attention-ink");
  });

  it("a tab with issues has a to fix Notice 'N to fix in this tab'; files tabs get a Secondary Replace files with the tab in the link", () => {
    const steps = render({ topic: bad, tab: "steps" });
    const notice = steps.slice(steps.indexOf('id="tab-notice"'));
    expect(notice).toContain("2 to fix in this tab");
    expect(notice).toMatch(
      /bg-olive-tint[^>]*href="\/instructor\/content\/import\?replace=[a-z0-9]+&amp;fix=steps"|href="\/instructor\/content\/import\?replace=[a-z0-9]+&amp;fix=steps"[^>]*bg-olive-tint/,
    );
    expect(steps.match(/data-to-fix=/g)).toHaveLength(2);
    expect(steps).toContain(">To fix<");
    expect(steps).toContain("Guide section 7 does not exist");
    expect(steps).toContain("No action");
    expect(steps).toContain("Fix this in the files, then replace them.");
    expect(steps).not.toContain("Edit question");
  });

  it("flagged questions get a Secondary 'Edit question' that opens the editor; the tab notice offers no Replace files for them", () => {
    const quiz = render({ topic: bad, tab: "quiz" });
    expect(quiz.match(/data-to-fix=/g)).toHaveLength(4);
    expect(quiz.match(/>Edit question</g)).toHaveLength(3);
    expect(quiz).toContain(`/instructor/content/package/${bad.id}/question/3/edit`);
    expect(quiz).toContain("4 to fix in this tab");
    // the missing picture of question 10 is fixed in the files
    expect(quiz).toContain("Image door-check.png was not selected");
    expect(quiz).toContain("Fix this in the files, then replace them.");
    expect(quiz).toContain("Replace files");
  });

  it("with issues the pinned area has Publish and Preview as student disabled and the destructive tertiary Delete link", () => {
    const html = render({ topic: bad });
    const bar = html.slice(html.indexOf("data-bar"));
    expect(bar).toMatch(/disabled=""[^>]*bg-primary[^>]*>Publish<|disabled=""[^>]*>Publish</);
    expect(bar).toMatch(/disabled=""[^>]*>[\s\S]*?Preview as student</);
    const del = bar.slice(0, bar.indexOf(">Delete demo topic<"));
    const tag = del.slice(del.lastIndexOf("<button"));
    expect(tag).toContain("text-wrong-text");
    expect(tag).toContain("min-h-11");
    expect(bar.slice(bar.indexOf(">Delete demo topic<") - 80)).toContain("underline");
    expect(bar).not.toMatch(/bg-olive-tint[^>]*>Delete demo topic</);
    // order: Publish, Preview as student, Delete
    expect(bar.indexOf(">Publish<")).toBeLessThan(bar.indexOf("Preview as student"));
    expect(bar.indexOf("Preview as student")).toBeLessThan(bar.indexOf("Delete demo topic"));
    expect(html).not.toContain("data-publish-hint");
  });

  it("exactly one Primary on the screen (Publish), and none in the Published state", () => {
    const primaries = (html: string) =>
      html.match(/h-\[52px\] bg-primary text-primary-text/g)?.length ?? 0;
    expect(primaries(render())).toBe(1);
    const published = render({ topic: { ...topic, status: "published" } });
    expect(primaries(published)).toBe(0);
    expect(published).toMatch(/bg-olive-tint[^>]*>Unpublish</);
    expect(published).toMatch(/bg-olive-tint[^>]*>[\s\S]*?Preview as student</);
    expect(published).toContain(
      "Visible to students in Materials, in the section From your instructor.",
    );
    expect(published).not.toContain(">Publish<");
    expect(published).not.toContain("Delete demo topic");
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

describe("Show next issue", () => {
  const issues = checkPackage(bad);

  it("visits every issue in order (Guide, Steps, Scenario, Quiz; items in order) and wraps around", () => {
    const ordered = orderedIssues(issues);
    expect(ordered).toHaveLength(6);
    expect(ordered.map((issue) => issue.part)).toEqual([
      "steps",
      "steps",
      "questions",
      "questions",
      "questions",
      "questions",
    ]);
    const visited: string[] = [];
    let after: string | null = null;
    for (let n = 0; n < ordered.length + 2; n += 1) {
      const next = nextIssue(issues, after);
      visited.push(next!.id);
      after = next!.id;
    }
    expect(visited.slice(0, 6)).toEqual(ordered.map((issue) => issue.id));
    // after the last it wraps to the first
    expect(visited[6]).toBe(ordered[0].id);
    expect(visited[7]).toBe(ordered[1].id);
    expect(nextIssue([], null)).toBeNull();
    expect(nextIssue(issues, "gone")?.id).toBe(ordered[0].id);
  });

  it("every flagged item carries the ids of its issues, so the page can find it, focus it and outline it", () => {
    const html = wrap(
      <PackageTopicView
        topic={bad}
        tab="quiz"
        issues={issues}
        now={NOW}
        dialog={null}
        onTab={noop}
        onAsk={noop}
        onConfirm={noop}
        onCancelDialog={noop}
        onNextIssue={noop}
        onPreview={noop}
        dialogInline
      />,
    );
    const questionIssues = orderedIssues(issues).filter((issue) => issue.part === "questions");
    for (const issue of questionIssues) expect(html).toContain(issue.id);
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain("data-[flash=true]:outline-2");
    expect(html).toContain("data-[flash=true]:outline-status-attention-ink");
    expect(html).not.toMatch(/transition|animate-/);
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
