"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

/** The one field look of the Invite screen (DESIGN.md: Invite students): 52px, 14px radius, 16px padding. */
export const fieldBox =
  "type-body min-h-[52px] w-full rounded-[14px] border border-selectable-stroke bg-card text-text";

/** How long the copy icon shows a check (milliseconds). */
export const CHECK_MS = 1500;

/**
 * A read-only value (the group code, the invite link) with its uppercase label and ONE small copy
 * icon button inside the field at the right end. The text is cut with an ellipsis and never covers
 * the button. Copying is done by the caller; this swaps the icon to a check for a moment.
 */
export function CopyField({
  label,
  name,
  value,
  copyLabel,
  onCopy,
  valueAttr,
}: {
  label: string;
  name: string;
  value: string;
  /** The accessible name of the icon button ("Copy group code"). */
  copyLabel: string;
  /** Resolves true when the text was copied. */
  onCopy: () => Promise<boolean>;
  /** A data attribute name to put on the input (for the review and the tests). */
  valueAttr: string;
}) {
  const id = useId();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    if (!(await onCopy())) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), CHECK_MS);
  }

  const Icon = copied ? Check : Copy;
  return (
    <section className="flex flex-col gap-2">
      <h2 id={id} className="type-label text-text-secondary">
        {label}
      </h2>
      <div
        className={`${fieldBox} flex h-[52px] items-center gap-2 pr-1.5 pl-4 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-0 has-[input:focus-visible]:outline-primary`}
      >
        <input
          aria-labelledby={id}
          name={name}
          readOnly
          value={value}
          {...{ [valueAttr]: "" }}
          className="min-w-0 flex-1 h-full truncate bg-transparent text-ellipsis whitespace-nowrap focus-visible:outline-none!"
        />
        <button
          type="button"
          aria-label={copyLabel}
          data-copy-button
          data-copied={copied ? "" : undefined}
          onClick={() => void copy()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-secondary-sand text-text-secondary"
          >
            <Icon size={16} strokeWidth={2} />
          </span>
        </button>
      </div>
    </section>
  );
}
