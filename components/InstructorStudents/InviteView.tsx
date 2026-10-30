"use client";

import { Clock, Send, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { FlashNotice } from "@/components/FlashNotice/FlashNotice";
import { CopyField } from "@/components/InstructorStudents/CopyField";
import { RecipientField } from "@/components/InstructorStudents/RecipientField";
import type { Recipient } from "@/components/InstructorStudents/RecipientField";
import { InitialsAvatar } from "@/components/InstructorStudents/StudentRow";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { LucideTile } from "@/components/TopicTile/TopicTile";
import { copyText } from "@/lib/clipboard";
import { ALL_GROUPS, groupById, groups } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import { setFlash } from "@/lib/flash";
import { inviteLink, invitedLine, pendingOf } from "@/lib/invitations";
import type { Invitation } from "@/lib/invitations";
import { studentsCount } from "@/lib/overview";

/**
 * Invite students (DESIGN.md: Instructor, Invite students redesign): the group of the invitation in
 * a white card (asked first in All groups), GROUP CODE and INVITE LINK (read-only fields with a copy
 * icon inside), INVITE BY EMAIL (a combobox with recipient tags) and PENDING INVITATIONS (n).
 * Pinned: Primary "Send invitations" (disabled until there is a recipient) above Secondary
 * "Cancel". Nothing is sent: this is a simulation.
 */
export function InviteView({
  scope,
  counts,
  invitations,
  origin,
  onSend,
  onCancel,
  initialRecipients = [],
  initialText = "",
  initialError = "",
}: {
  /** "all" asks which group first; otherwise the group is the selected one. */
  scope: Scope;
  /** The number of students of each group id. */
  counts: Record<string, number>;
  /** Every invitation (the pending list shows those of the group that are not joined). */
  invitations: Invitation[];
  /** The site address the invite link starts with. */
  origin: string;
  /** The new addresses (valid, not invited yet) and the group they are invited to. */
  onSend: (emails: string[], groupId: string) => void;
  onCancel: () => void;
  /** Only for the screen review page: people already added as tags. */
  initialRecipients?: Recipient[];
  initialText?: string;
  initialError?: string;
}) {
  const [chosen, setChosen] = useState<string | null>(scope === ALL_GROUPS ? null : scope);
  const group = chosen ? groupById(chosen) : undefined;
  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
  const [message, setMessage] = useState("");
  const pathname = usePathname();
  const pending = group ? pendingOf(invitations, group.id) : [];
  const invitedEmails = invitations
    .filter((entry) => entry.groupId === group?.id)
    .map((entry) => entry.email);
  const link = group ? inviteLink(group.code, origin) : "";

  /** Copies and confirms with the floating notice; false (and a plain line) when copying fails. */
  async function copy(value: string, done: string) {
    const ok = await copyText(value);
    if (ok) {
      setMessage("");
      setFlash(done, pathname);
    } else setMessage("Copying is not available here. Select the text and copy it.");
    return ok;
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <FlashNotice />
      <PageHeaderBand
        title="Invite students"
        helper="Share the group code or link, or invite students by email."
        back={{ label: "Back to Students", href: "/instructor/students" }}
      />
      <p role="status" data-message className="type-body text-center not-empty:py-1">
        {message}
      </p>

      {scope === ALL_GROUPS && (
        <section aria-labelledby="group-label" className="flex flex-col gap-3">
          <h2 id="group-label" className="type-label text-text-secondary">
            GROUP
          </h2>
          <fieldset
            role="radiogroup"
            aria-labelledby="group-label"
            className="flex min-w-0 flex-col gap-2"
          >
            {groups.map((entry) => (
              <SelectableRow
                key={entry.id}
                name="invite-group"
                value={entry.id}
                compact
                checked={chosen === entry.id}
                onChange={() => {
                  setChosen(entry.id);
                  setMessage("");
                }}
              >
                <span className="type-body-strong truncate">{entry.name}</span>
              </SelectableRow>
            ))}
          </fieldset>
          {!group && (
            <p data-choose-group className="type-small text-text-secondary">
              Choose a group to see its code and invite link.
            </p>
          )}
        </section>
      )}

      {group && (
        <>
          {scope !== ALL_GROUPS && (
            <div
              data-invite-group
              className="flex items-center gap-3 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)]"
            >
              <LucideTile icon={UsersRound} size="tile" />
              <p className="type-body-strong min-w-0 truncate">
                {group.name} · {studentsCount(counts[group.id] ?? 0)}
              </p>
            </div>
          )}

          <CopyField
            label="GROUP CODE"
            name="group-code"
            value={group.code}
            valueAttr="data-group-code"
            copyLabel="Copy group code"
            onCopy={() => copy(group.code, "Code copied")}
          />

          <CopyField
            label="INVITE LINK"
            name="invite-link"
            value={link}
            valueAttr="data-invite-link"
            copyLabel="Copy invite link"
            onCopy={() => copy(link, "Link copied")}
          />

          <RecipientField
            recipients={recipients}
            invited={invitedEmails}
            onChange={setRecipients}
            initialText={initialText}
            initialError={initialError}
          />

          {pending.length > 0 && (
            <section aria-labelledby="pending-label" className="flex flex-col gap-3">
              <h2 id="pending-label" className="type-label text-text-secondary">
                PENDING INVITATIONS ({pending.length})
              </h2>
              <ul className="divide-y divide-soft-divider overflow-hidden rounded-card border border-selectable-stroke bg-card">
                {pending.map((entry) => (
                  <li
                    key={entry.email}
                    data-pending={entry.email}
                    className="flex h-[72px] items-center gap-3 px-[var(--gutter,1rem)]"
                  >
                    <InitialsAvatar initials={entry.email.slice(0, 2).toUpperCase()} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="type-body-strong truncate">{entry.email}</span>
                      <span className="type-small truncate text-text-secondary">
                        {invitedLine(entry.invitedAt)}
                      </span>
                    </span>
                    <span
                      data-pending-pill
                      className="type-caption inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary-sand px-2.5 py-0.5 whitespace-nowrap text-text-secondary"
                    >
                      <Clock size={12} strokeWidth={2.25} aria-hidden="true" />
                      Pending
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <ActionBar>
        <Button
          icon={Send}
          disabled={!group || recipients.length === 0}
          onClick={() => {
            onSend(
              recipients.map((entry) => entry.email),
              group!.id,
            );
            setRecipients([]);
          }}
        >
          Send invitations
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </ActionBar>
    </div>
  );
}
