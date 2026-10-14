import { ArrowRight } from "lucide-react";

const sizes = {
  md: { circle: "h-10 w-10", icon: 20 },
  sm: { circle: "h-8 w-8", icon: 16 },
} as const;

/**
 * The one arrow for a card or row that opens something (DESIGN.md: ArrowCircle): always a white
 * circle with a warm stroke and a very soft shadow, a dark green arrow. Decorative: the card itself
 * is the link or button. "sm" only in compact rows.
 */
export function ArrowCircle({ size = "md" }: { size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center self-center rounded-full border border-arrow-stroke bg-surface text-primary shadow-(--arrow-shadow) ${sizes[size].circle}`}
    >
      <ArrowRight size={sizes[size].icon} strokeWidth={2} />
    </span>
  );
}
