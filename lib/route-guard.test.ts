import { describe, expect, it } from "vitest";
import { AUTH_ROUTES, guardRedirect } from "@/lib/route-guard";
import type { Visitor } from "@/lib/route-guard";

const student: Visitor = { role: "student", onboardingDone: true };
const instructor: Visitor = { role: "instructor", onboardingDone: true };
const newStudent: Visitor = { role: "student", onboardingDone: false };
const newInstructor: Visitor = { role: "instructor", onboardingDone: false };

describe("the route guard: signed out", () => {
  it("sends a signed-out visitor from every other route to Welcome", () => {
    for (const path of [
      "/",
      "/training",
      "/materials",
      "/progress",
      "/profile",
      "/profile/edit",
      "/about",
      "/instructor",
      "/onboarding",
      "/exam",
      "/notifications",
    ]) {
      expect(guardRedirect(null, path), path).toBe("/welcome");
    }
  });

  it("lets a signed-out visitor open Welcome, Create account, Sign in and Verify", () => {
    expect(AUTH_ROUTES).toEqual(["/welcome", "/sign-up", "/sign-in", "/verify"]);
    for (const path of AUTH_ROUTES) expect(guardRedirect(null, path), path).toBeNull();
  });
});

describe("the route guard: signed in", () => {
  it("sends a person who finished the onboarding from the auth routes to the Home of their role", () => {
    for (const path of AUTH_ROUTES) {
      expect(guardRedirect(student, path), path).toBe("/");
      expect(guardRedirect(instructor, path), path).toBe("/instructor");
    }
  });

  it("sends a person who has not seen the onboarding to it, from every route but it", () => {
    for (const visitor of [newStudent, newInstructor]) {
      for (const path of [...AUTH_ROUTES, "/", "/training", "/profile", "/instructor", "/about"]) {
        expect(guardRedirect(visitor, path), path).toBe("/onboarding");
      }
      expect(guardRedirect(visitor, "/onboarding")).toBeNull();
    }
  });

  it("lets a person who finished it open the onboarding again (the replay)", () => {
    expect(guardRedirect(student, "/onboarding")).toBeNull();
    expect(guardRedirect(instructor, "/onboarding")).toBeNull();
  });

  it("keeps the role guards: an instructor on a student route, a student on Instructor Home", () => {
    expect(guardRedirect(instructor, "/training")).toBe("/instructor");
    expect(guardRedirect(instructor, "/profile")).toBeNull();
    expect(guardRedirect(instructor, "/profile/edit")).toBeNull();
    expect(guardRedirect(student, "/instructor")).toBe("/");
    expect(guardRedirect(student, "/profile/edit")).toBeNull();
    expect(guardRedirect(student, "/training")).toBeNull();
  });
});
