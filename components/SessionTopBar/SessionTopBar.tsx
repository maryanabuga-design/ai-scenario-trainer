import { BackLink } from "@/components/BackLink/BackLink";

/** Exit on the left, step count and progress dots on the right. Exit keeps the saved session. */
export function SessionTopBar({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <BackLink href="/materials/evacuation-guide" label="Exit" />
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary tabular-nums">
          Step {index + 1} of {total}
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
