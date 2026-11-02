"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button/Button";
import { ENTRY_PICTURES, EntryPicture } from "@/components/EntryPicture/EntryPicture";
import { TextField } from "@/components/TextField/TextField";
import { validateName } from "@/lib/auth-validation";

/**
 * Profile of a new student (DESIGN.md: Entry pictures and no language choice): the picture, "Your
 * profile", "Add your name so your instructor can recognise you.", ONE field "Your name" and the
 * Primary "Continue", which creates the student in the group. There is no language choice until the
 * app is translated.
 */
export function ProfileSetupView({
  initialName = "",
  onSubmit,
  initialTouched = false,
}: {
  initialName?: string;
  onSubmit: (input: { name: string }) => void;
  /** Only for the screen review page: start with the error showing. */
  initialTouched?: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [touched, setTouched] = useState(initialTouched);
  const form = useRef<HTMLFormElement>(null);
  const error = touched ? validateName(name) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (validateName(name)) {
      form.current?.querySelector<HTMLInputElement>("input[name=name]")?.focus();
      return;
    }
    onSubmit({ name: name.trim() });
  }

  return (
    <form
      ref={form}
      noValidate
      onSubmit={submit}
      className="flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]"
    >
      <div className="flex flex-col gap-2 pt-2">
        <EntryPicture src={ENTRY_PICTURES.profile} />
        <h1 className="type-page-title">Your profile</h1>
        <p className="type-body text-text-secondary">
          Add your name so your instructor can recognise you.
        </p>
      </div>
      <TextField
        label="Your name"
        name="name"
        value={name}
        onChange={setName}
        onBlur={() => setTouched(true)}
        error={error}
        autoComplete="name"
      />
      <div className="mt-auto flex flex-col gap-3 pt-2">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
