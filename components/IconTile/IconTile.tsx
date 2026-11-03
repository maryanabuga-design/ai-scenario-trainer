import type { ReactNode } from "react";

const tones = {
  /** The one neutral icon tile (DESIGN.md: One icon tile): the lighter sand, the icon in the text colour. */
  neutral: "bg-chip-neutral-bg text-text",
  attention: "bg-status-attention-bg text-status-attention-ink",
  success: "bg-status-success-bg text-status-success-ink",
} as const;

/** The two sizes of the neutral tile: 48px (rows and cards) and 40px (compact rows); radius 14, icon 24px. */
const sizes = {
  default: "h-12 w-12 rounded-[14px] [&_svg]:h-6 [&_svg]:w-6",
  compact: "h-10 w-10 rounded-[14px] [&_svg]:h-6 [&_svg]:w-6",
} as const;

/**
 * The one icon tile (DESIGN.md: One icon tile). Neutral tiles take a `size` ("default" 48px or
 * "compact" 40px) and have one look everywhere: sand background, radius 14, the icon at 24px in the
 * text colour. The "attention" (muted sand-gold) and "success" (muted sage) tones are the status
 * tiles and, like the large material tile, give their own size and shape with `className`.
 * Decorative: the name of the thing is next to it.
 */
export function IconTile({
  className = "",
  children,
  tone = "neutral",
  size,
  tileId = "",
}: {
  className?: string;
  children: ReactNode;
  tone?: keyof typeof tones;
  /** The standard neutral size; without it `className` gives the size (status tiles, the material tile). */
  size?: keyof typeof sizes;
  /** For tests: the attribute `data-icon-tile` (empty by default). */
  tileId?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-icon-tile={tileId}
      className={`flex shrink-0 items-center justify-center ${tones[tone]} ${size ? sizes[size] : ""} ${className}`}
    >
      {children}
    </span>
  );
}
