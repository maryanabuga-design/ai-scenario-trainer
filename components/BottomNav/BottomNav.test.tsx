import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BottomNav } from "@/components/BottomNav/BottomNav";

const shown = (path: string) => renderToStaticMarkup(<BottomNav activePath={path} />) !== "";
const labels = (html: string) => [...html.matchAll(/<\/svg>([^<]+)<\/a>/g)].map((m) => m[1]);

describe("the bottom navigation", () => {
  it("shows on the four sections and keeps Materials active on its other screens", () => {
    for (const path of ["/", "/training", "/materials", "/progress", "/profile"])
      expect(shown(path), path).toBe(true);
    expect(renderToStaticMarkup(<BottomNav activePath="/materials" />)).toContain(
      'aria-current="page"',
    );
    expect(shown("/materials/evacuation-guide")).toBe(true);
  });

  it("is hidden on the session screens, on every reading screen and on About", () => {
    for (const path of ["/session", "/session/results", "/exam/session", "/about"])
      expect(shown(path), path).toBe(false);
    for (const path of ["/materials/read/S1", "/materials/read/F7"])
      expect(shown(path), path).toBe(false);
  });

  it("has four items for a student", () => {
    expect(labels(renderToStaticMarkup(<BottomNav activePath="/" role="student" />))).toEqual([
      "Home",
      "Materials",
      "Progress",
      "Profile",
    ]);
  });

  it("has only Home and Profile for an instructor, in the same style, Home being Instructor Home", () => {
    const home = renderToStaticMarkup(<BottomNav activePath="/instructor" role="instructor" />);
    expect(labels(home)).toEqual(["Home", "Profile"]);
    expect(home).toContain('href="/instructor"');
    expect(home).toContain('href="/profile"');
    expect(home).not.toContain('href="/materials"');
    expect(home).toContain("type-caption-strong bg-sand-200 text-sand-900");
    expect(home).not.toContain("pastel-yellow");
    expect(home).toContain("min-h-14");
    // Home is the current item on Instructor Home, Profile on Profile
    expect(home).toMatch(/aria-current="page"[^>]*>(?:<svg.*?<\/svg>)Home/);
    const profile = renderToStaticMarkup(<BottomNav activePath="/profile" role="instructor" />);
    expect(profile).toMatch(/aria-current="page"[^>]*>(?:<svg.*?<\/svg>)Profile/);
    // an instructor has no navigation on a student-only screen
    expect(renderToStaticMarkup(<BottomNav activePath="/materials" role="instructor" />)).toBe("");
  });
});
