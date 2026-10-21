import type { ReactNode } from "react";

const tones = {
  /** The one icon tile (DESIGN.md: Icon tiles): neutral warm grey, the same pair as the bookmark. */
  neutral: "bg-neutral-tile-bg text-neutral-tile-ink",
  attention: "bg-status-attention-bg text-status-attention-ink",
  success: "bg-status-success-bg text-status-success-ink",
} as const;

/**
 * The one icon tile (DESIGN.md: Icon tiles): `--neutral-tile-bg` behind an icon drawn in `--neutral-tile-ink`, for every navigation and informational icon.
 * It sets only the colours and the centring; `className` gives the size and the shape (for example
 * "h-11 w-11 rounded-[12px]" or "h-9 w-9 rounded-full"), so no tile changes size or radius. The
 * "attention" (muted sand-gold) and "success" (muted sage) tones are the exam status tiles (DESIGN.md:
 * status colours). Decorative: the name of the thing is next to it.
 */
export function IconTile({
  className,
  children,
  tone = "neutral",
  tileId = "",
}: {
  className: string;
  children: ReactNode;
  tone?: keyof typeof tones;
  /** For tests: the attribute `data-icon-tile` (empty by default). */
  tileId?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-icon-tile={tileId}
      className={`flex shrink-0 items-center justify-center ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
