import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { ExamIntroView } from "@/components/ExamIntroView/ExamIntroView";
import { EXAM_MINUTES, EXAM_QUESTIONS, PASS_MARK } from "@/lib/config";

const render = (last: { percent: number; finishedAt: number } | null, best = last) =>
  renderToStaticMarkup(
    <ActionBarProvider>
      <ExamIntroView last={last} best={best} onStart={() => undefined} />
    </ActionBarProvider>,
  );

describe("the Exam intro", () => {
  const html = render(null);

  it("has the white Back to Home, the title and the muted line", () => {
    expect(html).toContain('aria-label="Back to Home"');
    expect(html).toContain('href="/"');
    expect(html).toContain(">Exam</h1>");
    expect(html).toContain("A full check of your knowledge");
  });

  it("lists the rules, read from the constants", () => {
    expect(html).toContain(">How it works<");
    expect(html).toContain(`${EXAM_QUESTIONS} questions from all topics`);
    expect(html).toContain(`${EXAM_MINUTES} minutes`);
    expect(html).toContain("No hints");
    expect(html).toContain(`Pass mark ${PASS_MARK}%`);
    expect(html.match(/h-9 w-9/g)).toHaveLength(4);
    const source = readFileSync("components/ExamIntroView/ExamIntroView.tsx", "utf8");
    expect(source).not.toMatch(/"20 |20 minutes"|80%"/);
  });

  it("says you have not taken the exam yet, with no results", () => {
    expect(html).toContain("You have not taken the exam yet");
    expect(html).not.toMatch(/>Last<|>Best</);
  });

  it("shows the last and the best result with their dates after an attempt", () => {
    const after = render(
      { percent: 70, finishedAt: new Date(2026, 9, 14).getTime() },
      { percent: 85, finishedAt: new Date(2026, 9, 12).getTime() },
    );
    expect(after).toContain("70%");
    expect(after).toContain("14 Oct");
    expect(after).toContain("85%");
    expect(after).toContain("12 Oct");
    expect(after).not.toContain("You have not taken the exam yet");
  });

  it("has the sticky primary Start exam", () => {
    const source = readFileSync("components/ExamIntroView/ExamIntroView.tsx", "utf8");
    expect(source).toContain("<ActionBar>");
    expect(source).toContain("Start exam");
  });
});
