import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Notice } from "@/components/Notice/Notice";

const render = (props: Partial<Parameters<typeof Notice>[0]> = {}) =>
  renderToStaticMarkup(
    <Notice variant="info" title="A title" onClose={() => undefined} {...props}>
      The body
    </Notice>,
  ).replace(/<!-- -->/g, "");

describe("the Notice", () => {
  it("info: a white card with a 1px border, the neutral round icon tile, the bold title and the muted body", () => {
    const html = render();
    expect(html).toContain('data-notice="info"');
    expect(html).toContain("bg-card");
    expect(html).toContain("border border-selectable-stroke");
    expect(html).toContain("bg-neutral-tile-bg text-neutral-tile-ink");
    expect(html).toContain("h-10 w-10 rounded-full");
    expect(html).toContain("lucide-info");
    expect(html).toContain('class="type-body-strong">A title<');
    expect(html).toContain("text-text-secondary");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('role="status"');
  });

  it("to fix: the amber tint and ink with a white tile and an exclamation icon", () => {
    const html = render({ variant: "to-fix" });
    expect(html).toContain("bg-status-attention-bg text-status-attention-ink");
    expect(html).toContain("lucide-circle-alert");
    expect(html).toContain("bg-card text-status-attention-ink");
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it("success: the sage tint and ink with a check icon", () => {
    const html = render({ variant: "success" });
    expect(html).toContain("bg-status-success-bg text-status-success-ink");
    expect(html).toContain("lucide-check");
    expect(html).toContain('role="status"');
  });

  it("has the close button (44px, named) only on info and success, never on to fix", () => {
    for (const variant of ["info", "success"] as const) {
      const html = render({ variant });
      expect(html).toContain('aria-label="Close: A title"');
      expect(html).toContain("h-11 w-11");
    }
    const toFix = render({ variant: "to-fix" });
    expect(toFix).not.toContain("Close");
    expect(toFix).not.toContain("<button");
    // no onClose: no button at all
    expect(render({ onClose: undefined })).not.toContain("<button");
  });

  it("has no role for a plain to fix notice and role alert only when it appears from an action", () => {
    expect(render({ variant: "to-fix" })).not.toContain("role=");
    expect(render({ variant: "to-fix", alert: true })).toContain('role="alert"');
    expect(render({ variant: "info", alert: true })).toContain('role="status"');
  });

  it("holds ONE action under the body", () => {
    const html = render({ variant: "to-fix", action: <a href="#x">Show next issue</a> });
    expect(html.indexOf("The body")).toBeLessThan(html.indexOf("Show next issue"));
    expect(html.match(/Show next issue/g)).toHaveLength(1);
  });
});
