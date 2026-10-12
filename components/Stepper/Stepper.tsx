/** "−" and "+" buttons around a number. The buttons stop at the limits. */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const button =
    "type-card-title flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text hover:border-text-secondary disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-muted disabled:text-text-secondary";
  return (
    <div role="group" aria-label={label} className="flex items-center gap-4">
      <button
        type="button"
        aria-label="One fewer"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={button}
      >
        −
      </button>
      <span aria-live="polite" className="type-card-title min-w-8 text-center tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="One more"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={button}
      >
        +
      </button>
    </div>
  );
}
