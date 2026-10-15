import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileView } from "@/components/ProfileView/ProfileView";
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
