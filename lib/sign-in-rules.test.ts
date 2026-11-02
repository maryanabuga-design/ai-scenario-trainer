import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  beginSignIn,
  completeVerification,
  currentAccount,
  emptyAuth,
  groupOf,
  homeAfterVerification,
} from "@/lib/auth";
import {
  LIVE_SECONDS,
  LOCK_SECONDS,
  MAX_WRONG_CODES,
  announcedSeconds,
  lockRemaining,
} from "@/lib/auth-code";
import {
  INACTIVE_MESSAGE,
  TOO_MANY_MESSAGE,
  UNKNOWN_MESSAGE,
  validateEmail,
} from "@/lib/auth-validation";
import { demoAccounts, lookupDemoAccount } from "@/lib/demo-accounts";

const CODE = "482913";

describe("the simulated sign-in cases", () => {
  it("lists exactly the three demo emails, marked as simulated", () => {
    expect(demoAccounts.map((a) => a.email)).toEqual([
      "lena@example.org",
      "kofi@example.org",
      "pavel@example.org",
    ]);
    expect(readFileSync("content/demo-accounts.json", "utf8")).toContain("SIMULATED");
  });

  it("lena: an active student in Rescue team; a code is sent and 482913 signs her in at the student home", () => {
    const started = beginSignIn(emptyAuth(), "lena@example.org");
    expect(started.result).toBe("ok");
    expect(started.state.pending?.mode).toBe("sign-in");
    const done = completeVerification(started.state, CODE, 1);
    if (done.result !== "ok") throw new Error("not signed in");
    const account = currentAccount(done.state)!;
    expect(account.role).toBe("student");
    expect(groupOf(account)).toBe("rescue-team");
    expect(homeAfterVerification(account)).toBe("/");
  });

  it("kofi: an active student with no group; the code works and the home is the empty state", () => {
    const started = beginSignIn(emptyAuth(), "kofi@example.org");
    expect(started.result).toBe("ok");
    const done = completeVerification(started.state, CODE, 1);
    if (done.result !== "ok") throw new Error("not signed in");
    const account = currentAccount(done.state)!;
    expect(groupOf(account)).toBeNull();
    expect(account.noGroup).toBe(true);
    expect(homeAfterVerification(account)).toBe("/");
  });

  it("pavel: deactivated: no code is sent, nothing is pending and no account is made", () => {
    const started = beginSignIn(emptyAuth(), "pavel@example.org");
    expect(started.result).toBe("inactive");
    expect(started.state.pending).toBeNull();
    expect(started.state.accounts).toEqual([]);
  });

  it("any other email is unknown: no code, nothing pending", () => {
    const started = beginSignIn(emptyAuth(), "nobody@example.org");
    expect(started.result).toBe("unknown");
    expect(started.state.pending).toBeNull();
  });

  it("ignores case and surrounding spaces", () => {
    for (const email of ["  LENA@Example.org ", "Lena@EXAMPLE.ORG"]) {
      const started = beginSignIn(emptyAuth(), email);
      expect(started.result, email).toBe("ok");
      expect(started.state.pending?.email).toBe("lena@example.org");
    }
    expect(beginSignIn(emptyAuth(), " PAVEL@example.org").result).toBe("inactive");
    expect(lookupDemoAccount("KOFI@example.org ")?.status).toBe("active");
  });

  it("does not make the account twice: a second sign-in uses the one that exists", () => {
    const first = beginSignIn(emptyAuth(), "lena@example.org");
    const again = beginSignIn(first.state, "lena@example.org");
    expect(again.state.accounts).toHaveLength(1);
  });

  it("says a badly formed address needs checking", () => {
    expect(validateEmail("nope")).toBe("Check this email address.");
    expect(validateEmail("lena@")).toBe("Check this email address.");
  });
});

describe("the messages of the entry screens", () => {
  it("words the unknown and deactivated cases as asked", () => {
    expect(UNKNOWN_MESSAGE).toBe(
      "We could not find an account for this email. Ask your instructor for an invitation link.",
    );
    expect(INACTIVE_MESSAGE).toBe("This account is not active. Contact your administrator.");
    expect(TOO_MANY_MESSAGE).toBe("Too many attempts. Try again in a minute.");
  });

  it("never mention a device, a browser or storage in what the entry screens say", () => {
    const files = [
      "components/WelcomeView/WelcomeView.tsx",
      "components/SignInView/SignInView.tsx",
      "components/VerifyView/VerifyView.tsx",
      "components/GroupCodeView/GroupCodeView.tsx",
      "components/InvitationView/InvitationView.tsx",
      "components/ProfileSetupView/ProfileSetupView.tsx",
      "components/NoGroupView/NoGroupView.tsx",
      "lib/auth-validation.ts",
    ];
    for (const file of files) {
      // only the words a person reads: string literals and JSX text, not comments
      const code = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(code, file).not.toMatch(/\b(device|browser|storage)\b/i);
    }
  });
});

describe("the lock after wrong codes", () => {
  it("locks after 5 wrong codes for 60 seconds", () => {
    expect(MAX_WRONG_CODES).toBe(5);
    expect(LOCK_SECONDS).toBe(60);
  });

  it("counts the seconds left from the moment of the lock and is over after a minute", () => {
    expect(lockRemaining(null, 5_000)).toBe(0);
    expect(lockRemaining(1_000, 1_000)).toBe(60);
    expect(lockRemaining(1_000, 16_000)).toBe(45);
    expect(lockRemaining(1_000, 60_999)).toBe(1);
    expect(lockRemaining(1_000, 61_000)).toBe(0);
    expect(lockRemaining(1_000, 90_000)).toBe(0);
  });

  it("tells a screen reader the time rounded up to the next 10 seconds, so it changes at most every 10 seconds", () => {
    const heard = new Set<number>();
    const changes: number[] = [];
    let last = -1;
    for (let second = 0; second <= 60; second++) {
      const value = announcedSeconds(lockRemaining(0, second * 1000));
      heard.add(value);
      if (value !== last) changes.push(second);
      last = value;
    }
    expect([...heard].sort((a, b) => b - a)).toEqual([60, 50, 40, 30, 20, 10, 0]);
    for (let i = 1; i < changes.length; i++) {
      expect(changes[i] - changes[i - 1]).toBeGreaterThanOrEqual(LIVE_SECONDS);
    }
  });
});
