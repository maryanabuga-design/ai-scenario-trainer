import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BuiltInTopicView } from "@/components/InstructorContent/BuiltInTopicView";
import { phoneMarkup } from "@/lib/test-support/phone-markup";
import { stepsFor } from "@/lib/materials-topics";

const render = (id: string, tab?: "overview" | "steps") =>
  phoneMarkup(
    renderToStaticMarkup(
      <BuiltInTopicView
        id={id}
        title="Topic title"
        questions={12}
        minutes={4}
        guide={stepsFor(id)}
        tab={tab}
      />,
    ),
  ).replace(/<!-- -->/g, "");

describe("the built-in topic for the Instructor", () => {
  it("is read-only with the label and Back to Course topics", () => {
    const html = render("S2");
    expect(html).toContain("S2 · Course topic · read-only");
    expect(html).toContain('aria-label="Back to Course topics"');
    expect(html).toContain("12 questions");
    expect(html).toContain("4 min read");
    expect(html).not.toMatch(/<button|<textarea|<input type="text"/);
  });

  it("has a Steps tab only for the topics with an attached step guide (S1, S7, S8)", () => {
    for (const id of ["S1", "S7", "S8"]) {
      const html = render(id);
      expect(html, id).toContain('role="radiogroup"');
      expect(html, id).toContain(">Steps<");
      expect(html, id).toContain("Step guide ·");
    }
    for (const id of ["S2", "S3", "S4", "S5", "S6", "S9", "S10"]) {
      const html = render(id);
      expect(html, id).not.toContain('role="radiogroup"');
      expect(html, id).not.toContain(">Steps<");
      expect(html, id).not.toContain("Step guide");
    }
  });

  it("lists the steps of the guide as read-only step cards on the Steps tab", () => {
    const html = render("S7", "steps");
    const guide = stepsFor("S7")!;
    expect(html).toContain("data-built-in-steps");
    expect(html.match(/aria-controls=/g)).toHaveLength(guide.steps.length);
    expect(html).toContain(guide.steps[0].title);
    expect(html).not.toMatch(/checkbox|type="checkbox"|aria-checked/);
    expect(html).not.toMatch(/checklist/i);
  });
});
