"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { asksForRestart, restartDemo } from "@/lib/restart";

/**
 * The `/welcome?restart=1` shortcut (DESIGN.md: Restart demo): clears the demo data once, with no
 * dialog, and reloads Welcome without the query. It lives next to the route guard, not inside it,
 * so it also works for a signed-in person. Draws nothing.
 */
export function RestartShortcut() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !asksForRestart(pathname, search)) return;
    done.current = true;
    restartDemo();
  }, [pathname, search]);

  return null;
}
