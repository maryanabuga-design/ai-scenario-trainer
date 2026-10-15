import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { ContentImage } from "@/components/ContentImage/ContentImage";
import { DecisionStep } from "@/components/DecisionStep/DecisionStep";
import { HeroSlot } from "@/components/HeroSlot/HeroSlot";
import { QuizQuestion } from "@/components/QuizQuestion/QuizQuestion";
import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import { SessionSetup, defaultSetup } from "@/components/SessionSetup/SessionSetup";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { stripStates } from "@/components/StepStrip/StepStrip";
import { loadAllSections } from "@/lib/guide";
import { emptyQuizDraft, emptyStepDraft } from "@/lib/session-draft";
import { questions } from "@/lib/quiz";
import type { Question } from "@/lib/quiz";
import { scenarios } from "@/lib/scenario";

const noop = () => undefined;

function withSources(node: React.ReactNode) {
  return renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>{node}</ActionBarProvider>
    </SourceSheetProvider>,
  );
}

/** The words a person reads: tags removed. */
function visibleText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

describe("option rows with letter badges", () => {
  it("draws a 24px olive-tint circle with the letter, dark text, before the option", () => {
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

  it("gives every scenario option a letter A, B, C and so on", () => {
    const step = scenarios[0].steps[0];
    const html = withSources(
      <DecisionStep step={step} draft={emptyStepDraft} onDraftChange={noop} />,
    );
    "ABCDEFGH"
      .slice(0, step.options.length)
      .split("")
      .forEach((letter) => expect(html).toContain(`>${letter}</span>`));
    expect(html).toContain("Choose one answer");
  });

  it("gives single and multiple choice quiz options letters, true or false none", () => {
    const single = questions.find((question) => question.type === "single");
    const multiple = questions.find((question) => question.type === "multiple");
    const truefalse = questions.find((question) => question.type === "truefalse");
    if (!single || !multiple || !truefalse) throw new Error("The bank needs these types");
    const render = (question: Question) =>
      withSources(
        <QuizQuestion question={question} draft={emptyQuizDraft(question)} onDraftChange={noop} />,
      );
    expect(render(single)).toContain(">A</span>");
    expect(render(multiple)).toContain(">A</span>");
    expect(render(truefalse)).not.toContain("bg-olive-tint");
  });
});

describe("the session top and bottom bars", () => {
  it("shows Exit, the position and the step strip", () => {
    const html = renderToStaticMarkup(
      <SessionTopBar
        index={2}
        total={10}
        unit="Question"
        states={stripStates(Array(10).fill(false), 2)}
        onJump={noop}
        onLeave={noop}
      />,
    );
    expect(visibleText(html)).toContain("Exit");
    expect(visibleText(html)).toContain("Question 3 of 10");
    expect(html.match(/aria-label="Question \d+,/g)).toHaveLength(10);
  });
});

describe("no AI or bot wording in a session", () => {
  const banned = /\bAI\b|\bbot\b/i;

  it("is absent from every scenario step of every scenario", () => {
    scenarios
      .flatMap((def) => def.steps)
      .forEach((step) => {
        const draft = { optionId: step.options[0].id, confidence: 2 as const, explanation: "x" };
        const html = withSources(<DecisionStep step={step} draft={draft} onDraftChange={noop} />);
        expect(visibleText(html)).not.toMatch(banned);
      });
  });

  it("is absent from every quiz question", () => {
    questions.forEach((question) => {
      const html = withSources(
        <QuizQuestion
          question={question}
          draft={{ ...emptyQuizDraft(question), dontKnow: question.type === "text" }}
          onDraftChange={noop}
        />,
      );
      expect(visibleText(html)).not.toMatch(banned);
    });
  });

  it("is absent from the bars and from Session setup, which has no footer note either", () => {
    const top = renderToStaticMarkup(
      <SessionTopBar
        index={0}
        total={3}
        unit="Step"
        states={stripStates([false, false, false], 0)}
        onJump={noop}
        onLeave={noop}
      />,
    );
    expect(visibleText(top)).not.toMatch(banned);
    for (const mode of ["scenario", "quiz"] as const) {
      const setup = withSources(
        <SessionSetup value={{ ...defaultSetup, mode }} onChange={noop} onStart={noop} />,
      );
      expect(visibleText(setup)).not.toMatch(banned);
      expect(setup).not.toContain("simulated for this prototype");
    }
  });

  it("asks for the explanation in neutral words", () => {
    const html = withSources(
      <DecisionStep
        step={scenarios[0].steps[0]}
        draft={{ optionId: "b", confidence: 2, explanation: "" }}
        onDraftChange={noop}
      />,
    );
    expect(visibleText(html)).toContain("Explain your choice in your own words (optional)");
  });
});

describe("the image slot", () => {
  const image = { src: "/scenarios/s01-alarm.webp", alt: "A corridor with an alarm panel" };

  it("renders the picture with its alt text, 4:3, 16px radius, on a sand placeholder", () => {
    const html = renderToStaticMarkup(<ContentImage image={image} />);
    expect(html).toContain('alt="A corridor with an alarm panel"');
    expect(html).toContain("aspect-[4/3]");
    expect(html).toContain("rounded-[16px]");
    expect(html).toContain("bg-secondary-sand");
    expect(html).toContain("object-cover");
  });

  it("draws nothing without an image, in a step and in a question", () => {
    expect(renderToStaticMarkup(<ContentImage />)).toBe("");
    const step = scenarios[0].steps[0];
    expect(
      withSources(<DecisionStep step={step} draft={emptyStepDraft} onDraftChange={noop} />),
    ).not.toContain("aspect-[4/3]");
    const withImage = withSources(
      <DecisionStep step={{ ...step, image }} draft={emptyStepDraft} onDraftChange={noop} />,
    );
    expect(withImage).toContain('alt="A corridor with an alarm panel"');
    expect(withImage.indexOf("aspect-[4/3]")).toBeLessThan(withImage.indexOf(step.title));
  });
});

describe("the hero slot", () => {
  it("draws the fallback without a picture: a 96px olive-tint circle with an icon", () => {
    for (const kind of ["passed", "notPassed", "setup"] as const) {
      const html = renderToStaticMarkup(<HeroSlot kind={kind} />);
      expect(html).toContain("data-hero-fallback");
      expect(html).toContain("h-24 w-24");
      expect(html).toContain("bg-olive-tint");
      expect(html).not.toContain("<img");
    }
  });

  it("draws the picture with its alt text when it has one", () => {
    const html = renderToStaticMarkup(
      <HeroSlot kind="passed" src="/heroes/hero-passed.webp" alt="Checklist" />,
    );
    expect(html).toContain('alt="Checklist"');
    expect(html).not.toContain("data-hero-fallback");
  });

  it("is on Session setup", () => {
    const html = withSources(<SessionSetup value={defaultSetup} onChange={noop} onStart={noop} />);
    expect(html).toContain("data-hero-fallback");
  });
});
