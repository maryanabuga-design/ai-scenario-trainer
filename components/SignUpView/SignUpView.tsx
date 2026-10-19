"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { TextField } from "@/components/TextField/TextField";
import { EXISTS_LINK, EXISTS_MESSAGE, validateEmail, validateName } from "@/lib/auth-validation";
import { ROLES, roleLabel } from "@/lib/role";
import type { Role } from "@/lib/role";

export const DEMO_DATA_NOTE =
  "Demo: data stays on this device. Please do not enter real personal data.";

const roleHelper: Record<Role, string> = {
  student: "Learn, practise and take exams assigned to you",
  instructor: "Create exams and assign them to students",
};

export type SignUpValues = { name: string; email: string; role: Role };

/**
 * Create account: the fields, the role cards and a Primary "Continue" pinned to the bottom. Errors
 * show on submit and when a field loses focus. `onSubmit` returns "exists" when the email already
 * has an account on this device.
 */
export function SignUpView({
  initial = { name: "", email: "", role: "student" },
  onSubmit,
  initialTouched = false,
}: {
  initial?: SignUpValues;
  /** Only for the screen review page: start with the errors showing. */
  initialTouched?: boolean;
  onSubmit: (values: SignUpValues) => "ok" | "exists";
}) {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState({ name: initialTouched, email: initialTouched });
  const [exists, setExists] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const nameError = touched.name ? validateName(values.name) : null;
  const emailError = touched.email ? validateEmail(values.email) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched({ name: true, email: true });
    const problem = validateName(values.name)
      ? "name"
      : validateEmail(values.email)
        ? "email"
        : null;
    if (problem) {
      form.current?.querySelector<HTMLInputElement>(`input[name=${problem}]`)?.focus();
      return;
    }
    setExists(onSubmit(values) === "exists");
  }

  return (
    <form
      ref={form}
      noValidate
      onSubmit={submit}
      className="flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]"
    >
      <CircleBackButton href="/welcome" label="Back to Welcome" />
      <h1 className="type-page-title">Create account</h1>
      <TextField
        label="Full name"
        name="name"
        value={values.name}
        onChange={(name) => setValues({ ...values, name })}
        onBlur={() => setTouched((was) => ({ ...was, name: true }))}
        error={nameError}
        autoComplete="name"
      />
      <TextField
        label="Work email"
        name="email"
        type="email"
        inputMode="email"
        value={values.email}
        onChange={(email) => {
          setExists(false);
          setValues({ ...values, email });
        }}
        onBlur={() => setTouched((was) => ({ ...was, email: true }))}
        error={emailError ?? (exists ? EXISTS_MESSAGE : null)}
        action={
          exists && !emailError ? (
            <ButtonLink variant="tertiary" href="/sign-in">
              {EXISTS_LINK}
            </ButtonLink>
          ) : undefined
        }
        autoComplete="email"
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="type-body-strong mb-3">I am a</legend>
        {ROLES.map((role) => (
          <SelectableRow
            key={role}
            name="role"
            value={role}
            checked={values.role === role}
            onChange={() => setValues({ ...values, role })}
          >
            <span className="flex flex-col gap-0.5">
              <span className="type-body-strong">{roleLabel[role]}</span>
              <span className="type-small text-text-secondary">{roleHelper[role]}</span>
            </span>
          </SelectableRow>
        ))}
      </fieldset>
      <p className="type-small text-text-secondary">{DEMO_DATA_NOTE}</p>
      <div className="mt-auto pt-2">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
