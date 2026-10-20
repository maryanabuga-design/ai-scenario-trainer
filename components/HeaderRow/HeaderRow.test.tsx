import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { HeaderRow } from "@/components/HeaderRow/HeaderRow";
import { MaterialsList } from "@/components/MaterialsList/MaterialsList";
import { sampleMaterials } from "@/lib/materials";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/materials",
}));

describe("header with an action", () => {
  const html = renderToStaticMarkup(
    <HeaderRow
      title={<h1>Materials</h1>}
      action={<button type="button">Upload a file</button>}
      subtitle={<p>Guides you can turn into scenarios and quizzes.</p>}
    />,
  );

  it("puts the subtitle on its own line below the whole title row, 12px under it", () => {
    // The outer column holds two children: the row (title + button), then the subtitle.
    expect(html).toMatch(
      /^<div class="flex flex-col gap-3"><div class="flex items-center justify-between gap-3">.*<\/div><p>Guides you can turn/,
    );
    const row = html.slice(0, html.indexOf("<p>"));
    expect(row).toContain("Upload a file");
    expect(row).toContain("Materials");
  });

  it("never lets the button wrap or shrink; the title takes the rest and may wrap", () => {
    expect(html).toContain(
      '<div class="min-w-0 flex-1 break-words hyphens-auto"><h1>Materials</h1></div>',
    );
    expect(html).toContain(
      '<div class="shrink-0 [&amp;&gt;a]:whitespace-nowrap [&amp;&gt;button]:whitespace-nowrap [&amp;&gt;div&gt;button]:whitespace-nowrap"><button',
    );
  });

  it("is used on the Materials page, 24px above the tabs", () => {
    const page = renderToStaticMarkup(
      <ActionBarProvider>
        <MaterialsList samples={sampleMaterials} />
      </ActionBarProvider>,
    );
    expect(page).toMatch(/^<div class="flex flex-col gap-6"><div class="flex flex-col gap-3">/);
    for (const file of [
      "components/UploadSheet/UploadSheet.tsx",
      "components/SourceSheet/SourceSheet.tsx",
      "components/SoftCard/SoftCard.tsx",
    ]) {
      expect(readFileSync(file, "utf8"), file).toContain("<HeaderRow");
    }
  });
});
