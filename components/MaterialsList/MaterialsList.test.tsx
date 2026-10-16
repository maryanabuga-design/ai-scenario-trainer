import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { MaterialsList } from "@/components/MaterialsList/MaterialsList";
import { sampleMaterials } from "@/lib/materials";
import type { Material } from "@/lib/materials";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/materials",
}));

function renderList(samples: Material[] = sampleMaterials) {
  return renderToStaticMarkup(
    <ActionBarProvider>
      <MaterialsList samples={samples} />
    </ActionBarProvider>,
  );
}

describe("Materials header", () => {
  it("has the grey one-line subtitle under the title", () => {
    const html = renderList();
    expect(html).toContain(
      '<p class="type-small text-text-secondary">Guides you can turn into scenarios<br/>and quizzes.</p>',
    );
    expect(html.indexOf(">Materials</h1>")).toBeLessThan(html.indexOf("Guides you can turn"));
  });
});

describe("Materials cards", () => {
  it("end in a plain dark green chevron with no circle, inside a 44px area", () => {
    const html = renderList();
    const chevron = html.indexOf("lucide-chevron-right");
    expect(chevron).toBeGreaterThan(-1);
    const wrapper = html.slice(html.lastIndexOf("<span", chevron), chevron);
    expect(wrapper).toContain("h-11 w-11");
    expect(wrapper).not.toMatch(/bg-|border|shadow|rounded-full/);
    expect(html).toMatch(
      /lucide-chevron-right[^"]*text-primary|text-primary[^>]*><svg[^>]*lucide-chevron-right/,
    );
    // The cards (in the tab panel) have no ArrowCircle; the upload sheet's rows keep theirs.
    const cards = html.slice(html.indexOf('role="tabpanel"'));
    expect(cards).not.toContain("border-arrow-stroke");
  });

  it("put the chevron in the middle of the whole card, which is one link", () => {
    const html = renderList();
    const start = html.indexOf('<div class="relative flex items-center');
    expect(start).toBeGreaterThan(-1);
    const card = html.slice(start, html.indexOf("</li>", start));
    // The link stretches over the whole card; the chevron is outside the link, on the card's right.
    expect(card).toMatch(/<a class="[^"]*after:absolute after:inset-0/);
    const link = card.slice(card.indexOf("<a "), card.indexOf("</a>"));
    expect(link).not.toContain("lucide-chevron-right");
    expect(card.lastIndexOf("lucide-chevron-right")).toBeGreaterThan(card.indexOf("Ready"));
    expect(card).toContain("has-focus-visible:outline-accent");
  });

  it("keep the Ready chip, olive with a check", () => {
    expect(renderList()).toContain("bg-olive-tint text-text");
  });
});
