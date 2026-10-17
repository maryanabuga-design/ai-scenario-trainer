"use client";

import { useEffect } from "react";
import { saveListScroll, takeListRestore } from "@/lib/navigation-origin";

/**
 * The Materials list remembers its scroll position, and puts it back when Back from a reading
 * screen arrives by a new navigation (the browser restores it itself when it goes back in history).
 * Draws nothing.
 */
export function ListScroll() {
  useEffect(() => {
    const y = takeListRestore();
    if (y !== null) window.scrollTo(0, y);
    let frame = 0;
    const save = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => saveListScroll(window.scrollY));
    };
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", save);
    };
  }, []);
  return null;
}
