import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditProfileView } from "@/components/EditProfileView/EditProfileView";
import { SignInView } from "@/components/SignInView/SignInView";
import { SignUpView } from "@/components/SignUpView/SignUpView";
import { VerifyView } from "@/components/VerifyView/VerifyView";
import {
  APP_NAME,
  WELCOME_NOTE,
  WELCOME_SUBTITLE,
  WELCOME_TITLE,
  WelcomeView,
} from "@/components/WelcomeView/WelcomeView";

const html = (node: React.ReactElement) => renderToStaticMarkup(node).replace(/<!-- -->/g, "");

describe("Welcome", () => {
  const out = html(<WelcomeView />);

  it("has no header and no navigation, and the hero panel with its 280 by 280 picture", () => {
    expect(out).not.toContain("<header");
    expect(out).not.toContain("data-form-step");
    expect(out).toContain("data-hero-panel");
    // the panel takes all the free height; its minimum is the slot plus 64px
    expect(out).toContain("min-h-[calc(max(200px,min(280px,36dvh))+64px)] flex-1 basis-auto");
    expect(out).toContain("flex flex-1 flex-col");
    expect(out).not.toContain("clamp(280px,46dvh,380px)");
    expect(out).toContain("rounded-b-[32px] border-b border-selectable-stroke bg-secondary-sand");
    expect(out).toContain("-mx-[var(--gutter,1rem)]");
    expect(out).toContain("env(safe-area-inset-top)");
    // the picture: decorative, explicit size, contained, loaded at once, no placeholder
    const img = out.slice(out.indexOf("<img"), out.indexOf(">", out.indexOf("<img")) + 1);
    expect(img).toContain('src="/heroes/welcome.webp"');
    expect(img).toContain('alt=""');
    expect(img).toContain('aria-hidden="true"');
    expect(img).toContain('width="280"');
    expect(img).toContain('height="280"');
    expect(out).toContain("max(200px, min(280px, 36dvh))");
    expect(img).toContain('loading="eager"');
    expect(img).toContain("object-contain");
    expect(img).not.toMatch(/shadow|bg-/);
    expect(out).not.toContain('data-media3d="placeholder"');
    expect(out).not.toContain(">3D<");
  });

  it("has the eyebrow, the title and the subtitle, centred", () => {
    expect(APP_NAME).toBe("AI Scenario Trainer");
    expect(WELCOME_TITLE).toBe("Train for real situations");
    expect(WELCOME_SUBTITLE).toBe(
      "Short scenarios, quizzes and exams for building evacuation and first aid.",
    );
    expect(out).toMatch(/data-eyebrow[^>]*>AI Scenario Trainer</);
    expect(out).toContain(">Train for real situations</h1>");
    expect(out).toContain(WELCOME_SUBTITLE);
    expect(out).toContain("max-w-[320px]");
    // 32px below the panel, a fixed minimum height, content from the top (no vertical centring)
    expect(out).toContain(
      "mt-8 flex min-h-[184px] flex-col items-center justify-start gap-2 px-2 text-center",
    );
    expect(out).not.toContain("justify-center gap-2 px-2 py-4");
  });

  it("has the pinned buttons: Primary, the olive-tint Secondary 12px below, and the note", () => {
    expect(out).toContain("pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]");
    expect(out).toContain('href="/sign-up"');
    expect(out).toContain(">Create account<");
    expect(out).toContain('href="/sign-in"');
    expect(out).toContain(">I already have an account<");
    expect(out).toContain("bg-olive-tint");
    expect(out).toContain("gap-3");
    expect(out).toContain(WELCOME_NOTE);
    expect(out.indexOf("Create account")).toBeLessThan(out.indexOf("I already have an account"));
    expect(out.indexOf("I already have an account")).toBeLessThan(out.indexOf(WELCOME_NOTE));
  });
});

describe("Create account", () => {
  const out = html(<SignUpView onSubmit={() => "ok"} />);

  it("has Back, the title, visible labels above the fields and the right input hints", () => {
    expect(out).toContain('aria-label="Back to Welcome"');
    expect(out).toContain(">Step 1 of 2<");
    expect(out).toContain(">Create your account</h1>");
    expect(out).toContain("It takes less than a minute.");
    expect(out).not.toContain("data-hero-panel");
    expect(out).toMatch(/<label[^>]*>Full name<\/label>/);
    expect(out).toMatch(/<label[^>]*>Work email<\/label>/);
    expect(out).toContain('autoComplete="name"');
    expect(out).toContain('autoComplete="email"');
    expect(out).toContain('inputMode="email"');
    expect(out).toContain('type="email"');
    expect(out).toContain("h-[52px]");
    expect(out).toMatch(/<label[^>]*type-small-strong[^>]*>Full name/);
    expect(out).not.toContain("autofocus");
    expect(out).not.toContain("autoFocus");
  });

  it("has the two role cards with their helpers, Student preselected", () => {
    expect(out).toContain(">I am a</legend>");
    expect(out).toContain(">Practise and take exams<");
    expect(out).toContain(">Create and assign exams<");
    expect(out).not.toContain("assigned to you");
    // each helper is one line, cut with an ellipsis as a safety net; the cards are exactly 72px high
    expect(out.match(/type-small truncate text-text-secondary/g)).toHaveLength(2);
    const checked = [...out.matchAll(/<input[^>]*checked=""[^>]*>/g)].map((m) => m[0]);
    expect(checked).toHaveLength(1);
    expect(checked[0]).toContain('value="student"');
    // 72px cards, each with a 40px neutral icon tile
    expect(out.match(/h-\[72px\]/g)).toHaveLength(2);
    expect(out.match(/h-10 w-10 rounded-full/g)).toHaveLength(2);
    expect(out.match(/bg-neutral-tile-bg text-neutral-tile-ink/g)).toHaveLength(2);
  });

  it("has the demo note and a pinned Continue that submits the form", () => {
    expect(out).toContain(
      "Demo: data stays on this device. Please do not enter real personal data.",
    );
    expect(out).toContain('<form noValidate=""');
    expect(out).toMatch(/type="submit"[^>]*>(?:<span[^>]*>)?Continue/);
    expect(out).toContain("mt-auto");
    expect(out.indexOf("data stays on this device")).toBeLessThan(out.indexOf(">Continue<"));
    expect(out).toContain('href="/sign-in"');
    expect(out).toContain(">Already have an account? Sign in<");
    expect(out.indexOf(">Continue<")).toBeLessThan(out.indexOf("Already have an account?"));
  });

  it("shows no error until a field was left or the form was sent", () => {
    expect(out).not.toContain("aria-invalid");
    expect(out).not.toContain("Enter your full name");
  });

  it("shows the errors with an icon and aria wiring when they are showing", () => {
    const withErrors = html(<SignUpView onSubmit={() => "ok"} initialTouched />);
    expect(withErrors).toContain("Enter your full name.");
    expect(withErrors).toContain("Enter your work email.");
    expect(withErrors.match(/aria-invalid="true"/g)).toHaveLength(2);
    expect(withErrors.match(/aria-describedby="/g)?.length).toBeGreaterThanOrEqual(2);
    expect(withErrors).toContain("lucide-circle-alert");
    // the message areas are live regions even when empty
    expect(out.match(/aria-live="polite"/g)).toHaveLength(2);
  });
});

describe("Sign in", () => {
  const out = html(<SignInView onSubmit={() => "ok"} />);

  it("has Back, the title, the email field and a pinned Continue", () => {
    expect(out).toContain(">Welcome back</h1>");
    expect(out).toContain(">Step 1 of 2<");
    expect(out).toContain("Enter your work email. We will send you a code.");
    expect(out).toContain('href="/sign-up"');
    expect(out).toContain(">New here? Create an account<");
    expect(out).toMatch(/<label[^>]*>Work email<\/label>/);
    expect(out).toContain('autoComplete="email"');
    expect(out).toContain("mt-auto");
    expect(out).toMatch(/type="submit"/);
    expect(out).not.toContain("Full name");
  });
});

describe("Verify", () => {
  const out = html(
    <VerifyView
      email="ana@example.com"
      now={() => 0}
      onVerify={() => false}
      onChangeEmail={() => undefined}
    />,
  );
  const text = out.replace(/<[^>]+>/g, "");

  it("has the Step 2 of 2 header, the 80 by 80 slot and the title", () => {
    expect(out).toContain(">Step 2 of 2<");
    expect(out).toContain('aria-label="Back"');
    const img = out.slice(out.indexOf("<img"), out.indexOf(">", out.indexOf("<img")) + 1);
    expect(img).toContain('src="/heroes/verify.webp"');
    expect(img).toContain('width="120"');
    expect(img).toContain('height="120"');
    expect(img).toContain('alt=""');
    expect(img).toContain('aria-hidden="true"');
    expect(img).toContain('loading="eager"');
    expect(out).not.toContain("data-hero-panel");
    expect(out.indexOf("<img")).toBeLessThan(out.indexOf(">Check your email</h1>"));
    // everything under the header is centred
    expect(out).toContain("flex flex-col items-center gap-3 text-center");
    expect(out).toContain("flex flex-wrap items-center justify-center gap-x-1");
  });

  it("has the subtitle with the email in semibold and the text button Change email", () => {
    expect(text).toContain("We sent a 6-digit code to ana@example.com.");
    expect(out).toMatch(/type-body-strong text-text">ana@example\.com</);
    expect(out).toContain(">Change email<");
  });

  it("has six one-digit boxes in one row, 8px apart, flexible up to 52px, 56px high, 12px radius", () => {
    expect(out.match(/autoComplete="one-time-code"/g)).toHaveLength(6);
    expect(out.match(/inputMode="numeric"/g)).toHaveLength(6);
    for (let n = 1; n <= 6; n++) expect(out).toContain(`aria-label="Digit ${n} of 6"`);
    expect(out).toContain('role="group" aria-label="6-digit code" class="flex gap-2"');
    expect(out.match(/h-14 min-w-0 flex-1 basis-0 rounded-\[12px\]/g)).toHaveLength(6);
    expect(out).not.toContain("max-w-[52px]");
    expect(out).toContain("border-selectable-stroke");
    expect(out).toContain("focus-visible:outline-primary");
  });

  it("ALWAYS shows the demo card: the label, the code at 24px and Fill in code (44px)", () => {
    expect(out).toContain("data-demo-code");
    expect(text).toContain("Demo: no email is sent");
    expect(out).toMatch(/data-demo-code-value[^>]*class="type-code"[^>]*>482 913</);
    expect(out).toContain("rounded-2xl bg-secondary-sand p-4");
    expect(out).toContain(">Fill in code<");
    expect(out).toContain("h-11!");
    // the code is below the boxes
    expect(out.indexOf("6-digit code")).toBeLessThan(out.indexOf("data-demo-code"));
  });

  it("has Did not get a code? with a Resend code countdown, disabled for 30 seconds", () => {
    expect(text).toContain("Did not get a code?");
    expect(text).toContain("Resend code (0:30)");
    expect(out).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Resend code \(0:30\)/);
  });

  it("has the pinned Primary Verify, disabled until six digits are in", () => {
    expect(out).toMatch(/<button[^>]*disabled=""[^>]*>Verify<\/button>/);
    expect(out).toContain("mt-auto");
    const filled = html(
      <VerifyView
        email="ana@example.com"
        now={() => 0}
        onVerify={() => false}
        onChangeEmail={() => undefined}
        initialDigits="482913"
      />,
    );
    expect(filled).not.toMatch(/<button[^>]*disabled=""[^>]*>Verify<\/button>/);
    expect(filled.match(/border-primary/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it("has an alert area for the wrong code, filled only when the code was wrong", () => {
    expect(out).toContain('role="alert"');
    expect(out).not.toContain("That code is not correct");
    const wrong = html(
      <VerifyView
        email="ana@example.com"
        now={() => 0}
        onVerify={() => false}
        onChangeEmail={() => undefined}
        initialWrong
        initialDigits="000000"
      />,
    );
    expect(wrong).toContain("That code is not correct. Check the code shown below.");
    expect(wrong).toContain("lucide-circle-alert");
    expect(wrong.match(/aria-invalid="true"/g)).toHaveLength(6);
    expect(wrong.match(/border-wrong/g)?.length).toBeGreaterThanOrEqual(6);
  });
});

describe("Edit profile", () => {
  const account = { name: "Maryana", email: "maryana@example.com", role: "student" as const };
  const out = html(<EditProfileView account={account} onSave={() => undefined} />);

  it("has Back to Profile, the title and the avatar with the initial, no photo", () => {
    expect(out).toContain('aria-label="Back to Profile"');
    expect(out).toContain(">Edit profile</h1>");
    expect(out).toContain(">M</span>");
    expect(out).not.toContain("<img");
    expect(out).not.toContain('type="file"');
  });

  it("has the editable name, the read-only email and role with their helpers", () => {
    expect(out).toMatch(/<label[^>]*>Full name<\/label>/);
    expect(out).toContain('value="Maryana"');
    expect(out).toContain('value="maryana@example.com"');
    expect(out).toContain('readOnly=""');
    expect(out).toContain("Email changes need verification and are not available in this demo.");
    expect(out).toContain(">Student</p>");
    expect(out).toContain(
      "Your role is set by your organisation. Use Demo mode in Profile to switch.",
    );
  });

  it("has Save changes pinned to the bottom and disabled until the name changed", () => {
    expect(out).toContain("mt-auto");
    expect(out).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Save changes/);
    expect(out).toContain('role="status"');
    expect(out).not.toContain(">Saved<");
  });

  it("announces Saved when it was saved", () => {
    const saved = html(<EditProfileView account={account} onSave={() => undefined} saved />);
    expect(saved).toContain(">Saved</p>");
  });
});
