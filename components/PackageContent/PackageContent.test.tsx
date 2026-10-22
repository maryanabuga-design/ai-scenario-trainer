import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// the pinned bar normally renders through a portal; here it renders in place
vi.mock("@/components/ActionBar/ActionBar", () => ({
  ActionBarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ActionBar: ({ children }: { children: React.ReactNode }) => <div data-bar>{children}</div>,
}));
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { PackageCard } from "@/components/InstructorContent/PackageCard";
import { PackageImportView } from "@/components/InstructorContent/PackageImportView";
import { PackageTopicView } from "@/components/InstructorContent/PackageTopicView";
import { GuideSections, ScenarioCards } from "@/components/PackageContent/PackageParts";
import { PackageRunner } from "@/components/PackageContent/PackageRunner";
import {
  PackagePartView,
  PackageTopicStudentView,
} from "@/components/PackageContent/PackageStudentViews";
import { checkPackage, readPackage } from "@/lib/package-read";
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
const NOW = new Date(2026, 9, 31, 10, 0).getTime();
const topic = createTopic(
  readPackage(clean).data,
  "Evacuating a crowded hall",
  "How to leave.",
  NOW,
  [],
);
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
  it("empty: the dashed area with Choose files, the two download links, the info card, no recognised list, Import disabled", () => {
    const html = importView([]);
    expect(html).toContain(">Import content</h1>");
    expect(html).toContain("CSV files and images · choose them together");
    expect(html).toMatch(/multiple=""/);
    expect(html).toContain('accept=".csv,.png,.jpg,.jpeg,.webp"');
    expect(html).toMatch(/bg-olive-tint[^>]*>Choose files</);
    expect(html).toMatch(/underline[^>]*>Download templates</);
    expect(html).toMatch(/underline[^>]*>Download sample package</);
    expect(html).toContain('href="/templates/sample-package.zip"');
    expect(html).toContain("How the package is read");
    expect(html).toContain("A person always reviews before publishing.");
    expect(html).not.toContain("data-recognised");
    expect(html).toMatch(/disabled=""[^>]*>Import and review</);
    expect(html).toMatch(/bg-olive-tint[^>]*>Import questions to a built-in topic</);
    expect(html.indexOf("Import and review")).toBeLessThan(html.indexOf(">Cancel<"));
  });

  it("with the whole package: one row per part with a Ready pill, the pictures found, the title prefilled, Import enabled", () => {
    const html = importView(clean);
    for (const label of [
      "Topic · Evacuating a crowded hall",
      "Guide · 4 sections",
      "Steps · 2 checklists, 7 steps",
      "Scenario · 4 steps",
      "Questions · 10 questions",
      "Images · 2 of 2 found",
    ]) {
      expect(html).toContain(label);
    }
    expect(html.match(/data-recognised-row=/g)).toHaveLength(6);
    expect(html.match(/data-row-pill="ready"/g)).toHaveLength(6);
    expect(html).not.toContain("Needs attention");
    expect(html.match(/>Remove</g)).toHaveLength(6);
    expect(html).toContain('value="Evacuating a crowded hall"');
    expect(html).not.toMatch(/disabled=""[^>]*>Import and review</);
    // pill and file name stay on one line
    expect(html).toMatch(/data-row-pill="ready"[^>]*whitespace-nowrap/);
  });

  it("with problems: the rows say Needs attention with a count, and a wrong file is listed in amber", () => {
    const html = importView([
      sample("guide.csv"),
      sample("steps-with-problems.csv"),
      { name: "x.pdf", size: 3 },
    ]);
    expect(html).toMatch(/data-row-pill="attention"[^>]*>Needs attention · 2</);
    expect(html).toContain(
      "x.pdf is not a CSV file or a png, jpg or webp picture, so it was left out.",
    );
    expect(html).toContain("data-amber");
  });

  it("asks where a questions file goes when it is the only file", () => {
    const html = importView([sample("questions.csv")], { onlyQuestions: true });
    expect(html).toContain("Add to a built-in topic");
    expect(html).toContain("Create a demo topic");
    expect(html).toMatch(/disabled=""[^>]*>Import and review</);
    expect(
      importView([sample("questions.csv")], {
        onlyQuestions: true,
        questionsChoice: "package",
        title: "T",
      }),
    ).not.toMatch(/disabled=""[^>]*>Import and review</);
  });
});

describe("the demo topic screen", () => {
  const render = (over: Partial<Parameters<typeof PackageTopicView>[0]> = {}) =>
    wrap(
      <PackageTopicView
        topic={topic}
        tab="guide"
        issues={checkPackage(topic)}
        now={NOW}
        dialog={null}
        onTab={noop}
        onAsk={noop}
        onConfirm={noop}
        onCancelDialog={noop}
        dialogInline
        {...over}
      />,
    );

  it("has Back, the title, the Draft pill with 'Last edited today', the coverage line and the four-option selector on one line", () => {
    const html = render();
    expect(html).toContain('aria-label="Back to Content"');
    expect(html).toContain(">Evacuating a crowded hall</h1>");
    expect(html).toMatch(/data-status-pill="draft"[^>]*>Draft</);
    expect(html).toContain("N1 · Last edited today");
    expect(html).toContain("Guide sections used: 4 of 4");
    const group = html.slice(html.indexOf('role="radiogroup"'), html.indexOf("</fieldset>"));
    for (const label of ["Guide", "Steps", "Scenario", "Quiz"])
      expect(group).toContain(`${label}</label>`);
    expect(group.match(/whitespace-nowrap/g)).toHaveLength(4);
    expect(group).toContain("px-1");
    expect(group.match(/disabled/g)).toBeNull();
  });

  it("shows each tab with the shared components: guide sections with 'Used by', steps with guide pills, scenario with the correct option, quiz rows", () => {
    const guide = render();
    expect(guide).toContain("Used by 1 step, 1 scenario step, 3 questions");
    expect(guide).toContain('id="section-4"');
    expect(guide).toContain("Green exit sign above a door");
    const steps = render({ tab: "steps" });
    expect(steps).toContain("When the alarm sounds");
    expect(steps).toContain("Guide · section 2");
    expect(steps).toContain(
      'href="/instructor/content/package/' + topic.id + '?tab=guide#section-2"',
    );
    const scenario = render({ tab: "scenario" });
    expect(scenario).toContain("Look for the nearest marked exit and start moving calmly.");
    expect(scenario).toContain("Correct answer");
    const quiz = render({ tab: "quiz" });
    expect(quiz.match(/data-quiz-row=/g)).toHaveLength(10);
    expect(quiz).toContain(`/instructor/content/package/${topic.id}/question/0`);
    for (const tab of ["guide", "steps", "scenario", "quiz"] as const) {
      expect(render({ tab })).toMatch(/bg-olive-tint[^>]*>[\s\S]*Preview as student</);
    }
    expect(guide).not.toContain("%");
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
    const html = render({ topic: small, tab: "steps", issues: checkPackage(small) });
    expect(html).toContain("This package has no steps.");
    expect(html).toContain("data-empty-part");
    const group = html.slice(html.indexOf('role="radiogroup"'), html.indexOf("</fieldset>"));
    expect(group.match(/disabled=""/g)).toHaveLength(3);
  });

  it("clean and draft: Publish is enabled, the Secondary Delete demo topic is below it, and there is no hint", () => {
    const html = render();
    expect(html).not.toContain("data-publish-hint");
    const bar = html.slice(html.indexOf(">Publish<") - 400);
    expect(bar).not.toMatch(/disabled=""[^>]*>Publish</);
    expect(html.indexOf(">Publish<")).toBeLessThan(html.indexOf(">Delete demo topic<"));
    expect(html).toMatch(/bg-primary[^>]*>Publish</);
    expect(html).toMatch(/bg-olive-tint[^>]*>Delete demo topic</);
  });

  it("with problems: the amber pill and reason on the flagged item, the problem line, the hint and Publish disabled", () => {
    const bad = createTopic(
      readPackage([
        sample("guide.csv"),
        sample("steps-with-problems.csv"),
        sample("exit-sign.png"),
        sample("assembly-point.png"),
      ]).data,
      "Bad",
      "",
      NOW,
      [],
    );
    const html = render({ topic: bad, tab: "steps", issues: checkPackage(bad) });
    expect(html.match(/data-needs-attention/g)).toHaveLength(2);
    expect(html).toContain("Guide section 7 does not exist");
    expect(html).toContain("No action");
    expect(html).toContain("2 issues to fix in this tab");
    expect(html).toContain("Fix 2 issues to publish");
    expect(html).toMatch(/disabled=""[^>]*>Publish</);
  });

  it("published: Unpublish and the note, no Publish and no Delete", () => {
    const html = render({ topic: { ...topic, status: "published" } });
    expect(html).toMatch(/data-status-pill="published"[^>]*>Published</);
    expect(html).toMatch(/bg-olive-tint[^>]*>Unpublish</);
    expect(html).toContain(
      "Visible to students in Materials, in the section From your instructor.",
    );
    expect(html).not.toContain(">Publish<");
    expect(html).not.toContain("Delete demo topic");
  });

  it("has the three dialogs with their words", () => {
    const publish = render({ dialog: "publish" });
    expect(publish).toContain("Publish this demo topic?");
    expect(publish).toContain(
      "Students will see it in Materials under From your instructor. It does not count towards exams or readiness.",
    );
    expect(publish).toContain(">Keep editing<");
    const unpublish = render({ dialog: "unpublish", topic: { ...topic, status: "published" } });
    expect(unpublish).toContain("Unpublish this demo topic?");
    expect(unpublish).toContain("Students will no longer see it. It becomes a draft.");
    expect(unpublish).toContain(">Keep published<");
    const remove = render({ dialog: "delete" });
    expect(remove).toContain("Delete this demo topic?");
    expect(remove).toContain("This cannot be undone.");
    expect(remove).toContain(">Keep it<");
  });
});

describe("the Content root card", () => {
  it("is a fixed 88px card with the parts, a Draft pill and an amber count of problems", () => {
    const html = renderToStaticMarkup(<PackageCard topic={topic} />);
    expect(html).toContain("h-[88px]");
    expect(html).toContain("Guide · Steps · Scenario · 10 questions");
    expect(html).toContain("Draft");
    expect(html).not.toContain("need attention");
    expect(html).toContain("lucide-chevron-right");
    const bad = createTopic(
      readPackage([sample("questions-with-problems.csv")]).data,
      "Bad",
      "",
      NOW,
      [],
    );
    const flagged = renderToStaticMarkup(<PackageCard topic={bad} />);
    expect(flagged).toContain("4 need attention");
    expect(flagged).toContain(
      "bg-status-attention-bg".replace("bg-", "text-").replace("attention-bg", "attention-ink"),
    );
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
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
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
        guideHref={(s) => `#${s}`}
      />,
    );
    expect(scenario).not.toContain("<b>x</b>");
    expect(scenario).toContain("&lt;b&gt;x&lt;/b&gt;");
  });
});

describe("the student screens", () => {
  it("lists the parts in the learning path order with the plain sentence about being separate", () => {
    const html = renderToStaticMarkup(
      <PackageTopicStudentView
        title={topic.title}
        summary={topic.summary}
        data={topic}
        partHref={(part) => `/materials/package/${topic.id}/${part}`}
        back={{ label: "Back to Materials", href: "/materials" }}
      />,
    );
    const order = [
      "Read the guide",
      "Follow the steps",
      "Practise the scenario",
      "Take the quiz",
    ].map((t) => html.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain("FROM YOUR INSTRUCTOR");
    expect(html.match(/h-\[88px\]/g)).toHaveLength(4);
    expect(html).not.toContain("data-preview-bar");
  });

  it("shows the sticky preview bar with Exit preview only in a preview", () => {
    const view = (preview?: { exitHref: string }) =>
      wrap(
        <PackagePartView
          title={topic.title}
          part="guide"
          data={topic}
          guideHref={(s) => `#${s}`}
          back={{ label: "Back to topic", href: "/x" }}
          preview={preview}
        />,
      );
    expect(view()).not.toContain("Previewing as student");
    const html = view({ exitHref: "/back" });
    expect(html).toContain("Previewing as student");
    expect(html).toContain("sticky top-0");
    expect(html).toMatch(/bg-olive-tint[^>]*>Exit preview</);
    expect(html).toContain('href="/back"');
  });

  it("runs a quiz without any store: one question, a disabled Next until an answer, no AI or progress words", () => {
    const html = wrap(
      <PackageRunner
        data={topic}
        items={[
          {
            question: "Q?",
            options: ["A", "B", "", ""],
            correct: "b",
            explanation: "Because.",
            guideRef: "1",
            imageFile: "",
            alt: "",
          },
        ]}
        guideHref={(s) => `#${s}`}
        noun="question"
      />,
    );
    expect(html).toContain("QUESTION 1 OF 1");
    expect(html).toMatch(/disabled=""[^>]*>Finish</);
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).not.toMatch(/AI|bot/);
  });
});
