import { ArrowRight } from "lucide-react";

/**
 * The arrow of a card that opens something: a 36px white circle with a soft shadow inside a 44px
 * area, top right. Decorative; the whole card is the button.
 */
export function ArrowCircle() {
  return (
    <span
      aria-hidden="true"
      className="-mt-1 -mr-1 flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-olive text-text shadow-(--card-shadow)">
        <ArrowRight size={18} strokeWidth={2} />
      </span>
    </span>
  );
}
