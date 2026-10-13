import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MaterialTile } from "@/components/MaterialTile/MaterialTile";

const cases = [
  { type: "PDF", label: "PDF", icon: "lucide-file-text" },
  { type: "Word document", label: "DOCX", icon: "lucide-file-text" },
  { type: "Link", label: "LINK", icon: "lucide-link-2" },
];

describe("material tile", () => {
  it.each(cases)("shows the $label icon and plain label", ({ type, label, icon }) => {
    const html = renderToStaticMarkup(<MaterialTile type={type} />);
    expect(html).toContain(icon);
    expect(html).toContain(`<span class="type-label text-primary">${label}</span>`);
  });

  it("puts no pill around the label and is hidden from screen readers", () => {
    for (const { type } of cases) {
      const html = renderToStaticMarkup(<MaterialTile type={type} />);
      expect(html).toMatch(/^<span aria-hidden="true"/);
      expect(html).not.toContain("bg-tag-");
      expect(html.match(/rounded-full/g)).toBeNull();
    }
  });

  it("uses the one material tile for all three types", () => {
    for (const { type } of cases) {
      const html = renderToStaticMarkup(<MaterialTile type={type} />);
      expect(html).toContain("bg-material-tile");
      expect(html).toContain("h-16 w-16");
      expect(html).toContain("rounded-[20px]");
    }
  });
});
