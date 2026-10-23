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
  it("is a white card with a 1px border, 16px radius and padding, never a coloured fill", () => {
    for (const variant of ["info", "to-fix", "success"] as const) {
      const html = render({ variant });
      expect(html).toContain("rounded-[16px] border border-selectable-stroke bg-card p-4");
      const card = html.slice(0, html.indexOf(">"));
      expect(card).not.toMatch(/bg-status|text-status/);
      expect(html).toContain("text-text");
    }
  });

  it("carries the variant in the icon tile: neutral, amber or sage, 40px and round", () => {
    const info = render({ variant: "info" });
    expect(info).toContain("bg-neutral-tile-bg text-neutral-tile-ink");
    expect(info).toContain("lucide-info");
    const toFix = render({ variant: "to-fix" });
    expect(toFix).toMatch(
      /data-notice-tile[^>]*h-10 w-10[^>]*bg-status-attention-bg text-status-attention-ink/,
    );
    expect(toFix).toContain("lucide-circle-alert");
    const success = render({ variant: "success" });
    expect(success).toMatch(/data-notice-tile[^>]*bg-status-success-bg text-status-success-ink/);
    expect(success).toContain("lucide-check");
    expect(success).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it("has the title on one line in the text colour, semibold, and a muted body of at most two lines", () => {
    const html = render();
    expect(html).toContain('class="type-body-strong truncate">A title<');
    expect(html).toContain("type-small text-text-secondary line-clamp-2");
    expect(html).not.toContain('text-status-attention-ink">A title');
    // a body that must be read in full
    expect(render({ clamp: false })).not.toContain("line-clamp-2");
  });

  it("has the close button only on info and success: a small neutral circle in the corner with a 44px tap area", () => {
    for (const variant of ["info", "success"] as const) {
      const html = render({ variant });
      expect(html).toContain('aria-label="Close: A title"');
      expect(html).toMatch(/absolute top-0 right-0 flex h-11 w-11/);
      expect(html).toMatch(/data-notice-close[^>]*h-7 w-7[^>]*rounded-full bg-neutral-tile-bg/);
    }
    const toFix = render({ variant: "to-fix" });
    expect(toFix).not.toContain("Close");
    expect(toFix).not.toContain("<button");
    expect(render({ onClose: undefined })).not.toContain("<button");
  });

  it("has role status for info and success, none for a plain to fix notice and alert only from an action", () => {
    expect(render()).toContain('role="status"');
    expect(render({ variant: "success" })).toContain('role="status"');
    expect(render({ variant: "to-fix" })).not.toContain("role=");
    expect(render({ variant: "to-fix", alert: true })).toContain('role="alert"');
    expect(render({ variant: "info", alert: true })).toContain('role="status"');
    expect(render()).toContain('aria-hidden="true"');
  });

  it("holds ONE action under the body", () => {
    const html = render({ variant: "to-fix", action: <a href="#x">Replace files</a> });
    expect(html.indexOf("The body")).toBeLessThan(html.indexOf("Replace files"));
    expect(html.match(/Replace files/g)).toHaveLength(1);
  });
});
