import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/ActionBar/ActionBar", () => ({
  ActionBar: ({ children }: { children: React.ReactNode }) => <div data-bar>{children}</div>,
}));
import { PackageItemEdit, PackagePartStep } from "@/components/InstructorContent/PackageItemEdit";
import { checkPackage, readPackage } from "@/lib/package-read";
import type { PackageFile } from "@/lib/package-read";

const DIR = "public/templates/sample-package";
const sample = (name: string): PackageFile => {
  const bytes = readFileSync(`${DIR}/${name}`);
  return name.endsWith(".png")
    ? { name, size: bytes.length, dataUrl: `data:image/png;base64,${bytes.toString("base64")}` }
    : { name, size: bytes.length, text: bytes.toString("utf8") };
};
const pictures = [sample("exit-sign.png"), sample("assembly-point.png")];
const clean = readPackage(
  ["guide", "steps", "scenario", "questions"].map((n) => sample(`${n}.csv`)).concat(pictures),
).data;
const bad = readPackage(
  ["guide.csv", "steps-with-problems.csv", "questions-with-problems.csv"]
    .map(sample)
    .concat(pictures),
).data;
const noop = () => undefined;

const render = (
  data = clean,
  itemKey = "questions:0",
  review: { position: number; total: number } | null = null,
) =>
  renderToStaticMarkup(
    <PackageItemEdit
      data={data}
      itemKey={itemKey}
      review={review}
      initialIssues={checkPackage(data)}
      onSave={noop}
      onSkip={noop}
      onLeave={noop}
    />,
  ).replace(/<!-- -->/g, "");
const bar = (html: string) =>
  html.slice(
    html.indexOf("data-bar"),
    html.includes("<dialog") ? html.indexOf("<dialog") : undefined,
  );
const primaries = (html: string) => bar(html).match(/h-\[52px\] bg-primary/g)?.length ?? 0;

describe("the edit screen of an item", () => {
  it("opened from a card: the item's name, Save (Primary) and Cancel (Secondary), no '1 of N'", () => {
    const html = render();
    expect(html).toContain(">Question 1</h1>");
    expect(html).not.toMatch(/\d+ of \d+/);
    expect(bar(html)).toMatch(/bg-primary[^>]*>Save</);
    expect(bar(html)).toMatch(/bg-olive-tint[^>]*>Cancel</);
    expect(primaries(html)).toBe(1);
  });

  it("in a guided review: '1 of N' in the header, Save and next (Primary) and Skip (Secondary)", () => {
    const html = render(bad, "questions:3", { position: 1, total: 6 });
    expect(html).toContain(">Question 4</h1>");
    expect(html).toContain("1 of 6");
    expect(bar(html)).toMatch(/bg-primary[^>]*>Save and next</);
    expect(bar(html)).toMatch(/bg-olive-tint[^>]*>Skip</);
    expect(bar(html)).not.toContain(">Save<");
    expect(primaries(html)).toBe(1);
    expect(html).toContain('aria-label="Leave the review"');
  });

  it("an item that only needs confirming has Mark as OK instead of Save and next", () => {
    const confirmData = {
      ...clean,
      questions: clean.questions!.map((q, i) => (i === 1 ? { ...q, refAuto: true } : q)),
    };
    const html = render(confirmData, "questions:1", { position: 1, total: 1 });
    expect(bar(html)).toMatch(/bg-primary[^>]*>Mark as OK</);
    expect(bar(html)).not.toContain("Save and next");
    expect(html).toContain("Section 2 was matched automatically");
    expect(primaries(html)).toBe(1);
  });

  it("shows what must be fixed in a to fix notice and the correct-answer check in an info notice", () => {
    const html = render(bad, "questions:4");
    expect(html).toContain('data-notice="to-fix"');
    expect(html).toContain("1 to fix in this item");
    expect(html).toContain("No question text");
    expect(html).toContain("Check the correct answer");
    expect(html).toMatch(/Option [A-D] is marked as correct\. Change it if that is wrong\./);
  });

  it("has the fields of every part and the picture block with Add image and the image description", () => {
    const guide = render(clean, "guide:0");
    for (const text of [
      "Title",
      "TEXT",
      "IMAGE",
      "Change image",
      "Remove image",
      "Image description",
    ]) {
      expect(guide, text).toContain(text);
    }
    expect(guide).toContain('accept=".png,.jpg,.jpeg,.webp"');
    const step = render(clean, "steps:0:0");
    for (const text of ["Action", "DETAIL", "GUIDE SECTION", ">Add image<"]) {
      expect(step, text).toContain(text);
    }
    const scenario = render(clean, "scenario:0");
    for (const text of ["SITUATION", "QUESTION", "ANSWERS", "WHY", "GUIDE SECTION"]) {
      expect(scenario, text).toContain(text);
    }
    const question = render(clean, "questions:0");
    for (const text of ["QUESTION", "ANSWERS", "EXPLANATION", "GUIDE SECTION"]) {
      expect(question, text).toContain(text);
    }
    expect(question.match(/type="radio"/g)!.length).toBeGreaterThanOrEqual(4);
  });

  it("a picture that is not in the package yet says so and offers Add image", () => {
    const data = {
      ...clean,
      questions: clean.questions!.map((q, i) =>
        i === 0 ? { ...q, imageFile: "door-check.png" } : q,
      ),
    };
    const html = render(data, "questions:0");
    expect(html).toContain("door-check.png is not in the package yet.");
    expect(html).toMatch(/bg-olive-tint[^>]*>Add image</);
  });

  it("has the discard dialog for leaving with changes (closed until needed) and no bottom sheet", () => {
    const html = render();
    expect(html).toContain("Discard your changes?");
    expect(html).toContain("Keep editing");
    expect(html).not.toMatch(/role="dialog"[^>]*open/);
  });

  it("a problem with a whole part has no form: the reason, Replace files (Primary) and Skip", () => {
    const html = renderToStaticMarkup(
      <PackagePartStep
        title="Guide"
        review={{ position: 2, total: 3 }}
        reasons={["Section numbers are not consecutive from 1"]}
        replaceHref="/instructor/content/import?replace=x&fix=guide"
        onSkip={noop}
        onLeave={noop}
      />,
    );
    expect(html).toContain("2 of 3");
    expect(html).toContain("Section numbers are not consecutive from 1");
    expect(html).toContain("Replace files");
    expect(html).toContain("Skip");
    expect(html).not.toContain("<textarea");
  });
});
