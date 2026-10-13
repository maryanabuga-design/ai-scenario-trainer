import type { ReactNode } from "react";

/**
 * A title with a button on the right, and an optional subtitle on its own line below the whole
 * row. The button never wraps or shrinks; the title takes the rest and may wrap.
 */
export function HeaderRow({
  title,
  action,
  subtitle,
}: {
  title: ReactNode;
  action?: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 break-words hyphens-auto">{title}</div>
        {action && (
          // Only the button itself keeps its label on one line: an action may also render its
          // sheet (Upload a file), which must wrap normally.
          <div className="shrink-0 [&>a]:whitespace-nowrap [&>button]:whitespace-nowrap [&>div>button]:whitespace-nowrap">
            {action}
          </div>
        )}
      </div>
      {subtitle}
    </div>
  );
}
