import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditProfileView } from "@/components/EditProfileView/EditProfileView";
import { SignInView } from "@/components/SignInView/SignInView";
import { SignUpView } from "@/components/SignUpView/SignUpView";
import { VerifyView } from "@/components/VerifyView/VerifyView";
import { APP_NAME, APP_PURPOSE, WelcomeView } from "@/components/WelcomeView/WelcomeView";

const html = (node: React.ReactElement) => renderToStaticMarkup(node).replace(/<!-- -->/g, "");

describe("Welcome", () => {
  const out = html(<WelcomeView />);

  it("has the app name, the one-line purpose, Create account and the text button", () => {
    expect(APP_NAME).toBe("AI Scenario Trainer");
    expect(out).toContain(`>${APP_NAME}</h1>`);
    expect(out).toContain(APP_PURPOSE);
    expect(out).toContain('href="/sign-up"');
    expect(out).toContain(">Create account<");
    expect(out).toContain('href="/sign-in"');
    expect(out).toContain(">I already have an account<");
  });

  it("pins the buttons to the bottom with the gutter plus the safe area below them", () => {
    expect(out).toContain("mt-auto");
    expect(out).toContain("pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]");
  });
});

describe("Create account", () => {
  const out = html(<SignUpView onSubmit={() => "ok"} />);

  it("has Back, the title, visible labels above the fields and the right input hints", () => {
    expect(out).toContain('aria-label="Back to Welcome"');
    expect(out).toContain(">Create account</h1>");
    expect(out).toMatch(/<label[^>]*>Full name<\/label>/);
    expect(out).toMatch(/<label[^>]*>Work email<\/label>/);
    expect(out).toContain('autoComplete="name"');
    expect(out).toContain('autoComplete="email"');
    expect(out).toContain('inputMode="email"');
    expect(out).toContain('type="email"');
    expect(out).toContain("min-h-12");
  });

  it("has the two role cards with their helpers, Student preselected", () => {
    expect(out).toContain(">I am a</legend>");
    expect(out).toContain("Learn, practise and take exams assigned to you");
    expect(out).toContain("Create exams and assign them to students");
    const checked = [...out.matchAll(/<input[^>]*checked=""[^>]*>/g)].map((m) => m[0]);
    expect(checked).toHaveLength(1);
    expect(checked[0]).toContain('value="student"');
  });

  it("has the demo note and a pinned Continue that submits the form", () => {
    expect(out).toContain(
      "Demo: data stays on this device. Please do not enter real personal data.",
    );
    expect(out).toContain('<form noValidate=""');
    expect(out).toMatch(/type="submit"[^>]*>(?:<span[^>]*>)?Continue/);
    expect(out).toContain("mt-auto");
    expect(out.indexOf("data stays on this device")).toBeLessThan(out.indexOf(">Continue<"));
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
    expect(out).toContain(">Sign in</h1>");
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

  it("has the title, the line with the email and six one-digit boxes with the right hints", () => {
    expect(out).toContain(">Check your email</h1>");
    expect(text).toContain("We sent a 6-digit code to ana@example.com");
    expect(out.match(/autoComplete="one-time-code"/g)).toHaveLength(6);
    expect(out.match(/inputMode="numeric"/g)).toHaveLength(6);
    for (let n = 1; n <= 6; n++) expect(out).toContain(`aria-label="Digit ${n} of 6"`);
    expect(out).toContain('role="group" aria-label="6-digit code"');
  });

  it("ALWAYS shows the demo code card", () => {
    expect(out).toContain("data-demo-code");
    expect(text).toContain("Demo: no email is sent. Your code is 482 913.");
  });

  it("has a Resend code that waits 30 seconds with a visible countdown, and Change email", () => {
    expect(out).toContain("Resend code in 30 s");
    expect(out).toMatch(/<button[^>]*disabled=""[^>]*>[\s\S]*?Resend code in 30 s/);
    expect(out).toContain(">Change email<");
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
      />,
    );
    expect(wrong).toContain("That code is not correct. Check the code shown above.");
    expect(wrong).toContain("lucide-circle-alert");
    expect(wrong.match(/aria-invalid="true"/g)).toHaveLength(6);
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
