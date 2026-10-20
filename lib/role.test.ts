import { describe, expect, it } from "vitest";
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

  it("lets an instructor open Edit profile too", () => {
    expect(roleRedirect("instructor", "/profile/edit")).toBeNull();
  });

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

describe("the instructor routes", () => {
  it("lets an instructor open every /instructor route and sends a student away from them", () => {
    for (const path of [
      "/instructor",
      "/instructor/exams",
      "/instructor/exams/new",
      "/instructor/exams/grp-1",
    ]) {
      expect(roleRedirect("instructor", path), path).toBeNull();
      expect(roleRedirect("student", path), path).toBe("/");
    }
    // an instructor is still sent away from student-only screens
    for (const path of [
      "/exam",
      "/training",
      "/ask-ai",
      "/profile/certificates",
      "/notifications",
    ]) {
      expect(roleRedirect("instructor", path), path).toBe("/instructor");
    }
  });
});
