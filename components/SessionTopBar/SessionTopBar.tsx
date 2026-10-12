import { BackLink } from "@/components/BackLink/BackLink";

/** Exit on the left, step count and progress dots on the right. Exit keeps the saved session and goes Home. */
export type Unit = "Step" | "Question" | "Item";

export function SessionTopBar({
  index,
  total,
  unit = "Step",
}: {
  index: number;
  total: number;
  unit?: Unit;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <BackLink href="/" label="Exit" />
      <div className="flex items-center gap-3">
        <span className="type-small text-text-secondary tabular-nums">
          {unit} {index + 1} of {total}
        </span>
        <ol aria-hidden="true" className="flex gap-1">
          {Array.from({ length: total }, (_, position) => (
            <li
              key={position}
              className={`h-1.5 w-4 rounded-full ${position <= index ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}
