"use client";

import { useId } from "react";

/**
 * A full-width choice between a few options. Native radio buttons underneath, so arrow keys move
 * the selection and Tab enters and leaves the group. The selected option is a black pill with a
 * check icon and medium weight, so the state does not rely on colour alone.
 */
export function SegmentedControl<T extends string>({
  name,
  legend,
  hideLegend = false,
  options,
  value,
  onChange,
  dense = false,
}: {
  name: string;
  legend: string;
  /** Keep the legend for screen readers only. */
  hideLegend?: boolean;
  options: { value: T; label: string; disabled?: boolean }[];
  value: T | null;
  onChange: (value: T) => void;
  /** Less side padding, so three longer labels ("3 attempts") fit on one line at 360px. */
  dense?: boolean;
}) {
  // Pages kept for Back can share a name; a radio group is one per page.
  const group = useId();
  return (
    <fieldset role="radiogroup" className="flex flex-col gap-3">
      <legend className={hideLegend ? "sr-only" : "type-body-strong mb-3"}>{legend}</legend>
      <div className="flex gap-1 rounded-[14px] border border-secondary-sand-pressed bg-secondary-sand p-1">
        {options.map((option) => {
          const checked = option.value === value;
          const off = option.disabled === true;
          return (
            <label
              key={option.value}
              className={`flex min-h-11 flex-1 ${off ? "cursor-not-allowed opacity-45" : "cursor-pointer"} items-center justify-center gap-1.5 rounded-[10px] ${dense ? "px-1 whitespace-nowrap" : "px-3"} type-body has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                checked
                  ? "type-body-strong bg-primary text-primary-text"
                  : "text-text active:bg-secondary-sand-pressed"
              }`}
            >
              <input
                type="radio"
                name={`${name}-${group}`}
                value={option.value}
                checked={checked}
                disabled={off}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
