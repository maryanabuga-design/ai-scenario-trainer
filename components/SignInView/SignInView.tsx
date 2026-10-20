"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { FormHeader } from "@/components/FormHeader/FormHeader";
import { TextField } from "@/components/TextField/TextField";
import { UNKNOWN_LINK, UNKNOWN_MESSAGE, validateEmail } from "@/lib/auth-validation";

/**
 * Sign in: the work email and a Primary "Continue" pinned to the bottom. An email with no account
 * on this device says so, with a link to Create account.
 */
export function SignInView({
  initialEmail = "",
  onSubmit,
  initialUnknown = false,
}: {
  initialEmail?: string;
  /** Only for the screen review page: start with the unknown-email message showing. */
  initialUnknown?: boolean;
  onSubmit: (email: string) => "ok" | "unknown";
}) {
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState(false);
  const [unknown, setUnknown] = useState(initialUnknown);
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
      <FormHeader step={1} />
      <div className="flex flex-col gap-2">
        <h1 className="type-page-title">Welcome back</h1>
        <p className="type-body text-text-secondary">
          Enter your work email. We will send you a code.
        </p>
      </div>
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
      <div className="mt-auto flex flex-col items-center gap-1 pt-2">
        <Button type="submit">Continue</Button>
        <ButtonLink variant="tertiary" href="/sign-up">
          New here? Create an account
        </ButtonLink>
      </div>
    </form>
  );
}
