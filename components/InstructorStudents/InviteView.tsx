"use client";

import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { Amber } from "@/components/InstructorContent/Amber";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { TextField } from "@/components/TextField/TextField";
import { copyText } from "@/lib/clipboard";
import {
  GROUP_CODE,
  INVITE_LINK,
  PROTOTYPE_LINE,
  invalidLine,
  invitedLine,
  parseEmails,
  splitNew,
} from "@/lib/invitations";
import type { Invitation } from "@/lib/invitations";

/**
 * Invite students (DESIGN.md: Instructor, Invite students): the group code and the invite link with
 * their Secondary copy buttons, a textarea for addresses with live checking, and the pending list
 * (72px rows, no chevron). Pinned: Primary "Send invitations" (disabled until a new valid address
 * exists) and Secondary "Cancel". Nothing is sent: this is a simulation.
 */
export function InviteView({
  pending,
  onSend,
  onCancel,
  initialText = "",
}: {
  pending: Invitation[];
  /** The new addresses (valid, not invited yet). */
  onSend: (emails: string[]) => void;
  onCancel: () => void;
  /** Only for the screen review page. */
  initialText?: string;
}) {
  const [text, setText] = useState(initialText);
  const [message, setMessage] = useState("");
  const { valid, invalid } = parseEmails(text);
  const { fresh, duplicates } = splitNew(valid, pending);

  async function copy(value: string, done: string) {
    const ok = await copyText(value);
    setMessage(ok ? done : "Copying is not available here. Select the text and copy it.");
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title="Invite students"
        subtitle="Add people to your group"
        back={{ label: "Back to Students", href: "/instructor/students" }}
      />
      <p role="status" data-message className="type-body text-center not-empty:py-1">
        {message}
      </p>

      <section aria-labelledby="code-label" className="flex flex-col gap-3">
        <h2 id="code-label" className="type-label text-text-secondary">
          GROUP CODE
        </h2>
        <Card>
          <p data-group-code className="type-code tabular-nums">
            {GROUP_CODE}
          </p>
        </Card>
        <Button variant="secondary" onClick={() => void copy(GROUP_CODE, "Code copied")}>
          Copy code
        </Button>
      </section>

      <section aria-labelledby="link-label" className="flex flex-col gap-3">
        <h2 id="link-label" className="type-label text-text-secondary">
          INVITE LINK
        </h2>
        <TextField label="Invite link" hideLabel name="invite-link" value={INVITE_LINK} readOnly />
        <Button variant="secondary" onClick={() => void copy(INVITE_LINK, "Link copied")}>
          Copy link
        </Button>
      </section>

      <section aria-labelledby="email-label" className="flex flex-col gap-2">
        <h2 id="email-label" className="type-label text-text-secondary">
          INVITE BY EMAIL
        </h2>
        <textarea
          aria-labelledby="email-label"
          name="emails"
          rows={4}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setMessage("");
          }}
          placeholder="name@company.com, other@company.com"
          className="type-body min-h-28 w-full rounded-[14px] border border-selectable-stroke bg-card px-[var(--gutter,1rem)] py-3 text-text placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
        />
        <p className="type-small text-text-secondary">
          Separate addresses with commas, spaces or new lines.
        </p>
        {invalid.length > 0 && <Amber>{invalidLine(invalid)}</Amber>}
        {duplicates.length > 0 && (
          <p data-duplicates className="type-small text-text-secondary">
            {duplicates.length === 1
              ? "1 address is already invited and will be ignored."
              : `${duplicates.length} addresses are already invited and will be ignored.`}
          </p>
        )}
      </section>

      {pending.length > 0 && (
        <section aria-labelledby="pending-label" className="flex flex-col gap-3">
          <h2 id="pending-label" className="type-label text-text-secondary">
            PENDING INVITATIONS
          </h2>
          <ul className="flex flex-col gap-2">
            {pending.map((entry) => (
              <li
                key={entry.email}
                data-pending={entry.email}
                className="flex h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow)"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body-strong truncate">{entry.email}</span>
                  <span className="type-small truncate text-text-secondary">
                    {invitedLine(entry.invitedAt)} · Pending
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p data-prototype-line className="type-small text-center text-text-secondary">
        {PROTOTYPE_LINE}
      </p>

      <ActionBar>
        <Button
          disabled={fresh.length === 0}
          onClick={() => {
            onSend(fresh);
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
