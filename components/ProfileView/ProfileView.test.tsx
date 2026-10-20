import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileView } from "@/components/ProfileView/ProfileView";
import { onboardingHref } from "@/lib/onboarding";
import type { Role } from "@/lib/role";

const account = (role: Role) => ({ name: "Maryana", email: "maryana@example.com", role });

const render = (role: Role, dialog: "reset" | "delete" | null = null) =>
  renderToStaticMarkup(
    <ProfileView
      account={account(role)}
      onRoleChange={() => undefined}
      direction="building-evacuation"
      onDirectionChange={() => undefined}
      dialog={dialog}
      onAskReset={() => undefined}
      onAskDelete={() => undefined}
      onCancelDialog={() => undefined}
      onReset={() => undefined}
      onDelete={() => undefined}
      onSignOut={() => undefined}
      resetDone={false}
      dialogInline
    />,
  ).replace(/<!-- -->/g, "");

describe("Profile: the user card", () => {
  const html = render("student");

  it("is one tap target to Edit profile with the avatar, name, email, role label and a chevron", () => {
    const start = html.lastIndexOf("<a ", html.indexOf("data-user-card"));
    const card = html.slice(start, html.indexOf("</a>", start));
    expect(card).toContain('href="/profile/edit"');
    expect(card).toContain(">M</span>");
    expect(card).toContain("rounded-full bg-olive-tint text-primary");
    expect(card).toContain(">Maryana</span>");
    expect(card).toContain(">maryana@example.com</span>");
    expect(card).toContain(">Student</span>");
    expect(card).toContain("lucide-chevron-right");
    expect(card).toContain("rounded-card bg-card");
    expect(html.indexOf(">Profile</h1>")).toBeLessThan(html.indexOf("data-user-card"));
  });

  it("shows the role label of an instructor", () => {
    expect(render("instructor")).toContain(">Instructor</span>");
  });
});

describe("Profile: Demo mode", () => {
  for (const role of ["student", "instructor"] as const) {
    it(`has the switch with ${role} selected`, () => {
      const html = render(role);
      expect(html).toContain(">Demo mode</h2>");
      expect(html).toContain(">Switch role (demo)</legend>");
      expect(html).toContain('role="radiogroup"');
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

  it("has Demo mode, Direction, Help and Settings in that order", () => {
    const order = [">Demo mode<", ">Direction<", ">Help</h2>", ">Settings</h2>"].map((text) =>
      html.indexOf(text),
    );
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html.match(/Coming soon/g)).toHaveLength(3);
  });

  it("has the Help rows with a chevron", () => {
    for (const [label, href] of [
      ["How the app works", onboardingHref],
      ["About this prototype", "/about"],
    ]) {
      const start = html.lastIndexOf("<a ", html.indexOf(`>${label}<`));
      const row = html.slice(start, html.indexOf("</a>", start));
      expect(row).toContain(`href="${href}"`);
      expect(row).toContain("lucide-chevron-right");
    }
  });

  it("has Settings: Reset progress, then Delete account (destructive), then Sign out last", () => {
    const settings = html.slice(html.indexOf(">Settings</h2>"));
    const order = [">Reset progress</h3>", "data-delete-account", "data-sign-out"].map((text) =>
      settings.indexOf(text),
    );
    expect(order.every((position) => position >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    const del = settings.slice(settings.indexOf("data-delete-account"));
    expect(del.slice(0, del.indexOf("</button>"))).toContain("text-wrong");
    expect(del.slice(0, del.indexOf("</button>"))).toContain(">Delete account<");
    const out = settings.slice(settings.indexOf("data-sign-out"));
    const outRow = out.slice(0, out.indexOf("</button>"));
    expect(outRow).toContain(">Sign out<");
    expect(outRow).not.toContain("text-wrong");
    // Sign out is the last thing in Settings
    expect(settings.indexOf("data-sign-out")).toBeGreaterThan(
      settings.indexOf("data-delete-account"),
    );
  });
});

describe("Profile for an instructor", () => {
  const html = render("instructor");

  it("has the card, Demo mode, Help and Settings with only Delete account and Sign out", () => {
    expect(html).not.toContain("Direction");
    expect(html).not.toContain("Reset progress");
    expect(html).toContain(">Demo mode</h2>");
    expect(html).toContain(">About this prototype<");
    expect(html).toContain(">Settings</h2>");
    expect(html).toContain("data-delete-account");
    expect(html).toContain("data-sign-out");
  });
});

describe("Profile: the delete confirmation", () => {
  it("asks the question with Cancel and Delete, inside the page, not a bottom sheet", () => {
    const html = render("student", "delete");
    expect(html).toContain("Delete account?");
    expect(html).toContain(
      "Delete this account and its progress from this device? This cannot be undone.",
    );
    expect(html).toContain(">Delete<");
    expect(html).toContain(">Cancel<");
    expect(html).not.toContain("Reset progress?");
  });

  it("is not shown while nothing is being deleted", () => {
    expect(render("student")).not.toContain("Delete account?");
  });
});

describe("Profile: colours", () => {
  it("uses registered tokens only", () => {
    for (const role of ["student", "instructor"] as const) {
      expect(render(role)).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
    }
  });
});

describe("Profile: the bare icons on four rows", () => {
  for (const role of ["student", "instructor"] as const) {
    it(`has a bare 24px icon, no tile, on the help, delete and sign out rows (${role})`, () => {
      const html = render(role);
      const rowOf = (label: string) => {
        const end = html.indexOf(`>${label}<`);
        const start = Math.max(html.lastIndexOf("<a ", end), html.lastIndexOf("<button", end));
        return html.slice(start, end);
      };
      for (const [label, icon] of [
        ["How the app works", "lucide-circle-question-mark"],
        ["About this prototype", "lucide-info"],
        ["Delete account", "lucide-trash2"],
        ["Sign out", "lucide-log-out"],
      ]) {
        const row = rowOf(label);
        expect(row, label).not.toMatch(/bg-neutral-tile-bg|rounded-full|h-10 w-10/);
        expect(row, label).toContain(
          label === "Delete account"
            ? "h-6 w-6"
            : "h-6 w-6 shrink-0 items-center justify-center text-neutral-tile-ink",
        );
        expect(row, label).toMatch(new RegExp(icon.replace("trash2", "trash-?2")));
        expect(row, label).toContain('width="24"');
      }
      expect(rowOf("Delete account")).toContain("text-wrong");
      expect(rowOf("Sign out")).not.toContain("lucide-chevron-right");
      expect(rowOf("Delete account")).not.toContain("lucide-chevron-right");
    });
  }

  it("keeps the chevron on the two Help rows", () => {
    const html = render("student");
    const help = html.slice(html.indexOf(">How the app works<"), html.indexOf(">Settings<"));
    expect(help.match(/lucide-chevron-right/g)).toHaveLength(2);
  });
});
