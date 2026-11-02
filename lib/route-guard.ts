import { roleHome, roleRedirect } from "@/lib/role";
import type { Role } from "@/lib/role";

/** The screens a signed-out visitor may open. */
export const AUTH_ROUTES = ["/welcome", "/sign-in", "/verify", "/join"];

/** The signed-in person as the guard sees them. */
export type Visitor = {
  role: Role;
  onboardingDone: boolean;
  fieldStepDone?: boolean;
  /** false: an invited student who has not finished the Profile step. */
  profileDone?: boolean;
};

export const PROFILE_SETUP_ROUTE = "/set-up-profile";

export const ONBOARDING_ROUTE = "/onboarding";
export const FIELD_ROUTE = "/field-of-work";

/**
 * Where a visitor is sent from a route, or null when they may stay (DESIGN.md: Accounts). Signed
 * out (`visitor` null): every route except the four auth routes goes to Welcome. Signed in: every
 * route goes to the onboarding until it has been done once, the auth routes go to the Home of the
 * role, and the role guard of before still applies. Pure.
 */
export function guardRedirect(visitor: Visitor | null, pathname: string): string | null {
  // the group code screen and a join link (`/join/<code>`) are open to a signed-out visitor and to a
  // signed-in student (who confirms joining); an instructor goes Home
  const isJoin = pathname.startsWith("/join/");
  // (the Profile step is open for a moment to a signed-out visitor: going back from it to the code
  // step signs the half-made account out, and the page then moves on to Verify itself)
  if (visitor === null) {
    return AUTH_ROUTES.includes(pathname) || isJoin || pathname === PROFILE_SETUP_ROUTE
      ? null
      : "/welcome";
  }
  // an invited student finishes the Profile step first
  if (visitor.profileDone === false) {
    return pathname === PROFILE_SETUP_ROUTE ? null : PROFILE_SETUP_ROUTE;
  }
  if (pathname === PROFILE_SETUP_ROUTE) return roleHome(visitor.role);
  if (visitor.role === "student" && visitor.onboardingDone && (pathname === "/join" || isJoin)) {
    return null;
  }
  if (!visitor.onboardingDone) {
    // a student who has not been through the Field of work step goes there first, once; then the introduction
    const owesStep = visitor.role === "student" && visitor.fieldStepDone === false;
    if (pathname === FIELD_ROUTE && owesStep) return null;
    if (pathname === ONBOARDING_ROUTE) return null;
    return owesStep ? FIELD_ROUTE : ONBOARDING_ROUTE;
  }
  // the step is never shown again once the onboarding is done
  if (pathname === FIELD_ROUTE) return roleHome(visitor.role);
  if (AUTH_ROUTES.includes(pathname) || isJoin) return roleHome(visitor.role);
  return roleRedirect(visitor.role, pathname);
}
