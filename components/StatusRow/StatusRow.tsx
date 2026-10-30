import type { ReactNode } from "react";

/**
 * The two text lines of a list row with a status (DESIGN.md: One status chip for the whole app):
 * line 1 the name (one line, cut with an ellipsis when too long) and, optionally, a small mark after
 * it; line 2 a wrapping row with the status chip and then the muted description, 8px apart and
 * aligned on the text baseline. A description that does not fit beside the chip wraps under it. The
 * Students list, the topic students list, the exam results list and the exams of the Student detail
 * all use it.
 */
export function StatusRow({
  name,
  chip,
  description,
  after,
}: {
  name: string;
  chip: ReactNode;
  description?: string | null;
  after?: ReactNode;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
      <span className="flex min-w-0 items-center gap-2">
        <span className="type-body-strong truncate leading-tight">{name}</span>
        {after}
      </span>
      <span data-row-status className="type-small flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {chip}
        {description && (
          <span data-description className="min-w-0 text-pretty text-text-secondary">
            {description}
          </span>
        )}
      </span>
    </span>
  );
}
