import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorTypesCard } from "@/components/ErrorTypesCard/ErrorTypesCard";

describe("Error types card", () => {
  it("has Details as an underlined link with a plain arrow beside it, no circle", () => {
    const html = renderToStaticMarkup(
      <ErrorTypesCard
        counts={{ secure: 1, guess: 0, knowledge_gap: 1, misconception: 0 }}
        detailsHref="/session/results/analysis"
      />,
    );
    const start = html.indexOf('href="/session/results/analysis"');
    const link = html.slice(start, html.indexOf("</a>", start));
    expect(link).toContain(">Details</span>");
    expect(link).toContain("lucide-arrow-right");
    expect(link).not.toMatch(/border-arrow-stroke|bg-surface|rounded-full border/);
  });
});
