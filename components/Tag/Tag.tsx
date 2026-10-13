import type { ReactNode } from "react";

/** A category tag: uppercase label on the one neutral chip colour. The text tells the type. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-chip px-2.5 py-1 type-label text-text">
      {children}
    </span>
  );
}
