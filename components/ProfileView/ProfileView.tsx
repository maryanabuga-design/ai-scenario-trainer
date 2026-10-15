"use client";

import { Button } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { DirectionPicker } from "@/components/DirectionPicker/DirectionPicker";
import { FooterNote } from "@/components/Footer/Footer";
import { DEMO_USER } from "@/lib/user";

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
      <h1 className="type-page-title">Profile</h1>

      <div className="flex items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow)">
        <span
          aria-hidden="true"
          className="type-body-strong flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-olive-tint text-primary"
        >
          {DEMO_USER.name.charAt(0)}
        </span>
        <span className="type-body-strong">{DEMO_USER.name}</span>
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
