"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Notice } from "@/components/Notice/Notice";
import { FLASH_MS, clearFlash, useFlash } from "@/lib/flash";

/**
 * The reusable success Notice (DESIGN.md: Instructor content flow polish): the compact Notice with a
 * success tile and a check, one line and a small corner x, at the top of the content of the screen the
 * person lands on (`narrow`: at most 360px wide and centred, for the centred result screen). It sits in a polite live region, closes itself after 6 seconds (not with
 * prefers-reduced-motion: then only the x closes it) and goes when the person leaves the screen.
 */
export function FlashNotice({ narrow = false }: { narrow?: boolean }) {
  const flash = useFlash();
  const pathname = usePathname();
  const visible = flash !== null && flash.path === pathname;
  const seen = useRef<number | null>(null);
  const id = flash?.id;

  useEffect(() => {
    if (!visible || id === undefined) return;
    seen.current = id;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => clearFlash(id), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [visible, id]);

  // leaving the screen the message was shown on removes it
  useEffect(() => {
    if (!visible && seen.current !== null) {
      clearFlash(seen.current);
      seen.current = null;
    }
  }, [visible]);

  return (
    <div aria-live="polite" data-flash-region className="contents">
      {visible && flash && (
        <div data-flash className={narrow ? "mx-auto w-full max-w-[360px] text-left" : undefined}>
          <Notice variant="success" title={flash.text} onClose={() => clearFlash(flash.id)} />
        </div>
      )}
    </div>
  );
}
