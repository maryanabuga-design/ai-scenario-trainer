import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SelectableCard } from "@/components/SelectableCard/SelectableCard";

function card(props: Partial<Parameters<typeof SelectableCard>[0]> = {}) {
  return renderToStaticMarkup(
    <SelectableCard name="n" value="v" checked={false} onChange={() => undefined} {...props}>
      Label
    </SelectableCard>,
  );
}

const labelClass = (html: string) => /<label class="([^"]*)"/.exec(html)?.[1] ?? "";

describe("SelectableCard: one set of states", () => {
  it("unselected: card fill, 1px neutral stroke, empty control", () => {
    const html = card();
    expect(labelClass(html)).toContain("border border-selectable-stroke bg-card");
    expect(html).not.toContain("bg-primary");
  });

  it("selected: tint, 1.5px darker stroke, filled control", () => {
    const html = card({ checked: true });
    expect(labelClass(html)).toContain("border-[1.5px] border-selected-stroke bg-selected-tint");
    expect(html).toContain("bg-primary");
  });

  it("pressed tint, focus ring for the keyboard only, 44px or more, no hover", () => {
    for (const html of [card(), card({ checked: true })]) {
      expect(labelClass(html)).toContain("active:bg-selected-pressed");
      expect(labelClass(html)).toContain("has-focus-visible:outline-accent");
      expect(labelClass(html)).toMatch(/min-h-(12|14)/);
      expect(labelClass(html)).not.toContain("hover:");
    }
  });

  it("disabled: muted label, sand, dashed control, native disabled input", () => {
    const html = card({ disabled: true });
    expect(labelClass(html)).toContain("text-text-secondary");
    expect(labelClass(html)).toContain("cursor-not-allowed");
    expect(html).toContain("border-dashed");
    expect(html).toContain('disabled=""');
  });

  it("is a radio for a single choice and a check box for several", () => {
    expect(card()).toContain('type="radio"');
    expect(card()).toContain("rounded-full");
    expect(card({ type: "checkbox" })).toContain('type="checkbox"');
    expect(card({ type: "checkbox", checked: true })).toContain("lucide-check");
  });

  it("has two sizes of the same component", () => {
    expect(labelClass(card({ size: "card" }))).toContain("rounded-card");
    expect(labelClass(card({ size: "row" }))).toContain("rounded-[20px]");
  });
});

describe("every choice uses SelectableCard", () => {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return files(path);
      return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
    });
  }

  it("draws no other radio or check box cards", () => {
    // Allowed: the shared card itself, the segmented switch and the confidence pills.
    const allowed = ["SelectableCard", "SegmentedControl", "ConfidenceSelector"];
    const own = [...files("components"), ...files("app")].filter((file) => {
      if (allowed.some((name) => file.includes(name))) return false;
      const code = readFileSync(file, "utf8");
      return /<input\b(?:(?!\/>)[\s\S])*?type="(radio|checkbox)"|ChoiceCard|PillGroup/.test(code);
    });
    expect(own).toEqual([]);
  });
});
