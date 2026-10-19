import type { ReactNode } from "react";

const tones = {
  default: "bg-icon-tile-bg text-icon-ink",
  attention: "bg-status-attention-bg text-status-attention-ink",
  success: "bg-status-success-bg text-status-success-ink",
} as const;

/**
 * The one icon tile (DESIGN.md: Icon tiles): `--icon-tile-bg` behind an icon drawn in `--icon-ink`.
 * It sets only the colours and the centring; `className` gives the size and the shape (for example
 * "h-11 w-11 rounded-[12px]" or "h-9 w-9 rounded-full"), so no tile changes size or radius. The
 * "attention" (muted sand-gold) and "success" (muted sage) tones are the exam status tiles (DESIGN.md:
 * status colours). Decorative: the name of the thing is next to it.
 */
export function IconTile({
  className,
  children,
  tone = "default",
}: {
  className: string;
  children: ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
