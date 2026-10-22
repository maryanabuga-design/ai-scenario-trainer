"use client";

import { Clock, Copy, Link2, Send, UsersRound } from "lucide-react";
import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Amber } from "@/components/InstructorContent/Amber";
import { InitialsAvatar } from "@/components/InstructorStudents/StudentRow";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { LucideTile } from "@/components/TopicTile/TopicTile";
import { DEMO_NOTE } from "@/lib/cohort";
import { copyText } from "@/lib/clipboard";
import { ALL_GROUPS, groupById, groups } from "@/lib/groups";
import type { Scope } from "@/lib/groups";
import {
  PROTOTYPE_LINE,
  invalidLine,
  inviteLink,
  invitedLine,
  parseEmails,
  pendingOf,
  splitNew,
} from "@/lib/invitations";
import type { Invitation } from "@/lib/invitations";
import { studentsCount } from "@/lib/overview";

const card =
  "flex flex-col gap-3 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)]";

/**
 * Invite students (DESIGN.md: Instructor, Students rebuilt): the group of the invitation in a small
 * sand card (asked first in All groups), GROUP CODE, INVITE LINK, INVITE BY EMAIL and PENDING
 * INVITATIONS (n). Pinned: Primary "Send invitations" (disabled until a valid new address) above
 * Secondary "Cancel". Nothing is sent: this is a simulation.
 */
export function InviteView({
  scope,
  counts,
  invitations,
  origin,
  onSend,
  onCancel,
  initialText = "",
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
  /** Only for the screen review page. */
  initialText?: string;
}) {
  const [chosen, setChosen] = useState<string | null>(scope === ALL_GROUPS ? null : scope);
  const group = chosen ? groupById(chosen) : undefined;
  const [text, setText] = useState(initialText);
  const [message, setMessage] = useState("");
  const { valid, invalid } = parseEmails(text);
  const pending = group ? pendingOf(invitations, group.id) : [];
  const { fresh, duplicates } = splitNew(
    valid,
    invitations.filter((entry) => entry.groupId === group?.id),
  );
  const link = group ? inviteLink(group.code, origin) : "";

  async function copy(value: string, done: string) {
    const ok = await copyText(value);
    setMessage(ok ? done : "Copying is not available here. Select the text and copy it.");
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Invite students"
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
              className="flex items-center gap-3 rounded-card border border-selectable-stroke bg-secondary-sand p-[var(--gutter,1rem)]"
            >
              <LucideTile icon={UsersRound} size="tile" />
              <p className="type-body-strong min-w-0 truncate">
                {group.name} · {studentsCount(counts[group.id] ?? 0)}
              </p>
            </div>
          )}

          <section aria-labelledby="code-label" className="flex flex-col gap-3">
            <h2 id="code-label" className="type-label text-text-secondary">
              GROUP CODE
            </h2>
            <div className={card}>
              <p data-group-code className="type-code tabular-nums">
                {group.code}
              </p>
            </div>
            <Button
              variant="secondary"
              icon={Copy}
              onClick={() => void copy(group.code, "Code copied")}
            >
              Copy code
            </Button>
          </section>

          <section aria-labelledby="link-label" className="flex flex-col gap-3">
            <h2 id="link-label" className="type-label text-text-secondary">
              INVITE LINK
            </h2>
            <input
              aria-labelledby="link-label"
              name="invite-link"
              readOnly
              value={link}
              className="type-small h-[52px] w-full truncate rounded-[14px] border border-secondary-sand-pressed bg-secondary-sand px-[var(--gutter,1rem)] text-text-secondary"
            />
            <Button variant="secondary" icon={Link2} onClick={() => void copy(link, "Link copied")}>
              Copy link
            </Button>
          </section>

          <section aria-labelledby="email-label" className="flex flex-col gap-3">
            <h2 id="email-label" className="type-label text-text-secondary">
              INVITE BY EMAIL
            </h2>
            <div className={card}>
              <textarea
                aria-labelledby="email-label"
                name="emails"
                rows={3}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setMessage("");
                }}
                placeholder="name@example.com, name2@example.com"
                className="type-body min-h-24 w-full rounded-[14px] border border-selectable-stroke bg-bg px-[var(--gutter,1rem)] py-3 text-text placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
              />
              <p className="type-small text-text-secondary">
                Separate addresses with commas or new lines.
              </p>
              {invalid.length > 0 && <Amber>{invalidLine(invalid)}</Amber>}
              {duplicates.length > 0 && (
                <p data-duplicates className="type-small text-text-secondary">
                  {duplicates.length === 1
                    ? "1 address is already invited and will be ignored."
                    : `${duplicates.length} addresses are already invited and will be ignored.`}
                </p>
              )}
            </div>
          </section>

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

      <p data-prototype-line className="type-small text-center text-text-secondary">
        {PROTOTYPE_LINE}
      </p>
      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>

      <ActionBar>
        <Button
          icon={Send}
          disabled={!group || fresh.length === 0}
          onClick={() => {
            onSend(fresh, group!.id);
            setText("");
            setMessage(
              fresh.length === 1 ? "1 invitation added" : `${fresh.length} invitations added`,
            );
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
