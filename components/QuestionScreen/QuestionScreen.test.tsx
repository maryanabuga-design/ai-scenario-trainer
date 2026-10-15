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

/** The extra props the screen needs: saved state and an optional open hint. */
const extras = { saved: false, onToggleSaved: noop, hint: null };
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
    const html = withSources(
      <QuestionScreen item={step} choice={null} onChoose={noop} {...extras} />,
    );
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
    const html = withSources(
      <QuestionScreen item={question} choice="a" onChoose={noop} {...extras} />,
    );
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
    const html = withSources(
      <QuestionScreen item={items[0]} choice={null} onChoose={noop} {...extras} />,
    );
    expect(html).toContain("rounded-card bg-card");
  });

  it("draws a scenario's step picture first, a placeholder when it has no image, then the situation card", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(
      <QuestionScreen item={step} choice={null} onChoose={noop} {...extras} />,
    );
    expect(html).toContain('data-media3d="placeholder"');
    expect(html).toContain("aspect-[4/3]");
    expect(html.indexOf("data-media3d")).toBeLessThan(html.indexOf(step.situation!));
    const card = html.slice(html.lastIndexOf("<section", html.indexOf(step.situation!)));
    expect(card).toContain("rounded-card bg-card");
    expect(html.indexOf(step.situation!)).toBeLessThan(html.indexOf(step.question));
    const withPicture = withSources(
      <QuestionScreen
        item={{ ...step, image: { src: "/scenarios/s01-alarm.webp", alt: "A corridor" } }}
        choice={null}
        onChoose={noop}
        {...extras}
      />,
    );
    expect(withPicture).toContain('alt="A corridor"');
    expect(withPicture).not.toContain("data-media3d");
    expect(withPicture).toContain("object-cover");
  });

  it("draws a quiz question's picture only when it has one, with no empty gap otherwise", () => {
    const question = questions[0];
    const plain = withSources(
      <QuestionScreen item={question} choice={null} onChoose={noop} {...extras} />,
    );
    expect(plain).not.toContain("data-media3d");
    expect(plain).not.toContain("aspect-[4/3]");
    expect(plain.startsWith('<div class="flex flex-col gap-4"><div class="flex items-start')).toBe(
      true,
    );
    const placeholder = withSources(
      <QuestionScreen
        item={{ ...question, image: { src: "", alt: "A sign" } }}
        choice={null}
        onChoose={noop}
        {...extras}
      />,
    );
    expect(placeholder).toContain('data-media3d="placeholder"');
    expect(placeholder.indexOf("data-media3d")).toBeLessThan(
      placeholder.indexOf(question.question),
    );
  });
});

describe("options", () => {
  it("gives a scenario question 3 options, A to C", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(
      <QuestionScreen item={step} choice={null} onChoose={noop} {...extras} />,
    );
    expect(html.match(/type="radio"/g)).toHaveLength(3);
    for (const letter of "ABC") expect(html).toContain(`>${letter}</span>`);
    expect(html).not.toContain(">D</span>");
  });

  it("gives a quiz question 3 or 4 options and a true-false question 2, A and B", () => {
    const four = questions.find((question) => question.options.length === 4)!;
    expect(
      withSources(<QuestionScreen item={four} choice={null} onChoose={noop} {...extras} />).match(
        /type="radio"/g,
      ),
    ).toHaveLength(4);
    const tf = questions.find((question) => question.type === "true-false")!;
    const html = withSources(
      <QuestionScreen item={tf} choice={null} onChoose={noop} {...extras} />,
    );
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).toContain(">True<");
    expect(html).toContain(">False<");
    expect(html).toContain(">A</span>");
    expect(html).toContain(">B</span>");
    expect(html).not.toContain(">C</span>");
  });

  it("turns the letter badge of the selected row primary, and leaves the others olive", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(
      <QuestionScreen item={step} choice={step.options[1].id} onChoose={noop} {...extras} />,
    );
    expect(html.match(/bg-primary text-primary-text/g)).toHaveLength(1);
    expect(html.match(/bg-olive-tint text-text/g)).toHaveLength(2);
    const selected = html.slice(html.indexOf("bg-primary text-primary-text"));
    expect(selected.indexOf(">B<")).toBeGreaterThan(-1);
  });

  it("shows no red or green and no verdict during the session", () => {
    const html = withSources(
      <QuestionScreen item={items[0]} choice="a" onChoose={noop} {...extras} />,
    );
    expect(html).not.toMatch(/correct-bg|wrong-bg|text-correct|text-wrong|Correct answer/);
  });
});

describe("the bookmark", () => {
  const step = scenarios[0].steps[0];
  const render = (saved: boolean) =>
    withSources(
      <QuestionScreen item={step} choice={null} onChoose={noop} {...extras} saved={saved} />,
    );

  it("sits on the right of the question: a 40px white circle with a 1px stroke", () => {
    const html = render(false);
    const button = html.slice(html.indexOf("<button"), html.indexOf("</button>"));
    expect(html.indexOf(step.question)).toBeLessThan(html.indexOf('aria-label="Save question"'));
    expect(button).toContain("h-10 w-10");
    expect(button).toContain("rounded-full border border-arrow-stroke bg-surface");
    expect(button).toContain('aria-pressed="false"');
  });

  it("is outlined when the question is not saved and filled when it is", () => {
    expect(render(false)).toContain('fill="none"');
    const saved = render(true);
    expect(saved).toContain('aria-label="Remove from saved"');
    expect(saved).toContain('aria-pressed="true"');
    expect(saved).toContain('fill="currentColor"');
  });
});

describe("the hint card", () => {
  const step = scenarios[0].steps[0];
  const hint = { text: step.hint!, section: "S1" };

  it("is absent while closed", () => {
    const html = withSources(
      <QuestionScreen item={step} choice={null} onChoose={noop} {...extras} />,
    );
    expect(html).not.toContain(step.hint);
    expect(html).not.toContain('aria-label="Hint"');
  });

  it("opens inside the page under the options, with the label, the text and a Guide chip", () => {
    const html = withSources(
      <QuestionScreen item={step} choice={null} onChoose={noop} {...extras} hint={hint} />,
    );
    const lastOption = html.lastIndexOf(step.options[2].text);
    const card = html.slice(html.indexOf('aria-label="Hint"') - 40);
    expect(html.indexOf('aria-label="Hint"')).toBeGreaterThan(lastOption);
    expect(card).toContain("lucide-lightbulb");
    expect(card).toContain(">Hint<");
    expect(card).toContain(step.hint);
    expect(card).toContain("Guide · S1");
    expect(
      card.slice(0, card.indexOf("<dialog") === -1 ? undefined : card.indexOf("<dialog")),
    ).not.toMatch(/aria-modal|role="dialog"/);
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
        <QuestionScreen item={item} choice={item.options[0].id} onChoose={noop} {...extras} />,
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
