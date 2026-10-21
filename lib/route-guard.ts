import { roleHome, roleRedirect } from "@/lib/role";
import type { Role } from "@/lib/role";

/** The screens a signed-out visitor may open. */
export const AUTH_ROUTES = ["/welcome", "/sign-up", "/sign-in", "/verify"];

/** The signed-in person as the guard sees them. */
export type Visitor = { role: Role; onboardingDone: boolean; fieldStepDone?: boolean };

export const ONBOARDING_ROUTE = "/onboarding";
export const FIELD_ROUTE = "/field-of-work";

/**
 * Where a visitor is sent from a route, or null when they may stay (DESIGN.md: Accounts). Signed
 * out (`visitor` null): every route except the four auth routes goes to Welcome. Signed in: every
 * route goes to the onboarding until it has been done once, the auth routes go to the Home of the
 * role, and the role guard of before still applies. Pure.
 */
export function guardRedirect(visitor: Visitor | null, pathname: string): string | null {
  if (visitor === null) return AUTH_ROUTES.includes(pathname) ? null : "/welcome";
  if (!visitor.onboardingDone) {
    // a student who has not been through the Field of work step goes there first, once; then the introduction
    const owesStep = visitor.role === "student" && visitor.fieldStepDone === false;
    if (pathname === FIELD_ROUTE && owesStep) return null;
    if (pathname === ONBOARDING_ROUTE) return null;
    return owesStep ? FIELD_ROUTE : ONBOARDING_ROUTE;
  }
  // the step is never shown again once the onboarding is done
  if (pathname === FIELD_ROUTE) return roleHome(visitor.role);
  if (AUTH_ROUTES.includes(pathname)) return roleHome(visitor.role);
  return roleRedirect(visitor.role, pathname);
}
