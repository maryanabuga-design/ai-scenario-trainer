"use client";

import { CircleAlert } from "lucide-react";
import { useId } from "react";
import type { ReactNode } from "react";

/**
 * A form field (DESIGN.md: Accounts, form pieces): a VISIBLE label above a 48px input, an optional
 * helper, and a message area that is always in the page (`aria-live`), so a new error is announced.
 * An error is an icon plus text, never colour alone; `aria-invalid` and `aria-describedby` point at it.
 */
export function TextField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  helper,
  type = "text",
  min,
  inputMode,
  autoComplete,
  readOnly = false,
  autoFocus = false,
  action,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  /** The message under the field, or null when the value is fine. */
  error?: ReactNode;
  helper?: string;
  type?: "text" | "email" | "date";
  /** The earliest date of a date field (YYYY-MM-DD). */
  min?: string;
  inputMode?: "text" | "email";
  autoComplete?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  /** A link under the message (for example Sign in instead). */
  action?: ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const describedBy = [error ? errorId : null, helper ? helperId : null].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="type-small-strong mb-1.5">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        min={min}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        autoCapitalize={type === "email" ? "none" : undefined}
        spellCheck={false}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={onBlur}
        className={`type-body h-[52px] w-full rounded-[14px] border px-[var(--gutter,1rem)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary ${
          readOnly
            ? "border-secondary-sand-pressed bg-secondary-sand text-text-secondary"
            : `bg-card text-text ${error ? "border-wrong" : "border-selectable-stroke"}`
        }`}
      />
      {helper && (
        <p id={helperId} className="type-small mt-1.5 text-text-secondary">
          {helper}
        </p>
      )}
      <p
        id={errorId}
        aria-live="polite"
        className="type-small flex items-start gap-1.5 text-wrong not-empty:mt-1.5"
      >
        {error && (
          <>
            <CircleAlert size={16} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </>
        )}
      </p>
      {action && <div className="-ml-3 self-start">{action}</div>}
    </div>
  );
}
