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

  it("keep the Ready chip with its fill and stroke", () => {
    expect(renderList()).toContain("border border-correct-stroke bg-correct-bg text-correct");
  });
});
