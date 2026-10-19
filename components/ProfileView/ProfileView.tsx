"use client";

import Link from "next/link";
import { Button } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { DirectionPicker } from "@/components/DirectionPicker/DirectionPicker";
import { FooterNote } from "@/components/Footer/Footer";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { onboardingHref } from "@/lib/onboarding";
import { ROLES, roleLabel } from "@/lib/role";
import type { Role } from "@/lib/role";
import { DEMO_USER } from "@/lib/user";

export const DEMO_HELPER =
  "Demo only. In the real product your role comes from your organisation account.";

const rowClass =
  "flex min-h-16 items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2";

/**
 * Profile (DESIGN.md: Roles and Profile): the user card with the role label, the demo role switch,
 * Direction and Reset progress (students only) and the Help rows.
 */
export function ProfileView({
  role,
  onRoleChange,
  direction,
  onDirectionChange,
  confirming,
  onAskReset,
  onCancelReset,
  onReset,
  resetDone,
  dialogInline = false,
}: {
  role: Role;
  onRoleChange: (role: Role) => void;
  direction: string;
  onDirectionChange: (id: string) => void;
  confirming: boolean;
  onAskReset: () => void;
  onCancelReset: () => void;
  onReset: () => void;
  resetDone: boolean;
  dialogInline?: boolean;
}) {
  const student = role === "student";
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
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="type-body-strong">{DEMO_USER.name}</span>
          <span data-role-label className="type-small text-text-secondary">
            {roleLabel[role]}
          </span>
          {DEMO_USER.email && (
            <span className="type-small truncate text-text-secondary">{DEMO_USER.email}</span>
          )}
        </span>
      </div>

      <section aria-labelledby="demo-title" className="flex flex-col gap-3">
        <h2 id="demo-title" className="type-body-strong">
          Demo mode
        </h2>
        <SegmentedControl
          name="role"
          legend="Switch role (demo)"
          options={ROLES.map((value) => ({ value, label: roleLabel[value] }))}
          value={role}
          onChange={onRoleChange}
        />
        <p className="type-small text-text-secondary">{DEMO_HELPER}</p>
      </section>

      {student && (
        <DirectionPicker value={direction} onChange={onDirectionChange} legend="Direction" />
      )}

      <section aria-labelledby="help-title" className="flex flex-col gap-3">
        <h2 id="help-title" className="type-body-strong">
          Help
        </h2>
        <Link href={onboardingHref} className={rowClass}>
          <span className="type-body-strong min-w-0 flex-1">How the app works</span>
          <Chevron />
        </Link>
        <Link href="/about" className={rowClass}>
          <span className="type-body-strong min-w-0 flex-1">About this prototype</span>
          <Chevron />
        </Link>
      </section>

      {student && (
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
      )}

      <FooterNote />

      {student && (confirming || !dialogInline) && (
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
