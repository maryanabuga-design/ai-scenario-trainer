"use client";

import { Button } from "@/components/Button/Button";
import { FieldRows } from "@/components/FieldOfWork/FieldRows";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import type { FieldOfWork } from "@/lib/field-of-work";

/**
 * The field picker of Profile (DESIGN.md: Field of work): the band with Back, the five rows (a choice
 * applies at once) and a Secondary "Clear selection" that is hidden while nothing is chosen.
 */
export function FieldPickerView({
  value,
  onChange,
  onClear,
  back,
}: {
  value: FieldOfWork | null;
  onChange: (field: FieldOfWork) => void;
  onClear: () => void;
  back: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title="Field of work"
        subtitle="Used to tune examples in Ask AI."
        back={back}
      />
      <span id="field-picker-label" className="sr-only">
        Field of work
      </span>
      <FieldRows value={value} onChange={onChange} labelledBy="field-picker-label" />
      {value !== null && (
        <Button variant="secondary" onClick={onClear}>
          Clear selection
        </Button>
      )}
    </div>
  );
}
