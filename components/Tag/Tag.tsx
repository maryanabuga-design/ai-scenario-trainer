import type { ReactNode } from "react";

/**
 * A category label on the one neutral surface. `sentenceCase` keeps the text as written (only
 * the direction chip on Home).
 */
export function Tag({
  sentenceCase = false,
  children,
}: {
  sentenceCase?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-neutral-surface px-2.5 py-1 type-label text-text ${sentenceCase ? "normal-case" : ""}`}
    >
      {children}
    </span>
  );
}
