import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerReview } from "@/components/AnswerReview/AnswerReview";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { reviewAt } from "@/lib/answer-review";
import { loadAllSections } from "@/lib/guide";
import { getQuestion } from "@/lib/quiz";
import { getStep } from "@/lib/scenario";
import type { Answer, QuizSession, ScenarioSession } from "@/lib/session";
import { setMarkedCorrect } from "@/lib/session";

const GOOD = "The alarm is real, so we take the stairs now.";
const GIBBERISH = "лбтдлюью";

const answer = (stepId: string, optionId: string, explanation: string): Answer => ({
  stepId,
  optionId,
  confidence: 3,
  explanation,
  ...(explanation ? { answerSource: "typed" as const } : { skipped: true }),
});

const scenario = (answers: Answer[]): ScenarioSession => ({
  mode: "short",
  stepIds: ["s1", "s2", "s3"],
  index: 2,
  finished: true,
  finishedAt: 1,
  answers: [...answers, answer("s2", "c", GOOD), answer("s3", "a", GOOD)],
});

function render(session: ScenarioSession | QuizSession, position: number) {
  const data = reviewAt(session, position);
  if (!data) throw new Error("No review");
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <AskAiProvider>
        <AnswerReview
          data={data}
          noun={session.kind === "quiz" ? "question" : "step"}
          backHref="/session/results"
          backLabel="Back to results"
          hrefFor={(next) => `/session/results/review/${next}`}
          onMarkCorrect={() => undefined}
        />
      </AskAiProvider>
    </SourceSheetProvider>,
  );
}

/** The positions of the given texts, which must all be there and in the given order. */
function inOrder(html: string, texts: string[]) {
  const positions = texts.map((text) => {
    const at = html.indexOf(text);
    expect(at, text).toBeGreaterThan(-1);
    return at;
  });
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
}

describe("Answer review of a scenario step", () => {
  it("shows the full situation and question, your choice, explanation, why and what happened", () => {
    const html = render(scenario([answer("s1", "d", GIBBERISH)]), 1);
    const step = getStep("s1");
    expect(html).toContain(step.title);
    expect(html).toContain(step.narrative);
    expect(html).toContain(step.question);
    inOrder(
      html,
      [
        "Your choice",
        "Your explanation",
        "Better explanation",
        "Why",
        "Guide",
        "What happened",
        ">Back to results<",
        "My explanation is still correct",
        "Previous",
      ].filter((text) => text !== "Previous"),
    );
    expect(html).toContain("Doesn&#x27;t match the guide yet");
    expect(html).toContain(step.referenceExplanation);
  });

  it("draws the choice with a cross when wrong and a check when right", () => {
    const wrong = render(scenario([answer("s1", "d", GOOD)]), 1);
    const right = render(scenario([answer("s1", "b", GOOD)]), 1);
    const choice = (html: string) =>
      html.slice(html.indexOf("Your choice") - 400, html.indexOf("Your choice"));
    expect(choice(wrong)).toContain("lucide-x");
    expect(choice(right)).toContain("lucide-check");
  });

  it("hides the better explanation only for a right choice with a matching explanation", () => {
    const step = getStep("s1");
    const matched = render(scenario([answer("s1", "b", GOOD)]), 1);
    expect(matched).toContain("Matches the guide");
    expect(matched).not.toContain("Better explanation");
    expect(matched).not.toContain("My explanation is still correct");
    for (const html of [
      render(scenario([answer("s1", "b", GIBBERISH)]), 1),
      render(scenario([answer("s1", "b", "")]), 1),
      render(scenario([answer("s1", "d", GOOD)]), 1),
    ]) {
      expect(html).toContain("Better explanation");
      expect(html).toContain(step.referenceExplanation);
    }
  });

  it("shows I don't know when the explanation was skipped, with no still-correct button", () => {
    const html = render(scenario([answer("s1", "b", "")]), 1);
    expect(html).toContain("You pressed I don&#x27;t know.");
    expect(html).not.toContain("My explanation is still correct");
  });

  it("offers My explanation is still correct for a typed explanation that does not match", () => {
    for (const option of ["b", "d"]) {
      expect(render(scenario([answer("s1", option, GIBBERISH)]), 1)).toContain(
        "My explanation is still correct",
      );
    }
  });

  it("then shows Marked as correct by you with an underlined Undo, and keeps the better explanation", () => {
    const marked = setMarkedCorrect(scenario([answer("s1", "b", GIBBERISH)]), "s1", true);
    const html = render(marked, 1);
    expect(html).toContain("Marked as correct by you");
    expect(html).toContain(">Undo<");
    expect(html).toContain("Marked correct by you");
    expect(html).not.toContain("My explanation is still correct");
    expect(html).toContain("Better explanation");
  });

  it("has Back to results first, then Next step (no Previous on the first step)", () => {
    const first = render(scenario([answer("s1", "b", GOOD)]), 1);
    expect(first).not.toContain("Previous step");
    expect(first).toContain('href="/session/results/review/2"');
    expect(first).toContain("Next step");
    const middle = render(scenario([answer("s1", "b", GOOD)]), 2);
    expect(middle).toContain('href="/session/results/review/1"');
    expect(middle).toContain('href="/session/results/review/3"');
    const last = render(scenario([answer("s1", "b", GOOD)]), 3);
    expect(last).not.toContain("Next step");
    expect(last).toContain("Previous step");
  });

  it("has the circular back button named for where it goes", () => {
    const html = render(scenario([answer("s1", "b", GOOD)]), 1);
    expect(html).toContain('aria-label="Back to results"');
    expect(html).toContain("Step 1 of 3");
  });
});

describe("Answer review of a quiz question", () => {
  const quiz = (answers: QuizSession["answers"]): QuizSession => ({
    kind: "quiz",
    mode: "quiz",
    sections: ["S1", "S2"],
    questionIds: answers.map((saved) => saved.questionId),
    index: 0,
    finished: true,
    finishedAt: 1,
    answers,
  });
  const text = getQuestion("q-s2-1");

  it("shows the question, the choice and the correct answer for a wrong choice", () => {
    const single = getQuestion("q-s1-1");
    const html = render(
      quiz([{ questionId: single.id, response: { type: "single", optionId: "a" }, confidence: 3 }]),
      1,
    );
    expect(html).toContain(single.question);
    inOrder(html, ["Your answer", "Correct answer", "Why", "Guide"]);
    expect(html).toContain("Question 1 of 1");
  });

  it("offers My answer is still correct for a rejected short answer, and marks it with Undo", () => {
    const typed = {
      questionId: text.id,
      response: { type: "text" as const, text: "бла бла" },
      confidence: 2 as const,
      answerSource: "typed" as const,
    };
    const html = render(quiz([typed]), 1);
    expect(html).toContain("My answer is still correct");
    expect(html).toContain("Better answer");
    const marked = render(quiz([{ ...typed, markedCorrect: true }]), 1);
    expect(marked).toContain("Marked as correct by you");
    expect(marked).toContain(">Undo<");
  });

  it("never offers it after I don't know", () => {
    const html = render(
      quiz([
        {
          questionId: text.id,
          response: { type: "text", text: "" },
          confidence: null,
          dontKnow: true,
        },
      ]),
      1,
    );
    expect(html).not.toContain("My answer is still correct");
  });
});
