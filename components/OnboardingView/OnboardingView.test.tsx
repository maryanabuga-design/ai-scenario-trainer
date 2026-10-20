import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OnboardingView } from "@/components/OnboardingView/OnboardingView";
import { instructorSlides, studentSlides } from "@/lib/onboarding";
import type { Role } from "@/lib/role";

const render = (role: Role, index: number) =>
  renderToStaticMarkup(
    <OnboardingView
      role={role}
      index={index}
      direction="next"
      onNext={() => undefined}
      onPrevious={() => undefined}
      onSkip={() => undefined}
      onFinish={() => undefined}
    />,
  ).replace(/<!-- -->/g, "");

describe("the onboarding slides", () => {
  it("show the hero panel with the dashed 220 by 220 slot, the title and the subtitle", () => {
    const out = render("student", 0);
    expect(out).toContain("data-hero-panel");
    expect(out).toContain('data-media3d="placeholder"');
    expect(out).toContain("h-[220px] w-[220px]");
    expect(out).toContain(">Practise real situations</h1>");
    expect(out).toContain("Short scenarios and quizzes you can do in a few minutes.");
    expect(out).toContain("type-slide-title");
    expect(out).toContain("line-clamp-3 max-w-[320px]");
  });

  it("have the slide semantics: a group, roledescription slide, the label 1 of 3", () => {
    for (const [index, label] of ["1 of 3", "2 of 3", "3 of 3"].entries()) {
      const out = render("student", index);
      expect(out).toContain('role="group"');
      expect(out).toContain('aria-roledescription="slide"');
      expect(out).toContain(`aria-label="${label}"`);
    }
  });

  it("have the title as a focusable heading that is the one h1", () => {
    const out = render("student", 1);
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain('tabindex="-1"');
  });

  it("say Skip and Next on slides 1 and 2, no Skip and Get started on slide 3", () => {
    for (const index of [0, 1]) {
      const out = render("student", index);
      expect(out).toContain(">Skip<");
      expect(out).toContain(">Next<");
      expect(out).not.toContain(">Get started<");
    }
    const last = render("student", 2);
    expect(last).not.toContain(">Skip<");
    expect(last).not.toContain(">Next<");
    expect(last).toContain(">Get started<");
  });

  it("put Skip in the panel's top right corner and the Primary at the bottom", () => {
    const out = render("student", 0);
    expect(out.indexOf(">Skip<")).toBeLessThan(
      out.indexOf("</div>", out.indexOf("data-hero-panel")) + 400,
    );
    expect(out).toContain("absolute top-[calc(env(safe-area-inset-top)+16px)] right-4");
    expect(out).toContain("mt-auto");
    expect(out).toContain("pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]");
    expect(out.indexOf("data-dot")).toBeLessThan(out.lastIndexOf(">Next<"));
  });

  it("have the dots: 8px, the active one a 24 by 8 olive pill, the group named Step N of 3", () => {
    for (const index of [0, 1, 2]) {
      const out = render("student", index);
      expect(out).toContain(`role="img" aria-label="Step ${index + 1} of 3"`);
      expect(out.match(/data-dot="active"/g)).toHaveLength(1);
      expect(out.match(/data-dot="inactive"/g)).toHaveLength(2);
      expect(out).toContain("h-2 rounded-full w-6 bg-primary");
      expect(out).toContain("w-2 bg-olive-tint-pressed");
    }
  });

  it("have no Back button, and no link or control that is not the slide's", () => {
    const out = render("student", 1);
    expect(out).not.toContain("Back");
    expect(out).not.toContain("<a ");
  });

  it("enter with the slide animation, which the reduced-motion rule turns off", () => {
    expect(render("student", 0)).toContain("slide-in-next");
    const previous = renderToStaticMarkup(
      <OnboardingView
        role="student"
        index={0}
        direction="previous"
        onNext={() => undefined}
        onPrevious={() => undefined}
        onSkip={() => undefined}
        onFinish={() => undefined}
      />,
    );
    expect(previous).toContain("slide-in-previous");
  });

  it("show the instructor copy for an instructor", () => {
    for (const [index, slide] of instructorSlides.entries()) {
      const out = render("instructor", index);
      expect(out).toContain(`>${slide.title}</h1>`);
      expect(out).toContain(slide.body);
      expect(out).toContain(`data-slide="${slide.slot}"`);
    }
    for (const [index, slide] of studentSlides.entries()) {
      expect(render("student", index)).toContain(`data-slide="${slide.slot}"`);
    }
  });
});
