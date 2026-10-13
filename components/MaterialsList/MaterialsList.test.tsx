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
      '<p class="type-small text-text-secondary">Guides you can turn into scenarios and quizzes.</p>',
    );
    expect(html.indexOf(">Materials</h1>")).toBeLessThan(html.indexOf("Guides you can turn"));
  });
});
