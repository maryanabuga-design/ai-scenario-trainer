import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

/** A problem line in the attention tone (amber): an icon plus text, announced politely. */
export function Amber({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p
      id={id}
      data-amber
      aria-live="polite"
      className="type-small flex items-start gap-1.5 text-status-attention-ink"
    >
      <CircleAlert size={16} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
