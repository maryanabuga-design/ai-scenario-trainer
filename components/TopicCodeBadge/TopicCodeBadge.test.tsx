import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TopicCodeBadge } from "@/components/TopicCodeBadge/TopicCodeBadge";
import { TipNote } from "@/components/TipNote/TipNote";

describe("the topic code badge", () => {
  it("is a circle whose size does not depend on the code: S1, S2 and S10 get the same width and height", () => {
    for (const id of ["S1", "S2", "S10"]) {
      const html = renderToStaticMarkup(<TopicCodeBadge id={id} />);
      expect(html).toContain("h-9 w-9");
      expect(html).toContain("rounded-full");
      expect(html).toContain("whitespace-nowrap");
      expect(html).toContain("tabular-nums");
      expect(html).toContain("type-caption-strong");
      expect(html).toContain("bg-chip-neutral-bg");
      expect(html).toContain(`>${id}<`);
      expect(html).toContain('aria-hidden="true"');
    }
    const compact = renderToStaticMarkup(<TopicCodeBadge id="S10" compact />);
    expect(compact).toContain("h-8 w-8");
  });

  it("is used for the Weakest topic, the Topics cards, the student's topic rows and Saved questions", () => {
    for (const file of [
      "components/InstructorOverview/OverviewBlocks.tsx",
      "components/InstructorTopics/TopicsView.tsx",
      "components/SavedView/SavedView.tsx",
    ])
      expect(readFileSync(file, "utf8"), file).toContain("TopicCodeBadge");
  });
});

describe("the shared note", () => {
  it("is a sand band with a 40px round tile with the lightbulb, a thin divider and the text", () => {
    const html = renderToStaticMarkup(<TipNote noteId="x">Hello</TipNote>);
    expect(html).toContain("rounded-[14px] bg-secondary-sand");
    expect(html).toContain("h-10 w-10");
    expect(html).toContain("rounded-full");
    expect(html).toContain("lucide-lightbulb");
    expect(html).toContain("h-8 w-px");
    expect(html).toContain("min-w-0 flex-1");
    expect(html).toContain("items-center");
    expect(html).toContain("data-x");
  });

  it("is the one note on the Content screen and the Exam detail (nobody copies its styles)", () => {
    for (const file of [
      "components/InstructorContent/ContentView.tsx",
      "components/InstructorExams/ExamDetailView.tsx",
    ]) {
      const code = readFileSync(file, "utf8");
      expect(code, file).toContain("<TipNote");
      expect(code, file).not.toContain("h-8 w-px");
    }
  });
});

describe("the one icon tile", () => {
  it("is the only neutral icon tile colour: no component draws an icon on the darker neutral tile except the note and the small round controls (bookmark, close x, pencil)", () => {
    const found = execSync(
      "grep -rl 'bg-neutral-tile-bg' components app | grep -v 'test\\|\\.css' | sort",
      { encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean);
    expect(found).toEqual([
      "components/BookmarkButton/BookmarkButton.tsx",
      "components/InstructorContent/PackageImportView.tsx", // the small close x of the file card
      "components/Notice/Notice.tsx", // the small close x of a notice
      "components/PackageContent/PackageParts.tsx",
      "components/TipNote/TipNote.tsx",
    ]);
  });
});
