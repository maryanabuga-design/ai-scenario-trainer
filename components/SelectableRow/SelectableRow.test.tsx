import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Chip } from "@/components/Chip/Chip";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";

function row(props: Partial<Parameters<typeof SelectableRow>[0]> = {}) {
  return renderToStaticMarkup(
    <SelectableRow name="n" value="v" checked={false} onChange={() => undefined} {...props}>
      Label
    </SelectableRow>,
  );
}

const labelClass = (html: string) => /<label class="([^"]*)"/.exec(html)?.[1] ?? "";
const css = readFileSync("app/globals.css", "utf8");
const token = (name: string) => new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, "i").exec(css)?.[1];

describe("SelectableRow: selecting changes only the indicator", () => {
  it("has the same classes selected and unselected, so the same background and border colour and width", () => {
    for (const type of ["radio", "checkbox"] as const) {
      expect(labelClass(row({ type, checked: true }))).toBe(labelClass(row({ type })));
    }
  });

  it("has the card fill, a 1px #E4DFD5 border and no selected tint or darker stroke", () => {
    const classes = labelClass(row({ checked: true }));
    expect(classes).toContain("bg-card");
    expect(classes).toContain("border border-selectable-stroke");
    expect(classes).not.toMatch(/selected|border-\[1\.5px\]|border-2|bg-olive|bg-primary|text-/);
    expect(token("selectable-stroke")?.toLowerCase()).toBe("#e4dfd5");
    expect(css).not.toMatch(/--selected-(tint|stroke|pressed)/);
    expect(css).not.toContain("#f2f3ef");
  });

  it("changes only the indicator: empty when unselected, filled olive with a white check when selected", () => {
    const off = row({ type: "checkbox" });
    const on = row({ type: "checkbox", checked: true });
    expect(off).not.toContain("lucide-check");
    expect(on).toContain("lucide-check");
    expect(on).toContain("text-primary-text");
    const indicator = (html: string) => /<span aria-hidden="true" class="([^"]*)">/.exec(html)?.[1];
    expect(indicator(off)).toContain("border-primary");
    expect(indicator(off)).not.toContain("bg-primary");
    expect(indicator(on)).toContain("bg-primary");
    // a radio shows the filled dot
    expect(row({ checked: true })).toContain("h-2.5 w-2.5 rounded-full bg-primary");
    expect(row()).not.toContain("h-2.5 w-2.5");
    expect(labelClass(on)).toBe(labelClass(off));
  });

  it("keeps the letter badge and the chips inside the same when selected", () => {
    const badge = (checked: boolean) =>
      /<span aria-hidden="true" class="([^"]*rounded-full[^"]*)">A<\/span>/.exec(
        row({ letter: "A", checked }),
      )?.[1];
    expect(badge(true)).toBe(badge(false));
    expect(badge(true)).toContain("bg-olive-tint");
    const chipClass = (checked: boolean) =>
      /<span class="([^"]*rounded-full[^"]*)">short<\/span>/.exec(
        renderToStaticMarkup(
          <SelectableRow name="n" value="v" checked={checked} onChange={() => undefined}>
            <Chip tone="peach">short</Chip>
          </SelectableRow>,
        ),
      )?.[1];
    expect(chipClass(true)).toBe(chipClass(false));
    expect(chipClass(true)).toContain("bg-pastel-peach");
    expect(chipClass(true)).not.toContain("bg-primary");
  });
});

describe("SelectableRow: padding, size and touch", () => {
  it("pads all four sides with the page gutter token and nothing else", () => {
    const classes = labelClass(row());
    expect(classes).toContain("p-[var(--gutter,1rem)]");
    expect(classes).not.toMatch(/(^| )(px|py|pt|pb|pl|pr)-/);
    expect(token("gutter") ?? /--gutter:\s*1rem;/.exec(css)?.[0]).toBeTruthy();
    expect(css).toMatch(/--gutter:\s*1rem;/);
  });

  it("uses the same gutter for the side margin of the page", () => {
    expect(readFileSync("components/AppShell/AppShell.tsx", "utf8")).toContain(
      "px-[var(--gutter,1rem)]",
    );
  });

  it("has the list-card radius token, the same as the Card component, and is at least 44px high", () => {
    const classes = labelClass(row());
    expect(classes).toContain("rounded-card");
    expect(classes.match(/rounded-[^ ]+/g)).toEqual(["rounded-card"]);
    expect(readFileSync("components/Card/Card.tsx", "utf8")).toContain("rounded-card");
    expect(css).toMatch(/--radius-card:\s*24px;/);
    expect(classes).toContain("min-h-11");
  });

  it("centres the icon, the text and the indicator vertically", () => {
    expect(labelClass(row())).toContain("items-center");
  });

  it("is one label around the input, the content and the indicator, so a tap anywhere toggles it", () => {
    const html = row({ type: "checkbox" });
    expect(html.startsWith("<label")).toBe(true);
    expect(html.endsWith("</label>")).toBe(true);
    expect(html.match(/<label/g)).toHaveLength(1);
    expect(html).toContain('<input type="checkbox"');
    expect(html).not.toContain("pointer-events-none");
  });

  it("is a radio for a single choice and a check box for several, with native semantics", () => {
    expect(row()).toContain('type="radio"');
    expect(row({ type: "checkbox" })).toContain('type="checkbox"');
    expect(row({ checked: true })).toContain('checked=""');
  });
});

describe("the page gutter is never a bare variable", () => {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return files(path);
      return /\.tsx$/.test(path) && !path.endsWith(".test.tsx") ? [path] : [];
    });
  }

  it("is always written with its 1rem fallback, so a stale style sheet cannot collapse the layout", () => {
    const bare = [...files("components"), ...files("app")].filter((file) =>
      /-\(--gutter\)|var\(--gutter\)/.test(readFileSync(file, "utf8")),
    );
    expect(bare).toEqual([]);
    for (const file of [
      "components/AppShell/AppShell.tsx",
      "components/SelectableRow/SelectableRow.tsx",
      "components/BottomNav/BottomNav.tsx",
      "components/ActionBar/ActionBar.tsx",
    ]) {
      expect(readFileSync(file, "utf8"), file).toContain("var(--gutter,1rem)");
    }
  });
});

describe("SelectableRow: pressed, focus and disabled", () => {
  it("has a brief pressed tone, the keyboard focus ring and no hover", () => {
    for (const html of [row(), row({ checked: true })]) {
      expect(labelClass(html)).toContain("active:bg-secondary-sand");
      expect(labelClass(html)).toContain("has-focus-visible:outline-accent");
      expect(labelClass(html)).not.toContain("hover:");
    }
  });

  it("disabled: muted label, sand, dashed control, native disabled input", () => {
    const html = row({ disabled: true });
    expect(labelClass(html)).toContain("text-text-secondary");
    expect(labelClass(html)).toContain("cursor-not-allowed");
    expect(html).toContain("border-dashed");
    expect(html).toContain('disabled=""');
  });
});

describe("every choice uses SelectableRow", () => {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return files(path);
      return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
    });
  }

  it("draws no other radio or check box rows", () => {
    // Allowed: the shared row itself, the answer option card and the segmented control.
    // (and the Edit question form of the Instructor, where each answer is a text input with its own circle)
    const allowed = ["SelectableRow", "SegmentedControl", "OptionCard", "EditQuestionView"];
    const own = [...files("components"), ...files("app")].filter((file) => {
      if (allowed.some((name) => file.includes(name))) return false;
      const code = readFileSync(file, "utf8");
      return /<input\b(?:(?!\/>)[\s\S])*?type="(radio|checkbox)"/.test(code);
    });
    expect(own).toEqual([]);
  });

  it("is used by Weak topics, the section list, Create training and the directions; answers use OptionCard", () => {
    expect(readFileSync("components/QuestionScreen/QuestionScreen.tsx", "utf8")).toContain(
      "<OptionCard",
    );
    for (const file of [
      "components/WeakTopicsView/WeakTopicsView.tsx",
      "components/SectionList/SectionList.tsx",
      "components/TrainingCreate/TrainingCreate.tsx",
      "components/DirectionPicker/DirectionPicker.tsx",
    ]) {
      expect(readFileSync(file, "utf8"), file).toContain("<SelectableRow");
    }
  });

  it("uses the one icon tile in every selection screen, never a per-topic pastel", () => {
    for (const file of [
      "components/WeakTopicsView/WeakTopicsView.tsx",
      "components/TrainingCreate/TrainingCreate.tsx",
      "components/SectionList/SectionList.tsx",
    ]) {
      const code = readFileSync(file, "utf8");
      expect(code, file).not.toMatch(/pastel-/);
    }
    expect(readFileSync("components/WeakTopicsView/WeakTopicsView.tsx", "utf8")).toContain(
      "<TopicTile",
    );
  });
});
