import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { QuestionScreen } from "@/components/QuestionScreen/QuestionScreen";
import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import { SessionSetup, defaultSetup } from "@/components/SessionSetup/SessionSetup";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { stripStates } from "@/components/StepStrip/StepStrip";
import { loadAllSections } from "@/lib/guide";
import { questions } from "@/lib/quiz";
import { scenarios } from "@/lib/scenario";

const noop = () => undefined;
const items = [...scenarios.flatMap((def) => def.steps), ...questions];

function withSources(node: React.ReactNode) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>{node}</ActionBarProvider>
    </SourceSheetProvider>,
  );
}

/** The words a person reads: tags removed. */
const visibleText = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

describe("one screen for steps and questions", () => {
  it("shows a scenario step with its situation, the question and lettered options", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(<QuestionScreen item={step} choice={null} onChoose={noop} />);
    expect(html).toContain(step.situation);
    expect(html).toContain(step.question);
    expect(html).toContain("Choose one answer");
    step.options.forEach((option, index) => {
      expect(html).toContain(option.text);
      expect(html).toContain(`>${"ABCD"[index]}</span>`);
    });
    expect(html.indexOf(step.situation!)).toBeLessThan(html.indexOf(step.question));
  });

  it("shows a quiz question the same way, without a situation", () => {
    const question = questions[0];
    const html = withSources(<QuestionScreen item={question} choice="a" onChoose={noop} />);
    expect(html).toContain(question.question);
    expect(html.match(/type="radio"/g)).toHaveLength(question.options.length);
    expect(html).toContain("checked");
  });

  it("puts the letter badge on the left: a 24px olive-tint circle with a dark letter", () => {
    const html = renderToStaticMarkup(
      <SelectableCard size="row" letter="B" name="n" value="v" checked={false} onChange={noop}>
        Option text
      </SelectableCard>,
    );
    expect(html).toContain("h-6 w-6");
    expect(html).toContain("bg-olive-tint");
    expect(html).toContain("text-text");
    expect(html.indexOf(">B<")).toBeLessThan(html.indexOf("Option text"));
  });

  it("is a card on the page with the radius and shadow of cards", () => {
    const html = withSources(<QuestionScreen item={items[0]} choice={null} onChoose={noop} />);
    expect(html).toContain("rounded-card bg-card");
  });

  it("draws the media slot only when the item has an image, with a placeholder when src is empty", () => {
    const step = scenarios[0].steps[0];
    expect(withSources(<QuestionScreen item={step} choice={null} onChoose={noop} />)).not.toContain(
      "data-media3d",
    );
    const empty = withSources(
      <QuestionScreen
        item={{ ...step, image: { src: "", alt: "A corridor" } }}
        choice={null}
        onChoose={noop}
      />,
    );
    expect(empty).toContain('data-media3d="placeholder"');
    expect(empty).toContain("aspect-[4/3]");
    expect(empty.indexOf("data-media3d")).toBeLessThan(empty.indexOf(step.situation!));
    const withPicture = withSources(
      <QuestionScreen
        item={{ ...step, image: { src: "/scenarios/s01-alarm.webp", alt: "A corridor" } }}
        choice={null}
        onChoose={noop}
      />,
    );
    expect(withPicture).toContain('alt="A corridor"');
    expect(withPicture).not.toContain("data-media3d");
    expect(withPicture).toContain("object-cover");
  });
});

describe("the top row", () => {
  const render = (index: number) =>
    renderToStaticMarkup(
      <SessionTopBar
        index={index}
        total={10}
        unit="Question"
        states={stripStates(Array(10).fill(false), index)}
        onJump={noop}
        onBack={noop}
        onLeave={noop}
      />,
    );

  it("has the 40px white Back on the left, the position in the middle and Exit on the right", () => {
    const html = render(2);
    const order = ['aria-label="Previous question"', "Question 3 of 10", ">Exit<"].map((text) =>
      html.indexOf(text),
    );
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html).toContain("h-10 w-10");
    expect(html).toContain("bg-surface");
  });

  it("names Back as leaving on the first question, which opens the Exit confirmation", () => {
    expect(render(0)).toContain('aria-label="Leave this session"');
    expect(render(0)).not.toContain("Previous question");
  });

  it("has the step strip under it with every question", () => {
    expect(render(0).match(/aria-label="Question \d+,/g)).toHaveLength(10);
  });
});

describe("no AI or bot wording in a session", () => {
  const banned = /\bAI\b|\bbot\b/i;

  it("is absent from every step and every question", () => {
    items.forEach((item) => {
      const html = withSources(
        <QuestionScreen item={item} choice={item.options[0].id} onChoose={noop} />,
      );
      expect(visibleText(html), item.id).not.toMatch(banned);
    });
  });

  it("is absent from the top row and from Session setup, in both modes, with no footer note", () => {
    const top = renderToStaticMarkup(
      <SessionTopBar
        index={0}
        total={3}
        unit="Step"
        states={stripStates([false, false, false], 0)}
        onJump={noop}
        onBack={noop}
        onLeave={noop}
      />,
    );
    expect(visibleText(top)).not.toMatch(banned);
    for (const mode of ["scenario", "quiz"] as const) {
      const html = withSources(
        <SessionSetup
          value={{ ...defaultSetup, mode, sections: ["S1", "S2"] }}
          onChange={noop}
          onStart={noop}
          materialName="Sample evacuation guide.pdf"
          guideSectionIds={["S1", "S2"]}
          stats={{ questions: 0, correct: 0, incorrect: 0 }}
          practised={0}
          weakSectionIds={[]}
        />,
      );
      expect(visibleText(html)).not.toMatch(banned);
      expect(html).not.toContain("simulated for this prototype");
    }
  });
});
