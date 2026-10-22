"use client";

import { Check } from "lucide-react";
import { useId } from "react";

/**
 * The single-choice filter pattern (DESIGN.md: Instructor, Students rebuilt; distinct from the
 * segmented view switch): a row of pills, each 40px high inside a 44px tap target. Native radio
 * buttons underneath, so arrow keys move the choice. The chosen pill is filled with the olive tint
 * and carries a check, so the state is not colour alone.
 */
export function FilterChips<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  /** The accessible name of the group (not shown). */
  legend: string;
  options: { value: T; label: string }[];
  /** The chosen option, or null when the filter in force is not one of the chips. */
  value: T | null;
  onChange: (value: T) => void;
}) {
  const group = useId();
  return (
    <fieldset role="radiogroup" className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-x-2">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              data-filter-chip={option.value}
              className="flex min-h-11 cursor-pointer items-center has-focus-visible:outline-2 has-focus-visible:outline-offset-0 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name={`${name}-${group}`}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={`type-small-strong flex h-10 items-center gap-1.5 rounded-full border px-4 whitespace-nowrap ${
                  checked
                    ? "border-transparent bg-olive-tint text-primary"
                    : "border-selectable-stroke bg-card text-text active:bg-secondary-sand"
                }`}
              >
                {checked && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
