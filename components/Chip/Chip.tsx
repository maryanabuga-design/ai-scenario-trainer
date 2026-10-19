"use client";

import type { ComponentProps, ReactNode } from "react";

/**
 * The one chip (DESIGN.md: Chip tones): a soft pastel fill, dark text or icon, no stroke. Tags,
 * status chips and Guide chips only choose a tone and a size; nothing else draws a chip.
 */
export type ChipTone =
  | "yellow"
  | "peach"
  | "blue"
  | "lilac"
  | "olive"
  | "sand"
  | "stone"
  | "primary"
  // the status tones of the Progress topic list: registered status tokens, never red
  | "attention"
  | "success"
  | "neutral";

/** The text or icon colour on a tone, when it is not the plain dark text. */
export type ChipInk = "amber" | "grey";

const tones: Record<ChipTone, string> = {
  yellow: "bg-pastel-yellow",
  peach: "bg-pastel-peach",
  blue: "bg-pastel-blue",
  lilac: "bg-pastel-lilac",
  olive: "bg-olive-tint",
  stone: "bg-secondary-sand-pressed",
  sand: "bg-pastel-sand",
  primary: "bg-primary",
  attention: "bg-status-attention-bg text-status-attention-ink",
  success: "bg-status-success-bg text-status-success-ink",
  neutral: "bg-neutral-tile-bg text-neutral-tile-ink",
};

/** Tones that bring their own text colour. */
const ownInk = new Set<ChipTone>(["primary", "attention", "success", "neutral"]);

const inks: Record<ChipInk, string> = {
  amber: "text-caution",
  grey: "text-text-secondary",
};

/** "label": the uppercase tag text. "caption": status chips. "small": Guide chips. */
const sizes = {
  label: "type-label px-2.5 py-1",
  caption: "type-caption px-2.5 py-1",
  small: "type-small px-3",
} as const;

type Props = {
  tone: ChipTone;
  ink?: ChipInk;
  size?: keyof typeof sizes;
  /** Layout only (height, tap area), never colour. */
  className?: string;
  children: ReactNode;
} & (
  { as?: "span" } | ({ as: "button" } & Omit<ComponentProps<"button">, "className" | "children">)
);

export function Chip({ tone, ink, size = "label", className = "", children, ...rest }: Props) {
  const look = `${tones[tone]} ${tone === "primary" ? "text-primary-text" : ownInk.has(tone) ? "" : ink ? inks[ink] : "text-text"}`;
  const classes = `inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full whitespace-nowrap ${sizes[size]} ${look} ${className}`;
  if ("as" in rest && rest.as === "button") {
    const { as: _as, ...button } = rest;
    void _as;
    return (
      <button type="button" {...button} className={`${classes} active:brightness-95`}>
        {children}
      </button>
    );
  }
  return <span className={classes}>{children}</span>;
}
