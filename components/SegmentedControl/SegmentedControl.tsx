import { Check } from "lucide-react";

/**
 * A full-width choice between a few options. Native radio buttons underneath, so arrow keys move
 * the selection and Tab enters and leaves the group. The selected option is a black pill with a
 * check icon and medium weight, so the state does not rely on colour alone.
 */
export function SegmentedControl<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-medium">{legend}</legend>
      <div className="flex gap-1 rounded-full bg-surface-muted p-1">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-base has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                checked ? "bg-primary font-medium text-primary-text" : "text-text hover:bg-border"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {checked && <Check size={16} strokeWidth={2} aria-hidden="true" />}
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
