import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { FeedbackSheet, HintSheet } from "@/components/QuestionSheets/QuestionSheets";
import { SourceSheetProvider } from "@/components/SourceSheet/SourceSheet";
import { loadAllSections } from "@/lib/guide";
import { getItem } from "@/lib/items";

const noop = () => undefined;
const item = getItem("q-quiz-s01-001");
const wrong = item.options.find((option) => option.id !== item.correctOptionId)!;
const right = item.options.find((option) => option.id === item.correctOptionId)!;

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <SourceSheetProvider sections={loadAllSections()}>
      <ActionBarProvider>{node}</ActionBarProvider>
    </SourceSheetProvider>,
  );

describe("the feedback sheet", () => {
  it("correct: light green, the title Correct in dark green, the explanation, only a Primary Next", () => {
    const html = render(<FeedbackSheet item={item} choice={right.id} last={false} onNext={noop} />);
    expect(html).toContain('data-bottom-sheet="feedback"');
    expect(html).toContain("bg-feedback-correct-bg");
    expect(html).toMatch(/text-status-success-ink[^>]*>Correct</);
    expect(html).toContain(item.why);
    expect(html).not.toContain("Correct answer:");
    expect(html).not.toContain("Review the guide");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain(">Next<");
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    // docked, no scrim, no dialog
    expect(html).not.toMatch(/data-sheet-scrim|role="dialog"|aria-modal/);
  });

  it("not right: light red, Not quite, the correct answer in semi-bold, the explanation, Review the guide above Next", () => {
    const html = render(<FeedbackSheet item={item} choice={wrong.id} last={false} onNext={noop} />);
    expect(html).toContain("bg-feedback-wrong-bg");
    expect(html).toMatch(/text-wrong-text[^>]*>Not quite</);
    expect(html).toMatch(new RegExp(`type-body-strong[^>]*>Correct answer: ${right.text}`));
    expect(html).toContain(item.why);
    expect(html.indexOf("Review the guide")).toBeLessThan(html.indexOf(">Next<"));
    expect(html).toContain(`Not quite. The correct answer is: ${right.text}`);
  });

  it("says See results on the last question, and can be blocked while another question is open", () => {
    const html = render(
      <FeedbackSheet
        item={item}
        choice={right.id}
        last
        disabled
        note="Answer question 2 to finish."
        onNext={noop}
      />,
    );
    expect(html).toContain(">See results<");
    expect(html).toContain("Answer question 2 to finish.");
    expect(html).toMatch(/<button[^>]*disabled/);
  });

  it("has a 72px picture slot with an empty alt text, and a round check or cross tile when the file is missing", () => {
    const html = render(<FeedbackSheet item={item} choice={wrong.id} last={false} onNext={noop} />);
    expect(html).toContain('src="/images/student/feedback-wrong.webp"');
    expect(html).toContain('alt=""');
    expect(html).toContain("h-[72px] w-[72px]");
    const sheet = readFileSync("components/BottomSheet/SheetPicture.tsx", "utf8");
    expect(sheet).toContain('data-sheet-picture="placeholder"');
    expect(sheet).toContain("rounded-full");
    expect(sheet).toMatch(/correct: \{ look: "bg-correct text-primary-text", icon: Check \}/);
    expect(sheet).toMatch(/wrong: \{ look: "bg-wrong text-primary-text", icon: X \}/);
    expect(sheet).toMatch(/hint: \{ look: "bg-secondary-sand text-text", icon: Lightbulb \}/);
  });

  it("has 20px top corners, a 1px top border and the safe area at the bottom; slides in 200ms", () => {
    const html = render(<FeedbackSheet item={item} choice={right.id} last={false} onNext={noop} />);
    expect(html).toContain("rounded-t-[20px] border-t");
    expect(html).toContain("pb-[max(16px,env(safe-area-inset-bottom))]");
    expect(html).toContain("bottom-sheet");
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toMatch(/\.bottom-sheet \{\s*animation: sheet-in 200ms ease-out;/);
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});

describe("the hint sheet", () => {
  it("is a modal dialog with a scrim, a handle, the picture slot, the title, the text, Open guide and Got it", () => {
    const html = render(
      <HintSheet
        hint={{ text: "Review: Moving through smoke", section: "S3" }}
        onClose={noop}
        returnFocus={null}
      />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toMatch(/aria-labelledby="([^"]+)"[\s\S]*id="\1"[^>]*>Hint</);
    expect(html).toContain("data-sheet-scrim");
    expect(html).toContain("data-sheet-handle");
    expect(html).toContain('src="/images/student/hint.webp"');
    expect(html).toContain("Review: Moving through smoke");
    expect(html).toContain("Open guide · S3");
    expect(html.indexOf("Open guide · S3")).toBeLessThan(html.indexOf(">Got it<"));
  });

  it("has no guide button when the hint points to no section", () => {
    const html = render(
      <HintSheet
        hint={{ text: "Think about it", section: null }}
        onClose={noop}
        returnFocus={null}
      />,
    );
    expect(html).not.toContain("Open guide");
    expect(html).toContain(">Got it<");
  });
});
