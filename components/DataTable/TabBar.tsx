"use client";

import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export type TabOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
  /** The tab's accessible name when it differs from the label ("Steps, 2 to review"). */
  ariaLabel?: string;
};

/**
 * The desktop tab bar (DESIGN.md: Responsive instructor, step 5): an underline style tab list, drawn
 * only from 1024px in the instructor shell (the phone keeps the segmented control). The active tab
 * has a 2px Primary underline and the text colour; arrow keys, Home and End move between the tabs
 * (the tab content follows at once); `TabPanel` is the region it controls.
 */
export function TabBar<T extends string>({
  label,
  options,
  value,
  onChange,
  panelId,
}: {
  label: string;
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  panelId: string;
}) {
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options
    .map((option, index) => ({ option, index }))
    .filter((e) => !e.option.disabled);

  const onKeyDown = (event: KeyboardEvent) => {
    const at = enabled.findIndex((entry) => entry.option.value === value);
    let next = -1;
    if (event.key === "ArrowRight") next = (at + 1) % enabled.length;
    else if (event.key === "ArrowLeft") next = (at - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const target = enabled[next];
    onChange(target.option.value);
    refs.current[target.index]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      data-tab-bar
      data-desk-only
      onKeyDown={onKeyDown}
      className="hidden border-b border-selectable-stroke idesk:flex"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${base}-${option.value}`}
            aria-selected={selected}
            aria-controls={panelId}
            aria-label={option.ariaLabel}
            tabIndex={selected ? 0 : -1}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`type-body -mb-px min-h-11 cursor-pointer border-b-2 px-5 hover:bg-secondary-sand focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-text-secondary disabled:opacity-60 disabled:hover:bg-transparent ${
              selected
                ? "type-body-strong border-primary text-primary"
                : "border-transparent text-text-secondary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** The region a tab bar controls: it is only a wrapper, so the phone layout is the same. */
export function TabPanel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} role="tabpanel" className="contents idesk:flex idesk:flex-col idesk:gap-4">
      {children}
    </div>
  );
}
