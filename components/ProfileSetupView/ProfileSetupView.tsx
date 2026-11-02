"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button/Button";
import { SelectableRow } from "@/components/SelectableRow/SelectableRow";
import { TextField } from "@/components/TextField/TextField";
import { languages } from "@/lib/auth";
import type { Language } from "@/lib/auth";
import { validateName } from "@/lib/auth-validation";

/**
 * Profile of a new student (DESIGN.md: Invitation-only entry): "Your profile", "Two things and you
 * are in.", the fields "Your name" and "Language" (two single-choice cards) and the Primary
 * "Continue", which creates the student in the group.
 */
export function ProfileSetupView({
  initialName = "",
  initialLanguage = "en",
  onSubmit,
  initialTouched = false,
}: {
  initialName?: string;
  initialLanguage?: Language;
  onSubmit: (input: { name: string; language: Language }) => void;
  /** Only for the screen review page: start with the error showing. */
  initialTouched?: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [language, setLanguage] = useState<Language>(initialLanguage);
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
    onSubmit({ name: name.trim(), language });
  }

  return (
    <form
      ref={form}
      noValidate
      onSubmit={submit}
      className="flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]"
    >
      <div className="flex flex-col gap-2 pt-2">
        <h1 className="type-page-title">Your profile</h1>
        <p className="type-body text-text-secondary">Two things and you are in.</p>
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
      <fieldset className="flex flex-col gap-3">
        <legend className="type-small-strong mb-1.5">Language</legend>
        {languages.map((option) => (
          <SelectableRow
            key={option.value}
            name="language"
            value={option.value}
            checked={language === option.value}
            onChange={() => setLanguage(option.value)}
            emphasis
            short
          >
            <span className="type-body-strong">{option.label}</span>
          </SelectableRow>
        ))}
      </fieldset>
      <div className="mt-auto flex flex-col gap-3 pt-2">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
