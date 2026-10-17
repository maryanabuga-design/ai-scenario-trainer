import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";

type Back = { label: string } & ({ href: string } | { onClick: () => void });

/**
 * The page header band (DESIGN.md: Page header band): a full-width band in the Primary colour that
 * runs edge to edge and up under the status bar, with the white Back circle, the title and an
 * optional subtitle in white. It is an intentional full-bleed element; its content keeps the page
 * gutters. `overlap` gives it extra bottom padding for a card that sits over its bottom edge.
 */
export function PageHeaderBand({
  title,
  subtitle,
  back,
  overlap = false,
}: {
  title: string;
  subtitle?: string;
  back: Back;
  overlap?: boolean;
}) {
  return (
    <div
      data-page-header-band
      data-full-bleed
      className={`-mx-[var(--gutter,1rem)] -mt-[calc(1.5rem+env(safe-area-inset-top))] flex flex-col gap-4 bg-band-olive-100 px-[var(--gutter,1rem)] pt-[calc(1.5rem+env(safe-area-inset-top))] ${overlap ? "pb-14" : "pb-[var(--gutter,1rem)]"}`}
    >
      <div>
        <CircleBackButton size="small" {...back} />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="type-page-title text-text line-clamp-2">{title}</h1>
        {subtitle && <p className="type-body text-text">{subtitle}</p>}
      </div>
    </div>
  );
}
