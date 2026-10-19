import { roleHome, roleRedirect } from "@/lib/role";
import type { Role } from "@/lib/role";

/** The screens a signed-out visitor may open. */
export const AUTH_ROUTES = ["/welcome", "/sign-up", "/sign-in", "/verify"];

/**
 * Where a visitor is sent from a route, or null when they may stay (DESIGN.md: Accounts). Signed
 * out (`role` null): every route except the four auth routes goes to Welcome. Signed in: the auth
 * routes go to the Home of the role, and the role guard of before still applies. Pure.
 */
export function guardRedirect(role: Role | null, pathname: string): string | null {
  if (role === null) return AUTH_ROUTES.includes(pathname) ? null : "/welcome";
  if (AUTH_ROUTES.includes(pathname)) return roleHome(role);
  return roleRedirect(role, pathname);
}
