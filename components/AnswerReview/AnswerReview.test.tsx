import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerReview, optionState } from "@/components/AnswerReview/AnswerReview";
import { AskAiProvider } from "@/components/AskAi/AskAi";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";
import { getItem } from "@/lib/items";

function render(itemId: string, choice: string | null, position = 2, total = 5) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <AskAiProvider>
        <AnswerReview
          item={getItem(itemId)}
          choice={choice}
          position={position}
          total={total}
          backHref="/session/results"
          backLabel="Back to results"
          hrefFor={(next) => `/session/results/review/${next}`}
        />
      </AskAiProvider>
    </SourceSheetProvider>,
  );
}

/** The markup of one option row, found by its letter-less text. */
function row(html: string, text: string) {
  const end = html.indexOf(text);
  const start = html.lastIndexOf("<li ", end);
  return html.slice(start, html.indexOf("</li>", end));
}

describe("option states", () => {
  const step = getItem("s1"); // b is right
  it("marks the right option, the person's wrong option, and the rest as plain", () => {
    expect(optionState(step, "b", "d")).toBe("correct");
    expect(optionState(step, "d", "d")).toBe("chosenWrong");
    expect(optionState(step, "a", "d")).toBe("plain");
    expect(optionState(step, "b", "b")).toBe("correct");
    expect(optionState(step, "a", null)).toBe("plain");
  });
});

describe("Answer review", () => {
  const step = getItem("s1");
  const text = (id: string) => step.options.find((option) => option.id === id)!.text;

  it("shows the situation and the question, then every option", () => {
    const html = render("s1", "d");
    expect(html).toContain(step.situation);
    expect(html).toContain(step.question);
    step.options.forEach((option) => expect(html).toContain(option.text));
    expect(html.indexOf(step.situation!)).toBeLessThan(html.indexOf(step.options[0].text));
    expect(html.match(/<li /g)).toHaveLength(4);
  });

  it("when wrong: the right option is green with a check and Correct answer; the choice is rose with a cross and Your answer", () => {
    const html = render("s1", "d");
    const correct = row(html, text("b"));
    expect(correct).toContain('data-state="correct"');
    expect(correct).toContain("bg-correct-bg");
    expect(correct).toContain("lucide-check");
    expect(correct).toContain("Correct answer");
    expect(correct).not.toContain("Your answer");
    const chosen = row(html, text("d"));
    expect(chosen).toContain('data-state="chosenWrong"');
    expect(chosen).toContain("bg-wrong-bg");
    expect(chosen).toContain("lucide-x");
    expect(chosen).toContain("Your answer");
    expect(chosen).not.toContain("Correct answer");
  });

  it("when right: the right option shows Correct answer and Your answer with a check", () => {
    const html = render("s1", "b");
    const correct = row(html, text("b"));
    expect(correct).toContain("Correct answer");
    expect(correct).toContain("Your answer");
    expect(html.match(/Your answer/g)).toHaveLength(1);
    expect(html).not.toContain("lucide-x");
    expect(html).not.toContain("bg-wrong-bg");
  });

  it("leaves the other options neutral, with no tag or icon", () => {
    const html = render("s1", "d");
    for (const id of ["a", "c"]) {
      const plain = row(html, text(id));
      expect(plain).toContain('data-state="plain"');
      expect(plain).not.toMatch(/Correct answer|Your answer|lucide-check|lucide-x/);
    }
  });

  it("shows Why and the Guide chips, with no verdict line and no explanation", () => {
    const html = render("s1", "d");
    expect(html.indexOf(">Why<")).toBeGreaterThan(html.indexOf(text("a")));
    expect(html).toContain(step.why);
    expect(html).toContain("Guide · S1");
    expect(html).not.toMatch(/Matches the guide|Doesn&#x27;t match|Your explanation|What happened/);
  });

  it("ends with Back to results first, then Previous and Next question", () => {
    const html = render("s1", "d", 2, 5);
    const order = [">Back to results<", ">Previous question<", ">Next question<"].map((part) =>
      html.indexOf(part),
    );
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain('href="/session/results/review/1"');
    expect(html).toContain('href="/session/results/review/3"');
  });

  it("hides Previous on the first question and Next on the last", () => {
    expect(render("s1", "d", 1, 5)).not.toContain("Previous question");
    expect(render("s1", "d", 5, 5)).not.toContain("Next question");
    expect(render("s1", "d", 1, 5)).toContain("Question 1 of 5");
  });

  it("shows a quiz question the same way, without a situation or Ask AI", () => {
    const html = render("q-s3-3", "a");
    const question = getItem("q-s3-3");
    expect(html).toContain(question.question);
    expect(html).not.toContain("Ask AI about this step");
    expect(html.match(/<li /g)).toHaveLength(question.options.length);
  });

  it("offers Ask AI about this step on a scenario step with prepared answers", () => {
    expect(render("s1", "d")).toContain("Ask AI about this step");
  });
});
