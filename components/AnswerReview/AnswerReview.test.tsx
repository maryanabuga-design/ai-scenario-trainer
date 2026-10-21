import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerReview } from "@/components/AnswerReview/AnswerReview";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";
import { getItem } from "@/lib/items";

function render(itemId: string, choice: string | null, position = 2, total = 5) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>
        <AnswerReview
          item={getItem(itemId)}
          choice={choice}
          position={position}
          total={total}
          backHref="/session/results"
          backLabel="Back to results"
          hrefFor={(next) => `/session/results/review/${next}`}
          marks={["correct", "wrong", "correct", "correct", "wrong"]}
          onJump={() => undefined}
          saved={false}
          onToggleSaved={() => undefined}
        />
      </ActionBarProvider>
    </SourceSheetProvider>,
  );
}

/** The markup of one option row, found by its letter-less text. */
function row(html: string, text: string) {
  const end = html.indexOf(text);
  const start = html.lastIndexOf("<li ", end);
  return html.slice(start, html.indexOf("</li>", end));
}

describe("Answer review", () => {
  const step = getItem("q-scn-s01-001");
  const text = (id: string) => step.options.find((option) => option.id === id)!.text;

  it("shows the situation and the question, then every option", () => {
    const html = render("q-scn-s01-001", "a");
    expect(html).toContain(step.situation);
    expect(html).toContain(step.question);
    step.options.forEach((option) => expect(html).toContain(option.text));
    expect(html.indexOf(step.situation!)).toBeLessThan(html.indexOf(step.options[0].text));
    expect(html.match(/data-state=/g)).toHaveLength(3);
  });

  it("when wrong: the chosen option is red with a cross and Not quite; the right one is green with a check and Correct answer", () => {
    const html = render("q-scn-s01-001", "a");
    const correct = row(html, text("b"));
    expect(correct).toContain('data-state="revealed-correct"');
    expect(correct).toContain("border-correct bg-correct-bg");
    expect(correct).toContain("lucide-check");
    expect(correct).toContain(">Correct answer<");
    expect(correct).toContain("text-correct-text");
    const chosen = row(html, text("a"));
    expect(chosen).toContain('data-state="wrong"');
    expect(chosen).toContain("border-wrong bg-wrong-bg");
    expect(chosen).toContain("lucide-x");
    expect(chosen).toContain(">Not quite<");
    expect(chosen).toContain("text-wrong-text");
  });

  it("when right: the chosen option is green with a check and Correct, and nothing is red", () => {
    const html = render("q-scn-s01-001", "b");
    const correct = row(html, text("b"));
    expect(correct).toContain('data-state="correct"');
    expect(correct).toContain(">Correct<");
    expect(correct).toContain("lucide-check");
    const options = html.slice(html.indexOf("data-state="), html.indexOf(">Why<"));
    expect(options).not.toContain("lucide-x");
    expect(options).not.toContain("bg-wrong-bg");
    expect(options).not.toContain("Not quite");
  });

  it("leaves the other options white with an empty radio, no label and no icon", () => {
    const html = render("q-scn-s01-001", "a");
    const plain = row(html, text("c"));
    expect(plain).toContain('data-state="idle"');
    expect(plain).toContain("bg-card");
    expect(plain).not.toMatch(/Correct|Not quite|lucide-check|lucide-x/);
  });

  it("has no letters on the options and no Check button", () => {
    const html = render("q-scn-s01-001", "a");
    expect(html).not.toMatch(/>[ABCD]<\/span>/);
    expect(html).not.toMatch(/>Check</);
  });

  it("shows Why and the Guide chips, with no verdict line and no explanation", () => {
    const html = render("q-scn-s01-001", "a");
    expect(html.indexOf(">Why<")).toBeGreaterThan(html.indexOf(text("a")));
    expect(html).toContain(step.why);
    expect(html).toContain("Guide · S1");
    expect(html).not.toMatch(/Matches the guide|Doesn&#x27;t match|Your explanation|What happened/);
  });

  it("has no Previous or Next question text link (the pinned buttons are checked in the browser)", () => {
    const html = render("q-scn-s01-001", "a", 2, 5);
    expect(html).not.toContain("Previous question");
    // (the only type-action is the inline "Ask AI about this question" action, not a text link to a question)
    expect(html.replace(/<a [^>]*data-ask-ai-row[\s\S]*?<\/a>/, "")).not.toMatch(/type-action/);
    expect(render("q-scn-s01-001", "a", 1, 5)).toContain("Question 1 of 5");
  });

  it("shows a quiz question the same way, without a situation or Ask AI", () => {
    const html = render("q-s3-3", "a");
    const question = getItem("q-s3-3");
    expect(html).toContain(question.question);
    expect(html).not.toContain("Ask AI about this step");
    expect(html.match(/data-state=/g)).toHaveLength(question.options.length);
  });

  it("offers the row 'Ask AI about this question' (a link to this question's thread), not the old step link", () => {
    for (const id of ["q-scn-s01-001", "q-s3-3"]) {
      const html = render(id, "a", 2, 5);
      expect(html).toContain("Ask AI about this question");
      expect(html).toContain(`href="/ask-ai/q-${id}"`);
      // the tertiary inline action: no card, no chevron, a 44px tap target, the underlined label
      const row = html.slice(
        html.indexOf("data-ask-ai-row"),
        html.indexOf("</a>", html.indexOf("data-ask-ai-row")),
      );
      expect(row).toContain("min-h-11");
      expect(row).toContain("w-full");
      expect(row).toContain("underline");
      expect(row).toContain("text-primary");
      expect(row).not.toMatch(/bg-card|shadow-|lucide-chevron-right|h-14/);
      expect(html.indexOf("data-ask-ai-row")).toBeGreaterThan(html.indexOf(">Why<"));
      expect(html).not.toContain("Ask AI about this step");
    }
  });

  it("puts the situation in the shared white card", () => {
    const html = render("q-scn-s01-001", "a");
    const card = html.slice(html.indexOf("data-situation-card"));
    expect(card.slice(0, card.indexOf("</section>"))).toContain(step.situation!);
    expect(html).toContain("rounded-card bg-card p-4 shadow-(--card-shadow)");
  });

  it("has the pager under the top row, one chip per question, current marked, no icons", () => {
    const html = render("q-scn-s01-001", "a", 2, 5);
    const pager = html.slice(html.indexOf("<ol"), html.indexOf("</ol>"));
    expect(html.indexOf("Question 2 of 5")).toBeLessThan(html.indexOf("<ol"));
    expect(html.indexOf("</ol>")).toBeLessThan(html.indexOf(getItem("q-scn-s01-001").question));
    expect(pager.match(/<button/g)).toHaveLength(5);
    expect(pager).toContain('aria-label="Question 1, correct"');
    expect(pager).toContain('aria-label="Question 2, wrong"');
    expect(pager).toContain('aria-current="step"');
    expect(pager.match(/outline-primary/g)).toHaveLength(1);
    expect(pager).not.toMatch(/lucide|<svg/);
  });
});
