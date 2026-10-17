import type { ReactNode } from "react";

/**
 * The one icon tile (DESIGN.md: Icon tiles): `--icon-tile-bg` behind an icon drawn in `--icon-ink`.
 * It sets only the colours and the centring; `className` gives the size and the shape (for example
 * "h-11 w-11 rounded-[12px]" or "h-9 w-9 rounded-full"), so no tile changes size or radius.
 * Decorative: the name of the thing is next to it.
 */
export function IconTile({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-icon-tile-bg text-icon-ink ${className}`}
    >
      {children}
    </span>
  );
}
