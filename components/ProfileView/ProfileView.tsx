"use client";

import { CircleHelp, Info, LogOut, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { DirectionPicker } from "@/components/DirectionPicker/DirectionPicker";
import { FooterNote } from "@/components/Footer/Footer";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { GROUP_NAME } from "@/lib/cohort";
import { onboardingHref } from "@/lib/onboarding";
import { ROLES, roleLabel } from "@/lib/role";
import type { Role } from "@/lib/role";
import { initialOf } from "@/lib/user";

export const DEMO_HELPER =
  "Demo only. In the real product your role comes from your organisation account.";

/** The bare 24px icon on the left of a Profile row, no tile behind it (DESIGN.md: Sand scale, touch fixes and Profile icons). */
function RowIcon({ icon: Icon, destructive = false }: { icon: LucideIcon; destructive?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-6 w-6 shrink-0 items-center justify-center ${destructive ? "text-wrong" : "text-neutral-tile-ink"}`}
    >
      <Icon size={24} strokeWidth={1.75} />
    </span>
  );
}

const rowClass =
  "flex min-h-16 items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2";

/**
 * Profile (DESIGN.md: Roles and Profile): the user card with the role label, the demo role switch,
 * Direction and Reset progress (students only) and the Help rows.
 */
export function ProfileView({
  account,
  onRoleChange,
  direction,
  onDirectionChange,
  dialog,
  onAskReset,
  onAskDelete,
  onCancelDialog,
  onReset,
  onDelete,
  onSignOut,
  resetDone,
  dialogInline = false,
  backHref,
  certificates = 0,
}: {
  account: { name: string; email: string; role: Role };
  onRoleChange: (role: Role) => void;
  direction: string;
  onDirectionChange: (id: string) => void;
  /** The confirmation that is open, if any. */
  dialog: "reset" | "delete" | null;
  onAskReset: () => void;
  onAskDelete: () => void;
  onCancelDialog: () => void;
  onReset: () => void;
  onDelete: () => void;
  onSignOut: () => void;
  resetDone: boolean;
  dialogInline?: boolean;
  /** Back on Profile always goes to the Home of the role (never the browser history). */
  backHref?: string;
  /** The number of certificates (a Student's row "Certificates"). */
  certificates?: number;
}) {
  const { role } = account;
  const student = role === "student";
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderBand
        title="Profile"
        subtitle="Your account and settings"
        back={backHref ? { label: "Back to Home", href: backHref } : undefined}
      />
      <div className="flex flex-col gap-8">
        <Link href="/profile/edit" data-user-card className={rowClass}>
          <span
            aria-hidden="true"
            className="type-body-strong flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-olive-tint text-primary"
          >
            {initialOf(account.name)}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span data-user-name className="type-body-strong truncate">
              {account.name}
            </span>
            <span data-user-email className="type-small truncate text-text-secondary">
              {account.email}
            </span>
            <span data-role-label className="type-small text-text-secondary">
              {roleLabel[role]}
            </span>
          </span>
          <Chevron />
        </Link>

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

        {student && (
          <Link
            href="/profile/certificates"
            data-certificates-row
            className="flex h-14 items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow) has-focus-visible:outline-2"
          >
            <span className="type-body-strong min-w-0 flex-1">Certificates</span>
            <span data-certificates-count className="type-body text-text-secondary tabular-nums">
              {certificates}
            </span>
            <Chevron />
          </Link>
        )}

        {!student && (
          <div
            data-group-row
            className="flex h-14 items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow)"
          >
            <span className="type-body-strong min-w-0 flex-1">Group</span>
            <span data-group-name className="type-body text-text-secondary">
              {GROUP_NAME}
            </span>
          </div>
        )}

        <section aria-labelledby="help-title" className="flex flex-col gap-3">
          <h2 id="help-title" className="type-body-strong">
            Help
          </h2>
          <Link href={onboardingHref} className={rowClass}>
            <RowIcon icon={CircleHelp} />
            <span className="type-body-strong min-w-0 flex-1">How the app works</span>
            <Chevron />
          </Link>
          <Link href="/about" className={rowClass}>
            <RowIcon icon={Info} />
            <span className="type-body-strong min-w-0 flex-1">About this prototype</span>
            <Chevron />
          </Link>
        </section>

        <section aria-labelledby="settings-title" className="flex flex-col gap-3">
          <h2 id="settings-title" className="type-body-strong">
            Settings
          </h2>
          {student && (
            <div className="flex flex-col gap-3 rounded-card bg-card shadow-(--card-shadow) p-4">
              <div className="flex flex-col gap-1">
                <h3 className="type-body-strong">Reset progress</h3>
                <p className="type-small text-text-secondary">
                  Deletes your saved sessions, weak topics and created trainings on this device.
                  Your direction and uploaded files stay.
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
          )}
          <button
            type="button"
            data-delete-account
            onClick={onAskDelete}
            className={`${rowClass} min-h-14 w-full text-left`}
          >
            <RowIcon icon={Trash2} destructive />
            <span className="type-body-strong min-w-0 flex-1 text-wrong">Delete account</span>
          </button>
          <button
            type="button"
            data-sign-out
            onClick={onSignOut}
            className={`${rowClass} min-h-14 w-full text-left`}
          >
            <RowIcon icon={LogOut} />
            <span className="type-body-strong min-w-0 flex-1">Sign out</span>
          </button>
        </section>

        <FooterNote />

        {(dialog === "reset" || !dialogInline) && student && (
          <ConfirmDialog
            open={dialog === "reset"}
            inline={dialogInline}
            title="Reset progress?"
            description="This deletes your saved sessions, weak topics and created trainings on this device. It cannot be undone."
            confirmLabel="Reset progress"
            onConfirm={onReset}
            onCancel={onCancelDialog}
          />
        )}
        {(dialog === "delete" || !dialogInline) && (
          <ConfirmDialog
            open={dialog === "delete"}
            inline={dialogInline}
            title="Delete account?"
            description="Delete this account and its progress from this device? This cannot be undone."
            confirmLabel="Delete"
            onConfirm={onDelete}
            onCancel={onCancelDialog}
          />
        )}
      </div>
    </div>
  );
}
