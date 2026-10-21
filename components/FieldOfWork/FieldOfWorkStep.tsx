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
 * is verified), "Skip" at the top right like the onboarding, the title, five 72px rows with an icon
 * each and none chosen, the educational note, and the pinned Primary "Continue" alone (disabled until
 * a row is chosen).
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
      {/* the onboarding's corner: the same row, the same tertiary Skip */}
      <div data-top-row className="-mt-2 flex h-11 shrink-0 items-center justify-end">
        <Button variant="tertiary" onClick={onSkip}>
          Skip
        </Button>
      </div>
      <header className="-mt-4 flex flex-col gap-2">
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
      </ActionBar>
    </div>
  );
}
