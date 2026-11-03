"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { routeTitle } from "@/lib/route-title";

/**
 * Keeps the document title meaningful on every screen ("Students · AI Scenario Trainer"): the name
 * of the page, taken from its heading, then the product. It follows the heading when the screen
 * changes its own content, and puts the title back if the framework rewrites it.
 */
export function RouteTitle() {
  const pathname = usePathname();
  useEffect(() => {
    const apply = () => {
      const heading = document.querySelector<HTMLElement>("main h1")?.innerText ?? "";
      const next = routeTitle(pathname, heading);
      if (document.title !== next) document.title = next;
    };
    apply();
    let frame = 0;
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };
    const watched = [document.querySelector("main"), document.querySelector("title")];
    const observer = new MutationObserver(later);
    for (const node of watched)
      if (node) observer.observe(node, { childList: true, subtree: true, characterData: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname]);
  return null;
}
