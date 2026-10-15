"use client";

import { Button, ButtonLink } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { DirectionPicker } from "@/components/DirectionPicker/DirectionPicker";
import { FooterNote } from "@/components/Footer/Footer";

export function ProfileView({
  direction,
  onDirectionChange,
  confirming,
  onAskReset,
  onCancelReset,
  onReset,
  resetDone,
  dialogInline = false,
  savedCount = 0,
}: {
  direction: string;
  onDirectionChange: (id: string) => void;
  confirming: boolean;
  onAskReset: () => void;
  onCancelReset: () => void;
  onReset: () => void;
  resetDone: boolean;
  dialogInline?: boolean;
  /** How many questions are saved: shown on the temporary link to the Saved screen. */
  savedCount?: number;
}) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="type-page-title">Profile</h1>

      <div className="-ml-3 self-start">
        <ButtonLink href="/saved" variant="tertiary">
          Saved questions ({savedCount})
        </ButtonLink>
      </div>

      <DirectionPicker value={direction} onChange={onDirectionChange} legend="Direction" />

      <section aria-labelledby="settings-title" className="flex flex-col gap-3">
        <h2 id="settings-title" className="type-body-strong">
          Settings
        </h2>
        <div className="flex flex-col gap-3 rounded-card bg-card shadow-(--card-shadow) p-4">
          <div className="flex flex-col gap-1">
            <h3 className="type-body-strong">Reset progress</h3>
            <p className="type-small text-text-secondary">
              Deletes your saved sessions, weak topics and created trainings on this device. Your
              direction and uploaded files stay.
            </p>
          </div>
          <div className="-ml-3">
            <Button variant="tertiary" onClick={onAskReset}>
              Reset progress
            </Button>
          </div>
          {resetDone && (
            <p role="status" className="type-small">
              Progress reset. Your sessions, weak topics and created trainings are deleted.
            </p>
          )}
        </div>
      </section>

      <FooterNote />

      {(confirming || !dialogInline) && (
        <ConfirmDialog
          open={confirming}
          inline={dialogInline}
          title="Reset progress?"
          description="This deletes your saved sessions, weak topics and created trainings on this device. It cannot be undone."
          confirmLabel="Reset progress"
          onConfirm={onReset}
          onCancel={onCancelReset}
        />
      )}
    </div>
  );
}
