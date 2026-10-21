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
      expect(guardRedirect(visitor, "/profile/field")).toBe("/onboarding");
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

  it("shows the Field of work step to a new student once, between Verify and the introduction", () => {
    expect(guardRedirect({ ...newStudent, fieldStepDone: false }, "/field-of-work")).toBeNull();
    // once it was left, the step is not shown again: back to the introduction
    expect(guardRedirect({ ...newStudent, fieldStepDone: true }, "/field-of-work")).toBe(
      "/onboarding",
    );
    // until then every other route (the auth routes after Verify too) leads to the step
    for (const path of [...AUTH_ROUTES, "/", "/training", "/profile"]) {
      expect(guardRedirect({ ...newStudent, fieldStepDone: false }, path), path).toBe(
        "/field-of-work",
      );
    }
    expect(guardRedirect({ ...newStudent, fieldStepDone: false }, "/onboarding")).toBeNull();
    // an instructor never sees it
    expect(guardRedirect({ ...newInstructor, fieldStepDone: true }, "/field-of-work")).toBe(
      "/onboarding",
    );
    expect(guardRedirect({ ...newInstructor, fieldStepDone: false }, "/field-of-work")).toBe(
      "/onboarding",
    );
    // after the onboarding it goes to the Home of the role (a field is set in Profile)
    expect(guardRedirect(student, "/field-of-work")).toBe("/");
    expect(guardRedirect(instructor, "/field-of-work")).toBe("/instructor");
  });

  it("keeps the field picker for students: an instructor is sent to Instructor Home", () => {
    expect(guardRedirect(student, "/profile/field")).toBeNull();
    expect(guardRedirect(instructor, "/profile/field")).toBe("/instructor");
  });
});
