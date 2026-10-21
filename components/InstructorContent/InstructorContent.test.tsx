import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { ContentView } from "@/components/InstructorContent/ContentView";
import { EditQuestionView } from "@/components/InstructorContent/EditQuestionView";
import { ImportView } from "@/components/InstructorContent/ImportView";
import { ReviewView } from "@/components/InstructorContent/ReviewView";
import { sampleQuestions } from "@/lib/content-import";
import type { ContentSet } from "@/lib/content-sets";

const titleOf = (id: string) => `Topic ${id}`;
const set = (
  status: ContentSet["status"] = "draft",
  source: ContentSet["source"] = "sample",
): ContentSet => ({
  id: "cabc",
  title: "Evacuation routes",
  topic: "S3",
  status,
  source,
  fileName: "q.docx",
  createdAt: 1,
  dropped: 0,
  questions: sampleQuestions("cabc"),
});
const noop = () => undefined;
const render = (node: ReactNode) =>
  renderToStaticMarkup(<ActionBarProvider>{node}</ActionBarProvider>);
const builtIn = Array.from({ length: 10 }, (_, i) => ({
  id: `S${i + 1}`,
  title: titleOf(`S${i + 1}`),
  count: 12,
}));
const visible = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("the Content tab", () => {
  const withSets = renderToStaticMarkup(
    <ContentView
      sets={[set(), set("published")].map((s, i) => ({ ...s, id: `c${i}` }))}
      builtIn={builtIn}
      topicTitle={titleOf}
    />,
  );

  it("has the band, the one Primary Import questions right under it, and 88px set cards", () => {
    expect(withSets).toContain("data-page-header-band");
    expect(withSets).toContain(">Content</h1>");
    expect(withSets.indexOf("Import questions")).toBeGreaterThan(withSets.indexOf("Content</h1>"));
    expect(withSets.indexOf("Import questions")).toBeLessThan(withSets.indexOf("IMPORTED SETS"));
    expect(withSets.match(/h-\[88px\]/g)).toHaveLength(2);
    expect(withSets).toContain("S3 Topic S3 · 20 questions");
    expect(withSets).toContain('data-set-status="draft"');
    expect(withSets).toContain('data-set-status="published"');
    expect(withSets).toContain("dashed");
    expect(withSets).toContain('href="/instructor/content/c0"');
    expect(withSets).not.toContain("%");
  });

  it("has the built-in toggle with its count, then the read-only 72px rows without chevrons", () => {
    expect(withSets).toContain("Show built-in topics (10)");
    expect(withSets).toContain("BUILT-IN TOPICS");
    expect(withSets.match(/data-built-in=/g)).toHaveLength(10);
    const list = withSets.slice(
      withSets.indexOf("BUILT-IN TOPICS"),
      withSets.indexOf("Show built-in"),
    );
    expect(list.match(/h-\[72px\]/g)).toHaveLength(10);
    expect(list).not.toContain("<a ");
    expect(list).not.toContain("lucide-chevron-right");
    expect(list).toContain("12 questions");
    expect(withSets).toContain('inert=""');
    const open = renderToStaticMarkup(
      <ContentView sets={[]} builtIn={builtIn} topicTitle={titleOf} initiallyOpen />,
    );
    expect(open).toContain("Hide built-in topics");
  });

  it("has the empty state and the note about the browser", () => {
    const empty = renderToStaticMarkup(
      <ContentView sets={[]} builtIn={builtIn} topicTitle={titleOf} />,
    );
    expect(empty).toContain("No imported sets yet. Import questions from a file to create one.");
    expect(empty).not.toContain("data-set-card");
    expect(empty).toContain("Imported content stays in this browser (prototype).");
  });
});

describe("the Import screen", () => {
  const importView = (
    draft: {
      title?: string;
      topic?: string | null;
      detected?: string | null;
      file?: { name: string; size: number } | null;
    } = {},
    extra: { reading?: boolean; readError?: string } = {},
  ) =>
    render(
      <ImportView
        draft={{ title: "", topic: null, detected: null, file: null, ...draft }}
        topicTitle={titleOf}
        onFile={noop}
        onRemoveFile={noop}
        onTitle={noop}
        onImport={noop}
        onCancel={noop}
        {...extra}
      />,
    );
  const html = importView();

  it("is in the order FILE, TITLE, TOPIC, with one visible label for the title and the template link", () => {
    const at = (label: string) => html.indexOf(`>${label}</h2>`);
    expect(at("FILE")).toBeGreaterThan(-1);
    expect(at("FILE")).toBeLessThan(at("TITLE"));
    expect(at("TITLE")).toBeLessThan(at("TOPIC"));
    expect(html).not.toContain("SET TITLE");
    expect(html).toContain('aria-label="Choose file"');
    // the title input has a label for screen readers only, not a second visible one
    expect(html).toMatch(/<label[^>]*class="sr-only"[^>]*>Set title<\/label>/);
    expect(html).toContain("h-[52px]");
    expect(html).toContain("CSV, Excel, Word or PDF · up to 5 MB");
    expect(html).toContain('accept=".csv,.xlsx,.docx,.pdf"');
    expect(html).toContain('href="/templates/question-template.csv"');
    expect(html).toContain("Download CSV template");
  });

  it("has the short info card and no column list", () => {
    expect(html).toContain("One row is one question");
    expect(html).toContain("Download the template, fill it in and choose it above.");
    expect(html).toContain("A person always reviews before publishing.");
    expect(html).not.toContain("option_a");
    expect(html).not.toContain("How the file is read");
  });

  it("shows one 64px Topic row with a chevron to the picker, or the detected topic read-only", () => {
    expect(html).toContain('href="/instructor/content/import/topic"');
    expect(html).toContain("Choose a topic");
    const row = html.slice(html.indexOf("data-topic-row"), html.indexOf("data-topic-row") + 700);
    expect(row).toContain("h-16");
    expect(row).toContain("lucide-chevron-right");
    expect(importView({ topic: "S3" })).toContain("S3 Topic S3");
    const detected = importView({ detected: "S3" });
    expect(detected).toContain("Detected from file: S3 Topic S3");
    expect(detected).not.toContain('href="/instructor/content/import/topic"');
    expect(detected).not.toContain("data-topic-row");
  });

  it("shows the chosen file with its size and Remove, and the reading state", () => {
    const filled = importView({ title: "q", file: { name: "q.csv", size: 2048 } });
    expect(filled).toContain("q.csv");
    expect(filled).toContain("2 KB");
    expect(filled).toContain(">Remove<");
    const reading = importView({}, { reading: true });
    expect(reading).toContain("Reading questions...");
    expect(reading).toContain("motion-reduce:animate-none");
  });

  it("shows a file problem in the amber tone, never red", () => {
    const code = readFileSync("components/InstructorContent/Amber.tsx", "utf8");
    expect(code).toContain("text-status-attention-ink");
    expect(code).not.toMatch(/text-wrong|\bred\b|text-red/);
    const html2 = importView({}, { readError: "The file is empty." });
    expect(html2).toContain("data-amber");
    expect(html2).toContain("The file is empty.");
  });
});

describe("the Review screen", () => {
  const review = (
    s: ContentSet,
    filter: "all" | "attention" = "all",
    confirming: "publish" | "delete" | null = null,
  ) =>
    render(
      <ReviewView
        set={s}
        topicTitle="Evacuation routes"
        onPublish={noop}
        onUnpublish={noop}
        onDelete={noop}
        initialFilter={filter}
        confirmingInitially={confirming}
        dialogInline
      />,
    );
  const html = review(set());

  it("has the title, the count tiles without percentages, the selector and 72px rows with chevrons", () => {
    expect(html).toContain(">Evacuation routes</h1>");
    expect(html).toContain("S3 Evacuation routes");
    expect(html).toMatch(/data-count="ready"[\s\S]*?>18<[\s\S]*?ready/);
    expect(html).toMatch(/data-count="attention"[\s\S]*?>2<[\s\S]*?need attention/);
    expect(visible(html)).not.toContain("%");
    for (const label of ["All", "Needs attention"]) expect(html).toContain(`>${label}<`);
    expect(html.match(/data-question-row=/g)).toHaveLength(20);
    expect(html.match(/h-\[72px\]/g)).toHaveLength(20);
    expect(html).toContain('href="/instructor/content/cabc/1"');
    expect(html).toContain("Sample result. This file type is not read in this prototype.");
  });

  it("shows the reasons, Needs attention first under that filter, and only those rows", () => {
    expect(html).toContain("Needs attention: No explanation");
    expect(html).toContain("Needs attention: No correct answer");
    const only = review(set(), "attention");
    expect(only.match(/data-question-row=/g)).toHaveLength(2);
  });

  it("asks the publish question in the confirmation dialog", () => {
    const ready = {
      ...set(),
      questions: set().questions.map((q) => ({
        ...q,
        correct: q.correct ?? ("a" as const),
        explanation: q.explanation || "Why.",
      })),
    };
    const ok = review(ready, "all", "publish");
    expect(ok).toContain(
      "Publish 20 questions to S3 Evacuation routes? Students will see them in Training.",
    );
    expect(ok).toContain("Keep editing");
  });

  it("is read-only when Published: no links or chevrons, only a Secondary Unpublish", () => {
    const published = review(set("published"));
    const rows = published.slice(published.indexOf("data-question-row"));
    expect(rows).not.toContain("lucide-chevron-right");
    expect(rows).not.toContain('href="/instructor/content/cabc/');
  });
});

describe("the Edit question screen", () => {
  const edit = (s = set(), index = 7) =>
    render(
      <EditQuestionView
        set={s}
        index={index}
        topicTitle="Evacuation routes"
        onSave={noop}
        onDelete={noop}
        dialogInline
      />,
    );

  it("has the fields, 52px answers with a circle each, the counter and the pinned buttons", () => {
    const html = edit(set(), 0);
    for (const label of [
      "QUESTION",
      "ANSWERS",
      "EXPLANATION",
      "GUIDE REFERENCE (OPTIONAL)",
      "IMAGE (OPTIONAL)",
    ]) {
      expect(html).toContain(label);
    }
    expect(html.match(/aria-label="Answer [A-D]"/g)).toHaveLength(4);
    expect(html.match(/name="correct"/g)).toHaveLength(4);
    expect(html.match(/h-\[52px\]/g)!.length).toBeGreaterThanOrEqual(4);
    expect(html).toMatch(/data-counter[^>]*>\s*\d+ of 300/);
    expect(html).toContain(">Add image<");
    expect(html).toContain('accept=".png,.jpg,.jpeg,.webp"');
  });

  it("shows the reader's problem at the top and next to the field", () => {
    const html = edit(set(), 7);
    expect(html).toContain("data-problems");
    expect(html.match(/No explanation/g)!.length).toBeGreaterThanOrEqual(2);
  });

  it("shows the preview and the required alt text for a picture, and Remove image", () => {
    const s = set();
    s.questions[0] = { ...s.questions[0], image: { data: "data:image/png;base64,AAAA", alt: "" } };
    const html = edit(s, 0);
    expect(html).toContain("data-image-preview");
    expect(html).toContain("Alt text (a short description)");
    expect(html).toContain("Image has no alt text");
    expect(html).toContain(">Remove image<");
  });

  it("renders markup in a question as text, never as HTML", () => {
    const s = set();
    s.questions[0] = {
      ...s.questions[0],
      text: "<script>alert(1)</script><img src=x onerror=alert(1)>",
    };
    const html = edit(s, 0);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("never loads anything over the network: no external addresses or fetch in the Content code", () => {
    for (const file of [
      "components/InstructorContent/ImportView.tsx",
      "components/InstructorContent/EditQuestionView.tsx",
      "components/InstructorContent/ReviewView.tsx",
      "lib/content-import.ts",
      "lib/content-sets.ts",
      "app/(app)/instructor/content/import/page.tsx",
    ]) {
      const code = readFileSync(file, "utf8");
      expect(code, file).not.toMatch(
        /https?:\/\/|fetch\(|XMLHttpRequest|sendBeacon|dangerouslySetInnerHTML/,
      );
    }
  });
});
