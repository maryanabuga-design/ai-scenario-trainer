import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileView } from "@/components/ProfileView/ProfileView";
import { onboardingHref } from "@/lib/onboarding";
import { DEMO_USER } from "@/lib/user";

describe("Profile", () => {
  it("shows the same demo name as the Home greeting", () => {
    const html = renderToStaticMarkup(
      <ProfileView
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
    expect(html).toContain(`>${DEMO_USER.name}</span>`);
    expect(html.indexOf(">Profile</h1>")).toBeLessThan(html.indexOf(DEMO_USER.name));
  });
});

describe("the Help section of Profile", () => {
  const html = renderToStaticMarkup(
    <ProfileView
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

  it("has a small Help section with a row How the app works that opens the onboarding", () => {
    expect(html).toContain(">Help</h2>");
    const start = html.lastIndexOf("<a ", html.indexOf(">How the app works<"));
    const row = html.slice(start, html.indexOf("</a>", start));
    expect(row).toContain(`href="${onboardingHref}"`);
    expect(onboardingHref).toBe("/onboarding");
    expect(row).toContain("rounded-card bg-card");
    expect(row).toContain("lucide-chevron-right");
  });

  it("puts Help before Settings", () => {
    expect(html.indexOf(">Help</h2>")).toBeLessThan(html.indexOf(">Settings</h2>"));
  });
});
