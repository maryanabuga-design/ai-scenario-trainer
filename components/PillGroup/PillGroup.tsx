import { Check } from "lucide-react";
/** A row of option chips (radio buttons). The selected one is the dark green pill with a check. */
export function PillGroup<T extends string | number>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: { value: T; label: string; disabled?: boolean }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="type-body-strong mb-3">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={String(option.value)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 type-small has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                option.disabled
                  ? "cursor-not-allowed border-transparent bg-surface-muted text-text-secondary"
                  : checked
                    ? "cursor-pointer border-primary bg-primary text-primary-text"
                    : "cursor-pointer border-border-strong bg-transparent text-text active:bg-secondary-pressed"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={String(option.value)}
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {checked && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
