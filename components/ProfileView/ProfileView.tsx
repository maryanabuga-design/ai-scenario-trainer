"use client";

import { Button } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { DirectionPicker } from "@/components/DirectionPicker/DirectionPicker";

export function ProfileView({
  direction,
  onDirectionChange,
  confirming,
  onAskReset,
  onCancelReset,
  onReset,
  resetDone,
  dialogInline = false,
}: {
  direction: string;
  onDirectionChange: (id: string) => void;
  confirming: boolean;
  onAskReset: () => void;
  onCancelReset: () => void;
  onReset: () => void;
  resetDone: boolean;
  dialogInline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-2xl">Profile</h1>

      <DirectionPicker value={direction} onChange={onDirectionChange} legend="Direction" />

      <section aria-labelledby="settings-title" className="flex flex-col gap-3">
        <h2 id="settings-title" className="font-medium">
          Settings
        </h2>
        <div className="flex flex-col gap-3 rounded-card bg-surface p-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-medium">Reset progress</h3>
            <p className="text-sm text-text-secondary">
              Deletes your saved sessions, weak topics and created trainings on this device. Your
              direction and uploaded files stay.
            </p>
          </div>
          <div>
            <Button variant="secondary" onClick={onAskReset}>
              Reset progress
            </Button>
          </div>
          {resetDone && (
            <p role="status" className="text-sm">
              Progress reset. Your sessions, weak topics and created trainings are deleted.
            </p>
          )}
        </div>
      </section>

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
