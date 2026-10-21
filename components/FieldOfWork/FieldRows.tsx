"use client";

import { Compass, HeartPulse, LifeBuoy, Shield, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { FIELDS, fullLabels } from "@/lib/field-of-work";
import type { FieldOfWork } from "@/lib/field-of-work";

/** The icon of each field (decorative; a neutral protective shield for Military, no combat imagery). */
export const fieldIcons: Record<FieldOfWork, LucideIcon> = {
  rescue: LifeBuoy,
  paramedic: HeartPulse,
  military: Shield,
  civil: UsersRound,
  other: Compass,
};

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
      {FIELDS.map((field) => {
        const Icon = fieldIcons[field];
        return (
          <SelectableRow
            key={field}
            name="field-of-work"
            value={field}
            tall
            checked={value === field}
            onChange={() => onChange(field)}
          >
            <span
              aria-hidden="true"
              data-field-icon={field}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand-200 text-sand-900"
            >
              <Icon size={24} strokeWidth={1.75} />
            </span>
            <span data-field={field} className="type-body-strong min-w-0 flex-1">
              {fullLabels[field]}
            </span>
          </SelectableRow>
        );
      })}
    </fieldset>
  );
}
