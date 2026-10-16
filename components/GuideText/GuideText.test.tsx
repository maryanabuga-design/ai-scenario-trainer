import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GuideText } from "@/components/GuideText/GuideText";
import { loadGuides } from "@/lib/guide";

const render = (markdown: string) => renderToStaticMarkup(<GuideText markdown={markdown} />);

describe("the guide text for reading", () => {
  it("draws ### as headings and bullets as a list", () => {
    const html = render("- One\n- Two\n\n### Sub\n\n- Three");
    expect(html).toContain('<h2 class="type-card-title mt-3 first:mt-0">Sub</h2>');
    expect(html.match(/<ul /g)).toHaveLength(2);
    expect(html.match(/<li /g)).toHaveLength(3);
    expect(html.match(/data-block="\d"/g)).toEqual([
      'data-block="0"',
      'data-block="1"',
      'data-block="2"',
    ]);
    expect(html).not.toContain("###");
  });

  it("reads at the body style: 16px with a line height of about 1.6", () => {
    expect(render("A paragraph.")).toContain('class="type-body"');
    expect(render("- a")).toContain("type-body");
    const css = readFileSync("app/globals.css", "utf8");
    expect(css).toMatch(/@utility type-body \{\s*font-size: 16px;\s*line-height: 1\.6;/);
  });

  it("supports bold and numbered lists", () => {
    const html = render("1. **Listen** now\n2. Go");
    expect(html).toContain("<ol ");
    expect(html).toContain("<strong>Listen</strong>");
  });

  it("never outputs raw HTML: markup in the text is escaped", () => {
    const html = render("<script>alert(1)</script>\n\n- <img src=x onerror=y>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders a topic without subsections as a list, and S1 with its seven subsection headings", () => {
    const s2 = loadGuides()[0].sections[1];
    const plain = render(s2.body);
    expect(plain).not.toContain("<h2");
    expect(plain).toContain("<ul");
    const s1 = render(loadGuides()[0].sections[0].body);
    expect(s1.match(/<h2 /g)).toHaveLength(7);
    expect(s1).toContain(">Why every alarm is treated as real<");
    // no gap-making empty blocks
    expect(s1).not.toContain("<p></p>");
    expect(s1).not.toContain("<li></li>");
  });

  it("does not repeat the topic heading in the body", () => {
    const section = loadGuides()[0].sections[0];
    expect(render(section.body)).not.toContain(">Responding to an alarm<");
  });
});

describe("highlights in the guide text", () => {
  const highlight = {
    id: "h1",
    block: 1,
    start: 2,
    end: 9,
    quote: "",
    before: "",
    after: "",
  };

  it("draws a highlight as a mark inside its block, without changing the text", () => {
    const markdown = "First block.\n\nA **warning** means flooding";
    const plain = render(markdown);
    const marked = renderToStaticMarkup(<GuideText markdown={markdown} highlights={[highlight]} />);
    expect(marked.match(/<mark /g)).toHaveLength(1);
    expect(marked).toContain('data-highlight="h1"');
    expect(marked).toContain("rounded-[3px] bg-highlight text-text");
    expect(marked).toContain("[box-decoration-break:clone]");
    // the words are the same with and without marks
    const words = (html: string) => html.replace(/<[^>]*>/g, "");
    expect(words(marked)).toBe(words(plain));
    // the marked text is inside the second block only
    const second = marked.slice(marked.indexOf('data-block="1"'));
    expect(second).toContain("<mark");
    expect(marked.slice(0, marked.indexOf('data-block="1"'))).not.toContain("<mark");
  });

  it("marks text inside bold without losing the bold", () => {
    const html = renderToStaticMarkup(
      <GuideText
        markdown={"A **warning** means flooding"}
        highlights={[{ ...highlight, block: 0 }]}
      />,
    );
    expect(html).toContain("<strong>");
    expect(html).toMatch(/<mark[^>]*><strong>/);
  });

  it("ignores a highlight on a block that does not exist", () => {
    const html = renderToStaticMarkup(
      <GuideText markdown="Only one." highlights={[{ ...highlight, block: 7 }]} />,
    );
    expect(html).not.toContain("<mark");
  });
});
