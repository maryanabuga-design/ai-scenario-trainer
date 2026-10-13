import { Check } from "lucide-react";
import type { Confidence } from "@/lib/scenario";
import { scenario } from "@/lib/scenario";

const levels: Confidence[] = [1, 2, 3];

/** Three labelled pills. The selected one is the black pill. No traffic-light colours. */
export function ConfidenceSelector({
  name,
  value,
  onChange,
  legend = "How sure are you?",
}: {
  legend?: string;
  name: string;
  value: Confidence | null;
  onChange: (value: Confidence) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="type-body-strong mb-3">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => {
          const checked = value === level;
          return (
            <label
              key={level}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 type-small has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                checked
                  ? "border-primary bg-primary text-primary-text"
                  : "border-border-strong bg-transparent text-text active:bg-secondary-pressed"
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
              {checked && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
              {scenario.confidenceScale[`${level}`]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
