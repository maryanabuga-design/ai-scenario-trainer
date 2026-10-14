"use client";

import type { ComponentProps, ReactNode } from "react";
import { useCardSelected } from "@/components/SelectableCard/SelectedContext";

/**
 * The one chip (DESIGN.md: Chip tones): a soft pastel fill, dark text or icon, no stroke. Tags,
 * status chips and Guide chips only choose a tone and a size; nothing else draws a chip.
 */
export type ChipTone =
  "yellow" | "peach" | "blue" | "lilac" | "green" | "rose" | "sand" | "primary";

/** The text or icon colour on a tone, when it is not the plain dark text. */
export type ChipInk = "green" | "red" | "pink" | "sage" | "amber" | "taupe" | "grey";

const tones: Record<ChipTone, string> = {
  yellow: "bg-chip-yellow",
  peach: "bg-chip-peach",
  blue: "bg-chip-blue",
  lilac: "bg-chip-lilac",
  green: "bg-chip-green",
  rose: "bg-chip-rose",
  sand: "bg-chip-sand",
  primary: "bg-primary",
};

const inks: Record<ChipInk, string> = {
  green: "text-chip-ink-green",
  red: "text-wrong",
  pink: "text-misconception",
  sage: "text-secure",
  amber: "text-caution",
  taupe: "text-guess-ink",
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
  /** Keeps the text as written (only the direction chip on Home). */
  sentenceCase?: boolean;
  /** Layout only (height, tap area), never colour. */
  className?: string;
  children: ReactNode;
} & (
  { as?: "span" } | ({ as: "button" } & Omit<ComponentProps<"button">, "className" | "children">)
);

export function Chip({
  tone,
  ink,
  size = "label",
  sentenceCase = false,
  className = "",
  children,
  ...rest
}: Props) {
  // Inside a selected SelectableCard every chip turns primary, with white text.
  const selected = useCardSelected();
  const look = selected
    ? "bg-primary text-primary-text"
    : `${tones[tone]} ${tone === "primary" ? "text-primary-text" : ink ? inks[ink] : "text-text"}`;
  const classes = `inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full whitespace-nowrap ${sizes[size]} ${look} ${sentenceCase ? "normal-case" : ""} ${className}`;
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
