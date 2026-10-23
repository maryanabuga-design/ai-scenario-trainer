import { Check, CircleAlert, Info, X } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "@/components/IconTile/IconTile";

export type NoticeVariant = "info" | "to-fix" | "success";

const look: Record<NoticeVariant, { card: string; tile: "neutral" | null; ink: string }> = {
  info: {
    card: "border border-selectable-stroke bg-card text-text",
    tile: "neutral",
    ink: "",
  },
  "to-fix": {
    card: "bg-status-attention-bg text-status-attention-ink",
    tile: null,
    ink: "bg-card text-status-attention-ink",
  },
  success: {
    card: "bg-status-success-bg text-status-success-ink",
    tile: null,
    ink: "bg-card text-status-success-ink",
  },
};

const icons = { info: Info, "to-fix": CircleAlert, success: Check } as const;

/**
 * The one hint of the content package flow (DESIGN.md: Content package review): a 40px round icon
 * tile (decorative), a bold title, a muted body, one optional action under the body (a Secondary
 * button or an underlined tertiary link, passed in) and an optional close button. Variants: "info"
 * (white card, neutral tile), "to fix" (amber) and "success" (sage). Only "info" and "success" can
 * be closed; a "to fix" notice that blocks publishing never can. `role="status"` for info and
 * success; `role="alert"` only for a "to fix" notice that appears as the result of an action.
 */
export function Notice({
  variant,
  title,
  children,
  action,
  onClose,
  alert = false,
  id,
}: {
  variant: NoticeVariant;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** Shown only for "info" and "success"; ignored for "to fix". */
  onClose?: () => void;
  /** A "to fix" notice that appears as the result of an action. */
  alert?: boolean;
  id?: string;
}) {
  const Icon = icons[variant];
  const style = look[variant];
  const closable = variant !== "to-fix" && onClose !== undefined;
  const role = variant === "to-fix" ? (alert ? "alert" : undefined) : "status";
  return (
    <section
      id={id}
      data-notice={variant}
      role={role}
      className={`flex items-start gap-3 rounded-card p-[var(--gutter,1rem)] ${style.card}`}
    >
      {style.tile ? (
        <IconTile tone="neutral" className="h-10 w-10 rounded-full">
          <Icon size={20} strokeWidth={2} />
        </IconTile>
      ) : (
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.ink}`}
        >
          <Icon size={20} strokeWidth={2} />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="type-body-strong">{title}</h2>
        {children && (
          <div
            className={`type-small ${variant === "info" ? "text-text-secondary" : "opacity-90"}`}
          >
            {children}
          </div>
        )}
        {action && <div className="mt-1 self-start">{action}</div>}
      </div>
      {closable && (
        <button
          type="button"
          aria-label={`Close: ${title}`}
          onClick={onClose}
          className="-mt-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full has-focus-visible:outline-2 focus-visible:outline-2"
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}
