import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import pkg from "@/package.json";
import { AboutView, aboutLines } from "@/components/AboutView/AboutView";
import { InstructorHomeView } from "@/components/InstructorHomeView/InstructorHomeView";

describe("About this prototype", () => {
  const html = renderToStaticMarkup(<AboutView />);

  it("has Back to Profile, the title and exactly four lines, the last being the version", () => {
    expect(html).toContain('aria-label="Back to Profile"');
    expect(html).toContain('href="/profile"');
    expect(html).toContain(">About this prototype</h1>");
    expect(aboutLines).toEqual([
      "Your progress is saved on this device only.",
      "AI answers are prepared examples; there is no live AI model.",
      "All content is educational.",
      `Version ${pkg.version}`,
    ]);
    expect(html.match(/<li/g)).toHaveLength(4);
    for (const line of aboutLines) expect(html).toContain(line);
  });
});

describe("Instructor Home", () => {
  const html = renderToStaticMarkup(<InstructorHomeView />);

  it("is a title and an empty state, with no buttons or links", () => {
    expect(html).toContain(">Instructor</h1>");
    expect(html).toContain("No exams yet. Exam tools are coming next.");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<a ");
  });
});
