import { describe, expect, it } from "vitest";
import { AUTH_ROUTES, guardRedirect } from "@/lib/route-guard";

describe("the route guard", () => {
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

  it("sends a signed-in person from the auth routes to the Home of their role", () => {
    for (const path of AUTH_ROUTES) {
      expect(guardRedirect("student", path), path).toBe("/");
      expect(guardRedirect("instructor", path), path).toBe("/instructor");
    }
  });

  it("keeps the role guards: an instructor on a student route, a student on Instructor Home", () => {
    expect(guardRedirect("instructor", "/training")).toBe("/instructor");
    expect(guardRedirect("instructor", "/profile")).toBeNull();
    expect(guardRedirect("instructor", "/profile/edit")).toBeNull();
    expect(guardRedirect("student", "/instructor")).toBe("/");
    expect(guardRedirect("student", "/profile/edit")).toBeNull();
    expect(guardRedirect("student", "/training")).toBeNull();
  });
});
