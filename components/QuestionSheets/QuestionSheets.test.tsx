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
  it("correct: the title Correct in dark green, the explanation, the Guide chip, only a Primary Next", () => {
    const html = render(<FeedbackSheet item={item} choice={right.id} last={false} onNext={noop} />);
    expect(html).toContain('data-bottom-sheet="feedback"');
    expect(html).toMatch(/text-status-success-ink[^>]*>Correct</);
    expect(html).toContain(item.why);
    expect(html).not.toContain("Correct answer:");
    // the Guide chip, then the Primary; no Secondary guide button
    expect(html).not.toMatch(/Review the guide|Open guide/);
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).toContain(`Guide · ${item.guideRef[0]}`);
    expect(html.indexOf(item.why)).toBeLessThan(html.indexOf("Guide · "));
    expect(html.indexOf("Guide · ")).toBeLessThan(html.indexOf(">Next<"));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    // docked, no scrim, no dialog
    expect(html).not.toMatch(/data-sheet-scrim|role="dialog"|aria-modal/);
  });

  it("not right: Not quite, the correct answer in semi-bold, the explanation, the Guide chip, then Next", () => {
    const html = render(<FeedbackSheet item={item} choice={wrong.id} last={false} onNext={noop} />);
    expect(html).toMatch(/text-wrong-text[^>]*>Not quite</);
    expect(html).toMatch(new RegExp(`type-body-strong[^>]*>Correct answer: ${right.text}`));
    expect(html.indexOf("Correct answer:")).toBeLessThan(html.indexOf(item.why));
    expect(html.indexOf(item.why)).toBeLessThan(html.indexOf("Guide · "));
    expect(html.indexOf("Guide · ")).toBeLessThan(html.indexOf(">Next<"));
    expect(html).toContain(`Not quite. The correct answer is: ${right.text}`);
  });

  it("has no Guide chip when the question has no linked section", () => {
    const html = render(
      <FeedbackSheet
        item={{ ...item, guideRef: [] }}
        choice={wrong.id}
        last={false}
        onNext={noop}
      />,
    );
    expect(html).not.toContain("Guide · ");
    expect(html.match(/<button/g)).toHaveLength(1);
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

  it("has one sand background for every state, 20px top corners, a 1px sand top border", () => {
    for (const choice of [right.id, wrong.id]) {
      const html = render(<FeedbackSheet item={item} choice={choice} last={false} onNext={noop} />);
      expect(html).toContain("rounded-t-[20px] border-t border-sheet-stroke bg-sheet-bg");
      expect(html).not.toMatch(/feedback-(correct|wrong)-bg|bg-correct-bg|bg-wrong-bg/);
      expect(html).toContain("pb-[max(16px,env(safe-area-inset-bottom))]");
    }
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toContain("--sheet-bg: #eae5da;");
    expect(css).toContain("--sheet-stroke: #ddd6c8;");
    expect(css).toMatch(/\.bottom-sheet \{\s*animation: sheet-in 200ms ease-out;/);
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("has an optional 72px picture with an empty alt text and no placeholder code", () => {
    const html = render(<FeedbackSheet item={item} choice={wrong.id} last={false} onNext={noop} />);
    // nothing is drawn until the file has loaded
    expect(html).toContain('src="/images/student/feedback-wrong.webp"');
    expect(html).toContain('alt=""');
    expect(html).toContain('class="hidden"');
    const picture = readFileSync("components/BottomSheet/SheetPicture.tsx", "utf8");
    expect(picture).toContain("h-[72px] w-[72px]");
    expect(picture).not.toMatch(/placeholder|lucide|rounded-full/);
  });
});

describe("the hint sheet", () => {
  it("is a modal dialog with a scrim and a handle: the title, the text, the Guide chip, one Primary Got it", () => {
    const html = render(
      <HintSheet
        hint={{ text: "Review: Moving through smoke", section: "S3" }}
        onClose={noop}
        returnFocus={null}
      />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toMatch(/aria-labelledby="([^"]+)"[\s\S]*id="\1"[^>]*text-text[^>]*>Hint</);
    expect(html).toContain("data-sheet-scrim");
    expect(html).toContain("data-sheet-handle");
    expect(html).toContain('src="/images/student/hint.webp"');
    expect(html).not.toContain("Open guide");
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html.indexOf("Review: Moving through smoke")).toBeLessThan(html.indexOf("Guide · S3"));
    expect(html.indexOf("Guide · S3")).toBeLessThan(html.indexOf(">Got it<"));
  });

  it("has no Guide chip when the hint points to no section", () => {
    const html = render(
      <HintSheet
        hint={{ text: "Think about it", section: null }}
        onClose={noop}
        returnFocus={null}
      />,
    );
    expect(html).not.toContain("Guide · ");
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain(">Got it<");
  });
});
