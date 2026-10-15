/** A ring with a percentage inside: an arc in `--primary` on a sand track. */
export function Ring({
  percent,
  size = 40,
  label,
}: {
  percent: number;
  /** 40 for Session setup, 56 for the Home card. */
  size?: 40 | 56;
  /** The accessible name, for example "32% of the guide practised". */
  label: string;
}) {
  const stroke = size === 56 ? 4 : 3;
  const radius = size / 2 - stroke / 2 - 1;
  const length = 2 * Math.PI * radius;
  return (
    <div
      role="img"
      aria-label={label}
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-secondary-sand-pressed"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * length} ${length}`}
          className="stroke-primary"
        />
      </svg>
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center tabular-nums ${
          size === 56 ? "type-caption" : "type-micro"
        }`}
      >
        {percent}%
      </span>
    </div>
  );
}
