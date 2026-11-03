/**
 * The topic code (S1 ... S10) as a circle (DESIGN.md: One icon tile, a round topic code and a shared
 * note): 36px, or 32px in a compact row, with a 50% radius so the width always equals the height.
 * The code is centred in 12px semibold with tabular figures and never wraps; the size does not
 * depend on the text, so S10 fits. Decorative: the topic name sits next to it.
 */
export function TopicCodeBadge({ id, compact = false }: { id: string; compact?: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-topic-code={id}
      className={`type-caption-strong flex shrink-0 items-center justify-center rounded-full bg-chip-neutral-bg text-chip-neutral-ink whitespace-nowrap tabular-nums ${
        compact ? "h-8 w-8" : "h-9 w-9"
      }`}
    >
      {id}
    </span>
  );
}
