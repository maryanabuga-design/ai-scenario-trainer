import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditProfileView } from "@/components/EditProfileView/EditProfileView";
import { SignInView } from "@/components/SignInView/SignInView";
import { GroupCodeView } from "@/components/GroupCodeView/GroupCodeView";
import { InvitationView } from "@/components/InvitationView/InvitationView";
import { NoGroupView } from "@/components/NoGroupView/NoGroupView";
import { ProfileSetupView } from "@/components/ProfileSetupView/ProfileSetupView";
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

  it("has no header and no navigation, and the plain-page layout with its 280 by 280 picture", () => {
    expect(out).not.toContain("<header");
    expect(out).not.toContain("data-form-step");
    expect(out).toContain("data-top-row");
    expect(out).toContain("data-centre");
    expect(out).toContain("data-bottom");
    // the centre group takes the free space and centres its content, 24px between picture and text
    expect(out).toContain("flex flex-1 flex-col items-center justify-center gap-6");
    // no panel: no colour, border or rounded bottom corners
    expect(out).not.toContain("data-hero-panel");
    expect(out).not.toContain("rounded-b-");
    expect(out).not.toContain("-mx-[var(--gutter,1rem)]");
    // the picture: decorative, explicit size, contained, loaded at once, no placeholder
    const img = out.slice(out.indexOf("<img"), out.indexOf(">", out.indexOf("<img")) + 1);
    expect(img).toContain('src="/heroes/welcome.webp"');
    expect(img).toContain('alt=""');
    expect(img).toContain('aria-hidden="true"');
    expect(img).toContain('width="280"');
    expect(img).toContain('height="280"');
    expect(out).toContain("max(200px, min(280px, 35dvh))");
    expect(img).toContain('loading="eager"');
    expect(img).toContain("object-contain");
    expect(img).not.toMatch(/shadow|bg-/);
    expect(out).not.toContain('data-media3d="placeholder"');
    expect(out).not.toContain(">3D<");
  });

  it("has the eyebrow, the title and the subtitle, centred", () => {
    expect(APP_NAME).toBe("AI Scenario Trainer");
    expect(WELCOME_TITLE).toBe("Train for real situations");
    expect(WELCOME_SUBTITLE).toBe("Sign in to continue your training.");
    expect(out).toMatch(/data-eyebrow[^>]*>AI Scenario Trainer</);
    expect(out).toContain(">Train for real situations</h1>");
    expect(out).toContain(WELCOME_SUBTITLE);
    expect(out).toContain("max-w-[320px]");
    // a fixed minimum height, content from the top
    expect(out).toContain(
      "flex min-h-[184px] flex-col items-center justify-start gap-2 px-2 text-center",
    );
    expect(out).not.toContain("justify-center gap-2 px-2 py-4");
  });

  it("has Sign in, the muted invitation line and the tertiary group code link; no sign-up", () => {
    expect(out).toContain("pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]");
    expect(out).toContain('href="/sign-in"');
    expect(out).toMatch(/bg-primary[^>]*>Sign in</);
    expect(out).toContain(WELCOME_SUBTITLE);
    expect(WELCOME_SUBTITLE).toBe("Sign in to continue your training.");
    expect(out).toContain("No account yet? Ask your instructor for an invitation link.");
    // the line is plain text, not a button or a link
    expect(out).toMatch(/<p[^>]*data-no-account[^>]*>No account yet\?/);
    expect(out).toContain('href="/join"');
    expect(out).toMatch(/underline[^>]*>Have a group code\?</);
    expect(out).not.toMatch(/Create account|Sign up|sign-up|I already have an account/);
    expect(out).toContain(WELCOME_NOTE);
    expect(out.indexOf(">Sign in<")).toBeLessThan(out.indexOf("No account yet?"));
    expect(out.indexOf("No account yet?")).toBeLessThan(out.indexOf("Have a group code?"));
  });
});

describe("Group code", () => {
  const out = html(<GroupCodeView onContinue={() => "unknown"} backHref="/welcome" />);

  it("has the title, the subtitle, one labelled field, the Primary Continue and the Secondary Back", () => {
    expect(out).toContain(">Join a group</h1>");
    expect(out).toContain("Enter the code your instructor gave you.");
    expect(out).toMatch(/<label[^>]*>Group code<\/label>/);
    expect(out.match(/<input/g)).toHaveLength(1);
    expect(out).toMatch(/type="submit"[^>]*>(?:<span[^>]*>)?Continue/);
    expect(out).toMatch(/bg-olive-tint[^>]*href="\/welcome"|href="\/welcome"[^>]*bg-olive-tint/);
    expect(out).toContain(">Back<");
    expect(out.indexOf(">Continue<")).toBeLessThan(out.indexOf(">Back<"));
    expect(out).not.toContain("aria-invalid");
  });

  it("shows the message for an unknown code in a live region with the error wiring", () => {
    const bad = html(<GroupCodeView onContinue={() => "unknown"} backHref="/" initialError />);
    expect(bad).toContain("We could not find this code. Check it or ask your instructor.");
    expect(bad).toContain('aria-invalid="true"');
    expect(out.match(/aria-live="polite"/g)).toHaveLength(1);
  });
});

describe("Invitation", () => {
  const base = { groupName: "Rescue team", invitedBy: "Maryana", startHref: "/welcome" };
  const view = (state: "new" | "can-join" | "member" | "invalid") =>
    html(<InvitationView state={state} {...base} onEmail={() => "ok"} onJoin={() => undefined} />);

  it("(a) a new student: the card, the field 'Your email', the note and the Primary Continue", () => {
    const out = view("new");
    expect(out).toContain("data-invitation-card");
    expect(out).toContain("You are invited to");
    expect(out).toContain(">Rescue team</h1>");
    expect(out).toContain("Role: Student");
    expect(out).toContain("Invited by Maryana");
    expect(out).toContain("h-14 w-14 rounded-full");
    expect(out).toMatch(/<label[^>]*>Your email<\/label>/);
    expect(out).toContain("We will send you a code to confirm it.");
    expect(out).toMatch(/type="submit"[^>]*>(?:<span[^>]*>)?Continue/);
    expect(out).not.toMatch(/Join group|Not now|Open group/);
  });

  it("(b) a signed-in student who is not in the group: Primary Join group, Secondary Not now", () => {
    const out = view("can-join");
    expect(out).toMatch(/bg-primary[^>]*>(?:<span[^>]*>)?Join group/);
    expect(out).toMatch(/bg-olive-tint[^>]*>(?:<span[^>]*>)?Not now/);
    expect(out.indexOf("Join group")).toBeLessThan(out.indexOf("Not now"));
    expect(out).not.toContain("Your email");
  });

  it("(c) already in the group: 'You are already in Rescue team' and the Primary Open group", () => {
    const out = view("member");
    expect(out).toContain("You are already in Rescue team");
    expect(out).toMatch(/bg-primary[^>]*>(?:<span[^>]*>)?Open group/);
    expect(out).not.toMatch(/Join group|Not now/);
  });

  it("(d) a link that is not valid: the title, the subtitle and the Secondary Back to start", () => {
    const out = view("invalid");
    expect(out).toContain(">This link is no longer valid</h1>");
    expect(out).toContain("Ask your instructor for a new one.");
    expect(out).toMatch(/bg-olive-tint[^>]*>(?:<span[^>]*>)?Back to start/);
    expect(out).not.toContain("data-invitation-card");
    expect(out).not.toMatch(/bg-primary/);
  });

  it("shows the email error with the live wiring", () => {
    const out = html(<InvitationView state="new" {...base} initialEmail="ana@" initialTouched />);
    expect(out).toContain("Check this email address.");
    expect(out).toContain('aria-invalid="true"');
  });
});

describe("Profile of a new student", () => {
  const out = html(<ProfileSetupView onSubmit={() => undefined} />);

  it("has the title, the new subtitle, ONE field 'Your name' and the Primary Continue; no language choice", () => {
    expect(out).toContain(">Your profile</h1>");
    expect(out).toContain("Add your name so your instructor can recognise you.");
    expect(out).not.toContain("Two things and you are in.");
    expect(out).toMatch(/<label[^>]*>Your name<\/label>/);
    expect(out.match(/<input/g)).toHaveLength(1);
    expect(out).not.toMatch(/Language|Ukrainian|English|type="radio"|<fieldset/);
    expect(out).toMatch(/type="submit"[^>]*>(?:<span[^>]*>)?Continue/);
  });

  it("shows its picture above the title: decorative (empty alt), 112px, 88px on short screens, 16px below", () => {
    const img = out.slice(out.indexOf("<img"), out.indexOf(">", out.indexOf("<img")));
    expect(img).toContain('src="/images/entry/entry-profile.webp"');
    expect(img).toContain('alt=""');
    expect(img).toContain("h-[112px] w-[112px]");
    expect(img).toContain("[@media(max-height:699px)]:h-[88px]");
    expect(img).toContain("mb-2");
    expect(out.indexOf("<img")).toBeLessThan(out.indexOf("<h1"));
  });
});

describe("Student with no group", () => {
  const out = html(<NoGroupView name="Maryana" onJoin={() => "unknown"} />);

  it("shows the empty state: icon tile, the words, the code field and the Primary Join group; nothing else", () => {
    expect(out).toContain("data-no-group");
    expect(out).toContain("h-14 w-14 rounded-full");
    expect(out).toContain("You are not in a group yet");
    expect(out).toContain("Ask your instructor for a group link or code.");
    expect(out).toMatch(/<label[^>]*>Group code<\/label>/);
    expect(out).toMatch(/type="submit"[^>]*>(?:<span[^>]*>)?Join group/);
    expect(out).toContain("Hi, Maryana");
    expect(out).not.toMatch(/Training|Exam|Mini-quiz/);
  });
});

describe("Sign in", () => {
  const out = html(<SignInView onSubmit={() => "ok"} />);

  it("has Back, the title, the email field and a pinned Continue", () => {
    expect(out).toContain(">Welcome back</h1>");
    expect(out).toContain(">Step 1 of 2<");
    expect(out).toContain("Enter your work email. We will send you a code.");
    expect(out).not.toContain("sign-up");
    expect(out).toContain('href="/join"');
    expect(out).toContain(">Have a group code?<");
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
  const account = {
    name: "Maryana",
    email: "maryana@example.com",
    role: "student" as const,
  };
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

describe("Sign in: the rules and the messages", () => {
  const problem = (state: "unknown" | "inactive") =>
    html(<SignInView onSubmit={() => "ok"} initialEmail="x@example.org" initialProblem={state} />);

  it("has 'Have a group code?' ONCE, under the Continue button, and no create or demo hint", () => {
    const out = html(<SignInView onSubmit={() => "ok"} />);
    expect(out.match(/Have a group code\?/g)).toHaveLength(1);
    expect(out.indexOf(">Continue<")).toBeLessThan(out.indexOf("Have a group code?"));
    expect(out).not.toMatch(/example\.org|lena|kofi|pavel|482913/i);
    // an unknown email adds no second link
    expect(problem("unknown").match(/Have a group code\?/g)).toHaveLength(1);
  });

  it("shows the unknown, deactivated and invalid messages in the field's live message", () => {
    expect(problem("unknown")).toContain(
      "We could not find an account for this email. Ask your instructor for an invitation link.",
    );
    expect(problem("inactive")).toContain(
      "This account is not active. Contact your administrator.",
    );
    const invalid = html(<SignInView onSubmit={() => "ok"} initialEmail="ana@" initialTouched />);
    expect(invalid).toContain("Check this email address.");
    for (const out of [problem("unknown"), problem("inactive"), invalid]) {
      expect(out).toContain('aria-invalid="true"');
      expect(out).toContain('aria-live="polite"');
      expect(out).toContain("lucide-circle-alert");
    }
  });
});

describe("the code screen", () => {
  const verify = (extra: { initialLockRemaining?: number | null } = {}) =>
    html(
      <VerifyView
        email="ana@example.org"
        now={() => 0}
        onVerify={() => false}
        onChangeEmail={() => undefined}
        {...extra}
      />,
    );

  it("has the muted line 'The code proves this email is yours.' under the boxes, and keeps the demo code and the resend words", () => {
    const out = verify();
    expect(out).toContain("The code proves this email is yours.");
    expect(out.indexOf("Digit 6 of 6")).toBeLessThan(out.indexOf("The code proves this email"));
    expect(out).toMatch(/data-code-proof[^>]*text-text-secondary/);
    expect(out).toContain("482 913");
    expect(out).toContain("Resend code (0:30)");
    expect(out).not.toContain('disabled="" aria-label="Digit');
  });

  it("locks: the boxes are disabled, the message, a visible countdown and a polite line for screen readers", () => {
    const out = verify({ initialLockRemaining: 45 });
    expect(out.match(/<input[^>]*disabled=""/g)).toHaveLength(6);
    expect(out).toContain("Too many attempts. Try again in a minute.");
    expect(out).toMatch(/data-lock-countdown="true" aria-hidden="true"[^>]*>0:45</);
    expect(out).toMatch(
      /data-lock-live="true" aria-live="polite" class="sr-only">Try again in 50 seconds</,
    );
    expect(out).toMatch(/<button[^>]*disabled=""[^>]*>(?:<span[^>]*>)?Verify/);
    expect(verify()).not.toContain("data-lock-countdown");
  });
});

describe("the entry pictures", () => {
  it("shows the envelope picture on Welcome back, under the back row and above the title, decorative", () => {
    const out = html(<SignInView onSubmit={() => "ok"} />);
    const img = out.slice(out.indexOf("<img"), out.indexOf(">", out.indexOf("<img")));
    expect(img).toContain('src="/images/entry/entry-signin.webp"');
    expect(img).toContain('alt=""');
    expect(img).toContain("h-[112px] w-[112px]");
    expect(out.indexOf("data-form-step")).toBeLessThan(out.indexOf("<img"));
    expect(out.indexOf("<img")).toBeLessThan(out.indexOf(">Welcome back</h1>"));
  });

  it("has both files: square, transparent webp pictures", async () => {
    const { default: sharp } = await import("sharp");
    for (const file of ["entry-profile", "entry-signin"]) {
      const meta = await sharp(`public/images/entry/${file}.webp`).metadata();
      expect(meta.format, file).toBe("webp");
      expect(meta.width, file).toBe(meta.height);
      expect(meta.hasAlpha, file).toBe(true);
    }
  });
});
