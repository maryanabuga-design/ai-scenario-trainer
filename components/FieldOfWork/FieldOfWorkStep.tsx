"use client";

import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { FieldRows } from "@/components/FieldOfWork/FieldRows";
import type { FieldOfWork } from "@/lib/field-of-work";

export const STEP_TITLE = "Tell us about your work";
export const STEP_SUBTITLE =
  "We use this to tune examples in Ask AI. You can change it later in Profile.";
export const STEP_NOTE = "All content in this app is educational and non-combat.";

/**
 * The registration step "Field of work" (DESIGN.md: Field of work): no picture and no Back (the code
 * is verified), the title, five 72px rows with none chosen, the educational note, and the pinned
 * Primary "Continue" (disabled until a row is chosen) over the Secondary "Skip for now".
 */
export function FieldOfWorkStep({
  onContinue,
  onSkip,
  initial = null,
}: {
  onContinue: (field: FieldOfWork) => void;
  onSkip: () => void;
  /** Only for the screen review page. */
  initial?: FieldOfWork | null;
}) {
  const [field, setField] = useState<FieldOfWork | null>(initial);
  return (
    <div className="flex flex-col gap-6 pb-4">
      <header className="flex flex-col gap-2 pt-2">
        <h1 id="field-title" className="type-page-title">
          {STEP_TITLE}
        </h1>
        <p className="type-body text-text-secondary">{STEP_SUBTITLE}</p>
      </header>
      <FieldRows value={field} onChange={setField} labelledBy="field-title" />
      <p data-field-note className="type-small text-text-secondary">
        {STEP_NOTE}
      </p>
      <ActionBar>
        <Button disabled={field === null} onClick={() => field && onContinue(field)}>
          Continue
        </Button>
        <Button variant="secondary" onClick={onSkip}>
          Skip for now
        </Button>
      </ActionBar>
    </div>
  );
}
