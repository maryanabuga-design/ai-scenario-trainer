import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExamTimer } from "@/components/ExamTimer/ExamTimer";

describe("the exam timer", () => {
  it("is a pill with the time as mm:ss and a clock icon", () => {
    const html = renderToStaticMarkup(<ExamTimer seconds={19 * 60 + 5} />);
    expect(html).toContain(">19:05<");
    expect(html).toContain('role="timer"');
    expect(html).toContain("lucide-clock");
    expect(html).toContain("rounded-full");
  });

  it("is in the card colour until the last 2 minutes, then deep olive (never rose)", () => {
    const calm = renderToStaticMarkup(<ExamTimer seconds={121} />);
    expect(calm).toContain("bg-card");
    expect(calm).toContain('data-warning="false"');
    expect(calm).not.toContain("bg-primary");
    const warn = renderToStaticMarkup(<ExamTimer seconds={120} />);
    expect(warn).toContain("bg-primary text-primary-text");
    expect(warn).not.toContain("rose");
    expect(warn).toContain('data-warning="true"');
    expect(renderToStaticMarkup(<ExamTimer seconds={0} />)).toContain(">00:00<");
  });

  it("speaks only at a few moments", () => {
    expect(renderToStaticMarkup(<ExamTimer seconds={120} />)).toContain("2 minutes left");
    expect(renderToStaticMarkup(<ExamTimer seconds={500} />)).not.toContain("left</span>");
  });
});
