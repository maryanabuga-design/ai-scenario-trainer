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

  it("is the one component of the Training card, and Home has a tile instead (no wide row)", () => {
    const training = readFileSync("components/TrainingView/TrainingView.tsx", "utf8");
    expect(training).toContain("<MiniQuizLink");
    expect(training).not.toContain('<span className="type-body-strong">Mini-quiz</span>');
    expect(readFileSync("components/HomeView/HomeView.tsx", "utf8")).not.toContain("MiniQuizLink");
  });
});
