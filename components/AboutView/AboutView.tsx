"use client";

import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import pkg from "@/package.json";

/** The four lines of "About this prototype". The version is the one in package.json. */
export const aboutLines = [
  "Your progress is saved on this device only.",
  "AI answers are prepared examples; there is no live AI model.",
  "All content is educational.",
  `Version ${pkg.version}`,
];

export const RESTART_HELPER =
  "Clears all demo data on this device (accounts, progress, exams, notifications) and starts from the beginning.";
export const RESTART_TITLE = "Restart the demo?";
export const RESTART_TEXT =
  "This deletes all demo data on this device and returns to the welcome screen.";

/**
 * About this prototype: four plain lines and "Restart demo" with its confirmation (DESIGN.md:
 * Accounts, roles and Profile; Restart demo). Restart deletes EVERYTHING; Reset progress and Sign
 * out on Profile do less.
 */
export function AboutView({
  confirming = false,
  onAskRestart = () => undefined,
  onCancel = () => undefined,
  onRestart = () => undefined,
  dialogInline = false,
}: {
  confirming?: boolean;
  onAskRestart?: () => void;
  onCancel?: () => void;
  onRestart?: () => void;
  /** Only for the screen review page: draw the dialog over its frame. */
  dialogInline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <CircleBackButton href="/profile" label="Back to Profile" />
      <h1 className="type-page-title">About this prototype</h1>
      <ul className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-(--card-shadow)">
        {aboutLines.map((line) => (
          <li key={line} className="type-body">
            {line}
          </li>
        ))}
      </ul>
      <section aria-label="Restart demo" className="flex flex-col gap-3">
        <p className="type-small text-text-secondary">{RESTART_HELPER}</p>
        <Button variant="secondary" onClick={onAskRestart}>
          Restart demo
        </Button>
      </section>
      {(confirming || !dialogInline) && (
        <ConfirmDialog
          open={confirming}
          inline={dialogInline}
          title={RESTART_TITLE}
          description={RESTART_TEXT}
          confirmLabel="Restart"
          onConfirm={onRestart}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}
