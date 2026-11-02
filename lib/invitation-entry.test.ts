import { describe, expect, it } from "vitest";
import {
  beginSignUp,
  cleanAuth,
  completeProfileState,
  completeVerification,
  emptyAuth,
  groupOf,
  homeAfterVerification,
  joinGroupState,
  leaveGroupState,
} from "@/lib/auth";
import type { Account, AuthState } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import { lookupCode, normaliseCode } from "@/lib/join";

const CODE = "482913";

/** A student who came in through an invitation and verified the code. */
function invited(groupId = "rescue-team"): AuthState {
  const started = beginSignUp(emptyAuth(), { name: "", email: "ana@example.com", role: "student" });
  const done = completeVerification(started.state, CODE, 1, groupId);
  if (done.result !== "ok") throw new Error("verification failed");
  return done.state;
}
const current = (state: AuthState): Account => state.accounts[0];

describe("the codes of the invitation-only entry", () => {
  it("knows the valid codes (any case, spaces ignored), the expired demo code and unknown ones", () => {
    expect(normaliseCode(" qt-a7 k2 ")).toBe("QT-A7K2");
    const valid = lookupCode("qt-a7k2");
    expect(valid.kind).toBe("valid");
    if (valid.kind === "valid") {
      expect(valid.group.name).toBe("Rescue team");
      expect(valid.invitedBy).toBe("Maryana");
    }
    expect(lookupCode("QT-M4R9").kind).toBe("valid");
    expect(lookupCode("OLD-0000").kind).toBe("expired");
    expect(lookupCode("old-0000").kind).toBe("expired");
    expect(lookupCode("QT-0000").kind).toBe("unknown");
    expect(lookupCode("").kind).toBe("unknown");
  });
});

describe("a student who comes in through an invitation", () => {
  it("gets the group, owes the Profile step and skips the Field of work step and the introduction", () => {
    const account = current(invited());
    expect(account.role).toBe("student");
    expect(account.groupId).toBe("rescue-team");
    expect(account.profileDone).toBe(false);
    expect(account.onboardingDone).toBe(true);
    expect(account.fieldStepDone).toBe(true);
    // a provisional name until the Profile step
    expect(account.name).toBe("ana");
    expect(homeAfterVerification(account)).toBe("/set-up-profile");
  });

  it("is finished by the Profile step: the name, the language, no more owed step", () => {
    const done = completeProfileState(invited(), { name: " Ana Test ", language: "uk" });
    const account = current(done);
    expect(account.name).toBe("Ana Test");
    expect(account.language).toBe("uk");
    expect(account.profileDone).toBeUndefined();
    expect(account.groupId).toBe("rescue-team");
    expect(homeAfterVerification(account)).toBe("/");
    // a name that is too short changes nothing
    expect(
      current(completeProfileState(invited(), { name: "A", language: "en" })).profileDone,
    ).toBe(false);
  });

  it("without a group the old sign-up behaviour is unchanged (the onboarding is still owed)", () => {
    const started = beginSignUp(emptyAuth(), {
      name: "Ines",
      email: "ines@example.com",
      role: "instructor",
    });
    const done = completeVerification(started.state, CODE, 1);
    if (done.result !== "ok") throw new Error("verification failed");
    expect(done.account.onboardingDone).toBe(false);
    expect(done.account.profileDone).toBeUndefined();
  });
});

describe("joining and leaving a group", () => {
  const joined = completeProfileState(invited(), { name: "Ana Test", language: "en" });

  it("reads the group of a student: the saved one, Rescue team when none was saved, none after leaving", () => {
    expect(groupOf(current(joined))).toBe("rescue-team");
    expect(groupOf({ ...current(joined), groupId: undefined })).toBe("rescue-team");
    expect(groupOf(current(leaveGroupState(joined)))).toBeNull();
    expect(groupOf({ ...current(joined), role: "instructor" })).toBeNull();
  });

  it("joining (after the person confirmed) sets the group and replaces an earlier one", () => {
    const left = leaveGroupState(joined);
    expect(current(left).noGroup).toBe(true);
    expect(current(left).groupId).toBeUndefined();
    const again = joinGroupState(left, "military-training");
    expect(current(again).groupId).toBe("military-training");
    expect(current(again).noGroup).toBeUndefined();
    expect(groupOf(current(again))).toBe("military-training");
  });

  it("puts a student who left the group in no roster", () => {
    const left = current(leaveGroupState(joined));
    expect(participants([left]).some((p) => p.local)).toBe(false);
    expect(participants([current(joined)]).find((p) => p.local)?.groupId).toBe("rescue-team");
  });

  it("is kept by the saved state and ignores bad values", () => {
    const saved = cleanAuth(JSON.parse(JSON.stringify(leaveGroupState(joined))));
    expect(saved?.accounts[0].noGroup).toBe(true);
    const messy = cleanAuth({
      accounts: [{ ...current(joined), language: "fr", profileDone: "no", noGroup: "yes" }],
      session: null,
      pending: null,
    });
    expect(messy?.accounts[0].language).toBeUndefined();
    expect(messy?.accounts[0].profileDone).toBeUndefined();
    expect(messy?.accounts[0].noGroup).toBeUndefined();
  });
});
