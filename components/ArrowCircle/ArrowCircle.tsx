import { ArrowRight } from "lucide-react";

const sizes = {
  md: { place: "top-4 right-4", circle: "h-10 w-10", icon: 20 },
  sm: { place: "top-3 right-3", circle: "h-8 w-8", icon: 16 },
} as const;

/**
 * Right padding for the text beside the circle: the circle width + 12px, measured from the
 * card's own padding, so long titles wrap before the circle.
 */
export const ARROW_CLEARANCE = { md: "pr-14", sm: "pr-11" } as const;

/**
 * The one arrow for a card or row that opens something (DESIGN.md: ArrowCircle): a white circle
 * with a warm stroke and a very soft shadow, a dark green arrow, in the card's top-right corner
 * (equal top and right offsets). The card must be `relative`. Decorative: the card itself is the
 * link or button.
 */
export function ArrowCircle({ size = "md" }: { size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute ${sizes[size].place} flex items-center justify-center rounded-full border border-arrow-stroke bg-surface text-primary shadow-(--arrow-shadow) ${sizes[size].circle}`}
    >
      <ArrowRight size={sizes[size].icon} strokeWidth={2} />
    </span>
  );
}
