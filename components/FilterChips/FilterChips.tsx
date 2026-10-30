"use client";

/**
 * The single-choice filter chips (DESIGN.md: Students screen redesigned): a row of toggle buttons
 * with `aria-pressed` in one labelled group, each pill 40px high inside a 44px tap area. The chips wrap onto more lines (8px between pills both ways). Active: the
 * Secondary tint fill, a 1.5px olive border and semi-bold text, no check icon. Inactive: white, a 1px
 * light border and regular text.
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
  return (
    <div
      role="group"
      aria-label={legend}
      data-filter-chips={name}
      className="flex flex-wrap gap-x-2 gap-y-1"
    >
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            data-filter-chip={option.value}
            aria-pressed={pressed}
            onClick={() => onChange(option.value)}
            className="flex min-h-11 cursor-pointer items-center focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
          >
            <span
              className={`flex h-10 items-center rounded-full px-4 whitespace-nowrap ${
                pressed
                  ? "type-small-strong border border-chip-active-stroke bg-olive-tint text-text"
                  : "type-small border border-selectable-stroke bg-card text-text active:bg-secondary-sand"
              }`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
