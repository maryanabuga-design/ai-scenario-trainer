"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

const ActionBarContext = createContext<{
  slot: HTMLElement | null;
  setSlot: (element: HTMLElement | null) => void;
  /** The actions area of the page header (shown from 1024px in the instructor shell). */
  headerSlot: HTMLElement | null;
  setHeaderSlot: (element: HTMLElement | null) => void;
} | null>(null);

function useActionBarContext() {
  const context = useContext(ActionBarContext);
  if (!context) throw new Error("ActionBar must be used inside ActionBarProvider");
  return context;
}

export function ActionBarProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  return (
    <ActionBarContext.Provider value={{ slot, setSlot, headerSlot, setHeaderSlot }}>
      {children}
    </ActionBarContext.Provider>
  );
}

export function ActionBarSlot() {
  const { setSlot } = useActionBarContext();
  return <div ref={setSlot} />;
}

/**
 * The actions area of the page header (DESIGN.md: Responsive instructor, page header): empty and
 * hidden on the phone; from 1024px in the instructor shell it holds the page's actions, Secondary
 * first and the Primary rightmost, 44px high, never full width. Drawn by the header itself.
 */
export function HeaderActionsSlot() {
  const context = useContext(ActionBarContext);
  return (
    <div
      ref={context?.setHeaderSlot}
      data-header-slot
      data-desk-only
      className="hidden idesk:flex idesk:flex-row-reverse idesk:items-center idesk:gap-3 idesk:[&>*]:h-11! idesk:[&>*]:w-auto! idesk:[&>*]:px-5! idesk:[&>p]:hidden"
    />
  );
}

/**
 * A page action declared once (DESIGN.md: Responsive instructor, page header): on the phone it stays
 * where it is drawn (inline, in the content); from 1024px in the instructor shell the same element
 * is shown in the header's actions area instead and this inline copy is hidden. CSS only.
 */
export function PageAction({ children }: { children: ReactNode }) {
  const context = useContext(ActionBarContext);
  return (
    <>
      <div className="contents idesk:hidden">{children}</div>
      {context?.headerSlot && createPortal(children, context.headerSlot)}
    </>
  );
}

/**
 * The footer of a one-card flow (DESIGN.md: Responsive instructor, step 5): hidden on the phone;
 * from 1024px in the instructor shell it closes the card, after a 1px divider, with the screen's
 * actions (Secondary on the left, Primary on the right, 44px, auto width). The same buttons are in
 * the pinned bar below 1024px (`ActionBar` with `hideOnDesk`).
 */
export function CardFooter({ children }: { children: ReactNode }) {
  return (
    <div
      data-card-footer
      data-desk-only
      className="hidden w-full idesk:flex idesk:justify-end idesk:gap-3 idesk:border-t idesk:border-selectable-stroke idesk:pt-6 idesk:[&>*]:h-11! idesk:[&>*]:w-auto! idesk:[&>*]:px-5!"
    >
      {children}
    </div>
  );
}

/**
 * `covered`: a sheet is drawn over the bar (the answer feedback). The bar keeps its place and size
 * so the page does not change height, but it is invisible and cannot be reached.
 */
export function ActionBar({
  children,
  covered = false,
  inHeader = false,
  hideOnDesk = false,
}: {
  children: ReactNode;
  covered?: boolean;
  /** From 1024px in the instructor shell the buttons are shown in the page header instead of this bar. */
  inHeader?: boolean;
  /** From 1024px in the instructor shell the bar is not drawn: the screen has a `CardFooter` instead. */
  hideOnDesk?: boolean;
}) {
  const { slot, headerSlot } = useActionBarContext();
  if (!slot) return null;
  return (
    <>
      {createPortal(
        <div
          data-full-bleed
          inert={covered}
          className={`flex flex-col gap-3 border-t border-border bg-bg p-[var(--gutter,1rem)] ${covered ? "invisible" : ""}${inHeader || hideOnDesk ? " idesk:hidden" : ""}`}
        >
          {children}
        </div>,
        slot,
      )}
      {inHeader && headerSlot && createPortal(children, headerSlot)}
    </>
  );
}
