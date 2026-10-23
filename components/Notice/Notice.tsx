import { Check, CircleAlert, Info, X } from "lucide-react";
import type { ReactNode } from "react";

export type NoticeVariant = "info" | "to-fix" | "success";

/** The colour of the icon tile carries the variant; the card itself is always white. */
const tile: Record<NoticeVariant, string> = {
  info: "bg-neutral-tile-bg text-neutral-tile-ink",
  "to-fix": "bg-status-attention-bg text-status-attention-ink",
  success: "bg-status-success-bg text-status-success-ink",
};

const icons = { info: Info, "to-fix": CircleAlert, success: Check } as const;

/**
 * The one hint of the content package flow (DESIGN.md: Calmer package review screens): a white
 * card with a 40px round icon tile whose colour carries the variant (neutral, amber or sage), the
 * title in the normal text colour on one line, a muted body of at most two lines (`clamp` off for a
 * body that must be read in full), one optional action under the body and, for "info" and
 * "success" only, a small neutral close circle in the top-right corner with a 44px tap area. A
 * "to fix" notice that blocks publishing never closes. `role="status"` for info and success;
 * `role="alert"` only for a "to fix" notice that appears as the result of an action.
 */
export function Notice({
  variant,
  title,
  children,
  action,
  onClose,
  alert = false,
  clamp = true,
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
  /** The body shows at most two lines (default); false for a body that must be read in full. */
  clamp?: boolean;
  id?: string;
}) {
  const Icon = icons[variant];
  const closable = variant !== "to-fix" && onClose !== undefined;
  const role = variant === "to-fix" ? (alert ? "alert" : undefined) : "status";
  return (
    <section
      id={id}
      data-notice={variant}
      role={role}
      className="relative flex items-start gap-3 rounded-[16px] border border-selectable-stroke bg-card p-4 text-text"
    >
      <span
        aria-hidden="true"
        data-notice-tile
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tile[variant]}`}
      >
        <Icon size={20} strokeWidth={2} />
      </span>
      <div className={`flex min-w-0 flex-1 flex-col gap-0.5 ${closable ? "pr-8" : ""}`}>
        <h2 className="type-body-strong truncate">{title}</h2>
        {children && (
          <div className={`type-small text-text-secondary ${clamp ? "line-clamp-2" : ""}`}>
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
          className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center has-focus-visible:outline-2 focus-visible:outline-2"
        >
          <span
            aria-hidden="true"
            data-notice-close
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-tile-bg text-neutral-tile-ink"
          >
            <X size={14} strokeWidth={2.25} />
          </span>
        </button>
      )}
    </section>
  );
}
