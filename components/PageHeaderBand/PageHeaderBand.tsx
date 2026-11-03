import type { ReactNode } from "react";
import { HeaderActionsSlot } from "@/components/ActionBar/ActionBar";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";

type Back = { label: string } & ({ href: string } | { onClick: () => void });

/**
 * The page header band (DESIGN.md: Page header band): a full-width band in the Primary colour that
 * runs edge to edge and up under the status bar, with the white Back circle, the title and an
 * optional subtitle in white. It is an intentional full-bleed element; its content keeps the page
 * gutters. `overlap` gives it extra bottom padding for a card that sits over its bottom edge. Without
 * `back` it is the tab root variant (Materials, Progress, Profile, Instructor Home): the same band
 * with just the title and the subtitle, no Back button; `action` is the avatar button at its top right.
 * From 1024px in the instructor shell there is NO band (DESIGN.md: Responsive instructor, page
 * header): the same markup becomes a header on the page background, the Back circle on its own row,
 * the title and subtitle at the left, the page actions and then `action` at the right, and a
 * divider below. CSS only (the `idesk:` variant).
 */
export function PageHeaderBand({
  title,
  subtitle,
  helper,
  back,
  action,
  titleAccessory,
  meta,
  overlap = false,
}: {
  title: string;
  subtitle?: ReactNode;
  /** A muted line under the title, 8px below it, at most two lines (the Import helper). */
  helper?: ReactNode;
  back?: Back;
  /** A control at the top right (the avatar button on the tab screens). */
  action?: ReactNode;
  /** A small control on the title's row (the Students band's group pill). */
  titleAccessory?: ReactNode;
  /** A status under the subtitle that only the desktop header shows (the exam detail's state pill). */
  meta?: ReactNode;
  overlap?: boolean;
}) {
  return (
    <div
      data-page-header-band
      data-full-bleed
      className={`-mx-[var(--gutter,1rem)] -mt-[calc(1.5rem+env(safe-area-inset-top))] flex flex-col gap-4 border-b border-selectable-stroke bg-secondary-sand px-[var(--gutter,1rem)] pt-[calc(1.5rem+env(safe-area-inset-top))] ${overlap ? "pb-14" : "pb-[var(--gutter,1rem)]"} idesk:col-span-full idesk:mx-0 idesk:mt-0 idesk:mb-2 idesk:grid idesk:grid-cols-[minmax(0,1fr)_auto] idesk:items-center idesk:gap-x-4 idesk:gap-y-3 idesk:bg-transparent idesk:px-0 idesk:pt-0 idesk:pb-4`}
    >
      {back && (
        <div className="flex items-center justify-between gap-3 idesk:contents">
          <div className="idesk:col-span-2">
            <CircleBackButton size="small" {...back} />
          </div>
          <div className="contents idesk:col-start-2 idesk:row-start-2 idesk:flex idesk:items-center idesk:gap-3 idesk:self-center">
            <HeaderActionsSlot />
            {action}
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-3 idesk:contents">
        <div className="flex min-w-0 flex-col gap-1 idesk:col-start-1">
          {titleAccessory ? (
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="type-page-title text-text">{title}</h1>
              {titleAccessory}
            </div>
          ) : (
            <h1 className="type-page-title text-text line-clamp-2">{title}</h1>
          )}
          {subtitle && <p className="type-body text-text">{subtitle}</p>}
          {meta && (
            <div className="hidden idesk:mt-1 idesk:flex idesk:items-center idesk:gap-3">
              {meta}
            </div>
          )}
          {helper && (
            <p data-helper className="type-body mt-1 line-clamp-2 text-text-secondary">
              {helper}
            </p>
          )}
        </div>
        {!back && (
          <div className="contents idesk:col-start-2 idesk:flex idesk:items-center idesk:gap-3 idesk:self-center">
            <HeaderActionsSlot />
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
