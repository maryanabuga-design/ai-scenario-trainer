import type { ReactNode } from "react";
import { Media3D } from "@/components/Media3D/Media3D";

/**
 * The hero panel of Welcome and the onboarding slides (DESIGN.md: Hero panel and 3D slots):
 * full-bleed to the top and both sides, the Home hero card colour, a 1px bottom border, the bottom
 * corners rounded by 32px, taking ALL the free height of the page (`flex: 1 1 auto`, at least the slot
 * plus 64px), with the 280 by 280 3D slot (down to 200px on short screens) centred in it. The page padding (16px at the sides, 24px at the top, plus the safe area) is cancelled with
 * negative margins. `action` is the corner button of the onboarding (Skip).
 */
export function HeroPanel({
  slot,
  action,
  priority = false,
  slotKey,
  slotClassName = "",
  children,
}: {
  /** The picture file of the slot, when it exists; without one the dashed placeholder shows. */
  slot?: string;
  action?: ReactNode;
  /** The picture loads at once (the first visible screen of a flow). */
  priority?: boolean;
  /** A new key replays the slot's entrance (the onboarding slides). */
  slotKey?: string | number;
  slotClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-hero-panel
      className="relative -mx-[var(--gutter,1rem)] -mt-[calc(1.5rem+env(safe-area-inset-top))] flex min-h-[calc(max(200px,min(280px,36dvh))+64px)] flex-1 basis-auto items-center justify-center rounded-b-[32px] border-b border-selectable-stroke bg-secondary-sand pt-[calc(env(safe-area-inset-top)+16px)]"
    >
      {action && (
        <div className="absolute top-[calc(env(safe-area-inset-top)+16px)] right-4 z-10">
          {action}
        </div>
      )}
      <div
        key={slotKey}
        className={`pointer-events-none absolute inset-0 flex items-center justify-center ${slotClassName}`}
      >
        <Media3D variant="panel" src={slot} priority={priority} />
      </div>
      {children}
    </div>
  );
}
