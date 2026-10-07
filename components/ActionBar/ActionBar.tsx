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
  return <ActionBarContext.Provider value={{ slot, setSlot }}>{children}</ActionBarContext.Provider>;
}

export function ActionBarSlot() {
  const { setSlot } = useActionBarContext();
  return <div ref={setSlot} />;
}

export function ActionBar({ children }: { children: ReactNode }) {
  const { slot } = useActionBarContext();
  if (!slot) return null;
  return createPortal(
    <div className="flex flex-col gap-2 border-t border-border bg-surface p-4">{children}</div>,
    slot,
  );
}
