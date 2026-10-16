import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TopicPager } from "@/components/TopicPager/TopicPager";

const prev = { id: "S1", title: "Responding to an alarm" };
const next = { id: "S3", title: "Moving through smoke" };

describe("the Previous / Next pager", () => {
  it("shows both neighbours with their titles and links", () => {
    const html = renderToStaticMarkup(<TopicPager previous={prev} next={next} />);
    expect(html).toContain('href="/materials/read/S1"');
    expect(html).toContain('href="/materials/read/S3"');
    expect(html).toContain("Previous");
    expect(html).toContain("Next");
    expect(html).toContain("Responding to an alarm");
    expect(html).toContain("Moving through smoke");
  });

  it("has two equal columns, the Next one right-aligned, and no card or border", () => {
    const html = renderToStaticMarkup(<TopicPager previous={prev} next={next} />);
    expect(html).toContain("grid-cols-2");
    expect(html).toContain("items-end text-right");
    expect(html).toContain("items-start text-left");
    expect(html).toContain("min-h-11");
    expect(html).not.toMatch(/\bborder\b|rounded|shadow|bg-/);
  });

  it("drops Previous on the first topic and keeps Next on the right", () => {
    const html = renderToStaticMarkup(<TopicPager previous={null} next={next} />);
    expect(html).not.toContain("Previous");
    expect(html.indexOf("<span aria-hidden")).toBeLessThan(
      html.indexOf('href="/materials/read/S3"'),
    );
  });

  it("drops Next on the last topic and keeps Previous on the left", () => {
    const html = renderToStaticMarkup(<TopicPager previous={prev} next={null} />);
    expect(html).not.toContain("Next");
    expect(html.indexOf('href="/materials/read/S1"')).toBeLessThan(
      html.indexOf("<span aria-hidden"),
    );
  });

  it("renders nothing without neighbours", () => {
    expect(renderToStaticMarkup(<TopicPager previous={null} next={null} />)).toBe("");
  });
});
