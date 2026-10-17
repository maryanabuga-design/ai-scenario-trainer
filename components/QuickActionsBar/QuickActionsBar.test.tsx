import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuickActionsBar } from "@/components/QuickActionsBar/QuickActionsBar";

const render = (props: Partial<Parameters<typeof QuickActionsBar>[0]> = {}) =>
  renderToStaticMarkup(
    <QuickActionsBar visible stepsHref="/checklists/x" onPractise={() => {}} {...props} />,
  );

describe("the quick-actions bar", () => {
  it("has Steps and Practise this topic side by side, Steps about 40% and Practise about 60%", () => {
    const html = render();
    expect(html).toContain(">Steps<");
    expect(html).toContain(">Practise this topic<");
    expect(html.indexOf(">Steps<")).toBeLessThan(html.indexOf(">Practise this topic<"));
    expect(html).toContain("flex-[2]");
    expect(html).toContain("flex-[3]");
  });

  it("with no steps, Practise is the only button and takes the full width", () => {
    const html = render({ stepsHref: null });
    expect(html).not.toContain(">Steps<");
    expect(html).toContain("flex-[3]");
    expect(html).not.toContain("flex-[2]");
  });

  it("is fixed at the bottom with a 24px fade and no border, and the buttons carry the shadow", () => {
    const html = render();
    expect(html).toContain("fixed inset-x-0 bottom-0");
    expect(html).toContain("h-6");
    expect(html).toContain("linear-gradient(to_bottom,transparent,var(--bg))");
    expect(html).toContain("shadow-(--card-shadow)");
    // no border on the bar itself (the buttons are inside)
    expect(html.slice(0, html.search(/<(a|button)\b/))).not.toMatch(/\bborder/);
    expect(html).toContain("env(safe-area-inset-bottom)");
  });

  it("animates 160ms with an 8px slide, and switches instantly for reduced motion", () => {
    const html = render({ visible: false });
    expect(html).toContain("duration-160");
    expect(html).toContain("translate-y-2");
    expect(html).toContain("motion-reduce:transition-none");
  });

  it("hidden is not focusable and not announced; shown is", () => {
    const hidden = render({ visible: false });
    expect(hidden).toContain("inert");
    expect(hidden).toContain('aria-hidden="true"');
    expect(hidden).toContain("invisible");
    const shown = render();
    expect(shown).not.toContain("inert");
    expect(shown).toContain('aria-hidden="false"');
  });
});
