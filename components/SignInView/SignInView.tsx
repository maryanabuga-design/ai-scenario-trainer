"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { TextField } from "@/components/TextField/TextField";
import { UNKNOWN_LINK, UNKNOWN_MESSAGE, validateEmail } from "@/lib/auth-validation";

/**
 * Sign in: the work email and a Primary "Continue" pinned to the bottom. An email with no account
 * on this device says so, with a link to Create account.
 */
export function SignInView({
  initialEmail = "",
  onSubmit,
}: {
  initialEmail?: string;
  onSubmit: (email: string) => "ok" | "unknown";
}) {
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState(false);
  const [unknown, setUnknown] = useState(false);
  const formatError = touched ? validateEmail(email) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (validateEmail(email)) return;
    setUnknown(onSubmit(email) === "unknown");
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]"
    >
      <CircleBackButton href="/welcome" label="Back to Welcome" />
      <h1 className="type-page-title">Sign in</h1>
      <TextField
        label="Work email"
        name="email"
        type="email"
        inputMode="email"
        value={email}
        onChange={(next) => {
          setUnknown(false);
          setEmail(next);
        }}
        onBlur={() => setTouched(true)}
        error={formatError ?? (unknown ? UNKNOWN_MESSAGE : null)}
        action={
          unknown && !formatError ? (
            <ButtonLink variant="tertiary" href="/sign-up">
              {UNKNOWN_LINK}
            </ButtonLink>
          ) : undefined
        }
        autoComplete="email"
      />
      <div className="mt-auto pt-2">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
