import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Media3D } from "@/components/Media3D/Media3D";
import { Toggle } from "@/components/Toggle/Toggle";

const noop = () => undefined;

describe("Toggle", () => {
  it("is a switch with its state and its label", () => {
    const on = renderToStaticMarkup(<Toggle label="Shuffle questions" checked onChange={noop} />);
    expect(on).toContain('role="switch"');
    expect(on).toContain('aria-checked="true"');
    expect(on).toContain('aria-label="Shuffle questions"');
    expect(on).toContain("bg-primary");
    const off = renderToStaticMarkup(
      <Toggle label="Shuffle questions" checked={false} onChange={noop} />,
    );
    expect(off).toContain('aria-checked="false"');
    expect(off).toContain("bg-secondary-sand-pressed");
    expect(off).not.toContain("bg-primary");
  });

  it("is 52 by 32px with a 24px white knob", () => {
    const html = renderToStaticMarkup(<Toggle label="A" checked onChange={noop} />);
    expect(html).toContain("h-8 w-[52px]");
    expect(html).toContain("h-6 w-6");
    expect(html).toContain("bg-surface");
  });

  it("can be disabled with a hint", () => {
    const html = renderToStaticMarkup(
      <Toggle
        label="Only topics to repeat"
        checked={false}
        disabled
        hint="Nothing to repeat yet."
        onChange={noop}
      />,
    );
    expect(html).toContain("disabled");
    expect(html).toContain("Nothing to repeat yet.");
    expect(html).toContain("aria-describedby");
  });
});

describe("Media3D", () => {
  it("draws the hero placeholder: 200px, 28px radius, olive tint, dashed stroke, icon and 3D", () => {
    const html = renderToStaticMarkup(<Media3D variant="hero" />);
    expect(html).toContain('data-media3d="placeholder"');
    expect(html).toContain("h-[200px] w-[200px] rounded-[28px]");
    expect(html).toContain("bg-olive-tint");
    expect(html).toContain("border-[1.5px] border-dashed border-placeholder-stroke");
    expect(html).toContain("lucide-image");
    expect(html).toContain(">3D<");
    expect(html).toContain("type-micro");
  });

  it("draws the step placeholder: full width, 4:3, 16px radius", () => {
    const html = renderToStaticMarkup(<Media3D variant="step" />);
    expect(html).toContain("aspect-[4/3] w-full rounded-[16px]");
    expect(html).toContain("border-dashed");
    expect(html).toContain(">3D<");
  });

  it("draws the picture with its alt text when it has a src: contain for a hero, cover for a step", () => {
    const hero = renderToStaticMarkup(
      <Media3D variant="hero" src="/heroes/hero-passed.webp" alt="A checklist" />,
    );
    expect(hero).toContain('alt="A checklist"');
    expect(hero).toContain("object-contain");
    expect(hero).not.toContain("data-media3d");
    expect(hero).not.toContain("border-dashed");
    const step = renderToStaticMarkup(
      <Media3D variant="step" src="/scenarios/s01-alarm.webp" alt="A corridor" />,
    );
    expect(step).toContain("object-cover");
    expect(step).toContain('alt="A corridor"');
  });

  it("keeps the flat icon as the fallback of the icon variant", () => {
    const html = renderToStaticMarkup(
      <Media3D variant="icon" fallback={<span data-testid="flat">flat icon</span>} />,
    );
    expect(html).toBe('<span data-testid="flat">flat icon</span>');
    expect(html).not.toContain("3D");
  });
});
