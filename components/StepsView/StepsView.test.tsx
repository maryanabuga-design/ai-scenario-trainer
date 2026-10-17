import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StepCard } from "@/components/StepsView/StepCard";
import { StepsList } from "@/components/StepsView/StepsList";
import { StepsTopicView } from "@/components/StepsView/StepsTopic";
import { checklists } from "@/lib/checklists";

const noop = () => {};
const topic = (open: string | null, checklist = checklists[1]) =>
  renderToStaticMarkup(
    <StepsTopicView checklist={checklist} open={open} onBack={noop} onToggleOpen={noop} />,
  );

describe("the Steps list", () => {
  const html = renderToStaticMarkup(<StepsList />);

  it("has the 40px Back to Home, the title and the subtitle", () => {
    expect(html).toContain('aria-label="Back to Home"');
    expect(html).toContain("h-10 w-10");
    expect(html).toContain(">Steps</h1>");
    expect(html).toContain("Short step-by-step guides for each topic.");
  });

  it("has a card per topic with only its number of steps, and a chevron, opening the topic screen", () => {
    expect(html.match(/<li/g)).toHaveLength(checklists.length);
    checklists.forEach((checklist) => {
      expect(html).toContain(checklist.title);
      expect(html).toContain(`>${checklist.steps.length} steps<`);
      expect(html).toContain(`href="/checklists/${checklist.id}"`);
    });
    expect(html).not.toMatch(/done|·/);
    expect(html.match(/lucide-chevron-right/g)).toHaveLength(checklists.length);
  });

  it("is the list-card look: fill, 1px stroke, radius, gutter padding, olive circle icon, no shadow", () => {
    expect(html).toContain("bg-list-card");
    expect(html).toContain("border border-selectable-stroke");
    expect(html).toContain("rounded-card");
    expect(html).toContain("p-[var(--gutter,1rem)]");
    expect(html).toContain("bg-olive-tint");
    expect(html).toContain("min-h-11");
    // no shadow on the cards (the Back circle has the one soft shadow)
    expect(html.slice(html.indexOf("<ul"))).not.toContain("shadow");
    expect(html).not.toContain("ArrowCircle");
  });
});

describe("a Steps topic screen", () => {
  const checklist = checklists[1];
  const first = checklist.steps[0];
  const second = checklist.steps[1];

  it("has the olive full-bleed frame with Back and the title as a large heading", () => {
    const html = topic(first.id);
    const frame = html.slice(html.indexOf("data-steps-frame"), html.indexOf("<section"));
    expect(frame).toContain("bg-olive-tint");
    expect(frame).toContain("data-full-bleed");
    expect(frame).toContain("-mx-[var(--gutter,1rem)]");
    expect(frame).toContain("env(safe-area-inset-top)");
    expect(frame).toContain('aria-label="Back"');
    expect(frame).toContain("h-10 w-10");
    expect(frame).toContain(`<h1 class="type-page-title">${checklist.title}</h1>`);
    // a straight bottom edge
    expect(frame).not.toMatch(/rounded-b|rounded-\[/);
  });

  it("has the summary card over the frame's edge: Step-by-step guide, the step count, a rounded-square tile", () => {
    const html = topic(first.id);
    const card = html.slice(html.indexOf('aria-label="Summary"'), html.indexOf("<ol"));
    expect(card).toContain("-mt-10");
    expect(card).toContain("border border-selectable-stroke");
    expect(card).toContain("bg-card");
    expect(card).toContain("p-[var(--gutter,1rem)]");
    expect(card).toContain(">Step-by-step guide<");
    expect(card).toContain(`>${checklist.steps.length} steps<`);
    // the 48px tile has the 12px radius, not a circle
    expect(card).toContain("h-12 w-12 rounded-[12px]");
    expect(card).not.toContain("rounded-full");
    expect(card).toContain("bg-olive-tint");
    // informational only: no progress, no done, no arrow circle
    expect(html).not.toMatch(/progressbar|done|checkbox|aria-pressed/i);
    expect(html).not.toContain("ArrowCircle");
  });

  it("has one card per step with the caption, the title and a closed or open chevron", () => {
    const html = topic(first.id);
    checklist.steps.forEach((step, index) => {
      expect(html).toContain(`Step ${index + 1}`);
      expect(html).toContain(step.title);
    });
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(checklist.steps.length - 1);
    expect(html).toContain("rotate-180");
    expect(topic(null).match(/aria-expanded="true"/g)).toBeNull();
  });

  it("opens only one step: the others' details are inert and hidden", () => {
    const html = topic(second.id);
    expect(html.match(/inert=""/g)).toHaveLength(checklist.steps.length - 1);
    expect(html.match(/aria-hidden="false"/g)).toHaveLength(1);
    // a closed panel is invisible once its height has collapsed (visibility is part of the transition)
    expect(html).toContain("transition-[grid-template-rows,visibility]");
    expect(html.match(/invisible grid-rows-\[0fr\]/g)).toHaveLength(checklist.steps.length - 1);
    expect(html).toContain("grid-rows-[1fr]");
  });

  it("has the header as the one button of a step, wired to its panel, with equal padding", () => {
    const html = renderToStaticMarkup(<StepCard step={first} index={0} open onToggleOpen={noop} />);
    expect(html).toContain(`id="${first.id}-header"`);
    expect(html).toContain(`aria-controls="${first.id}-panel"`);
    expect(html).toContain(`aria-labelledby="${first.id}-header"`);
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain("p-[var(--gutter,1rem)]");
    expect(html).not.toMatch(/aria-pressed|checkbox|lucide-check\b/);
  });

  it("animates the height in 200ms, and not for reduced motion", () => {
    const html = topic(first.id);
    expect(html).toContain("duration-200");
    expect(html).toContain("motion-reduce:transition-none");
  });

  it("has no buttons or links below the steps, and no Source row without a link", () => {
    const html = topic(first.id);
    const below = html.slice(html.indexOf("</ol>"));
    expect(below).not.toMatch(/<(a|button)\b/);
    expect(html).not.toMatch(/Practise|Read the material|Steps for this topic/);
    expect(html).not.toContain(">Source<");
  });

  it("shows the Source row only when the content has a link", () => {
    const html = renderToStaticMarkup(
      <StepsTopicView
        checklist={{
          ...checklist,
          source: { label: "Official guidance", url: "https://example.org/guide" },
        }}
        open={null}
        onBack={noop}
        onToggleOpen={noop}
      />,
    );
    expect(html).toContain(">Source<");
    expect(html).toContain('href="https://example.org/guide"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("goes back through the history, and keeps no progress code", () => {
    const code = readFileSync("components/StepsView/StepsTopic.tsx", "utf8");
    expect(code).toContain("router.back()");
    expect(code).toContain('router.push("/checklists")');
    expect(code).not.toMatch(/ArrowCircle|steps-progress|usePractise|toggleStep/);
  });
});
