import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { HomeView } from "@/components/HomeView/HomeView";
import { MaterialsTopics } from "@/components/MaterialsTopics/MaterialsTopics";
import { QuestionScreen } from "@/components/QuestionScreen/QuestionScreen";
import { ResultsView } from "@/components/ResultsView/ResultsView";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { StepsList } from "@/components/StepsView/StepsList";
import { TrainingView } from "@/components/TrainingView/TrainingView";
import { deadlineText } from "@/lib/exam-deadline";
import { loadAllSections } from "@/lib/guide";
import { getItem } from "@/lib/items";
import { homeCounts, homeSummary } from "@/lib/home";
import { modeStats } from "@/lib/part-progress";
import { partsFor } from "@/lib/parts";
import { scoreItem } from "@/lib/scoring";
import { weakTopics } from "@/lib/weak-topics";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/",
}));

/**
 * The percentage rule (DESIGN.md: Exam readiness, assigned exams and the percentage vocabulary): at
 * most one percentage per screen, each with its own word, and COUNTS everywhere else. A "%" may be
 * written only on the exam screen, on Progress, on the exam results and in the repeat-session
 * summary's one Readiness line; Materials, Home, Training, Steps and the question screens have none.
 */
const text = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
const noop = () => undefined;

describe("the percentage rule", () => {
  it("Home has no percentage, with or without an exam result", () => {
    const counts = homeCounts({ history: [], saved: [] });
    for (const withExam of [counts, { ...counts, bestExam: { correct: 17, questions: 20 } }]) {
      const html = renderToStaticMarkup(
        <HomeView
          name="Maryana"
          summary={homeSummary({ unfinished: null, history: [] })}
          counts={withExam}
        />,
      );
      expect(text(html)).not.toContain("%");
    }
  });

  it("Materials has no percentage", () => {
    expect(text(renderToStaticMarkup(<MaterialsTopics />))).not.toContain("%");
  });

  it("Steps has no percentage", () => {
    expect(text(renderToStaticMarkup(<StepsList />))).not.toContain("%");
  });

  it("Training has no percentage: stats and rings are counts, the exam card has no number", () => {
    const part = partsFor("quiz")[0];
    const html = renderToStaticMarkup(
      <TrainingView
        guideName="G"
        mode="quiz"
        onModeChange={noop}
        stats={modeStats([], "quiz")}
        topics={[
          {
            sectionId: "S1",
            title: "Title",
            toRepeat: 1,
            parts: [{ part, state: "done", recommended: false }],
          },
        ]}
        records={{
          [part.id]: {
            lastPercent: 70,
            attempts: 1,
            answeredIds: part.itemIds,
            correctIds: part.itemIds.slice(0, 7),
          },
        }}
        exams={[
          {
            id: "e",
            title: "Evacuation basics exam",
            deadline: deadlineText("2026-10-25", new Date(2026, 9, 19)),
          },
        ]}
        onStartPart={noop}
      />,
    );
    expect(text(html)).not.toContain("%");
    expect(html).not.toMatch(/aria-label="[^"]*%/);
    expect(text(html)).toContain("Due 25 Oct · 6 days left");
    expect(text(html)).toContain("7/");
  });

  it("the question screens have no percentage, before and after Check", () => {
    const item = getItem("q-quiz-s01-001");
    for (const checked of [false, true]) {
      const html = renderToStaticMarkup(
        <SourceSheetProvider sections={loadAllSections()}>
          <ActionBarProvider>
            <QuestionScreen
              item={item}
              choice={item.correctOptionId}
              onChoose={noop}
              saved={false}
              onToggleSaved={noop}
              hint={null}
              checked={checked}
            />
          </ActionBarProvider>
        </SourceSheetProvider>,
      );
      expect(text(html)).not.toContain("%");
    }
  });

  it("a practice session's results are counts only", () => {
    const items = [
      scoreItem(getItem("q-quiz-s01-001"), getItem("q-quiz-s01-001").correctOptionId),
      scoreItem(getItem("q-quiz-s01-002"), "zzz"),
    ];
    for (const kind of ["quiz", "scenario", "repeat"] as const) {
      const html = renderToStaticMarkup(
        <SourceSheetProvider sections={loadAllSections()}>
          <ActionBarProvider>
            <ResultsView kind={kind} items={items} topics={weakTopics(items)} onRepeat={noop} />
          </ActionBarProvider>
        </SourceSheetProvider>,
      );
      expect(text(html), kind).not.toContain("%");
      expect(html, kind).not.toMatch(/aria-label="[^"]*%/);
    }
  });
});
