import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";

/**
 * The light header of the Results screen: one flat soft warm beige band, with no image or other
 * graphics. The progress card overlaps its bottom edge.
 */
export function ResultsHeader({
  overline,
  first,
  second,
}: {
  overline: string;
  first: string;
  second: string;
}) {
  return (
    <header className="-mx-4 -mt-6 bg-header-bg px-4 pt-4 pb-11">
      <div className="flex flex-col items-start gap-3">
        <CircleBackButton href="/" label="Back to Home" />
        <div className="flex flex-col gap-1.5">
          <p className="type-label text-header-overline">{overline}</p>
          <h1 className="flex flex-col gap-1">
            <span className="type-display text-text">{first}</span>
            <span className="type-display-sub text-header-subline">{second}</span>
          </h1>
        </div>
      </div>
    </header>
  );
}
