"use client";

import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { FIELDS, fullLabels } from "@/lib/field-of-work";
import type { FieldOfWork } from "@/lib/field-of-work";

/** The five fields as single-choice rows of exactly 72px (the role cards' selection circle). Used by the registration step and the Profile picker. */
export function FieldRows({
  value,
  onChange,
  labelledBy,
}: {
  value: FieldOfWork | null;
  onChange: (field: FieldOfWork) => void;
  labelledBy: string;
}) {
  return (
    <fieldset role="radiogroup" aria-labelledby={labelledBy} className="flex flex-col gap-2">
      {FIELDS.map((field) => (
        <SelectableRow
          key={field}
          name="field-of-work"
          value={field}
          tall
          checked={value === field}
          onChange={() => onChange(field)}
        >
          <span data-field={field} className="type-body-strong min-w-0 flex-1">
            {fullLabels[field]}
          </span>
        </SelectableRow>
      ))}
    </fieldset>
  );
}
