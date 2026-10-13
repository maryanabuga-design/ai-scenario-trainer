import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** A calm empty state: a large decorative icon, one line of text and an optional action. */
export function EmptyState({
  icon: Icon,
  text,
  action,
}: {
  icon: LucideIcon;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span
        aria-hidden="true"
        className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-icon-tile text-primary"
      >
        <Icon size={40} strokeWidth={2} />
      </span>
      <p className="text-text-secondary">{text}</p>
      {action}
    </div>
  );
}
