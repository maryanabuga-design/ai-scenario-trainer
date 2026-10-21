import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import pkg from "@/package.json";
import {
  AboutView,
  BUILD_LABEL,
  RESTART_HELPER,
  RESTART_TEXT,
  RESTART_TITLE,
  aboutLines,
} from "@/components/AboutView/AboutView";

describe("About this prototype", () => {
  const html = renderToStaticMarkup(<AboutView />);

  it("has Back to Profile, the title and exactly four lines, the last being the version", () => {
    expect(html).toContain('aria-label="Back to Profile"');
    expect(html).toContain('href="/profile"');
    expect(html).toContain(">About this prototype</h1>");
    expect(aboutLines).toEqual([
      "Your progress is saved on this device only.",
      "AI answers are prepared examples; there is no live AI model.",
      "All content is educational.",
      `Version ${pkg.version}`,
    ]);
    expect(html.match(/<li/g)).toHaveLength(4);
    for (const line of aboutLines) expect(html).toContain(line);
  });
});

describe("Restart demo on About this prototype", () => {
  const html = renderToStaticMarkup(<AboutView />).replace(/<!-- -->/g, "");

  it("has the helper above a Secondary Restart demo button, below the four lines", () => {
    expect(RESTART_HELPER).toBe(
      "Clears all demo data on this device (accounts, progress, exams, notifications) and starts from the beginning.",
    );
    expect(html).toContain(RESTART_HELPER);
    expect(html).toMatch(/<button[^>]*>Restart demo<\/button>/);
    expect(html).toContain("bg-olive-tint");
    expect(html).toContain("h-[52px]");
    const order = [aboutLines[3], RESTART_HELPER, ">Restart demo<"].map((text) =>
      html.indexOf(text),
    );
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("has no dialog until it is asked for, then the confirmation with Cancel and Restart", () => {
    expect(renderToStaticMarkup(<AboutView dialogInline />)).not.toContain(RESTART_TITLE);
    const open = renderToStaticMarkup(<AboutView confirming dialogInline />).replace(
      /<!-- -->/g,
      "",
    );
    expect(RESTART_TITLE).toBe("Restart the demo?");
    expect(RESTART_TEXT).toBe(
      "This deletes all demo data on this device and returns to the welcome screen.",
    );
    expect(open).toContain(RESTART_TITLE);
    expect(open).toContain(RESTART_TEXT);
    expect(open).toContain(">Restart<");
    expect(open).toContain(">Cancel<");
  });
});

describe("the build marker", () => {
  it("shows a muted 'Build <short commit>' line under the four info lines", () => {
    expect(BUILD_LABEL).toMatch(/^Build [0-9a-f]{7}$|^Build dev$/);
    const html = renderToStaticMarkup(<AboutView />);
    expect(html).toContain("data-build");
    expect(html).toContain(BUILD_LABEL);
    expect(html.indexOf("data-build")).toBeGreaterThan(html.indexOf("Version"));
    expect(html).toMatch(/data-build[^>]*text-text-secondary/);
  });
});
