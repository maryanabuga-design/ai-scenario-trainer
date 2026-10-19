import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanRole, roleFrom, roleHome, roleLabel, roleRedirect, ROLES } from "@/lib/role";

describe("roles", () => {
  it("are Student and Instructor", () => {
    expect(ROLES).toEqual(["student", "instructor"]);
    expect(roleLabel).toEqual({ student: "Student", instructor: "Instructor" });
  });

  it("falls back to student for missing or broken data", () => {
    for (const value of [
      null,
      undefined,
      "instructor",
      3,
      [],
      {},
      { role: "admin" },
      { role: 1 },
    ]) {
      expect(roleFrom(value)).toBe("student");
    }
    expect(cleanRole({ role: "admin" })).toBeNull();
    expect(cleanRole({ role: "instructor" })).toEqual({ role: "instructor" });
    expect(roleFrom({ role: "instructor" })).toBe("instructor");
    expect(roleFrom({ role: "student" })).toBe("student");
  });

  it("has a Home for each role", () => {
    expect(roleHome("student")).toBe("/");
    expect(roleHome("instructor")).toBe("/instructor");
  });
});

describe("the route guard", () => {
  const studentOnly = [
    "/",
    "/training",
    "/materials",
    "/materials/read/S1",
    "/progress",
    "/exam",
    "/exam/results",
    "/session",
    "/notifications",
    "/saved",
    "/weak-topics",
    "/mini-quiz",
    "/checklists",
  ];

  it("sends an instructor from every student-only route to Instructor Home", () => {
    for (const path of studentOnly)
      expect(roleRedirect("instructor", path), path).toBe("/instructor");
  });

  it("lets an instructor open Instructor Home, Profile, About and the introduction", () => {
    for (const path of ["/instructor", "/profile", "/about", "/onboarding"]) {
      expect(roleRedirect("instructor", path), path).toBeNull();
    }
  });

  it("sends a student from Instructor Home to Home, and leaves every other route alone", () => {
    expect(roleRedirect("student", "/instructor")).toBe("/");
    expect(roleRedirect("student", "/instructor/anything")).toBe("/");
    for (const path of [...studentOnly, "/profile", "/about", "/onboarding"]) {
      expect(roleRedirect("student", path), path).toBeNull();
    }
  });
});

describe("the saved role", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  function fakeBrowser(initial: string | null) {
    const data = new Map<string, string>();
    if (initial !== null) data.set("ast.role.v1", initial);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => void data.set(key, value),
        removeItem: (key: string) => void data.delete(key),
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    });
    return data;
  }

  it("is student when nothing is saved", async () => {
    fakeBrowser(null);
    vi.resetModules();
    const { readRole } = await import("@/lib/role");
    expect(readRole()).toBe("student");
  });

  it("saves a role with setRole and reads it back, versioned", async () => {
    const data = fakeBrowser(null);
    vi.resetModules();
    const { readRole, setRole } = await import("@/lib/role");
    setRole("instructor");
    expect(readRole()).toBe("instructor");
    expect(JSON.parse(data.get("ast.role.v1")!)).toMatchObject({
      schema: expect.any(Number),
      value: { role: "instructor" },
    });
    setRole("student");
    expect(readRole()).toBe("student");
  });

  it("reads broken data as student without throwing", async () => {
    for (const raw of [
      "{not json",
      "[]",
      "null",
      '{"schema":1,"value":{"role":"instructor"}}',
      '{"schema":6,"value":{"role":"boss"}}',
      '{"schema":6,"value":"instructor"}',
    ]) {
      fakeBrowser(raw);
      vi.resetModules();
      const { readRole } = await import("@/lib/role");
      expect(readRole(), raw).toBe("student");
    }
  });

  it("reads a role that was saved by the app", async () => {
    fakeBrowser('{"schema":6,"content":"x","value":{"role":"instructor"}}');
    vi.resetModules();
    const { readRole } = await import("@/lib/role");
    expect(readRole()).toBe("instructor");
  });
});
