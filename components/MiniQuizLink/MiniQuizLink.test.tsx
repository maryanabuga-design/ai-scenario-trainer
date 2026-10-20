import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MiniQuizLink } from "@/components/MiniQuizLink/MiniQuizLink";

describe("the shared Mini-quiz row and card", () => {
  const html = renderToStaticMarkup(
    <MiniQuizLink href="/mini-quiz?from=training" subtitle="Choose topics" minHeight="min-h-16" />,
  );

  it("shows the clipboard picture in the 64 by 60 frame, next to the text", () => {
    expect(html).toContain('src="/heroes/icon-miniquiz.webp"');
    expect(html).toContain('width="64"');
    expect(html).toContain('height="60"');
    expect(html).toContain("min-h-16");
    expect(html).toContain('href="/mini-quiz?from=training"');
    expect(html.indexOf("<img")).toBeLessThan(html.indexOf(">Mini-quiz<"));
  });

  it("is the card of the Training Quiz tab (Home has its own Today's practice card with the same picture frame)", () => {
    const training = readFileSync("components/TrainingView/TrainingView.tsx", "utf8");
    expect(training).toContain("<MiniQuizLink");
    expect(training).not.toContain('<span className="type-body-strong">Mini-quiz</span>');
    const home = readFileSync("components/TodaysPractice/TodaysPractice.tsx", "utf8");
    expect(home).toContain('variant="row"');
    expect(home).toContain("homeArtwork.iconMiniQuiz");
  });
});
