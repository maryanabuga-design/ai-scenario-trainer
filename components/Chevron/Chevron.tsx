import { ChevronRight } from "lucide-react";

/**
 * The plain chevron of a row or card that opens something, without a circle (DESIGN.md:
 * ArrowCircle). Decorative: the row or card itself is the link or button.
 */
export function Chevron() {
  return (
    <span
      aria-hidden="true"
      className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center self-center text-primary"
    >
      <ChevronRight size={20} strokeWidth={2} />
    </span>
  );
}
