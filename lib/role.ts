/**
 * The roles (DESIGN.md: Accounts, roles and Profile). Pure: the role of the signed-in account lives
 * in `lib/auth.ts` (client only); this file has the names, the Home of each role and the role guard.
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
const INSTRUCTOR_ROUTES = ["/instructor", "/profile", "/profile/edit", "/about", "/onboarding"];

/** An instructor route: Instructor Home or anything under /instructor/. */
const isInstructorRoute = (pathname: string) =>
  INSTRUCTOR_ROUTES.includes(pathname) || pathname.startsWith("/instructor/");

/**
 * Where a role is sent from a route it may not open, or null when it may stay: an instructor is
 * sent from a student-only route to Instructor Home, a student from Instructor Home to Home.
 */
export function roleRedirect(role: Role, pathname: string): string | null {
  if (role === "instructor") {
    return isInstructorRoute(pathname) ? null : roleHome("instructor");
  }
  return pathname === "/instructor" || pathname.startsWith("/instructor/")
    ? roleHome("student")
    : null;
}
