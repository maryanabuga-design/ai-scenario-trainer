import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_CODE } from "@/lib/auth-code";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

function fakeBrowser() {
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  const area = (data: Map<string, string>) => ({
    get length() {
      return data.size;
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  });
  vi.stubGlobal("window", {
    localStorage: area(local),
    sessionStorage: area(session),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });
  return { local, session };
}

describe("Restart demo", () => {
  it("removes every key the app writes, for every account, and nothing else", async () => {
    const { local, session } = fakeBrowser();
    vi.resetModules();
    const auth = await import("@/lib/auth");
    const { clearAllAppData, createStore } = await import("@/lib/store");
    // two accounts, each with data under its own keys (account data, onboarding flag, and so on)
    const history = createStore<string[]>("ast.history.v1", { versioned: false });
    const saved = createStore<string[]>("ast.saved.v1", { versioned: false });
    const notifications = createStore<string[]>("ast.notifications.v1", { versioned: false });
    auth.startSignUp({ name: "Ana Test", email: "ana@example.com", role: "student" });
    auth.verifyCode(DEMO_CODE);
    history.write(["a"]);
    saved.write(["a"]);
    notifications.write(["a"]);
    auth.finishOnboarding();
    auth.signOut();
    auth.startSignUp({ name: "Ines Test", email: "ines@example.com", role: "instructor" });
    auth.verifyCode(DEMO_CODE);
    history.write(["b"]);
    // old device-level keys, the order of Materials, and things a page keeps for this visit only
    local.set("ast.profile.v1", "{}");
    local.set("ast.role.v1", "{}");
    local.set("ast.exams.v1:ines@example.com", "[]");
    session.set("ast.materials-scroll.v1", "{}");
    // a key that is not the app's stays
    local.set("other-app.theme", "dark");

    expect([...local.keys()].filter((key) => key.startsWith("ast.")).length).toBeGreaterThan(6);
    clearAllAppData();

    expect([...local.keys()].filter((key) => key.startsWith("ast."))).toEqual([]);
    expect([...session.keys()].filter((key) => key.startsWith("ast."))).toEqual([]);
    expect([...local.keys()]).toEqual(["other-app.theme"]);
  });

  it("leaves the stores reading nothing, and the next sign-in finds no account", async () => {
    fakeBrowser();
    vi.resetModules();
    const auth = await import("@/lib/auth");
    const { clearAllAppData, createStore } = await import("@/lib/store");
    const history = createStore<string[]>("ast.history.v1", { versioned: false });
    auth.startSignUp({ name: "Ana Test", email: "ana@example.com", role: "student" });
    auth.verifyCode(DEMO_CODE);
    history.write(["a"]);
    clearAllAppData();
    expect(history.read()).toBeNull();
    expect(auth.readAuth().accounts).toEqual([]);
    expect(auth.readAuth().session).toBeNull();
    expect(auth.startSignIn("ana@example.com")).toBe("unknown");
  });

  it("works when storage is blocked: it does not throw", async () => {
    vi.stubGlobal("window", {
      get localStorage(): never {
        throw new Error("blocked");
      },
      get sessionStorage(): never {
        throw new Error("blocked");
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    });
    vi.resetModules();
    const { clearAllAppData } = await import("@/lib/store");
    expect(() => clearAllAppData()).not.toThrow();
  });
});

describe("every storage key the app source uses has the app prefix", () => {
  it("so one prefix clears them all", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return name === "node_modules" ? [] : walk(path);
        return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
      });
    const sources = ["app", "components", "lib"].flatMap(walk);
    const keys = new Set<string>();
    for (const file of sources) {
      const code = readFileSync(file, "utf8");
      for (const match of code.matchAll(/createStore<[^>]*(?:<[^>]*>[^>]*)*>\(\s*"([^"]+)"/g)) {
        keys.add(match[1]);
      }
      for (const match of code.matchAll(
        /(?:local|session)Storage\.(?:get|set|remove)Item\(\s*"([^"]+)"/g,
      )) {
        keys.add(match[1]);
      }
    }
    expect(keys.size).toBeGreaterThan(10);
    for (const key of keys) expect(key.startsWith("ast."), key).toBe(true);
  });
});
