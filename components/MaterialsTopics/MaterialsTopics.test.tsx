import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MaterialsTopics } from "@/components/MaterialsTopics/MaterialsTopics";
import { allTopics } from "@/lib/materials-topics";
import { readingPath } from "@/lib/reading";

const html = renderToStaticMarkup(<MaterialsTopics />);
/** The list under the header band. */
const list = html.slice(html.indexOf("<section"));
/** The row's link, found by the topic it opens. */
const card = (id: string) => {
  const start = html.lastIndexOf("<a ", html.indexOf(`href="${readingPath(id)}"`));
  return html.slice(start, html.indexOf("</a>", start));
};

describe("the Materials list", () => {
  it("has the title and the subtitle in the page header band (tab root variant, no Back)", () => {
    expect(html).toContain("data-page-header-band");
    expect(html).toContain(">Materials</h1>");
    expect(html).toContain('<p class="type-body text-text">Read the training guides, then');
    expect(html).not.toContain("Back to");
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it("groups the topics by guide, each group with a clear heading and an olive count chip", () => {
    const groups = html.match(/<h2 id="guide-[a-z]+" class="type-item-title[^"]*">[^<]+/g);
    expect(groups).toHaveLength(2);
    expect(html).toContain("Building Evacuation and Basic First Aid: Training Guide");
    expect(html).toContain("Flood Preparedness for Community Volunteers: Training Guide");
    expect(html.indexOf("Building Evacuation")).toBeLessThan(html.indexOf("Flood Preparedness"));
    // not the muted caption any more
    expect(html).not.toContain("type-caption text-text-secondary");
    for (const [count, label] of [
      [10, "10 topics"],
      [7, "7 topics"],
    ] as const) {
      const chip = html.slice(html.indexOf(`>${label}<`) - 200, html.indexOf(`>${label}<`));
      expect(chip, `${count} topics`).toContain("bg-olive-tint");
      expect(chip).toContain("text-text");
      expect(chip).not.toMatch(/border/);
    }
  });

  it("spaces the groups: 32px above every heading but the first, 12px to the first row", () => {
    expect(html).toContain("flex flex-col gap-8");
    const section = html.slice(html.indexOf("<section"), html.indexOf("</section>"));
    expect(section).toContain("gap-3");
  });

  it("lists all 17 topics: S1 to S10 and F1 to F7, none hidden or locked", () => {
    expect(html.match(/href="\/materials\/read\//g)).toHaveLength(17);
    for (let n = 1; n <= 10; n++) expect(html).toContain(`href="/materials/read/S${n}"`);
    for (let n = 1; n <= 7; n++) expect(html).toContain(`href="/materials/read/F${n}"`);
    expect(html).not.toMatch(/lock|disabled/i);
  });

  it("has a flat row: a 44px rounded-square icon tile, the title, 'S1 · N min read' and a plain chevron", () => {
    const s1 = card("S1");
    const topic = allTopics()[0];
    expect(s1).toContain("h-11 w-11");
    expect(s1).toContain("rounded-[12px]");
    expect(s1).not.toContain("rounded-full");
    expect(s1).toContain("bg-neutral-tile-bg text-neutral-tile-ink");
    expect(s1).not.toContain("bg-olive-tint");
    expect(s1).toContain(">Responding to an alarm<");
    expect(s1).toContain(`S1 · ${topic.minutes} min read`);
    expect(s1).toContain("lucide-chevron-right");
    expect(s1).not.toMatch(/arrow-shadow|ArrowCircle/);
    // title first, then the muted line; the tile before both; the chevron last
    expect(s1.indexOf("h-11 w-11")).toBeLessThan(s1.indexOf(">Responding to an alarm<"));
    expect(s1.indexOf(">Responding to an alarm<")).toBeLessThan(s1.indexOf("min read"));
    expect(s1.indexOf("min read")).toBeLessThan(s1.indexOf("lucide-chevron-right"));
  });

  it("has no card around a row: no fill, border, radius or shadow", () => {
    // (the header band above the list has its own hairline border and fill)
    expect(list).not.toMatch(
      /rounded-card|bg-card|shadow-\(--card-shadow\)|border-selectable-stroke bg/,
    );
    const s1 = card("S1");
    expect(s1).not.toMatch(/\bborder\b|bg-card|rounded-card|shadow/);
    // the pressed state is a tone change of the row background
    expect(s1).toContain("active:bg-secondary-sand");
    expect(s1).toContain("min-h-11");
    expect(s1).toContain("py-4");
    expect(s1).toContain("gap-3");
  });

  it("puts a 1px divider between the rows of a group, and none after the last row", () => {
    const items = html.match(/<li class="[^"]*">/g) ?? [];
    expect(items).toHaveLength(17);
    const dividers = items.filter((item) => item.includes("border-b border-selectable-stroke"));
    // 17 rows in two groups: every row but the last of each group (10 + 7) has one
    expect(dividers).toHaveLength(15);
    const lastS10 = html.slice(html.lastIndexOf("<li", html.indexOf('href="/materials/read/S10"')));
    expect(lastS10.startsWith('<li class="border-b')).toBe(false);
    const lastF7 = html.slice(html.lastIndexOf("<li", html.indexOf('href="/materials/read/F7"')));
    expect(lastF7.startsWith('<li class="border-b')).toBe(false);
    const firstS1 = html.slice(html.lastIndexOf("<li", html.indexOf('href="/materials/read/S1"')));
    expect(firstS1.startsWith('<li class="border-b border-selectable-stroke')).toBe(true);
    expect(list).not.toMatch(/mt-|mb-|-mx-/);
  });

  it("gives reading times of at least 1 minute", () => {
    for (const topic of allTopics()) expect(topic.minutes).toBeGreaterThanOrEqual(1);
    expect(html.match(/\d+ min read/g)).toHaveLength(17);
  });
});
