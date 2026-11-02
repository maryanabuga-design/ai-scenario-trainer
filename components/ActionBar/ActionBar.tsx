"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

const ActionBarContext = createContext<{
  slot: HTMLElement | null;
  setSlot: (element: HTMLElement | null) => void;
} | null>(null);

function useActionBarContext() {
  const context = useContext(ActionBarContext);
  if (!context) throw new Error("ActionBar must be used inside ActionBarProvider");
  return context;
}

export function ActionBarProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <ActionBarContext.Provider value={{ slot, setSlot }}>{children}</ActionBarContext.Provider>
  );
}

export function ActionBarSlot() {
  const { setSlot } = useActionBarContext();
  return <div ref={setSlot} />;
}

/**
 * `covered`: a sheet is drawn over the bar (the answer feedback). The bar keeps its place and size
 * so the page does not change height, but it is invisible and cannot be reached.
 */
export function ActionBar({
  children,
  covered = false,
}: {
  children: ReactNode;
  covered?: boolean;
}) {
  const { slot } = useActionBarContext();
  if (!slot) return null;
  return createPortal(
    <div
      data-full-bleed
      inert={covered}
      className={`flex flex-col gap-3 border-t border-border bg-bg p-[var(--gutter,1rem)] ${covered ? "invisible" : ""}`}
    >
      {children}
    </div>,
    slot,
  );
}
