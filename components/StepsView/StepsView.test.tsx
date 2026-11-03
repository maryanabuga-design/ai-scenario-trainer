import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StepCard } from "@/components/StepsView/StepCard";
import { StepsList } from "@/components/StepsView/StepsList";
import { StepsTopicView } from "@/components/StepsView/StepsTopic";
import { checklists } from "@/lib/checklists";
import { contrastRatio, TEXT_CONTRAST } from "@/lib/contrast";

const noop = () => {};
const topic = (open: string | null, checklist = checklists[1]) =>
  renderToStaticMarkup(
    <StepsTopicView checklist={checklist} open={open} onBack={noop} onToggleOpen={noop} />,
  );

describe("the Steps list", () => {
  const html = renderToStaticMarkup(<StepsList />);

  it("has the band with the 40px Back to Materials, the title and the subtitle", () => {
    const band = html.slice(0, html.indexOf("<ul"));
    expect(band).toContain("data-page-header-band");
    expect(band).toContain("bg-secondary-sand");
    expect(band).toContain('aria-label="Back to Materials"');
    expect(band).toContain('href="/materials?view=steps"');
    expect(band).toContain("h-10 w-10");
    expect(band).toContain(">Step guides</h1>");
    expect(band).toContain("Short step-by-step guides for the topics that have one.");
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it("has a row per step guide: neutral icon tile, the title, '6 steps · S1' and a chevron", () => {
    const list = html.slice(html.indexOf("<ul"));
    expect(list.match(/<li/g)).toHaveLength(checklists.length);
    checklists.forEach((checklist) => {
      expect(list).toContain(checklist.title);
      expect(list).toContain(`>${checklist.steps.length} steps · ${checklist.topic}<`);
      expect(list).toContain(`href="/checklists/${checklist.id}"`);
      expect(list).toContain(
        `aria-label="${checklist.title}, ${checklist.steps.length} steps · ${checklist.topic}"`,
      );
    });
    expect(list).not.toMatch(/done/i);
    expect(list.match(/lucide-chevron-right/g)).toHaveLength(checklists.length);
    expect(list.match(/h-12 w-12 rounded-\[14px\]/g)).toHaveLength(checklists.length);
    expect(list.match(/bg-chip-neutral-bg text-text/g)).toHaveLength(checklists.length);
    expect(list).not.toContain("bg-olive-tint");
    expect(list).not.toMatch(/checklist(?!s\/)/i);
  });

  it("gives the three guides three different icons: bell, blood drop, flame", () => {
    expect(checklists.map((checklist) => checklist.icon)).toEqual(["BellRing", "Droplet", "Flame"]);
    const list = html.slice(html.indexOf("<ul"));
    expect(list).toContain("lucide-bell-ring");
    expect(list).toContain("lucide-droplet");
    expect(list).toContain("lucide-flame");
  });

  it("uses the topic-row pattern of Materials: a row with a divider, no card look and no shadow", () => {
    const list = html.slice(html.indexOf("<ul"));
    expect(list).toContain("border-b border-selectable-stroke");
    expect(list).not.toContain("bg-list-card");
    expect(list).not.toContain("shadow");
    expect(html).not.toContain("ArrowCircle");
  });
});

describe("a Steps topic screen", () => {
  const checklist = checklists[1];
  const first = checklist.steps[0];
  const second = checklist.steps[1];

  it("has the primary header band with Back and the title, no subtitle, and room for the card", () => {
    const html = topic(first.id);
    const band = html.slice(html.indexOf("data-page-header-band"), html.indexOf("<section"));
    expect(band).toContain("bg-secondary-sand");
    expect(band).toContain("data-full-bleed");
    expect(band).toContain('aria-label="Back"');
    expect(band).toContain("h-10 w-10");
    expect(band).toContain(`>${checklist.title}</h1>`);
    expect(band).toContain("pb-14");
    expect(band).not.toMatch(/<p[ >]/);
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
    // the 48px tile has the 14px radius, not a circle
    expect(card).toContain("h-12 w-12 rounded-[14px]");
    // the same icon as its list card
    expect(card).toContain("lucide-droplet");
    expect(card).not.toContain("rounded-full");
    expect(card).toContain("bg-chip-neutral-bg text-text");
    expect(card).not.toContain("bg-olive-tint");
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
    expect(code).toContain("router.push(STEP_GUIDES_PATH)");
    expect(code).not.toMatch(/ArrowCircle|steps-progress|usePractise|toggleStep/);
  });
});

describe("the step cards: standard cards with green captions", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const token = (name: string) => {
    const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css);
    if (!match) throw new Error(`No hex value for --${name}`);
    return match[1].toLowerCase();
  };
  const step = checklists[0].steps[0];
  const html = renderToStaticMarkup(
    <StepCard step={step} index={0} open onToggleOpen={() => {}} />,
  );

  it("has the band and caption tokens, and no green card tokens", () => {
    expect(token("step-caption")).toBe("#3f6b2a");
    // no other band or step colours are registered
    const names = [...css.matchAll(/--((?:band|step)-[a-z0-9-]+):/g)].map((match) => match[1]);
    expect(new Set(names)).toEqual(new Set(["step-caption"]));
  });

  it("is the standard card: card fill, 1px normal border, card radius, gutter padding", () => {
    expect(html).toContain("bg-card");
    expect(html).toContain("border border-selectable-stroke");
    expect(html).toContain("rounded-card");
    expect(html).toContain("p-[var(--gutter,1rem)]");
    expect(html).not.toMatch(/bg-list-card|bg-step|border-step/);
    // only the caption is green; the title, the chevron and the body are dark
    expect(html.match(/step-caption/g)).toHaveLength(1);
    expect(html).toContain("type-label text-step-caption");
    expect(html).toContain("type-body-strong text-text");
    expect(html).toContain("shrink-0 text-text");
  });

  it("keeps the summary card standard too", () => {
    const topic = renderToStaticMarkup(
      <StepsTopicView
        checklist={checklists[0]}
        open={null}
        onBack={() => {}}
        onToggleOpen={() => {}}
      />,
    );
    const summary = topic.slice(topic.indexOf('aria-label="Summary"'), topic.indexOf("<ol"));
    expect(summary).toContain("bg-card");
    expect(summary).not.toContain("step-caption");
  });

  it("never uses the answer-feedback green: its token differs and the card does not reference it", () => {
    for (const answer of ["correct", "correct-bg", "correct-text"]) {
      expect(token("step-caption")).not.toBe(token(answer));
      expect(html).not.toContain(answer);
    }
  });

  it("keeps the caption token to the Steps topic screen only", () => {
    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return files(path);
        return /\.(tsx?|css)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
      });
    const users = [...files("components"), ...files("app"), ...files("lib")].filter((file) =>
      /step-caption/.test(readFileSync(file, "utf8")),
    );
    expect(users.sort()).toEqual(["app/globals.css", "components/StepsView/StepCard.tsx"]);
  });

  it("reads at least 4.5:1: the caption and the text on the card, the text on the band", () => {
    const card = token("card");
    expect(contrastRatio(token("step-caption"), card)).toBeGreaterThanOrEqual(TEXT_CONTRAST);
    expect(contrastRatio(token("text"), card)).toBeGreaterThanOrEqual(TEXT_CONTRAST);
    expect(contrastRatio(token("text"), token("secondary-sand"))).toBeGreaterThanOrEqual(
      TEXT_CONTRAST,
    );
  });
});
