import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { SessionRunner } from "@/components/SessionRunner/SessionRunner";
import { ExamTimer } from "@/components/ExamTimer/ExamTimer";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";

const session = { itemIds: ["q-quiz-s01-001", "q-quiz-s01-002"], answers: [], index: 0 };

function render(exam: boolean) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>
        <SessionRunner
          session={session}
          unit="Question"
          hints={!exam}
          timer={exam ? <ExamTimer seconds={600} /> : undefined}
          leave={
            exam
              ? { title: "Leave the exam?", description: "Your progress will be lost." }
              : undefined
          }
          onChange={() => undefined}
          onFinish={() => undefined}
          onLeave={() => undefined}
        />
      </ActionBarProvider>
    </SourceSheetProvider>,
  );
}

describe("the exam question screen", () => {
  it("shows a timer pill under the top row, right-aligned, and the step strip", () => {
    const html = render(true);
    expect(html).toContain('role="timer"');
    expect(html).toContain("flex justify-end");
    expect(html.indexOf('role="timer"')).toBeGreaterThan(html.indexOf("Question 1 of 2"));
  });

  it("has no timer in a normal session", () => {
    expect(render(false)).not.toContain('role="timer"');
  });

  it("hides the hint button, so the bar shows only the primary Next", () => {
    // The action bar is drawn through a portal, so this checks how the runner builds it.
    const source = readFileSync("components/SessionRunner/SessionRunner.tsx", "utf8");
    expect(source).toMatch(/const hint = hints\s*\?\s*hintFor/);
    expect(source).toContain("hint={hint ? { open: hintOpen, onToggle: toggleHint } : undefined}");
    expect(readFileSync("app/(app)/exam/session/page.tsx", "utf8")).toContain("hints={false}");
    expect(readFileSync("app/(app)/session/page.tsx", "utf8")).not.toContain("hints={false}");
  });

  it("keeps the bookmark", () => {
    expect(render(true)).toMatch(/aria-label="(Save|Saved|Bookmark)[^"]*"/i);
  });

  it("opens the leave confirmation with the exam texts, Stay primary and Leave tertiary", () => {
    const source = readFileSync("components/SessionTopBar/SessionTopBar.tsx", "utf8");
    expect(source).toContain('emphasis="cancel"');
    expect(source).toContain('cancelLabel="Stay"');
    const page = readFileSync("app/(app)/exam/session/page.tsx", "utf8");
    expect(page).toContain("Leave the exam?");
    expect(page).toContain("Your progress will be lost.");
    expect(page).toContain("hints={false}");
    expect(page).toContain("clearExam()");
    expect(page).not.toContain("saveSession");
  });
});
