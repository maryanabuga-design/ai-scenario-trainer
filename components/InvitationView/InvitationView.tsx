"use client";

import { UsersRound } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { IconTile } from "@/components/IconTile/IconTile";
import { TextField } from "@/components/TextField/TextField";
import { EXISTS_LINK, EXISTS_MESSAGE, validateEmail } from "@/lib/auth-validation";

/** The four states of the invitation (DESIGN.md: Invitation-only entry). */
export type InvitationState = "new" | "can-join" | "member" | "invalid";

export const INVALID_TITLE = "This link is no longer valid";
export const INVALID_SUBTITLE = "Ask your instructor for a new one.";
export const EMAIL_NOTE = "We will send you a code to confirm it.";

/**
 * The invitation (DESIGN.md: Invitation-only entry), opened by `/join/<code>` or from the group code
 * screen. A white card: a round icon, "You are invited to", the group name and two muted lines. Then:
 * a new student gives an email (Continue); a signed-in student who is not in the group confirms with
 * "Join group" or leaves with "Not now"; a member sees "You are already in ..." and "Open group"; a
 * link that is not valid says so, with "Back to start". Nothing is sent and joining always asks.
 */
export function InvitationView({
  state,
  groupName = "",
  invitedBy = "",
  onEmail,
  onJoin,
  notNowHref,
  openHref,
  startHref,
  initialEmail = "",
  initialTouched = false,
}: {
  state: InvitationState;
  groupName?: string;
  invitedBy?: string;
  /** A new student: sends the email on to the code check; "exists" shows the message. */
  onEmail?: (email: string) => "ok" | "exists";
  onJoin?: () => void;
  notNowHref?: string;
  openHref?: string;
  /** Where "Back to start" goes (Welcome, or Home when signed in). */
  startHref: string;
  initialEmail?: string;
  /** Only for the screen review page: start with the email error showing. */
  initialTouched?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState(initialTouched);
  const [exists, setExists] = useState(false);
  const emailError = touched ? validateEmail(email) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (validateEmail(email)) return;
    setExists(onEmail?.(email) === "exists");
  }

  if (state === "invalid") {
    return (
      <div
        data-invitation="invalid"
        className="flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]"
      >
        <div className="flex flex-col gap-2 pt-2">
          <h1 className="type-page-title">{INVALID_TITLE}</h1>
          <p className="type-body text-text-secondary">{INVALID_SUBTITLE}</p>
        </div>
        <div className="mt-auto flex flex-col gap-3 pt-2">
          <ButtonLink variant="secondary" href={startHref}>
            Back to start
          </ButtonLink>
        </div>
      </div>
    );
  }

  const card = (
    <div
      data-invitation-card
      className="flex flex-col items-center gap-3 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)] text-center shadow-(--card-shadow)"
    >
      <IconTile className="h-14 w-14 rounded-full">
        <UsersRound size={28} strokeWidth={1.75} />
      </IconTile>
      {state === "member" ? (
        <h1 data-invitation-title className="type-page-title">
          You are already in {groupName}
        </h1>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="type-small text-text-secondary">You are invited to</p>
          <h1 data-invitation-title className="type-page-title">
            {groupName}
          </h1>
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <p className="type-body text-text-secondary">Role: Student</p>
        <p className="type-body text-text-secondary">Invited by {invitedBy}</p>
      </div>
    </div>
  );

  const shell =
    "flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]";

  if (state === "new") {
    return (
      <form data-invitation="new" noValidate onSubmit={submit} className={shell}>
        {card}
        <TextField
          label="Your email"
          name="email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(next) => {
            setExists(false);
            setEmail(next);
          }}
          onBlur={() => setTouched(true)}
          error={emailError ?? (exists ? EXISTS_MESSAGE : null)}
          action={
            exists && !emailError ? (
              <ButtonLink variant="tertiary" href="/sign-in">
                {EXISTS_LINK}
              </ButtonLink>
            ) : undefined
          }
          helper={EMAIL_NOTE}
          autoComplete="email"
        />
        <div className="mt-auto flex flex-col gap-3 pt-2">
          <Button type="submit">Continue</Button>
        </div>
      </form>
    );
  }

  return (
    <div data-invitation={state} className={shell}>
      {card}
      <div className="mt-auto flex flex-col gap-3 pt-2">
        {state === "can-join" ? (
          <>
            <Button onClick={onJoin}>Join group</Button>
            <ButtonLink variant="secondary" href={notNowHref ?? startHref}>
              Not now
            </ButtonLink>
          </>
        ) : (
          <ButtonLink href={openHref ?? startHref}>Open group</ButtonLink>
        )}
      </div>
    </div>
  );
}
