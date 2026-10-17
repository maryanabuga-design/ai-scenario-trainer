"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { noteNavigation } from "@/lib/navigation-origin";

/** Tells `lib/navigation-origin` about every screen change; draws nothing. */
export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => noteNavigation(pathname), [pathname]);
  return null;
}
