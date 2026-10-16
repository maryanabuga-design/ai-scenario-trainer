import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MaterialsTopics } from "@/components/MaterialsTopics/MaterialsTopics";
import { allTopics } from "@/lib/materials-topics";
import { readingPath } from "@/lib/reading";

const html = renderToStaticMarkup(<MaterialsTopics />);
const card = (id: string) => {
  const start = html.lastIndexOf("<a ", html.indexOf(`href="${readingPath(id)}"`));
  return html.slice(start, html.indexOf("</a>", start));
};

describe("the Materials list", () => {
  it("has the title and the subtitle", () => {
    expect(html).toContain(">Materials</h1>");
    expect(html).toContain("Read the training guides, then practise what you read.");
  });

  it("groups the topics by guide, each group with a muted caption label of the guide title", () => {
    const groups = html.match(
      /<h2 id="guide-[a-z]+" class="type-caption text-text-secondary">[^<]+/g,
    );
    expect(groups).toHaveLength(2);
    expect(html).toContain("Building Evacuation and Basic First Aid: Training Guide");
    expect(html).toContain("Flood Preparedness for Community Volunteers: Training Guide");
    expect(html.indexOf("Building Evacuation")).toBeLessThan(html.indexOf("Flood Preparedness"));
  });

  it("lists all 17 topics: S1 to S10 and F1 to F7, none hidden or locked", () => {
    expect(html.match(/href="\/materials\/read\//g)).toHaveLength(17);
    for (let n = 1; n <= 10; n++) expect(html).toContain(`href="/materials/read/S${n}"`);
    for (let n = 1; n <= 7; n++) expect(html).toContain(`href="/materials/read/F${n}"`);
    expect(html).not.toMatch(/lock|disabled/i);
  });

  it("has a card with the olive icon circle, the title, 'S1 · N min read' and a plain chevron", () => {
    const s1 = card("S1");
    const topic = allTopics()[0];
    expect(s1).toContain("bg-olive-tint");
    expect(s1).toContain(">Responding to an alarm<");
    expect(s1).toContain(`S1 · ${topic.minutes} min read`);
    expect(s1).toContain("lucide-chevron-right");
    expect(s1).not.toContain("border-arrow-stroke");
    expect(s1).not.toMatch(/arrow-shadow|ArrowCircle/);
  });

  it("uses the same olive circle for every topic and a document icon when a topic has none", () => {
    const circles = html.match(/rounded-full text-text bg-(olive-tint|pastel-[a-z]+)/g) ?? [];
    expect(circles).toHaveLength(17);
    expect(new Set(circles)).toEqual(new Set(["rounded-full text-text bg-olive-tint"]));
    expect(html).not.toMatch(/bg-pastel-/);
  });

  it("is a list card: white fill, a 1px border, the card radius, the gutter on all sides, at least 44px", () => {
    const s1 = card("S1");
    expect(s1).toContain("rounded-card border border-selectable-stroke bg-card");
    expect(s1).toContain("p-[var(--gutter,1rem)]");
    expect(s1).toContain("min-h-11");
  });

  it("gives reading times of at least 1 minute", () => {
    for (const topic of allTopics()) expect(topic.minutes).toBeGreaterThanOrEqual(1);
    expect(html.match(/\d+ min read/g)).toHaveLength(17);
  });
});
