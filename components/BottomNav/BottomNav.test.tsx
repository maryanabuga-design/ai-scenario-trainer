import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BottomNav } from "@/components/BottomNav/BottomNav";

const shown = (path: string) => renderToStaticMarkup(<BottomNav activePath={path} />) !== "";
const labels = (html: string) => [...html.matchAll(/<\/svg>([^<]+)<\/a>/g)].map((m) => m[1]);

describe("the bottom navigation", () => {
  it("shows on the four sections and keeps Materials active on its other screens", () => {
    for (const path of ["/", "/training", "/materials", "/progress", "/ask-ai"])
      expect(shown(path), path).toBe(true);
    // a thread and a student's Profile are sub-screens with Back: no navigation
    for (const path of ["/ask-ai/t-1", "/profile"]) expect(shown(path), path).toBe(false);
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

  it("has four items for a student: Home, Materials, Progress, Ask AI (Profile is behind the avatar)", () => {
    expect(labels(renderToStaticMarkup(<BottomNav activePath="/" role="student" />))).toEqual([
      "Home",
      "Materials",
      "Progress",
      "Ask AI",
    ]);
  });

  it("has Overview, Exams, Students, Content and Profile for an instructor, in the same style, Overview being Instructor Home", () => {
    const home = renderToStaticMarkup(<BottomNav activePath="/instructor" role="instructor" />);
    expect(labels(home)).toEqual(["Overview", "Exams", "Students", "Content", "Profile"]);
    expect(home).toContain('href="/instructor/content"');
    expect(home).toContain('href="/instructor/students"');
    expect(home).toContain('href="/instructor/exams"');
    expect(home).toContain('href="/instructor"');
    expect(home).toContain('href="/profile"');
    expect(home).not.toContain('href="/materials"');
    expect(home).toContain("type-caption-strong bg-sand-100 text-sand-900");
    expect(home).not.toContain("pastel-yellow");
    expect(home).toContain("min-h-14");
    // Overview is the current item on Instructor Home, Exams on the list, Profile on Profile
    expect(home).toMatch(/aria-current="page"[^>]*>(?:<svg.*?<\/svg>)Overview/);
    const exams = renderToStaticMarkup(
      <BottomNav activePath="/instructor/exams" role="instructor" />,
    );
    expect(exams).toMatch(/aria-current="page"[^>]*>(?:<svg.*?<\/svg>)Exams/);
    // a detail screen is a sub-screen with Back: no navigation
    for (const path of [
      "/instructor/exams/new",
      "/instructor/exams/grp-1",
      "/instructor/students/stu-01",
    ]) {
      expect(renderToStaticMarkup(<BottomNav activePath={path} role="instructor" />), path).toBe(
        "",
      );
    }
    const profile = renderToStaticMarkup(<BottomNav activePath="/profile" role="instructor" />);
    expect(profile).toMatch(/aria-current="page"[^>]*>(?:<svg.*?<\/svg>)Profile/);
    // an instructor has no navigation on a student-only screen
    expect(renderToStaticMarkup(<BottomNav activePath="/materials" role="instructor" />)).toBe("");
  });
});
