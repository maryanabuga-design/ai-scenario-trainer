"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { roleRedirect, useRole } from "@/lib/role";

/**
 * The route guard (DESIGN.md: Roles and Profile): an instructor who opens a student-only route is
 * sent to Instructor Home, a student who opens Instructor Home is sent to Home. Nothing is drawn
 * until the role has been read in the browser and the route is allowed, so the wrong screen never
 * flickers.
 */
export function RoleGate({ children }: { children: ReactNode }) {
  const role = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const target = role === "loading" ? null : roleRedirect(role, pathname);

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (role === "loading" || target) return null;
  return <>{children}</>;
}
