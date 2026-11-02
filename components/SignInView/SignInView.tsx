"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { ENTRY_PICTURES, EntryPicture } from "@/components/EntryPicture/EntryPicture";
import { FormHeader } from "@/components/FormHeader/FormHeader";
import { TextField } from "@/components/TextField/TextField";
import { INACTIVE_MESSAGE, UNKNOWN_MESSAGE, validateEmail } from "@/lib/auth-validation";

/**
 * Sign in (DESIGN.md: Sign-in rules, wording and demo accounts): the work email and a Primary
 * "Continue" pinned to the bottom, with "Have a group code?" once under it. An email with no account
 * or with a deactivated account says so in the field's message (no code is sent).
 */
export function SignInView({
  initialEmail = "",
  onSubmit,
  initialProblem = null,
  initialTouched = false,
}: {
  initialEmail?: string;
  /** Only for the screen review page: start with the unknown or deactivated message showing. */
  initialProblem?: "unknown" | "inactive" | null;
  /** Only for the screen review page: start with the address check showing. */
  initialTouched?: boolean;
  onSubmit: (email: string) => "ok" | "unknown" | "inactive";
}) {
  const [email, setEmail] = useState(initialEmail);
  const [touched, setTouched] = useState(initialTouched);
  const [problem, setProblem] = useState<"unknown" | "inactive" | null>(initialProblem);
  const formatError = touched ? validateEmail(email) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (validateEmail(email)) return;
    const result = onSubmit(email);
    setProblem(result === "ok" ? null : result);
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]"
    >
      <FormHeader step={1} />
      <div className="flex flex-col gap-2">
        <EntryPicture src={ENTRY_PICTURES.signIn} />
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
          setProblem(null);
          setEmail(next);
        }}
        onBlur={() => setTouched(true)}
        error={
          formatError ??
          (problem === "unknown"
            ? UNKNOWN_MESSAGE
            : problem === "inactive"
              ? INACTIVE_MESSAGE
              : null)
        }
        autoComplete="email"
      />
      <div className="mt-auto flex flex-col items-center gap-1 pt-2">
        <Button type="submit">Continue</Button>
        <ButtonLink variant="tertiary" href="/join">
          Have a group code?
        </ButtonLink>
      </div>
    </form>
  );
}
