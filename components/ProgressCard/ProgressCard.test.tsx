import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProgressCard } from "@/components/ProgressCard/ProgressCard";

describe("Results progress card", () => {
  it("has the ring, N/M correct and the sentence, and no Correct or Incorrect rows", () => {
    const html = renderToStaticMarkup(
      <ProgressCard correct={2} total={3} sentence="1 answer needs another look in the guide." />,
    );
    expect(html).toContain('aria-label="2 of 3 correct"');
    expect(html).toContain("2/3 correct");
    expect(html).toContain("1 answer needs another look in the guide.");
    expect(html).not.toMatch(/>Correct<|>Incorrect<|show=/);
    expect(html).not.toContain("<a ");
  });

  it("shows a check in the ring when every answer is correct", () => {
    const html = renderToStaticMarkup(
      <ProgressCard correct={3} total={3} sentence="Every answer was right and confident." />,
    );
    expect(html).toContain("lucide-check");
  });
});
