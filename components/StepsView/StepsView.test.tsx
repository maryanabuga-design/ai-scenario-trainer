import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StepCard } from "@/components/StepsView/StepCard";
import { StepsList } from "@/components/StepsView/StepsList";
import { StepsTopicView } from "@/components/StepsView/StepsTopic";
import { checklists } from "@/lib/checklists";

const noop = () => {};
const topic = (open: string | null, done: string[], checklist = checklists[1]) =>
  renderToStaticMarkup(
    <StepsTopicView
      checklist={checklist}
      open={open}
      done={done}
      onBack={noop}
      onToggleOpen={noop}
      onToggleDone={noop}
      onPractise={noop}
    />,
  );

describe("the Steps list", () => {
  const html = renderToStaticMarkup(<StepsList />);

  it("has the 40px Back to Home, the title and the subtitle", () => {
    expect(html).toContain('aria-label="Back to Home"');
    expect(html).toContain("h-10 w-10");
    expect(html).toContain(">Steps</h1>");
    expect(html).toContain("Short step-by-step guides for each topic.");
  });

  it("has a card per topic with its steps and done count, and a chevron, opening the topic screen", () => {
    expect(html.match(/<li/g)).toHaveLength(checklists.length);
    checklists.forEach((checklist) => {
      expect(html).toContain(checklist.title);
      expect(html).toContain(`${checklist.steps.length} steps · 0 done`);
      expect(html).toContain(`href="/checklists/${checklist.id}"`);
    });
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

  it("has the summary card with the done count, a progress bar and no arrow circle", () => {
    const html = topic(first.id, []);
    expect(html).toContain(`>${checklist.title}</h1>`);
    expect(html).toContain(`0 of ${checklist.steps.length} steps done`);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="0"');
    const withDone = topic(first.id, [first.id, second.id]);
    expect(withDone).toContain(`2 of ${checklist.steps.length} steps done`);
    expect(withDone).toContain('aria-valuenow="2"');
    expect(withDone).toContain(`width:${(2 / checklist.steps.length) * 100}%`);
    expect(html).not.toMatch(/rounded-full[^"]*border-arrow-stroke/);
  });

  it("has one card per step with the caption, the title and a closed or open chevron", () => {
    const html = topic(first.id, []);
    checklist.steps.forEach((step, index) => {
      expect(html).toContain(`Step ${index + 1}`);
      expect(html).toContain(step.title);
    });
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(checklist.steps.length - 1);
    expect(html).toContain("rotate-180");
    expect(topic(null, []).match(/aria-expanded="true"/g)).toBeNull();
  });

  it("opens only one step: the others' details are inert and hidden", () => {
    const html = topic(second.id, []);
    expect(html.match(/inert=""/g)).toHaveLength(checklist.steps.length - 1);
    expect(html.match(/aria-hidden="false"/g)).toHaveLength(1);
    // a closed panel is invisible once its height has collapsed (visibility is part of the transition)
    expect(html).toContain("transition-[grid-template-rows,visibility]");
    expect(html.match(/invisible grid-rows-\[0fr\]/g)).toHaveLength(checklist.steps.length - 1);
    expect(html).toContain("grid-rows-[1fr]");
    expect(html).toContain("grid-rows-[0fr]");
  });

  it("has the header button wired to its panel, and a separate done-circle", () => {
    const html = renderToStaticMarkup(
      <StepCard step={first} index={0} open done={false} onToggleOpen={noop} onToggleDone={noop} />,
    );
    expect(html).toContain(`id="${first.id}-header"`);
    expect(html).toContain(`aria-controls="${first.id}-panel"`);
    expect(html).toContain(`aria-labelledby="${first.id}-header"`);
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Mark step 1 done"');
    expect(html).toContain("h-11 w-11");
    // two sibling buttons, never nested
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).not.toMatch(/<button[^>]*>(?:(?!<\/button>)[\s\S])*<button/);
  });

  it("shows a done step as a filled olive circle with a check, and says so", () => {
    const html = renderToStaticMarkup(
      <StepCard step={first} index={0} open={false} done onToggleOpen={noop} onToggleDone={noop} />,
    );
    expect(html).toContain("bg-primary");
    expect(html).toContain("lucide-check");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="Step 1 done"');
  });

  it("animates the height in 200ms, and not for reduced motion", () => {
    const html = topic(first.id, []);
    expect(html).toContain("duration-200");
    expect(html).toContain("motion-reduce:transition-none");
  });

  it("ends with Practise this topic (primary) over Read the material (secondary), and no Source without a link", () => {
    const html = topic(first.id, []);
    expect(html).not.toContain(">Source<");
    expect(html.indexOf(">Practise this topic<")).toBeLessThan(html.indexOf(">Read the material<"));
    expect(html).toContain('href="/materials/read/S7"');
  });

  it("shows the Source row only when the content has a link", () => {
    const html = topic(first.id, [], {
      ...checklist,
      source: { label: "Official guidance", url: "https://example.org/guide" },
    });
    expect(html).toContain(">Source<");
    expect(html).toContain('href="https://example.org/guide"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("goes back through the history, and has no Steps ArrowCircle", () => {
    const code = readFileSync("components/StepsView/StepsTopic.tsx", "utf8");
    expect(code).toContain("router.back()");
    expect(code).toContain('router.push("/checklists")');
    expect(code).not.toContain("ArrowCircle");
  });
});
