import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import { Tag } from "@/components/Tag/Tag";

const lengths = ["short", "full", "extended"] as const;
const tones = { short: "peach", full: "lilac", extended: "blue" } as const;

function setup(selected: (typeof lengths)[number]) {
  return renderToStaticMarkup(
    <fieldset>
      {lengths.map((id) => (
        <SelectableCard
          key={id}
          name="length"
          value={id}
          checked={id === selected}
          onChange={() => undefined}
        >
          <Tag tone={tones[id]}>{id}</Tag>
        </SelectableCard>
      ))}
    </fieldset>,
  );
}

/** The class of the chip showing `label`. */
function chip(html: string, label: string) {
  const end = html.indexOf(`>${label}</span>`);
  const start = html.lastIndexOf('<span class="', end);
  return html.slice(start, end);
}

describe("a chip in a selected card turns primary", () => {
  it("selected: primary fill, white text, a stroke of the same primary", () => {
    const selected = chip(setup("full"), "full");
    expect(selected).toContain("border border-primary bg-primary text-primary-text");
    expect(selected).not.toContain("bg-tag-lilac");
  });

  it("unselected cards keep their own pastel and darker stroke", () => {
    const html = setup("full");
    expect(chip(html, "short")).toContain("text-text border border-tag-peach-stroke bg-tag-peach");
    expect(chip(html, "extended")).toContain("text-text border border-tag-blue-stroke bg-tag-blue");
  });

  it("changing the selection swaps the states", () => {
    const first = setup("short");
    const second = setup("extended");
    expect(chip(first, "short")).toContain("bg-primary");
    expect(chip(first, "extended")).toContain("bg-tag-blue");
    expect(chip(second, "short")).toContain("bg-tag-peach");
    expect(chip(second, "extended")).toContain("bg-primary");
  });

  it("a chip outside a selectable card is unchanged", () => {
    const html = renderToStaticMarkup(<Tag tone="yellow">Scenario</Tag>);
    expect(html).toContain("bg-tag-yellow");
    expect(html).not.toContain("bg-primary");
  });

  it("white on the primary is at least 4.5:1", () => {
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5]
        .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    expect((lum("#ffffff") + 0.05) / (lum("#3f4638") + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
});
