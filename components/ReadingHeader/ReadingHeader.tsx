"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { CircleBackButton, circleLook } from "@/components/CircleBackButton/CircleBackButton";
import { readingPath } from "@/lib/reading";

const arrow = `${circleLook("small")} disabled:cursor-not-allowed disabled:bg-secondary-sand disabled:text-text-secondary disabled:shadow-none`;

/**
 * The sticky top of a reading screen: Back on the left, "S3 · 3 of 10" in the middle and the
 * previous / next topic arrows on the right. The arrows replace the history entry, so Back keeps
 * going to where the reader came from. The bottom line shows only after the page has scrolled, and
 * it is always there (transparent) so the header never changes height.
 */
export function ReadingHeader({
  label,
  previousId,
  nextId,
  scrolled,
  onBack,
}: {
  label: string;
  previousId: string | null;
  nextId: string | null;
  scrolled: boolean;
  onBack: () => void;
}) {
  const router = useRouter();
  const go = (id: string | null) => () => {
    if (!id) return;
    router.replace(readingPath(id));
    window.scrollTo(0, 0);
  };
  return (
    <header
      data-reading-header
      data-full-bleed
      className={`sticky top-0 z-20 -mt-[calc(1.5rem+env(safe-area-inset-top))] mb-6 flex h-[calc(56px+env(safe-area-inset-top))] shrink-0 items-center border-b bg-bg px-[var(--gutter,1rem)] pt-[env(safe-area-inset-top)] -mx-[var(--gutter,1rem)] ${scrolled ? "border-selectable-stroke" : "border-transparent"}`}
    >
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="justify-self-start">
          <CircleBackButton size="small" label="Back" onClick={onBack} />
        </div>
        <p className="type-small text-text-secondary tabular-nums">{label}</p>
        <div className="flex gap-2 justify-self-end">
          <button
            type="button"
            aria-label="Previous topic"
            disabled={!previousId}
            onClick={go(previousId)}
            className={arrow}
          >
            <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next topic"
            disabled={!nextId}
            onClick={go(nextId)}
            className={arrow}
          >
            <ChevronRight size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
