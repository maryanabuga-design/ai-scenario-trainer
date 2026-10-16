import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BottomNav } from "@/components/BottomNav/BottomNav";

const shown = (path: string) => renderToStaticMarkup(<BottomNav activePath={path} />) !== "";

describe("the bottom navigation", () => {
  it("shows on the four sections and keeps Materials active on its other screens", () => {
    for (const path of ["/", "/training", "/materials", "/progress", "/profile"])
      expect(shown(path), path).toBe(true);
    expect(renderToStaticMarkup(<BottomNav activePath="/materials" />)).toContain(
      'aria-current="page"',
    );
    expect(shown("/materials/evacuation-guide")).toBe(true);
  });

  it("is hidden on the session screens and on every reading screen", () => {
    for (const path of ["/session", "/session/results", "/exam/session"])
      expect(shown(path), path).toBe(false);
    for (const path of ["/materials/read/S1", "/materials/read/F7"])
      expect(shown(path), path).toBe(false);
  });
});
