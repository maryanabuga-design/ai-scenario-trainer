import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { QuestionScreen } from "@/components/QuestionScreen/QuestionScreen";
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
  it("shows a scenario step with its situation, the question and the options", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(
      <QuestionScreen item={step} choice={null} onChoose={noop} {...extras} />,
    );
    expect(html).toContain(step.situation);
    expect(html).toContain(step.question);
    expect(html).toContain("Choose one answer");
    step.options.forEach((option) => {
      expect(html).toContain(option.text);
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

  it("has no letters on the options: the radio is on the left of the text", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(
      <QuestionScreen item={step} choice={null} onChoose={noop} {...extras} />,
    );
    expect(html).not.toMatch(/>[ABCD]<\/span>/);
    const card = html.slice(html.indexOf("<label"), html.indexOf("</label>"));
    expect(card.indexOf('type="radio"')).toBeLessThan(card.indexOf(step.options[0].text));
    expect(card.indexOf("rounded-full border-2 border-primary")).toBeLessThan(
      card.indexOf(step.options[0].text),
    );
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
  const radios = (html: string) => html.match(/type="radio"/g);
  const cards = (html: string) => html.match(/<label data-state="[^"]*" class="[^"]*"/g) ?? [];

  it("gives a scenario question 3 options and no letters", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(
      <QuestionScreen item={step} choice={null} onChoose={noop} {...extras} />,
    );
    expect(radios(html)).toHaveLength(3);
    expect(html).not.toMatch(/>[ABCD]<\/span>/);
  });

  it("gives a quiz question 3 or 4 options and a true-false question 2", () => {
    const four = questions.find((question) => question.options.length === 4)!;
    expect(
      radios(withSources(<QuestionScreen item={four} choice={null} onChoose={noop} {...extras} />)),
    ).toHaveLength(4);
    const tf = questions.find((question) => question.type === "true-false")!;
    const html = withSources(
      <QuestionScreen item={tf} choice={null} onChoose={noop} {...extras} />,
    );
    expect(radios(html)).toHaveLength(2);
    expect(html).toContain(">True<");
    expect(html).toContain(">False<");
    expect(html).not.toMatch(/>[ABCD]<\/span>/);
  });

  it("is a radio group of white cards with a 2px border, the card radius and the gutter padding", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(
      <QuestionScreen item={step} choice={null} onChoose={noop} {...extras} />,
    );
    expect(html).toContain('role="radiogroup"');
    for (const card of cards(html)) {
      expect(card).toContain("border-2");
      expect(card).toContain("rounded-card");
      expect(card).toContain("p-[var(--gutter,1rem)]");
      expect(card).toContain("min-h-11");
      expect(card).toContain("bg-card");
    }
  });

  it("selected, before Check: only the chosen card gets the olive border and a filled radio, and the size does not change", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(
      <QuestionScreen item={step} choice={step.options[1].id} onChoose={noop} {...extras} />,
    );
    const all = cards(html);
    expect(all).toHaveLength(3);
    expect(all.filter((card) => card.includes('data-state="selected"'))).toHaveLength(1);
    expect(all[1]).toContain("border-primary bg-card");
    expect(all[0]).toContain("border-selectable-stroke bg-card");
    // the same classes apart from the colour: the width of the border is 2px in every state
    const shape = (card: string) =>
      card.replace(/data-state="[^"]*"/, "").replace(/border-(primary|selectable-stroke)/, "");
    expect(new Set(all.map(shape)).size).toBe(1);
    expect(html.match(/h-2 w-2 rounded-full bg-primary-text/g)).toHaveLength(1);
    // nothing is revealed before Check
    expect(html).not.toMatch(/correct-bg|wrong-bg|Correct|Not quite|>Why</);
  });

  it("checked and right: the green card with a check, Correct and the Why card", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(
      <QuestionScreen
        item={step}
        choice={step.correctOptionId}
        checked
        onChoose={noop}
        {...extras}
      />,
    );
    expect(html.match(/data-state="correct"/g)).toHaveLength(1);
    expect(html).toContain("border-correct bg-correct-bg");
    expect(html).toContain(">Correct<");
    expect(html).toContain("lucide-check");
    expect(html).not.toMatch(/lucide-x|Not quite|wrong-bg/);
    expect(html).toContain(">Why<");
    expect(html).toContain(step.why);
    expect(html).toContain('role="status"');
    expect(html).toContain(">Correct</p>");
    // locked: the radios are disabled
    expect(html.match(/disabled=""/g)).toHaveLength(3);
  });

  it("checked and wrong: the red card with a cross and Not quite, the right one revealed, and Why", () => {
    const step = scenarios[0].steps[0];
    const wrong = step.options.find((option) => option.id !== step.correctOptionId)!;
    const right = step.options.find((option) => option.id === step.correctOptionId)!;
    const html = withSources(
      <QuestionScreen item={step} choice={wrong.id} checked onChoose={noop} {...extras} />,
    );
    expect(html.match(/data-state="wrong"/g)).toHaveLength(1);
    expect(html.match(/data-state="revealed-correct"/g)).toHaveLength(1);
    expect(html.match(/data-state="idle"/g)).toHaveLength(1);
    expect(html).toContain("border-wrong bg-wrong-bg");
    expect(html).toContain(">Not quite<");
    expect(html).toContain(">Correct answer<");
    expect(html).toContain("lucide-x");
    expect(html).toContain(step.why);
    expect(html).toContain(`Not quite. The correct answer is: ${right.text}`);
  });

  it("in the exam: only the selected style, never colours, labels or Why, checked or not", () => {
    const step = scenarios[0].steps[0];
    for (const checked of [false, true]) {
      const html = withSources(
        <QuestionScreen
          item={step}
          choice={step.options[0].id}
          checked={checked}
          mode="exam"
          onChoose={noop}
          {...extras}
        />,
      );
      expect(html.match(/data-state="selected"/g)).toHaveLength(1);
      expect(html).not.toMatch(
        /correct-bg|wrong-bg|border-correct|border-wrong|Correct|Not quite|>Why<|lucide-x|disabled=""/,
      );
    }
  });

  it("shows no red or green and no verdict while nothing is checked", () => {
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

  it("shows the section name under the position for a part session", () => {
    const html = renderToStaticMarkup(
      <SessionTopBar
        index={1}
        total={5}
        unit="Question"
        subtitle="Checking the route"
        states={stripStates(Array(5).fill(false), 1)}
        onJump={noop}
        onBack={noop}
        onLeave={noop}
      />,
    );
    expect(html.indexOf("Question 2 of 5")).toBeLessThan(html.indexOf("Checking the route"));
    expect(render(1)).not.toContain("type-caption max-w-full");
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

  it("is absent from the top row, with its subtitle", () => {
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
  });
});
