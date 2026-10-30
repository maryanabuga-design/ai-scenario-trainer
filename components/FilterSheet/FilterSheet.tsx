"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode, RefObject } from "react";

/** How far the handle has to be dragged down (px) to close the sheet. */
const SWIPE_CLOSE = 60;

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * The filter sheet (DESIGN.md: Students, the status filter is an icon button with a filter sheet):
 * the ONE bottom sheet of the app, for a single-choice filter opened by an icon button. It is a
 * fixed layer exactly as wide as the phone column (so a wide screen is not dimmed outside it) with a
 * scrim (the text colour at about 40%) and a panel at the bottom: 20px top corners, the page
 * background, a drag handle, the title with a close x, then the children. It slides up in about
 * 200ms (none with prefers-reduced-motion). Escape, the scrim, the x and a swipe down on the handle
 * close it. It is a modal dialog: focus moves in, Tab stays inside, focus returns to the element
 * that opened it, and the page behind does not scroll.
 */
export function FilterSheet({
  open,
  title,
  onClose,
  children,
  returnFocus,
  inline = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** The button that opened the sheet: it gets the focus back (Safari does not focus a tapped button). */
  returnFocus?: RefObject<HTMLElement | null>;
  /** Only for the screen review page: draw the sheet over its nearest positioned frame instead of the page. */
  inline?: boolean;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const opener = returnFocus?.current ?? (document.activeElement as HTMLElement | null);
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      root.style.overflow = overflow;
      opener?.focus();
    };
  }, [open, returnFocus]);

  if (!open) return null;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "Tab" && panel.current) {
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      // always move the focus ourselves: Safari does not Tab to every control by default
      event.preventDefault();
      const at = items.indexOf(document.activeElement as HTMLElement);
      const step = event.shiftKey ? -1 : 1;
      const next = at === -1 ? (event.shiftKey ? items.length - 1 : 0) : at + step;
      items[(next + items.length) % items.length].focus();
    }
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !panel.current) return;
    const dy = Math.max(0, event.clientY - drag.current.y);
    panel.current.style.transform = `translateY(${dy}px)`;
  };
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !panel.current) return;
    const dy = event.clientY - drag.current.y;
    drag.current = null;
    panel.current.style.transform = "";
    if (dy >= SWIPE_CLOSE) onClose();
  };

  return (
    <div
      data-filter-sheet-layer
      onKeyDown={onKeyDown}
      className={
        inline
          ? "absolute inset-0 z-40"
          : "fixed inset-y-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2"
      }
    >
      <div
        data-sheet-scrim
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--text)_40%,transparent)]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-filter-sheet
        className="filter-sheet absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-y-auto rounded-t-[20px] bg-bg px-[var(--gutter,1rem)] pb-[max(16px,env(safe-area-inset-bottom))] shadow-(--card-shadow) outline-none"
      >
        <div
          data-sheet-handle
          onPointerDown={(event) => {
            drag.current = { y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={move}
          onPointerUp={release}
          onPointerCancel={release}
          className="-mx-[var(--gutter,1rem)] flex h-6 shrink-0 cursor-grab touch-none items-center justify-center"
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-selectable-stroke" />
        </div>
        <div className="flex min-h-11 items-center justify-between gap-3">
          <h2 id={titleId} className="type-card-title">
            {title}
          </h2>
          <button
            type="button"
            data-sheet-close
            aria-label="Close"
            onClick={onClose}
            className="-mr-1.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-secondary-sand text-text">
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </span>
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2">{children}</div>
      </div>
    </div>
  );
}
