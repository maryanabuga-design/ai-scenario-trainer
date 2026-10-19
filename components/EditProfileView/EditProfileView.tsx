"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { TextField } from "@/components/TextField/TextField";
import { validateName } from "@/lib/auth-validation";
import { roleLabel } from "@/lib/role";
import type { Role } from "@/lib/role";
import { initialOf } from "@/lib/user";

export const EMAIL_HELPER = "Email changes need verification and are not available in this demo.";
export const ROLE_HELPER =
  "Your role is set by your organisation. Use Demo mode in Profile to switch.";

/**
 * Edit profile: the avatar with the initial (no photo), the editable name, the read-only email and
 * role, and a Primary "Save changes" pinned to the bottom that stays disabled until the name has
 * really changed. After saving, "Saved" is announced and the person returns to Profile.
 */
export function EditProfileView({
  account,
  onSave,
  saved = false,
}: {
  account: { name: string; email: string; role: Role };
  onSave: (name: string) => void;
  /** Shows the "Saved" confirmation (set by the screen while it returns to Profile). */
  saved?: boolean;
}) {
  const [name, setName] = useState(account.name);
  const [touched, setTouched] = useState(false);
  const error = touched ? validateName(name) : null;
  const changed = name.trim() !== account.name && validateName(name) === null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (changed) onSave(name.trim());
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]"
    >
      <CircleBackButton href="/profile" label="Back to Profile" />
      <h1 className="type-page-title">Edit profile</h1>
      <span
        aria-hidden="true"
        data-avatar
        className="type-card-title flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-olive-tint text-primary"
      >
        {initialOf(name || account.name)}
      </span>
      <TextField
        label="Full name"
        name="name"
        value={name}
        onChange={setName}
        onBlur={() => setTouched(true)}
        error={error}
        autoComplete="name"
      />
      <TextField
        label="Work email"
        name="email"
        type="email"
        value={account.email}
        readOnly
        helper={EMAIL_HELPER}
      />
      <div className="flex flex-col">
        <p className="type-body-strong mb-1.5">Role</p>
        <p data-role-value className="type-body">
          {roleLabel[account.role]}
        </p>
        <p className="type-small mt-1.5 text-text-secondary">{ROLE_HELPER}</p>
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-2">
        <p role="status" aria-live="polite" className="type-small text-center">
          {saved ? "Saved" : ""}
        </p>
        <Button type="submit" disabled={!changed || saved}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
