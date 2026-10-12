import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";

/** Leaves of a plant, drawn as soft shapes; blurred, they read as a shadow on a wall. */
const leaves = [
  { cx: 160, cy: 30, rx: 34, ry: 11, rotate: -35 },
  { cx: 190, cy: 62, rx: 40, ry: 12, rotate: 20 },
  { cx: 140, cy: 78, rx: 30, ry: 10, rotate: -60 },
  { cx: 205, cy: 112, rx: 36, ry: 11, rotate: 50 },
  { cx: 168, cy: 128, rx: 28, ry: 9, rotate: -20 },
  { cx: 222, cy: 18, rx: 30, ry: 9, rotate: 70 },
];

/**
 * The soft light header of the Results screen: a warm beige blend with a blurred plant shadow
 * and a thin window-frame line in the top right, both decorative and kept away from the text.
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
    <header className="relative -mx-4 -mt-6 overflow-hidden bg-linear-to-b from-(--header-light) to-(--header-deep) px-4 pt-4 pb-11">
      <svg
        aria-hidden="true"
        viewBox="0 0 240 190"
        preserveAspectRatio="xMaxYMin slice"
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[62%]"
      >
        <defs>
          <filter id="plant-shadow-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        <g
          filter="url(#plant-shadow-blur)"
          opacity="0.18"
          style={{ fill: "var(--header-shadow)", stroke: "var(--header-shadow)" }}
        >
          <path d="M240 150 C 210 120, 190 90, 175 20" fill="none" strokeWidth="3" />
          <path d="M200 110 C 180 95, 160 85, 140 78" fill="none" strokeWidth="2" />
          {leaves.map((leaf) => (
            <ellipse
              key={`${leaf.cx}-${leaf.cy}`}
              cx={leaf.cx}
              cy={leaf.cy}
              rx={leaf.rx}
              ry={leaf.ry}
              stroke="none"
              transform={`rotate(${leaf.rotate} ${leaf.cx} ${leaf.cy})`}
            />
          ))}
        </g>
        <rect
          x="198"
          y="0"
          width="2"
          height="190"
          opacity="0.3"
          style={{ fill: "var(--header-shadow)" }}
        />
      </svg>
      <div className="relative flex flex-col items-start gap-3">
        <CircleBackButton href="/" label="Back to Home" />
        <div className="flex max-w-[80%] flex-col gap-1.5">
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
