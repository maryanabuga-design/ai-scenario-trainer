import type { ReactNode } from "react";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";

type Back = { label: string } & ({ href: string } | { onClick: () => void });

/**
 * The page header band (DESIGN.md: Page header band): a full-width band in the Primary colour that
 * runs edge to edge and up under the status bar, with the white Back circle, the title and an
 * optional subtitle in white. It is an intentional full-bleed element; its content keeps the page
 * gutters. `overlap` gives it extra bottom padding for a card that sits over its bottom edge. Without
 * `back` it is the tab root variant (Materials, Progress, Profile, Instructor Home): the same band
 * with just the title and the subtitle, no Back button; `action` is the avatar button at its top right.
 */
export function PageHeaderBand({
  title,
  subtitle,
  back,
  action,
  overlap = false,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: Back;
  /** A control at the top right (the avatar button on the tab screens). */
  action?: ReactNode;
  overlap?: boolean;
}) {
  return (
    <div
      data-page-header-band
      data-full-bleed
      className={`-mx-[var(--gutter,1rem)] -mt-[calc(1.5rem+env(safe-area-inset-top))] flex flex-col gap-4 border-b border-selectable-stroke bg-secondary-sand px-[var(--gutter,1rem)] pt-[calc(1.5rem+env(safe-area-inset-top))] ${overlap ? "pb-14" : "pb-[var(--gutter,1rem)]"}`}
    >
      {back && (
        <div className="flex items-center justify-between gap-3">
          <CircleBackButton size="small" {...back} />
          {action}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-page-title text-text line-clamp-2">{title}</h1>
          {subtitle && <p className="type-body text-text">{subtitle}</p>}
        </div>
        {!back && action}
      </div>
    </div>
  );
}
