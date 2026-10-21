import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { ActionBarProvider } from "@/components/ActionBar/ActionBar";
import { AskAiView } from "@/components/AskAiView/AskAiView";
import { FieldOfWorkStep } from "@/components/FieldOfWork/FieldOfWorkStep";
import { FieldPickerView } from "@/components/FieldOfWork/FieldPickerView";
import { ProfileView } from "@/components/ProfileView/ProfileView";
import { suggestedFor } from "@/lib/ask-ai";
import type { FieldOfWork } from "@/lib/field-of-work";
import type { Role } from "@/lib/role";

const noop = () => undefined;
const render = (node: ReactNode) =>
  renderToStaticMarkup(<ActionBarProvider>{node}</ActionBarProvider>).replace(/<!-- -->/g, "");

describe("the Field of work step", () => {
  const html = render(<FieldOfWorkStep onContinue={noop} onSkip={noop} />);

  it("has the title, the subtitle and no picture and no Back", () => {
    expect(html).toContain(">Tell us about your work</h1>");
    expect(html).toContain(
      "We use this to tune examples in Ask AI. You can change it later in Profile.",
    );
    expect(html).not.toContain("<img");
    expect(html).not.toContain("data-picture-frame");
    expect(html).not.toMatch(/Back/);
    expect(html).not.toContain("<a ");
  });

  it("has five single-choice rows of exactly 72px, none chosen, with the full labels", () => {
    expect(html.match(/name="field-of-work"/g)).toHaveLength(5);
    expect(html.match(/h-\[72px\]/g)).toHaveLength(5);
    expect(html).not.toContain("checked");
    for (const label of [
      "Rescue and emergency services",
      "Paramedic or medical",
      "Military",
      "Civil protection or volunteer",
      "Other",
    ]) {
      expect(html).toContain(label);
    }
    expect(html).toContain('type="radio"');
  });

  it("has the educational note in a named style, and underlines nothing", () => {
    expect(html).toContain("All content in this app is educational and non-combat.");
    expect(html).not.toMatch(/underline/);
    const code = readFileSync("components/FieldOfWork/FieldOfWorkStep.tsx", "utf8");
    expect(code).not.toMatch(/text-\[/);
  });

  it("marks the chosen row", () => {
    const chosen = render(<FieldOfWorkStep onContinue={noop} onSkip={noop} initial="civil" />);
    expect(chosen.match(/checked/g)).toHaveLength(1);
  });
});

describe("the field picker", () => {
  const picker = (value: FieldOfWork | null) =>
    render(
      <FieldPickerView
        value={value}
        onChange={noop}
        onClear={noop}
        back={{ label: "Back to Profile", href: "/profile" }}
      />,
    );

  it("has the band with Back, the title and the subtitle", () => {
    const html = picker(null);
    expect(html).toContain("data-page-header-band");
    expect(html).toContain(">Field of work</h1>");
    expect(html).toContain("Used to tune examples in Ask AI.");
    expect(html).toContain('href="/profile"');
    expect(html.match(/h-\[72px\]/g)).toHaveLength(5);
  });

  it("shows Clear selection only while something is chosen", () => {
    expect(picker(null)).not.toContain("Clear selection");
    expect(picker("military")).toContain(">Clear selection<");
  });
});

describe("the Profile row", () => {
  const profile = (role: Role, field: FieldOfWork | null) =>
    render(
      <ProfileView
        account={{ name: "Maryana", email: "m@example.com", role, field }}
        onRoleChange={noop}
        direction="building-evacuation"
        onDirectionChange={noop}
        dialog={null}
        onAskReset={noop}
        onAskDelete={noop}
        onCancelDialog={noop}
        onReset={noop}
        onDelete={noop}
        onSignOut={noop}
        resetDone={false}
        dialogInline
      />,
    );

  it("sits right below Direction, shows the short label or Not set, and opens the picker", () => {
    const html = profile("student", "paramedic");
    expect(html).toContain('href="/profile/field"');
    expect(html).toMatch(/data-field-value[^>]*>Paramedic</);
    expect(profile("student", null)).toMatch(/data-field-value[^>]*>Not set</);
    expect(html.indexOf("Direction")).toBeLessThan(html.indexOf("data-field-row"));
    expect(html.indexOf("data-field-row")).toBeLessThan(html.indexOf("data-certificates-row"));
    const row = html.slice(html.indexOf("data-field-row"), html.indexOf("data-certificates-row"));
    expect(row).toContain("lucide-chevron-right");
    expect(row).toContain("h-14");
  });

  it("is not on the Instructor's Profile", () => {
    expect(profile("instructor", "rescue")).not.toContain("data-field-row");
  });
});

describe("the Ask AI row", () => {
  const ask = (field: FieldOfWork | null) =>
    render(
      <AskAiView
        threads={[]}
        now={0}
        field={field}
        onSend={noop}
        onSuggested={noop}
        confirming={false}
        onAskClear={noop}
        onCancelClear={noop}
        onClear={noop}
        dialogInline
      />,
    );

  it("shows the label, or the invitation, in a 44px row that opens the picker", () => {
    const html = ask("military");
    expect(html).toMatch(/data-tuned-text[^>]*>Answers tuned for: Military</);
    expect(ask(null)).toMatch(/data-tuned-text[^>]*>Set your field to tune answers</);
    const row = html.slice(
      html.indexOf("data-tuned-row") - 200,
      html.indexOf("data-tuned-row") + 900,
    );
    expect(row).toContain('href="/profile/field?from=ask-ai"');
    expect(row).toContain("h-11");
    expect(row).toContain("truncate");
    expect(row).toContain("lucide-chevron-right");
    expect(html.indexOf("data-tuned-row")).toBeLessThan(html.indexOf("Suggested questions"));
  });

  it("lists the suggested questions of the field, in the same 56px rows", () => {
    for (const field of ["rescue", "paramedic", "military", "civil"] as const) {
      const html = ask(field);
      for (const entry of suggestedFor(field)) expect(html).toContain(entry.question);
      expect(html.match(/data-suggested=/g)).toHaveLength(4);
      expect(html.match(/h-14/g)).toHaveLength(4);
    }
    expect(ask("other")).toContain("Why is every alarm treated as real?");
    expect(ask(null)).toContain("Why is every alarm treated as real?");
    expect(ask("rescue")).not.toContain("Why is every alarm treated as real?");
  });
});
