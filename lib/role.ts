import { useMemo } from "react";
import { createStore } from "@/lib/store";

/**
 * The role of the person (DESIGN.md: Roles and Profile). CLIENT ONLY by the server/client rule: it
 * is saved in this browser. It is a DEMO: there is no account; Profile switches it, and a later
 * registration step will call `setRole`.
 */
export type Role = "student" | "instructor";

export const ROLES: Role[] = ["student", "instructor"];

export const roleLabel: Record<Role, string> = { student: "Student", instructor: "Instructor" };

export type RoleState = { role: Role };

const isRole = (value: unknown): value is Role =>
  typeof value === "string" && (ROLES as string[]).includes(value);

/** The saved role if it is a valid one, otherwise nothing. */
export function cleanRole(value: unknown): RoleState | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { role } = value as { role?: unknown };
  return isRole(role) ? { role } : null;
}

/** The role of whatever was read: missing or broken data means a student. */
export function roleFrom(value: unknown): Role {
  return cleanRole(value)?.role ?? "student";
}

/** The Home of a role. */
export const roleHome = (role: Role): string => (role === "instructor" ? "/instructor" : "/");

/** The routes an instructor may open; every other route belongs to the student. */
const INSTRUCTOR_ROUTES = ["/instructor", "/profile", "/about", "/onboarding"];

/**
 * Where a role is sent from a route it may not open, or null when it may stay: an instructor is
 * sent from a student-only route to Instructor Home, a student from Instructor Home to Home.
 */
export function roleRedirect(role: Role, pathname: string): string | null {
  if (role === "instructor") {
    return INSTRUCTOR_ROUTES.includes(pathname) ? null : roleHome("instructor");
  }
  return pathname === "/instructor" || pathname.startsWith("/instructor/")
    ? roleHome("student")
    : null;
}

const store = createStore<RoleState>("ast.role.v1", { sanitize: cleanRole });

/** The saved role (a student when nothing valid is saved). */
export const readRole = (): Role => roleFrom(store.read());

/** Saves the role. The one place a role is set: Profile now, registration later. */
export function setRole(role: Role) {
  store.write({ role });
}

/** The role, "loading" until the browser has been read, so nothing is drawn for the wrong role. */
export function useRole(): Role | "loading" {
  const stored = store.useValue();
  return useMemo(() => (stored === "loading" ? "loading" : roleFrom(stored)), [stored]);
}
