"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { currentAccount, useAuth } from "@/lib/auth";
import { guardRedirect } from "@/lib/route-guard";

/**
 * The route guard (DESIGN.md: Accounts): a signed-out visitor is sent to Welcome from every route
 * except the four auth routes, a signed-in person is sent from the auth routes to the Home of their
 * role, and the role guard of before still applies. Nothing is drawn until the session has been read
 * in the browser and the route is allowed, so protected content never flickers.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const account = auth === "loading" ? null : currentAccount(auth);
  const target =
    auth === "loading"
      ? null
      : guardRedirect(
          account
            ? {
                role: account.role,
                onboardingDone: account.onboardingDone,
                fieldStepDone: account.fieldStepDone,
              }
            : null,
          pathname,
        );

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (auth === "loading" || target) return null;
  return <>{children}</>;
}
