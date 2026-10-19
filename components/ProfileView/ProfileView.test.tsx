import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileView } from "@/components/ProfileView/ProfileView";
import { onboardingHref } from "@/lib/onboarding";
import type { Role } from "@/lib/role";
import { DEMO_USER } from "@/lib/user";

const render = (role: Role) =>
  renderToStaticMarkup(
    <ProfileView
      role={role}
      onRoleChange={() => undefined}
      direction="building-evacuation"
      onDirectionChange={() => undefined}
      confirming={false}
      onAskReset={() => undefined}
      onCancelReset={() => undefined}
      onReset={() => undefined}
      resetDone={false}
      dialogInline
    />,
  );

describe("Profile: the user card", () => {
  const html = render("student");

  it("shows the same demo name as the Home greeting, then the role label", () => {
    expect(html).toContain(`>${DEMO_USER.name}</span>`);
    expect(html.indexOf(">Profile</h1>")).toBeLessThan(html.indexOf(DEMO_USER.name));
    expect(html.indexOf(DEMO_USER.name)).toBeLessThan(html.indexOf(">Student</span>"));
    expect(render("instructor")).toContain(">Instructor</span>");
  });

  it("has the avatar with the initial and shows no email, because the data has none", () => {
    expect(html).toContain(">M</span>");
    expect(html).toContain("rounded-full bg-olive-tint text-primary");
    expect(DEMO_USER.email).toBeUndefined();
    expect(html).not.toContain("@");
  });
});

describe("Profile: Demo mode", () => {
  for (const role of ["student", "instructor"] as const) {
    it(`sits directly under the user card, with ${role} selected`, () => {
      const html = render(role);
      expect(html).toContain(">Demo mode</h2>");
      expect(html.indexOf(">Demo mode</h2>")).toBeGreaterThan(html.indexOf("data-role-label"));
      // nothing between the user card and Demo mode
      expect(html.indexOf(">Demo mode</h2>")).toBeLessThan(
        html.indexOf(">Direction<") === -1 ? Infinity : html.indexOf(">Direction<"),
      );
      expect(html).toContain(">Switch role (demo)</legend>");
      expect(html).toContain('role="radiogroup"');
      expect(html).toContain(">Student</label>");
      expect(html).toContain(">Instructor</label>");
      const checked = [...html.matchAll(/<input[^>]*checked=""[^>]*>/g)]
        .map((m) => m[0])
        .filter((input) => input.includes('name="role-'));
      expect(checked).toHaveLength(1);
      expect(checked[0]).toContain(`value="${role}"`);
      expect(html).toContain("min-h-11");
      expect(html).toContain(
        "Demo only. In the real product your role comes from your organisation account.",
      );
    });
  }
});

describe("Profile for a student", () => {
  const html = render("student");

  it("has Direction with three directions marked Coming soon, then Help, then Settings", () => {
    expect(html).toContain(">Direction</legend>");
    expect(html.match(/Coming soon/g)).toHaveLength(3);
    expect(html).not.toContain("Not available in this prototype");
    const order = [">Demo mode<", ">Direction<", ">Help</h2>", ">Settings</h2>"].map((text) =>
      html.indexOf(text),
    );
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("has the Help rows How the app works and About this prototype, each with a chevron", () => {
    for (const [label, href] of [
      ["How the app works", onboardingHref],
      ["About this prototype", "/about"],
    ]) {
      const start = html.lastIndexOf("<a ", html.indexOf(`>${label}<`));
      const row = html.slice(start, html.indexOf("</a>", start));
      expect(row).toContain(`href="${href}"`);
      expect(row).toContain("rounded-card bg-card");
      expect(row).toContain("lucide-chevron-right");
    }
    expect(onboardingHref).toBe("/onboarding");
    expect(html.indexOf(">How the app works<")).toBeLessThan(
      html.indexOf(">About this prototype<"),
    );
  });

  it("keeps Reset progress with its confirmation", () => {
    expect(html).toContain(">Reset progress</h3>");
    expect(html).toContain("Deletes your saved sessions");
  });
});

describe("Profile for an instructor", () => {
  const html = render("instructor");

  it("has no Direction and no Reset progress, but the Demo mode and Help rows", () => {
    expect(html).not.toContain("Direction");
    expect(html).not.toContain("Coming soon");
    expect(html).not.toContain("Reset progress");
    expect(html).not.toContain(">Settings</h2>");
    expect(html).toContain(">Demo mode</h2>");
    expect(html).toContain(">How the app works<");
    expect(html).toContain(">About this prototype<");
  });

  it("keeps the footer note", () => {
    expect(html).toContain("AI behavior is simulated for this prototype");
  });
});

describe("Profile: colours", () => {
  it("uses registered tokens only, no hard-coded colour", () => {
    for (const role of ["student", "instructor"] as const) {
      expect(render(role)).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
    }
  });
});
