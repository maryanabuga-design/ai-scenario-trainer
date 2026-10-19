import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_CODE } from "@/lib/auth-code";
import {
  MIGRATED_EMAIL,
  beginSignIn,
  beginSignUp,
  cleanAuth,
  completeVerification,
  currentAccount,
  deleteCurrentState,
  emptyAuth,
  migrateLegacy,
  namespaceFor,
  renameState,
  setRoleState,
  signOutState,
} from "@/lib/auth";
import type { AuthState } from "@/lib/auth";

const NOW = 1_700_000_000_000;

function signedUp(
  name = "Ana Test",
  email = "Ana@Example.com",
  role: "student" | "instructor" = "student",
) {
  const started = beginSignUp(emptyAuth(), { name, email, role });
  return completeVerification(started.state, DEMO_CODE, NOW);
}

describe("loading the saved auth data", () => {
  it("reads nothing for anything that is not an object", () => {
    for (const value of [null, undefined, 3, "x", []]) expect(cleanAuth(value)).toBeNull();
  });

  it("is signed out with no accounts for an empty or old object, without throwing", () => {
    for (const value of [{}, { accounts: "x" }, { schema: 1 }, { accounts: [null, 4, {}] }]) {
      expect(cleanAuth(value)).toEqual(emptyAuth());
    }
  });

  it("keeps valid accounts with the email normalised, and ignores broken ones and duplicates", () => {
    const state = cleanAuth({
      accounts: [
        { name: "Ana", email: " ANA@Example.com ", role: "instructor", createdAt: 5 },
        { name: "Ana again", email: "ana@example.com", role: "student", createdAt: 6 },
        { name: "", email: "x@y.zz", role: "student", createdAt: 1 },
        { name: "Bob", email: "not-an-email", role: "student", createdAt: 1 },
        { name: "Cy", email: "cy@y.zz", role: "boss", createdAt: 1 },
        { name: "Di", email: "di@y.zz", role: "student", createdAt: "x" },
      ],
      session: { email: "ANA@example.com" },
    })!;
    expect(state.accounts.map((a) => [a.name, a.email, a.role])).toEqual([
      ["Ana", "ana@example.com", "instructor"],
      ["Di", "di@y.zz", "student"],
    ]);
    expect(state.accounts[1].createdAt).toBe(0);
    expect(state.session).toEqual({ email: "ana@example.com" });
  });

  it("drops a session for an unknown account and a broken pending verification", () => {
    const state = cleanAuth({
      accounts: [{ name: "Ana", email: "ana@example.com", role: "student", createdAt: 1 }],
      session: { email: "ghost@example.com" },
      pending: { mode: "sign-up", email: "nope", name: "x", role: "student" },
    })!;
    expect(state.session).toBeNull();
    expect(state.pending).toBeNull();
    expect(cleanAuth({ pending: { mode: "other", email: "a@b.co" } })!.pending).toBeNull();
    expect(
      cleanAuth({ pending: { mode: "sign-in", email: "A@B.co", name: 4, role: "x" } })!.pending,
    ).toEqual({ mode: "sign-in", email: "a@b.co", name: "", role: "student" });
  });
});

describe("migration of people who already used the app", () => {
  it("makes nothing for an empty browser (it starts at Welcome)", () => {
    expect(migrateLegacy(null, false, NOW)).toBeNull();
  });

  it("makes one signed-in demo account with the stored role, keeping the old device data", () => {
    const state = migrateLegacy(
      '{"schema":6,"content":"x","value":{"role":"instructor"}}',
      true,
      NOW,
    )!;
    expect(state.accounts).toEqual([
      { name: "Maryana", email: MIGRATED_EMAIL, role: "instructor", createdAt: NOW, legacy: true },
    ]);
    expect(state.session).toEqual({ email: MIGRATED_EMAIL });
    expect(namespaceFor(currentAccount(state))).toBe("");
  });

  it("makes a student account for a profile without a role, and for a broken role", () => {
    expect(migrateLegacy(null, true, NOW)!.accounts[0].role).toBe("student");
    expect(migrateLegacy("{not json", false, NOW)!.accounts[0].role).toBe("student");
    expect(migrateLegacy('{"value":{"role":"boss"}}', false, NOW)!.accounts[0].role).toBe(
      "student",
    );
  });
});

describe("creating an account", () => {
  it("starts a verification and makes the account only after the correct code", () => {
    const started = beginSignUp(emptyAuth(), {
      name: " Ana Test ",
      email: "Ana@Example.com",
      role: "student",
    });
    expect(started.result).toBe("ok");
    expect(started.state.pending).toEqual({
      mode: "sign-up",
      email: "ana@example.com",
      name: "Ana Test",
      role: "student",
    });
    expect(started.state.accounts).toEqual([]);
    const wrong = completeVerification(started.state, "000000", NOW);
    expect(wrong.result).toBe("wrong");
    expect(wrong.state.accounts).toEqual([]);
    expect(wrong.state.session).toBeNull();
    const right = completeVerification(started.state, DEMO_CODE, NOW);
    expect(right.result).toBe("ok");
    expect(right.state.accounts).toHaveLength(1);
    expect(right.state.session).toEqual({ email: "ana@example.com" });
    expect(right.state.pending).toBeNull();
  });

  it("stores the email normalised and the chosen role", () => {
    const done = signedUp("Ana Test", "  ANA@Example.com", "instructor");
    expect(done.result === "ok" && done.account).toMatchObject({
      name: "Ana Test",
      email: "ana@example.com",
      role: "instructor",
      createdAt: NOW,
    });
  });

  it("refuses an email that already has an account, whatever its case, with no duplicate", () => {
    const done = signedUp();
    for (const email of ["ana@example.com", " ANA@EXAMPLE.COM "]) {
      const again = beginSignUp(done.state, { name: "Other", email, role: "student" });
      expect(again.result).toBe("exists");
      expect(again.state.accounts).toHaveLength(1);
      expect(again.state.pending).toBeNull();
    }
  });

  it("has nothing to verify without a pending verification", () => {
    expect(completeVerification(emptyAuth(), DEMO_CODE, NOW).result).toBe("none");
  });

  it("gives the Home of the role after verification via the account", () => {
    const student = signedUp();
    const instructor = signedUp("Ines Test", "ines@example.com", "instructor");
    expect(student.result === "ok" && student.account.role).toBe("student");
    expect(instructor.result === "ok" && instructor.account.role).toBe("instructor");
  });
});

describe("signing in, out and the same data", () => {
  it("refuses an unknown email and accepts a known one in any case", () => {
    const done = signedUp();
    expect(beginSignIn(done.state, "nobody@example.com").result).toBe("unknown");
    const started = beginSignIn(signOutState(done.state), " ANA@example.com");
    expect(started.result).toBe("ok");
    expect(started.state.pending).toMatchObject({ mode: "sign-in", email: "ana@example.com" });
    const back = completeVerification(started.state, DEMO_CODE, NOW + 1);
    expect(back.result).toBe("ok");
    expect(back.state.accounts).toHaveLength(1);
    expect(back.state.session).toEqual({ email: "ana@example.com" });
  });

  it("signs out by clearing the session only: accounts stay", () => {
    const done = signedUp();
    const out = signOutState(done.state);
    expect(out.session).toBeNull();
    expect(out.pending).toBeNull();
    expect(out.accounts).toEqual(done.state.accounts);
    expect(currentAccount(out)).toBeNull();
  });

  it("gives each account its own data suffix, and nothing for a signed-out visit", () => {
    const done = signedUp();
    expect(namespaceFor(currentAccount(done.state))).toBe(":ana@example.com");
    expect(namespaceFor(null)).toBe(":signed-out");
  });
});

describe("editing and deleting the account", () => {
  it("renames the current account with at least 2 characters", () => {
    const done = signedUp();
    const renamed = renameState(done.state, "  Ana Maria ");
    expect(currentAccount(renamed)!.name).toBe("Ana Maria");
    expect(renameState(done.state, "A")).toBe(done.state);
    expect(renameState(emptyAuth(), "Ana")).toEqual(emptyAuth());
  });

  it("changes only the current account's role", () => {
    let state: AuthState = signedUp().state;
    const other = beginSignUp(signOutState(state), {
      name: "Ines",
      email: "ines@example.com",
      role: "student",
    });
    state = completeVerification(other.state, DEMO_CODE, NOW).state;
    const switched = setRoleState(state, "instructor");
    expect(currentAccount(switched)!.role).toBe("instructor");
    expect(switched.accounts.find((a) => a.email === "ana@example.com")!.role).toBe("student");
  });

  it("deletes the current account and signs out; a later sign-in finds no account", () => {
    const done = signedUp();
    const gone = deleteCurrentState(done.state);
    expect(gone.accounts).toEqual([]);
    expect(gone.session).toBeNull();
    expect(beginSignIn(gone, "ana@example.com").result).toBe("unknown");
    expect(deleteCurrentState(emptyAuth())).toEqual(emptyAuth());
  });
});

describe("the saved store and its data", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  function fakeBrowser(initial: Record<string, string> = {}) {
    const data = new Map(Object.entries(initial));
    vi.stubGlobal("window", {
      localStorage: {
        get length() {
          return data.size;
        },
        key: (index: number) => [...data.keys()][index] ?? null,
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    });
    return data;
  }

  it("keeps each account's data under its own keys and deletes only that account's data", async () => {
    const data = fakeBrowser();
    vi.resetModules();
    const auth = await import("@/lib/auth");
    const { createStore } = await import("@/lib/store");
    const history = createStore<string[]>("ast.history.v1", { versioned: false });

    expect(auth.startSignUp({ name: "Ana Test", email: "ana@example.com", role: "student" })).toBe(
      "ok",
    );
    expect(auth.verifyCode(DEMO_CODE)).toEqual({ ok: true, destination: "/" });
    history.write(["ana-data"]);
    expect([...data.keys()].sort()).toEqual(["ast.auth.v1", "ast.history.v1:ana@example.com"]);

    // sign out keeps the data; another account does not see it
    auth.signOut();
    expect(data.has("ast.history.v1:ana@example.com")).toBe(true);
    expect(
      auth.startSignUp({ name: "Ines Test", email: "ines@example.com", role: "instructor" }),
    ).toBe("ok");
    expect(auth.verifyCode(DEMO_CODE)).toEqual({ ok: true, destination: "/instructor" });
    expect(history.read()).toBeNull();
    history.write(["ines-data"]);

    // signing in again as Ana gives her own data back
    auth.signOut();
    expect(auth.startSignIn("ANA@example.com")).toBe("ok");
    expect(auth.verifyCode(DEMO_CODE).ok).toBe(true);
    expect(history.read()).toEqual(["ana-data"]);

    // deleting Ana removes her account and her data, not Ines's
    auth.deleteAccount();
    expect([...data.keys()].sort()).toEqual(["ast.auth.v1", "ast.history.v1:ines@example.com"]);
    expect(auth.readAuth().accounts.map((a) => a.email)).toEqual(["ines@example.com"]);
    expect(auth.readAuth().session).toBeNull();
    expect(auth.startSignIn("ana@example.com")).toBe("unknown");
  });

  it("reads broken or old saved auth data as signed out, without throwing", async () => {
    for (const raw of [
      "{not json",
      "[]",
      "null",
      '{"schema":1,"value":{"accounts":[]}}',
      '{"schema":6,"value":"x"}',
    ]) {
      fakeBrowser({ "ast.auth.v1": raw });
      vi.resetModules();
      const auth = await import("@/lib/auth");
      expect(auth.readAuth(), raw).toEqual(emptyAuth());
    }
  });

  it("the migrated account keeps the old device keys", async () => {
    const data = fakeBrowser({
      "ast.profile.v1": '{"direction":"building-evacuation","onboarded":true}',
      "ast.history.v1": '{"schema":6,"value":[]}',
    });
    vi.resetModules();
    const { namespaceFor: nsFor, migrateLegacy: migrate } = await import("@/lib/auth");
    const state = migrate(null, true, NOW)!;
    expect(nsFor(currentAccount(state))).toBe("");
    // deleting that account removes the old keys, never the auth key
    const { clearNamespaceData } = await import("@/lib/store");
    data.set("ast.auth.v1", "{}");
    clearNamespaceData("");
    expect([...data.keys()]).toEqual(["ast.auth.v1"]);
  });
});
