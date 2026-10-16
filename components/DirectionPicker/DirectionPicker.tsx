"use client";

import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { directions } from "@/lib/directions";

/** The four directions. Only the available one can be chosen. */
export function DirectionPicker({
  value,
  onChange,
  legend,
}: {
  value: string;
  onChange: (id: string) => void;
  legend: string;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="type-body-strong mb-3">{legend}</legend>
      {directions.map((direction) => (
        <SelectableRow
          key={direction.id}
          name="direction"
          value={direction.id}
          checked={value === direction.id}
          disabled={!direction.available}
          onChange={onChange}
        >
          <span className="flex flex-col gap-0.5">
            <span>{direction.title}</span>
            {!direction.available && (
              <span className="type-small">Not available in this prototype</span>
            )}
          </span>
        </SelectableRow>
      ))}
    </fieldset>
  );
}
