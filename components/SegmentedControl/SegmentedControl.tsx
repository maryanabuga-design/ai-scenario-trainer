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
      <legend className="type-body-strong mb-3">{legend}</legend>
      <div className="flex gap-1 rounded-full border border-secondary-sand-pressed bg-secondary-sand p-1">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 type-body has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                checked
                  ? "type-body-strong bg-primary text-primary-text"
                  : "text-text active:bg-secondary-sand-pressed"
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
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
