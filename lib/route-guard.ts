import { roleHome, roleRedirect } from "@/lib/role";
import type { Role } from "@/lib/role";

/** The screens a signed-out visitor may open. */
export const AUTH_ROUTES = ["/welcome", "/sign-up", "/sign-in", "/verify"];

/** The signed-in person as the guard sees them. */
export type Visitor = { role: Role; onboardingDone: boolean };

export const ONBOARDING_ROUTE = "/onboarding";

/**
 * Where a visitor is sent from a route, or null when they may stay (DESIGN.md: Accounts). Signed
 * out (`visitor` null): every route except the four auth routes goes to Welcome. Signed in: every
 * route goes to the onboarding until it has been done once, the auth routes go to the Home of the
 * role, and the role guard of before still applies. Pure.
 */
export function guardRedirect(visitor: Visitor | null, pathname: string): string | null {
  if (visitor === null) return AUTH_ROUTES.includes(pathname) ? null : "/welcome";
  if (!visitor.onboardingDone) return pathname === ONBOARDING_ROUTE ? null : ONBOARDING_ROUTE;
  if (AUTH_ROUTES.includes(pathname)) return roleHome(visitor.role);
  return roleRedirect(visitor.role, pathname);
}
