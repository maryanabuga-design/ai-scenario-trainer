import type { Confidence } from "@/lib/scenario";
import { scenario } from "@/lib/scenario";

const levels: Confidence[] = [1, 2, 3];

/** Three labelled pills. The selected one is the black pill. No traffic-light colours. */
export function ConfidenceSelector({
  name,
  value,
  onChange,
}: {
  name: string;
  value: Confidence | null;
  onChange: (value: Confidence) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-medium">How sure are you?</legend>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => {
          const checked = value === level;
          return (
            <label
              key={level}
              className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                checked
                  ? "border-primary bg-primary text-primary-text"
                  : "border-border bg-surface text-text hover:border-text-secondary"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={level}
                checked={checked}
                onChange={() => onChange(level)}
                className="sr-only"
              />
              {scenario.confidenceScale[`${level}`]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
