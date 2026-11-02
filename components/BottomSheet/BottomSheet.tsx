"use client";

import { useEffect, useId, useRef } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { SheetPicture } from "@/components/BottomSheet/SheetPicture";

/** How far the handle has to be dragged down (px) to close the hint sheet. */
const SWIPE_CLOSE = 60;

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

const SHEET_LOOK =
  "bottom-sheet absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[20px] border-t border-selectable-stroke bg-card px-[var(--gutter,1rem)] pt-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_color-mix(in_srgb,var(--text)_6%,transparent)] outline-none";

/**
 * The layer is as wide as the phone column, so a wide screen is not covered outside it. `inline` is
 * only for the screen review page: it draws the sheet over its nearest positioned frame.
 */
const layer = (inline?: boolean) =>
  inline
    ? "absolute inset-0 z-40"
    : "fixed inset-y-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2";

/**
 * The bottom sheet of the student practice (DESIGN.md: Practice: answer feedback and hint as bottom
 * sheets), in two variants. "feedback" is docked at the bottom with no scrim: the question stays
 * visible and usable above it, and it announces the result (a polite status region); focus moves to
 * its lowest button, the Primary. "hint" is a modal dialog: a scrim, a drag handle, Escape, the
 * scrim and a swipe down close it; focus moves in, stays inside and returns to the lightbulb; the
 * page behind does not scroll. Both slide up in about 200ms (none with reduced motion).
 */
export function BottomSheet(
  props:
    | {
        variant: "feedback";
        inline?: boolean;
        tone: "correct" | "wrong";
        /** "Correct" or "Not quite". */
        title: string;
        /** What a screen reader hears when the sheet appears. */
        announcement: string;
        /** Reports the height of the sheet (px) whenever it changes. */
        onHeight?: (height: number) => void;
        /** Wrong answers only: "Correct answer: <text>", next to the picture under the title. */
        subtitle?: ReactNode;
        /** The explanation, full width under the header row. */
        children: ReactNode;
        /** The Guide chip, on the left edge under the text. */
        guide?: ReactNode;
        /** The buttons, the Primary last. */
        actions: ReactNode;
      }
    | {
        variant: "hint";
        inline?: boolean;
        title: string;
        onClose: () => void;
        /** The lightbulb button: it gets the focus back (Safari does not focus a tapped button). */
        returnFocus?: HTMLElement | null;
        /** The hint text, full width under the header row. */
        children: ReactNode;
        /** The Guide chip, on the left edge under the text. */
        guide?: ReactNode;
        /** The buttons, the Primary last. */
        actions: ReactNode;
      },
) {
  return props.variant === "feedback" ? <FeedbackSheet {...props} /> : <HintSheet {...props} />;
}

/**
 * Four rows (DESIGN.md: Quiz feedback and hint sheets: a header row, a full-width body and clearer
 * hints): the header row (the picture slot and the short title, with "Correct answer" under it for
 * a wrong answer), the full-width body, the Guide chip on the left edge, and the pinned buttons.
 * When the content is long, the first three rows scroll inside the sheet and the Primary stays in
 * view.
 */
function SheetContent({
  picture,
  titleId,
  title,
  titleClass,
  subtitle,
  children,
  guide,
  actions,
}: {
  picture: ReactNode;
  titleId?: string;
  title: string;
  titleClass: string;
  subtitle?: ReactNode;
  children: ReactNode;
  guide?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          data-sheet-header
          className={`flex gap-4 ${subtitle ? "items-start" : "items-center"}`}
        >
          {picture}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 id={titleId} className={`type-card-title ${titleClass}`}>
              {title}
            </h2>
            {subtitle}
          </div>
        </div>
        <div data-sheet-body className="mt-3">
          {children}
        </div>
        {guide && <div className="mt-3 flex">{guide}</div>}
      </div>
      <div className="mt-4 flex shrink-0 flex-col gap-3">{actions}</div>
    </>
  );
}

function FeedbackSheet({
  inline,
  tone,
  title,
  announcement,
  onHeight,
  subtitle,
  children,
  guide,
  actions,
}: {
  inline?: boolean;
  tone: "correct" | "wrong";
  title: string;
  announcement: string;
  onHeight?: (height: number) => void;
  subtitle?: ReactNode;
  children: ReactNode;
  guide?: ReactNode;
  actions: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (inline) return;
    // the Primary is the lowest button of the sheet
    const buttons = panel.current?.querySelectorAll<HTMLElement>("button");
    buttons?.[buttons.length - 1]?.focus({ preventScroll: true });
  }, [inline]);
  useEffect(() => {
    const element = panel.current;
    if (!element || !onHeight) return;
    const report = () => onHeight(element.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeight]);
  return (
    <div data-bottom-sheet-layer className={`${layer(inline)} pointer-events-none`}>
      <div
        ref={panel}
        data-bottom-sheet="feedback"
        data-tone={tone}
        className={`${SHEET_LOOK} pointer-events-auto`}
      >
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
        <SheetContent
          picture={<SheetPicture kind={tone} />}
          title={title}
          titleClass={tone === "correct" ? "text-status-success-ink" : "text-wrong-text"}
          subtitle={subtitle}
          guide={guide}
          actions={actions}
        >
          {children}
        </SheetContent>
      </div>
    </div>
  );
}

function HintSheet({
  inline,
  title,
  onClose,
  returnFocus,
  children,
  guide,
  actions,
}: {
  inline?: boolean;
  title: string;
  onClose: () => void;
  returnFocus?: HTMLElement | null;
  children: ReactNode;
  guide?: ReactNode;
  actions: ReactNode;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number } | null>(null);

  useEffect(() => {
    // on the screen review page several sheets show at once: none may take the focus or lock the page
    if (inline) return;
    const opener = returnFocus ?? (document.activeElement as HTMLElement | null);
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      root.style.overflow = overflow;
      opener?.focus();
    };
  }, [inline, returnFocus]);

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
    panel.current.style.transform = `translateY(${Math.max(0, event.clientY - drag.current.y)}px)`;
  };
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !panel.current) return;
    const dy = event.clientY - drag.current.y;
    drag.current = null;
    panel.current.style.transform = "";
    if (dy >= SWIPE_CLOSE) onClose();
  };

  return (
    <div data-bottom-sheet-layer onKeyDown={onKeyDown} className={layer(inline)}>
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
        data-bottom-sheet="hint"
        className={SHEET_LOOK}
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
          className="-mx-[var(--gutter,1rem)] -mt-4 flex h-6 shrink-0 cursor-grab touch-none items-center justify-center pt-2"
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-selectable-stroke" />
        </div>
        <SheetContent
          picture={<SheetPicture kind="hint" />}
          titleId={titleId}
          title={title}
          titleClass="text-text"
          guide={guide}
          actions={actions}
        >
          {children}
        </SheetContent>
      </div>
    </div>
  );
}
