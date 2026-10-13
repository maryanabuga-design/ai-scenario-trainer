import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * The arrow that ends a card, a row or a link to another page: a dark green arrow in a 36px
 * circle. on-tint: a white circle (tinted cards, the page background); on-card: the icon-tile
 * circle (white and near-white cards). Decorative: the control around it has the name and the
 * 44px tap area.
 */
export function ArrowCircle({ variant = "on-card" }: { variant?: "on-tint" | "on-card" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary ${
        variant === "on-tint" ? "bg-surface" : "bg-icon-tile"
      }`}
    >
      <ArrowRight size={18} strokeWidth={2} />
    </span>
  );
}

/** "See all" and "Details": underlined text followed by the ArrowCircle, one 44px link. */
export function ArrowLink({
  href,
  label,
  variant = "on-tint",
  onClick,
}: {
  href: string;
  label: string;
  variant?: "on-tint" | "on-card";
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="type-body -my-1 -mr-1 inline-flex min-h-11 shrink-0 items-center gap-2 pl-2 text-text"
    >
      <span className="underline decoration-1 underline-offset-4 hover:decoration-2">{label}</span>
      <ArrowCircle variant={variant} />
    </Link>
  );
}
