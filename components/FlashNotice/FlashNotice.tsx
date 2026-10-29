"use client";

import { Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearFlash, useFlash } from "@/lib/flash";

/** How long the confirmation stays, and how long its fade lasts (milliseconds). */
export const SHOW_MS = 4000;
const FADE_MS = 250;

/** The top of the notice: just under the visible header band of the screen, or 16px from the top. */
function topOfNotice(): number {
  const band = Array.from(document.querySelectorAll("[data-page-header-band]")).find(
    (el) => el.getClientRects().length > 0,
  );
  const bottom = band ? band.getBoundingClientRect().bottom : 0;
  return Math.max(16, Math.round(bottom + 8));
}

/**
 * The light confirmation after an action (DESIGN.md: Result card, one single-choice pattern, a
 * floating confirmation): a 56px card with a check tile and ONE line of text, no close button. It
 * floats just under the header band of the screen the person lands on, above the content (fixed in the
 * phone column with 16px side margins), so showing and hiding it moves nothing. It fades in, stays
 * about 4 seconds and fades out by itself; with prefers-reduced-motion there is no fade and it still
 * goes after about 4 seconds. A polite live region; a new message replaces the old one.
 */
export function FlashNotice() {
  const flash = useFlash();
  const pathname = usePathname();
  const visible = flash !== null && flash.path === pathname;
  const id = flash?.id;
  const seen = useRef<number | null>(null);
  const [shown, setShown] = useState<{ id: number; top: number; on: boolean } | null>(null);

  useEffect(() => {
    if (!visible || id === undefined) return;
    seen.current = id;
    // the next frame: measure the band and start the fade-in
    const frame = window.requestAnimationFrame(() =>
      setShown({ id, top: topOfNotice(), on: true }),
    );
    const fade = window.setTimeout(
      () =>
        setShown((current) => (current && current.id === id ? { ...current, on: false } : current)),
      SHOW_MS,
    );
    const gone = window.setTimeout(() => clearFlash(id), SHOW_MS + FADE_MS);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fade);
      window.clearTimeout(gone);
    };
  }, [visible, id]);

  // leaving the screen the message was shown on removes it
  useEffect(() => {
    if (!visible && seen.current !== null) {
      const left = seen.current;
      seen.current = null;
      const timer = window.setTimeout(() => clearFlash(left), 0);
      return () => window.clearTimeout(timer);
    }
  }, [visible]);

  return (
    <div role="status" aria-live="polite" data-flash-region className="contents">
      {visible && flash && (
        <div
          data-flash
          data-flash-state={shown && shown.id === flash.id && shown.on ? "on" : "off"}
          style={{ top: shown && shown.id === flash.id ? shown.top : 16 }}
          className={`pointer-events-none fixed left-1/2 z-50 w-[min(calc(100vw-32px),398px)] -translate-x-1/2 transition-opacity duration-200 motion-reduce:transition-none ${
            shown && shown.id === flash.id && shown.on ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex h-14 items-center gap-3 rounded-[14px] border border-success-soft-stroke bg-success-soft-bg px-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-success-bg text-status-success-ink"
            >
              <Check size={20} strokeWidth={2.25} />
            </span>
            <p className="type-body-strong min-w-0 flex-1 truncate">{flash.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
